// pages/DocumentadorForm.jsx
// Tela de entrada: coleta e valida User-Keys, inicia extração
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { useDarkMode } from '../DarkModeContext';
import { validateKeys } from '../services/accountDocumenterService';
import CredencialCard from '../components/CredencialCard';
import ServiceHeader from '../components/ServiceHeader';
import { FormShell } from '../design-system';

// ─── Layout (container externo é o FormShell do DS) ─────────────────────────
const Card = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AccountBadge = styled.div`
  background: ${({ $dm }) => ($dm ? '#251840' : '#f0ecff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d8cfff')};
  border-radius: 10px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
`;

const AccountText = styled.div`
  font-size: 0.9rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-weight: 600;
`;

const AccountSub = styled.div`
  font-size: 0.78rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
`;

const KeyGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const KeyLabel = styled.label`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const KeyRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
`;

// Slot que deixa o CredencialCard ocupar a largura da linha
const KeyCardSlot = styled.div`
  flex: 1;
  min-width: 0;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 0.55rem 0.25rem 0;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  margin: 0.5rem 0;
`;

const ErrorBox = styled.div`
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.35);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: #ef4444;
  font-size: 0.88rem;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
`;

const StartBtn = styled(Button)`
  background: linear-gradient(135deg, #7443f6, #9b67ff) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  padding: 0.8rem 1.5rem !important;
  width: 100% !important;
  justify-content: center !important;
  margin-top: 0.5rem;

  &:hover:not(:disabled) { opacity: 0.9 !important; }
  &:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
`;

const AddKeyBtn = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 1.5px dashed ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  border-radius: 10px;
  padding: 0.5rem 1rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  font-size: 0.83rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover { border-color: #7443f6; color: #7443f6; }
`;

// ─── Component ───────────────────────────────────────────────────────────────
const MAX_KEYS = 5;

// Id estável por linha: o CredencialCard guarda estado interno (erro, olho
// mágico); com o índice como key do React, remover uma key do meio faria esse
// estado "vazar" para a linha que assume a posição.
let keyEntrySeq = 0;
function createKeyEntry() {
  // account = {accountId, accountName, logoUrl}|null (shape do CredencialCard)
  return { id: ++keyEntrySeq, value: '', account: null };
}

export default function DocumentadorForm() {
  const { darkMode: dm } = useDarkMode();
  const navigate = useNavigate();

  const [keys, setKeys] = useState([createKeyEntry()]);
  const [globalError, setGlobalError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const firstAccount = keys.find(k => k.account)?.account ?? null;
  const accountId   = firstAccount?.accountId ?? null;
  const accountName = firstAccount?.accountName ?? null;
  const validCount  = keys.filter(k => k.account).length;
  const allValidated = validCount > 0 && keys.every(k => !k.value.trim() || k.account);
  const canStart = allValidated && !isStarting;

  function updateKey(idx, patch) {
    setKeys(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  // Valida uma key no service e checa consistência com as demais já validadas.
  // Lança Error em falha (contrato do CredencialCard).
  async function validateSingle(idx, uk) {
    setGlobalError('');

    const result = await validateKeys([uk]);
    const info = result.validatedKeys?.[0];
    if (!info) throw new Error('Não foi possível validar a User-Key.');

    const infoAccountId = info.accountId ?? info.AccountId ?? info.id ?? info.Id ?? null;
    const infoAccountName = info.accountName ?? info.AccountName ?? info.name ?? info.Name ?? null;

    const otherAccountId = keys.find((k, i) => i !== idx && k.account)?.account?.accountId ?? null;
    if (otherAccountId && infoAccountId !== otherAccountId) {
      setGlobalError('As User-Keys não pertencem à mesma conta');
      throw new Error(`Pertence à conta ${infoAccountId}, mas as demais pertencem à ${otherAccountId}`);
    }

    return { accountId: infoAccountId, accountName: infoAccountName, logoUrl: null };
  }

  function addKey() {
    if (keys.length >= MAX_KEYS) return;
    setKeys(prev => [...prev, createKeyEntry()]);
  }

  function removeKey(idx) {
    setKeys(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleStart() {
    setIsStarting(true);
    setGlobalError('');

    const validKeys = keys.filter(k => k.account).map(k => k.value.trim());

    // Passar dados via sessionStorage para a tela de loading
    sessionStorage.setItem('docExtraction', JSON.stringify({
      keys: validKeys,
      accountId: String(accountId),
      accountName,
    }));

    navigate('/account-documenter/loading');
  }

  return (
    <FormShell
      width="narrow"
      header={(
        <ServiceHeader
          platforms={['ploomes']}
          title="Documentador de Contas"
          subtitle="Insira até 5 User-Keys da mesma conta Ploomes para gerar a documentação completa."
        />
      )}
    >
      <Card $dm={dm}>
        {accountId && (
          <AccountBadge $dm={dm}>
            <i className="pi pi-building" style={{ color: '#7443f6' }} />
            <div>
              <AccountText $dm={dm}>{accountName}</AccountText>
              <AccountSub $dm={dm}>ID: {accountId}</AccountSub>
            </div>
          </AccountBadge>
        )}

        <KeyGroup>
          {keys.map((entry, idx) => (
            <div key={entry.id}>
              <KeyLabel $dm={dm}>User-Key {idx + 1}{idx === 0 ? ' *' : ''}</KeyLabel>
              <KeyRow>
                <KeyCardSlot>
                  <CredencialCard
                    compact
                    prefillContaAtiva={idx === 0}
                    showAccountChip={false}
                    uk={entry.value}
                    onUkChange={v => updateKey(idx, { value: v })}
                    account={entry.account}
                    onAccountChange={acc => updateKey(idx, { account: acc })}
                    onValidate={uk => validateSingle(idx, uk)}
                    label={`User-Key ${idx + 1}`}
                    placeholder="Cole a User-Key aqui…"
                    disabled={isStarting}
                  />
                </KeyCardSlot>
                {idx > 0 && (
                  <RemoveBtn type="button" onClick={() => removeKey(idx)} title="Remover" disabled={isStarting}>
                    <i className="pi pi-times" />
                  </RemoveBtn>
                )}
              </KeyRow>
            </div>
          ))}
        </KeyGroup>

        {keys.length < MAX_KEYS && (
          <AddKeyBtn $dm={dm} onClick={addKey}>
            <i className="pi pi-plus" /> Adicionar outra User-Key
          </AddKeyBtn>
        )}

        {globalError && (
          <ErrorBox>
            <i className="pi pi-exclamation-triangle" style={{ marginTop: 2 }} />
            {globalError}
          </ErrorBox>
        )}

        <Divider $dm={dm} />

        <StartBtn
          label="Iniciar Extração"
          icon="pi pi-play"
          disabled={!canStart}
          loading={isStarting}
          onClick={handleStart}
        />
      </Card>
    </FormShell>
  );
}
