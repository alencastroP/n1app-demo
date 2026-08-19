// pages/AccountExportForm.jsx
// Exportação de Base: coleta/valida User-Keys, roda a pré-triagem ($count) e
// encaminha para a tela de extração. Mesmo padrão visual do Documentador.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import { FormShell } from '../design-system';
import CredencialCard from '../components/CredencialCard';
import { validateKeys, runTriage } from '../services/accountExportService';

// ─── Layout (espelha DocumentadorForm; container externo é o FormShell do DS) ──
const InfoBox = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#f5f2ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 12px;
  padding: 1rem 1.1rem;
  margin-bottom: 1.25rem;
  font-size: 0.86rem;
  line-height: 1.55;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
`;

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

const PrimaryBtn = styled(Button)`
  background: linear-gradient(135deg, #7443f6, #9b67ff) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  padding: 0.8rem 1.5rem !important;
  width: 100% !important;
  justify-content: center !important;
  &:hover:not(:disabled) { opacity: 0.9 !important; }
  &:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
`;

// ─── Triagem ───────────────────────────────────────────────────────────────────
const TriageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.6rem;
`;

const TriageCard = styled.div`
  background: ${({ $dm }) => ($dm ? '#130d26' : '#f8f6ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
`;

const TriageValue = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#4a2fa0')};
`;

const TriageLabel = styled.div`
  font-size: 0.72rem;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  margin-top: 0.15rem;
`;

const TriageNote = styled.p`
  font-size: 0.8rem;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  margin: 0.25rem 0 0 0;
`;

// ─── Constantes ────────────────────────────────────────────────────────────────
const MAX_KEYS = 5;

const TRIAGE_LABELS = {
  pipelines: 'Funis',
  deals: 'Negócios',
  contacts: 'Clientes',
  products: 'Produtos',
  contact_products: 'Produtos de cliente',
  quotes: 'Propostas',
  orders: 'Vendas',
  documents: 'Documentos',
  tasks: 'Tarefas',
  interaction_records: 'Interações',
};

// Id estável por linha: o CredencialCard guarda estado interno (erro, olho
// mágico); com o índice como key do React, remover uma key do meio faria esse
// estado "vazar" para a linha que assume a posição.
let keyEntrySeq = 0;
function createKeyEntry() {
  return { id: ++keyEntrySeq, value: '', status: 'idle', accountId: null, accountName: null, error: null };
}

export default function AccountExportForm() {
  const { darkMode: dm } = useDarkMode();
  const navigate = useNavigate();

  const [keys, setKeys] = useState([createKeyEntry()]);
  const [globalError, setGlobalError] = useState('');
  const [triaging, setTriaging] = useState(false);
  const [triageLog, setTriageLog] = useState('');
  const [triage, setTriage] = useState(null); // { counts, errors }

  const accountId = keys.find((k) => k.accountId)?.accountId ?? null;
  const accountName = keys.find((k) => k.accountName)?.accountName ?? null;
  const validCount = keys.filter((k) => k.status === 'valid').length;
  const allValidated = validCount > 0 && keys.every((k) => !k.value.trim() || k.status === 'valid');
  const anyValidating = keys.some((k) => k.status === 'validating');

  function updateKey(idx, patch) {
    setKeys((prev) => { const next = [...prev]; next[idx] = { ...next[idx], ...patch }; return next; });
  }

  // Limpa a conta validada da linha (edição da UK dispara isso no CredencialCard)
  function clearKeyAccount(idx) {
    setKeys((prev) => {
      const cur = prev[idx];
      if (!cur) return prev;
      const next = [...prev];
      next[idx] = { ...cur, accountId: null, accountName: null, status: cur.status === 'valid' ? 'idle' : cur.status };
      return next;
    });
  }

  // Valida no service e normaliza p/ o CredencialCard; lança Error em falha
  async function validateSingle(idx, uk) {
    setGlobalError('');
    setTriage(null);
    updateKey(idx, { status: 'validating', error: null, accountId: null, accountName: null });
    try {
      const result = await validateKeys([uk]);
      const info = result.validatedKeys?.[0] ?? {};
      const accId = info.accountId ?? info.AccountId ?? info.id ?? info.Id ?? null;
      const accName = info.accountName ?? info.AccountName ?? info.name ?? info.Name ?? null;
      if (accountId && accId !== accountId) {
        setGlobalError('As User-Keys não pertencem à mesma conta');
        throw new Error(`Pertence à conta ${accId}, mas as demais pertencem à ${accountId}`);
      }
      updateKey(idx, { status: 'valid', accountId: accId, accountName: accName, error: null });
      return { accountId: accId, accountName: accName, logoUrl: info.logoUrl ?? info.LogoUrl ?? null };
    } catch (err) {
      updateKey(idx, { status: 'invalid', error: err.message });
      throw err;
    }
  }

  function addKey() { if (keys.length < MAX_KEYS) setKeys((p) => [...p, createKeyEntry()]); }
  function removeKey(idx) { setKeys((p) => p.filter((_, i) => i !== idx)); }

  async function handleTriage() {
    setTriaging(true);
    setGlobalError('');
    setTriage(null);
    setTriageLog('Iniciando pré-triagem…');
    const validKeys = keys.filter((k) => k.status === 'valid').map((k) => k.value.trim());
    const { promise } = runTriage({ keys: validKeys }, { onProgress: (m) => setTriageLog(m) });
    try {
      const result = await promise;
      setTriage(result);
    } catch (err) {
      setGlobalError(err.message || 'Falha na pré-triagem');
    } finally {
      setTriaging(false);
    }
  }

  function handleStart() {
    const validKeys = keys.filter((k) => k.status === 'valid').map((k) => k.value.trim());
    sessionStorage.setItem('accountExport', JSON.stringify({
      keys: validKeys,
      accountId: String(accountId),
      accountName,
      triage,
    }));
    navigate('/account-export/loading');
  }

  return (
    <FormShell
      width="narrow"
      header={(
        <ServiceHeader
          platforms={['ploomes']}
          title="Exportação de Base"
          subtitle="Exporte todos os dados de uma conta Ploomes em planilhas (.xlsx) por entidade — ideal para clientes que solicitam a extração completa da base. Insira de 1 a 5 User-Keys da mesma conta; usar mais de uma acelera a exportação (cada chave tem seu próprio limite de requisições)."
        />
      )}
    >
      <InfoBox $dm={dm}>
        <strong>Como funciona:</strong> após validar as chaves, fazemos uma <strong>pré-triagem</strong> que
        conta quantos registros existem em cada entidade. Em seguida, a exportação roda em segundo plano,
        paginando tudo com controle de limite de requisições — contas grandes podem levar vários minutos.
        Ao final, você baixa um <strong>.zip</strong> com uma planilha por entidade.
      </InfoBox>

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
                    onUkChange={(v) => { updateKey(idx, { value: v, status: 'idle', error: null }); setTriage(null); }}
                    account={entry.status === 'valid' ? { accountId: entry.accountId, accountName: entry.accountName } : null}
                    onAccountChange={(acc) => { if (!acc) clearKeyAccount(idx); }}
                    onValidate={(uk) => validateSingle(idx, uk)}
                    placeholder="Cole a User-Key aqui…"
                  />
                </KeyCardSlot>
                {idx > 0 && (
                  <RemoveBtn onClick={() => removeKey(idx)} title="Remover" disabled={entry.status === 'validating'}>
                    <i className="pi pi-times" />
                  </RemoveBtn>
                )}
              </KeyRow>
            </div>
          ))}
        </KeyGroup>

        {keys.length < MAX_KEYS && (
          <AddKeyBtn $dm={dm} onClick={addKey}><i className="pi pi-plus" /> Adicionar outra User-Key</AddKeyBtn>
        )}

        {globalError && (
          <ErrorBox><i className="pi pi-exclamation-triangle" style={{ marginTop: 2 }} />{globalError}</ErrorBox>
        )}

        <Divider $dm={dm} />

        {/* Etapa de triagem */}
        {!triage ? (
          <PrimaryBtn
            label={triaging ? (triageLog || 'Analisando conta…') : 'Analisar conta (pré-triagem)'}
            icon={triaging ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
            disabled={!allValidated || anyValidating || triaging}
            onClick={handleTriage}
          />
        ) : (
          <>
            <TriageGrid>
              {Object.entries(TRIAGE_LABELS).map(([key, label]) => (
                <TriageCard key={key} $dm={dm}>
                  <TriageValue $dm={dm}>
                    {triage.counts?.[key] == null ? '—' : Number(triage.counts[key]).toLocaleString('pt-BR')}
                  </TriageValue>
                  <TriageLabel $dm={dm}>{label}</TriageLabel>
                </TriageCard>
              ))}
            </TriageGrid>
            {triage.errors?.length > 0 && (
              <TriageNote $dm={dm}>
                ⚠ Algumas entidades não puderam ser contadas (sem acesso/erro). A exportação seguirá com o que for possível.
              </TriageNote>
            )}
            <TriageNote $dm={dm}>
              "—" indica entidade não contabilizada. A exportação extrai <strong>tudo</strong>, sem teto.
            </TriageNote>
            <Divider $dm={dm} />
            <PrimaryBtn label="Iniciar exportação" icon="pi pi-download" onClick={handleStart} />
          </>
        )}
      </Card>
    </FormShell>
  );
}
