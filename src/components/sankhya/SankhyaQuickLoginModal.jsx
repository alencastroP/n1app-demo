// src/components/sankhya/SankhyaQuickLoginModal.jsx
import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { apiFetch } from '../../services/http';
import SankhyaModalHeader from './SankhyaModalHeader';

/* ── styled ─────────────────────────────────────────── */

const Section = styled.div`
  background: ${({ darkMode }) => (darkMode ? '#201335' : '#f1f1f1')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#281546' : '#e6e6e6')};
  border-radius: 12px;
  padding: 1.25rem;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : 'inherit')};
`;

const SectionShell = styled(Section)`
  margin-top: 0;
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: .75rem;
  margin-top: auto;
`;

/* ── component ──────────────────────────────────────── */

export default function SankhyaQuickLoginModal({ visible, onHide, userKey, env, account }) {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  const [testingLogin, setTestingLogin] = useState(false);

  async function onTestLogin() {
    if (!account?.id) return;

    setTestingLogin(true);
    try {
      const data = await apiFetch(
        `/api/sankhya/check-login/${account.id}?env=${env}`,
        { method: 'GET', headers: { 'user-key': userKey } },
      );

      if (data?.error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Erro no login',
          detail: typeof data.error === 'string' ? data.error : JSON.stringify(data.error).slice(0, 300),
          life: 6000,
        });
        return;
      }

      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Login validado com sucesso.' });
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Falha na requisição',
        detail: err?.message || 'Erro desconhecido.',
        life: 6000,
      });
    } finally {
      setTestingLogin(false);
    }
  }

  const canTest = !!account?.id && !!userKey?.trim();

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={<SankhyaModalHeader icon="pi pi-check-circle" title="Teste de login rápido" env={env} account={account} />}
        visible={visible}
        onHide={onHide}
        modal
        style={{ width: 'min(720px, 95vw)' }}
        contentStyle={{ padding: 0 }}
      >
        <SectionShell darkMode={darkMode}>
          <p style={{ margin: 0, opacity: .85 }}>
            Valida a conexão e as credenciais de acesso ao Sankhya para a conta selecionada.
          </p>

          <FooterBar>
            <Button
              label="Testar login"
              icon="pi pi-sign-in"
              loading={testingLogin}
              disabled={!canTest || testingLogin}
              onClick={onTestLogin}
              style={{
                background: canTest
                  ? 'linear-gradient(90deg, rgba(136,45,255,1) 0%, rgba(153,31,224,1) 100%)'
                  : undefined,
                border: 'none',
              }}
            />
          </FooterBar>
        </SectionShell>
      </Dialog>
    </>
  );
}
