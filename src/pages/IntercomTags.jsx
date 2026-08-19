import { useState, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS } from '../config/teamsConfig';
import { applyIntercomTag } from '../services/intercomService';
import ServiceHeader from '../components/ServiceHeader';

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function parseIdsFromText(raw) {
  return raw
    .split(/[\n,;\t\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [], detectedCol: null };
  const sep = lines[0].includes(';') ? ';' : ',';
  const rawHeaders = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ''));
  const headers = rawHeaders.map((h) => h.toLowerCase());

  let colIndex = -1;
  let colName = null;

  const codigoIdx = headers.findIndex((h) => h === 'código' || h === 'codigo');
  if (codigoIdx !== -1) { colIndex = codigoIdx; colName = rawHeaders[codigoIdx]; }

  if (colIndex === -1) {
    const partnerIdx = headers.findIndex((h) => h.includes('partner'));
    if (partnerIdx !== -1) { colIndex = partnerIdx; colName = rawHeaders[partnerIdx]; }
  }

  if (colIndex === -1 && lines.length > 1) {
    const firstDataCells = lines[1].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    const numericIdx = firstDataCells.findIndex((cell) => /^\d+$/.test(cell));
    if (numericIdx !== -1) { colIndex = numericIdx; colName = rawHeaders[numericIdx]; }
  }

  if (colIndex === -1) { colIndex = 0; colName = rawHeaders[0]; }

  const rows = lines.slice(1).map((line) => {
    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    return cells[colIndex] ?? '';
  });

  return { rows, detectedCol: colName };
}

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const GlobalDialogStyle = createGlobalStyle`
  .intercom-confirm-dialog {
    background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#ffffff')} !important;
    border: 1px solid ${({ $dark }) => ($dark ? '#2d2244' : '#e6def5')} !important;
    border-radius: 1rem !important;
    box-shadow: ${({ $dark }) =>
      $dark ? '0 16px 32px rgba(0,0,0,0.45)' : '0 12px 26px rgba(78,46,143,0.16)'} !important;
  }
  .intercom-confirm-dialog .p-dialog-header {
    background: ${({ $dark }) => ($dark ? '#21123a' : '#f8f5ff')} !important;
    color: ${({ $dark }) => ($dark ? '#efeaff' : '#1E0C45')} !important;
    border-bottom: 1px solid ${({ $dark }) => ($dark ? '#332356' : '#ebe3f8')} !important;
    border-radius: 1rem 1rem 0 0 !important;
  }
  .intercom-confirm-dialog .p-dialog-content {
    background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#ffffff')} !important;
    color: ${({ $dark }) => ($dark ? '#efeaff' : '#1E0C45')} !important;
    padding: 1.2rem 1.4rem !important;
  }
  .intercom-confirm-dialog .p-dialog-footer {
    background: ${({ $dark }) => ($dark ? '#21123a' : '#f8f5ff')} !important;
    border-top: 1px solid ${({ $dark }) => ($dark ? '#332356' : '#ebe3f8')} !important;
    border-radius: 0 0 1rem 1rem !important;
    padding: 0.75rem 1rem !important;
  }
`;

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

// Type toggle
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

// Inputs
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

const StyledTextarea = styled(InputTextarea)`
  ${inputBase}
  && {
    background: ${({ $dark }) => ($dark ? '#291b45' : '#ffffff')} !important;
    color: ${({ $dark }) => ($dark ? '#f5efff' : '#24134a')} !important;
    border-color: ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')} !important;
    padding: 0.6rem 0.85rem !important;
    font-size: 0.84rem !important;
    font-family: monospace !important;
    resize: vertical !important;
    &::placeholder { color: ${({ $dark }) => ($dark ? '#6b5890' : '#a78bca')} !important; }
  }
`;

// Info banner
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

// Actions row inside step
const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.7rem;
`;

const OutlineBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  background: transparent;
  border: 1px solid ${({ $variant, $dark }) =>
    $variant === 'primary'
      ? '#7b3ff2'
      : $dark ? '#3b2960' : '#d8caef'};
  color: ${({ $variant, $dark }) =>
    $variant === 'primary'
      ? $dark ? '#c4b5fd' : '#7b3ff2'
      : $dark ? '#9ca3af' : '#6b7280'};

  &:hover {
    background: ${({ $variant, $dark }) =>
      $variant === 'primary'
        ? $dark ? 'rgba(123,63,242,0.12)' : 'rgba(123,63,242,0.06)'
        : $dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
  }

  i { font-size: 0.82rem; }
`;

// Execute / CTA section
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

// Failed IDs result
const ResultSection = styled.div`
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : '#e5e7eb')};
`;

const TableWrap = styled.div`
  .p-datatable-thead > tr > th {
    background: ${({ $dark }) => ($dark ? '#1a0935' : '#f7f3ff')} !important;
    color: ${({ $dark }) => ($dark ? '#ddcff9' : '#55358e')} !important;
    border-color: ${({ $dark }) => ($dark ? '#31293a' : '#e5e7eb')} !important;
    font-size: 0.8rem !important;
    padding: 0.5rem 0.75rem !important;
  }
  .p-datatable-tbody > tr > td {
    background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#fff')} !important;
    color: ${({ $dark }) => ($dark ? '#efeaff' : '#1E0C45')} !important;
    border-bottom: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : '#f0f0f0')} !important;
    font-size: 0.82rem !important;
    padding: 0.4rem 0.75rem !important;
  }
  .p-datatable-tbody > tr:hover > td {
    background: ${({ $dark }) => ($dark ? '#2b1f49' : '#f9f9ff')} !important;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_OPTIONS = [
  { label: 'Empresas (Companies)', value: 'companies' },
  { label: 'Contatos (Contacts)', value: 'contacts' },
];

const LARGE_LIST_THRESHOLD = 1000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IntercomTags() {
  const { darkMode: $dark } = useDarkMode();
  const { canService } = useUserProfile();

  const [type, setType] = useState('companies');
  const [tagName, setTagName] = useState('');
  const [idsText, setIdsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(null);
  const [failedIds, setFailedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [csvInfo, setCsvInfo] = useState(null);

  const listFileRef = useRef(null);

  if (!canService(SERVICE_KEYS.INTERCOM_TAGS)) {
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

  const handleTypeChange = (val) => {
    setType(val);
    setIdsText('');
    setFlash(null);
    setFailedIds([]);
    setCsvInfo(null);
  };

  const handleListFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const { rows, detectedCol } = parseCSV(text);
      const ids = rows.map((v) => String(v).trim()).filter(Boolean);

      if (ids.length === 0) {
        setFlash({ type: 'error', text: 'Nenhum ID encontrado na planilha. Verifique o formato do arquivo.' });
        return;
      }
      if (!detectedCol) {
        setFlash({ type: 'error', text: 'Não foi possível identificar uma coluna com IDs. Verifique se o arquivo contém uma coluna "Código", "Partners" ou numérica.' });
        return;
      }

      setIdsText(ids.join('\n'));
      setFailedIds([]);
      setFlash(null);
      setCsvInfo({ colName: detectedCol, count: ids.length });
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const parsedIds = parseIdsFromText(idsText);
  const isLargeList = parsedIds.length > LARGE_LIST_THRESHOLD;
  const canExecute = parsedIds.length > 0 && tagName.trim() && !loading;

  const handleExecute = () => {
    setFlash(null);
    setFailedIds([]);
    setConfirmOpen(true);
  };

  const doExecute = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setFlash(null);
    setFailedIds([]);

    try {
      const result = await applyIntercomTag(type, tagName.trim(), parsedIds);

      if (result.failed && result.failed.length > 0) {
        setFailedIds(result.failed);
        setFlash({
          type: 'warn',
          text: `Tag aplicada para ${result.applied} ${type === 'companies' ? 'empresa(s)' : 'contato(s)'}. ${result.failed.length} ID(s) não encontrado(s) no Intercom — veja abaixo.`,
        });
      } else {
        setFlash({
          type: 'success',
          text: `Tag "${tagName.trim()}" aplicada com sucesso para ${result.applied ?? parsedIds.length} ${type === 'companies' ? 'empresa(s)' : 'contato(s)'}!`,
        });
        setIdsText('');
        setTagName('');
        setCsvInfo(null);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.startsWith('[LISTA_GRANDE]')) {
        setFlash({
          type: 'error',
          text: `Erro ao enviar lista grande: ${msg.replace('[LISTA_GRANDE] ', '')}. Com mais de ${LARGE_LIST_THRESHOLD} IDs não é possível identificar automaticamente quais falharam.`,
        });
      } else {
        setFlash({ type: 'error', text: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const flashIcon = {
    success: 'pi-check-circle',
    warn: 'pi-exclamation-triangle',
    error: 'pi-times-circle',
    info: 'pi-info-circle',
  };

  return (
    <Page>
      <GlobalDialogStyle $dark={$dark} />
      <HiddenInput ref={listFileRef} type="file" accept=".csv,.txt" onChange={handleListFile} />

      <Card $dark={$dark}>
        <ServiceHeader
          variant="band"
          platforms={['intercom']}
          title="Importar Tags"
          subtitle="Aplique marcadores em empresas ou contatos no Intercom via API."
        />

        <CardBody>
          {/* ── Flash ── */}
          {flash && (
            <Banner $type={flash.type} $dark={$dark}>
              <i className={`pi ${flashIcon[flash.type] ?? 'pi-info-circle'}`} />
              <span>{flash.text}</span>
            </Banner>
          )}

          {/* ── Step 1: Tipo ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done={false} $dark={$dark}>1</StepBadge>
              <SectionTitle $dark={$dark}>Tipo de destinatário</SectionTitle>
            </SectionHeader>
            <TypeToggle $dark={$dark}>
              {TYPE_OPTIONS.map((opt) => (
                <TypeBtn
                  key={opt.value}
                  $active={type === opt.value}
                  $dark={$dark}
                  data-active={type === opt.value}
                  onClick={() => handleTypeChange(opt.value)}
                  type="button"
                >
                  {opt.label}
                </TypeBtn>
              ))}
            </TypeToggle>
            <FieldHint $dark={$dark}>
              Empresas usam <strong>company_id</strong> (código no Partners).{' '}
              Contatos usam <strong>user_id</strong> (ID do usuário no Ploomes).
            </FieldHint>
          </Section>

          {/* ── Step 2: Nome da tag ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done={!!tagName.trim()} $dark={$dark}>
                {tagName.trim() ? <i className="pi pi-check" style={{ fontSize: '0.68rem' }} /> : '2'}
              </StepBadge>
              <SectionTitle $dark={$dark}>Nome da tag</SectionTitle>
            </SectionHeader>
            <Field>
              <Label $dark={$dark}>Tag</Label>
              <StyledInput
                $dark={$dark}
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder={type === 'companies' ? 'Ex.: CSM - Vinicius Mori' : 'Ex.: Onboarding 2026'}
              />
            </Field>
            <FieldHint $dark={$dark}>
              Se a tag já existir no Intercom ela será reutilizada; caso contrário, será criada automaticamente.
            </FieldHint>
          </Section>

          {/* ── Step 3: Lista de IDs ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done={parsedIds.length > 0} $dark={$dark}>
                {parsedIds.length > 0 ? <i className="pi pi-check" style={{ fontSize: '0.68rem' }} /> : '3'}
              </StepBadge>
              <SectionTitle $dark={$dark}>Lista de IDs</SectionTitle>
            </SectionHeader>

            {csvInfo && (
              <Banner $type="info" $dark={$dark} style={{ marginBottom: '0.75rem' }}>
                <i className="pi pi-file-import" />
                <span>
                  <strong>{csvInfo.count}</strong> IDs importados da coluna <strong>"{csvInfo.colName}"</strong>.
                  {' '}Edite ou complemente abaixo se necessário.
                </span>
              </Banner>
            )}

            <Field>
              <Label $dark={$dark}>IDs</Label>
              <StyledTextarea
                $dark={$dark}
                value={idsText}
                onChange={(e) => { setIdsText(e.target.value); setFlash(null); setFailedIds([]); setCsvInfo(null); }}
                rows={7}
                placeholder={
                  type === 'companies'
                    ? '6874\n10647\n15131\n17698'
                    : '40091007\n40091008\n40091009'
                }
              />
            </Field>

            <FieldHint $dark={$dark}>
              Cole os IDs separados por linha, vírgula ou espaço.
              {type === 'companies'
                ? ' Use o código do parceiro (Partners) do Ploomes.'
                : ' Use o ID do usuário no Ploomes.'}
            </FieldHint>

            <ButtonRow>
              <OutlineBtn $variant="primary" $dark={$dark} onClick={() => listFileRef.current?.click()} type="button">
                <i className="pi pi-file-import" /> Importar planilha CSV
              </OutlineBtn>
              {idsText.trim() && (
                <OutlineBtn $dark={$dark} onClick={() => { setIdsText(''); setFlash(null); setFailedIds([]); setCsvInfo(null); }} type="button">
                  <i className="pi pi-times" /> Limpar lista
                </OutlineBtn>
              )}
            </ButtonRow>

            <FieldHint $dark={$dark} style={{ marginTop: '0.6rem' }}>
              Ao importar, a coluna <strong>"Código"</strong> é priorizada (código Partners).
              Se não encontrada, buscamos colunas com "partners" ou qualquer coluna numérica.
            </FieldHint>

            {isLargeList && (
              <Banner $type="warn" $dark={$dark} style={{ marginTop: '0.75rem' }}>
                <i className="pi pi-exclamation-triangle" />
                <span>
                  <strong>{parsedIds.length} IDs</strong> detectados. Com listas acima de {LARGE_LIST_THRESHOLD},
                  o envio é feito de uma vez e IDs inválidos não são isolados automaticamente.
                </span>
              </Banner>
            )}

            {!isLargeList && parsedIds.length > 0 && (
              <Banner $type="info" $dark={$dark} style={{ marginTop: '0.75rem' }}>
                <i className="pi pi-info-circle" />
                <span>
                  <strong>{parsedIds.length} IDs</strong> prontos para envio em lotes de 50 —
                  IDs não encontrados no Intercom serão identificados automaticamente.
                </span>
              </Banner>
            )}
          </Section>

          {/* ── CTA / Execute ── */}
          <CtaSection $dark={$dark}>
            <CtaSummary>
              {(tagName.trim() || parsedIds.length > 0) && (
                <ChipRow>
                  {tagName.trim() && (
                    <Chip $ok $dark={$dark}>
                      <i className="pi pi-tag" /> {tagName.trim()}
                    </Chip>
                  )}
                  {parsedIds.length > 0 && (
                    <Chip $ok $dark={$dark}>
                      <i className="pi pi-users" />
                      {parsedIds.length} {type === 'companies' ? 'empresa(s)' : 'contato(s)'}
                    </Chip>
                  )}
                </ChipRow>
              )}
              <CtaHint $dark={$dark}>
                {isLargeList
                  ? 'Uma única requisição será enviada ao Intercom com todos os IDs.'
                  : 'Os IDs serão enviados em lotes de 50 com isolamento automático de falhas.'}
              </CtaHint>
            </CtaSummary>

            <ExecButton disabled={!canExecute} onClick={canExecute ? handleExecute : undefined} type="button">
              {loading
                ? <><i className="pi pi-spin pi-spinner" /> Enviando…</>
                : <><i className="pi pi-send" /> Aplicar tag</>}
            </ExecButton>
          </CtaSection>

          {/* ── Failed IDs ── */}
          {failedIds.length > 0 && (
            <ResultSection $dark={$dark}>
              <Banner $type="warn" $dark={$dark} style={{ borderRadius: '1rem 1rem 0 0', borderBottom: 'none' }}>
                <i className="pi pi-exclamation-triangle" />
                <span>
                  Os <strong>{failedIds.length} IDs</strong> abaixo não foram encontrados no Intercom e não receberam a tag.
                  Verifique se estão corretos ou se as empresas/contatos existem.
                </span>
              </Banner>
              <TableWrap $dark={$dark}>
                <DataTable
                  value={failedIds.map((id, i) => ({ seq: i + 1, id }))}
                  scrollable
                  scrollHeight="240px"
                  showGridlines
                  size="small"
                >
                  <Column field="seq" header="#" style={{ width: 56 }} />
                  <Column field="id" header="ID não encontrado" />
                </DataTable>
              </TableWrap>
              <div style={{ padding: '0.65rem 0.9rem', background: $dark ? '#1a0e2e' : '#fff' }}>
                <OutlineBtn $variant="primary" $dark={$dark} onClick={() => navigator.clipboard?.writeText(failedIds.join('\n'))} type="button">
                  <i className="pi pi-copy" /> Copiar IDs inválidos
                </OutlineBtn>
              </div>
            </ResultSection>
          )}
        </CardBody>
      </Card>

      {/* ── Confirm dialog ── */}
      <Dialog
        header="Confirmar aplicação de tag"
        visible={confirmOpen}
        style={{ width: '460px' }}
        className="intercom-confirm-dialog"
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
              label="Confirmar e enviar"
              icon="pi pi-send"
              onClick={doExecute}
              style={{ background: 'linear-gradient(90deg,#7b3ff2,#9a37eb)', border: 'none' }}
              type="button"
            />
          </div>
        }
      >
        <div style={{ fontSize: '0.91rem', lineHeight: 1.65, color: $dark ? '#efeaff' : '#1E0C45' }}>
          <p style={{ margin: '0 0 0.75rem' }}>
            Você está prestes a aplicar a tag <strong>"{tagName}"</strong> para{' '}
            <strong>{parsedIds.length} {type === 'companies' ? 'empresa(s)' : 'contato(s)'}</strong> no Intercom.
          </p>
          {!isLargeList && (
            <p style={{ margin: '0 0 0.5rem', color: $dark ? '#c4b5fd' : '#5b21b6', fontSize: '0.83rem' }}>
              Os IDs serão enviados em lotes de 50. IDs não encontrados serão listados na tela ao final.
            </p>
          )}
          <p style={{ margin: 0, color: $dark ? '#9ca3af' : '#6b7280', fontSize: '0.81rem' }}>
            Esta ação chama a API do Intercom diretamente. Certifique-se de que os IDs e o nome da tag estão corretos.
          </p>
        </div>
      </Dialog>
    </Page>
  );
}
