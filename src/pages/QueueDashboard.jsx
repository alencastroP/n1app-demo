// src/pages/QueueDashboard.jsx
import { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { ProgressSpinner } from 'primereact/progressspinner';
import styled, { keyframes } from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import { getQueueStatus } from '../services/queueService';

// ─── animations ───────────────────────────────────────────────────────────────
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;

// ─── page shell ───────────────────────────────────────────────────────────────
const Container = styled.div`
  min-height: 100vh;
  padding: 1rem 1rem 2rem 3rem;
  width: 100%;
  color: ${({ $dark }) => ($dark ? '#eee' : '#333')};
`;

// ─── header actions ─────────────────────────────────────────────────────────
const HeaderBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
  background: ${({ $dark }) => ($dark ? 'rgba(76,29,149,.35)' : 'rgba(139,92,246,.14)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.3)' : 'rgba(139,92,246,.25)')};
`;

const MonitorLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  text-decoration: none;
  color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
  background: ${({ $dark }) => ($dark ? 'rgba(76,29,149,.25)' : 'rgba(139,92,246,.1)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.25)' : 'rgba(139,92,246,.2)')};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(139,92,246,.5)' : 'rgba(124,58,237,.18)')};
    color: ${({ $dark }) => ($dark ? '#f3e8ff' : '#4c1d95')};
    transform: translateY(-1px);
  }
`;

// ─── selector section ─────────────────────────────────────────────────────────
const SelectorPanel = styled.div`
  background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#f9f7ff')};
  border: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : '#e5e0f5')};
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: ${({ $dark }) =>
    $dark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.07)'};
`;

const SelectorLabel = styled.p`
  font-size: 0.88rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: ${({ $dark }) => ($dark ? 'rgba(226,232,240,.75)' : 'rgba(76,29,149,.8)')};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StyledDropdown = styled(Dropdown)`
  width: 100%;
  max-width: 320px;

  &:focus-within {
    box-shadow: 0 0 0 3px rgba(116,67,246,.3);
  }
`;

// ─── metrics row (Gestalt: similarity + proximity) ────────────────────────────
const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
  animation: ${fadeIn} 0.35s ease;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  background: ${({ $dark }) => ($dark ? '#1e1148' : '#fff')};
  border: 1px solid ${({ $dark, $accent }) =>
    $dark ? `rgba(${$accent},0.35)` : `rgba(${$accent},0.2)`};
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: ${({ $dark }) =>
    $dark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.08)'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $dark }) =>
      $dark ? '0 6px 24px rgba(116,67,246,0.25)' : '0 4px 18px rgba(100,60,180,0.15)'};
  }
`;

const MetricIcon = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 12px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: ${({ $dark, $accent }) =>
    $dark
      ? `radial-gradient(circle, rgba(${$accent},.28) 0%, rgba(${$accent},.14) 100%)`
      : `radial-gradient(circle, rgba(${$accent},.18) 0%, rgba(${$accent},.08) 100%)`};
  border: 1px solid ${({ $dark, $accent }) =>
    $dark ? `rgba(${$accent},.4)` : `rgba(${$accent},.25)`};

  i {
    font-size: 1.3rem;
    color: ${({ $dark, $color }) => ($dark ? $color.light : $color.dark)};
  }
`;

const MetricBody = styled.div`display: flex; flex-direction: column; gap: 2px;`;

const MetricValue = styled.span`
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  color: ${({ $dark }) => ($dark ? '#f3e8ff' : '#2a0a50')};
`;

const MetricLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dark }) => ($dark ? 'rgba(226,232,240,.65)' : 'rgba(76,29,149,.65)')};
`;

// ─── chart panel ──────────────────────────────────────────────────────────────
const ChartPanel = styled.div`
  background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#f9f7ff')};
  border: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : '#e5e0f5')};
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  box-shadow: ${({ $dark }) =>
    $dark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.07)'};
  animation: ${fadeIn} 0.4s ease;
`;

const ChartLabel = styled.p`
  font-size: 0.88rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: ${({ $dark }) => ($dark ? 'rgba(226,232,240,.75)' : 'rgba(76,29,149,.8)')};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// ─── loading / empty states ───────────────────────────────────────────────────
const CenteredState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  color: ${({ $dark }) => ($dark ? 'rgba(226,232,240,.5)' : 'rgba(76,29,149,.45)')};
`;

const EmptyIcon = styled.i`
  font-size: 2.5rem;
  color: ${({ $dark }) => ($dark ? 'rgba(196,181,253,.4)' : 'rgba(139,92,246,.3)')};
`;

const EmptyText = styled.p`
  font-size: 0.95rem;
  margin: 0;
  text-align: center;
`;

// ─── accent palette for each metric ───────────────────────────────────────────
const WEBHOOKS_ACCENT  = { rgb: '116,67,246',  color: { dark: '#c4a8ff', light: '#6a4fcf' } };
const AUTOMATIONS_ACCENT = { rgb: '91,134,230', color: { dark: '#a5c0ff', light: '#3b5ebf' } };

// ─── component ────────────────────────────────────────────────────────────────
export default function QueueDashboard() {
  const { darkMode: dark } = useDarkMode();
  const [selectedShard, setSelectedShard] = useState(null);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const shards = Array.from({ length: 13 }, (_, i) => ({ label: `Shard ${i + 1}`, value: i + 1 }));

  const handleShardChange = async (value) => {
    setSelectedShard(value);
    setLoading(true);
    setData(null);
    try {
      const res = await getQueueStatus(value);
      setData(res);
    } catch (err) {
      console.error('Erro ao buscar dados da fila:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = data
    ? {
        labels: ['Webhooks', 'Automações'],
        datasets: [{
          label: `Shard ${data.shard}`,
          data: [data.webhooks, data.automations],
          backgroundColor: dark
            ? ['rgba(116,67,246,0.75)', 'rgba(91,134,230,0.75)']
            : ['rgba(116,67,246,0.85)', 'rgba(91,134,230,0.85)'],
          borderColor: dark
            ? ['rgba(196,181,253,0.6)', 'rgba(165,192,255,0.6)']
            : ['rgba(116,67,246,0.9)',  'rgba(91,134,230,0.9)'],
          borderWidth: 2,
          borderRadius: 8,
        }],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: dark ? 'rgba(226,232,240,.7)' : 'rgba(76,29,149,.7)', font: { size: 12 } },
        grid:  { color: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)' },
      },
      x: {
        ticks: { color: dark ? 'rgba(226,232,240,.7)' : 'rgba(76,29,149,.7)', font: { size: 12 } },
        grid:  { color: 'transparent' },
      },
    },
  };

  return (
    <Container $dark={dark}>
      {/* ── header ── */}
      <ServiceHeader
        platforms={[]}
        icon="pi pi-server"
        title="Filas por Shard"
        subtitle="Acompanhe em tempo real o status das filas de processamento por shard."
        actions={
          <>
            <MonitorLink
              $dark={dark}
              href="https://monitor.demo.invalid/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="pi pi-external-link" />
              Monitor N2
            </MonitorLink>
            <HeaderBadge $dark={dark}>Queue</HeaderBadge>
          </>
        }
      />

      {/* ── shard selector ── */}
      <SelectorPanel $dark={dark}>
        <SelectorLabel $dark={dark}>Selecionar Shard</SelectorLabel>
        <StyledDropdown
          value={selectedShard}
          options={shards}
          onChange={(e) => handleShardChange(e.value)}
          placeholder="Escolha um shard..."
        />
      </SelectorPanel>

      {/* ── loading ── */}
      {loading && (
        <CenteredState $dark={dark}>
          <ProgressSpinner style={{ width: 48, height: 48 }} />
          <EmptyText $dark={dark}>Consultando fila…</EmptyText>
        </CenteredState>
      )}

      {/* ── empty state (no shard selected yet) ── */}
      {!loading && !data && !selectedShard && (
        <CenteredState $dark={dark}>
          <EmptyIcon className="pi pi-chart-bar" $dark={dark} />
          <EmptyText $dark={dark}>Selecione um shard acima para visualizar o status das filas.</EmptyText>
        </CenteredState>
      )}

      {/* ── data: metrics + chart ── */}
      {!loading && data && (
        <>
          {/* metrics row — Gestalt: similaridade + proximidade */}
          <MetricsRow>
            <MetricCard $dark={dark} $accent={WEBHOOKS_ACCENT.rgb}>
              <MetricIcon $dark={dark} $accent={WEBHOOKS_ACCENT.rgb} $color={WEBHOOKS_ACCENT.color}>
                <i className="pi pi-bolt" />
              </MetricIcon>
              <MetricBody>
                <MetricValue $dark={dark}>{data.webhooks.toLocaleString('pt-BR')}</MetricValue>
                <MetricLabel $dark={dark}>Webhooks</MetricLabel>
              </MetricBody>
            </MetricCard>

            <MetricCard $dark={dark} $accent={AUTOMATIONS_ACCENT.rgb}>
              <MetricIcon $dark={dark} $accent={AUTOMATIONS_ACCENT.rgb} $color={AUTOMATIONS_ACCENT.color}>
                <i className="pi pi-cog" />
              </MetricIcon>
              <MetricBody>
                <MetricValue $dark={dark}>{data.automations.toLocaleString('pt-BR')}</MetricValue>
                <MetricLabel $dark={dark}>Automações</MetricLabel>
              </MetricBody>
            </MetricCard>
          </MetricsRow>

          {/* chart panel */}
          <ChartPanel $dark={dark}>
            <ChartLabel $dark={dark}>Distribuição — Shard {data.shard}</ChartLabel>
            <Chart type="bar" data={chartData} options={chartOptions} />
          </ChartPanel>
        </>
      )}
    </Container>
  );
}
