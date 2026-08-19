// src/components/intercom-dashboard/AgentTable.jsx
import styled from 'styled-components';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tooltip } from 'primereact/tooltip';

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

const PanelTitle = styled.p`
  margin: 0 0 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.65)' : 'rgba(76,29,149,.7)')};
`;

const VolumeCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const InfoIcon = styled.i`
  font-size: 0.72rem;
  color: ${({ $dm }) => ($dm ? '#9ca3af' : '#7f69ab')};
  cursor: default;
`;

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
function fmtPct(val) {
  if (val == null || isNaN(val)) return '—';
  return `${Number(val).toFixed(1)}%`;
}

function fmtHours(val) {
  if (val == null || isNaN(val)) return '—';
  const h = Number(val);
  if (h < 1) return `${Math.round(h * 60)}min`;
  return `${h.toFixed(1)}h`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * Props:
 *   byAgent  [{ agentId, name, volume, csat, ctHoras, tmrHoras, slaPctHit }]
 *   metrics  ids de métrica a exibir como coluna (csat/ct/tmr/sla). Ausente →
 *            conjunto clássico (csat/ct/sla).
 *   dm       boolean
 */
export default function AgentTable({ byAgent, metrics, dm }) {
  if (!byAgent?.length) return null;
  const show = (id) => (Array.isArray(metrics) ? metrics.includes(id) : ['csat', 'ct', 'sla'].includes(id));

  const volumeHeader = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      Volume
      <i
        className="pi pi-info-circle agent-vol-info"
        style={{ fontSize: '0.75rem', cursor: 'help', color: dm ? '#9ca3af' : '#7f69ab' }}
        data-pr-tooltip="Volume por agente conta cada participante da conversa; a soma pode superar o total da equipe."
        data-pr-position="top"
      />
    </span>
  );

  return (
    <Panel $dm={dm}>
      <Tooltip target=".agent-vol-info" />
      <PanelTitle $dm={dm}>Por Agente</PanelTitle>
      <DataTable
        value={byAgent}
        sortMode="single"
        removableSort
        size="small"
        scrollable
        scrollHeight="360px"
        emptyMessage="Sem dados de agentes."
        style={{ fontSize: '0.87rem' }}
      >
        <Column
          field="name"
          header="Agente"
          sortable
          style={{ minWidth: 180 }}
        />
        <Column
          field="volume"
          header={volumeHeader}
          sortable
          body={(row) => (
            <VolumeCell>
              {row.volume?.toLocaleString('pt-BR') ?? '—'}
            </VolumeCell>
          )}
          style={{ minWidth: 110, textAlign: 'right' }}
          headerStyle={{ textAlign: 'right' }}
        />
        {show('csat') && (
          <Column
            field="csat"
            header="CSAT"
            sortable
            body={(row) => fmtPct(row.csat)}
            style={{ minWidth: 90, textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
        )}
        {show('ct') && (
          <Column
            field="ctHoras"
            header="CT Médio"
            sortable
            body={(row) => fmtHours(row.ctHoras)}
            style={{ minWidth: 100, textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
        )}
        {show('tmr') && (
          <Column
            field="tmrHoras"
            header="1ª Resposta"
            sortable
            body={(row) => fmtHours(row.tmrHoras)}
            style={{ minWidth: 110, textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
        )}
        {show('sla') && (
          <Column
            field="slaPctHit"
            header="SLA Hit"
            sortable
            body={(row) => fmtPct(row.slaPctHit)}
            style={{ minWidth: 90, textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
        )}
      </DataTable>
    </Panel>
  );
}
