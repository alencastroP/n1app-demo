// components/changelog/UserKeyInput.jsx
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const Label = styled.label`
  margin-bottom: 0.6rem;
  display: block;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const StyledInputText = styled(InputText)`
  flex: 1;
  width: 100%;
  background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#e0dde2')} !important;
  border-radius: 0.3rem;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
  box-sizing: border-box;
  transition: border-color 0.3s, box-shadow 0.3s;
  padding: 0.5rem 0.75rem;

  &::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#bbbbbb7c' : '#999')} !important;
    opacity: 1;
  }

  &:focus {
    outline: none !important;
    border-color: rgb(136, 10, 240) !important;
    box-shadow: 0 0 0 1px rgb(105, 0, 153) !important;
    background-color: white !important;
    color: #1a1a1aff !important;
  }
`;

export default function UserKeyInput({ darkMode, userKey, setUserKey, showUK, setShowUK }) {
  return (
    <div>
      <Label darkMode={darkMode}>User Key</Label>
      <InputWrapper>
        <StyledInputText
          type={showUK ? 'text' : 'password'}
          darkMode={darkMode}
          value={userKey}
          onChange={(e) => setUserKey(e.target.value)}
          placeholder="Insira a UK do usuário de integração"
          required
        />
        <Button
          type="button"
          icon={showUK ? 'pi pi-eye-slash' : 'pi pi-eye'}
          onClick={() => setShowUK(v => !v)}
          className="p-button-text"
          tooltip={showUK ? 'Ocultar' : 'Mostrar'}
          aria-label={showUK ? 'Ocultar User Key' : 'Mostrar User Key'}
        />
      </InputWrapper>
    </div>
  );
}