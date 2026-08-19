// src/pages/IntercomDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';

import { useDarkMode } from '../DarkModeContext';
import { getOptions, runReport, exportReport } from '../services/intercomDashboardService';

import ServiceHeader from '../components/ServiceHeader';
import FiltersBar from '../components/intercom-dashboard/FiltersBar';
import MetricCards from '../components/intercom-dashboard/MetricCards';
import TrendChart from '../components/intercom-dashboard/TrendChart';
import TeamTable from '../components/intercom-dashboard/TeamTable';
import AgentTable from '../components/intercom-dashboard/AgentTable';
import DistributionChart from '../components/intercom-dashboard/DistributionChart';
import CustomizePanel from '../components/intercom-dashboard/CustomizePanel';
import ReportErrorBoundary from '../components/intercom-dashboard/ReportErrorBoundary';
import {
  METRIC_WIDGETS, DEFAULT_CONFIG, normalizeConfig, enabledWidgetIds,
} from '../components/intercom-dashboard/dashboardWidgets';
import {
  loadPresets, savePreset as persistPreset, deletePreset as removePreset,
  loadWorkingConfig, saveWorkingConfig,
} from '../components/intercom-dashboard/dashboardPresets';

const CHANNEL_LABELS = {
  conversation: 'Chat / Messenger', email: 'E-mail', whatsapp: 'WhatsApp',
  phone_call: 'Telefone', phone_switch: 'Telefone', instagram: 'Instagram',
  facebook: 'Facebook', sms: 'SMS', push: 'Push', twitter: 'Twitter', desconhecido: 'Desconhecido',
};
const METRIC_IDS = METRIC_WIDGETS.map((w) => w.id);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SIX_MONTHS_S = 6 * 31 * 24 * 60 * 60; // ~6 meses em segundos (margem)

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------
const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(116,67,246,0.45); }
  70%  { box-shadow: 0 0 0 14px rgba(116,67,246,0); }
  100% { box-shadow: 0 0 0 0 rgba(116,67,246,0); }
`;

const slideIndeterminate = keyframes`
  0%   { left: -42%; }
  100% { left: 100%; }
`;

const Page = styled.div`
  min-height: 100vh;
  padding: 1.4rem 1.4rem 3rem;
  width: 100%;
  color: ${({ $dm }) => ($dm ? '#efeaff' : '#1e0c45')};
  box-sizing: border-box;
`;

// Options loading/error
const OptionsNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
  background: ${({ $error, $dm }) => {
    if ($error) return $dm ? 'rgba(239,68,68,0.1)' : '#fef2f2';
    return $dm ? 'rgba(116,67,246,0.08)' : '#f5f3ff';
  }};
  border: 1px solid ${({ $error, $dm }) => {
    if ($error) return $dm ? '#ef4444' : '#fca5a5';
    return $dm ? '#3a2a6a' : '#ddd6fe';
  }};
  color: ${({ $error, $dm }) => {
    if ($error) return $dm ? '#f87171' : '#dc2626';
    return $dm ? '#c4b5fd' : '#5b21b6';
  }};
`;

// Loading panel (SSE em progresso)
const LoadingPanel = styled.div`
  background: ${({ $dm }) =>
    $dm
      ? 'linear-gradient(135deg,#1d1140,#241149)'
      : 'linear-gradient(135deg,#faf7ff,#f1eaff)'};
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a6a' : '#ddd6fe')};
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingTop = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PulseIcon = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #7b3ff2, #9a37eb);
  color: #fff;
  font-size: 1.25rem;
  animation: ${pulse} 1.8s infinite;
`;

const LoadingTexts = styled.div`
  flex: 1;
  min-width: 0;
`;

const LoadingTitle = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#f2ebff' : '#3b2163')};
`;

const LoadingSub = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  color: ${({ $dm }) => ($dm ? '#b8a8d8' : '#6f58a1')};
`;

const LogList = styled.div`
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.5rem 0.65rem;
  background: ${({ $dm }) => ($dm ? 'rgba(0,0,0,0.2)' : 'rgba(116,67,246,0.04)')};
  border-radius: 8px;
  border: 1px solid ${({ $dm }) => ($dm ? '#2a1f3d' : '#e5e0f5')};

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ $dm }) => ($dm ? '#3b2960' : '#d8caef')};
    border-radius: 3px;
  }
`;

const LogLine = styled.span`
  font-size: 0.78rem;
  font-family: monospace;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b21b6')};
  line-height: 1.4;
`;

// Barra de progresso indeterminada (antes do 1º evento de progresso do SSE).
// IMPORTANTE: keyframes de styled-components só pode ser interpolado em
// template TAGUEADO (styled/css) — em string comum o toString() lança
// (erro #12) e derrubava a página inteira (tela preta).
const IndeterminateTrack = styled.div`
  position: relative;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: ${({ $dm }) => ($dm ? '#2a1c47' : '#e9e0fb')};
`;

const IndeterminateFill = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 42%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(123,63,242,0.2), #9a37eb, rgba(123,63,242,0.2));
  animation: ${slideIndeterminate} 1.5s ease-in-out infinite;
`;

// Error panel
const ErrorPanel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  background: ${({ $dm }) => ($dm ? 'rgba(239,68,68,0.1)' : '#fef2f2')};
  border: 1px solid ${({ $dm }) => ($dm ? '#ef4444' : '#fca5a5')};

  > i.icon-main {
    flex-shrink: 0;
    margin-top: 0.15rem;
    font-size: 1.2rem;
    color: ${({ $dm }) => ($dm ? '#f87171' : '#dc2626')};
  }

  strong {
    display: block;
    font-size: 0.92rem;
    color: ${({ $dm }) => ($dm ? '#fca5a5' : '#b91c1c')};
    margin-bottom: 0.35rem;
  }

  p {
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.55;
    color: ${({ $dm }) => ($dm ? '#f0a8a8' : '#dc2626')};
    word-break: break-word;
  }
`;

// Results section
const ResultsSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const ResultsMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.1rem;
  flex-wrap: wrap;
`;

const MetaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $dm }) => ($dm ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.1)')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#6d28d9')};
  border: 1px solid ${({ $dm }) => ($dm ? '#5b14b8' : '#c4b5fd')};
`;

// Estado vazio: relatório gerado, mas nenhum atendimento no período/filtros.
const EmptyPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
  border-radius: 14px;
  padding: 2.25rem 1.5rem;
  margin-bottom: 1.25rem;
  background: ${({ $dm }) => ($dm ? '#1a0e2e' : '#f9f7ff')};
  border: 1px dashed ${({ $dm }) => ($dm ? '#3a2a6a' : '#ddd6fe')};
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.55)' : 'rgba(76,29,149,.55)')};
  font-size: 0.88rem;

  i {
    font-size: 2rem;
    opacity: 0.6;
  }
`;

// ---------------------------------------------------------------------------
// Default filter state
// ---------------------------------------------------------------------------
// Relatório sem nenhum atendimento: sem conversas criadas, avaliadas ou
// fechadas no período — mostra estado vazio em vez de grid zerado.
function isEmptyResult(result) {
  const t = result?.totals;
  if (!t) return true;
  return !t.volume && !(t.csatBase?.total) && !t.ctBaseCount
    && !((t.sla?.hit ?? 0) + (t.sla?.missed ?? 0) + (t.sla?.cancelled ?? 0) + (t.sla?.active ?? 0));
}

function buildDefaultFilters() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setMonth(start.getMonth() - 3);
  start.setHours(0, 0, 0, 0);

  return {
    teamIds: [],
    agentIds: [],
    periodStart: Math.floor(start.getTime() / 1000),
    periodEnd: Math.floor(end.getTime() / 1000),
    excludeChamadosFup: true,
    channel: null,
    tagIds: [],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function IntercomDashboard() {
  const { darkMode: dm } = useDarkMode();
  const toast = useRef(null);

  // Options (equipes + agentes para os filtros)
  const [options, setOptions] = useState({ teams: [], agents: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');

  // Filtros
  const [filters, setFilters] = useState(buildDefaultFilters);

  // Configuração de widgets (personalização) + presets (localStorage)
  const [config, setConfig] = useState(() => loadWorkingConfig() || DEFAULT_CONFIG);
  const [appliedConfig, setAppliedConfig] = useState(() => normalizeConfig(loadWorkingConfig() || DEFAULT_CONFIG));
  const [presets, setPresets] = useState(() => loadPresets());
  // Incrementa ao aplicar preset → sinaliza a FiltersBar p/ ressincronizar o
  // seletor de período (modo/calendário) com os filtros carregados.
  const [periodSyncKey, setPeriodSyncKey] = useState(0);

  // Fluxo principal
  const [phase, setPhase] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [pct, setPct] = useState(0);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [runId, setRunId] = useState(0); // remonta o ErrorBoundary a cada geração
  const abortRef = useRef(null);

  // Cancela o SSE em andamento se o usuário sair da página no meio da geração.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Carga inicial de opções
  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError('');
    getOptions()
      .then((data) => {
        if (!cancelled) {
          setOptions(data ?? { teams: [], agents: [] });
        }
      })
      .catch((err) => {
        if (!cancelled) setOptionsError(err.message);
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleFiltersChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  // Personalização — persiste a config de trabalho a cada mudança.
  const handleConfigChange = (next) => {
    const norm = normalizeConfig(next);
    setConfig(norm);
    saveWorkingConfig(norm);
  };

  const handleSavePreset = (name) => {
    setPresets(persistPreset(name, { config, filters }));
    toast.current?.show({ severity: 'success', summary: 'Preset salvo', detail: `"${name}" salvo neste navegador.`, life: 3000 });
  };
  const handleApplyPreset = (preset) => {
    handleConfigChange(preset.config);
    if (preset.filters) {
      setFilters((prev) => ({ ...prev, ...preset.filters }));
      // Se o preset traz período, força a FiltersBar a refletir isso no seletor.
      if (preset.filters.periodStart && preset.filters.periodEnd) {
        setPeriodSyncKey((k) => k + 1);
      }
    }
    toast.current?.show({ severity: 'info', summary: 'Preset aplicado', detail: preset.name, life: 2500 });
  };
  const handleDeletePreset = (name) => setPresets(removePreset(name));

  const handleExport = async () => {
    if (!result) return;
    setExporting(true);
    try {
      await exportReport(result);
    } catch (err) {
      if (!err?.isPermissionError) {
        toast.current?.show({ severity: 'error', summary: 'Falha ao exportar', detail: err.message, life: 5000 });
      }
    } finally {
      setExporting(false);
    }
  };

  const handleGenerate = async () => {
    const { teamIds, periodStart, periodEnd } = filters;

    // Validação no cliente
    if (!teamIds?.length) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Selecione ao menos uma equipe.', life: 4000 });
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Defina o período antes de gerar.', life: 4000 });
      return;
    }
    if (periodEnd - periodStart > SIX_MONTHS_S) {
      toast.current?.show({ severity: 'warn', summary: 'Período inválido', detail: 'O intervalo máximo é de 6 meses.', life: 5000 });
      return;
    }

    // Congela a config usada nesta geração (o painel pode mudar depois sem
    // desalinhar dados renderizados × dados buscados).
    const genConfig = normalizeConfig(config);
    const widgets = enabledWidgetIds(genConfig);
    if (widgets.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Selecione ao menos um widget em "Personalizar relatório".', life: 4500 });
      return;
    }
    setAppliedConfig(genConfig);

    setPhase('loading');
    setPct(0);
    setLogs([]);
    setResult(null);
    setErrorMsg('');
    setRunId((n) => n + 1);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const payload = {
      periodStart: filters.periodStart,
      periodEnd: filters.periodEnd,
      teamIds: filters.teamIds,
      agentIds: filters.agentIds?.length ? filters.agentIds : undefined,
      excludeChamadosFup: filters.excludeChamadosFup,
      widgets,
      channel: filters.channel || undefined,
      tagIds: filters.tagIds?.length ? filters.tagIds : undefined,
    };

    try {
      const completed = await runReport(payload, {
        signal: controller.signal,
        onProgress: (data) => {
          if (data.pct != null) setPct(data.pct);
          if (data.msg) setLogs((prev) => [...prev, data.msg]);
        },
      });

      // undefined = 401 (handleError já redirecionou para o login).
      if (!completed) {
        setPhase('idle');
        return;
      }

      setResult(completed);
      setPhase('done');
      setPct(100);
    } catch (err) {
      // Cancelamento (nova geração ou saída da página) não é erro.
      if (err?.name === 'AbortError') return;
      // 403 de permissão: toast global + redirect já disparados pelo handleError.
      if (err?.isPermissionError) {
        setPhase('idle');
        return;
      }
      setErrorMsg(err.message);
      setPhase('error');
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  function renderMeta() {
    if (!result?.meta) return null;
    const { periodStart, periodEnd, generatedAt } = result.meta;
    const fmt = (unix) =>
      new Date(unix * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fmtTs = (iso) =>
      new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <ResultsMeta>
        <MetaBadge $dm={dm}>
          <i className="pi pi-calendar" />
          {fmt(periodStart)} — {fmt(periodEnd)}
        </MetaBadge>
        {generatedAt && (
          <MetaBadge $dm={dm}>
            <i className="pi pi-clock" />
            Gerado às {fmtTs(generatedAt)}
          </MetaBadge>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
          {!isEmptyResult(result) && (
            <Button
              label="Exportar XLSX"
              icon={exporting ? 'pi pi-spin pi-spinner' : 'pi pi-file-excel'}
              size="small"
              outlined
              disabled={exporting}
              onClick={handleExport}
              style={{ borderColor: dm ? '#22c55e' : '#86efac', color: dm ? '#4ade80' : '#16a34a' }}
            />
          )}
          <Button
            label="Novo relatório"
            icon="pi pi-refresh"
            text
            size="small"
            onClick={() => { setPhase('idle'); setResult(null); }}
            style={{ color: dm ? '#c4b5fd' : '#7443F6' }}
          />
        </div>
      </ResultsMeta>
    );
  }

  // Renderiza um bloco pela sua id, na ordem da config aplicada.
  function renderBlock(id) {
    if (!appliedConfig.enabled[id]) return null;
    const metricCols = METRIC_IDS.filter((m) => appliedConfig.enabled[m]);
    switch (id) {
      case 'trend':
        return <TrendChart key={id} series={result.series} dm={dm} />;
      case 'channel':
        return (
          <DistributionChart
            key={id} title="Distribuição por canal" type="doughnut" dm={dm}
            data={(result.channels || []).map((c) => ({ label: CHANNEL_LABELS[c.type] || c.type, value: c.count }))}
          />
        );
      case 'tags':
        return (
          <DistributionChart
            key={id} title="Top tags" type="bar" dm={dm}
            data={(result.tags || []).map((t) => ({ label: t.name, value: t.count }))}
          />
        );
      case 'demand':
        return (
          <DistributionChart
            key={id} title="Por tipo de demanda" type="bar" dm={dm}
            data={(result.demand || []).map((d) => ({ label: d.value, value: d.count }))}
          />
        );
      case 'byTeam':
        return <TeamTable key={id} byTeam={result.byTeam} metrics={metricCols} dm={dm} />;
      case 'byAgent':
        return <AgentTable key={id} byAgent={result.byAgent} metrics={metricCols} dm={dm} />;
      default:
        return null;
    }
  }

  return (
    <Page $dm={dm}>
      <Toast ref={toast} />

      {/* Header */}
      <ServiceHeader
        platforms={['intercom']}
        title="Dashboard Intercom"
        subtitle="Volume, CSAT, CT e SLA por equipe e agente"
      />

      {/* Options loading/error */}
      {optionsLoading && (
        <OptionsNotice $dm={dm}>
          <i className="pi pi-spin pi-spinner" />
          Carregando equipes e agentes…
        </OptionsNotice>
      )}
      {optionsError && !optionsLoading && (
        <OptionsNotice $error $dm={dm}>
          <i className="pi pi-exclamation-triangle" />
          <span>
            Erro ao carregar opções de filtro: {optionsError}.{' '}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'inherit', padding: 0, font: 'inherit' }}
            >
              Recarregar página
            </button>
          </span>
        </OptionsNotice>
      )}

      {/* Filtros — sempre visível */}
      <FiltersBar
        options={options}
        value={filters}
        onChange={handleFiltersChange}
        onGenerate={handleGenerate}
        loading={phase === 'loading'}
        periodSyncKey={periodSyncKey}
        dm={dm}
      />

      {/* Personalização do relatório (widgets + presets) */}
      <CustomizePanel
        config={config}
        onChange={handleConfigChange}
        presets={presets}
        onSavePreset={handleSavePreset}
        onApplyPreset={handleApplyPreset}
        onDeletePreset={handleDeletePreset}
        dm={dm}
      />

      {/* Conteúdo do relatório — protegido por ErrorBoundary local: exceção de
          render vira card de erro com retry, nunca mais desmonta o app. */}
      <ReportErrorBoundary key={runId} dm={dm} onRetry={handleGenerate}>
        {/* Loading (SSE em progresso) */}
        {phase === 'loading' && (
          <LoadingPanel $dm={dm}>
            <LoadingTop>
              <PulseIcon>
                <i className="pi pi-bolt" />
              </PulseIcon>
              <LoadingTexts>
                <LoadingTitle $dm={dm}>Gerando relatório…</LoadingTitle>
                <LoadingSub $dm={dm}>
                  {pct > 0 ? `${pct}% concluído` : 'Processando dados no servidor…'}
                </LoadingSub>
              </LoadingTexts>
            </LoadingTop>

            {pct > 0 ? (
              <ProgressBar value={pct} style={{ height: '8px', borderRadius: '999px' }} />
            ) : (
              <IndeterminateTrack $dm={dm}>
                <IndeterminateFill />
              </IndeterminateTrack>
            )}

            {logs.length > 0 && (
              <LogList $dm={dm}>
                {logs.map((msg, i) => (
                  <LogLine key={i} $dm={dm}>&gt; {msg}</LogLine>
                ))}
              </LogList>
            )}
          </LoadingPanel>
        )}

        {/* Erro */}
        {phase === 'error' && (
          <ErrorPanel $dm={dm}>
            <i className="pi pi-exclamation-triangle icon-main" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>Não foi possível gerar o relatório</strong>
              <p>{errorMsg}</p>
            </div>
            <Button
              label="Tentar novamente"
              icon="pi pi-refresh"
              size="small"
              outlined
              onClick={handleGenerate}
              style={{
                flexShrink: 0,
                alignSelf: 'center',
                borderColor: dm ? '#ef4444' : '#fca5a5',
                color: dm ? '#f87171' : '#dc2626',
              }}
            />
          </ErrorPanel>
        )}

        {/* Resultados — cards de métrica habilitados + blocos na ordem escolhida */}
        {phase === 'done' && result && (
          <ResultsSection>
            {renderMeta()}
            {isEmptyResult(result) ? (
              <EmptyPanel $dm={dm}>
                <i className="pi pi-inbox" />
                <span>
                  Nenhum atendimento encontrado no período e filtros selecionados.
                  Ajuste o período, as equipes ou os agentes e gere novamente.
                </span>
              </EmptyPanel>
            ) : (
              <>
                <MetricCards
                  totals={result.totals}
                  metrics={METRIC_IDS.filter((m) => appliedConfig.enabled[m])}
                  dm={dm}
                />
                {appliedConfig.order.map((id) => renderBlock(id))}
              </>
            )}
          </ResultsSection>
        )}
      </ReportErrorBoundary>
    </Page>
  );
}
