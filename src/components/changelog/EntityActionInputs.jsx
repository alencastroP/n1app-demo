// components/changelog/EntityActionInputs.jsx
import styled from 'styled-components';
import { Dropdown } from 'primereact/dropdown';

const Label = styled.label`
  margin-bottom: 0.6rem;
  display: block;
`;

const StyledDropdown = styled(Dropdown)`
  width: 100%;
  background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#e0dde2')} !important;
  border-radius: 0.3rem;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
  box-sizing: border-box;
  transition: border-color 0.3s, box-shadow 0.3s;

  .p-inputtext {
    background-color: transparent !important;
    border: none !important;
    color: inherit !important;
    border-radius: 0.3rem;
    padding: 0.5rem 0.75rem;
    width: 100%;
  }

  .p-inputtext::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#bbbbbb7c' : '#999')} !important;
    opacity: 1;
  }

  &:focus-within {
    outline: none !important;
    border-color: rgb(136, 10, 240) !important;
    box-shadow: 0 0 0 1px rgb(105, 0, 153) !important;
  }

  &.p-dropdown:focus-within {
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
  }

  &.p-dropdown:focus-within .p-dropdown-label {
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
    background: transparent !important;
  }

  .p-dropdown-label.p-placeholder {
    color: ${({ darkMode }) => (darkMode ? '#bbbbbb7c' : '#999')} !important;
  }

  .p-dropdown-panel {
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#fff')} !important;
    border: 1px solid rgb(136, 10, 240) !important;
  }

  .p-dropdown-item {
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
    background-color: transparent !important;
  }

  .p-dropdown-item:hover {
    background-color: ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#f0f0f0')} !important;
  }
`;

// Exibida em ordem alfabética (label).
const entityOptions = [
  { label: 'Campos', value: 77 },
  { label: 'Clientes', value: 1 },
  { label: 'Documentos', value: 66 },
  { label: 'Negócios', value: 2 },
  { label: 'Propostas', value: 7 },
  { label: 'Registro de Interação', value: 36 },
  { label: 'Tarefas', value: 12 },
  { label: 'Usuários', value: 24 },
  { label: 'Vendas', value: 4 },
];

const actionOptions = [
  { label: 'Criação', value: 1 },
  { label: 'Atualização', value: 2 },
  { label: 'Deleção', value: 3 },
  { label: 'Ganhar', value: 4 },
  { label: 'Perder', value: 5 },
  { label: 'Reabrir', value: 6 },
];

export default function EntityActionInputs({ darkMode, entity, setEntity, action, setAction }) {
  return (
    <>
      <div>
        <Label>Entidade</Label>
        <StyledDropdown
          darkMode={darkMode}
          value={entity}
          onChange={(e) => setEntity(e.value)}
          options={entityOptions}
          placeholder="Selecionar entidade (opcional)"
        />
      </div>

      <div>
        <Label>Ação</Label>
        <StyledDropdown
          darkMode={darkMode}
          value={action}
          onChange={(e) => setAction(e.value)}
          options={actionOptions}
          placeholder="Selecionar ação (opcional)"
        />
      </div>
    </>
  );
}