// src/components/ContaAtivaWidget.jsx
// Controle único de SESSÃO, na primeira linha da área de conteúdo, alinhado à
// direita (o FAB do Copilot fica no inferior direito — sem conflito). Reúne as
// duas identidades do app numa superfície elevada só: QUEM está logado
// (usuário) e EM QUAL CONTA está operando (conta ativa / User-Key).
//
// O chip MUDA DE FORMA conforme o estado da conta, mantendo sempre a mesma
// altura e o mesmo raio de pílula (o olho não perde a âncora):
//  - Sem conta: pílula só de contorno com ícone de chave + "Autenticar" (convite).
//  - Validando: pílula com spinner + "Validando…".
//  - Conta ativa: pílula preenchida com avatar da conta (iniciais + bolinha de
//    status), nome e linha de meta (ID da conta).
//
// O popover (o "modal do usuário") traz, de cima para baixo:
//  1. identidade do usuário logado — nome, e-mail, equipe e nível;
//  2. a conta ativa — logo, nome, ID, estado da credencial e as ações
//     Trocar conta / Encerrar conta ativa; sem conta, o formulário de
//     autenticação (UK mascarada + Validar + Confirmar);
//  3. ações do usuário — Histórico, Usuários e Sair do N1 App.
// Fecha em clique fora e em Esc.
//
// Atenção aos dois escopos de "sessão": "Encerrar conta ativa" derruba só a
// User-Key da conta; "Sair do N1 App" faz logout do usuário (useLogout).
//
// Segurança: a UK digitada fica mascarada, nunca é exibida no chip, no popover
// (nem os últimos dígitos) nem logada; o nome da conta é mostrado ANTES de
// confirmar (trava anti-conta-errada).
// Sem TTL: a sessão da conta ativa dura enquanto durar a sessão do app.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import { useAccountSession } from '../context/AccountSessionContext';
import { useUserProfile } from '../context/UserProfileContext';
import { getTeamLabel } from '../config/teamsConfig';
import { LEVEL_LABELS } from '../config/permissionsConfig';
import { validateAccount } from '../services/accountSessionService';
import useLogout from '../hooks/useLogout';
import getInitials from '../utils/initials';

const popIn = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: none; }
`;

const popOut = keyframes`
  from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(-6px) scale(0.98); }
`;

// Conteúdo do chip trocando de estado (Autenticar → Validando… → conta ativa).
const chipSwap = keyframes`
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: none; }
`;

// Duração do fecho do popover — o card só desmonta depois de terminar a saída.
const CARD_CLOSE_MS = 130;

// Duas situações:
//  - `$inline`: o widget foi portado para dentro do cabeçalho da página (ver
//    AccountControlSlotContext) e divide a linha do título — sem margem
//    própria, sem largura própria.
//  - fallback: página sem cabeçalho com slot; ocupa a primeira faixa do
//    conteúdo, alinhado à direita.
// `position: relative` em ambos os casos mantém o popover ancorado no chip, e
// o z-index garante que ele abra por cima do que vier depois.
const Anchor = styled.div`
  position: relative;
  z-index: 950;
  display: flex;
  justify-content: flex-end;
  ${({ $inline }) =>
    $inline
      ? css`
          flex: none;
        `
      : css`
          margin-bottom: 0.9rem;

          @media (max-width: 768px) {
            margin-bottom: 0.75rem;
          }
        `}
`;

// Mesma altura e mesmo raio em todos os estados; muda só o preenchimento e o
// conteúdo. `$on` = há conta ativa (pílula preenchida).
const Chip = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
  max-width: 280px;
  padding: ${({ $on }) => ($on ? '0 0.7rem 0 0.25rem' : '0 0.8rem')};
  border-radius: 999px;
  border: 1px solid ${({ $on, $dm }) => {
    if ($on) return $dm ? 'rgba(167,139,250,0.45)' : 'rgba(116,67,246,0.35)';
    return $dm ? '#3a2a5e' : '#d0c8f0';
  }};
  background: ${({ $on, $dm }) => {
    if ($on) return $dm ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.10)';
    return $dm ? 'rgba(23, 12, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)';
  }};
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, ${({ $dm }) => ($dm ? '0.35' : '0.10')});
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s,
    transform 0.12s ease;

  &:hover {
    border-color: #7443f6;
    box-shadow: 0 0 0 4px rgba(116, 67, 246, 0.12);
  }
  /* Feedback de toque: a pílula afunda enquanto o popover entra. */
  &:active { transform: scale(0.97); }

  i { font-size: 0.8rem; flex-shrink: 0; }

  /* A seta gira em vez de trocar de ícone — o movimento liga o chip ao card
     que está abrindo, em vez de piscar um glifo novo. */
  .chip-caret {
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  }

  /* Em telas estreitas o chip vira só ícone/avatar. */
  @media (max-width: 640px) {
    padding: ${({ $on }) => ($on ? '0 0.3rem' : '0 0.55rem')};
    .chip-label { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:active { transform: none; }
    .chip-caret { transition: none; }
  }
`;

// Envelope do conteúdo do chip: remonta a cada mudança de estado (via `key`),
// então cada estado entra com um fade curto em vez de trocar de seco.
const ChipContent = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  animation: ${chipSwap} 200ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ChipDivider = styled.span`
  width: 1px;
  height: 16px;
  flex-shrink: 0;
  background: ${({ $dm }) => ($dm ? 'rgba(196,181,253,0.28)' : 'rgba(116,67,246,0.22)')};
`;

// Avatar da conta ativa: iniciais + bolinha de status ancorada no canto.
const Avatar = styled.span`
  position: relative;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  overflow: visible;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(135deg, #7443f6, #a855f7);

  img {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    object-fit: cover;
  }
`;

const Dot = styled.span`
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  flex-shrink: 0;
  background: #22c55e;
  border: 2px solid ${({ $dm }) => ($dm ? '#170c2a' : '#ffffff')};
`;

const ChipText = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  min-width: 0;

  .chip-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chip-meta {
    font-size: 0.65rem;
    font-weight: 600;
    color: ${({ $dm }) => ($dm ? 'rgba(196,181,253,0.65)' : 'rgba(74,47,160,0.6)')};
  }
`;

const Card = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(360px, calc(100vw - 2rem));
  max-height: calc(100vh - 5rem);
  overflow-y: auto;
  border-radius: 14px;
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  background: ${({ $dm }) => ($dm ? 'rgba(23, 12, 42, 0.97)' : 'rgba(255, 255, 255, 0.98)')};
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, ${({ $dm }) => ($dm ? '0.50' : '0.18')});
  overflow: hidden;
  transform-origin: top right;

  /* Entra e SAI animado: o card só desmonta ao fim do popOut (estado
     $closing), para o fechamento não ser um corte seco. */
  ${({ $closing }) =>
    $closing
      ? css`
          animation: ${popOut} ${CARD_CLOSE_MS}ms ease both;
          pointer-events: none;
        `
      : css`
          animation: ${popIn} 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
        `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Bloco interno do popover — separa identidade / credencial / ações
// (região comum: tudo que pertence à sessão vive dentro da mesma superfície).
const CardBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem 0.9rem;

  & + & {
    border-top: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#eee9fb')};
  }
`;

const AccountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
`;

const LogoTile = styled.span`
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#e4e0f5')};
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#f5f2ff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  i { font-size: 1rem; }
`;

const AccountText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;

  strong {
    font-size: 0.9rem;
    color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')};
    overflow-wrap: anywhere;
  }

  span {
    font-size: 0.72rem;
    font-weight: 600;
    color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  }

  .email { word-break: break-all; }
`;

// Avatar do usuário logado no topo do popover (mesma linguagem do avatar da
// conta no chip, um tom acima em tamanho).
const UserAvatar = styled.span`
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #7443f6, #a855f7);
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${({ $accent, $dm }) => {
    if ($accent) return $dm ? 'rgba(116,67,246,0.30)' : 'rgba(116,67,246,0.12)';
    return $dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  }};
  color: ${({ $accent, $dm }) => {
    if ($accent) return $dm ? '#d8c8ff' : '#5b21b6';
    return $dm ? '#ccc' : '#555';
  }};

  i { font-size: 0.6rem; }
`;

// Rótulo de seção dentro do popover — separa "conta ativa" das ações do usuário.
const BlockLabel = styled.span`
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ $dm }) => ($dm ? 'rgba(196,181,253,0.55)' : 'rgba(116,67,246,0.6)')};
`;

// Linha de credencial: a UK fica sempre totalmente mascarada (nem os últimos
// dígitos aparecem) — o que interessa é o ESTADO da credencial, não o valor.
const CredentialRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};

  .cred-value {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: ui-monospace, monospace;
    letter-spacing: 0.12em;
    color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  }
  .cred-ok { color: #22c55e; font-size: 0.75rem; letter-spacing: normal; }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

// Ações como lista (uma por linha), no padrão do popover de perfil.
const MenuActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.4rem;
  border-top: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#eee9fb')};
`;

const MenuAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.6rem;
  border: none;
  border-radius: 9px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $danger, $dm }) => {
    if ($danger) return $dm ? '#fca5a5' : '#dc2626';
    return $dm ? '#e2d9ff' : '#3c2a6e';
  }};
  transition: background 0.15s;

  i { font-size: 0.8rem; }

  &:hover {
    background: ${({ $danger, $dm }) => {
      if ($danger) return $dm ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)';
      return $dm ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.10)';
    }};
  }
`;

const Btn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 9px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#251840' : '#f5f2ff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
  &:hover:not(:disabled) { background: ${({ $dm }) => ($dm ? '#2e1f50' : '#ede8ff')}; border-color: #7443f6; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  i { font-size: 0.75rem; }
`;

const PrimaryBtn = styled(Btn)`
  background: #7443f6;
  border-color: #7443f6;
  color: #fff;
  &:hover:not(:disabled) { background: #6233e0; border-color: #6233e0; }
`;

const FieldLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  margin-bottom: 0.35rem;
`;

const Row = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
`;

const UkInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  border: 1.5px solid ${({ $valid, $invalid, $dm }) =>
    $valid ? '#22c55e' : $invalid ? '#ef4444' : ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#130d26' : '#f8f6ff')};
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')};
  font-size: 0.85rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: #7443f6; box-shadow: 0 0 0 2px rgba(116, 67, 246, 0.18); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ResultBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  font-size: 0.82rem;
  border: 1px solid ${({ $ok, $dm }) =>
    $ok ? 'rgba(34, 197, 94, 0.45)' : ($dm ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.4)')};
  background: ${({ $ok, $dm }) =>
    $ok
      ? ($dm ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.07)')
      : ($dm ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)')};
  color: ${({ $ok, $dm }) => ($ok ? '#22c55e' : ($dm ? '#fca5a5' : '#dc2626'))};
  i { flex-shrink: 0; }
  strong { color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')}; }
`;

/** Rótulo relativo de quando a credencial foi validada. */
function formatValidatedAt(timestamp) {
  if (!timestamp) return 'validada';
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'validada agora';
  if (minutes < 60) return `validada há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `validada há ${hours}h`;
}

export default function ContaAtivaWidget({ inline = false }) {
  const { darkMode: dm } = useDarkMode();
  const { conta, ativarConta, encerrarConta } = useAccountSession();
  const { isAdmin, isGestor, teamId, level } = useUserProfile();
  const navigate = useNavigate();
  const logout = useLogout();

  // Identidade do usuário logado — mesmos dados do popover antigo da sidebar
  // (localStorage + contexto de perfil), sem chamada nova.
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  useEffect(() => {
    setUserName(localStorage.getItem('userName') || '');
    setUserEmail(localStorage.getItem('userEmail') || '');
  }, []);
  const teamLabel = getTeamLabel(teamId);
  const levelLabel = level != null ? LEVEL_LABELS[level] : null;

  const [open, setOpen] = useState(false);
  // closing: o card continua montado durante a animação de saída.
  const [closing, setClosing] = useState(false);
  // authMode: exibe o formulário de UK mesmo com conta ativa (ação "Trocar").
  const [authMode, setAuthMode] = useState(false);
  const rootRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [ukInput, setUkInput] = useState('');
  const [showUk, setShowUk] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | validating | valid | invalid
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState(null); // { accountId, accountName, logoUrl }

  const resetAuth = () => {
    setUkInput('');
    setShowUk(false);
    setStatus('idle');
    setErrorMsg('');
    setPreview(null);
  };

  // Desmonta o card e devolve o formulário ao estado inicial.
  const finishClose = () => {
    setOpen(false);
    setClosing(false);
    setAuthMode(false);
    resetAuth();
  };

  // Fecha animado: marca $closing, deixa o popOut correr e só então desmonta.
  // O guard é o timer (ref, sempre atual) e não o state `closing`: o listener
  // de clique-fora é registrado num effect com deps [open], então enxergaria um
  // `closing` defasado e agendaria um segundo fecho por cima do primeiro.
  const closeCard = () => {
    if (!open || closeTimerRef.current) return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      finishClose();
      return;
    }
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      finishClose();
    }, CARD_CLOSE_MS);
  };

  // Clique no chip. Reabrir no meio da saída cancela o fecho em vez de
  // encadear duas animações.
  const toggleCard = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
      setClosing(false);
      return;
    }
    if (open) closeCard();
    else setOpen(true);
  };

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // Fecha o card em clique fora e em Esc (mesmo padrão do popover de perfil).
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) closeCard();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeCard();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // closeCard é estável o suficiente aqui (só setters de estado).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleValidate = async () => {
    const uk = ukInput.trim();
    if (!uk || status === 'validating' || status === 'valid') return;
    setStatus('validating');
    setErrorMsg('');
    setPreview(null);
    try {
      const account = await validateAccount(uk);
      setPreview(account);
      setStatus('valid');
    } catch (err) {
      setStatus('invalid');
      setErrorMsg(err.message || 'Não foi possível validar a User-Key.');
    }
  };

  const handleConfirm = () => {
    if (status !== 'valid' || !preview) return;
    ativarConta({ uk: ukInput.trim(), ...preview });
    closeCard();
  };

  const handleEncerrar = () => {
    encerrarConta();
    closeCard();
  };

  const goTo = (path) => {
    closeCard();
    navigate(path);
  };

  const handleLogout = () => {
    closeCard();
    logout();
  };

  const showAuthForm = !conta || authMode;
  const isValidating = status === 'validating';
  // Aberto "de verdade": durante a saída a seta já volta e o aria fecha.
  const cardVisible = open && !closing;
  const chipState = isValidating ? 'validating' : conta ? `conta-${conta.accountId}` : 'idle';

  return (
    <Anchor ref={rootRef} $inline={inline}>
      <Chip
        $dm={dm}
        $on={!!conta}
        $open={cardVisible}
        type="button"
        onClick={toggleCard}
        aria-expanded={cardVisible}
        title={conta ? `Conta ativa: ${conta.accountName} (ID ${conta.accountId})` : 'Autenticar conta ativa'}
      >
        {/* `key` = estado do chip: cada troca remonta o conteúdo e ele entra
            com o fade do ChipContent, em vez de pular de um rótulo pro outro. */}
        <ChipContent key={chipState}>
          {isValidating ? (
            <>
              <i className="pi pi-spin pi-spinner" />
              <span className="chip-label">Validando…</span>
            </>
          ) : conta ? (
            <>
              <Avatar aria-hidden="true">
                {conta.logoUrl ? <img src={conta.logoUrl} alt="" /> : getInitials(conta.accountName)}
                <Dot $dm={dm} />
              </Avatar>
              <ChipText className="chip-label" $dm={dm}>
                <span className="chip-name">{conta.accountName}</span>
                <span className="chip-meta">ID {conta.accountId} · conta ativa</span>
              </ChipText>
            </>
          ) : (
            <>
              <i className="pi pi-key" />
              <span className="chip-label">Autenticar</span>
              <ChipDivider className="chip-label" $dm={dm} />
            </>
          )}
        </ChipContent>
        <i className="pi pi-chevron-down chip-caret" aria-hidden="true" />
      </Chip>

      {open && (
        <Card $dm={dm} $closing={closing}>
          {/* 1. Quem está logado */}
          <CardBlock $dm={dm}>
            <AccountRow>
              <UserAvatar aria-hidden="true">{getInitials(userName || 'Perfil')}</UserAvatar>
              <AccountText $dm={dm}>
                <strong>{userName || 'Perfil'}</strong>
                {userEmail && <span className="email">{userEmail}</span>}
              </AccountText>
            </AccountRow>
            {(teamLabel || levelLabel) && (
              <BadgeRow>
                {teamLabel && (
                  <Badge $dm={dm}>
                    <i className="pi pi-users" />
                    {teamLabel}
                  </Badge>
                )}
                {levelLabel && (
                  <Badge $dm={dm} $accent>
                    <i className="pi pi-shield" />
                    {levelLabel}
                  </Badge>
                )}
              </BadgeRow>
            )}
          </CardBlock>

          {/* 2. Em qual conta se está operando */}
          {conta && !authMode && (
            <>
              <CardBlock $dm={dm}>
                <BlockLabel $dm={dm}>Conta ativa</BlockLabel>
                <AccountRow>
                  <LogoTile $dm={dm}>
                    {conta.logoUrl
                      ? <img src={conta.logoUrl} alt="" />
                      : <i className="pi pi-building" />}
                  </LogoTile>
                  <AccountText $dm={dm}>
                    <strong>{conta.accountName}</strong>
                    <span>ID {conta.accountId} · conta ativa</span>
                  </AccountText>
                </AccountRow>

                <CredentialRow $dm={dm}>
                  <span>User-Key</span>
                  <span className="cred-value">
                    •••• •••• ••••
                    <i className="pi pi-check-circle cred-ok" />
                  </span>
                </CredentialRow>
                <CredentialRow $dm={dm}>
                  <span>Credencial</span>
                  <span>{formatValidatedAt(conta.validatedAt)}</span>
                </CredentialRow>
              </CardBlock>

              <MenuActions $dm={dm}>
                <MenuAction $dm={dm} type="button" onClick={() => setAuthMode(true)}>
                  <i className="pi pi-sync" /> Trocar conta
                </MenuAction>
                <MenuAction
                  $dm={dm}
                  type="button"
                  onClick={handleEncerrar}
                  title="Encerra apenas a sessão da conta ativa (você continua logado)"
                >
                  <i className="pi pi-times-circle" /> Encerrar conta ativa
                </MenuAction>
              </MenuActions>
            </>
          )}

          {showAuthForm && (
            <CardBlock $dm={dm}>
              <div>
                <FieldLabel $dm={dm}>User-Key da conta</FieldLabel>
                <Row>
                  <UkInput
                    $dm={dm}
                    $valid={status === 'valid'}
                    $invalid={status === 'invalid'}
                    type={showUk ? 'text' : 'password'}
                    placeholder="Cole a User-Key da conta aqui…"
                    value={ukInput}
                    onChange={(e) => {
                      setUkInput(e.target.value);
                      setStatus('idle');
                      setErrorMsg('');
                      setPreview(null);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleValidate(); }}
                    disabled={status === 'validating'}
                    autoFocus
                  />
                  <Btn
                    $dm={dm}
                    type="button"
                    onClick={() => setShowUk((v) => !v)}
                    title={showUk ? 'Ocultar' : 'Mostrar'}
                  >
                    <i className={`pi ${showUk ? 'pi-eye-slash' : 'pi-eye'}`} />
                  </Btn>
                  <Btn
                    $dm={dm}
                    type="button"
                    onClick={handleValidate}
                    disabled={!ukInput.trim() || status === 'validating' || status === 'valid'}
                  >
                    {status === 'validating'
                      ? (<><i className="pi pi-spin pi-spinner" /> Validando…</>)
                      : 'Validar'}
                  </Btn>
                </Row>
              </div>

              {status === 'valid' && preview && (
                <ResultBox $ok $dm={dm}>
                  <i className="pi pi-check-circle" />
                  <span>Conta encontrada: <strong>{preview.accountName}</strong> (ID {preview.accountId})</span>
                </ResultBox>
              )}
              {status === 'invalid' && (
                <ResultBox $dm={dm}>
                  <i className="pi pi-times-circle" />
                  <span>{errorMsg}</span>
                </ResultBox>
              )}

              <Actions>
                <Btn $dm={dm} type="button" onClick={authMode ? () => { setAuthMode(false); resetAuth(); } : closeCard}>
                  Cancelar
                </Btn>
                <PrimaryBtn
                  $dm={dm}
                  type="button"
                  onClick={handleConfirm}
                  disabled={status !== 'valid'}
                >
                  <i className="pi pi-check" /> Confirmar conta ativa
                </PrimaryBtn>
              </Actions>
            </CardBlock>
          )}

          {/* 3. Ações do usuário logado */}
          <MenuActions $dm={dm}>
            <MenuAction $dm={dm} type="button" onClick={() => goTo('/historico')}>
              <i className="pi pi-history" /> Histórico
            </MenuAction>
            {(isAdmin || isGestor) && (
              <MenuAction $dm={dm} type="button" onClick={() => goTo('/admin/usuarios')}>
                <i className="pi pi-users" />
                {isAdmin ? 'Gerenciar Usuários' : 'Usuários da equipe'}
              </MenuAction>
            )}
            <MenuAction
              $dm={dm}
              $danger
              type="button"
              onClick={handleLogout}
              title="Sai da sua conta do N1 App"
            >
              <i className="pi pi-sign-out" /> Sair do N1 App
            </MenuAction>
          </MenuActions>
        </Card>
      )}
    </Anchor>
  );
}
