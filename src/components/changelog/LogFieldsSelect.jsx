// components/changelog/LogFieldsSelect.jsx
import styled from 'styled-components';
import { MultiSelect } from 'primereact/multiselect';

const Label = styled.label`
  margin-bottom: 0.6rem;
  display: block;
`;

const StyledMultiSelect = styled(MultiSelect)`
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

  &.p-multiselect:focus-within {
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
  }

  &.p-multiselect:focus-within .p-multiselect-label {
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
    background: transparent !important;
  }

  .p-multiselect-label.p-placeholder {
    color: ${({ darkMode }) => (darkMode ? '#bbbbbb7c' : '#999')} !important;
  }

  .p-multiselect-panel {
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#fff')} !important;
    border: 1px solid rgb(136, 10, 240) !important;
  }

  .p-multiselect-item {
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
  }

  .p-multiselect-item:hover {
    background-color: ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#f0f0f0')} !important;
  }
`;

const logFieldOptions = [
  'Id',
  'ItemId',
  'EntityId',
  'ActionId',
  'UserId',
  'DateTime',
].map((field) => ({ label: field, value: field }));

export default function LogFieldsSelect({ darkMode, logFields, setLogFields }) {
  return (
    <div>
      <Label>Campos do Log</Label>
      <StyledMultiSelect
        value={logFields}
        darkMode={darkMode}
        onChange={(e) => setLogFields(e.value)}
        options={logFieldOptions}
        placeholder="Selecione os campos do log"
        required
      />
    </div>
  );
}