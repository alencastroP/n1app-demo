// src/components/sankhya/SankhyaTrocaTokenModal.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { getLastIntegrations, trocaToken } from '../../services/sankhyaApi';
import SankhyaModalHeader from './SankhyaModalHeader';

/* ── styled ─────────────────────────────────────────── */

const SectionShell = styled.div`
  background: ${({ darkMode }) => (darkMode ? '#201335' : '#f1f1f1')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#281546' : '#e6e6e6')};
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  border-top: 1px solid ${({ darkMode }) => (darkMode ? '#281546' : '#e6e6e6')};
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : 'inherit')};
`;

const FieldLabel = styled.label`
  font-size: .85rem;
  font-weight: 600;
  letter-spacing: .02em;
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#38315e')};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: .4rem;
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  .p-inputtext {
    padding-right: 3rem;
    width: 100%;
  }

  .toggle-visibility {
    position: absolute;
    right: 10px;
    cursor: pointer;
    color: ${({ darkMode }) => (darkMode ? '#a0a0a0' : '#6c757d')};
    transition: color 0.2s;

    &:hover {
      color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    }
  }
`;

const WarningBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .85rem 1rem;
  border-radius: 10px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,180,0,.08)' : 'rgba(255,160,0,.08)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,180,0,.3)' : 'rgba(230,140,0,.35)')};
  color: ${({ darkMode }) => (darkMode ? '#ffd166' : '#8a5800')};
  font-size: .88rem;
  line-height: 1.5;

  .pi {
    margin-top: 2px;
    flex-shrink: 0;
    font-size: 1rem;
  }
`;

const VersionRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .6rem;
  font-size: .9rem;
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#38315e')};

  .p-button {
    margin-left: auto;
  }
`;

const Hint = styled.span`
  font-size: .8rem;
  line-height: 1.45;
  color: ${({ darkMode }) => (darkMode ? '#a89ccc' : '#6b6480')};
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: .75rem;
  margin-top: auto;
`;

/* ── component ──────────────────────────────────────── */

export default function SankhyaTrocaTokenModal({ visible, onHide, userKey, env, account }) {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  const [newToken, setNewToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loadingVersion, setLoadingVersion] = useState(false);
  const [version, setVersion] = useState(null);

  // Duas UKs, porque os dois passos exigem públicos opostos: a consulta de versão
  // (admin/qa) pode ser restrita a usuários de suporte, e a troca (integration-api)
  // só aceita usuário real da conta. Ambas editáveis aqui: a barra de credenciais
  // fica atrás do modal, então sem isso um par errado viraria beco sem saída.
  const [ukConta, setUkConta] = useState(userKey);
  const [showUkConta, setShowUkConta] = useState(false);
  const [supportUk, setSupportUk] = useState('');
  const [showSupportUk, setShowSupportUk] = useState(false);
  const [needsSupportUk, setNeedsSupportUk] = useState(false);

  const runVersionCheck = useCallback(async (uk, isCancelled = () => false) => {
    setLoadingVersion(true);
    setVersion(null);
    try {
      const { version: v } = await getLastIntegrations({ accountId: account.id, userKey: uk, env });
      if (isCancelled()) return false;
      setVersion(v);
      setNeedsSupportUk(false);
      return true;
    } catch (err) {
      if (isCancelled()) return false;
      setNeedsSupportUk(true);
      toast.current?.show({
        severity: 'warn',
        summary: 'Versão não verificada',
        detail: `${err?.message || 'Não foi possível validar a versão da integração.'} `
          + 'Informe a User-Key de um usuário de suporte para essa consulta.',
        life: 7000,
      });
      return false;
    } finally {
      if (!isCancelled()) setLoadingVersion(false);
    }
  }, [account?.id, env]);

  // Ao abrir (ou ao trocar a UK/ambiente na barra), recarrega a credencial e valida
  // a versão da integração na conta (V2 / V3) com a UK da conta.
  useEffect(() => {
    if (!visible || !account?.id || !userKey) return;
    let cancelled = false;
    setUkConta(userKey);
    setSupportUk('');
    setNeedsSupportUk(false);
    runVersionCheck(userKey, () => cancelled);
    return () => { cancelled = true; };
  }, [visible, account?.id, userKey, runVersionCheck]);

  // Reconsulta a versão com o par de UKs atual: a de suporte quando informada,
  // senão a da conta.
  function onVerificarVersao() {
    const uk = supportUk.trim() || ukConta.trim();
    if (uk) runVersionCheck(uk);
  }

  async function onTrocaToken() {
    if (!newToken.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Insira o novo token.' });
      return;
    }

    setSubmitting(true);
    try {
      const { version: usedVersion } = await trocaToken({
        userKey: ukConta.trim(),
        newToken,
        env,
        supportUserKey: supportUk.trim() || undefined,
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Token atualizado',
        detail: `A troca de token (V${usedVersion ?? version ?? '?'}) foi realizada com sucesso.`,
        life: 6000,
      });
      setNewToken('');
    } catch (err) {
      // O backend sinaliza quando foi a checagem de versão que barrou, não a troca.
      if (err?.body?.needsSupportUserKey) setNeedsSupportUk(true);
      toast.current?.show({
        severity: 'error',
        summary: 'Falha na troca',
        detail: err?.message || 'Erro desconhecido.',
        life: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleHide() {
    setNewToken('');
    setShowToken(false);
    setSubmitting(false);
    setVersion(null);
    setUkConta(userKey);
    setShowUkConta(false);
    setSupportUk('');
    setShowSupportUk(false);
    setNeedsSupportUk(false);
    onHide();
  }

  const inputStyle = {
    background: darkMode ? '#1a0e2e' : '#fafafa',
    border: `1px solid ${darkMode ? '#2A2A3D' : '#e0dde2'}`,
    color: darkMode ? '#d6d5da' : '#0a0025',
    borderRadius: 8,
  };

  // Sem a versão o backend não sabe se despacha V2 ou V3 — enviar seria falha garantida.
  const canSubmit = !!account?.id && !!ukConta.trim() && !!newToken.trim()
    && !loadingVersion && version != null;

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={<SankhyaModalHeader icon="pi pi-key" title="Troca de token" env={env} account={account} />}
        visible={visible}
        onHide={handleHide}
        modal
        style={{ width: 'min(680px, 95vw)' }}
        contentStyle={{ padding: 0 }}
      >
        <SectionShell darkMode={darkMode}>

          {/* Aviso */}
          <WarningBanner darkMode={darkMode}>
            <i className="pi pi-exclamation-triangle" />
            <span>
              Após a troca do token, a integração pode ficar <strong>temporariamente indisponível</strong> por alguns minutos.
              Durante esse período, qualquer item criado ou editado no Ploomes não será processado automaticamente e deverá ser <strong>reprocessado</strong> manualmente após a reconexão.
            </span>
          </WarningBanner>

          {/* UK do usuário da conta — quem executa a troca. Vem da barra, mas é editável:
              se a barra tiver a UK errada para este passo, dá para corrigir aqui. */}
          <Field>
            <FieldLabel darkMode={darkMode} htmlFor="tt-uk-conta">
              User-Key do usuário da conta
            </FieldLabel>
            <PasswordInputWrapper darkMode={darkMode}>
              <InputText
                id="tt-uk-conta"
                type={showUkConta ? 'text' : 'password'}
                value={ukConta}
                onChange={(e) => setUkConta(e.target.value)}
                placeholder="Cole a User-Key de um usuário real da conta"
                style={inputStyle}
              />
              <i
                className={`pi ${showUkConta ? 'pi-eye-slash' : 'pi-eye'} toggle-visibility`}
                onClick={() => setShowUkConta((v) => !v)}
              />
            </PasswordInputWrapper>
            <Hint darkMode={darkMode}>
              Executa a troca do token. Precisa ser de um usuário real da conta
              — a integração recusa User-Key de usuário de suporte nesse passo.
            </Hint>
          </Field>

          {/* UK de suporte — revelada quando a consulta de versão recusa a UK da conta */}
          {needsSupportUk && (
            <Field>
              <FieldLabel darkMode={darkMode} htmlFor="tt-support-uk">
                User-Key de suporte
              </FieldLabel>
              <PasswordInputWrapper darkMode={darkMode}>
                <InputText
                  id="tt-support-uk"
                  type={showSupportUk ? 'text' : 'password'}
                  value={supportUk}
                  onChange={(e) => setSupportUk(e.target.value)}
                  placeholder="Cole a User-Key de um usuário de suporte"
                  style={inputStyle}
                />
                <i
                  className={`pi ${showSupportUk ? 'pi-eye-slash' : 'pi-eye'} toggle-visibility`}
                  onClick={() => setShowSupportUk((v) => !v)}
                />
              </PasswordInputWrapper>
              <Hint darkMode={darkMode}>
                Usada apenas para consultar a versão da integração, que pode ser restrita a
                usuários de suporte. Não participa da troca do token.
              </Hint>
            </Field>
          )}

          {/* Versão da integração — reconsultável a qualquer momento com o par de UKs atual */}
          <VersionRow darkMode={darkMode}>
            <span>Versão da integração:</span>
            {loadingVersion ? (
              <span style={{ opacity: .8 }}><i className="pi pi-spin pi-spinner" style={{ marginRight: 6 }} />verificando…</span>
            ) : version != null ? (
              <Tag
                value={`V${version}`}
                severity={Number(version) >= 3 ? 'info' : 'warning'}
              />
            ) : (
              <span style={{ opacity: .7 }}>—</span>
            )}
            <Button
              label="Verificar"
              icon="pi pi-search"
              outlined
              size="small"
              loading={loadingVersion}
              disabled={loadingVersion || !(supportUk.trim() || ukConta.trim())}
              onClick={onVerificarVersao}
            />
          </VersionRow>

          {/* Novo token */}
          <Field>
            <FieldLabel darkMode={darkMode} htmlFor="tt-token">Novo token</FieldLabel>
            <PasswordInputWrapper darkMode={darkMode}>
              <InputText
                id="tt-token"
                type={showToken ? 'text' : 'password'}
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="Cole o novo token de integração"
                disabled={!account?.id}
                style={{ ...inputStyle, opacity: !account?.id ? 0.5 : 1 }}
              />
              <i
                className={`pi ${showToken ? 'pi-eye-slash' : 'pi-eye'} toggle-visibility`}
                onClick={() => setShowToken((v) => !v)}
              />
            </PasswordInputWrapper>
          </Field>

          {/* Footer */}
          <FooterBar>
            <Button
              label="Trocar token"
              icon="pi pi-sync"
              loading={submitting}
              disabled={!canSubmit || submitting}
              onClick={onTrocaToken}
              style={{
                background: canSubmit
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
