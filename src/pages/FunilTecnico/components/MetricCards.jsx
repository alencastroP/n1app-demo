// src/pages/FunilTecnico/components/MetricCards.jsx
import styled from 'styled-components';
import { palette, fadeUp } from './ui';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  animation: ${fadeUp} 0.32s ease;

  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

const Cardish = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 1rem 1.1rem;
  border-radius: 15px;
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};
  box-shadow: ${({ $dark }) =>
    $dark ? '0 4px 20px rgba(0,0,0,.32)' : '0 2px 12px rgba(100,60,200,.07)'};
`;

const Value = styled.div`
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: ${({ $dark, $accent }) => $accent || (($dark) ? '#f3e8ff' : '#3b0764')};
`;

const Label = styled.div`
  margin-top: 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ $dark }) => palette($dark).muted};
`;

const IconBox = styled.div`
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: ${({ $tint }) => $tint};
  background: ${({ $tint }) => `${$tint}1f`};
  border: 1px solid ${({ $tint }) => `${$tint}33`};

  i { font-size: 0.95rem; }
`;

/**
 * Quatro métricas do topo do funil.
 * @param {{
 *   casosAbertos:number, resolviveisIA:number, slaEstourado:number, tempoMedioParado:number
 * }} metrics
 */
export default function MetricCards({ metrics, dark }) {
  const p = palette(dark);
  const items = [
    { key: 'abertos',  value: metrics.casosAbertos,  label: 'Casos em aberto',     icon: 'pi-folder-open',        tint: p.accent },
    { key: 'ia',       value: metrics.resolviveisIA, label: 'Resolvíveis por IA',  icon: 'pi-bolt',               tint: dark ? '#c4b5fd' : '#7c3aed', accent: dark ? '#c4b5fd' : '#6d28d9' },
    { key: 'sla',      value: metrics.slaEstourado,  label: 'SLA estourado',       icon: 'pi-exclamation-triangle', tint: dark ? '#fb7185' : '#e11d48', accent: metrics.slaEstourado > 0 ? (dark ? '#fb7185' : '#e11d48') : undefined },
    { key: 'parado',   value: `${metrics.tempoMedioParado}d`, label: 'Tempo médio parado', icon: 'pi-clock',      tint: dark ? '#fbbf24' : '#d97706' },
  ];

  return (
    <Grid>
      {items.map((it) => (
        <Cardish key={it.key} $dark={dark}>
          <div>
            <Value $dark={dark} $accent={it.accent}>{it.value}</Value>
            <Label $dark={dark}>{it.label}</Label>
          </div>
          <IconBox $tint={it.tint}>
            <i className={`pi ${it.icon}`} />
          </IconBox>
        </Cardish>
      ))}
    </Grid>
  );
}
