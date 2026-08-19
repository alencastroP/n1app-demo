import { useState, useRef, useCallback } from 'react';
import { Toast } from 'primereact/toast';
import styled, { keyframes } from 'styled-components';
import { useDarkMode } from '../../../DarkModeContext';
import {
  validateUserKey,
  fetchPipelines,
  implementVolumeCompras,
  undoVolumeCompras,
  downloadVolumeComprasSpreadsheet,
  FIELD_DEFS,
  TOTAL_FIELDS,
  TOTAL_FILTERS,
  TOTAL_AUTOMATIONS,
} from '../../../services/volumeComprasService';
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

const SectionTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  i { font-size: 0.8rem; color: #7443f6; }
`;

// ── Pipeline selector ────────────────────────────────────────────────────────

const SelectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 240px;
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

const Warning = styled.div`
  font-size: 0.78rem;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 0.35rem;
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function VolumeComprasForm() {
  const { darkMode: dm } = useDarkMode();
  const toast = useRef(null);

  const [uk, setUk] = useState('');
  const [ukStatus, setUkStatus] = useState('idle'); // idle | validating | valid | invalid
  const [ukError, setUkError] = useState('');

  const [pipelines, setPipelines] = useState([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [selectedPipelineIds, setSelectedPipelineIds] = useState([]);

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
  }

  function validate() {
    if (ukStatus !== 'valid') { warn('Valide a User-Key antes de continuar.'); return false; }
    if (selectedPipelineIds.length === 0) { warn('Selecione pelo menos 1 funil.'); return false; }
    return true;
  }

  const selectedPipelines = pipelines.filter((p) => selectedPipelineIds.includes(p.Id));

  async function handleImplement() {
    if (!validate()) return;

    setPhase('implementing');
    setLogs([]);
    setPct(0);
    setErrorMsg('');

    // 5 campos + 18 filtros + 18 automações = 41 passos
    const totalSteps = TOTAL_FIELDS + TOTAL_FILTERS + TOTAL_AUTOMATIONS;
    let stepsDone = 0;

    try {
      const res = await implementVolumeCompras({
        uk: uk.trim(),
        pipelines: selectedPipelines,
        onProgress: (msg) => {
          addLog(msg);
          if (msg.startsWith('✔') || msg.startsWith('⚠')) {
            stepsDone++;
            setPct(Math.min(Math.round((stepsDone / Math.max(totalSteps, 1)) * 95), 95));
          }
        },
      });
      setPct(100);
      setResult(res);
      logAction({ a: 'execucao', s: 'process-implementer', d: `Volume de Compras · ${selectedPipelines.length} funis` }); // best-effort
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
      await undoVolumeCompras({
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
      logAction({ a: 'execucao', s: 'process-implementer', d: 'Volume de Compras · undo concluído' }); // best-effort
      setPhase('undone');
    } catch (err) {
      addLog(`⚠ Erro: ${err.message}`);
      logAction({ a: 'execucao', s: 'process-implementer', d: 'Volume de Compras · undo parcial', r: 'erro' }); // best-effort
      setPhase('undone');
    }
  }

  function handleReset() {
    setUk('');
    setUkStatus('idle');
    setUkError('');
    setPipelines([]);
    setSelectedPipelineIds([]);
    setPhase('form');
    setLogs([]);
    setPct(0);
    setResult(null);
    setErrorMsg('');
  }

  const canImplement =
    ukStatus === 'valid' &&
    selectedPipelineIds.length > 0 &&
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
              Funis considerados no cálculo *
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
                {selectedPipelineIds.length === 0 && (
                  <Warning>
                    <i className="pi pi-exclamation-triangle" />
                    Selecione pelo menos 1 funil para contabilizar o volume de compras.
                  </Warning>
                )}
              </>
            )}
          </Card>
        )}

        {/* ── Preview do que será criado ── */}
        {canImplement && (
          <PreviewBox $dm={dm}>
            <ContaAtivaHint uk={uk} />
            <PreviewTitle $dm={dm}>O que será criado na conta</PreviewTitle>
            {FIELD_DEFS.map((f) => (
              <PreviewItem key={f.key} $dm={dm}>
                <i className="pi pi-dollar" /> Campo de moeda "{f.name}" (no Cliente)
              </PreviewItem>
            ))}
            <PreviewItem $dm={dm}><i className="pi pi-plus-circle" /> 1 automação de soma (negócio ganho) → mês, ano e total</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-minus-circle" /> 15 automações de subtração (excluído / perdido / reaberto × 5 períodos)</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-calendar" /> 1 automação periódica mensal (vira mês → mês passado e zera o mês)</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-calendar" /> 1 automação periódica anual (vira ano → ano passado e zera o ano)</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-filter" /> Filtros de gatilho dos funis: {selectedPipelines.map((p) => p.Name).join(', ')}</PreviewItem>
            <PreviewTotal $dm={dm}>
              Total estimado: {TOTAL_FIELDS} campos · {TOTAL_FILTERS} filtros · {TOTAL_AUTOMATIONS} automações
            </PreviewTotal>
          </PreviewBox>
        )}

        {/* ── Progress ── */}
        {(isActive || phase === 'done' || phase === 'undone') && (
          <ProgressCard $dm={dm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: dm ? '#c4b5fd' : '#4a2fa0' }}>
                {phase === 'done' ? '✅ Volume de Compras implementado!' :
                 phase === 'undone' ? '✅ Implementação desfeita!' :
                 phase === 'undoing' ? '🗑️ Desfazendo implementação…' :
                 '⚙️ Implementando Volume de Compras…'}
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
            <PreviewItem $dm={dm}><i className="pi pi-dollar" /> {result.createdFields.length} campos de moeda no Cliente</PreviewItem>
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
              Implementar Volume de Compras
            </PrimaryBtn>
            {selectedPipelineIds.length > 0 && (
              <SecondaryBtn $dm={dm} onClick={() => setSelectedPipelineIds([])}>
                <i className="pi pi-times" /> Limpar seleção
              </SecondaryBtn>
            )}
          </ActionsRow>
        )}

        {phase === 'done' && (
          <ActionsRow>
            <PrimaryBtn onClick={() => downloadVolumeComprasSpreadsheet(result)}>
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
            A implementação cria campos de moeda no Cliente e as automações que somam (negócio ganho) e
            subtraem (perdido / reaberto / excluído) o valor por período, além das viradas de mês e ano
            agendadas de madrugada. O preenchimento retroativo de valores já existentes não é feito nesta versão.
          </HintText>
        )}
      </FormWrapper>
    </>
  );
}
