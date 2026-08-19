import { useState, useRef, useCallback } from 'react';
import { Toast } from 'primereact/toast';
import styled, { keyframes } from 'styled-components';
import { useDarkMode } from '../../../DarkModeContext';
import {
  validateUserKey,
  fetchPipelines,
  fetchAllStages,
  implementSlaCards,
  fillRetroactiveSla,
  downloadSlaSpreadsheet,
  undoSlaImplementation,
} from '../../../services/slaCardsService';
import { logAction } from '../../../services/userHistoryService';
import UserKeyCard from '../components/UserKeyCard';
import ContaAtivaHint from '../../../components/ContaAtivaHint';

// ── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

// ── Layout ──────────────────────────────────────────────────────────────────

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: ${fadeIn} 0.3s ease;
`;

const Card = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  animation: ${fadeIn} 0.25s ease;
`;

const FieldLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  margin-bottom: 0.35rem;
`;

const SectionTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  i { font-size: 0.8rem; color: #7443f6; }
`;

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: 10px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#251840' : '#f5f2ff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
  &:hover:not(:disabled) { background: ${({ $dm }) => ($dm ? '#2e1f50' : '#ede8ff')}; border-color: #7443f6; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

// ── Pipeline selector ────────────────────────────────────────────────────────

const SelectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.3) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.3); border-radius: 4px; }
`;

const SelectorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border-radius: 9px;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  background: ${({ $selected, $dm }) =>
    $selected
      ? ($dm ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.08)')
      : 'transparent'};
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(116,67,246,0.4)' : 'transparent')};
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: ${({ $dm, $clickable }) => $clickable ? ($dm ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.06)') : undefined}; }
`;

const Checkbox = styled.div`
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 2px solid ${({ $checked }) => ($checked ? '#7443f6' : 'rgba(116,67,246,0.4)')};
  background: ${({ $checked }) => ($checked ? '#7443f6' : 'transparent')};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s;
  i { color: #fff; font-size: 0.65rem; }
`;

const PipelineDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color || '#7443f6'};
  flex-shrink: 0;
`;

const ItemName = styled.div`
  font-size: 0.87rem;
  font-weight: 600;
  color: ${({ $dm }) => ($dm ? '#d4c8ff' : '#3d2a80')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemSub = styled.div`
  font-size: 0.75rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
`;

const Badge = styled.span`
  font-size: 0.73rem;
  font-weight: 700;
  background: rgba(116,67,246,0.13);
  color: #7443f6;
  border-radius: 99px;
  padding: 0.12rem 0.5rem;
  border: 1px solid rgba(116,67,246,0.3);
`;

const CountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
`;

// ── Checkbox toggle ──────────────────────────────────────────────────────────

const CheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  user-select: none;

  input[type='checkbox'] { display: none; }
`;

const ToggleBox = styled.div`
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 2px solid ${({ $checked }) => ($checked ? '#7443f6' : 'rgba(116,67,246,0.4)')};
  background: ${({ $checked }) => ($checked ? '#7443f6' : 'transparent')};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s;
  i { color: #fff; font-size: 0.65rem; }
`;

// ── Preview ──────────────────────────────────────────────────────────────────

const PreviewBox = styled.div`
  background: ${({ $dm }) => ($dm ? '#130d26' : '#f5f2ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#d8cfff')};
  border-radius: 12px;
  padding: 0.9rem 1rem;
`;

const PreviewTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  margin-bottom: 0.6rem;
`;

const PreviewItem = styled.div`
  font-size: 0.84rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.18rem 0;
  line-height: 1.4;
  i { color: #7443f6; font-size: 0.75rem; margin-top: 0.15rem; flex-shrink: 0; }
`;

const PreviewTotal = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
`;

// ── Progress ──────────────────────────────────────────────────────────────────

const ProgressCard = styled.div`
  background: ${({ $dm }) => ($dm ? '#1e1535' : '#f0ecff')};
  border-radius: 14px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const ProgressBar = styled.div`
  height: 5px;
  border-radius: 99px;
  background: ${({ $dm }) => ($dm ? '#2d2a3e' : '#ddd8ff')};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 99px;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, #7443f6, #9b67ff, #7443f6);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite linear;
  transition: width 0.5s ease;
`;

const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const LogLine = styled.div`
  font-size: 0.81rem;
  color: ${({ $dm, $ok, $warn }) =>
    $ok ? '#22c55e' : $warn ? '#f59e0b' : ($dm ? '#c4b5fd' : '#4a2fa0')};
  line-height: 1.4;
`;

// ── Buttons ──────────────────────────────────────────────────────────────────

const ActionsRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.button`
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: none;
  background: ${({ $danger }) =>
    $danger ? '#dc2626' : 'linear-gradient(135deg, #7443f6, #9b67ff)'};
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SecondaryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: transparent;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: ${({ $dm }) => ($dm ? '#251840' : '#ede8ff')}; border-color: #7443f6; }
`;

const HintText = styled.p`
  font-size: 0.78rem;
  color: ${({ $dm }) => ($dm ? '#6a5a9a' : '#a090cc')};
  margin: 0;
`;

const SegmentRow = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const SegmentBtn = styled.button`
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid ${({ $active }) => ($active ? '#7443f6' : 'rgba(116,67,246,0.3)')};
  background: ${({ $active }) => ($active ? 'rgba(116,67,246,0.15)' : 'transparent')};
  color: ${({ $active, $dm }) => $active ? '#7443f6' : ($dm ? '#9580c8' : '#7a6aaa')};
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #7443f6; background: rgba(116,67,246,0.08); }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SlaCardsForm() {
  const { darkMode: dm } = useDarkMode();
  const toast = useRef(null);

  const [uk, setUk] = useState('');
  const [ukStatus, setUkStatus] = useState('idle');
  const [ukError, setUkError] = useState('');

  const [pipelines, setPipelines] = useState([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [selectedPipelineIds, setSelectedPipelineIds] = useState([]);

  const [stagesByPipeline, setStagesByPipeline] = useState({});
  const [loadingStages, setLoadingStages] = useState(false);

  const [fillRetroactive, setFillRetroactive] = useState(false);
  const [slaType, setSlaType] = useState('both'); // 'days' | 'hours' | 'both' | 'none'
  const [includeExitDate, setIncludeExitDate] = useState(true);

  const [phase, setPhase] = useState('form'); // form | implementing | done | error | undo-confirm | undoing | undone
  const [logs, setLogs] = useState([]);
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const addLog = useCallback((msg) => setLogs((prev) => [...prev, msg]), []);

  const warn = (detail) =>
    toast.current?.show({ severity: 'warn', summary: 'Atenção', detail, life: 4000 });

  async function handleValidateUk() {
    const trimmed = uk.trim();
    if (!trimmed) { warn('Informe a User-Key antes de validar.'); return; }
    if (ukStatus === 'validating') return;

    setUkStatus('validating');
    setUkError('');
    setPipelines([]);
    setSelectedPipelineIds([]);
    setStagesByPipeline({});

    try {
      await validateUserKey(trimmed);
      setUkStatus('valid');

      setLoadingPipelines(true);
      const pipes = await fetchPipelines(trimmed);
      setPipelines(pipes);
      setLoadingPipelines(false);
    } catch (err) {
      setUkStatus('invalid');
      setUkError(err.message || 'User-Key inválida ou sem permissão');
      setLoadingPipelines(false);
    }
  }

  function togglePipeline(id) {
    setSelectedPipelineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setStagesByPipeline({});
  }

  async function handleLoadStages() {
    if (selectedPipelineIds.length === 0) { warn('Selecione pelo menos 1 funil.'); return; }
    const selected = pipelines.filter((p) => selectedPipelineIds.includes(p.Id));
    setLoadingStages(true);
    try {
      const stages = await fetchAllStages(uk.trim(), selected);
      setStagesByPipeline(stages);
    } catch (err) {
      warn(`Erro ao carregar estágios: ${err.message}`);
    }
    setLoadingStages(false);
  }

  function validate() {
    if (ukStatus !== 'valid') { warn('Valide a User-Key antes de continuar.'); return false; }
    if (selectedPipelineIds.length === 0) { warn('Selecione pelo menos 1 funil.'); return false; }
    if (Object.keys(stagesByPipeline).length === 0) { warn('Carregue os estágios antes de implementar.'); return false; }
    return true;
  }

  const selectedPipelines = pipelines.filter((p) => selectedPipelineIds.includes(p.Id));
  const allStages = selectedPipelines.flatMap((p) => stagesByPipeline[p.Id] || []);
  const slaFieldsPerStage = slaType === 'both' ? 2 : slaType === 'none' ? 0 : 1;
  const exitFieldsPerStage = includeExitDate ? 1 : 0;
  const totalFields = allStages.length * (1 + exitFieldsPerStage + slaFieldsPerStage);
  const totalFilters = allStages.length;
  const totalAutomations = allStages.length;

  async function handleImplement() {
    if (!validate()) return;

    setPhase('implementing');
    setLogs([]);
    setPct(0);
    setErrorMsg('');

    const totalSteps = allStages.length * 5;
    let stepsDone = 0;

    try {
      const res = await implementSlaCards({
        uk: uk.trim(),
        pipelines: selectedPipelines,
        stagesByPipeline,
        fieldPrefix: 'SLA',
        dynamicNaming: true,
        slaType,
        fillRetroactive: false,
        includeExitDate,
        onProgress: (msg) => {
          addLog(msg);
          if (msg.startsWith('✔') || msg.startsWith('⚠')) {
            stepsDone++;
            setPct(Math.min(Math.round((stepsDone / Math.max(totalSteps, 1)) * 90), 90));
          }
        },
      });

      if (fillRetroactive) {
        addLog('─────────────────────────────────────────');
        addLog('🔄 Iniciando preenchimento retroativo...');
        setPct(0);
        await fillRetroactiveSla({
          uk: uk.trim(),
          pipelines: selectedPipelines,
          slaResult: res,
          slaType,
          includeExitDate,
          onProgress: addLog,
          onPct: setPct,
        });
      }

      setPct(100);
      setResult(res);
      logAction({ a: 'execucao', s: 'process-implementer', d: `SLA de Cards · ${res.createdFields?.length ?? 0} campos · ${res.createdAutomations?.length ?? 0} automações` }); // best-effort
      setPhase('done');
    } catch (err) {
      setErrorMsg(err.message || 'Erro desconhecido durante a implementação.');
      setPhase('error');
    }
  }

  async function handleUndo() {
    if (!result) return;
    setPhase('undoing');
    setLogs([]);
    setPct(0);

    const total = (result.createdAutomations?.length ?? 0) +
                  (result.createdFilters?.length ?? 0) +
                  (result.createdFields?.length ?? 0);
    let done = 0;

    try {
      await undoSlaImplementation({
        uk: uk.trim(),
        result,
        onProgress: (msg) => {
          addLog(msg);
          if (msg.startsWith('✔') || msg.startsWith('⚠')) {
            done++;
            setPct(Math.min(Math.round((done / Math.max(total, 1)) * 95), 95));
          }
        },
      });
      setPct(100);
      logAction({ a: 'execucao', s: 'process-implementer', d: 'SLA de Cards · undo concluído' }); // best-effort
      setPhase('undone');
    } catch (err) {
      addLog(`⚠ Erro: ${err.message}`);
      logAction({ a: 'execucao', s: 'process-implementer', d: 'SLA de Cards · undo parcial', r: 'erro' }); // best-effort
      setPhase('undone');
    }
  }

  function handleReset() {
    setUk('');
    setUkStatus('idle');
    setUkError('');
    setPipelines([]);
    setSelectedPipelineIds([]);
    setStagesByPipeline({});
    setFillRetroactive(false);
    setSlaType('both');
    setIncludeExitDate(true);
    setPhase('form');
    setLogs([]);
    setPct(0);
    setResult(null);
    setErrorMsg('');
  }

  const stagesLoaded = Object.keys(stagesByPipeline).length > 0;
  const canImplement =
    ukStatus === 'valid' &&
    selectedPipelineIds.length > 0 &&
    stagesLoaded &&
    phase === 'form';

  const isActive = phase === 'implementing' || phase === 'undoing';

  return (
    <>
      <Toast ref={toast} />
      <FormWrapper>
        <UserKeyCard
          uk={uk}
          onUkChange={(v) => { setUk(v); setUkStatus('idle'); setUkError(''); }}
          status={ukStatus}
          errorMsg={ukError}
          onValidate={handleValidateUk}
          locked={phase !== 'form'}
        />

        {/* ── Funis ── */}
        {ukStatus === 'valid' && (
          <Card $dm={dm}>
            <SectionTitle $dm={dm}>
              <i className="pi pi-sitemap" />
              Funis *
            </SectionTitle>

            {loadingPipelines ? (
              <div style={{ fontSize: '0.85rem', color: dm ? '#9580c8' : '#7a6aaa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="pi pi-spin pi-spinner" style={{ color: '#7443f6' }} />
                Carregando funis…
              </div>
            ) : (
              <>
                <CountRow $dm={dm}>
                  <span>{pipelines.length} funis disponíveis</span>
                  {selectedPipelineIds.length > 0 && (
                    <Badge>{selectedPipelineIds.length} selecionado{selectedPipelineIds.length > 1 ? 's' : ''}</Badge>
                  )}
                </CountRow>
                <SelectorList>
                  {pipelines.map((p) => {
                    const sel = selectedPipelineIds.includes(p.Id);
                    return (
                      <SelectorItem
                        key={p.Id}
                        $dm={dm}
                        $selected={sel}
                        $clickable={phase === 'form'}
                        onClick={() => phase === 'form' && togglePipeline(p.Id)}
                      >
                        <Checkbox $checked={sel}>{sel && <i className="pi pi-check" />}</Checkbox>
                        <PipelineDot $color={p.Color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <ItemName $dm={dm}>{p.Name}</ItemName>
                        </div>
                      </SelectorItem>
                    );
                  })}
                </SelectorList>

                {selectedPipelineIds.length > 0 && phase === 'form' && (
                  <ActionBtn
                    $dm={dm}
                    onClick={handleLoadStages}
                    disabled={loadingStages}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {loadingStages ? (
                      <><i className="pi pi-spin pi-spinner" /> Carregando estágios…</>
                    ) : stagesLoaded ? (
                      <><i className="pi pi-check" style={{ color: '#22c55e' }} /> Estágios carregados</>
                    ) : (
                      <><i className="pi pi-download" /> Carregar estágios</>
                    )}
                  </ActionBtn>
                )}

                {stagesLoaded && (
                  <div style={{ fontSize: '0.8rem', color: dm ? '#22c55e' : '#16a34a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="pi pi-check-circle" />
                    {allStages.length} estágio{allStages.length > 1 ? 's' : ''} encontrado{allStages.length > 1 ? 's' : ''}
                    {selectedPipelines.map((p) => ` — ${p.Name}: ${stagesByPipeline[p.Id]?.length ?? 0} etapas`).join('')}
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* ── Opções adicionais ── */}
        {ukStatus === 'valid' && stagesLoaded && phase === 'form' && (
          <Card $dm={dm}>
            <SectionTitle $dm={dm}>
              <i className="pi pi-sliders-h" />
              Opções adicionais
            </SectionTitle>

            <div>
              <FieldLabel $dm={dm}>Cálculo de SLA</FieldLabel>
              <SegmentRow>
                {[
                  { value: 'both',  label: 'Dias e horas' },
                  { value: 'days',  label: 'Somente dias' },
                  { value: 'hours', label: 'Somente horas' },
                  { value: 'none',  label: 'Sem cálculo' },
                ].map(({ value, label }) => (
                  <SegmentBtn
                    key={value}
                    $active={slaType === value}
                    $dm={dm}
                    onClick={() => setSlaType(value)}
                  >
                    {label}
                  </SegmentBtn>
                ))}
              </SegmentRow>
            </div>

            <CheckRow $dm={dm}>
              <input
                type="checkbox"
                checked={includeExitDate}
                onChange={(e) => setIncludeExitDate(e.target.checked)}
              />
              <ToggleBox $checked={includeExitDate}>
                {includeExitDate && <i className="pi pi-check" />}
              </ToggleBox>
              Criar campo de data de saída do estágio
            </CheckRow>

            <CheckRow $dm={dm}>
              <input
                type="checkbox"
                checked={fillRetroactive}
                onChange={(e) => setFillRetroactive(e.target.checked)}
              />
              <ToggleBox $checked={fillRetroactive}>
                {fillRetroactive && <i className="pi pi-check" />}
              </ToggleBox>
              Preenchimento retroativo de negócios existentes
            </CheckRow>
            {fillRetroactive && (
              <div style={{ fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '-0.25rem' }}>
                <i className="pi pi-exclamation-triangle" />
                Processar retroativo pode levar vários minutos dependendo do volume de negócios.
              </div>
            )}
          </Card>
        )}

        {/* ── Preview do que será criado ── */}
        {stagesLoaded && phase === 'form' && (
          <PreviewBox $dm={dm}>
            <ContaAtivaHint uk={uk} />
            <PreviewTitle $dm={dm}>O que será criado para cada etapa de cada funil</PreviewTitle>
            {selectedPipelines.map((p) => {
              const stages = stagesByPipeline[p.Id] || [];
              return stages.slice(0, 2).map((s) => (
                <div key={s.Id} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: dm ? '#7a6aaa' : '#9580c8', marginBottom: '0.25rem' }}>
                    {p.Name} / {s.Name}
                  </div>
                  <PreviewItem $dm={dm}><i className="pi pi-calendar" /> Campo "Entrada {s.Name}" (data)</PreviewItem>
                  {includeExitDate && (
                    <PreviewItem $dm={dm}><i className="pi pi-calendar" /> Campo "Saída {s.Name}" (data)</PreviewItem>
                  )}
                  {(slaType === 'both' || slaType === 'days') && (
                    <PreviewItem $dm={dm}><i className="pi pi-chart-bar" /> Campo "Dias no estágio {s.Name}"</PreviewItem>
                  )}
                  {(slaType === 'both' || slaType === 'hours') && (
                    <PreviewItem $dm={dm}><i className="pi pi-chart-bar" /> Campo "Horas no estágio {s.Name}"</PreviewItem>
                  )}
                  <PreviewItem $dm={dm}><i className="pi pi-filter" /> 1 filtro de trigger</PreviewItem>
                  <PreviewItem $dm={dm}><i className="pi pi-bolt" /> 1 automação de entrada{includeExitDate ? '/saída' : ''}</PreviewItem>
                </div>
              ));
            })}
            {allStages.length > 2 && (
              <PreviewItem $dm={dm} style={{ opacity: 0.6 }}>
                <i className="pi pi-ellipsis-h" /> e mais {allStages.length - 2} etapa{allStages.length - 2 > 1 ? 's' : ''}...
              </PreviewItem>
            )}
            <PreviewTotal $dm={dm}>
              Total estimado: ~{totalFields} campos · {totalFilters} filtros · {totalAutomations} automações
            </PreviewTotal>
          </PreviewBox>
        )}

        {/* ── Progress ── */}
        {(isActive || phase === 'done' || phase === 'undone') && (
          <ProgressCard $dm={dm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: dm ? '#c4b5fd' : '#4a2fa0' }}>
                {phase === 'done' ? '✅ SLA de Cards implementado!' :
                 phase === 'undone' ? '✅ Implementação desfeita!' :
                 phase === 'undoing' ? '🗑️ Desfazendo implementação…' :
                 '⚙️ Implementando SLA de Cards…'}
              </span>
              <span style={{ fontSize: '0.72rem', color: dm ? '#7a6aaa' : '#9580c8' }}>{pct}%</span>
            </div>
            <ProgressBar $dm={dm}><ProgressFill $pct={pct} /></ProgressBar>
            {logs.length > 0 && (
              <LogList>
                {logs.slice(-14).map((line, i) => (
                  <LogLine
                    key={i}
                    $dm={dm}
                    $ok={line.startsWith('✔') || line.startsWith('✅')}
                    $warn={line.startsWith('⚠')}
                  >
                    {line}
                  </LogLine>
                ))}
              </LogList>
            )}
          </ProgressCard>
        )}

        {/* ── Resultado ── */}
        {phase === 'done' && result && (
          <PreviewBox $dm={dm}>
            <PreviewTitle $dm={dm}>Resumo do que foi criado</PreviewTitle>
            <PreviewItem $dm={dm}><i className="pi pi-list" /> {result.createdFields.length} campos personalizados</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-filter" /> {result.createdFilters.length} filtros</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-bolt" /> {result.createdAutomations.length} automações</PreviewItem>
            {result.totalErrors > 0 && (
              <PreviewItem $dm={dm} style={{ color: '#f59e0b' }}>
                <i className="pi pi-exclamation-triangle" style={{ color: '#f59e0b' }} />
                {result.totalErrors} item(s) com erro — verifique os logs acima
              </PreviewItem>
            )}
          </PreviewBox>
        )}

        {/* ── Erro ── */}
        {phase === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '0.9rem 1rem',
            color: '#ef4444',
            fontSize: '0.87rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}>
            <i className="pi pi-times-circle" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <strong>Erro durante a implementação:</strong><br />
              {errorMsg}
            </div>
          </div>
        )}

        {/* ── Botões de ação ── */}
        {phase === 'form' && (
          <ActionsRow>
            <PrimaryBtn onClick={handleImplement} disabled={!canImplement}>
              <i className="pi pi-play" />
              Implementar SLA de Cards
            </PrimaryBtn>
          </ActionsRow>
        )}

        {phase === 'done' && (
          <ActionsRow>
            <PrimaryBtn onClick={() => downloadSlaSpreadsheet(result)}>
              <i className="pi pi-download" />
              Baixar planilha de IDs
            </PrimaryBtn>
            <SecondaryBtn $dm={dm} onClick={() => setPhase('undo-confirm')}>
              <i className="pi pi-undo" /> Desfazer implementação
            </SecondaryBtn>
            <SecondaryBtn $dm={dm} onClick={handleReset}>
              <i className="pi pi-refresh" /> Nova implementação
            </SecondaryBtn>
          </ActionsRow>
        )}

        {phase === 'undo-confirm' && (
          <>
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '0.85rem 1rem',
              color: '#ef4444',
              fontSize: '0.87rem',
            }}>
              <i className="pi pi-exclamation-triangle" style={{ marginRight: '0.4rem' }} />
              <strong>Atenção:</strong> Esta ação irá deletar permanentemente todos os campos, filtros e automações criados por esta implementação na conta do Ploomes.
            </div>
            <ActionsRow>
              <PrimaryBtn $danger onClick={handleUndo}>
                <i className="pi pi-trash" />
                Confirmar deleção
              </PrimaryBtn>
              <SecondaryBtn $dm={dm} onClick={() => setPhase('done')}>
                <i className="pi pi-times" /> Cancelar
              </SecondaryBtn>
            </ActionsRow>
          </>
        )}

        {(phase === 'undone' || phase === 'error') && (
          <ActionsRow>
            <PrimaryBtn onClick={handleReset}>
              <i className="pi pi-refresh" />
              Nova implementação
            </PrimaryBtn>
          </ActionsRow>
        )}

        {phase === 'form' && ukStatus === 'valid' && (
          <HintText $dm={dm}>
            Configure as opções acima para controlar quais campos e cálculos serão criados. O preview mostra exatamente o que será gerado para cada estágio.
          </HintText>
        )}
      </FormWrapper>
    </>
  );
}
