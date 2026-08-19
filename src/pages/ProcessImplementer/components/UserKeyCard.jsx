// Wrapper fino do CredencialCard para os forms do Process Implementer.
// A validação continua nos forms (handleValidateUk seta status/errorMsg);
// aqui só traduzimos a API { uk, onUkChange, status, errorMsg, onValidate, locked }.
import styled, { keyframes } from 'styled-components';
import { useDarkMode } from '../../../DarkModeContext';
import CredencialCard from '../../../components/CredencialCard';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Card = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  animation: ${fadeIn} 0.25s ease;
`;

const SectionTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  i { font-size: 0.8rem; color: #7443f6; }
`;

export default function UserKeyCard({
  uk,
  onUkChange,
  status,
  errorMsg,
  onValidate,
  locked = false,
}) {
  const { darkMode: dm } = useDarkMode();

  return (
    <Card $dm={dm}>
      <SectionTitle $dm={dm}>
        <i className="pi pi-key" />
        Credencial
      </SectionTitle>

      <CredencialCard
        uk={uk}
        onUkChange={onUkChange}
        // Resolve undefined: o form gerencia o próprio estado de validação.
        onValidate={async () => { await onValidate?.(); return undefined; }}
        validating={status === 'validating'}
        error={status === 'invalid' ? (errorMsg || 'User-Key inválida.') : ''}
        // Chip de sucesso derivado do status do form (sem dados da conta aqui).
        account={status === 'valid'
          ? { accountId: null, accountName: 'User-Key autenticada', logoUrl: null }
          : null}
        onAccountChange={() => {}}
        disabled={locked}
        label="User-Key *"
        validateLabel="Validar"
      />
    </Card>
  );
}
