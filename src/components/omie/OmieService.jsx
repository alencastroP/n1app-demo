// src/components/omie/OmieService.jsx
import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import styled from 'styled-components';
import AccountInfoCard from './AccountInfoCard';
import MappingFieldValues from './MappingFieldValues';
import ServiceHeader from '../ServiceHeader';
import { postFirstSync, postBring, postForce } from '../../services/omieApi';
import { Tooltip } from 'primereact/tooltip';
import ploomesLight from '../../assets/horizontal_colorido.png';
import ploomesDark from '../../assets/ploomes_logo.png';
import omieLogo from '../../assets/omie.png';
import { useDarkMode } from '../../DarkModeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { SERVICE_KEYS, FEATURE_KEYS } from '../../config/teamsConfig';

const entities = [
  { label: 'Contacts', value: 'contacts' },
  { label: 'Products', value: 'products' },
  { label: 'Orders',   value: 'orders'   },
];

const TA_HEIGHT = 240;

const Page = styled.div`
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1e0c45')};
`;

const ActionHub = styled.section`
  max-width: 1000px;
  margin: 0 auto;
`;

const ActionHubHero = styled.div`
  border-radius: 20px;
  padding: 1.15rem 1.2rem;
  margin-bottom: 1rem;
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(135deg, rgba(116,67,246,0.22) 0%, rgba(91,20,184,0.16) 100%)'
      : 'linear-gradient(135deg, rgba(116,67,246,0.12) 0%, rgba(153,31,224,0.08) 100%)'};
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(196,181,253,0.25)' : 'rgba(116,67,246,0.2)'};
  box-shadow: ${({ darkMode }) =>
    darkMode
      ? '0 8px 24px rgba(18, 1, 37, 0.35)'
      : '0 8px 22px rgba(116,67,246,0.12)'};
`;

const ActionHubTitle = styled.h2`
  margin: .5rem 0 .4rem;
  font-size: clamp(1.15rem, 1.3vw + .8rem, 1.6rem);
  color: ${({ darkMode }) => (darkMode ? '#f4edff' : '#2c0d63')};
`;

const ActionHubDescription = styled.p`
  margin: 0;
  font-size: .95rem;
  line-height: 1.5;
  max-width: 74ch;
  color: ${({ darkMode }) => (darkMode ? 'rgba(233,225,255,.88)' : 'rgba(44,13,99,.78)')};
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ActionCard = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  border-radius: 18px;
  padding: 1.1rem 1.1rem 1rem;
  min-height: 220px;
  border: 1px solid ${({ darkMode, featured }) =>
    featured
      ? darkMode ? 'rgba(167,139,250,.58)' : 'rgba(68, 6, 238, 0.45)'
      : darkMode ? 'rgba(141,120,198,.28)' : '#e7e7ee'};
  background: ${({ darkMode, featured }) =>
    featured
      ? darkMode
        ? 'linear-gradient(160deg, rgba(80,48,156,.62) 0%, rgba(38,24,75,.96) 100%)'
        : 'linear-gradient(160deg, rgba(216, 207, 247, 1) 0%, rgba(230, 214, 240, 1) 100%)'
      : darkMode
        ? 'linear-gradient(180deg, rgba(46,36,78,.98) 0%, rgba(32,24,56,.98) 100%)'
        : 'linear-gradient(180deg, rgba(246,244,255,1) 0%, rgba(250,249,255,1) 100%)'};
  color: inherit;
  cursor: pointer;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  box-shadow: ${({ darkMode }) => (darkMode ? '0 6px 18px rgba(0,0,0,.35)' : '0 8px 18px rgba(44,13,99,.10)')};

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ darkMode }) => (darkMode ? '#a78bfa' : '#7443f6')};
    box-shadow: ${({ darkMode }) =>
      darkMode ? '0 14px 26px rgba(116,67,246,.30)' : '0 14px 26px rgba(116,67,246,.20)'};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ darkMode }) =>
      darkMode ? '0 0 0 3px rgba(196,181,253,.40)' : '0 0 0 3px rgba(116,67,246,.25)'};
  }

  h3 {
    margin: .85rem 0 .35rem 0;
    font-size: 1.16rem;
    color: ${({ darkMode }) => (darkMode ? '#f3ecff' : '#2f145e')};
  }

  p {
    margin: 0;
    opacity: .9;
    font-size: .93rem;
    line-height: 1.45;
    color: ${({ darkMode }) => (darkMode ? 'rgba(240,232,255,.87)' : 'rgba(50,18,100,.78)')};
  }
`;

const ActionCardTop = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ActionIconWrap = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(196,181,253,.34)' : 'rgba(116,67,246,.24)')};
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(180deg, rgba(139,92,246,.25) 0%, rgba(76,29,149,.22) 100%)'
      : 'linear-gradient(180deg, rgba(139,92,246,.16) 0%, rgba(116,67,246,.10) 100%)'};

  i {
    font-size: 1.22rem;
    color: ${({ darkMode }) => (darkMode ? '#e5d8ff' : '#5b21b6')};
  }
`;

const ActionBadge = styled.span`
  font-size: .72rem;
  font-weight: 700;
  border-radius: 999px;
  padding: .26rem .55rem;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(196,181,253,.35)' : 'rgba(116,67,246,.28)')};
  color: ${({ darkMode }) => (darkMode ? '#ddd6fe' : '#5b21b6')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,.22)' : 'rgba(116,67,246,.12)')};
`;

const ActionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  margin-top: .9rem;
`;

const ActionPill = styled.span`
  font-size: .72rem;
  border-radius: 999px;
  padding: .24rem .52rem;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(167,139,250,.35)' : 'rgba(116,67,246,.20)')};
  color: ${({ darkMode }) => (darkMode ? '#d7cbff' : '#5e35b1')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(54,35,108,.56)' : 'rgba(255,255,255,.80)')};
`;

const ActionCardFooter = styled.div`
  margin-top: auto;
  width: 100%;
  padding-top: .95rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  color: ${({ darkMode }) => (darkMode ? '#cdbbff' : '#5b21b6')};

  i {
    font-size: .85rem;
    opacity: .8;
  }
`;

const Section = styled.div`
  background: ${({ darkMode }) => (darkMode ? '#201335' : '#f1f1f1')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#281546' : '#e6e6e6')};
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : 'inherit')};
`;

const SectionAccent = styled(Section)`
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(180deg, rgba(73,34,148,0.30) 0%, rgba(46,22,102,0.30) 100%)'
      : 'linear-gradient(180deg, rgba(116,67,246,0.10) 0%, rgba(94,46,207,0.10) 100%)'};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#7c56e6' : '#7443f6')};
  box-shadow: ${({ darkMode }) =>
    darkMode ? '0 6px 16px rgba(116,67,246,0.25)' : '0 6px 16px rgba(116,67,246,0.20)'};
`;

const FloatLabelWrapper = styled.div`
  position: relative;
  width: 100%;

  input.p-inputtext, textarea.p-inputtextarea {
    width: 100%;
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#e0dde2')} !important;
    border-radius: .5rem;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
    padding: .75rem .5rem .5rem .5rem;
    font-size: 1rem;
  }

  label {
    position: absolute;
    top: .5rem; left: .75rem;
    font-size: .85rem;
    color: ${({ darkMode }) => (darkMode ? '#c0b0ee' : '#666')};
    pointer-events: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  margin-top: .5rem;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const JsonError = styled.div`
  color: #a10000;
  margin-top: 8px;
`;

// --- Forçar integração: layout/estilo ---
const ForceHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .75rem;

  h3 { margin: 0; }
  small { opacity: .8; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: .4rem;
  margin-bottom: .75rem;
`;

const FieldLabel = styled.label`
  font-size: .85rem;
  font-weight: 600;
  letter-spacing: .02em;
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#38315e')};
`;

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: minmax(0,1fr) 110px minmax(0,1fr);
  gap: 0.75rem;
  align-items: stretch;
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ArrowCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;         
  min-height: ${TA_HEIGHT}px;    
  gap: .75rem;

  .arrow {
    font-size: 2rem;
    opacity: .8;
  }
`;

const StatusChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .35rem .6rem;
  border-radius: 999px;
  font-size: .85rem;
  font-weight: 600;
  background: ${({ tone }) =>
    tone === 'ok' ? 'rgba(15,123,15,.12)'
    : tone === 'error' ? 'rgba(161,0,0,.14)'
    : 'rgba(116,67,246,.12)'};
  color: ${({ tone }) =>
    tone === 'ok' ? '#0f7b0f'
    : tone === 'error' ? '#8a1010'
    : '#4e2fb0'};
  border: 1px solid rgba(0,0,0,.06);
`;

/* ⬇⬇ AJUSTE IMPORTANTE: grid responsivo para 3 botões sem quebrar layout ⬇⬇ */
const ForceButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: .6rem;

  .p-button {
    padding: .9rem 1rem;
    border-radius: 12px;
    font-weight: 600;
  }
`;

// --- Header do modal "Forçar integração" ---
const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
`;
const ModalTitle = styled.div`
  display: flex; align-items: center; gap: .75rem; font-weight: 700; font-size: 1.05rem;
`;
const LogosRow = styled.div`
  display: inline-flex; align-items: center; gap: .35rem; opacity: .85;
  img { height: 18px; }
  .swap { font-size: .9rem; opacity: .7; }
`;
const ModalHint = styled.div`
  font-size: .9rem; opacity: .85;
`;

// ocupa o conteúdo inteiro do Dialog e elimina “vazamento” de fundo
const SectionShell = styled(Section)`
  margin-top: 0;
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  min-height: calc(90vh - 64px);
  display: flex;
  flex-direction: column;
  padding: 1rem;
`;

// --- Header do modal "Sincronizações" ---
const SyncModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
`;
const SyncModalTitle = styled.div`
  display: flex; align-items: center; gap: .75rem; font-weight: 700; font-size: 1.05rem;
`;
const SyncLogosRow = styled.div`
  display: inline-flex; align-items: center; gap: .35rem; opacity: .85;
  img { height: 18px; }
  .swap { font-size: .9rem; opacity: .7; }
`;

// “capa” para o conteúdo do modal (mesmo respiro do Force)
const SectionShellSync = styled(Section)`
  margin-top: 0;
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  padding: 1rem;
`;

// rodapé “grudado” ao fim da seção First Sync
const StickyAction = styled.div`
  display: flex; justify-content: flex-start; gap: .5rem;
  margin-top: .75rem; padding-top: .5rem;
`;

// --- Utils: parser do log para { accountKey, body(JSON string), error } ---
function parseDynatraceLikeLog(raw) {
  if (!raw || typeof raw !== 'string') {
    return { accountKey: '', body: '', error: 'Conteúdo vazio' };
  }

  const input = raw.trim();

  // 1) Candidatos de AccountKey
  let accountKey = '';

  // a) em JSON: "AccountKey":"..."
  const reJsonAK = /"AccountKey"\s*:\s*"([^"]+)"/i;
  const mJsonAK = input.match(reJsonAK);
  if (mJsonAK) accountKey = mJsonAK[1];

  // b) na URL: .../omie/<rota>/<accountKey>
  if (!accountKey) {
    const reUrlAK = /\/omie\/[a-z]+[^/]*\/([A-Za-z0-9-]{8,})/i;
    const mUrlAK = input.match(reUrlAK);
    if (mUrlAK) accountKey = mUrlAK[1];
  }

  // c) padrão "Omie Ak <accountKey>"
  if (!accountKey) {
    const reAk = /\bOmie\s+Ak\s+([A-Za-z0-9-]{8,})/i;
    const mAk = input.match(reAk);
    if (mAk) accountKey = mAk[1];
  }

  // 2) Tentar isolar o JSON principal
  let jsonSlice = '';
  const firstBrace = input.indexOf('{');
  const lastBrace = input.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonSlice = input.slice(firstBrace, lastBrace + 1);
  }

  // 3) Parse para achar Requestbody
  let requestBodyObj = null;
  if (jsonSlice) {
    try {
      const outer = JSON.parse(jsonSlice);
      let reqBody = null;
      for (const k of Object.keys(outer)) {
        if (k.toLowerCase() === 'requestbody') { reqBody = outer[k]; break; }
      }
      if (!reqBody) {
        for (const k of Object.keys(outer)) {
          const v = outer[k];
          if (v && typeof v === 'object') {
            for (const k2 of Object.keys(v)) {
              if (k2.toLowerCase() === 'requestbody') { reqBody = v[k2]; break; }
            }
          }
          if (reqBody) break;
        }
      }
      if (!reqBody) {
        const idx = jsonSlice.search(/"Requestbody"\s*:/i);
        if (idx >= 0) {
          const openIdx = jsonSlice.indexOf('{', idx);
          if (openIdx >= 0) {
            let depth = 0;
            for (let i = openIdx; i < jsonSlice.length; i++) {
              const ch = jsonSlice[i];
              if (ch === '{') depth++;
              if (ch === '}') depth--;
              if (depth === 0) {
                const objStr = jsonSlice.slice(openIdx, i + 1);
                try { reqBody = JSON.parse(objStr); } catch {
                  //
                }
                break;
              }
            }
          }
        }
      }
      if (!reqBody) return { accountKey, body: '', error: 'Não encontrei "Requestbody" no conteúdo.' };
      requestBodyObj = reqBody;
    } catch {
      const idx = input.search(/"Requestbody"\s*:/i);
      if (idx >= 0) {
        const openIdx = input.indexOf('{', idx);
        if (openIdx >= 0) {
          let depth = 0;
          for (let i = openIdx; i < input.length; i++) {
            const ch = input[i];
            if (ch === '{') depth++;
            if (ch === '}') depth--;
            if (depth === 0) {
              const objStr = input.slice(openIdx, i + 1);
              try { requestBodyObj = JSON.parse(objStr); }
              catch { return { accountKey, body: '', error: 'Falha ao interpretar Requestbody como JSON.' }; }
              break;
            }
          }
        }
      }
      if (!requestBodyObj) return { accountKey, body: '', error: 'Conteúdo não pôde ser interpretado como JSON.' };
    }
  } else {
    return { accountKey, body: '', error: 'JSON principal não encontrado no log.' };
  }

  // 4) Serializar apenas o Requestbody
  let body = '';
  try {
    body = JSON.stringify(requestBodyObj);
  } catch {
    return { accountKey, body: '', error: 'Falha ao serializar Requestbody.' };
  }

  return { accountKey, body, error: '' };
}

// expediente: seg–sex, 09:00–18:00 (horário local do navegador)
function isOutsideBusinessHours(date = new Date()) {
  const day = date.getDay();           // 0=dom, 6=sáb
  if (day === 0 || day === 6) return true;

  const mins = date.getHours() * 60 + date.getMinutes();
  const start = 9 * 60;   // 09:00
  const end   = 18 * 60;  // 18:00
  return mins < start || mins >= end;
}

export default function OmieService() {
  const { darkMode } = useDarkMode();
  const ploomesLogo = darkMode ? ploomesDark : ploomesLight;

  const SyncHeaderContent = (
    <SyncModalHead>
      <SyncLogosRow>
        <img src={ploomesLogo} alt="Ploomes" />
        <span className="swap">⇄</span>
        <img src={omieLogo} alt="Omie" />
      </SyncLogosRow>

      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <i
          className="pi pi-info-circle"
          data-pr-tooltip="Carregue os dados da conta com a User-Key. Revise/edite os campos do FirstSync e confirme a execução. Depois, use Bring para sincronizar uma entidade específica."
          data-pr-position="bottom"
          style={{ fontSize: '1.1rem', opacity: 0.8, cursor: 'help' }}
        />
        <Tooltip target=".pi-info-circle" />
        <SyncModalTitle>Sincronizações</SyncModalTitle>
      </div>
    </SyncModalHead>
  );

  // estado compartilhado
  const [acc, setAcc] = useState(null);
  const [mapValues, setMapValues] = useState({});
  const [loading, setLoading] = useState(false);

  const { canDo, isAdmin } = useUserProfile();
  // Sincronizações (FirstSync/Bring): liberado para as teams Omie no nível geral+.
  // O FirstSync a qualquer hora continua restrito a admin (regra de horário abaixo).
  const canSync  = canDo(SERVICE_KEYS.OMIE, FEATURE_KEYS.OMIE_SYNC);
  const isAdminOrSupport = canSync;          // alias mantido para o card de Sincronizações

  // bring/force
  const [bringEntity, setBringEntity] = useState('contacts');
  const [forceBodyRaw, setForceBodyRaw] = useState('');
  const [forceBody, setForceBody] = useState(''); // JSON string já limpa
  const [forceAccountKey, setForceAccountKey] = useState('');
  const [parseInfo, setParseInfo] = useState({ status: 'idle', message: '' });

  const jsonOk = useMemo(
    () => !forceBody || (() => { try { JSON.parse(forceBody); return true; } catch { return false; } })(),
    [forceBody]
  );

  const handleFormat = () => {
    if (!forceBodyRaw?.trim()) {
      setParseInfo({ status: 'error', message: 'Cole o log bruto do Dynatrace.' });
      setForceBody('');
      return;
    }

    setParseInfo({ status: 'parsing', message: 'Processando…' });
    try {
      const { accountKey, body, error } = parseDynatraceLikeLog(forceBodyRaw);

      if (error) {
        setParseInfo({ status: 'error', message: error });
        setForceBody('');
        return;
      }

      setForceBody(body);
      setParseInfo({ status: 'ok', message: 'Corpo extraído: usando apenas o Requestbody.' });

      if (accountKey) {
        setForceAccountKey(accountKey);
      } else {
        setForceAccountKey('');
        toast.current?.show({
          severity: 'info',
          summary: 'AccountKey não encontrada',
          detail: 'Preencha manualmente ou verifique o log.',
          life: 3000,
        });
      }
    } catch {
      setParseInfo({ status: 'error', message: 'Não foi possível interpretar o conteúdo.' });
      setForceBody('');
    }
  };

  // modais
  const [openSync, setOpenSync] = useState(false);
  const [openForce, setOpenForce] = useState(false);

  const toast = useRef(null);

  const askAndRun = (message, accept) =>
    confirmDialog({
      header: 'Confirmar',
      icon: 'pi pi-question-circle',
      message,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      accept,
    });

  // --- FIRST SYNC ---
  const firstSyncAction = async () => {
    if (!acc?.accountKey) {
      toast.current?.show({ severity: 'warn', summary: 'Dados incompletos', detail: 'Carregue a AccountKey primeiro.' });
      return;
    }

    if (!acc?.integrationUserId || !acc?.integrationUserKey || !acc?.actionUserId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Dados da integração faltando',
        detail: 'Verifique IntegrationUserId, IntegrationUserKey e ActionUserId.',
        life: 5000,
      });
    }

    const fieldValues = Object.entries(mapValues).map(([id, val]) => {
      const FieldId = Number(id);
      if (typeof val === 'boolean') return { FieldId, BoolValue: !!val };
      return { FieldId, StringValue: String(val ?? '') };
    });

    const payload = {
      accountKey: acc.accountKey,
      accountId: acc.accountId,
      actionUserId: acc.actionUserId,
      integrationUserId: acc.integrationUserId,
      integrationUserKey: acc.integrationUserKey,
      userKey: acc.userKey,
      fieldValues,
    };

    setLoading(true);
    try {
      const out = await postFirstSync(payload);
      toast.current?.show({
        severity: 'success',
        summary: 'FirstSync enviado',
        detail: typeof out === 'object' ? JSON.stringify(out).slice(0, 300) : String(out).slice(0, 300),
        life: 4000,
      });
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: 'Falha no FirstSync',
        detail: e?.message?.slice(0, 300) || 'Erro desconhecido',
      });
    } finally { setLoading(false); }
  };
  const doFirstSync = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // ADMIN pode executar a qualquer momento
    if (isAdmin) {
      askAndRun('Executar FirstSync com os valores atuais?', firstSyncAction);
      return;
    }

    // N2_PRODUTO: bloquear antes das 18h
    if (currentHour < 18) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Horário não permitido',
        detail: `FirstSync só pode ser executado após as 18h (fora do expediente). Horário atual: ${currentHour}h.`,
        life: 6000,
      });
      return;
    }

    // Após 18h: pedir confirmação (fora do expediente — recomendado)
    confirmDialog({
      header: 'Executar FirstSync',
      icon: 'pi pi-info-circle',
      message: 'Você está executando o FirstSync após o expediente (recomendado para reduzir impacto). Deseja prosseguir?',
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      accept: firstSyncAction,
    });
  };

  const ForceHeaderContent = (
    <ModalHead>
      {/* lado esquerdo: ploomes ⇄ omie */}
      <LogosRow>
        <img src={ploomesLogo} alt="Ploomes" />
        <span className="swap">⇄</span>
        <img src={omieLogo} alt="Omie" />
      </LogosRow>

      {/* lado direito: título + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <i
          className="pi pi-info-circle"
          data-pr-tooltip="Cole o log bruto do Dynatrace e/ou informe a AccountKey. Clique em Formatar para extrair o Requestbody e detectar a AccountKey automaticamente."
          data-pr-position="bottom"
          style={{ fontSize: '1.1rem', opacity: 0.8, cursor: 'help' }}
        />
        <Tooltip target=".pi-info-circle" />
        <ModalTitle>Forçar integração</ModalTitle>
      </div>
    </ModalHead>
  );

  // --- BRING ---
  const bringAction = async () => {
    if (!acc?.accountKey) {
      toast.current?.show({ severity: 'warn', summary: 'Dados incompletos', detail: 'Carregue a AccountKey primeiro.' });
      return;
    }

    setLoading(true);
    try {
      const out = await postBring(bringEntity, {
        accountKey: acc.accountKey,
        // userId e userKey não são mais necessários aqui
      });
      toast.current?.show({
        severity: 'success',
        summary: `Bring ${bringEntity} enviado`,
        detail: typeof out === 'object' ? JSON.stringify(out).slice(0, 300) : String(out).slice(0, 300),
        life: 4000,
      });
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: `Falha no Bring ${bringEntity}`,
        detail: e?.message?.slice(0, 300) || 'Erro desconhecido',
      });
    } finally { setLoading(false); }
  };
  const doBring = () => askAndRun(`Executar Bring ${bringEntity}?`, bringAction);

  // --- FORCE ---
  const forceAction = async (direction) => {
    if (!forceAccountKey) {
      toast.current?.show({ severity: 'warn', summary: 'AccountKey vazia', detail: 'Informe a AccountKey.' });
      return;
    }
    if (!forceBody) {
      toast.current?.show({ severity: 'warn', summary: 'Request Body vazio', detail: 'Cole o body do log.' });
      return;
    }
    if (!jsonOk) {
      toast.current?.show({ severity: 'warn', summary: 'JSON inválido', detail: 'O Request Body não é um JSON válido.' });
      return;
    }

    setLoading(true);
    try {
      const out = await postForce(direction, { accountKey: forceAccountKey, body: forceBody });
      toast.current?.show({
        severity: 'success',
        summary: `Force ${direction} enviado`,
        detail: typeof out === 'object' ? JSON.stringify(out).slice(0, 300) : String(out).slice(0, 300),
        life: 4000,
      });
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: `Falha no Force ${direction}`,
        detail: e?.message?.slice(0, 300) || 'Erro desconhecido',
      });
    } finally { setLoading(false); }
  };

  const labelForDirection = (d) =>
    d === 'omie-to-ploomes' ? 'Omie → Ploomes'
    : d === 'ploomes-to-omie-order' ? 'Ploomes → Omie (Order)'
    : d === 'ploomes-to-omie-contact' ? 'Ploomes → Omie (Contact)'
    : d;

  const doForce = (direction) =>
    askAndRun(`Confirmar "${labelForDirection(direction)}"?`, () => forceAction(direction));

  // --- RENDER ---
  return (
    <Page className="p-4" darkMode={darkMode}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <ServiceHeader
        platforms={['ploomes', 'omie']}
        title="Central de ações Omie"
        subtitle="Ações de diagnóstico e sincronização da integração Ploomes ↔ Omie."
      />

      <ActionHub>
        <ActionHubHero darkMode={darkMode}>
          <ActionHubTitle darkMode={darkMode}>Escolha o fluxo que deseja executar</ActionHubTitle>
          <ActionHubDescription darkMode={darkMode}>
            Organize sua operação por objetivo: use <b>Sincronizações</b> para execução orientada de FirstSync/Bring
            e <b>Forçar integração</b> para reprocessamentos pontuais de mensagens.
          </ActionHubDescription>
        </ActionHubHero>

        <ActionsGrid>
          {isAdminOrSupport && (
            <ActionCard
              darkMode={darkMode}
              onClick={() => setOpenSync(true)}
              aria-label="Abrir Sincronizações"
            >
              <ActionCardTop>
                <ActionIconWrap darkMode={darkMode}>
                  <i className="pi pi-refresh" />
                </ActionIconWrap>
                <ActionBadge darkMode={darkMode}>Fluxo avançado</ActionBadge>
              </ActionCardTop>

              <h3>Sincronizações</h3>
              <p>Conduza FirstSync e Bring por entidade com um fluxo assistido e mais seguro para operação.</p>

              <ActionMeta>
                <ActionPill darkMode={darkMode}>FirstSync</ActionPill>
                <ActionPill darkMode={darkMode}>Bring por entidade</ActionPill>
                <ActionPill darkMode={darkMode}>Execução guiada</ActionPill>
              </ActionMeta>

              <ActionCardFooter darkMode={darkMode}>
                <span>Abrir módulo</span>
                <i className="pi pi-arrow-right" />
              </ActionCardFooter>
            </ActionCard>
          )}

          {(
            <ActionCard darkMode={darkMode} onClick={() => setOpenForce(true)} aria-label="Abrir Forçar Integração">
              <ActionCardTop>
                <ActionIconWrap darkMode={darkMode}>
                  <i className="pi pi-send" />
                </ActionIconWrap>
                <ActionBadge darkMode={darkMode}>Recomendado</ActionBadge>
              </ActionCardTop>

              <h3>Forçar integração</h3>
              <p>Reprocese mensagens entre Ploomes ⇄ Omie com parsing de log e envio direto do Requestbody.</p>

              <ActionMeta>
                <ActionPill darkMode={darkMode}>Dynatrace log</ActionPill>
                <ActionPill darkMode={darkMode}>Requestbody</ActionPill>
                <ActionPill darkMode={darkMode}>Ação pontual</ActionPill>
              </ActionMeta>

              <ActionCardFooter darkMode={darkMode}>
                <span>Abrir módulo</span>
                <i className="pi pi-arrow-right" />
              </ActionCardFooter>
            </ActionCard>
          )}
        </ActionsGrid>
      </ActionHub>

      {/* MODAL: Sincronizações */}
      <Dialog
        header={SyncHeaderContent}
        visible={openSync}
        onHide={() => setOpenSync(false)}
        modal
        style={{ width: 'min(1100px, 96vw)' }}
        contentStyle={{ padding: 0 }}
      >
        <SectionShellSync darkMode={darkMode}>
          <AccountInfoCard
            darkMode={darkMode}
            onLoaded={(data) => {
              setAcc(data);
              if (data?.fieldValuesNormalized) setMapValues(data.fieldValuesNormalized);
            }}
          />

          <SectionAccent darkMode={darkMode}>
            <div className="flex align-items-center justify-content-between flex-wrap" style={{ gap: '.5rem' }}>
              <h3 style={{ margin: 0 }}>First Sync</h3>
              <StatusChip tone="neutral">
                <i className="pi pi-info-circle" />
                FieldId <b>80</b> → <b>79</b> (mapeado automaticamente)
              </StatusChip>
            </div>

            <p className="mt-2" style={{ marginBottom: '.75rem' }}>
              Revise os valores trazidos da integração (pode editar). Quando estiver OK, execute o FirstSync.
            </p>

            <MappingFieldValues values={mapValues} onChange={setMapValues} />

            <StickyAction>
              <Button
                label="Executar FirstSync"
                onClick={doFirstSync}
                disabled={!acc || loading}
                loading={loading}
                className="p-button-primary"
              />
            </StickyAction>
          </SectionAccent>

          <Section darkMode={darkMode}>
            <h3 style={{ marginTop: 0 }}>Bring por entidade</h3>
            <p style={{ margin: 0, opacity: .85 }}>
              Traga dados pontuais por entidade após o FirstSync.
            </p>

            <div className="flex gap-2 align-items-end flex-wrap" style={{ marginTop: '.5rem' }}>
              <Dropdown
                value={bringEntity}
                options={entities}
                onChange={(e) => setBringEntity(e.value)}
              />
              <Button
                label={`Executar Bring ${bringEntity}`}
                onClick={doBring}
                disabled={!acc || loading}
                loading={loading}
                className="p-button-secondary"
              />
            </div>
          </Section>
        </SectionShellSync>
      </Dialog>

      {/* MODAL: Forçar Integração */}
      <Dialog
        header={ForceHeaderContent}
        visible={openForce}
        onHide={() => setOpenForce(false)}
        modal
        style={{ width: 'min(1200px, 96vw)', maxHeight: '90vh' }}
        contentStyle={{ padding: 0, height: 'calc(90vh - 64px)', overflow: 'auto' }}
      >
        <SectionShell darkMode={darkMode}>
          {/* AccountKey */}
          <Field darkMode={darkMode}>
            <FieldLabel darkMode={darkMode} htmlFor="accKey">AccountKey</FieldLabel>
            <input
              id="accKey"
              className="p-inputtext p-component"
              value={forceAccountKey}
              onChange={(e) => setForceAccountKey(e.target.value)}
              style={{
                background: darkMode ? '#1a0e2e' : '#fafafa',
                border: `1px solid ${darkMode ? '#2A2A3D' : '#e0dde2'}`,
                color: darkMode ? '#d6d5da' : '#0a0025',
                borderRadius: 8,
                padding: '0.65rem .75rem',
              }}
            />
          </Field>

          {/* Editor bruto -> botão formatar -> JSON final */}
          <Grid3>
            {/* esquerdo: log bruto */}
            <Field darkMode={darkMode}>
              <FieldLabel darkMode={darkMode} htmlFor="rawLog">Log bruto (cole do Dynatrace)</FieldLabel>
              <InputTextarea
                id="rawLog"
                value={forceBodyRaw}
                onChange={(e) => setForceBodyRaw(e.target.value)}
                autoResize={false}
                rows={14}
                className="w-full"
                style={{
                  background: darkMode ? '#1a0e2e' : '#fafafa',
                  color: darkMode ? '#d6d5da' : '#0a0025',
                  border: `1px solid ${darkMode ? '#2A2A3D' : '#e0dde2'}`,
                  borderRadius: 10,
                  resize: 'vertical',
                  height: TA_HEIGHT,
                  minHeight: TA_HEIGHT,
                }}
              />
            </Field>

            {/* meio: seta + botão formatar + status */}
            <ArrowCol>
              <i className="pi pi-arrow-right arrow" />
              <Button
                label="Formatar"
                icon="pi pi-wrench"
                onClick={handleFormat}
                className="p-button-outlined" 
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(116,67,246,.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  padding: '.6rem 1rem',
                  fontSize: '.9rem',
                  borderColor: '#7443f6',
                  color: '#7443f6',
                  background: 'transparent',
                }}
              />
            </ArrowCol>

            {/* direito: requestbody final */}
            <Field darkMode={darkMode} style={{ position: 'relative' }}>
              <FieldLabel darkMode={darkMode} htmlFor="reqBody">
                Requestbody (o que será enviado)
              </FieldLabel>

              {/* botão de copiar */}
              <Button
                icon="pi pi-copy"
                className="p-button-text p-button-rounded"
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '.4rem',
                  padding: '.3rem',
                  opacity: 1,
                }}
                onClick={() => navigator.clipboard.writeText(forceBody)}
              />
              <InputTextarea
                id="reqBody"
                value={forceBody}
                onChange={(e) => setForceBody(e.target.value)}
                autoResize={false}
                rows={14}
                readOnly
                className="w-full"
                style={{
                  background: darkMode ? '#0f0a1a' : '#fff',
                  color: darkMode ? '#e9e7ff' : '#0a0025',
                  border: `1px solid ${darkMode ? '#3a2f56' : '#dbd7ff'}`,
                  borderRadius: 10,
                  resize: 'vertical',
                  height: TA_HEIGHT,
                  minHeight: TA_HEIGHT,
                  boxShadow: darkMode
                    ? 'inset 0 0 0 9999px rgba(116,67,246,.03)'
                    : 'inset 0 0 0 9999px rgba(116,67,246,.03)',
                }}
              />

              {/* status */}
              {parseInfo.status !== 'idle' && (
                <StatusChip
                  tone={parseInfo.status === 'ok' ? 'ok' : parseInfo.status === 'error' ? 'error' : 'neutral'}
                  style={{ marginTop: '.6rem' }}
                >
                  {parseInfo.status === 'parsing' && <i className="pi pi-spin pi-spinner" />}
                  {parseInfo.status === 'ok' && <i className="pi pi-check-circle" />}
                  {parseInfo.status === 'error' && <i className="pi pi-times-circle" />}
                  <span>{parseInfo.message}</span>
                </StatusChip>
              )}
              {!jsonOk && <JsonError>JSON inválido — confira a estrutura do Requestbody.</JsonError>}
            </Field>

          </Grid3>

          {/* Botões de ação */}
          <div style={{ marginTop: '1rem', paddingTop: '.25rem' }}>
            <ForceButtons>
              <Button
                label="Omie → Ploomes"
                icon="pi pi-send"
                onClick={() => doForce('omie-to-ploomes')}
                loading={loading}
                disabled={loading || !forceAccountKey || !jsonOk}
              />
              <Button
                label="Ploomes → Omie (Order)"
                icon="pi pi-shopping-bag"
                onClick={() => doForce('ploomes-to-omie-order')}
                loading={loading}
                disabled={loading || !forceAccountKey || !jsonOk}
                className="p-button-secondary"
              />
              <Button
                label="Ploomes → Omie (Contact)"
                icon="pi pi-user"
                onClick={() => doForce('ploomes-to-omie-contact')}
                loading={loading}
                disabled={loading || !forceAccountKey || !jsonOk}
                severity="help"
              />
              {/* Botão de Product removido conforme solicitado */}
            </ForceButtons>
          </div>
        </SectionShell>
      </Dialog>
    </Page>
  );
}
