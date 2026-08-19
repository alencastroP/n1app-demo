// src/components/ContaAtivaHint.jsx
// Trava anti-conta-errada para confirmações pré-execução (PreviewBox e afins):
//  - UK do formulário IGUAL à da conta ativa   → "Executando na conta: {nome}" (destaque)
//  - UK do formulário DIFERENTE da conta ativa → aviso neutro
//  - Sem conta ativa ou sem UK no formulário   → não renderiza nada
//
// Uso: <ContaAtivaHint uk={valorDoCampoUkDoFormulario} />

import styled from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import { useAccountSession } from '../context/AccountSessionContext';

const HintBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  font-size: 0.82rem;
  margin: 0.5rem 0;
  border: 1px solid ${({ $match, $dm }) =>
    $match
      ? 'rgba(34, 197, 94, 0.45)'
      : ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $match, $dm }) =>
    $match
      ? ($dm ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.07)')
      : ($dm ? '#1a1230' : '#f5f2ff')};
  color: ${({ $match, $dm }) =>
    $match ? '#22c55e' : ($dm ? '#c4b5fd' : '#5b3ec8')};
  i { flex-shrink: 0; }
  strong { color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')}; }
`;

export default function ContaAtivaHint({ uk }) {
  const { darkMode: dm } = useDarkMode();
  const { conta } = useAccountSession();

  const ukTrim = typeof uk === 'string' ? uk.trim() : '';
  if (!conta || !ukTrim) return null;

  const mesmaConta = ukTrim === conta.uk;
  return mesmaConta ? (
    <HintBox $dm={dm} $match>
      <i className="pi pi-building" />
      <span>Executando na conta: <strong>{conta.accountName}</strong></span>
    </HintBox>
  ) : (
    <HintBox $dm={dm}>
      <i className="pi pi-info-circle" />
      <span>UK diferente da conta ativa ({conta.accountName})</span>
    </HintBox>
  );
}
