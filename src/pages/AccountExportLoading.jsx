// pages/AccountExportLoading.jsx
// Exportação de Base: dispara o job, faz polling de status/logs e oferece o
// download do .zip ao final. Mesmo padrão visual do DocumentadorLoading.
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button } from 'primereact/button';
import { useDarkMode } from '../DarkModeContext';
import { startExport, getStatus, cancelExport, downloadZip } from '../services/accountExportService';

const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;
const shimmer = keyframes`0%{background-position:-400px 0}100%{background-position:400px 0}`;
const logSlide = keyframes`from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}`;

const PageWrapper = styled.div`max-width: 720px; margin: 0 auto; padding: 2rem 1rem; animation: ${fadeIn} 0.3s ease;`;
const Title = styled.h1`
  font-size: 1.6rem; font-weight: 700; margin: 0 0 0.25rem 0;
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#4a2fa0')};
  display: flex; align-items: center; gap: 0.6rem;
  i { color: #7443f6; font-size: 1.4rem; }
`;
const Subtitle = styled.p`font-size: 0.9rem; color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')}; margin: 0 0 1.75rem 0;`;
const Card = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 16px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;
`;
const ProgressBar = styled.div`height: 8px; border-radius: 99px; overflow: hidden; background: ${({ $dm }) => ($dm ? '#2d2a3e' : '#ede8ff')};`;
const ProgressFill = styled.div`
  height: 100%; border-radius: 99px; width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, #7443f6, #9b67ff, #7443f6); background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite linear; transition: width 0.4s ease;
`;
const StatusBadge = styled.div`
  display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.9rem;
  border-radius: 99px; font-size: 0.82rem; font-weight: 700;
  background: ${({ $type }) => $type === 'running' ? 'rgba(116,67,246,0.12)' : $type === 'done' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'};
  color: ${({ $type }) => $type === 'running' ? '#7443f6' : $type === 'done' ? '#22c55e' : '#ef4444'};
  border: 1px solid ${({ $type }) => $type === 'running' ? 'rgba(116,67,246,0.3)' : $type === 'done' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
`;
const SectionTitle = styled.p`
  font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#6a5a9a' : '#a090cc')}; margin: 0;
`;
const LogBox = styled.div`
  background: ${({ $dm }) => ($dm ? '#0e0a1e' : '#f5f2ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 10px; padding: 1rem; min-height: 200px; max-height: 320px; overflow-y: auto;
  font-family: monospace; font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.3rem;
  scrollbar-width: thin; scrollbar-color: rgba(116,67,246,0.3) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.3); border-radius: 4px; }
`;
const LogLine = styled.div`
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')}; line-height: 1.4; animation: ${logSlide} 0.2s ease;
  &.ok { color: #22c55e; } &.warn { color: #f59e0b; }
`;
const SummaryTable = styled.table`
  width: 100%; border-collapse: collapse; font-size: 0.84rem;
  th, td { text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#eee')}; }
  th { color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')}; font-weight: 700; text-transform: uppercase; font-size: 0.72rem; }
  td { color: ${({ $dm }) => ($dm ? '#d4c8ff' : '#3d2a80')}; }
`;
const DownloadBtn = styled(Button)`
  background: linear-gradient(135deg, #7443f6, #9b67ff) !important; border: none !important;
  border-radius: 12px !important; font-weight: 700 !important;
`;
const BackBtn = styled(Button)`border-radius: 10px !important; font-size: 0.88rem !important;`;

function classify(msg) {
  if (msg.startsWith('✔') || msg.startsWith('✅') || msg.includes('concluída')) return 'ok';
  if (msg.startsWith('⚠') || msg.startsWith('❌')) return 'warn';
  return '';
}

const STATUS_LABEL = {
  ok: 'OK', empty: 'Vazia', partial: 'Parcial', 'no-access': 'Sem acesso', failed: 'Falhou',
};

export default function AccountExportLoading() {
  const { darkMode: dm } = useDarkMode();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('running'); // running | done | error | cancelled
  const [summary, setSummary] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [account, setAccount] = useState({ id: null, name: null });

  const jobIdRef = useRef(null);
  const sinceRef = useRef(0);
  const pollRef = useRef(null);
  const logEndRef = useRef(null);
  const startedRef = useRef(false);

  // ~5% por entidade exportada (até ~12 entidades) — proxy visual.
  const pct = status === 'done' ? 100 : status === 'error' || status === 'cancelled' ? 100 : Math.min(95, logs.length * 3);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const raw = sessionStorage.getItem('accountExport');
    if (!raw) { navigate('/account-export', { replace: true }); return; }
    sessionStorage.removeItem('accountExport');
    const { keys, accountId, accountName } = JSON.parse(raw);
    setAccount({ id: accountId, name: accountName });

    (async () => {
      try {
        const { jobId } = await startExport({ keys, accountId, accountName });
        jobIdRef.current = jobId;
        poll();
      } catch (err) {
        setLogs((p) => [...p, `❌ ${err.message}`]);
        setStatus('error');
      }
    })();

    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function poll() {
    try {
      const st = await getStatus(jobIdRef.current, sinceRef.current);
      if (st.logs?.length) {
        setLogs((p) => [...p, ...st.logs]);
        sinceRef.current = st.logCount;
      }
      if (st.status === 'completed') {
        setSummary(st.summary);
        setStatus('done');
        return;
      }
      if (st.status === 'error') {
        setLogs((p) => [...p, `❌ ${st.error || 'Erro na exportação'}`]);
        setStatus('error');
        return;
      }
      if (st.status === 'cancelled') {
        setStatus('cancelled');
        return;
      }
      pollRef.current = setTimeout(poll, 1500);
    } catch {
      // erro transitório de polling — tenta de novo
      pollRef.current = setTimeout(poll, 3000);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setLogs((p) => [...p, '⚠ Cancelando exportação…']);
    if (jobIdRef.current) await cancelExport(jobIdRef.current);
  }

  async function handleDownload() {
    try {
      await downloadZip(jobIdRef.current, account.name);
    } catch (err) {
      setLogs((p) => [...p, `❌ Falha no download: ${err.message}`]);
    }
  }

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  return (
    <PageWrapper>
      <Title $dm={dm}>
        <i className={
          status === 'done' ? 'pi pi-check-circle' :
          status === 'error' ? 'pi pi-times-circle' :
          status === 'cancelled' ? 'pi pi-ban' : 'pi pi-spin pi-spinner'
        } />
        Exportação de Base
      </Title>
      <Subtitle $dm={dm}>
        {status === 'running' && 'Exportação em andamento — pode levar alguns minutos em contas grandes…'}
        {status === 'done' && 'Exportação concluída! Baixe o .zip com as planilhas abaixo.'}
        {status === 'error' && 'Ocorreu um erro durante a exportação.'}
        {status === 'cancelled' && 'Exportação cancelada.'}
      </Subtitle>

      <Card $dm={dm}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <StatusBadge $type={status === 'cancelled' ? 'error' : status}>
              <i className={
                status === 'done' ? 'pi pi-check' :
                status === 'cancelled' ? 'pi pi-ban' :
                status === 'error' ? 'pi pi-times' : 'pi pi-spin pi-spinner'
              } />
              {status === 'running' ? 'Exportando…' : status === 'done' ? 'Concluído' : status === 'cancelled' ? 'Cancelado' : 'Erro'}
            </StatusBadge>
            {status === 'running' && (
              <button onClick={handleCancel} disabled={cancelling}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1.5px solid rgba(239,68,68,0.5)',
                  background: 'transparent', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}>
                <i className={cancelling ? 'pi pi-spin pi-spinner' : 'pi pi-stop-circle'} />
                {cancelling ? 'Cancelando…' : 'Cancelar'}
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: dm ? '#7a6aaa' : '#9580c8' }}>{pct}%</span>
        </div>

        <ProgressBar $dm={dm}><ProgressFill $pct={pct} /></ProgressBar>

        <div>
          <SectionTitle $dm={dm} style={{ marginBottom: '0.5rem' }}>Logs em tempo real</SectionTitle>
          <LogBox $dm={dm}>
            {logs.map((line, i) => (
              <LogLine key={i} $dm={dm} className={classify(line)}>{line}</LogLine>
            ))}
            <div ref={logEndRef} />
          </LogBox>
        </div>

        {status === 'done' && (
          <>
            <DownloadBtn label="Baixar planilhas (.zip)" icon="pi pi-download" onClick={handleDownload} />
            {Array.isArray(summary) && summary.length > 0 && (
              <div>
                <SectionTitle $dm={dm} style={{ marginBottom: '0.5rem' }}>Resumo por entidade</SectionTitle>
                <SummaryTable $dm={dm}>
                  <thead><tr><th>Entidade</th><th>Registros</th><th>Status</th></tr></thead>
                  <tbody>
                    {summary.map((s, i) => (
                      <tr key={i}>
                        <td>{s.entidade}</td>
                        <td>{Number(s.registros || 0).toLocaleString('pt-BR')}</td>
                        <td>{STATUS_LABEL[s.status] ?? s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </SummaryTable>
              </div>
            )}
          </>
        )}

        {(status === 'done' || status === 'error' || status === 'cancelled') && (
          <BackBtn label="Nova exportação" icon="pi pi-arrow-left" className="p-button-outlined"
            onClick={() => navigate('/account-export')} />
        )}
      </Card>
    </PageWrapper>
  );
}
