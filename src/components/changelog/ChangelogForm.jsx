// components/changelog/ChangelogForm.jsx
import styled from 'styled-components';
import { Button } from 'primereact/button';
import UserKeyInput from './UserKeyInput';
import DateRangeInputs from './DateRangeInputs';
import EntityActionInputs from './EntityActionInputs';
import UserSelectionPanel from './UserSelectionPanel';
import FieldSelectionPanel from './FieldSelectionPanel';
import LogFieldsSelect from './LogFieldsSelect';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CustomButton = styled(Button)`
  width: 100%;
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(90deg, rgba(46, 8, 117, 1) 0%, rgba(70, 4, 156, 1) 100%)'
      : 'linear-gradient(90deg, rgb(136, 45, 255) 0%, rgb(153, 31, 224) 100%)'};
  border-color: ${({ darkMode }) => (darkMode ? '#391e4688' : '#9d36cc')};
  color: #fff;
  padding: 10px;
  margin-top: 10px;
`;

export default function ChangelogForm({
  darkMode,
  userKey,
  setUserKey,
  showUK,
  setShowUK,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  entity,
  setEntity,
  action,
  setAction,
  userId,
  setUserId,
  selectedFieldKeys,
  setSelectedFieldKeys,
  logFields,
  setLogFields,
  apiUsers,
  usersLoading,
  apiFields,
  fieldsLoading,
  userPanelCollapsed,
  setUserPanelCollapsed,
  fieldsPanelCollapsed,
  setFieldsPanelCollapsed,
  isLoading,
  onSubmit,
  toast,
}) {
  const resumoUsuarios = userId?.length
    ? `${userId.length} selecionado(s): ${userId.slice(0, 2).map(u => u.Name).join(', ')}${userId.length > 2 ? '…' : ''}`
    : 'Selecionar usuário (opcional)';

  const resumoCampos = selectedFieldKeys?.length
    ? `${selectedFieldKeys.length} campo(s) selecionado(s)`
    : 'Selecionar campos por entidade (opcional)';

  return (
    <Form darkMode={darkMode} onSubmit={onSubmit}>
      <UserKeyInput
        darkMode={darkMode}
        userKey={userKey}
        setUserKey={setUserKey}
        showUK={showUK}
        setShowUK={setShowUK}
      />

      <DateRangeInputs
        darkMode={darkMode}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        toast={toast}
      />

      <EntityActionInputs
        darkMode={darkMode}
        entity={entity}
        setEntity={setEntity}
        action={action}
        setAction={setAction}
      />

      <UserSelectionPanel
        darkMode={darkMode}
        userId={userId}
        setUserId={setUserId}
        apiUsers={apiUsers}
        usersLoading={usersLoading}
        userPanelCollapsed={userPanelCollapsed}
        setUserPanelCollapsed={setUserPanelCollapsed}
        resumoUsuarios={resumoUsuarios}
      />

      <FieldSelectionPanel
        darkMode={darkMode}
        selectedFieldKeys={selectedFieldKeys}
        setSelectedFieldKeys={setSelectedFieldKeys}
        apiFields={apiFields}
        fieldsLoading={fieldsLoading}
        fieldsPanelCollapsed={fieldsPanelCollapsed}
        setFieldsPanelCollapsed={setFieldsPanelCollapsed}
        resumoCampos={resumoCampos}
      />

      <LogFieldsSelect
        darkMode={darkMode}
        logFields={logFields}
        setLogFields={setLogFields}
      />

      <CustomButton
        darkMode={darkMode}
        type="submit"
        label={isLoading ? 'Carregando...' : 'Iniciar Extração'}
        icon="pi pi-download"
        disabled={isLoading}
      />
    </Form>
  );
}