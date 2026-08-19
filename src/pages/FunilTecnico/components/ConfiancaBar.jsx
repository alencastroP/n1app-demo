// src/pages/FunilTecnico/components/ConfiancaBar.jsx
import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const Track = styled.div`
  position: relative;
  flex: 1;
  min-width: 54px;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: ${({ $dark }) => ($dark ? 'rgba(148,163,184,.22)' : 'rgba(109,40,217,.12)')};
`;

const Fill = styled.div`
  height: 100%;
  border-radius: 999px;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $color }) => $color};
  transition: width .3s ease;
`;

const Value = styled.span`
  flex-shrink: 0;
  font-size: 0.74rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const Label = styled.span`
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ $dark }) => ($dark ? 'rgba(196,181,253,.6)' : 'rgba(109,40,217,.5)')};
`;

/** Cor por faixa de confiança: alta=verde, média=âmbar, baixa=vermelho. */
function confColor(pct, dark) {
  if (pct >= 85) return dark ? '#34d399' : '#059669';
  if (pct >= 60) return dark ? '#fbbf24' : '#d97706';
  return dark ? '#fb7185' : '#e11d48';
}

/**
 * Barra de confiança da IA (0–100). `confianca` ausente/inválida → não renderiza.
 * @param {number} confianca 0..100
 * @param {boolean} [showLabel] mostra o rótulo "Confiança IA" à esquerda
 */
export default function ConfiancaBar({ confianca, dark, showLabel = false }) {
  if (typeof confianca !== 'number' || Number.isNaN(confianca)) return null;
  const pct = Math.max(0, Math.min(100, Math.round(confianca)));
  const color = confColor(pct, dark);
  return (
    <Wrap>
      {showLabel && <Label $dark={dark}>Confiança IA</Label>}
      <Track $dark={dark}>
        <Fill $pct={pct} $color={color} />
      </Track>
      <Value $color={color}>{pct}%</Value>
    </Wrap>
  );
}
