// src/components/apihub/BulkRequestStepper.jsx
import { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import ContaAtivaHint from '../ContaAtivaHint';

// ── Styled ────────────────────────────────────────────────────────────────────

const StepperHeader = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : 'rgba(116,67,246,0.15)')};
`;

const StepTab = styled.button`
  flex: 1;
  padding: 10px 8px;
  border: none;
  background: ${({ $active, $done, $dark }) =>
    $active
      ? 'var(--accent)'
      : $done
      ? $dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.1)'
      : $dark ? '#14012b' : '#fafafa'};
  color: ${({ $active, $done, $dark }) =>
    $active ? '#fff' : $done ? ($dark ? '#c4b5fd' : '#5b3ec8') : $dark ? 'rgba(220,210,255,0.5)' : '#999'};
  font-size: 0.82rem;
  font-weight: ${({ $active, $done }) => ($active || $done ? 600 : 400)};
  cursor: ${({ $active, $done }) => ($active || $done ? 'pointer' : 'default')};
  transition: background 0.2s, color 0.2s;
  border-right: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};

  &:last-child { border-right: none; }

  &:hover:not(:disabled) {
    filter: ${({ $active }) => ($active ? 'none' : 'brightness(0.96)')};
  }
`;

const StepContent = styled.div``;

const InfoPanel = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
  background: ${({ $dark }) => ($dark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)')};
  color: ${({ $dark }) => ($dark ? '#fde68a' : '#92400e')};
  font-size: 0.85rem;
  margin-bottom: 14px;
  line-height: 1.5;
`;

const PreviewBox = styled.div`
  font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 0.82rem;
  padding: 10px 14px;
  border-radius: 8px;
  background: ${({ $dark }) => ($dark ? '#120125cc' : '#f3f0ff')};
  border: 1px solid ${({ $dark }) =>
    $dark ? 'rgba(116,67,246,0.3)' : 'rgba(116,67,246,0.18)'};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#4a35a0')};
  word-break: break-all;
  margin-top: 8px;
`;

const ReviewCard = styled.div`
  padding: 14px 16px;
  border-radius: 10px;
  background: ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.1)' : 'rgba(116,67,246,0.05)')};
  border: 1px solid ${({ $dark }) =>
    $dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.15)'};
  margin-bottom: 14px;
`;

const ReviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  padding: 5px 0;
  border-bottom: 1px solid ${({ $dark }) =>
    $dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
  &:last-child { border-bottom: none; }
`;

const FieldLabel = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 60px;
  justify-content: flex-end;

  & > label { margin-bottom: 5px; font-size: 0.88rem; }
`;

const StyledDropdown = styled(Dropdown)`
  &.p-dropdown {
    background: ${({ $dark }) => ($dark ? '#201335' : '#ecececff')};
    border: 1px solid ${({ $dark }) => ($dark ? '#2A2A3D' : '#d4d4d8')};
    height: 40px;
    display: flex;
    align-items: center;
    font-size: 0.88rem;
  }
  .p-dropdown-label {
    background: transparent !important;
    color: ${({ $dark }) => ($dark ? '#ffffff' : '#111827')};
    border: none !important;
    box-shadow: none !important;
    padding: 0 10px;
    font-size: 0.88rem;
  }
  .p-dropdown-trigger { background: transparent !important; width: 36px; }
  .p-dropdown-trigger-icon { color: ${({ $dark }) => ($dark ? '#a855f7' : '#8b5cf6')}; }
  &.p-dropdown.p-focus {
    border-color: ${({ $dark }) => ($dark ? '#a855f7' : '#8b5cf6')};
    box-shadow: 0 0 0 1px ${({ $dark }) => ($dark ? '#a855f7' : '#8b5cf6')}55;
  }
`;

const AccentButton = styled(Button)`
  background-color: var(--accent) !important;
  border-color: var(--accent) !important;
  color: #ffffff;
  height: 40px;
  font-size: 0.88rem;
  box-shadow: none;
  background-image: none;
  padding: 0 16px;
  &:hover:not(:disabled) { filter: brightness(1.04); }
  &:disabled { opacity: 0.6; cursor: not-allowed; filter: none; }
`;

const SoftButton = styled(Button)`
  background-color: ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.15)' : '#ede9ff')} !important;
  border-color: transparent !important;
  color: var(--accent) !important;
  height: 40px;
  font-size: 0.85rem;
  box-shadow: none;
  background-image: none;
  padding: 0 14px;
  &:hover:not(:disabled) { filter: brightness(0.96); }
`;

const METHOD_COLORS = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PATCH: '#f59e0b',
  DELETE: '#ef4444',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBulkItems(s) {
  const raw = String(s || '').trim();
  if (!raw) return [];
  return raw.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
}

function interpolatePreview(template, idValue) {
  return String(template || '').replace(/\{\{id\}\}/g, idValue);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BulkRequestStepper({
  darkMode,
  userKey = '',
  endpoint,
  setEndpoint,
  method,
  setMethod,
  methodOptions,
  catalog,
  loading,
  endpointMeta,
  bulkItemsRaw,
  setBulkItemsRaw,
  queryTemplate,
  setQueryTemplate,
  bodyTemplate,
  setBodyTemplate,
  bulkPatchUseId,
  setBulkPatchUseId,
  onRun,
  bulkAllowedForEndpoint,
}) {
  const [step, setStep] = useState(1);
  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');

  const parsedIds = useMemo(() => parseBulkItems(bulkItemsRaw), [bulkItemsRaw]);
  const firstId = parsedIds[0] || '{{id}}';

  const m = String(method || '').toUpperCase();
  const isWrite = ['POST', 'PATCH', 'DELETE'].includes(m);
  const needsBody = ['POST', 'PATCH'].includes(m);
  const baseEndpoint = endpointMeta?.path || endpoint || '';
  const API_BASE = 'https://api2.ploomes.com/';
  const useStringKey = !!endpointMeta?.stringKey;

  const pathWithId = m === 'DELETE' || (bulkPatchUseId && (m === 'PATCH' || m === 'POST'));
  const previewKeySegment = useStringKey ? `'${firstId}'` : firstId;
  const previewPath = pathWithId ? `${baseEndpoint}(${previewKeySegment})` : baseEndpoint;
  const previewQuery = (!pathWithId && queryTemplate) ? '?' + interpolatePreview(queryTemplate, firstId) : '';

  // ── Step navigation ──────────────────────────────────────────────

  function goToStep2() {
    if (!endpoint) { setStep1Error('Selecione um endpoint.'); return; }
    if (!method) { setStep1Error('Selecione um método.'); return; }
    if (!bulkAllowedForEndpoint) { setStep1Error('Ações em massa não são permitidas para este endpoint.'); return; }
    setStep1Error('');
    setStep(2);
  }

  function goToStep3() {
    if (parsedIds.length === 0) { setStep2Error('Informe ao menos 1 ID na lista.'); return; }
    if (needsBody && queryTemplate.includes('{{id}}') === false && bodyTemplate.includes('{{id}}') === false) {
      // soft warning only — don't block
    }
    setStep2Error('');
    setStep(3);
  }

  // ── Step 1 ───────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <StepContent>
        <p style={{ margin: '0 0 16px 0', opacity: 0.8, fontSize: '0.88rem' }}>
          Escolha o endpoint e o método que será aplicado a cada item da lista.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <FieldLabel>
            <label><strong>Endpoint</strong></label>
            <StyledDropdown
              $dark={darkMode}
              value={endpoint}
              options={(catalog.endpoints || []).map((e) => ({ label: e.name, value: e.name }))}
              onChange={(e) => {
                setEndpoint(e.value);
                setMethod('GET');
                setQueryTemplate('$filter=Id eq {{id}}');
              }}
              placeholder="Selecione o endpoint"
              style={{ width: '100%' }}
              disabled={loading}
            />
            {endpointMeta?.path && (
              <small style={{ opacity: 0.7, marginTop: 4 }}>
                Caminho real: <code>{endpointMeta.path}</code>
              </small>
            )}
          </FieldLabel>

          <FieldLabel>
            <label><strong>Método</strong></label>
            <StyledDropdown
              $dark={darkMode}
              value={method}
              options={methodOptions}
              onChange={(e) => {
                setMethod(e.value);
                if (e.value === 'DELETE') setQueryTemplate('');
              }}
              placeholder="Método"
              style={{ width: '100%' }}
              disabled={loading || !endpoint}
            />
            {method && (
              <small style={{ opacity: 0.7, marginTop: 4 }}>
                <span style={{
                  display: 'inline-block',
                  width: 8, height: 8, borderRadius: '50%',
                  background: METHOD_COLORS[m] || '#888',
                  marginRight: 5,
                }} />
                {m === 'GET' && 'Leitura — sem alteração de dados'}
                {m === 'POST' && 'Criação — um POST por item'}
                {m === 'PATCH' && 'Atualização — um PATCH por item'}
                {m === 'DELETE' && 'Exclusão — um DELETE por item'}
              </small>
            )}
          </FieldLabel>
        </div>

        {!bulkAllowedForEndpoint && endpoint && (
          <InfoPanel $dark={darkMode}>
            <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
            Ações em massa não são permitidas para o endpoint <strong>{endpoint}</strong>.
          </InfoPanel>
        )}

        {step1Error && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
            <i className="pi pi-times-circle" style={{ marginRight: 6 }} />
            {step1Error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <AccentButton
            label="Próximo"
            icon="pi pi-arrow-right"
            iconPos="right"
            onClick={goToStep2}
            disabled={!endpoint || !method}
          />
        </div>
      </StepContent>
    );
  }

  // ── Step 2 ───────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <StepContent>
        <InfoPanel $dark={darkMode}>
          <i className="pi pi-info-circle" style={{ marginRight: 6 }} />
          Use <code style={{ background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: 3 }}>{'{{id}}'}</code> nos templates abaixo.
          Cada ID da lista substituirá esse placeholder em cada requisição.
        </InfoPanel>

        {/* IDs */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: 4 }}>
            {useStringKey && m === 'DELETE' ? 'FieldKeys' : 'IDs / Valores'}{' '}
            {parsedIds.length > 0 && (
              <Tag
                value={`${parsedIds.length} item${parsedIds.length !== 1 ? 's' : ''}`}
                severity="info"
                style={{ verticalAlign: 'middle', marginLeft: 6, fontSize: '0.75rem' }}
              />
            )}
          </label>
          <small style={{ opacity: 0.7, display: 'block', marginBottom: 6 }}>
            {useStringKey && m === 'DELETE'
              ? "Separe por vírgula, espaço ou quebra de linha. As aspas serão adicionadas automaticamente."
              : 'Separe por vírgula, espaço ou quebra de linha.'}
          </small>
          <InputTextarea
            rows={3}
            value={bulkItemsRaw}
            onChange={(e) => setBulkItemsRaw(e.target.value)}
            placeholder={useStringKey && m === 'DELETE'
              ? "Ex.: deal_D4FF2901-12E3-4A18-A411-F9E55D15E3C3  (ou um por linha)"
              : "Ex.: 101, 102, 103  (ou um por linha)"}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </div>

        {/* Query Template */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: 4 }}>
            Query Template
          </label>
          <small style={{ opacity: 0.7, display: 'block', marginBottom: 6 }}>
            OData concatenado à URL de cada item. Ex.: <code>$filter=Id eq {'{{id}}'}</code>
          </small>
          <InputText
            value={queryTemplate}
            onChange={(e) => setQueryTemplate(e.target.value)}
            placeholder="$filter=Id eq {{id}}"
            style={{ width: '100%', fontSize: '0.88rem' }}
            disabled={m === 'DELETE'}
          />
        </div>

        {/* PATCH with ID checkbox */}
        {m === 'PATCH' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Checkbox
              inputId="bulkPatchId"
              checked={!!bulkPatchUseId}
              onChange={(e) => setBulkPatchUseId(e.checked)}
            />
            <label htmlFor="bulkPatchId" style={{ fontSize: '0.88rem', cursor: 'pointer' }}>
              Usar ID na URL — <code>Endpoint({'{{id}}'})</code>
            </label>
          </div>
        )}

        {/* Body Template */}
        {needsBody && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: 4 }}>
              Body Template (JSON)
            </label>
            <small style={{ opacity: 0.7, display: 'block', marginBottom: 6 }}>
              Use <code>{'{{id}}'}</code> para inserir o ID. Ex.: <code>{'{ "Id": {{id}} }'}</code>
            </small>
            <InputTextarea
              rows={6}
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              placeholder={'{ "Id": {{id}}, "Name": "..." }'}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
        )}

        {/* Live preview */}
        {parsedIds.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <small style={{ opacity: 0.75, fontWeight: 600 }}>
              <i className="pi pi-eye" style={{ marginRight: 5 }} />
              Prévia da 1ª requisição:
            </small>
            <PreviewBox $dark={darkMode}>
              <strong>{API_BASE}</strong>{previewPath}{previewQuery}
              {needsBody && bodyTemplate && (
                <>
                  {'\n'}Body: {interpolatePreview(bodyTemplate, firstId)}
                </>
              )}
            </PreviewBox>
          </div>
        )}

        {step2Error && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
            <i className="pi pi-times-circle" style={{ marginRight: 6 }} />
            {step2Error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SoftButton
            $dark={darkMode}
            label="Voltar"
            icon="pi pi-arrow-left"
            onClick={() => setStep(1)}
          />
          <AccentButton
            label="Próximo"
            icon="pi pi-arrow-right"
            iconPos="right"
            onClick={goToStep3}
            disabled={parsedIds.length === 0}
          />
        </div>
      </StepContent>
    );
  }

  // ── Step 3 ───────────────────────────────────────────────────────

  function renderStep3() {
    const previewItems = parsedIds.slice(0, 3);

    return (
      <StepContent>
        <p style={{ margin: '0 0 14px 0', opacity: 0.8, fontSize: '0.88rem' }}>
          Revise o resumo abaixo antes de executar. A operação não pode ser desfeita automaticamente.
        </p>

        <ContaAtivaHint uk={userKey} />

        <ReviewCard $dark={darkMode}>
          <ReviewRow $dark={darkMode}>
            <span style={{ opacity: 0.7 }}>Endpoint</span>
            <strong>{baseEndpoint || endpoint}</strong>
          </ReviewRow>
          <ReviewRow $dark={darkMode}>
            <span style={{ opacity: 0.7 }}>Método</span>
            <span style={{ fontWeight: 700, color: METHOD_COLORS[m] || '#888' }}>{m}</span>
          </ReviewRow>
          <ReviewRow $dark={darkMode}>
            <span style={{ opacity: 0.7 }}>Total de itens</span>
            <Tag value={`${parsedIds.length} item${parsedIds.length !== 1 ? 's' : ''}`} severity="info" />
          </ReviewRow>
          {queryTemplate && (
            <ReviewRow $dark={darkMode}>
              <span style={{ opacity: 0.7 }}>Query Template</span>
              <code style={{ fontSize: '0.8rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {queryTemplate}
              </code>
            </ReviewRow>
          )}
          <ReviewRow $dark={darkMode}>
            <span style={{ opacity: 0.7 }}>Rate limit</span>
            <span style={{ opacity: 0.8 }}>~75 req/min</span>
          </ReviewRow>
        </ReviewCard>

        {/* Preview das primeiras requisições */}
        <div style={{ marginBottom: 16 }}>
          <small style={{ opacity: 0.75, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            <i className="pi pi-list" style={{ marginRight: 5 }} />
            Prévia das primeiras requisições:
          </small>
          {previewItems.map((id, idx) => {
            const isPathWithId = (bulkPatchUseId && (m === 'PATCH' || m === 'POST')) || m === 'DELETE';
            const keySegment = useStringKey ? `'${id}'` : id;
            const qp = (!isPathWithId && queryTemplate) ? '?' + interpolatePreview(queryTemplate, id) : '';
            const ep = isPathWithId
              ? `${baseEndpoint}(${keySegment})`
              : baseEndpoint;
            return (
              <PreviewBox $dark={darkMode} key={idx} style={{ marginBottom: 6 }}>
                <span style={{ opacity: 0.55 }}>#{idx + 1}</span>{' '}
                <strong>{m}</strong>{' '}
                {API_BASE}{ep}{qp}
              </PreviewBox>
            );
          })}
          {parsedIds.length > 3 && (
            <small style={{ opacity: 0.55 }}>
              + {parsedIds.length - 3} item{parsedIds.length - 3 !== 1 ? 's' : ''} restante{parsedIds.length - 3 !== 1 ? 's' : ''}...
            </small>
          )}
        </div>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <SoftButton
            $dark={darkMode}
            label="Voltar"
            icon="pi pi-arrow-left"
            onClick={() => setStep(2)}
          />
          <AccentButton
            label={`Executar (${parsedIds.length} ${parsedIds.length === 1 ? 'item' : 'itens'})`}
            icon="pi pi-send"
            onClick={onRun}
            disabled={loading || !endpoint || !method || parsedIds.length === 0}
          />
        </div>
      </StepContent>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  const steps = [
    { label: '1 · Configurar', done: step > 1 },
    { label: '2 · Definir IDs', done: step > 2 },
    { label: '3 · Revisar e executar', done: false },
  ];

  return (
    <div>
      {/* Stepper header */}
      <StepperHeader $dark={darkMode}>
        {steps.map((s, i) => (
          <StepTab
            key={i}
            $active={step === i + 1}
            $done={s.done}
            $dark={darkMode}
            onClick={() => s.done && setStep(i + 1)}
          >
            {s.done && <i className="pi pi-check" style={{ marginRight: 5, fontSize: '0.75rem' }} />}
            {s.label}
          </StepTab>
        ))}
      </StepperHeader>

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}
