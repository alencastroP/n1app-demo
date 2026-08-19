// pages/DocumentadorLoading.jsx
// Tela de progresso da extração com logs em tempo real e resultado final
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button } from 'primereact/button';
import { useDarkMode } from '../DarkModeContext';
import { startExtraction } from '../services/accountDocumenterService';

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const logSlide = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ─── Styled components ────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1rem;
  animation: ${fadeIn} 0.3s ease;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#4a2fa0')};
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  i { color: #7443f6; font-size: 1.4rem; }
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  margin: 0 0 1.75rem 0;
`;

const Card = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const ProgressBar = styled.div`
  height: 8px;
  border-radius: 99px;
  background: ${({ $dm }) => ($dm ? '#2d2a3e' : '#ede8ff')};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 99px;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, #7443f6, #9b67ff, #7443f6);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite linear;
  transition: width 0.4s ease;
`;

const LogBox = styled.div`
  background: ${({ $dm }) => ($dm ? '#0e0a1e' : '#f5f2ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 10px;
  padding: 1rem;
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.3) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.3); border-radius: 4px; }
`;

const LogLine = styled.div`
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  animation: ${logSlide} 0.2s ease;
  line-height: 1.4;

  &.error { color: #ef4444; }
  &.ok    { color: #22c55e; }
  &.warn  { color: #f59e0b; }
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border-radius: 99px;
  font-size: 0.82rem;
  font-weight: 700;
  background: ${({ $type }) =>
    $type === 'running' ? 'rgba(116,67,246,0.12)' :
    $type === 'done'    ? 'rgba(34,197,94,0.12)' :
    'rgba(239,68,68,0.12)'};
  color: ${({ $type }) =>
    $type === 'running' ? '#7443f6' :
    $type === 'done'    ? '#22c55e' :
    '#ef4444'};
  border: 1px solid ${({ $type }) =>
    $type === 'running' ? 'rgba(116,67,246,0.3)' :
    $type === 'done'    ? 'rgba(34,197,94,0.3)' :
    'rgba(239,68,68,0.3)'};
`;

const SectionTitle = styled.p`
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#6a5a9a' : '#a090cc')};
  margin: 0;
`;

const ResultCard = styled.div`
  background: ${({ $dm }) => ($dm ? '#130d26' : '#f5f2ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#d8cfff')};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PromptsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PromptItem = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#e4e0f5')};
  border-radius: 10px;
  padding: 0.9rem 1rem;
`;

const PromptLabel = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #7443f6;
  margin: 0 0 0.4rem 0;
`;

const PromptText = styled.p`
  font-size: 0.85rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  margin: 0;
  line-height: 1.5;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const DownloadBtn = styled(Button)`
  border-radius: 10px !important;
  font-size: 0.88rem !important;
`;

const CopyBtn = styled.button`
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: transparent;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s;

  &:hover { background: ${({ $dm }) => ($dm ? '#251840' : '#ede8ff')}; border-color: #7443f6; }
`;

const BackBtn = styled(Button)`
  border-radius: 10px !important;
  font-size: 0.88rem !important;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text, fileName) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function humanizeLog(msg) {
  if (!msg) return msg;
  if (msg.startsWith('  ')) {
    const inner = msg.trim();
    const m = inner.match(/\+(\d+) registros \(total=(\d+)\)/);
    if (m) return `   ↳ +${m[1]} itens carregados — ${m[2]} no total`;
    return `   ↳ ${inner}`;
  }
  if (msg.startsWith('✔')) return msg.replace('✔', '✅');
  if (/Automações detalhadas: \d+\/\d+/.test(msg)) {
    const m = msg.match(/(\d+)\/(\d+)/);
    return m ? `🔍 Detalhando automações — ${m[1]} de ${m[2]}` : '🔍 Detalhando automações...';
  }
  if (msg.includes('Expandindo automações') || msg.includes('automações detalhadas')) {
    const m = msg.match(/total=(\d+)/);
    return m ? `🤖 Expandindo detalhes das automações — ${m[1]} no total` : '🤖 Expandindo detalhes das automações...';
  }
  if (/Templates detalhados: \d+\/\d+/.test(msg)) {
    const m = msg.match(/(\d+)\/(\d+)/);
    return m ? `📄 Detalhando templates — ${m[1]} de ${m[2]}` : '📄 Detalhando templates...';
  }
  if (msg.includes('Expandindo document')) {
    const m = msg.match(/total=(\d+)/);
    return m ? `📄 Expandindo detalhes dos templates — ${m[1]} no total` : '📄 Expandindo detalhes dos templates...';
  }
  if (msg.includes('Coletando dados de uso'))       return '📈 Coletando dados de uso da conta (últimos 2 meses)...';
  if (msg.includes('Deals (uso)'))                  return '💼 Carregando negócios dos últimos 2 meses...';
  if (msg.includes('Propostas (uso)'))              return '📃 Carregando propostas dos últimos 2 meses...';
  if (msg.includes('Pedidos (uso)'))                return '🛒 Carregando pedidos dos últimos 2 meses...';
  if (msg.includes('Documentos (uso)'))             return '📁 Carregando documentos dos últimos 2 meses...';
  if (msg.includes('Tarefas (uso)'))                return '✅ Carregando tarefas dos últimos 2 meses...';
  if (msg.includes('Registros de interação'))       return '💬 Carregando registros de interação...';
  if (msg.includes('Histórico de estágios'))        return '🔄 Carregando histórico de movimentações...';
  if (msg.includes('canonical de uso'))             return '📊 Processando estatísticas de uso...';
  if (msg.includes('Iniciando extração'))           return '🔌 Conectando à API Ploomes...';
  if (msg.includes('Entidades (Fields@Entities)'))  return '🏗️ Carregando estrutura de entidades...';
  if (msg.includes('Campos (Fields)'))              return '📋 Mapeando campos personalizados...';
  if (msg.includes('Opções (Fields@OptionsTables')) return '🔤 Carregando opções de seleção...';
  if (msg.includes('Perfis (Users@Profiles)'))      return '👤 Carregando perfis de acesso...';
  if (msg.includes('Equipes (Teams)'))              return '👥 Mapeando equipes da conta...';
  if (msg.includes('Usuários (Users)'))             return '🙋 Carregando usuários do sistema...';
  if (msg.includes('Webhooks'))                     return '🔗 Verificando webhooks configurados...';
  if (msg.includes('Business Rules'))               return '⚙️ Analisando regras de negócio...';
  if (msg.includes('Document Templates (lista)'))   return '📄 Listando templates de documentos...';
  if (msg.includes('Pipelines (Deals@Pipelines)'))  return '🔄 Mapeando pipelines e estágios...';
  if (msg.includes('Checklists'))                   return '✅ Carregando checklists configurados...';
  if (msg.includes('Automações habilitadas'))       return '🤖 Listando automações ativas...';
  if (msg.includes('JSON canônico'))                return '📦 Compilando dados estruturados...';
  if (msg.includes('relatório de cobertura'))       return '📊 Gerando relatório de cobertura...';
  if (msg.includes('payload IA'))                   return '🧠 Preparando dados para análise por IA...';
  if (msg.includes('Gerando resumo'))               return '📝 Gerando resumo executivo...';
  if (msg.includes('Montando arquivos temáticos'))  return '🗂️ Montando arquivos de saída...';
  if (msg.includes('biblioteca Ploomes'))           return '💾 Salvando na biblioteca Ploomes...';
  if (msg.startsWith('⚠'))                         return msg;
  if (msg.startsWith('Erro') || msg.startsWith('Falha')) return `❌ ${msg}`;
  return msg;
}

function classifyLine(msg) {
  if (msg.startsWith('✅') || msg.startsWith('✔') || msg.includes('concluída')) return 'ok';
  if (msg.startsWith('⚠') || msg.startsWith('❌') || msg.startsWith('Falha') || msg.startsWith('Erro')) return 'warn';
  return '';
}

const SPLIT_META = [
  { key: '01_funis_automacoes',  label: '01 Funis & Automações',  icon: 'pi-sitemap'   },
  { key: '02_modelos_cpq',       label: '02 Modelos CPQ',         icon: 'pi-file'      },
  { key: '03_dicionario_campos', label: '03 Dicionário de Campos', icon: 'pi-list'     },
  { key: '04_config_geral',      label: '04 Config Geral',        icon: 'pi-cog'       },
  { key: '05_uso_da_conta',      label: '05 Uso da Conta',        icon: 'pi-chart-bar' },
];

function progressFromLogs(logs) {
  const steps = [
    'Iniciando extração',
    'Entidades (Fields@Entities)',
    'Campos (Fields)',
    'Opções (Fields@OptionsTables',
    'Perfis (Users@Profiles)',
    'Equipes (Teams)',
    'Usuários (Users)',
    'Webhooks',
    'Business Rules',
    'Document Templates (lista)',
    'Pipelines (Deals@Pipelines)',
    'Checklists',
    'Automações habilitadas',
    'Expandindo automações',
    'Expandindo document',
    'JSON canônico',
    'relatório de cobertura',
    'payload IA',
    'Gerando resumo',
    'Coletando dados de uso',
    'Deals (uso)',
    'Propostas (uso)',
    'Pedidos (uso)',
    'Documentos (uso)',
    'Tarefas (uso)',
    'Registros de interação',
    'Histórico de estágios',
    'Montando arquivos temáticos',
    'biblioteca Ploomes',
  ];
  const matched = steps.filter(s => logs.some(l => l.includes(s)));
  return Math.min(Math.round((matched.length / steps.length) * 95), 95);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function DocumentadorLoading() {
  const { darkMode: dm } = useDarkMode();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('running'); // 'running' | 'done' | 'error' | 'cancelled'
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const logEndRef = useRef(null);
  const abortRef = useRef(null);
  // Guard contra duplo disparo (React StrictMode em dev faz mount→unmount→mount)
  const startedRef = useRef(false);
  // Ref para controlar se o componente foi desmontado (persiste entre remounts do StrictMode)
  const unmountedRef = useRef(false);

  const pct = status === 'done' ? 100 : (status === 'error' || status === 'cancelled') ? 100 : progressFromLogs(logs);

  function handleCancel() {
    setCancelling(true);
    setLogs(prev => [...prev, '⚠ Cancelando extração…']);
    if (abortRef.current) abortRef.current();
  }

  useEffect(() => {
    // Reseta o flag de desmontado a cada mount (StrictMode faz mount→unmount→mount)
    unmountedRef.current = false;

    // Evita segunda execução do startExtraction (StrictMode)
    if (startedRef.current) return;
    startedRef.current = true;

    const raw = sessionStorage.getItem('docExtraction');
    if (!raw) {
      navigate('/account-documenter', { replace: true });
      return;
    }

    const { keys, accountId, accountName } = JSON.parse(raw);
    // Remove imediatamente para evitar reprocessamento em reload
    sessionStorage.removeItem('docExtraction');

    const abort = startExtraction(
      { keys, accountId, accountName },
      {
        onProgress: (msg) => { if (!unmountedRef.current) setLogs(prev => [...prev, msg]); },
        onComplete: (data) => {
          if (unmountedRef.current) return;
          setLogs(prev => [...prev, '✔ Extração concluída com sucesso!']);
          setStatus('done');
          setResult(data);
        },
        onError: (msg) => {
          if (unmountedRef.current) return;
          setLogs(prev => [...prev, `Erro: ${msg}`]);
          setStatus('error');
        },
        onCancelled: (msg) => {
          if (unmountedRef.current) return;
          setLogs(prev => [...prev, `⚠ ${msg}`]);
          setStatus('cancelled');
          setCancelling(false);
          navigate('/copilot');
        },
      }
    );

    abortRef.current = abort;
    return () => {
      // Apenas marca como desmontado — NÃO aborta a extração.
      // O abort só ocorre quando o usuário clica em Cancelar (handleCancel).
      // unmountedRef persiste entre remounts do StrictMode (ao contrário de variável local).
      unmountedRef.current = true;
    };
  }, []); // sem dependências: roda uma única vez após o mount

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function copyPrompt(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  return (
    <PageWrapper>
      <Title $dm={dm}>
        <i className={
          status === 'done'      ? 'pi pi-check-circle' :
          status === 'error'     ? 'pi pi-times-circle' :
          status === 'cancelled' ? 'pi pi-ban' :
          'pi pi-spin pi-spinner'
        } />
        Documentador de Contas
      </Title>
      <Subtitle $dm={dm}>
        {status === 'running'   && 'Extração em andamento, aguarde…'}
        {status === 'done'      && 'Extração concluída! Dados disponíveis abaixo.'}
        {status === 'error'     && 'Ocorreu um erro durante a extração.'}
        {status === 'cancelled' && 'Extração cancelada pelo usuário.'}
      </Subtitle>

      <Card $dm={dm}>
        {/* Status + Barra */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <StatusBadge $type={status === 'cancelled' ? 'error' : status}>
              <i className={
                status === 'done'      ? 'pi pi-check' :
                status === 'cancelled' ? 'pi pi-ban' :
                status === 'error'     ? 'pi pi-times' :
                'pi pi-spin pi-spinner'
              } />
              {status === 'running'   ? 'Extraindo…' :
               status === 'done'      ? 'Concluído'  :
               status === 'cancelled' ? 'Cancelado'  : 'Erro'}
            </StatusBadge>

            {/* Botão cancelar — visível apenas durante a extração */}
            {status === 'running' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(239,68,68,0.5)',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!cancelling) e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <i className={cancelling ? 'pi pi-spin pi-spinner' : 'pi pi-stop-circle'} />
                {cancelling ? 'Cancelando…' : 'Cancelar'}
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: dm ? '#7a6aaa' : '#9580c8' }}>{pct}%</span>
        </div>

        <ProgressBar $dm={dm}>
          <ProgressFill $pct={pct} />
        </ProgressBar>

        {/* Logs */}
        <div>
          <SectionTitle $dm={dm} style={{ marginBottom: '0.5rem' }}>Logs em tempo real</SectionTitle>
          <LogBox $dm={dm}>
            {logs.map((line, i) => {
              const humanized = humanizeLog(line);
              return (
                <LogLine key={i} $dm={dm} className={classifyLine(humanized)}>
                  {humanized}
                </LogLine>
              );
            })}
            <div ref={logEndRef} />
          </LogBox>
        </div>

        {/* Resultado */}
        {status === 'done' && result && (
          <>
            <SectionTitle $dm={dm}>Arquivos gerados (temáticos)</SectionTitle>
            <ActionRow>
              {SPLIT_META.map(({ key, label, icon }) => {
                const splits = result.splits ?? {};
                return splits[key] ? (
                  <DownloadBtn
                    key={key}
                    label={label}
                    icon={`pi ${icon}`}
                    className="p-button-outlined p-button-sm"
                    onClick={() => downloadJson(splits[key], `${key}.json`)}
                  />
                ) : null;
              })}
              {result.summary && (
                <DownloadBtn
                  label="Resumo (.txt)"
                  icon="pi pi-file-edit"
                  className="p-button-outlined p-button-sm"
                  onClick={() => downloadText(result.summary, 'resumo_extracao.txt')}
                />
              )}
            </ActionRow>

            {result.storage && (
              <ResultCard $dm={dm}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '0.85rem', color: dm ? '#c4b5fd' : '#4a2fa0', fontWeight: 600 }}>
                    Arquivos salvos na biblioteca Ploomes
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: dm ? '#7a6aaa' : '#9580c8' }}>
                  Pasta ID: {result.storage.folderId}
                </span>
              </ResultCard>
            )}

            {result.aiPayload?.prompts && (
              <>
                <SectionTitle $dm={dm}>Prompts sugeridos para IA externa</SectionTitle>
                <PromptsBlock>
                  {Object.entries(result.aiPayload.prompts).map(([key, text]) => (
                    <PromptItem key={key} $dm={dm}>
                      <PromptLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</PromptLabel>
                      <PromptText $dm={dm}>{text}</PromptText>
                      <CopyBtn
                        $dm={dm}
                        onClick={() => copyPrompt(key, text)}
                        style={{ marginTop: '0.6rem' }}
                      >
                        <i className={copied === key ? 'pi pi-check' : 'pi pi-copy'} />
                        {copied === key ? 'Copiado!' : 'Copiar prompt'}
                      </CopyBtn>
                    </PromptItem>
                  ))}
                </PromptsBlock>
              </>
            )}
          </>
        )}

        {/* Ações */}
        {(status === 'done' || status === 'error' || status === 'cancelled') && (
          <BackBtn
            label="Nova extração"
            icon="pi pi-arrow-left"
            className="p-button-outlined"
            onClick={() => navigate('/account-documenter')}
          />
        )}
      </Card>
    </PageWrapper>
  );
}
