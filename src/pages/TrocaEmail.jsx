import { useState } from 'react';
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS } from '../config/teamsConfig';
import { listUsersByAccount, changeEmail } from '../services/emailfixApi';
import ServiceHeader from '../components/ServiceHeader';

const Container = styled.div`
  min-height: 100vh;
  padding: 1rem 1rem 1rem 3rem;
  width: 100%;
  background-color: ${({ darkMode }) => (darkMode ? 'none' : 'none')};
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};

  h1 {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  }

  /* InputText */
  .p-inputtext {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')} !important;
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')} !important;
    border-radius: 4px;
  }

  .p-inputtext:focus {
    border-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#6e38c5ff')} !important;
    box-shadow: 0 0 0 0.2rem ${({ darkMode }) => (darkMode ? 'rgba(110, 56, 197, 0.25)' : 'rgba(110, 56, 197, 0.25)')} !important;
  }

  .p-inputtext::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#888888' : '#6c757d')} !important;
  }

  /* Buttons */
  .p-button {
    background-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')};
    border-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')};
    color: #fff;
  }
  
  .p-button:hover {
    background-color: ${({ darkMode }) => (darkMode ? '#7e4dd1' : '#5e49a6')};
    border-color: ${({ darkMode }) => (darkMode ? '#7e4dd1' : '#5e49a6')};
  }

  .p-button:disabled {
    background-color: ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e9ecef')};
    border-color: ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')};
    color: ${({ darkMode }) => (darkMode ? '#888888' : '#6c757d')};
  }

  .p-button-text {
    background-color: transparent !important;
    border-color: transparent !important;
    color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')} !important;
  }

  .p-button-text:hover {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(110, 56, 197, 0.1)' : 'rgba(116, 67, 246, 0.1)')} !important;
  }

  /* Card */
  .p-card {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    box-shadow: ${({ darkMode }) => (darkMode ? '1.5px 1.5px 1.5px 1px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)')};
    border-radius: 1rem;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e1e5eb')};
  }

  .p-card .p-card-title {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  }

  /* DataTable */
  .p-datatable {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    border-radius: 1rem;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')};
  }

  .p-datatable-thead > tr > th {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0935ff' : '#f5f5f5ff')};
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};
    font-weight: bold;
    border-color:${({ darkMode }) => (darkMode ? '#31293aff' : '#c5c5c5ff')};
  }

  .p-datatable-tbody > tr > td {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    border-bottom: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a6a' : '#dee2e6')};
  }

  .p-datatable-tbody > tr:hover > td {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f5f5f5')};
  }

  /* Dialog */
  .p-dialog {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    border-radius: 1rem;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')};
  }

  .p-dialog .p-dialog-header {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f8f9fa')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    border-bottom: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a6a' : '#dee2e6')};
  }

  .p-dialog .p-dialog-content {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  }

  .p-dialog .p-dialog-footer {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f8f9fa')};
    border-top: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a6a' : '#dee2e6')};
  }

  /* Messages */
  .p-message {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  }

  .p-message.p-message-error {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(220, 38, 127, 0.1)' : '#fef2f2')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#dc267f' : '#fecaca')};
    color: ${({ darkMode }) => (darkMode ? '#fca5a5' : '#dc2626')};
  }

  .p-message.p-message-warn {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fefbf2')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#f59e0b' : '#fed7aa')};
    color: ${({ darkMode }) => (darkMode ? '#fbbf24' : '#d97706')};
  }

  .p-message.p-message-success {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#22c55e' : '#bbf7d0')};
    color: ${({ darkMode }) => (darkMode ? '#4ade80' : '#16a34a')};
  }

  /* Input icon */
  .p-input-icon-left > i {
    color: ${({ darkMode }) => (darkMode ? '#888888' : '#6c757d')};
  }

  /* Scrollbar para DataTable scrollable */
  .p-datatable-scrollable-body {
    scrollbar-width: thin;
    scrollbar-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff #1a0e2e' : '#dee2e6 #f8f9fa')};
  }
  .p-datatable-scrollable-body::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .p-datatable-scrollable-body::-webkit-scrollbar-track {
    background: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#f8f9fa')};
  }
  .p-datatable-scrollable-body::-webkit-scrollbar-thumb {
    background-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#dee2e6')};
    border-radius: 4px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    padding-left: 1rem;
  }
`;

const HeaderCard = styled(Card)`
  width: 100%;
  box-shadow: 0 2px 4px rgba(59, 59, 59, 0.2);
  border-radius: 6px;
  margin: auto auto 2rem auto;
  max-width: 1400px;
  background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')};
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};

  .p-card .p-card-content {
  padding 0px 0px;
}
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  max-width: 1400px;
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


const StyledButton = styled(Button)`
  background: ${({ variant, darkMode }) => {
    if (variant === 'outlined') {
      return 'transparent';
    }
    return darkMode ? 'linear-gradient(90deg, rgba(91, 20, 184, 1) 0%, rgba(110, 16, 165, 1) 100%)' : 'linear-gradient(90deg, rgba(136, 45, 255, 1) 0%, rgba(153, 31, 224, 1) 100%)';

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
    color: #0051ffff;
  }
`

const TableCard = styled (Card)`
  max-width: 1400px;
  margin: auto;
`

export default function TrocaEmail() {
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  const { darkMode } = useDarkMode();
  const { canService } = useUserProfile();

  if (!canService(SERVICE_KEYS.EMAILFIX)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: darkMode ? '#f87171' : '#dc2626' }}>
        <i className="pi pi-lock" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem' }}>Acesso restrito</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  const handleList = async () => {
    setError('');
    setFlash(null);
    setUsers([]);
    setTotal(0);
    setUserSearch('');
    if (!accountId?.trim()) {
      setError('Informe o AccountId.');
      return;
    }

    setLoading(true);
    try {
      const out = await listUsersByAccount(accountId.trim());
      setUsers(out.items || []);
      setTotal(out.count ?? (out.items?.length || 0));
      if (!out.items?.length)
        setFlash({ sev: 'warn', text: 'Nenhum usuário encontrado para este AccountId.' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setNewEmail(user?.Email || '');
    setEditOpen(true);
  };

  const doSave = async () => {
    if (!editUser?.Id) return;
    if (!newEmail?.trim()) {
      setFlash({ sev: 'warn', text: 'Informe um e-mail válido.' });
      return;
    }
    setSaving(true);
    setFlash(null);
    try {
      await changeEmail(editUser.Id, newEmail.trim());
      setUsers((prev) =>
        prev.map((u) => (u.Id === editUser.Id ? { ...u, Email: newEmail.trim() } : u))
      );
      setEditOpen(false);
      setFlash({ sev: 'success', text: `E-mail do usuário ${editUser.Name} atualizado com sucesso.` });
    } catch (e) {
      setFlash({ sev: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.Name || '').toLowerCase().includes(q) ||
      String(u.Email || '').toLowerCase().includes(q)
    );
  });

  const actionsTemplate = (row) => (
    <div className="flex gap-2">
      <Button
        type="button"
        label="Trocar e-mail"
        icon="pi pi-user-edit"
        className="p-button-sm"
        onClick={() => openEdit(row)}
      />
    </div>
  );

  return (
    <Container darkMode={darkMode}>
      <ServiceHeader
        platforms={['ploomes']}
        title="Troca de e-mail (Internal API)"
        subtitle="Troque com segurança o e-mail de um usuário da conta via Internal API."
      />

      <HeaderCard>
      <Row>
        <span className="p-input-icon-left">
          <i className="pi pi-hashtag" style={{ paddingLeft: '.5rem' }} />
          <StyledInputText
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Informe o AccountId"
            style={{ paddingLeft: '2rem' }}
          />
        </span>
        <StyledButton
          label={loading ? 'Consultando...' : 'Listar usuários'}
          icon="pi pi-search"
          disabled={!accountId || loading}
          onClick={handleList}
        />
      </Row>
      </HeaderCard>

      {error && <Message severity="error" text={error} style={{ marginBottom: 12 }} />}
      {flash && <Message severity={flash.sev} text={flash.text} style={{ marginBottom: 12 }} />}

      <TableCard
        title={`Usuários (${userSearch.trim() ? `${filteredUsers.length}/${total}` : total})`}
        className="p-card"
      >
        {users.length > 0 && (
          <span className="p-input-icon-left" style={{ display: 'block', marginBottom: '1rem', maxWidth: 360 }}>
            <i className="pi pi-search" style={{ paddingLeft: '.5rem' }} />
            <StyledInputText
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail…"
              style={{ paddingLeft: '2rem' }}
            />
          </span>
        )}
        <DataTable
          value={filteredUsers}
          scrollable
          scrollHeight="500px"
          showGridlines
          loading={loading}
          emptyMessage={userSearch.trim() ? 'Nenhum usuário corresponde à busca.' : 'Sem dados.'}
        >
          <Column field="Id" header="Id" style={{ width: 120 }} />
          <Column field="Name" header="Nome" />
          <Column field="Email" header="E-mail" />
          <Column field="ProfileId" header="Perfil" style={{ width: 120 }} />
          <Column
            header="Master Admin"
            body={(row) => (row.MasterAdministrator ? 'Sim' : 'Não')}
            style={{ width: 140 }}
          />
          <Column header="Ações" body={actionsTemplate} style={{ width: 160 }} />
        </DataTable>
      </TableCard>

      <Dialog
        header={`Trocar e-mail: ${editUser?.Name ?? ''}`}
        visible={editOpen}
        style={{ width: '520px' }}
        onHide={() => setEditOpen(false)}
        blockScroll
      >
        <div className="p-fluid">
          <label htmlFor="newEmail" className="block mb-2" style={{ color: darkMode ? '#efeaff' : '#1E0C45' }}>
            Novo e-mail
          </label>
          <InputText
            id="newEmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="ex.: fulano@dominio.com"
            className="p-inputtext"
          />
          <div className="flex gap-2 justify-content-end mt-3">
            <Button label="Cancelar" className="p-button-text" onClick={() => setEditOpen(false)} />
            <Button
              label={saving ? 'Salvando…' : 'Salvar'}
              icon="pi pi-check"
              onClick={doSave}
              disabled={saving || !newEmail}
            />
          </div>
        </div>
      </Dialog>
    </Container>
  );
}