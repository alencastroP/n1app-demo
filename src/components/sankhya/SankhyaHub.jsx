// src/components/sankhya/SankhyaHub.jsx
import { useState, useRef } from 'react';
import { Toast } from 'primereact/toast';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { SERVICE_KEYS, FEATURE_KEYS } from '../../config/teamsConfig';
import { SANKHYA_ENV } from '../../services/sankhyaEnvironment';
import ServiceHeader from '../ServiceHeader';
import SankhyaCredentialsBar from './SankhyaCredentialsBar';
import SankhyaQuickLoginModal from './SankhyaQuickLoginModal';
import SankhyaLoadRecordsModal from './SankhyaLoadRecordsModal';
import SankhyaCorruptedItemModal from './SankhyaCorruptedItemModal';
import SankhyaTrocaTokenModal from './SankhyaTrocaTokenModal';
import SankhyaVersaoModal from './SankhyaVersaoModal';

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
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  filter: ${({ disabled }) => (disabled ? 'grayscale(35%)' : 'none')};
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  box-shadow: ${({ darkMode }) => (darkMode ? '0 6px 18px rgba(0,0,0,.35)' : '0 8px 18px rgba(44,13,99,.10)')};

  &:hover {
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-3px)')};
    border-color: ${({ darkMode, disabled }) =>
      disabled ? undefined : darkMode ? '#a78bfa' : '#7443f6'};
    box-shadow: ${({ darkMode, disabled }) =>
      disabled
        ? undefined
        : darkMode ? '0 14px 26px rgba(116,67,246,.30)' : '0 14px 26px rgba(116,67,246,.20)'};
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

const actions = [
  {
    id: 'consultas-itens',
    icon: 'pi pi-search',
    title: 'Consultas de itens',
    description: 'Consultar itens e retornar dados formatados do Sankhya.',
    badge: 'Consulta',
    pills: ['Itens', 'Dados formatados', 'Lote 50/50'],
  },
  {
    id: 'login-rapido',
    icon: 'pi pi-check-circle',
    title: 'Teste de login rápido',
    description: 'Validar conexão e credenciais de acesso ao Sankhya.',
    badge: 'Diagnóstico',
    pills: ['Credenciais', 'Conexão'],
  },
  {
    id: 'versao-integracao',
    icon: 'pi pi-sitemap',
    title: 'Versão da integração',
    description: 'Verificar a versão (V2/V3) e o histórico de edições da integração na conta.',
    badge: 'Diagnóstico',
    pills: ['Versão', 'Histórico', 'V2/V3'],
  },
  {
    id: 'troca-token',
    icon: 'pi pi-key',
    title: 'Troca de token',
    description: 'Atualizar token de autenticação via draft.',
    badge: 'Restrito',
    pills: ['Token', 'Draft', 'Autenticação'],
    feature: FEATURE_KEYS.SANKHYA_TOKEN_SWAP,
  },
  {
    id: 'item-corrompido',
    icon: 'pi pi-exclamation-triangle',
    title: 'Buscar item corrompido',
    description: 'Verificar lote (50 em 50) e identificar o item com problemas.',
    badge: 'Diagnóstico',
    pills: ['Lote', 'Verificação', 'Itens'],
    feature: FEATURE_KEYS.SANKHYA_CORRUPTED,
  },
];

export default function SankhyaHub() {
  const { darkMode } = useDarkMode();
  const { canDo } = useUserProfile();
  const toast = useRef(null);

  // ── credenciais centralizadas ──
  const [env, setEnv] = useState(SANKHYA_ENV.PROD);
  const [userKey, setUserKey] = useState('');
  const [account, setAccount] = useState(null); // { id, name, logo } | null
  const authReady = !!account?.id && !!userKey.trim();

  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openLoadRecordsModal, setOpenLoadRecordsModal] = useState(false);
  const [openCorruptedModal, setOpenCorruptedModal] = useState(false);
  const [openTrocaTokenModal, setOpenTrocaTokenModal] = useState(false);
  const [openVersaoModal, setOpenVersaoModal] = useState(false);

  function notify(t) {
    toast.current?.show(t);
  }

  function handleCardClick(id) {
    if (!authReady) {
      notify({ severity: 'warn', summary: 'Valide a User-Key', detail: 'Valide a User-Key e o ambiente antes de abrir uma ação.' });
      return;
    }
    if (id === 'login-rapido') setOpenLoginModal(true);
    else if (id === 'consultas-itens') setOpenLoadRecordsModal(true);
    else if (id === 'item-corrompido') setOpenCorruptedModal(true);
    else if (id === 'troca-token') setOpenTrocaTokenModal(true);
    else if (id === 'versao-integracao') setOpenVersaoModal(true);
  }

  const visibleActions = actions.filter(
    (a) => !a.feature || canDo(SERVICE_KEYS.SANKHYA, a.feature)
  );

  // props de autenticação compartilhados por todos os modais
  const authProps = { userKey, env, account, notify };

  return (
    <Page className="p-4" darkMode={darkMode}>
      <Toast ref={toast} />
      <ServiceHeader
        platforms={['ploomes', 'sankhya']}
        title="Central de ações Sankhya"
        subtitle="Ações de diagnóstico e correção da integração Ploomes ↔ Sankhya em um só lugar."
      />

      <ActionHub>
        <ActionHubHero darkMode={darkMode}>
          <ActionHubTitle darkMode={darkMode}>Escolha o fluxo que deseja executar</ActionHubTitle>
          <ActionHubDescription darkMode={darkMode}>
            Acesse as ferramentas de diagnóstico e manutenção: use <b>Consultas de itens</b> para buscar
            e formatar dados, <b>Teste de login rápido</b> para validar credenciais e
            as demais opções para resolver problemas pontuais na integração.
          </ActionHubDescription>
        </ActionHubHero>

        <SankhyaCredentialsBar
          env={env}
          onEnvChange={setEnv}
          userKey={userKey}
          onUserKeyChange={setUserKey}
          account={account}
          onAccountChange={setAccount}
          notify={notify}
        />

        <ActionsGrid>
          {visibleActions.map((a) => (
            <ActionCard
              key={a.id}
              darkMode={darkMode}
              disabled={!authReady}
              onClick={() => handleCardClick(a.id)}
              aria-label={`Abrir ${a.title}`}
              aria-disabled={!authReady}
              title={!authReady ? 'Valide a User-Key para habilitar' : undefined}
            >
              <ActionCardTop>
                <ActionIconWrap darkMode={darkMode}>
                  <i className={a.icon} />
                </ActionIconWrap>
                <ActionBadge darkMode={darkMode}>{a.badge}</ActionBadge>
              </ActionCardTop>

              <h3>{a.title}</h3>
              <p>{a.description}</p>

              <ActionMeta>
                {a.pills.map((pill) => (
                  <ActionPill key={pill} darkMode={darkMode}>{pill}</ActionPill>
                ))}
              </ActionMeta>

              <ActionCardFooter darkMode={darkMode}>
                <span>Abrir módulo</span>
                <i className="pi pi-arrow-right" />
              </ActionCardFooter>
            </ActionCard>
          ))}
        </ActionsGrid>
      </ActionHub>

      <SankhyaQuickLoginModal
        visible={openLoginModal}
        onHide={() => setOpenLoginModal(false)}
        {...authProps}
      />
      <SankhyaLoadRecordsModal
        visible={openLoadRecordsModal}
        onHide={() => setOpenLoadRecordsModal(false)}
        {...authProps}
      />
      <SankhyaCorruptedItemModal
        visible={openCorruptedModal}
        onHide={() => setOpenCorruptedModal(false)}
        {...authProps}
      />
      <SankhyaTrocaTokenModal
        visible={openTrocaTokenModal}
        onHide={() => setOpenTrocaTokenModal(false)}
        {...authProps}
      />
      <SankhyaVersaoModal
        visible={openVersaoModal}
        onHide={() => setOpenVersaoModal(false)}
        {...authProps}
      />
    </Page>
  );
}
