// src/pages/FunilTecnico/components/SeveridadeTag.jsx
import { Chip, SEVERIDADE, severidadeColor } from './ui';

/**
 * Tag de severidade da triagem (baixa | media | alta | critica).
 * Sem severidade → não renderiza nada (card sem triagem).
 */
export default function SeveridadeTag({ severidade, dark }) {
  if (!severidade || !SEVERIDADE[severidade]) return null;
  const meta = SEVERIDADE[severidade];
  const color = severidadeColor(severidade, dark);
  return (
    <Chip $color={color}>
      <i className={`pi ${meta.icon}`} />
      {meta.label}
    </Chip>
  );
}
