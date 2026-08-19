// src/pages/AuditoriaUsuarios.jsx
// Auditoria de Histórico de Usuário — página única.
// Fases: form → extracting → done | error.
//   1) User-Key + validar → lista usuários (ukStatus).
//   2) MultiSelect de usuários (badge Ativo/Desativado por Suspended).
//   3) Período — campos separados de início e término (PT-BR), calendário
//      limitado aos últimos 6 meses (minDate) e a hoje (maxDate).
//   PreviewBox antes de extrair → progresso (polling) → download do ZIP.

import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import { FormShell } from '../design-system';
import ContaAtivaHint from '../components/ContaAtivaHint';
import CredencialCard from '../components/CredencialCard';
import { listUsers, startExtraction, getStatus, cancel, downloadZip } from '../services/userAuditService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function toYMD(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Validação de intervalo (máx 6 meses) — espelha a regra do backend.
function rangeErrorFor(start, end) {
  if (!start || !end) return '';
  if (end < start) return 'A data final deve ser posterior à inicial.';
  if (end > addMonths(start, 6)) return 'O intervalo máximo permitido é de 6 meses.';
  return '';
}

// ─── Styled ──────────────────────────────────────────────────────────────────
const Card = styled.section`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 14px;
  padding: 1.25rem 1.4rem;
  margin-bottom: 1.15rem;
  box-shadow: ${({ $dm }) => ($dm ? '0 4px 16px rgba(0,0,0,.35)' : '0 2px 8px rgba(100,60,180,.07)')};
`;

const StepTitle = styled.p`
  margin: 0 0 0.9rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.65)' : 'rgba(76,29,149,.7)')};
`;

const Label = styled.label`
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: ${({ $dm }) => ($dm ? '#b8a8d8' : '#4f2e84')};
`;

const Row = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const ValidationMsg = styled.p`
  margin: 0.4rem 0 0;
  font-size: 0.75rem;
  min-height: 1em;
  color: ${({ $error }) => ($error ? '#ef4444' : 'transparent')};
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
`;

const PreviewBox = styled.div`
  background: ${({ $dm }) => ($dm ? '#150c28' : '#f9f7ff')};
  border: 1px dashed ${({ $dm }) => ($dm ? '#3a2a6a' : '#d6ccf5')};
  border-radius: 12px;
  padding: 1rem 1.15rem;
`;

const PreviewTitle = styled.p`
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b21b6')};
`;

const PreviewList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.85rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.85)' : '#374151')};
  max-height: 180px;
  overflow-y: auto;
`;

const LogList = styled.div`
  margin-top: 1rem;
  max-height: 220px;
  overflow-y: auto;
  font-size: 0.82rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.8)' : '#374151')};
`;

const LogItem = styled.div`
  padding: 0.15rem 0;
  border-bottom: 1px solid ${({ $dm }) => ($dm ? '#241a3d' : '#f0ecff')};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const ErrorText = styled.p`
  color: #ef4444;
  font-size: 0.9rem;
  margin: 0 0 1rem;
`;

// ─── Componente ──────────────────────────────────────────────────────────────
export default function AuditoriaUsuarios() {
  const { darkMode: dm } = useDarkMode();
  const toast = useRef(null);

  const [phase, setPhase] = useState('form'); // form | extracting | done | error

  // Etapa 1 — User-Key (estado controlado do CredencialCard)
  const [uk, setUk] = useState('');
  const [ukAccount, setUkAccount] = useState(null); // conta "validada" (chip do CredencialCard)
  const ukStatus = ukAccount ? 'valid' : 'idle'; // preserva o gate das etapas 2 e 3

  // Etapa 2 — usuários
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Etapa 3 — período (campos separados: início e término)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Extração
  const [info, setInfo] = useState(null); // status.info: fase/usuário/página atual
  const [pct, setPct] = useState(0);       // status.progress (0-100)
  const [logs, setLogs] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const jobIdRef = useRef(null);
  const pollRef = useRef(null);
  const logCountRef = useRef(0);

  const start = startDate;
  const end = endDate;
  const rangeError = rangeErrorFor(start, end);

  // Limites do calendário: no máximo hoje, no mínimo 6 meses atrás.
  const today = new Date();
  const minSelectable = addMonths(today, -6);

  // Revoga o ObjectURL ao desmontar ou ao gerar um novo.
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  // Encerra polling ao desmontar.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const warn = (detail) =>
    toast.current?.show({ severity: 'warn', summary: 'Atenção', detail, life: 4000 });

  // ── Etapa 1: validar UK + listar usuários (via CredencialCard) ─────────────
  // Validar = conseguir listar usuários; o service não retorna nome/logo da conta.
  async function handleValidateUk(trimmed) {
    setUsers([]);
    setSelectedIds([]);
    const list = await listUsers(trimmed); // em falha, lança — o CredencialCard exibe o erro
    setUsers(list);
    return {
      accountId: null,
      accountName: `User-Key válida · ${list.length} usuário(s)`,
      logoUrl: null,
    };
  }

  // Editar a UK limpa a conta validada → fecha o gate e zera a seleção.
  function handleUkAccountChange(acc) {
    setUkAccount(acc);
    if (!acc) {
      setUsers([]);
      setSelectedIds([]);
    }
  }

  const userItemTemplate = (u) => (
    <ItemRow>
      <span>{u.Name}</span>
      <Badge
        value={u.Suspended ? 'Desativado' : 'Ativo'}
        severity={u.Suspended ? 'danger' : 'success'}
      />
    </ItemRow>
  );

  const selectedUsers = users.filter((u) => selectedIds.includes(u.Id));

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // ── Polling do job (start → status → download) ──────────────────────────────
  function startPolling(jobId) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      let st;
      try {
        st = await getStatus(jobId, logCountRef.current);
      } catch {
        return; // erro transitório de polling — tenta de novo no próximo tick
      }
      if (!st) return;

      if (Array.isArray(st.logs) && st.logs.length) {
        setLogs((prev) => [...prev, ...st.logs]);
      }
      if (typeof st.logCount === 'number') logCountRef.current = st.logCount;
      if (st.info) setInfo(st.info);
      if (typeof st.progress === 'number') setPct(st.progress);

      if (st.status === 'completed') {
        stopPolling();
        setPct(100);
        try {
          const blob = await downloadZip(jobId);
          if (!blob) {
            setErrorMsg('Não foi possível baixar o arquivo gerado.');
            setPhase('error');
            return;
          }
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          setPhase('done');
        } catch (err) {
          setErrorMsg(err?.message || 'Falha ao baixar o arquivo.');
          setPhase('error');
        }
      } else if (st.status === 'error') {
        stopPolling();
        setErrorMsg(st.error || 'Falha ao gerar a auditoria.');
        setPhase('error');
      } else if (st.status === 'cancelled') {
        stopPolling();
        setPhase('form');
      }
    }, 1500);
  }

  // ── Extração ────────────────────────────────────────────────────────────────
  async function handleExtract() {
    if (ukStatus !== 'valid') { warn('Valide a User-Key primeiro.'); return; }
    if (selectedIds.length === 0) { warn('Selecione ao menos um usuário.'); return; }
    if (!start || !end) { warn('Selecione o período.'); return; }
    if (rangeError) { warn(rangeError); return; }

    setLogs([]);
    setInfo(null);
    setPct(0);
    setErrorMsg('');
    logCountRef.current = 0;
    if (downloadUrl) setDownloadUrl(''); // o useEffect de cleanup revoga o ObjectURL anterior
    setPhase('extracting');

    const payload = {
      userKey: uk.trim(),
      userIds: selectedIds,
      dateStart: toYMD(start),
      dateEnd: toYMD(end),
    };

    try {
      const { jobId } = await startExtraction(payload);
      if (!jobId) throw new Error('Falha ao iniciar a auditoria.');
      jobIdRef.current = jobId;
      startPolling(jobId);
    } catch (err) {
      setErrorMsg(err?.message || 'Falha ao iniciar a auditoria.');
      setPhase('error');
    }
  }

  async function handleCancel() {
    const jobId = jobIdRef.current;
    stopPolling();
    if (jobId) { try { await cancel(jobId); } catch { /* ignora */ } }
    setPhase('form');
  }

  function handleReset() {
    stopPolling();
    setDownloadUrl(''); // o useEffect de cleanup revoga o ObjectURL anterior
    setInfo(null);
    setPct(0);
    setLogs([]);
    setErrorMsg('');
    setPhase('form');
  }

  const downloadName = `auditoria_usuarios_${toYMD(new Date())}.zip`;

  return (
    <FormShell
      width="narrow"
      header={(
        <ServiceHeader
          platforms={['ploomes']}
          title="Auditoria de Usuários"
          subtitle="Extraia o histórico de alterações (changelog) e de navegação de um ou mais usuários em planilhas — uma por usuário — empacotadas num ZIP."
        />
      )}
    >
      <Toast ref={toast} />

      {phase === 'form' && (
        <>
          {/* Etapa 1 — User-Key */}
          <Card $dm={dm}>
            <StepTitle $dm={dm}>1 · User-Key da conta</StepTitle>
            <CredencialCard
              uk={uk}
              onUkChange={setUk}
              account={ukAccount}
              onAccountChange={handleUkAccountChange}
              onValidate={handleValidateUk}
              placeholder="Cole a User-Key do operador"
            />
          </Card>

          {/* Etapa 2 — usuários */}
          {ukStatus === 'valid' && (
            <Card $dm={dm}>
              <StepTitle $dm={dm}>2 · Usuários</StepTitle>
              <Label $dm={dm}>Selecione um ou mais usuários</Label>
              <MultiSelect
                value={selectedIds}
                onChange={(e) => setSelectedIds(e.value)}
                options={users}
                optionLabel="Name"
                optionValue="Id"
                itemTemplate={userItemTemplate}
                filter
                filterBy="Name,Email"
                placeholder="Selecione os usuários"
                display="chip"
                maxSelectedLabels={4}
                style={{ width: '100%' }}
                emptyFilterMessage="Nenhum usuário encontrado"
              />
            </Card>
          )}

          {/* Etapa 3 — período */}
          {ukStatus === 'valid' && (
            <Card $dm={dm}>
              <StepTitle $dm={dm}>3 · Período (últimos 6 meses)</StepTitle>
              <Row>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Label $dm={dm}>Data de início</Label>
                  <Calendar
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.value);
                      // Se o término ficou antes do novo início, limpa.
                      if (endDate && e.value && endDate < e.value) setEndDate(null);
                    }}
                    dateFormat="dd/mm/yy"
                    showIcon
                    readOnlyInput
                    locale="pt-BR"
                    placeholder="dd/mm/aaaa"
                    minDate={minSelectable}
                    maxDate={today}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Label $dm={dm}>Data de término</Label>
                  <Calendar
                    value={endDate}
                    onChange={(e) => setEndDate(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    readOnlyInput
                    locale="pt-BR"
                    placeholder="dd/mm/aaaa"
                    minDate={startDate || minSelectable}
                    maxDate={today}
                    disabled={!startDate}
                    style={{ width: '100%' }}
                  />
                </div>
              </Row>
              <ValidationMsg $error={!!rangeError}>{rangeError || ' '}</ValidationMsg>
            </Card>
          )}

          {/* PreviewBox */}
          {ukStatus === 'valid' && selectedUsers.length > 0 && start && end && !rangeError && (
            <Card $dm={dm}>
              <PreviewBox $dm={dm}>
                <ContaAtivaHint uk={uk} />
                <PreviewTitle $dm={dm}>Confira antes de extrair</PreviewTitle>
                <PreviewList $dm={dm}>
                  {selectedUsers.map((u) => (
                    <li key={u.Id}>
                      {u.Name} {u.Suspended ? '(Desativado)' : '(Ativo)'}
                    </li>
                  ))}
                </PreviewList>
                <p style={{ marginTop: '0.7rem', fontSize: '0.85rem' }}>
                  <strong>Período:</strong> {toYMD(start)} a {toYMD(end)} ·{' '}
                  <strong>{selectedUsers.length}</strong> usuário(s) → 1 planilha cada, num ZIP.
                </p>
              </PreviewBox>
              <ButtonRow>
                <Button label="Extrair auditoria" icon="pi pi-download" onClick={handleExtract} />
              </ButtonRow>
            </Card>
          )}
        </>
      )}

      {phase === 'extracting' && (
        <Card $dm={dm}>
          <StepTitle $dm={dm}>Extraindo…</StepTitle>
          <ProgressBar value={pct} />
          {info?.userName && (
            <p style={{ fontSize: '0.85rem', marginTop: '0.7rem' }}>
              Usuário {info.userIndex}/{info.totalUsers} — <strong>{info.userName}</strong>
              {info.phase === 'navegacao' ? ' · navegação' : ' · changelog'}
              {info.total ? ` (${info.current}/${info.total})` : ''}
            </p>
          )}
          <LogList $dm={dm}>
            {logs.map((l, i) => (
              <LogItem key={i} $dm={dm}>{l}</LogItem>
            ))}
          </LogList>
          <ButtonRow>
            <Button label="Cancelar" icon="pi pi-times" severity="danger" outlined onClick={handleCancel} />
          </ButtonRow>
        </Card>
      )}

      {phase === 'done' && (
        <Card $dm={dm}>
          <StepTitle $dm={dm}>Concluído</StepTitle>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            Auditoria gerada com sucesso. Baixe o arquivo abaixo.
          </p>
          <ButtonRow>
            <a href={downloadUrl} download={downloadName} style={{ textDecoration: 'none' }}>
              <Button label="Baixar ZIP" icon="pi pi-download" />
            </a>
            <Button label="Nova extração" icon="pi pi-refresh" outlined onClick={handleReset} />
          </ButtonRow>
        </Card>
      )}

      {phase === 'error' && (
        <Card $dm={dm}>
          <StepTitle $dm={dm}>Erro</StepTitle>
          <ErrorText>{errorMsg}</ErrorText>
          <ButtonRow>
            <Button label="Tentar novamente" icon="pi pi-refresh" onClick={handleReset} />
          </ButtonRow>
        </Card>
      )}
    </FormShell>
  );
}
