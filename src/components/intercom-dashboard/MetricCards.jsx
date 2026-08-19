// src/components/intercom-dashboard/MetricCards.jsx
import styled, { keyframes } from 'styled-components';

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
  animation: ${fadeUp} 0.35s ease;
`;

const Card = styled.div`
  background: ${({ $dm }) => ($dm ? '#1e1148' : '#fff')};
  border: 1px solid ${({ $dm, $color }) =>
    $dm ? `${$color}44` : `${$color}33`};
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: ${({ $dm }) =>
    $dm ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.08)'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $dm }) =>
      $dm
        ? '0 6px 24px rgba(116,67,246,0.25)'
        : '0 4px 18px rgba(100,60,180,0.15)'};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const IconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: ${({ $dm, $color }) =>
    $dm
      ? `${$color}33`
      : `${$color}22`};
  border: 1px solid ${({ $dm, $color }) =>
    $dm ? `${$color}55` : `${$color}33`};

  i {
    font-size: 1.2rem;
    color: ${({ $color }) => $color};
    filter: ${({ $dm }) => ($dm ? 'brightness(1.3)' : 'brightness(0.85)')};
  }
`;

const CardLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.6)' : 'rgba(76,29,149,.65)')};
`;

const CardValue = styled.span`
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  color: ${({ $dm }) => ($dm ? '#f3e8ff' : '#2a0a50')};
`;

const CardSub = styled.div`
  font-size: 0.78rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.55)' : 'rgba(76,29,149,.6)')};
  line-height: 1.5;
`;

const SlaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.6rem;
  font-size: 0.76rem;
  margin-top: 0.25rem;
`;

const SlaPill = styled.span`
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-weight: 600;
  background: ${({ $color, $dm }) => ($dm ? `${$color}22` : `${$color}15`)};
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color, $dm }) => ($dm ? `${$color}44` : `${$color}30`)};
`;

// ---------------------------------------------------------------------------
// Helpers
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
 *   totals  { volume, csat, csatBase, ctHoras, ctBaseCount, tmrHoras,
 *             tmrBaseCount, states:{open,closed,snoozed}, sla:{...} }
 *   metrics array de ids habilitados (volume/csat/ct/tmr/sla/states).
 *           Ausente → mostra o conjunto clássico (volume/csat/ct/sla).
 *   dm      boolean
 */
export default function MetricCards({ totals, metrics, dm }) {
  if (!totals) return null;

  const { volume, csat, csatBase, ctHoras, ctBaseCount, tmrHoras, tmrBaseCount, states, sla } = totals;
  const show = (id) => (Array.isArray(metrics) ? metrics.includes(id) : ['volume', 'csat', 'ct', 'sla'].includes(id));

  return (
    <Grid>
      {show('volume') && (
        <Card $dm={dm} $color="#7443F6">
          <CardHeader>
            <IconWrap $dm={dm} $color="#7443F6">
              <i className="pi pi-comments" />
            </IconWrap>
            <CardLabel $dm={dm}>Volume</CardLabel>
          </CardHeader>
          <CardValue $dm={dm}>{volume?.toLocaleString('pt-BR') ?? '—'}</CardValue>
          <CardSub $dm={dm}>conversas no período</CardSub>
        </Card>
      )}

      {show('csat') && (
        <Card $dm={dm} $color="#22C55E">
          <CardHeader>
            <IconWrap $dm={dm} $color="#22C55E">
              <i className="pi pi-star" />
            </IconWrap>
            <CardLabel $dm={dm}>CSAT</CardLabel>
          </CardHeader>
          <CardValue $dm={dm}>{fmtPct(csat)}</CardValue>
          <CardSub $dm={dm}>
            {csatBase
              ? `${csatBase.positivas?.toLocaleString('pt-BR') ?? 0} positivas de ${csatBase.total?.toLocaleString('pt-BR') ?? 0} avaliações`
              : 'sem dados de avaliação'}
          </CardSub>
        </Card>
      )}

      {show('ct') && (
        <Card $dm={dm} $color="#3B82F6">
          <CardHeader>
            <IconWrap $dm={dm} $color="#3B82F6">
              <i className="pi pi-clock" />
            </IconWrap>
            <CardLabel $dm={dm}>CT Médio</CardLabel>
          </CardHeader>
          <CardValue $dm={dm}>{fmtHours(ctHoras)}</CardValue>
          <CardSub $dm={dm}>
            {ctBaseCount != null
              ? `mediana (horas úteis) de ${ctBaseCount.toLocaleString('pt-BR')} conversas`
              : 'tempo de resolução (horas úteis)'}
          </CardSub>
        </Card>
      )}

      {show('tmr') && (
        <Card $dm={dm} $color="#8B5CF6">
          <CardHeader>
            <IconWrap $dm={dm} $color="#8B5CF6">
              <i className="pi pi-reply" />
            </IconWrap>
            <CardLabel $dm={dm}>1ª Resposta</CardLabel>
          </CardHeader>
          <CardValue $dm={dm}>{fmtHours(tmrHoras)}</CardValue>
          <CardSub $dm={dm}>
            {tmrBaseCount != null
              ? `mediana (horas úteis) de ${tmrBaseCount.toLocaleString('pt-BR')} conversas`
              : 'tempo até 1ª resposta (horas úteis)'}
          </CardSub>
        </Card>
      )}

      {show('sla') && (
        <Card $dm={dm} $color="#F59E0B">
          <CardHeader>
            <IconWrap $dm={dm} $color="#F59E0B">
              <i className="pi pi-shield" />
            </IconWrap>
            <CardLabel $dm={dm}>SLA</CardLabel>
          </CardHeader>
          <CardValue $dm={dm}>{fmtPct(sla?.pctHit)}</CardValue>
          <CardSub $dm={dm}>cumprimento de SLA</CardSub>
          {sla && (
            <SlaRow>
              <SlaPill $color="#22C55E" $dm={dm}>
                <i className="pi pi-check" style={{ fontSize: '0.65rem', marginRight: 3 }} />
                {sla.hit?.toLocaleString('pt-BR') ?? 0} hit
              </SlaPill>
              <SlaPill $color="#EF4444" $dm={dm}>
                <i className="pi pi-times" style={{ fontSize: '0.65rem', marginRight: 3 }} />
                {sla.missed?.toLocaleString('pt-BR') ?? 0} miss
              </SlaPill>
              {sla.cancelled > 0 && (
                <SlaPill $color="#9CA3AF" $dm={dm}>
                  {sla.cancelled?.toLocaleString('pt-BR') ?? 0} canc
                </SlaPill>
              )}
              {sla.active > 0 && (
                <SlaPill $color="#3B82F6" $dm={dm}>
                  {sla.active?.toLocaleString('pt-BR') ?? 0} ativo
                </SlaPill>
              )}
            </SlaRow>
          )}
        </Card>
      )}

      {show('states') && states && (
        <Card $dm={dm} $color="#14B8A6">
          <CardHeader>
            <IconWrap $dm={dm} $color="#14B8A6">
              <i className="pi pi-inbox" />
            </IconWrap>
            <CardLabel $dm={dm}>Abertas / Fechadas</CardLabel>
          </CardHeader>
          <CardValue $dm={dm}>{states.closed?.toLocaleString('pt-BR') ?? 0}</CardValue>
          <CardSub $dm={dm}>fechadas no período</CardSub>
          <SlaRow>
            <SlaPill $color="#3B82F6" $dm={dm}>{states.open?.toLocaleString('pt-BR') ?? 0} abertas</SlaPill>
            {states.snoozed > 0 && (
              <SlaPill $color="#9CA3AF" $dm={dm}>{states.snoozed?.toLocaleString('pt-BR') ?? 0} snoozed</SlaPill>
            )}
          </SlaRow>
        </Card>
      )}
    </Grid>
  );
}
