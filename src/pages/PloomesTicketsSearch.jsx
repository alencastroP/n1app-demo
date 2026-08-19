import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import SingleDatePicker from '../components/SingleDatePicker';
import {
  fetchPloomesTicketsPipelines,
  lookupPloomesContact,
  startPloomesTicketsJob,
  getPloomesTicketsJobStatus,
  cancelPloomesTicketsJob,
  downloadPloomesTicketsJson,
} from '../services/ploomesTicketsService';
import { PLOOMES_TICKETS_PROMPTS, periodoToLabel } from '../config/ploomesTicketsPrompts';

// ── Helpers de conversão entre 'YYYY-MM-DD' e Date ──
function dateStringToDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToDateString(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Layout
// ───────────────────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  padding: 1.4rem 1.2rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Card = styled.div`
  width: 100%;
  max-width: 1040px;
  border-radius: 1.2rem;
  overflow: hidden;
  border: 1px solid ${({ $dark }) => ($dark ? '#2d2244' : '#e6def5')};
  background: ${({ $dark }) => ($dark ? '#170c2a' : '#ffffff')};
  box-shadow: ${({ $dark }) =>
    $dark ? '0 16px 34px rgba(0,0,0,0.45)' : '0 14px 32px rgba(87,62,145,0.14)'};
`;

const CardBody = styled.div`
  padding: 1.2rem 1.4rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Section = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
  background: ${({ $dark }) => ($dark ? '#1c1033' : '#fcfaff')};
  border-radius: 1rem;
  padding: 1rem 1.1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
`;

const StepBadge = styled.div`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $done, $dark }) =>
    $done
      ? $dark ? '#22c55e' : '#16a34a'
      : $dark ? 'linear-gradient(135deg,#5b14b8,#6e10a5)' : 'linear-gradient(135deg,#8028ff,#991fe0)'};
  color: #fff;
  box-shadow: 0 2px 6px rgba(116, 67, 246, 0.28);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${({ $dark }) => ($dark ? '#cab4f5' : '#6e4db2')};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#dacdf8' : '#4f2e84')};
`;

const FieldHint = styled.p`
  margin: 0.45rem 0 0;
  font-size: 0.79rem;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
  line-height: 1.55;
`;

const StyledInput = styled(InputText)`
  && {
    width: 100%;
    border-radius: 0.65rem !important;
    background: ${({ $dark }) => ($dark ? '#291b45' : '#ffffff')} !important;
    color: ${({ $dark }) => ($dark ? '#f5efff' : '#24134a')} !important;
    border: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')} !important;
    padding: 0.6rem 0.85rem !important;
    font-size: 0.9rem !important;
    min-height: 42px;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:hover { border-color: #8f6de0 !important; }
    &:focus { border-color: #8f6de0 !important; box-shadow: 0 0 0 3px rgba(143,109,224,0.18) !important; }
    &::placeholder { color: ${({ $dark }) => ($dark ? '#6b5890' : '#a78bca')} !important; }
  }
`;

// ── Banner / flash ──
const Banner = styled.div`
  border-radius: 0.75rem;
  padding: 0.65rem 0.9rem;
  font-size: 0.84rem;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: ${({ $type, $dark }) => {
    if ($type === 'success') return $dark ? 'rgba(34,197,94,0.1)'  : '#f0fdf4';
    if ($type === 'warn')    return $dark ? 'rgba(245,158,11,0.1)' : '#fffbeb';
    if ($type === 'error')   return $dark ? 'rgba(239,68,68,0.1)'  : '#fef2f2';
    return $dark ? 'rgba(139,92,246,0.12)' : '#f5f3ff';
  }};
  border: 1px solid ${({ $type, $dark }) => {
    if ($type === 'success') return $dark ? '#22c55e' : '#86efac';
    if ($type === 'warn')    return $dark ? '#f59e0b' : '#fcd34d';
    if ($type === 'error')   return $dark ? '#ef4444' : '#fca5a5';
    return $dark ? '#7c3aed' : '#c4b5fd';
  }};
  color: ${({ $type, $dark }) => {
    if ($type === 'success') return $dark ? '#4ade80' : '#15803d';
    if ($type === 'warn')    return $dark ? '#fbbf24' : '#92400e';
    if ($type === 'error')   return $dark ? '#f87171' : '#dc2626';
    return $dark ? '#c4b5fd' : '#5b21b6';
  }};
  i { flex-shrink: 0; margin-top: 0.1rem; }
`;

// ── Período (radio group estilizado) ──
const PeriodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const PeriodOption = styled.button`
  padding: 0.6rem 0.85rem;
  border-radius: 0.65rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  border: 1px solid ${({ $active, $dark }) =>
    $active ? '#7b3ff2' : $dark ? '#3b2960' : '#d8caef'};
  background: ${({ $active, $dark }) =>
    $active
      ? $dark ? 'rgba(123,63,242,0.22)' : 'rgba(123,63,242,0.10)'
      : $dark ? '#1a0e2e' : '#fff'};
  color: ${({ $active, $dark }) =>
    $active
      ? $dark ? '#e0d5ff' : '#5b21b6'
      : $dark ? '#c4b5fd' : '#5b21b6'};

  &:hover { border-color: #8f6de0; }
`;

// ── Seleção de funis (lista de toggles) ──
// auto-fill garante 2–3 colunas conforme a largura do card (que agora é maior),
// evitando a lista estreita e comprida que ficava ruim com 100+ funis.
const PipelineList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 0.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

// Bloco em destaque dos funis fixos (chamado de produto/manutenção), no topo.
const FixedGroup = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#5b3aa8' : '#c9b3f5')};
  background: ${({ $dark }) =>
    $dark ? 'rgba(123,63,242,0.14)' : 'rgba(123,63,242,0.06)'};
  border-radius: 0.85rem;
  padding: 0.8rem 0.9rem;
  margin-bottom: 0.85rem;
`;

const GroupLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.6rem;
  color: ${({ $dark }) => ($dark ? '#c9b3ff' : '#6e2fd6')};
`;

// Barra de filtro + a lista rolável dos demais funis.
const PipelineToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
`;

const PipelineCount = styled.span`
  flex-shrink: 0;
  font-size: 0.76rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
`;

const PipelineScroll = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding-right: 0.3rem;

  /* scrollbar discreta no tema escuro/claro */
  scrollbar-width: thin;
  scrollbar-color: ${({ $dark }) =>
    $dark ? '#3b2960 transparent' : '#d8caef transparent'};
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')};
    border-radius: 999px;
  }
`;

const EmptyHint = styled.p`
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
`;

const PipelineOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.65rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  border: 1px solid ${({ $active, $dark }) =>
    $active ? '#7b3ff2' : $dark ? '#3b2960' : '#d8caef'};
  background: ${({ $active, $dark }) =>
    $active
      ? $dark ? 'rgba(123,63,242,0.22)' : 'rgba(123,63,242,0.10)'
      : $dark ? '#1a0e2e' : '#fff'};
  color: ${({ $dark }) => ($dark ? '#e0d5ff' : '#5b21b6')};
  opacity: ${({ disabled, $active }) => (disabled && !$active ? 0.85 : 1)};

  &:hover { border-color: ${({ disabled }) => (disabled ? undefined : '#8f6de0')}; }

  i.check { flex-shrink: 0; font-size: 0.85rem; }
`;

const PipelineName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FixedTag = styled.span`
  flex-shrink: 0;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.12rem 0.4rem;
  border-radius: 0.4rem;
  background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.28)' : 'rgba(123,63,242,0.14)')};
  color: ${({ $dark }) => ($dark ? '#cdb6ff' : '#6e2fd6')};
`;

// ── Chips de contagem ──
const CountsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem;
  margin-top: 0.75rem;
`;

const CountCard = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#e0d5ff')};
  border-radius: 0.7rem;
  padding: 0.7rem 0.9rem;
  background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#fff')};
`;

const CountLabel = styled.div`
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ $dark }) => ($dark ? '#a892d9' : '#7c5ab7')};
`;

const CountValue = styled.div`
  margin-top: 0.2rem;
  font-size: 1.45rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#f5efff' : '#1E0C45')};
`;

// ── CTA ──
const CtaRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border-radius: 0.75rem;
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.88rem;
  font-weight: 700;
  transition: filter 0.15s, transform 0.1s;
  background: ${({ disabled, $variant }) =>
    disabled
      ? 'linear-gradient(90deg,#4b3a7a,#3d2d5c)'
      : $variant === 'secondary'
        ? 'transparent'
        : 'linear-gradient(90deg,#7b3ff2,#9a37eb)'};
  color: ${({ disabled, $variant }) =>
    disabled
      ? 'rgba(255,255,255,0.35)'
      : $variant === 'secondary'
        ? '#a892d9'
        : '#fff'};
  border: ${({ $variant, $dark }) =>
    $variant === 'secondary'
      ? `1px solid ${$dark ? '#3b2960' : '#d8caef'}`
      : 'none'};
  box-shadow: ${({ disabled, $variant }) =>
    disabled || $variant === 'secondary' ? 'none' : '0 4px 14px rgba(123,63,242,0.32)'};

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }
`;

// ── Progress bar ──
const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#ede8ff')};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => `${$pct}%`};
  background: linear-gradient(90deg, #7b3ff2, #9a37eb);
  transition: width 0.3s ease;
`;

// ── Sugestões de prompt ──
const PromptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const PromptCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#e0d5ff')};
  border-radius: 0.75rem;
  padding: 0.75rem 0.9rem;
  background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#fff')};
  transition: border-color 0.15s;

  &:hover { border-color: #8f6de0; }
`;

const PromptIcon = styled.div`
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.22)' : 'rgba(123,63,242,0.10)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#7b3ff2')};
  font-size: 0.9rem;
`;

const PromptInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PromptTitle = styled.div`
  font-size: 0.88rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#f2ebff' : '#2d165c')};
`;

const PromptDesc = styled.div`
  margin-top: 0.15rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: ${({ $dark }) => ($dark ? '#a892d9' : '#7f69ab')};
`;

const CopyButton = styled.button`
  flex-shrink: 0;
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  border: 1px solid ${({ $copied, $dark }) =>
    $copied ? (
      $dark ? '#22c55e' : '#16a34a'
    ) : ($dark ? '#3b2960' : '#d8caef')};
  background: ${({ $copied, $dark }) =>
    $copied
      ? ($dark ? 'rgba(34,197,94,0.12)' : '#f0fdf4')
      : ($dark ? 'rgba(123,63,242,0.18)' : 'rgba(123,63,242,0.08)')};
  color: ${({ $copied, $dark }) =>
    $copied
      ? ($dark ? '#4ade80' : '#15803d')
      : ($dark ? '#c4b5fd' : '#5b21b6')};

  &:hover { filter: brightness(1.05); }
`;

// ───────────────────────────────────────────────────────────────────────────────
// Constantes
// ───────────────────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: '7d',     label: 'Últimos 7 dias' },
  { value: '30d',    label: 'Último mês' },
  { value: '6m',     label: 'Últimos 6 meses' },
  { value: '1y',     label: 'Último ano' },
  { value: 'all',    label: 'Todo o período' },
  { value: 'custom', label: 'Data personalizada' },
];

const POLL_INTERVAL_MS = 1500;

// ───────────────────────────────────────────────────────────────────────────────
// Componente
// ───────────────────────────────────────────────────────────────────────────────
export default function PloomesTicketsSearch() {
  const { darkMode: $dark } = useDarkMode();

  const [partnersId, setPartnersId] = useState('');
  const [periodo, setPeriodo]       = useState('30d');
  const [dataInicio, setDataInicio] = useState('');

  // Funis: catálogo da conta interna + ids extras selecionados pelo usuário.
  // Os funis fixos (produto/manutenção) entram sempre e não são desmarcáveis.
  const [pipelines, setPipelines]             = useState([]);   // [{ id, nome, fixed }]
  const [pipelinesLoading, setPipelinesLoading] = useState(true);
  const [pipelinesError, setPipelinesError]   = useState(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState([]); // ids de funis extras
  const [pipelineFilter, setPipelineFilter]   = useState('');   // busca textual nos funis

  const [lookupLoading, setLookupLoading] = useState(false);
  const [contact, setContact]             = useState(null); // { contactId, nome, counts, dataInicio }

  const [jobId, setJobId]           = useState(null);
  const [jobStatus, setJobStatus]   = useState(null); // 'running' | 'completed' | 'error' | 'cancelled'
  const [progress, setProgress]     = useState({ progress: 0, total: 0, success: 0, failed: 0 });
  const [flash, setFlash]           = useState(null);
  const [copiedId, setCopiedId]     = useState(null);

  const pollRef = useRef(null);
  const copyTimerRef = useRef(null);

  // limpa polling / timers no unmount
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  // carrega a lista de funis da conta interna ao montar
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPloomesTicketsPipelines();
        if (!active) return;
        setPipelines(Array.isArray(data?.pipelines) ? data.pipelines : []);
      } catch (err) {
        if (active) setPipelinesError(err.message || 'Erro ao carregar funis.');
      } finally {
        if (active) setPipelinesLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const canLookup =
    partnersId.trim().length > 0 &&
    (periodo !== 'custom' || /^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) &&
    !lookupLoading &&
    !jobId;

  const resetExtraction = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setJobId(null);
    setJobStatus(null);
    setProgress({ progress: 0, total: 0, success: 0, failed: 0 });
  };

  // Marca/desmarca um funil extra. Funis fixos são ignorados (sempre incluídos).
  // Qualquer mudança invalida o lookup atual, pois muda a contagem a extrair.
  const toggleExtraPipeline = (id) => {
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (contact) { setContact(null); resetExtraction(); }
  };

  const handleLookup = async () => {
    setFlash(null);
    resetExtraction();
    setContact(null);
    setLookupLoading(true);
    try {
      const payload = { partnersId: partnersId.trim(), periodo, pipelineIds: selectedExtraIds };
      if (periodo === 'custom') payload.dataInicio = dataInicio;
      const data = await lookupPloomesContact(payload);
      setContact(data);
      if (data.counts.total === 0) {
        setFlash({ type: 'warn', text: 'Nenhum chamado encontrado no período selecionado.' });
      }
    } catch (err) {
      setFlash({ type: 'error', text: err.message || 'Erro ao consultar Ploomes.' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleStart = async () => {
    if (!contact) return;
    setFlash(null);
    try {
      const payload = {
        partnersId:  contact.partnersId,
        contactId:   contact.contactId,
        nome:        contact.nome,
        periodo,
        pipelineIds: contact.pipelineIds || selectedExtraIds,
      };
      if (periodo === 'custom') payload.dataInicio = dataInicio;
      const { jobId: newJobId } = await startPloomesTicketsJob(payload);
      setJobId(newJobId);
      setJobStatus('running');
      setProgress({ progress: 0, total: contact.counts.total, success: 0, failed: 0 });

      // Polling
      pollRef.current = setInterval(async () => {
        try {
          const s = await getPloomesTicketsJobStatus(newJobId);
          setJobStatus(s.status);
          setProgress({
            progress: s.progress || 0,
            total:    s.total    || 0,
            success:  s.success  || 0,
            failed:   s.failed   || 0,
          });
          if (s.status === 'completed') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            await triggerDownload(newJobId, contact.partnersId);
            setFlash({ type: 'success', text: 'Extração concluída. JSON disponível para download.' });
          } else if (s.status === 'error') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setFlash({ type: 'error', text: s.error || 'Falha durante a extração.' });
          } else if (s.status === 'cancelled') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setFlash({ type: 'warn', text: 'Extração cancelada.' });
          }
        } catch (err) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setFlash({ type: 'error', text: err.message || 'Erro ao consultar status do job.' });
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setFlash({ type: 'error', text: err.message || 'Erro ao iniciar extração.' });
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    try {
      await cancelPloomesTicketsJob(jobId);
    } catch (err) {
      setFlash({ type: 'error', text: err.message || 'Erro ao cancelar job.' });
    }
  };

  const triggerDownload = async (id, partnersIdSafe) => {
    try {
      const resp = await downloadPloomesTicketsJson(id);
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ploomes_tickets_${partnersIdSafe || id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setFlash({ type: 'error', text: err.message || 'Erro ao baixar arquivo.' });
    }
  };

  const handleCopyPrompt = async (prompt) => {
    const jsonFile = `ploomes_tickets_${contact?.partnersId || jobId}.json`;
    const text = prompt.build({
      nome:        contact?.nome || 'o cliente',
      periodoLabel: periodoToLabel(periodo, dataInicio),
      jsonFile,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(prompt.id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setFlash({ type: 'error', text: 'Não foi possível copiar. Copie manualmente o texto do prompt.' });
    }
  };

  const handleNewSearch = () => {
    setContact(null);
    setFlash(null);
    setCopiedId(null);
    setSelectedExtraIds([]);
    resetExtraction();
  };

  const progressPct = progress.total > 0
    ? Math.min(100, Math.round((progress.progress / progress.total) * 100))
    : 0;

  const flashIcon = {
    success: 'pi-check-circle',
    warn:    'pi-exclamation-triangle',
    error:   'pi-times-circle',
    info:    'pi-info-circle',
  };

  const isRunning = jobStatus === 'running';
  const isFinal   = jobStatus === 'completed' || jobStatus === 'error' || jobStatus === 'cancelled';

  // Funis fixos (chamado de produto/manutenção) ficam em destaque no topo; os
  // demais vão para a lista rolável e respondem ao filtro de busca.
  const fixedPipelines = pipelines.filter((p) => p.fixed);
  const otherPipelines = pipelines.filter((p) => !p.fixed);
  const filterTerm = pipelineFilter.trim().toLowerCase();
  const filteredOthers = filterTerm
    ? otherPipelines.filter((p) => p.nome.toLowerCase().includes(filterTerm))
    : otherPipelines;
  const pipelinesLocked = !!jobId && !isFinal;

  return (
    <Page>
      <Card $dark={$dark}>
        <ServiceHeader
          variant="band"
          platforms={['ploomes']}
          title="Extração de Chamados"
          subtitle="Extraia o histórico de chamados (produto e manutenção) de um cliente em JSON para análise externa."
        />

        <CardBody>
          {flash && (
            <Banner $type={flash.type} $dark={$dark}>
              <i className={`pi ${flashIcon[flash.type] ?? 'pi-info-circle'}`} />
              <span>{flash.text}</span>
            </Banner>
          )}

          {/* ── Step 1: Identificação ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done={!!contact} $dark={$dark}>
                {contact ? <i className="pi pi-check" style={{ fontSize: '0.68rem' }} /> : '1'}
              </StepBadge>
              <SectionTitle $dark={$dark}>Identificação do cliente</SectionTitle>
            </SectionHeader>

            <Field>
              <Label $dark={$dark}>ID do cliente no Partners</Label>
              <StyledInput
                $dark={$dark}
                value={partnersId}
                onChange={(e) => {
                  setPartnersId(e.target.value);
                  if (contact) { setContact(null); resetExtraction(); }
                }}
                placeholder="Ex.: 1006594"
                disabled={!!jobId && !isFinal}
              />
              <FieldHint $dark={$dark}>
                ID do cliente no Partners — usado para localizar o ContactId correspondente no Ploomes interno.
              </FieldHint>
            </Field>
          </Section>

          {/* ── Step 2: Período ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done={false} $dark={$dark}>2</StepBadge>
              <SectionTitle $dark={$dark}>Período</SectionTitle>
            </SectionHeader>

            <PeriodGrid>
              {PERIOD_OPTIONS.map((opt) => (
                <PeriodOption
                  key={opt.value}
                  $active={periodo === opt.value}
                  $dark={$dark}
                  onClick={() => {
                    setPeriodo(opt.value);
                    if (contact) { setContact(null); resetExtraction(); }
                  }}
                  disabled={!!jobId && !isFinal}
                  type="button"
                >
                  {opt.label}
                </PeriodOption>
              ))}
            </PeriodGrid>

            {periodo === 'custom' && (
              <Field style={{ marginTop: '0.85rem' }}>
                <Label $dark={$dark}>Data de início</Label>
                <SingleDatePicker
                  darkMode={$dark}
                  value={dateStringToDate(dataInicio)}
                  onChange={(d) => {
                    setDataInicio(dateToDateString(d));
                    if (contact) { setContact(null); resetExtraction(); }
                  }}
                  maxDate={new Date()}
                  disabled={!!jobId && !isFinal}
                  maxWidth="240px"
                />
                <FieldHint $dark={$dark}>
                  Considera chamados criados após essa data.
                </FieldHint>
              </Field>
            )}
          </Section>

          {/* ── Step 3: Funis ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done={!pipelinesLoading && !pipelinesError} $dark={$dark}>3</StepBadge>
              <SectionTitle $dark={$dark}>Funis a incluir</SectionTitle>
            </SectionHeader>

            <FieldHint $dark={$dark} style={{ margin: '0 0 0.85rem' }}>
              Os funis de <strong>Produto</strong> e <strong>Manutenção</strong> são sempre incluídos.
              Marque outros funis para extrair também os dados e o histórico do cliente neles.
            </FieldHint>

            {pipelinesLoading ? (
              <FieldHint $dark={$dark} style={{ margin: 0 }}>
                <i className="pi pi-spin pi-spinner" style={{ marginRight: '0.4rem' }} />
                Carregando funis…
              </FieldHint>
            ) : pipelinesError ? (
              <Banner $type="error" $dark={$dark}>
                <i className="pi pi-times-circle" />
                <span>{pipelinesError}</span>
              </Banner>
            ) : (
              <>
                {/* Funis fixos em destaque, sempre no topo */}
                {fixedPipelines.length > 0 && (
                  <FixedGroup $dark={$dark}>
                    <GroupLabel $dark={$dark}>
                      <i className="pi pi-star-fill" style={{ fontSize: '0.7rem' }} />
                      Sempre incluídos
                    </GroupLabel>
                    <PipelineList>
                      {fixedPipelines.map((p) => (
                        <PipelineOption
                          key={p.id}
                          type="button"
                          $active
                          $dark={$dark}
                          disabled
                        >
                          <i className="check pi pi-check-circle" />
                          <PipelineName>{p.nome}</PipelineName>
                          <FixedTag $dark={$dark}>fixo</FixedTag>
                        </PipelineOption>
                      ))}
                    </PipelineList>
                  </FixedGroup>
                )}

                {/* Demais funis da conta: busca + lista rolável */}
                <PipelineToolbar>
                  <StyledInput
                    $dark={$dark}
                    value={pipelineFilter}
                    onChange={(e) => setPipelineFilter(e.target.value)}
                    placeholder="Filtrar funis pelo nome…"
                    disabled={pipelinesLocked}
                  />
                  <PipelineCount $dark={$dark}>
                    {filteredOthers.length} de {otherPipelines.length}
                  </PipelineCount>
                </PipelineToolbar>

                {filteredOthers.length === 0 ? (
                  <EmptyHint $dark={$dark}>
                    Nenhum funil corresponde a “{pipelineFilter.trim()}”.
                  </EmptyHint>
                ) : (
                  <PipelineScroll $dark={$dark}>
                    <PipelineList>
                      {filteredOthers.map((p) => {
                        const active = selectedExtraIds.includes(p.id);
                        return (
                          <PipelineOption
                            key={p.id}
                            type="button"
                            $active={active}
                            $dark={$dark}
                            disabled={pipelinesLocked}
                            onClick={() => { if (!pipelinesLocked) toggleExtraPipeline(p.id); }}
                          >
                            <i className={`check pi ${active ? 'pi-check-circle' : 'pi-circle'}`} />
                            <PipelineName>{p.nome}</PipelineName>
                          </PipelineOption>
                        );
                      })}
                    </PipelineList>
                  </PipelineScroll>
                )}
              </>
            )}
          </Section>

          {/* ── Step 4: Confirmação ── */}
          {contact && (
            <Section $dark={$dark}>
              <SectionHeader>
                <StepBadge $done={contact.counts.total > 0} $dark={$dark}>4</StepBadge>
                <SectionTitle $dark={$dark}>Cliente encontrado</SectionTitle>
              </SectionHeader>

              <div style={{ fontSize: '0.95rem', color: $dark ? '#f2ebff' : '#1E0C45' }}>
                <strong>{contact.nome}</strong>
                <span style={{ marginLeft: '0.6rem', fontSize: '0.78rem', color: $dark ? '#9ca3af' : '#7f69ab' }}>
                  ContactId: {contact.contactId}
                </span>
              </div>

              <CountsRow>
                {(contact.counts.porFunil || []).map((f) => (
                  <CountCard key={f.id} $dark={$dark}>
                    <CountLabel $dark={$dark}>Funil {f.nome}</CountLabel>
                    <CountValue $dark={$dark}>{f.total}</CountValue>
                  </CountCard>
                ))}
                <CountCard $dark={$dark}>
                  <CountLabel $dark={$dark}>Total a extrair</CountLabel>
                  <CountValue $dark={$dark}>{contact.counts.total}</CountValue>
                </CountCard>
              </CountsRow>

              <FieldHint $dark={$dark}>
                {contact.dataInicio
                  ? <>Considerando chamados criados após <strong>{contact.dataInicio}</strong>.</>
                  : <>Considerando todos os chamados (sem filtro de data).</>}
              </FieldHint>
            </Section>
          )}

          {/* ── Progresso ── */}
          {jobId && (
            <Section $dark={$dark}>
              <SectionHeader>
                <StepBadge $done={jobStatus === 'completed'} $dark={$dark}>
                  {jobStatus === 'completed'
                    ? <i className="pi pi-check" style={{ fontSize: '0.68rem' }} />
                    : '5'}
                </StepBadge>
                <SectionTitle $dark={$dark}>Extração</SectionTitle>
              </SectionHeader>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: $dark ? '#dacdf8' : '#4f2e84' }}>
                <span>{progress.progress} / {progress.total} chamados</span>
                <span>{progressPct}%</span>
              </div>
              <ProgressTrack $dark={$dark}>
                <ProgressFill $pct={progressPct} />
              </ProgressTrack>

              {(progress.success > 0 || progress.failed > 0) && (
                <FieldHint $dark={$dark}>
                  Sucesso: <strong>{progress.success}</strong> · Falhas: <strong>{progress.failed}</strong>
                </FieldHint>
              )}
            </Section>
          )}

          {/* ── Sugestões de prompt (ao concluir) ── */}
          {jobStatus === 'completed' && (
            <Section $dark={$dark}>
              <SectionHeader>
                <StepBadge $done $dark={$dark}>
                  <i className="pi pi-sparkles" style={{ fontSize: '0.68rem' }} />
                </StepBadge>
                <SectionTitle $dark={$dark}>Prompts para o Claude</SectionTitle>
              </SectionHeader>

              <FieldHint $dark={$dark} style={{ margin: '0 0 0.85rem' }}>
                Copie um prompt e envie ao Claude Chat <strong>anexando o arquivo JSON baixado</strong>.
                Campos entre <code>{'{chaves}'}</code> ainda precisam ser preenchidos por você.
              </FieldHint>

              <PromptList>
                {PLOOMES_TICKETS_PROMPTS.map((prompt) => {
                  const copied = copiedId === prompt.id;
                  return (
                    <PromptCard key={prompt.id} $dark={$dark}>
                      <PromptIcon $dark={$dark}>
                        <i className={`pi ${prompt.icon}`} />
                      </PromptIcon>
                      <PromptInfo>
                        <PromptTitle $dark={$dark}>{prompt.titulo}</PromptTitle>
                        <PromptDesc $dark={$dark}>{prompt.descricao}</PromptDesc>
                      </PromptInfo>
                      <CopyButton
                        $copied={copied}
                        $dark={$dark}
                        onClick={() => handleCopyPrompt(prompt)}
                        type="button"
                      >
                        {copied
                          ? <><i className="pi pi-check" /> Copiado</>
                          : <><i className="pi pi-copy" /> Copiar</>}
                      </CopyButton>
                    </PromptCard>
                  );
                })}
              </PromptList>
            </Section>
          )}

          {/* ── CTAs ── */}
          <CtaRow>
            {!jobId && !contact && (
              <ActionButton
                disabled={!canLookup}
                onClick={canLookup ? handleLookup : undefined}
                type="button"
              >
                {lookupLoading
                  ? <><i className="pi pi-spin pi-spinner" /> Consultando…</>
                  : <><i className="pi pi-search" /> Consultar cliente</>}
              </ActionButton>
            )}

            {!jobId && contact && (
              <>
                <ActionButton
                  $variant="secondary"
                  $dark={$dark}
                  onClick={handleNewSearch}
                  type="button"
                >
                  <i className="pi pi-refresh" /> Nova consulta
                </ActionButton>
                <ActionButton
                  disabled={contact.counts.total === 0}
                  onClick={contact.counts.total > 0 ? handleStart : undefined}
                  type="button"
                >
                  <i className="pi pi-play" /> Iniciar extração
                </ActionButton>
              </>
            )}

            {jobId && isRunning && (
              <ActionButton
                $variant="secondary"
                $dark={$dark}
                onClick={handleCancel}
                type="button"
              >
                <i className="pi pi-times" /> Cancelar
              </ActionButton>
            )}

            {jobId && isFinal && (
              <>
                <ActionButton
                  $variant="secondary"
                  $dark={$dark}
                  onClick={handleNewSearch}
                  type="button"
                >
                  <i className="pi pi-refresh" /> Nova consulta
                </ActionButton>
                {jobStatus === 'completed' && (
                  <ActionButton
                    onClick={() => triggerDownload(jobId, contact?.partnersId)}
                    type="button"
                  >
                    <i className="pi pi-download" /> Baixar JSON novamente
                  </ActionButton>
                )}
              </>
            )}
          </CtaRow>
        </CardBody>
      </Card>
    </Page>
  );
}
