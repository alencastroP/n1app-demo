import { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS } from '../config/teamsConfig';
import { listIntercomTags, executeChurnJob, downloadChurnXlsx } from '../services/intercomService';
import { CopyButton } from '../design-system/components/CopyButton';
import { CHURN_CLAUDE_PROMPT } from '../config/churnClaudePrompt';
import ServiceHeader from '../components/ServiceHeader';

// ---------------------------------------------------------------------------
// Global dialog style
// ---------------------------------------------------------------------------
const GlobalDialogStyle = createGlobalStyle`
  .churn-confirm-dialog {
    background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#ffffff')} !important;
    border: 1px solid ${({ $dark }) => ($dark ? '#2d2244' : '#e6def5')} !important;
    border-radius: 1rem !important;
    box-shadow: ${({ $dark }) =>
      $dark ? '0 16px 32px rgba(0,0,0,0.45)' : '0 12px 26px rgba(78,46,143,0.16)'} !important;
  }
  .churn-confirm-dialog .p-dialog-header {
    background: ${({ $dark }) => ($dark ? '#21123a' : '#f8f5ff')} !important;
    color: ${({ $dark }) => ($dark ? '#efeaff' : '#1E0C45')} !important;
    border-bottom: 1px solid ${({ $dark }) => ($dark ? '#332356' : '#ebe3f8')} !important;
    border-radius: 1rem 1rem 0 0 !important;
  }
  .churn-confirm-dialog .p-dialog-content {
    background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#ffffff')} !important;
    color: ${({ $dark }) => ($dark ? '#efeaff' : '#1E0C45')} !important;
    padding: 1.2rem 1.4rem !important;
  }
  .churn-confirm-dialog .p-dialog-footer {
    background: ${({ $dark }) => ($dark ? '#21123a' : '#f8f5ff')} !important;
    border-top: 1px solid ${({ $dark }) => ($dark ? '#332356' : '#ebe3f8')} !important;
    border-radius: 0 0 1rem 1rem !important;
    padding: 0.75rem 1rem !important;
  }
`;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const Page = styled.div`
  min-height: 100vh;
  padding: 1.4rem 1.2rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Card = styled.div`
  width: 100%;
  max-width: 780px;
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

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------
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
  box-shadow: 0 2px 6px rgba(116,67,246,0.28);
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

// ---------------------------------------------------------------------------
// Toggle (tipo / modo)
// ---------------------------------------------------------------------------
const TypeToggle = styled.div`
  display: inline-flex;
  border-radius: 0.6rem;
  overflow: hidden;
  border: 1px solid ${({ $dark }) => ($dark ? '#3a2a6a' : '#ddd6fe')};
`;

const TypeBtn = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.84rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: ${({ $active, $dark }) =>
    $active
      ? $dark ? 'linear-gradient(90deg,#5b14b8,#6e10a5)' : 'linear-gradient(90deg,#7b3ff2,#9a37eb)'
      : $dark ? '#1a0e2e' : '#f5f3ff'};
  color: ${({ $active, $dark }) =>
    $active ? '#fff' : $dark ? '#c4b5fd' : '#5b21b6'};

  &:hover:not([data-active='true']) {
    background: ${({ $dark }) => ($dark ? '#2b1f49' : '#ede8ff')};
  }
`;

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
const inputBase = `
  && {
    width: 100%;
    border-radius: 0.65rem !important;
    border: 1px solid transparent !important;
    transition: border-color .2s, box-shadow .2s;
    &:hover { border-color: #8f6de0 !important; }
    &:focus-within { border-color: #8f6de0 !important; box-shadow: 0 0 0 3px rgba(143,109,224,.18) !important; }
  }
`;

const StyledInput = styled(InputText)`
  ${inputBase}
  && {
    background: ${({ $dark }) => ($dark ? '#291b45' : '#ffffff')} !important;
    color: ${({ $dark }) => ($dark ? '#f5efff' : '#24134a')} !important;
    border-color: ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')} !important;
    padding: 0.6rem 0.85rem !important;
    font-size: 0.9rem !important;
    min-height: 42px;
    &::placeholder { color: ${({ $dark }) => ($dark ? '#6b5890' : '#a78bca')} !important; }
  }
`;

// ---------------------------------------------------------------------------
// Banner (flash / info)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Tag list
// ---------------------------------------------------------------------------
const TagSearchRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.6rem;
`;

const TagListBox = styled.div`
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#e5d9f8')};
  border-radius: 0.65rem;
  background: ${({ $dark }) => ($dark ? '#130a24' : '#fff')};

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')};
    border-radius: 3px;
  }
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid ${({ $dark }) => ($dark ? '#1f1438' : '#f3eeff')};
  background: ${({ $selected, $dark }) =>
    $selected
      ? $dark ? 'rgba(123,63,242,0.18)' : 'rgba(123,63,242,0.07)'
      : 'transparent'};
  transition: background 0.12s;

  &:last-child { border-bottom: none; }

  &:hover {
    background: ${({ $selected, $dark }) =>
      $selected
        ? $dark ? 'rgba(123,63,242,0.22)' : 'rgba(123,63,242,0.11)'
        : $dark ? 'rgba(255,255,255,0.04)' : 'rgba(123,63,242,0.04)'};
  }
`;

const TagName = styled.span`
  font-size: 0.84rem;
  font-weight: ${({ $selected }) => ($selected ? 700 : 500)};
  color: ${({ $selected, $dark }) =>
    $selected
      ? $dark ? '#c4b5fd' : '#6d28d9'
      : $dark ? '#e0d6f8' : '#3b2163'};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 0.5rem;
`;

const TagIdPill = styled.span`
  flex-shrink: 0;
  font-size: 0.73rem;
  font-family: monospace;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: ${({ $selected, $dark }) =>
    $selected
      ? $dark ? 'rgba(123,63,242,0.28)' : 'rgba(123,63,242,0.12)'
      : $dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
  color: ${({ $selected, $dark }) =>
    $selected
      ? $dark ? '#c4b5fd' : '#7b3ff2'
      : $dark ? '#9ca3af' : '#6b7280'};
  border: 1px solid ${({ $selected, $dark }) =>
    $selected
      ? $dark ? '#7c3aed' : '#c4b5fd'
      : $dark ? '#2f2150' : '#e0d9f0'};
`;

const EmptyList = styled.div`
  padding: 1.5rem;
  text-align: center;
  font-size: 0.83rem;
  color: ${({ $dark }) => ($dark ? '#6b5890' : '#a78bca')};
`;

const TagCount = styled.span`
  font-size: 0.78rem;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
`;

const LoadBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border-radius: 0.65rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  border: 1px solid ${({ $dark }) => ($dark ? '#5b14b8' : '#c4b5fd')};
  background: ${({ $dark }) =>
    $dark ? 'rgba(91,20,184,0.15)' : 'rgba(123,63,242,0.07)'};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#7b3ff2')};
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: ${({ $dark }) =>
      $dark ? 'rgba(91,20,184,0.25)' : 'rgba(123,63,242,0.13)'};
  }

  i { font-size: 0.82rem; }
`;

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------
const CtaSection = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
  background: ${({ $dark }) => ($dark ? '#1c1033' : '#fcfaff')};
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CtaSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
  min-width: 0;
`;

const ChipRow = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  background: ${({ $ok, $dark }) =>
    $ok
      ? $dark ? 'rgba(34,197,94,0.13)' : '#dcfce7'
      : $dark ? 'rgba(239,68,68,0.13)' : '#fee2e2'};
  color: ${({ $ok, $dark }) =>
    $ok
      ? $dark ? '#4ade80' : '#15803d'
      : $dark ? '#f87171' : '#dc2626'};
  border: 1px solid ${({ $ok, $dark }) =>
    $ok
      ? $dark ? '#22c55e' : '#86efac'
      : $dark ? '#ef4444' : '#fca5a5'};

  i { font-size: 0.68rem; }
`;

const CtaHint = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${({ $dark }) => ($dark ? '#ad9bce' : '#7f69ab')};
`;

const ExecButton = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.88rem;
  font-weight: 700;
  transition: filter 0.15s, transform 0.1s;
  background: ${({ disabled }) =>
    disabled
      ? 'linear-gradient(90deg,#4b3a7a,#3d2d5c)'
      : 'linear-gradient(90deg,#7b3ff2,#9a37eb)'};
  color: ${({ disabled }) => (disabled ? 'rgba(255,255,255,0.35)' : '#fff')};
  box-shadow: ${({ disabled }) =>
    disabled ? 'none' : '0 4px 14px rgba(123,63,242,0.32)'};

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  i { font-size: 0.95rem; }
`;

// ---------------------------------------------------------------------------
// Result panel (conclusão do job)
// ---------------------------------------------------------------------------
const ResultPanel = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
  background: ${({ $dark }) => ($dark ? '#1c1033' : '#fcfaff')};
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const ResultTitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b21b6')};
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const ResultActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const ResultHint = styled.p`
  margin: 0;
  font-size: 0.79rem;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
  line-height: 1.5;
`;

// ---------------------------------------------------------------------------
// Progress panel (enquanto o N8N processa)
// ---------------------------------------------------------------------------
const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(123,63,242,0.45); }
  70%  { box-shadow: 0 0 0 14px rgba(123,63,242,0); }
  100% { box-shadow: 0 0 0 0 rgba(123,63,242,0); }
`;

const slide = keyframes`
  0%   { left: -42%; }
  100% { left: 100%; }
`;

const ProgressPanel = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#3a2a6a' : '#ddd6fe')};
  background: ${({ $dark }) =>
    $dark
      ? 'linear-gradient(135deg,#1d1140,#241149)'
      : 'linear-gradient(135deg,#faf7ff,#f1eaff)'};
  border-radius: 1rem;
  padding: 1.3rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ProgressTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
`;

const PulseIcon = styled.div`
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7b3ff2, #9a37eb);
  color: #fff;
  font-size: 1.2rem;
  animation: ${pulse} 1.8s infinite;
`;

const ProgressTitle = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#f2ebff' : '#3b2163')};
`;

const ProgressSub = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  color: ${({ $dark }) => ($dark ? '#b8a8d8' : '#6f58a1')};
`;

const ElapsedBadge = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  font-family: monospace;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 0.6rem;
  background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.2)' : 'rgba(123,63,242,0.1)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#7b3ff2')};
  border: 1px solid ${({ $dark }) => ($dark ? '#5b14b8' : '#c4b5fd')};
`;

const Track = styled.div`
  position: relative;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: ${({ $dark }) => ($dark ? '#2a1c47' : '#e9e0fb')};
`;

const Indeterminate = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 42%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(123,63,242,0.2), #9a37eb, rgba(123,63,242,0.2));
  animation: ${slide} 1.5s ease-in-out infinite;
`;

const ProgressNote = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
`;

// ---------------------------------------------------------------------------
// Error panel (falha na execução — com retry)
// ---------------------------------------------------------------------------
const ErrorPanel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  background: ${({ $dark }) => ($dark ? 'rgba(239,68,68,0.1)' : '#fef2f2')};
  border: 1px solid ${({ $dark }) => ($dark ? '#ef4444' : '#fca5a5')};

  > i {
    flex-shrink: 0;
    margin-top: 0.15rem;
    font-size: 1.1rem;
    color: ${({ $dark }) => ($dark ? '#f87171' : '#dc2626')};
  }

  strong {
    display: block;
    font-size: 0.9rem;
    color: ${({ $dark }) => ($dark ? '#fca5a5' : '#b91c1c')};
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.83rem;
    line-height: 1.5;
    color: ${({ $dark }) => ($dark ? '#f0a8a8' : '#dc2626')};
    word-break: break-word;
  }
`;

// ---------------------------------------------------------------------------
// Mode options
// ---------------------------------------------------------------------------
const MODE_OPTIONS = [
  { label: 'Por Tag', value: 'tag' },
  { label: 'Por ID de Empresa', value: 'id' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function IntercomChurnSearch() {
  const { darkMode: $dark } = useDarkMode();
  const { canService } = useUserProfile();

  const [tags, setTags] = useState([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showTagList, setShowTagList] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  const [mode, setMode] = useState('tag');
  const [tagId, setTagId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [diasLimite, setDiasLimite] = useState('');

  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null); // { jobId, total }
  const [elapsed, setElapsed] = useState(0); // segundos decorridos durante o processamento

  // Cronômetro de acompanhamento enquanto o N8N processa
  useEffect(() => {
    if (!loading) return undefined;
    setElapsed(0);
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [loading]);

  if (!canService(SERVICE_KEYS.INTERCOM_CHURN)) {
    return (
      <Page>
        <Card $dark={$dark} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <i className="pi pi-lock" style={{ fontSize: '2.5rem', color: $dark ? '#f87171' : '#dc2626', display: 'block', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: $dark ? '#efeaff' : '#1E0C45' }}>Acesso restrito</h3>
          <p style={{ margin: 0, color: $dark ? '#9ca3af' : '#6b7280', fontSize: '0.9rem' }}>Você não tem permissão para acessar este módulo.</p>
        </Card>
      </Page>
    );
  }


  const filteredTags = tags.filter((t) => {
    if (!tagSearch.trim()) return true;
    const q = tagSearch.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.id.includes(q);
  });

  const handleLoadTags = async () => {
    setTagsLoading(true);
    setFlash(null);
    try {
      const tagsResult = await listIntercomTags();
      const sorted = [...(tagsResult.tags || [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      );
      setTags(sorted);
      setTagsLoaded(true);
      setShowTagList(true);
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    } finally {
      setTagsLoading(false);
    }
  };

  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    setTagId(tag.id);
    setShowTagList(false);
    setTagSearch('');
    setFlash(null);
  };

  const handleClearTag = () => {
    setSelectedTag(null);
    setTagId('');
    setShowTagList(true);
  };

  const handleModeChange = (val) => {
    setMode(val);
    setFlash(null);
  };

  const handleTagIdChange = (e) => {
    setTagId(e.target.value);
    if (selectedTag && e.target.value !== selectedTag.id) setSelectedTag(null);
  };

  const idFilled = mode === 'tag' ? tagId.trim().length > 0 : companyId.trim().length > 0;
  const daysFilled = diasLimite.trim() !== '' && Number(diasLimite) > 0;
  const canExecute = !loading && idFilled && daysFilled;

  const handleExecute = () => {
    setFlash(null);
    setConfirmOpen(true);
  };

  const doExecute = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setFlash(null);
    setResult(null);

    const payload = { modo: mode };
    if (mode === 'tag') payload.tag_id = tagId.trim();
    if (mode === 'id') payload.company_id = companyId.trim();
    const days = Number(diasLimite);
    if (diasLimite !== '' && Number.isFinite(days) && days > 0) {
      payload.dias_limite = days;
    }

    try {
      const completed = await executeChurnJob(payload, {
        onProgress: (data) => {
          if (data.type === 'start') {
            setFlash({ type: 'info', text: 'Análise iniciada — aguardando N8N…' });
          }
        },
      });

      // completed = { type: 'complete', jobId, total }
      setResult({ jobId: completed.jobId, total: completed.total ?? 0 });
      setFlash({
        type: 'success',
        text: `Extração concluída: ${completed.total ?? 0} conversa(s) disponíveis para download.`,
      });
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!result) return;
    try {
      const resp = await downloadChurnXlsx(result.jobId, format);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `churn_${result.jobId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setFlash({ type: 'error', text: `Erro ao baixar .${format}: ${err.message}` });
    }
  };

  const flashIcon = {
    success: 'pi-check-circle',
    warn: 'pi-exclamation-triangle',
    error: 'pi-times-circle',
    info: 'pi-info-circle',
  };

  const confirmLabel =
    mode === 'tag'
      ? `Tag ID: ${tagId}${selectedTag ? ` (${selectedTag.name})` : ''}`
      : `Empresa ID: ${companyId}`;

  // Acompanhamento do processamento
  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const stageMsg =
    elapsed < 8
      ? 'Acionando o fluxo no N8N…'
      : elapsed < 30
        ? 'Buscando empresas e contatos no Intercom…'
        : elapsed < 90
          ? 'Coletando e tratando as conversas…'
          : 'Ainda processando — buscas amplas podem levar alguns minutos…';

  return (
    <Page>
      <GlobalDialogStyle $dark={$dark} />

      <Card $dark={$dark}>
        <ServiceHeader
          variant="band"
          platforms={['intercom']}
          title="Buscas Intercom"
          subtitle="Dispare fluxos de análise de churn no N8N via tags ou ID de empresa."
        />

        <CardBody>
          {/* ── Flash (sucesso / info / aviso) ── */}
          {flash && flash.type !== 'error' && !loading && (
            <Banner $type={flash.type} $dark={$dark}>
              <i className={`pi ${flashIcon[flash.type] ?? 'pi-info-circle'}`} />
              <span>{flash.text}</span>
            </Banner>
          )}

          {/* ── Erro (com destaque + retry) ── */}
          {flash && flash.type === 'error' && !loading && (
            <ErrorPanel $dark={$dark}>
              <i className="pi pi-exclamation-triangle" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>Não foi possível concluir a busca</strong>
                <p>{flash.text}</p>
              </div>
              {canExecute && (
                <LoadBtn $dark={$dark} type="button" onClick={handleExecute} style={{ flexShrink: 0, alignSelf: 'center' }}>
                  <i className="pi pi-refresh" /> Tentar novamente
                </LoadBtn>
              )}
            </ErrorPanel>
          )}

          {/* ── Step 1: Modo de Envio ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done $dark={$dark}>
                <i className="pi pi-check" style={{ fontSize: '0.68rem' }} />
              </StepBadge>
              <SectionTitle $dark={$dark}>Modo de Envio</SectionTitle>
            </SectionHeader>
            <TypeToggle $dark={$dark}>
              {MODE_OPTIONS.map((opt) => (
                <TypeBtn
                  key={opt.value}
                  $active={mode === opt.value}
                  $dark={$dark}
                  data-active={mode === opt.value}
                  onClick={() => handleModeChange(opt.value)}
                  type="button"
                >
                  {opt.label}
                </TypeBtn>
              ))}
            </TypeToggle>
            <FieldHint $dark={$dark}>
              {mode === 'tag'
                ? 'Envia o fluxo para todas as empresas associadas a uma tag no Intercom.'
                : 'Envia o fluxo para uma empresa específica pelo ID do Intercom.'}
            </FieldHint>
          </Section>

          {/* ── Step 2: configuração conforme o modo ── */}
          {mode === 'tag' ? (
            <Section $dark={$dark}>
              <SectionHeader>
                <StepBadge $done={!!tagId.trim()} $dark={$dark}>
                  {tagId.trim() ? <i className="pi pi-check" style={{ fontSize: '0.68rem' }} /> : '2'}
                </StepBadge>
                <SectionTitle $dark={$dark}>Selecionar Tag</SectionTitle>
                {tagsLoaded && (
                  <TagCount $dark={$dark} style={{ marginLeft: 'auto' }}>
                    {tags.length} tag{tags.length !== 1 ? 's' : ''} carregada{tags.length !== 1 ? 's' : ''}
                  </TagCount>
                )}
              </SectionHeader>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <LoadBtn
                  $dark={$dark}
                  onClick={handleLoadTags}
                  disabled={tagsLoading}
                  type="button"
                >
                  {tagsLoading
                    ? <><i className="pi pi-spin pi-spinner" /> Carregando…</>
                    : <><i className="pi pi-refresh" /> {tagsLoaded ? 'Recarregar Tags' : 'Carregar Tags'}</>}
                </LoadBtn>

                {tagsLoaded && (
                  <LoadBtn
                    $dark={$dark}
                    onClick={() => setShowTagList((v) => !v)}
                    type="button"
                  >
                    <i className={`pi ${showTagList ? 'pi-chevron-up' : 'pi-list'}`} />
                    {showTagList ? 'Fechar lista' : 'Ver lista'}
                  </LoadBtn>
                )}
              </div>

              {tagsLoaded && selectedTag && !showTagList && (
                <Banner $type="info" $dark={$dark} style={{ marginTop: '0.75rem' }}>
                  <i className="pi pi-check-circle" />
                  <span>Tag selecionada: <strong>{selectedTag.name}</strong> — ID <code>{selectedTag.id}</code></span>
                </Banner>
              )}

              {tagsLoaded && showTagList && (
                <>
                  <TagSearchRow style={{ marginTop: '0.75rem' }}>
                    <StyledInput
                      $dark={$dark}
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="Buscar tag por nome ou ID…"
                      style={{ flex: 1 }}
                    />
                    {tagSearch && (
                      <button
                        onClick={() => setTagSearch('')}
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: $dark ? '#9ca3af' : '#6b7280',
                          padding: '0 0.25rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        <i className="pi pi-times" />
                      </button>
                    )}
                  </TagSearchRow>

                  <TagListBox $dark={$dark}>
                    {filteredTags.length === 0 ? (
                      <EmptyList $dark={$dark}>
                        {tagSearch ? 'Nenhuma tag encontrada para essa busca.' : 'Nenhuma tag disponível.'}
                      </EmptyList>
                    ) : (
                      filteredTags.map((tag) => {
                        const isSel = selectedTag?.id === tag.id;
                        return (
                          <TagItem
                            key={tag.id}
                            $selected={isSel}
                            $dark={$dark}
                            onClick={() => handleSelectTag(tag)}
                          >
                            <TagName $selected={isSel} $dark={$dark}>{tag.name}</TagName>
                            <TagIdPill $selected={isSel} $dark={$dark}>{tag.id}</TagIdPill>
                          </TagItem>
                        );
                      })
                    )}
                  </TagListBox>

                  <FieldHint $dark={$dark} style={{ marginTop: '0.5rem' }}>
                    Clique em uma tag para selecioná-la e fechar a lista automaticamente.
                    {filteredTags.length !== tags.length && (
                      <> Exibindo <strong>{filteredTags.length}</strong> de <strong>{tags.length}</strong>.</>
                    )}
                  </FieldHint>
                </>
              )}

              <Field style={{ marginTop: '0.85rem' }}>
                <Label $dark={$dark}>ID da Tag *</Label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StyledInput
                    $dark={$dark}
                    value={tagId}
                    onChange={selectedTag ? undefined : handleTagIdChange}
                    readOnly={!!selectedTag}
                    placeholder="Ex.: 14524371"
                    style={{
                      flex: 1,
                      opacity: selectedTag ? 0.75 : 1,
                      cursor: selectedTag ? 'default' : 'text',
                    }}
                  />
                  {selectedTag && (
                    <LoadBtn $dark={$dark} onClick={handleClearTag} type="button" style={{ flexShrink: 0 }}>
                      <i className="pi pi-times" /> Limpar
                    </LoadBtn>
                  )}
                </div>
                <FieldHint $dark={$dark}>
                  {selectedTag
                    ? <>Campo travado — tag <strong>{selectedTag.name}</strong> selecionada. Clique em "Limpar" para alterar.</>
                    : 'Carregue e selecione uma tag na lista acima, ou insira o ID manualmente.'}
                </FieldHint>
              </Field>
            </Section>
          ) : (
            <Section $dark={$dark}>
              <SectionHeader>
                <StepBadge $done={!!companyId.trim()} $dark={$dark}>
                  {companyId.trim() ? <i className="pi pi-check" style={{ fontSize: '0.68rem' }} /> : '2'}
                </StepBadge>
                <SectionTitle $dark={$dark}>ID da Empresa</SectionTitle>
              </SectionHeader>
              <Field>
                <Label $dark={$dark}>ID da Empresa (Intercom) *</Label>
                <StyledInput
                  $dark={$dark}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Ex.: 6456789"
                />
                <FieldHint $dark={$dark}>
                  ID da empresa no Intercom (<code>company_id</code>). Você também pode usar o ID do cliente no Partners — é o mesmo do Intercom.
                </FieldHint>
              </Field>
            </Section>
          )}

          {/* ── Step 3: Janela de Dias ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done={diasLimite !== '' && Number(diasLimite) > 0} $dark={$dark}>
                {diasLimite !== '' && Number(diasLimite) > 0
                  ? <i className="pi pi-check" style={{ fontSize: '0.68rem' }} />
                  : '3'}
              </StepBadge>
              <SectionTitle $dark={$dark}>Janela de Dias</SectionTitle>
            </SectionHeader>
            <Field>
              <Label $dark={$dark}>Dias de busca *</Label>
              <StyledInput
                $dark={$dark}
                value={diasLimite}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) setDiasLimite(val);
                }}
                placeholder="Ex.: 30"
                style={{ maxWidth: 180 }}
              />
            </Field>
            <FieldHint $dark={$dark}>
              Obrigatório. Quantidade de dias retroativos para buscar no Intercom.
            </FieldHint>
          </Section>

          {/* ── Acompanhamento (processando) OU CTA ── */}
          {loading ? (
            <ProgressPanel $dark={$dark}>
              <ProgressTop>
                <PulseIcon>
                  <i className="pi pi-bolt" />
                </PulseIcon>
                <div style={{ minWidth: 0 }}>
                  <ProgressTitle $dark={$dark}>Processando sua busca no N8N</ProgressTitle>
                  <ProgressSub $dark={$dark}>{stageMsg}</ProgressSub>
                </div>
                <ElapsedBadge $dark={$dark}>{elapsedLabel}</ElapsedBadge>
              </ProgressTop>

              <Track $dark={$dark}>
                <Indeterminate />
              </Track>

              <ProgressNote $dark={$dark}>
                <i className="pi pi-info-circle" style={{ marginTop: '0.1rem' }} />
                <span>Mantenha esta aba aberta. O fluxo busca as conversas no Intercom e retorna automaticamente — não é preciso atualizar a página.</span>
              </ProgressNote>
            </ProgressPanel>
          ) : (
            <CtaSection $dark={$dark}>
              <CtaSummary>
                {(mode === 'tag' ? tagId.trim() : companyId.trim()) && (
                  <ChipRow>
                    <Chip $ok $dark={$dark}>
                      <i className="pi pi-arrow-right-arrow-left" />
                      {mode === 'tag' ? 'Por Tag' : 'Por Empresa'}
                    </Chip>
                    {mode === 'tag' && tagId.trim() && (
                      <Chip $ok $dark={$dark}>
                        <i className="pi pi-tag" />
                        {selectedTag ? selectedTag.name : `ID ${tagId.trim()}`}
                      </Chip>
                    )}
                    {mode === 'id' && companyId.trim() && (
                      <Chip $ok $dark={$dark}>
                        <i className="pi pi-building" />
                        Empresa {companyId.trim()}
                      </Chip>
                    )}
                    {diasLimite !== '' && Number(diasLimite) > 0 && (
                      <Chip $ok $dark={$dark}>
                        <i className="pi pi-calendar" />
                        {diasLimite} dia{Number(diasLimite) !== 1 ? 's' : ''}
                      </Chip>
                    )}
                  </ChipRow>
                )}
                <CtaHint $dark={$dark}>
                  {canExecute
                    ? 'Pronto para disparar o fluxo no N8N.'
                    : !idFilled
                      ? (mode === 'tag' ? 'Selecione ou informe o ID da tag para continuar.' : 'Preencha o ID da empresa para continuar.')
                      : 'Informe a janela de dias para continuar.'}
                </CtaHint>
              </CtaSummary>

              <ExecButton disabled={!canExecute} onClick={canExecute ? handleExecute : undefined} type="button">
                <i className="pi pi-bolt" /> Disparar N8N
              </ExecButton>
            </CtaSection>
          )}
          {/* ── Painel de conclusão ── */}
          {result && (
            <ResultPanel $dark={$dark}>
              <ResultTitle $dark={$dark}>
                <i className="pi pi-check-circle" style={{ color: $dark ? '#4ade80' : '#16a34a' }} />
                {result.total} conversa{result.total !== 1 ? 's' : ''} extraída{result.total !== 1 ? 's' : ''}
              </ResultTitle>

              <ResultActions>
                <Button
                  label="Baixar .md"
                  icon="pi pi-download"
                  onClick={() => handleDownload('md')}
                  style={{ background: 'linear-gradient(90deg,#7b3ff2,#9a37eb)', border: 'none', fontSize: '0.84rem' }}
                  size="small"
                  type="button"
                />
                <Button
                  label="Baixar .json"
                  icon="pi pi-download"
                  onClick={() => handleDownload('json')}
                  outlined
                  style={{ borderColor: $dark ? '#5b14b8' : '#c4b5fd', color: $dark ? '#c4b5fd' : '#7b3ff2', fontSize: '0.84rem' }}
                  size="small"
                  type="button"
                />
              </ResultActions>

              <ResultActions>
                <CopyButton value={CHURN_CLAUDE_PROMPT} label="Copiar prompt" variant="secondary" size="sm" />
                <ResultHint $dark={$dark}>Cole no Claude Chat e anexe o arquivo baixado.</ResultHint>
              </ResultActions>
            </ResultPanel>
          )}
        </CardBody>
      </Card>

      {/* ── Confirm dialog ── */}
      <Dialog
        header="Confirmar disparo do fluxo"
        visible={confirmOpen}
        style={{ width: '460px' }}
        className="churn-confirm-dialog"
        onHide={() => setConfirmOpen(false)}
        blockScroll
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button
              label="Cancelar"
              outlined
              onClick={() => setConfirmOpen(false)}
              style={{ borderColor: $dark ? '#4b3a7a' : '#d1d5db', color: $dark ? '#9ca3af' : '#6b7280' }}
              type="button"
            />
            <Button
              label="Confirmar e disparar"
              icon="pi pi-bolt"
              onClick={doExecute}
              style={{ background: 'linear-gradient(90deg,#7b3ff2,#9a37eb)', border: 'none' }}
              type="button"
            />
          </div>
        }
      >
        <div style={{ fontSize: '0.91rem', lineHeight: 1.65, color: $dark ? '#efeaff' : '#1E0C45' }}>
          <p style={{ margin: '0 0 0.75rem' }}>
            Você está prestes a disparar o fluxo de churn no N8N com os seguintes parâmetros:
          </p>
          <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.2rem', fontSize: '0.86rem' }}>
            <li><strong>Modo:</strong> {mode === 'tag' ? 'Por Tag' : 'Por ID de Empresa'}</li>
            <li><strong>{mode === 'tag' ? 'Tag ID' : 'Empresa ID'}:</strong> {confirmLabel}</li>
            {diasLimite !== '' && Number(diasLimite) > 0 && (
              <li><strong>Janela:</strong> {diasLimite} dias</li>
            )}
          </ul>
          <p style={{ margin: 0, color: $dark ? '#9ca3af' : '#6b7280', fontSize: '0.81rem' }}>
            Esta ação chamará o webhook do N8N. Certifique-se de que os dados estão corretos antes de prosseguir.
          </p>
        </div>
      </Dialog>
    </Page>
  );
}
