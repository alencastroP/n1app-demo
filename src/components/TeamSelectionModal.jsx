// src/components/TeamSelectionModal.jsx
//
// Modal bloqueante exibido no primeiro login de um usuário recém-criado,
// quando ele ainda não possui uma team associada na conta de permissões.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import styled from 'styled-components';

import { useUserProfile } from '../context/UserProfileContext';
import { useDarkMode } from '../DarkModeContext';
import { getSelectableTeams } from '../config/teamsConfig';
import { updateUserTeam } from '../services/userPermissionsService';

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
  color: ${({ darkMode }) => (darkMode ? '#eee' : '#333')};
`;

const Intro = styled.p`
  margin: 0;
  line-height: 1.45;
  font-size: 0.95rem;
`;

const FieldLabel = styled.label`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#380468')};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

export default function TeamSelectionModal() {
  const { darkMode } = useDarkMode();
  const { needsTeamSelection, userId } = useUserProfile();
  const toast = useRef(null);

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const teamOptions = useMemo(
    () => getSelectableTeams().map((t) => ({ label: t.name, value: t.id })),
    []
  );

  // Limpa estado quando o modal fecha
  useEffect(() => {
    if (!needsTeamSelection) {
      setSelectedTeamId(null);
      setError('');
    }
  }, [needsTeamSelection]);

  if (!needsTeamSelection) return null;

  const handleConfirm = async () => {
    if (!selectedTeamId) {
      setError('Selecione uma equipe para continuar.');
      return;
    }
    if (!userId) {
      setError('Usuário não identificado. Faça login novamente.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateUserTeam(userId, selectedTeamId);
      // Persiste imediatamente para que o reload já parta do estado correto,
      // sem flicker do modal antes do refetch contra o Ploomes.
      localStorage.setItem('userTeamId', String(selectedTeamId));
      toast.current?.show({
        severity: 'success',
        summary: 'Equipe definida',
        detail: 'Recarregando o app para aplicar suas permissões…',
        life: 2500,
      });
      // Pequeno delay para o toast aparecer antes do reload.
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Falha ao salvar equipe.');
      setSaving(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Bem-vindo ao N1 App"
        visible
        modal
        closable={false}
        closeOnEscape={false}
        dismissableMask={false}
        style={{ width: 'min(480px, 92vw)' }}
        onHide={() => {}}
      >
        <Body darkMode={darkMode}>
          <Intro>
            Antes de começar, identifique a sua <strong>área</strong> dentro da Ploomes.
            Isso define os serviços que ficarão disponíveis para você no app.
          </Intro>

          <div>
            <FieldLabel darkMode={darkMode} htmlFor="team-select">
              Sua equipe:
            </FieldLabel>
            <Dropdown
              inputId="team-select"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.value)}
              options={teamOptions}
              placeholder="Selecione sua área dentro da Ploomes"
              filter
              showClear={false}
              style={{ width: '100%', marginTop: '0.4rem' }}
              disabled={saving}
            />
          </div>

          {error && <Message severity="error" text={error} />}

          <Actions>
            <Button
              label={saving ? 'Salvando…' : 'Confirmar e entrar'}
              icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              onClick={handleConfirm}
              disabled={saving || !selectedTeamId}
            />
          </Actions>
        </Body>
      </Dialog>
    </>
  );
}
