// src/components/intercom-dashboard/DistributionChart.jsx
//
// Painel reutilizável de distribuição (canal / tag / tipo de demanda).
// type='doughnut' (categorias poucas, ex. canal) ou 'bar' (ranking horizontal).
// Usa a lib já existente no projeto (primereact/chart → chart.js). Sem lib nova.
import { useMemo } from 'react';
import styled from 'styled-components';
import { Chart } from 'primereact/chart';

const Panel = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a0e2e' : '#f9f7ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2a1f3d' : '#e5e0f5')};
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: ${({ $dm }) =>
    $dm ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.07)'};
`;

const PanelTitle = styled.p`
  margin: 0 0 1.1rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.65)' : 'rgba(76,29,149,.7)')};
`;

const EmptyMsg = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  font-size: 0.88rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.4)' : 'rgba(76,29,149,.4)')};
`;

// Paleta categórica derivada do DS (roxo Ploomes + apoios).
const PALETTE = ['#7443F6', '#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6', '#EF4444', '#6366F1', '#84CC16'];

/**
 * Props:
 *   title  string
 *   data   [{ label, value }]
 *   type   'doughnut' | 'bar'
 *   dm     boolean
 */
export default function DistributionChart({ title, data, type = 'bar', dm }) {
  const rows = useMemo(
    () => (Array.isArray(data) ? data.filter((d) => d && d.value > 0) : []),
    [data],
  );

  const chartData = useMemo(() => {
    if (!rows.length) return null;
    const labels = rows.map((d) => d.label);
    const values = rows.map((d) => d.value);
    const colors = rows.map((_, i) => PALETTE[i % PALETTE.length]);
    if (type === 'doughnut') {
      return {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: dm ? '#1a0e2e' : '#fff',
          borderWidth: 2,
        }],
      };
    }
    return {
      labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
        maxBarThickness: 26,
      }],
    };
  }, [rows, type, dm, title]);

  const options = useMemo(() => {
    const tickColor = dm ? 'rgba(226,232,240,.7)' : 'rgba(76,29,149,.7)';
    const gridColor = dm ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
    if (type === 'doughnut') {
      return {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: { position: 'right', labels: { color: tickColor, font: { size: 12 }, boxWidth: 14 } },
        },
      };
    }
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { color: tickColor, font: { size: 11 }, precision: 0 }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor, font: { size: 11 } }, grid: { color: 'transparent' } },
      },
    };
  }, [dm, type]);

  return (
    <Panel $dm={dm}>
      <PanelTitle $dm={dm}>{title}</PanelTitle>
      {rows.length ? (
        <Chart type={type} data={chartData} options={options} style={{ maxHeight: type === 'doughnut' ? 280 : Math.max(160, rows.length * 34 + 40) }} />
      ) : (
        <EmptyMsg $dm={dm}>
          <i className="pi pi-chart-bar" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
          Sem dados para exibir.
        </EmptyMsg>
      )}
    </Panel>
  );
}
