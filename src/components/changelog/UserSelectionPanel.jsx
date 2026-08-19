// components/changelog/UserSelectionPanel.jsx
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ClickableField from './ClickableField';

const Label = styled.label`
  margin-bottom: 0.6rem;
  display: block;
`;

const StyledPanel = styled(Panel)`
  width: 100%;
  background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#e0dde2')} !important;
  border-radius: 0.3rem;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
  box-sizing: border-box;
  transition: border-color 0.3s, box-shadow 0.3s;
  overflow: hidden;

  &.no-header .p-panel-header {
    display: none;
  }

  .p-panel-content {
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')};
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#0a0025')};
    padding: 16px;
    border: none;
  }
`;

const StyledDataTable = styled(DataTable)`
  font-size: 1rem;
  width: 100%;

  .p-datatable-thead > tr > th {
    background-color: ${({ darkMode }) => (darkMode ? '#2b2241' : '#ebebebff')};
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#4d0779')};
    padding: 0.5rem 0.8rem;
    height: 42px;
    vertical-align: middle;
    border: none;
  }

  .p-datatable-tbody > tr > td {
    padding: 0.45rem 0.8rem;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#0a0025')};
    background-color: ${({ darkMode }) => (darkMode ? '#352853' : '#f8f8f8')};
    height: 38px;
    vertical-align: middle;
    border: none;
  }

  .p-datatable-tbody > tr.p-highlight {
    background-color: ${({ darkMode }) => (darkMode ? '#4a3a7a' : '#d6c6fa')};
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#4d0779')};
  }

  .p-column-filter input {
    font-size: 1rem;
    padding: 0.4rem 0.6rem;
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};
    border-radius: 0.3rem;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#ccc')};
    height: 32px;
    box-sizing: border-box;
  }

  .p-column-filter input::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#bbbbbb7c' : '#999')};
    opacity: 1;
  }
`;

export default function UserSelectionPanel({
  darkMode,
  userId,
  setUserId,
  apiUsers,
  usersLoading,
  userPanelCollapsed,
  setUserPanelCollapsed,
  resumoUsuarios,
}) {
  return (
    <div>
      <Label>Usuário</Label>
      <ClickableField
        darkMode={darkMode}
        text={resumoUsuarios}
        onClick={() => setUserPanelCollapsed(v => !v)}
      />
      {!userPanelCollapsed && (
        <StyledPanel className="no-header" darkMode={darkMode}>
          <StyledDataTable
            darkMode={darkMode}
            value={apiUsers}
            paginator
            rows={10}
            loading={usersLoading}
            selection={userId}
            onSelectionChange={(e) => setUserId(e.value)}
            dataKey="Id"
            filterDisplay="row"
            globalFilterFields={['Name', 'Email']}
            responsiveLayout="stack"
            scrollable
            scrollHeight="400px"
            emptyMessage="Nenhum usuário encontrado"
          >
            <Column selectionMode="multiple" style={{ width: '3em' }} />
            <Column
              field="Name"
              header="Nome"
              filter
              filterPlaceholder="Buscar nome"
              filterMatchMode="contains"
              showFilterMenu={false}
              style={{ minWidth: '150px' }}
            />
            <Column
              field="Email"
              header="Email"
              filter
              filterPlaceholder="Buscar email"
              filterMatchMode="contains"
              showFilterMenu={false}
              style={{ minWidth: '200px' }}
            />
          </StyledDataTable>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Button
              className="p-button-text"
              label="Fechar"
              icon="pi pi-times"
              onClick={() => setUserPanelCollapsed(true)}
            />
          </div>
        </StyledPanel>
      )}
    </div>
  );
}