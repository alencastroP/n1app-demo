// src/components/intercom-dashboard/TrendChart.jsx
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Chart } from 'primereact/chart';

// ---------------------------------------------------------------------------
// Metric options
// ---------------------------------------------------------------------------
const METRICS = [
  { label: 'Volume',   value: 'volume',    unit: '',    color: '#7443F6' },
  { label: 'CSAT %',  value: 'csat',       unit: '%',   color: '#22C55E' },
  { label: 'CT (h)',   value: 'ctHoras',   unit: 'h',   color: '#3B82F6' },
  { label: 'SLA %',   value: 'slaPctHit', unit: '%',   color: '#F59E0B' },
];

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------
const Panel = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a0e2e' : '#f9f7ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2a1f3d' : '#e5e0f5')};
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: ${({ $dm }) =>
    $dm ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.07)'};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
`;

const PanelTitle = styled.p`
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.65)' : 'rgba(76,29,149,.7)')};
`;

const ToggleRow = styled.div`
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a6a' : '#ddd6fe')};
`;

const ToggleBtn = styled.button`
  padding: 0.38rem 0.75rem;
  font-size: 0.76rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: ${({ $active, $dm, $color }) =>
    $active
      ? $color
      : $dm
        ? '#1a0e2e'
        : '#f5f3ff'};
  color: ${({ $active, $dm }) =>
    $active ? '#fff' : $dm ? '#c4b5fd' : '#5b21b6'};

  &:hover:not([disabled]) {
    opacity: ${({ $active }) => ($active ? 1 : 0.85)};
    background: ${({ $active, $dm }) =>
      $active ? undefined : $dm ? '#2b1f49' : '#ede8ff'};
  }
`;

const EmptyMsg = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  font-size: 0.88rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.4)' : 'rgba(76,29,149,.4)')};
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * Props:
 *   series  [{ bucket:'YYYY-MM', volume, csat, ctHoras, slaPctHit }]
 *   dm      boolean
 */
export default function TrendChart({ series, dm }) {
  const [activeMetric, setActiveMetric] = useState('volume');

  const metric = METRICS.find((m) => m.value === activeMetric) ?? METRICS[0];

  const chartData = useMemo(() => {
    if (!series?.length) return null;

    const sorted = [...series].sort((a, b) => (a.bucket > b.bucket ? 1 : -1));
    const labels = sorted.map((s) => {
      const [y, m] = s.bucket.split('-');
      return `${m}/${y}`;
    });
    const data = sorted.map((s) => {
      const v = s[metric.value];
      return v != null ? Number(v) : null;
    });

    const baseColor = metric.color;
    const alphaFill = dm ? '0.12' : '0.08';

    return {
      labels,
      datasets: [
        {
          label: metric.label,
          data,
          borderColor: baseColor,
          backgroundColor: `${baseColor}${Math.round(Number(alphaFill) * 255).toString(16).padStart(2, '0')}`,
          pointBackgroundColor: baseColor,
          pointBorderColor: dm ? '#1a0e2e' : '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true,
          borderWidth: 2,
          spanGaps: true,
        },
      ],
    };
  }, [series, metric, dm]);

  const chartOptions = useMemo(() => {
    const tickColor = dm ? 'rgba(226,232,240,.7)' : 'rgba(76,29,149,.7)';
    const gridColor = dm ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
    const unit = metric.unit;

    return {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw;
              if (val == null) return 'sem dados';
              if (unit === '%') return `${Number(val).toFixed(1)}%`;
              if (unit === 'h') return `${Number(val).toFixed(1)}h`;
              return val.toLocaleString('pt-BR');
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: tickColor,
            font: { size: 11 },
            callback: (v) => {
              if (unit === '%') return `${v}%`;
              if (unit === 'h') return `${v}h`;
              return v.toLocaleString('pt-BR');
            },
          },
          grid: { color: gridColor },
        },
        x: {
          ticks: { color: tickColor, font: { size: 11 } },
          grid: { color: 'transparent' },
        },
      },
    };
  }, [dm, metric]);

  if (!series?.length) {
    return (
      <Panel $dm={dm}>
        <PanelHeader>
          <PanelTitle $dm={dm}>Tendência Mensal</PanelTitle>
        </PanelHeader>
        <EmptyMsg $dm={dm}>
          <i className="pi pi-chart-line" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
          Sem dados de série temporal.
        </EmptyMsg>
      </Panel>
    );
  }

  return (
    <Panel $dm={dm}>
      <PanelHeader>
        <PanelTitle $dm={dm}>Tendência Mensal</PanelTitle>
        <ToggleRow $dm={dm}>
          {METRICS.map((m) => (
            <ToggleBtn
              key={m.value}
              type="button"
              aria-pressed={activeMetric === m.value}
              $active={activeMetric === m.value}
              $dm={dm}
              $color={m.color}
              onClick={() => setActiveMetric(m.value)}
            >
              {m.label}
            </ToggleBtn>
          ))}
        </ToggleRow>
      </PanelHeader>

      <Chart type="line" data={chartData} options={chartOptions} style={{ maxHeight: 320 }} />
    </Panel>
  );
}
