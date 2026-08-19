// components/powerbi/PowerBIInputForm.jsx
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import CredencialCard from '../CredencialCard';

const StyledContainer = styled(Card)`
  width: 100%;
  box-shadow: ${({ darkMode }) =>
    darkMode
      ? '0 4px 16px rgba(0,0,0,0.5)'
      : '0 2px 10px rgba(100, 60, 180, 0.08)'};
  border-radius: 12px;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};
  margin: auto auto 1.5rem auto;
  max-width: 1460px;
  background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#ffffff')};
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};

  .p-card .p-card-content {
    padding: 0px 0px;
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Title = styled.h2`
  text-align: start;
  color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#1e0c45')};
  margin: 0;
`;

const ModeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  border: 1.5px solid ${({ active, darkMode }) =>
    active ? '#7443f6' : darkMode ? '#493d6d' : '#ccc'};
  background: ${({ active, darkMode }) =>
    active
      ? darkMode
        ? 'rgba(116, 67, 246, 0.18)'
        : 'rgba(116, 67, 246, 0.08)'
      : 'transparent'};
  color: ${({ active, darkMode }) =>
    active ? '#7443f6' : darkMode ? '#a0939e' : '#888'};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #7443f6;
    color: #7443f6;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  max-width: 1460px;
  align-items: center;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  .p-input-icon-left,
  .p-input-icon-right {
    vertical-align: middle;
    width: 100%;
  }
`;

// Espaçamento da seção de credencial no modo detalhado.
const UserKeySection = styled.div`
  margin-top: 0.75rem;
`;

const StyledInputWrapper = styled.span`
  width: 100%;
  position: relative;

  .p-inputtext {
    width: 100%;
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#e0dde2')} !important;
    border-radius: 0.3rem;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
    box-sizing: border-box;
    transition: border-color 0.3s, box-shadow 0.3s;
    padding-left: 2rem;
  }

  .p-inputtext::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#dfdfdfff' : '#999999')};
    opacity: 0.55;
  }

  .p-inputtext:focus {
    border-color: ${({ darkMode }) => (darkMode ? '#c4bfd1ff' : '#7443f6')};
    box-shadow: 0 0 0 0.2rem rgba(116, 67, 246, 0.25);
    outline: none;
  }

  i {
    display: flex;
    vertical-align: middle !important;
    top: 1.1rem;
    left: 0.5rem;
    color: ${({ darkMode }) => (darkMode ? '#8f3bd4ff' : '#666666')};
  }
`;

const StyledButton = styled(Button)`
  background: ${({ variant, darkMode }) => {
    if (variant === 'outlined') {
      return 'transparent';
    }
    return darkMode
      ? 'linear-gradient(90deg, rgba(91, 20, 184, 1) 0%, rgba(110, 16, 165, 1) 100%)'
      : 'linear-gradient(90deg, rgba(136, 45, 255, 1) 0%, rgba(153, 31, 224, 1) 100%)';
  }};

  border-color: ${({ darkMode }) => (darkMode ? '#7443f6' : '#7443f6')};
  color: ${({ variant, darkMode }) => {
    if (variant === 'outlined') {
      return darkMode ? '#7443f6' : '#7443f6';
    }
    return '#ffffff';
  }};

  &:hover:not(:disabled) {
    background-color: ${({ variant, darkMode }) => {
      if (variant === 'outlined') {
        return darkMode ? 'rgba(116, 67, 246, 0.1)' : 'rgba(116, 67, 246, 0.1)';
      }
      return darkMode ? '#5e2ecf' : '#5e2ecf';
    }};
    border-color: ${({ darkMode }) => (darkMode ? '#5e2ecf' : '#5e2ecf')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledInputText = styled(InputText)`
  width: 100%;

  &:focus {
    outline: none;
    border-color: rgb(136, 10, 240) !important;
    box-shadow: 0 0 0 1px rgb(105, 0, 153) !important;
    background-color: white;
  }
`;

export default function PowerBIInputForm({
  darkMode,
  entry,
  setEntry,
  parsed,
  loadingTabs,
  loadingRead,
  onConsult,
  onReadLink,
  detailedMode,
  onToggleDetailedMode,
  userKey,
  setUserKey,
  account,
  onAccountChange,
  onValidateUserKey,
}) {
  return (
    <StyledContainer darkMode={darkMode}>
      <TitleRow>
        <Title darkMode={darkMode}>
          Informe o link da aba exportada ou a Account Key
        </Title>
        <ModeToggle
          active={detailedMode ? 1 : 0}
          darkMode={darkMode}
          onClick={onToggleDetailedMode}
          type="button"
        >
          <i className={`pi pi-${detailedMode ? 'eye' : 'eye-slash'}`} style={{ fontSize: '0.85rem' }} />
          Modo detalhado
        </ModeToggle>
      </TitleRow>

      <Row>
        <StyledInputWrapper
          darkMode={darkMode}
          className="p-input-icon-left"
        >
          <i style={{ fontSize: "20px" }} className="pi pi-link" />
          <StyledInputText
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Cole o link (callback/... ?code=...) ou digite a Account Key"
          />
        </StyledInputWrapper>

        <StyledButton
          darkMode={darkMode}
          label={loadingTabs ? 'Consultando...' : 'Consultar abas'}
          icon="pi pi-search"
          disabled={!parsed.accountKey || loadingTabs}
          onClick={onConsult}
        />

        <StyledButton
          darkMode={darkMode}
          variant="outlined"
          label={loadingRead ? 'Lendo...' : 'Ver tabela'}
          icon="pi pi-table"
          disabled={!parsed.isLink || loadingRead}
          onClick={onReadLink}
        />
      </Row>

      {detailedMode && (
        <UserKeySection>
          <CredencialCard
            uk={userKey}
            onUkChange={setUserKey}
            account={account}
            onAccountChange={onAccountChange}
            onValidate={onValidateUserKey}
            label="User-Key da conta (modo detalhado)"
            placeholder="Cole a User-Key da conta Ploomes para modo detalhado"
            validateLabel="Validar chave"
          />
        </UserKeySection>
      )}
    </StyledContainer>
  );
}
