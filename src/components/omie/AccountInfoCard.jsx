import { useState } from 'react';
import styled from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { getAccountInfo, getMe, getUserIdByName } from '../../services/omieApi.js';
import CredencialCard from '../CredencialCard.jsx';

// Styled Components baseados no componente 1

const StyledContainer = styled(Card)`
  width: 100%;
  box-shadow: 0 2px 4px rgba(59, 59, 59, 0.2);
  border-radius: 6px;
  margin: auto;
  max-width: 1400px;
  background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fcfcfcff')};
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};

  .p-card-content{
    padding: 0px;
  }
`;

const Title = styled.h2`
  text-align: start;
  color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#1e0c45')};
  margin: 1rem 0 1.25rem 0;
`;

// Seção de credencial migrada para <CredencialCard> — spacing da seção.
const CredencialSection = styled.div`
  margin-bottom: 1rem;
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

const InfoBox = styled.div`
  background: ${({ darkMode }) => (darkMode ? 'linear-gradient(180deg, rgba(46,36,78,.98) 0%, rgba(32,24,56,.98) 100%)' : 'linear-gradient(180deg, rgba(233,233,233,1) 0%, rgba(245,245,245,1) 100%)')};
  color: ${({ darkMode }) => (darkMode ? '#ece6ff' : '#4f3fa3')};
  border-radius: 16px;
  box-shadow: ${({ darkMode }) => darkMode ? '0 6px 18px rgba(0,0,0,.45)' : '0 2px 8px rgba(0,0,0,.12)'};
  border: ${({ darkMode }) => darkMode ? '1px solid rgba(141,120,198,.28)' : 'none'};
  padding: 1rem;
  margin-bottom: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(200px,1fr));
  gap: 1rem;
`;

const SmallText = styled.small`
  margin-left: 0.5rem;
  color: ${({ darkMode }) => (darkMode ? '#bbb' : '#666')};
`;

const ConfirmationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#1e0c45')};
`;

const ConfirmationText = styled.span`
  margin-left: 0.5rem;
  color: ${({ ok, darkMode }) =>
    ok ? (darkMode ? '#6fcf97' : 'green') : (darkMode ? '#777' : 'gray')};
  display: flex;
  align-items: center;

  .pi-check-circle {
    color: ${({ darkMode }) => (darkMode ? '#6fcf97' : 'green')};
  }
  .pi-times-circle {
    color: ${({ darkMode }) => (darkMode ? '#777' : 'gray')};
  }
`;

// Componente funcional

export default function AccountInfoCard({ onLoaded, darkMode = false }) {
  const [userKey, setUserKey] = useState('');
  const [info, setInfo] = useState(null);
  const [confirmKey, setConfirmKey] = useState('');
  const [resolvedActionUserId, setResolvedActionUserId] = useState(null);
  const [actionSource, setActionSource] = useState(null);
  const [showIUKey, setShowIUKey] = useState(false);

  // Fluxo de carga chamado pelo CredencialCard (validação controlada):
  // lança Error em falha (mensagem exibida pelo card) e resolve undefined —
  // os estados da página (info/confirmKey/onLoaded) continuam aqui.
  const handleLoad = async (trimmedKey) => {
    // Validação preventiva: detectar se parece ser AccountKey ou AccountId

    // AccountKey geralmente tem formato UUID-like (8-4-4-4-12) ou similar
    const accountKeyPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

    // AccountId é geralmente numérico
    const isNumeric = /^\d+$/.test(trimmedKey);

    if (accountKeyPattern.test(trimmedKey)) {
      throw new Error('Você inseriu uma AccountKey. Por favor, insira a User-Key (UK) do usuário de integração.');
    }

    if (isNumeric) {
      throw new Error('Você inseriu um valor numérico (provavelmente AccountId). Por favor, insira a User-Key (UK) do usuário de integração.');
    }

    try {
      const [accRes, meRes] = await Promise.allSettled([
        getAccountInfo(trimmedKey),
        getMe(trimmedKey),
      ]);

      if (accRes.status !== 'fulfilled') {
        const errorMsg = accRes.reason?.message || 'Erro ao carregar dados';

        // Detectar erros que indicam credencial incorreta
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') ||
            errorMsg.includes('403') || errorMsg.includes('Forbidden') ||
            errorMsg.includes('Invalid') || errorMsg.includes('authentication')) {
          throw new Error('Falha na autenticação. Verifique se você inseriu a User-Key (UK) correta, não a AccountKey ou AccountId.');
        }

        throw accRes.reason;
      }

      const acc = accRes.value;
      const meData = meRes.status === 'fulfilled' ? meRes.value : null;

      setInfo(acc);
      setConfirmKey(acc?.accountKey || '');

      const storedName = localStorage.getItem('userName') || '';

      let actionUserId = meData?.id ?? null;
      let source = actionUserId ? 'me' : null;

      if (!actionUserId && storedName) {
        try {
          const byName = await getUserIdByName(trimmedKey, storedName);
          actionUserId = byName?.id ?? null;
          if (actionUserId) source = 'name';
        } catch {
          // falha ignorada
        }
      }
      if (!actionUserId) {
        actionUserId = acc?.updaterId ?? acc?.creatorId ?? null;
        if (actionUserId && !source) source = 'fallback';
      }
      setResolvedActionUserId(actionUserId);
      setActionSource(source);

      onLoaded?.({
        userKey: trimmedKey,
        accountId: acc?.accountId,
        accountKey: acc?.accountKey,
        integrationUserId: acc?.integrationUserId,
        integrationUserKey: acc?.integrationUserKey,
        actionUserId,
        fieldValuesNormalized: acc?.fieldValuesNormalized || {},
      });
    } catch (err) {
      // Rethrow preservando a mensagem original (fallback igual ao antigo).
      throw new Error(err?.message || 'Erro ao carregar dados');
    }
    // undefined = validação controlada (o card não mexe em `account`).
    return undefined;
  };

  const ok = !!info?.accountKey && confirmKey?.trim() !== '' && confirmKey === info.accountKey;

  return (
    <StyledContainer darkMode={darkMode}>
      <Title darkMode={darkMode}>Account Info (via API-2)</Title>

      <CredencialSection>
        <CredencialCard
          uk={userKey}
          onUkChange={setUserKey}
          onValidate={handleLoad}
          label="User-Key (UK) — não confundir com AccountKey ou AccountId"
          placeholder="Cole a User-Key (UK) do cliente aqui"
          validateLabel="Carregar"
          showAccountChip={false}
        />
      </CredencialSection>

      {info && (
        <>
          <InfoBox darkMode={darkMode}>
            <Grid>
              <div>
                <b>AccountId:</b> {info.accountId ?? '—'}
              </div>
              <div>
                <b>IntegrationUserId:</b> {info.integrationUserId ?? '—'}
              </div>
              <div>
                <b>ActionUserId:</b> {resolvedActionUserId ?? '—'}{' '}
                {resolvedActionUserId && (
                  <SmallText darkMode={darkMode}>
                    (
                    {actionSource === 'me'
                      ? 'me'
                      : actionSource === 'name'
                      ? 'via nome'
                      : 'fallback'}
                    )
                  </SmallText>
                )}
              </div>
              <div>
                <b>IntegrationUserKey (UK do usuário de integração Omie):</b>{' '}
                <span style={{ wordBreak: 'break-all' }}>
                  {showIUKey
                    ? info.integrationUserKey || '—'
                    : info.integrationUserKey
                    ? '••••••••••'
                    : '—'}
                </span>{' '}
                <Button
                  type="button"
                  darkMode={darkMode}
                  label={showIUKey ? 'Ocultar' : 'Mostrar'}
                  className="p-button-text p-button-sm ml-2"
                  icon={showIUKey ? 'pi pi-eye-slash' : 'pi pi-eye'}
                  onClick={() => setShowIUKey((s) => !s)}
                  disabled={!info.integrationUserKey}
                />
              </div>
            </Grid>
          </InfoBox>

          <ConfirmationGrid>
            <div>
              <Label htmlFor="accKeyConfirm" darkMode={darkMode}>
                Confirmar AccountKey (validar)
              </Label>
              <StyledInputText
                id="accKeyConfirm"
                value={confirmKey}
                onChange={(e) => setConfirmKey(e.target.value)}
                placeholder="Cole a AccountKey retornada e confirme"
              />
            </div>
            <ConfirmationText ok={ok} darkMode={darkMode}>
              {ok ? (
                <i className="pi pi-check-circle" />
              ) : (
                <i className="pi pi-times-circle" />
              )}
              <span style={{ marginLeft: 8 }}>
                {ok ? 'AccountKey confirmada' : 'Aguardando confirmação'}
              </span>
            </ConfirmationText>
          </ConfirmationGrid>
        </>
      )}
    </StyledContainer>
  );
}