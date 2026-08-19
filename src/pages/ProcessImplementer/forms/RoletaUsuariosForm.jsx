import { useState, useRef, useCallback } from 'react';
import { Toast } from 'primereact/toast';
import styled, { keyframes } from 'styled-components';
import { useDarkMode } from '../../../DarkModeContext';
import {
  validateUserKey,
  fetchPipelines,
  fetchUsers,
  implementRoulette,
} from '../../../services/rouletteImplementerService';
import { logAction } from '../../../services/userHistoryService';
import UserKeyCard from '../components/UserKeyCard';
import ContaAtivaHint from '../../../components/ContaAtivaHint';

// ── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

// ── Layout ──────────────────────────────────────────────────────────────────

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: ${fadeIn} 0.3s ease;
`;

const Card = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  animation: ${fadeIn} 0.25s ease;
`;

const FieldLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  margin-bottom: 0.35rem;
`;

const SectionTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  i { font-size: 0.8rem; color: #7443f6; }
`;

// ── Selector ─────────────────────────────────────────────────────────────────

const SelectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.3) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.3); border-radius: 4px; }
`;

const SelectorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  border-radius: 9px;
  cursor: pointer;
  background: ${({ $selected, $dm }) =>
    $selected
      ? ($dm ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.08)')
      : 'transparent'};
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(116,67,246,0.4)' : 'transparent')};
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: ${({ $dm }) => ($dm ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.06)')}; }
`;

const Checkbox = styled.div`
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 2px solid ${({ $checked }) => ($checked ? '#7443f6' : 'rgba(116,67,246,0.4)')};
  background: ${({ $checked }) => ($checked ? '#7443f6' : 'transparent')};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s;
  i { color: #fff; font-size: 0.65rem; }
`;

const PipelineDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color || '#7443f6'};
  flex-shrink: 0;
`;

const AvatarFallback = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7443f6, #9b67ff);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ItemName = styled.div`
  font-size: 0.87rem;
  font-weight: 600;
  color: ${({ $dm }) => ($dm ? '#d4c8ff' : '#3d2a80')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemSub = styled.div`
  font-size: 0.75rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
`;

const Badge = styled.span`
  font-size: 0.73rem;
  font-weight: 700;
  background: rgba(116,67,246,0.13);
  color: #7443f6;
  border-radius: 99px;
  padding: 0.12rem 0.5rem;
  border: 1px solid rgba(116,67,246,0.3);
`;

const CountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
`;

const Warning = styled.div`
  font-size: 0.78rem;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

// ── Preview box ───────────────────────────────────────────────────────────────

const PreviewBox = styled.div`
  background: ${({ $dm }) => ($dm ? '#130d26' : '#f5f2ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#d8cfff')};
  border-radius: 12px;
  padding: 0.9rem 1rem;
`;

const PreviewTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  margin-bottom: 0.6rem;
`;

const PreviewItem = styled.div`
  font-size: 0.85rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.2rem 0;
  i { color: #7443f6; font-size: 0.75rem; }
`;

// ── Progress ──────────────────────────────────────────────────────────────────

const ProgressCard = styled.div`
  background: ${({ $dm }) => ($dm ? '#1e1535' : '#f0ecff')};
  border-radius: 14px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const ProgressBar = styled.div`
  height: 5px;
  border-radius: 99px;
  background: ${({ $dm }) => ($dm ? '#2d2a3e' : '#ddd8ff')};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 99px;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, #7443f6, #9b67ff, #7443f6);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite linear;
  transition: width 0.5s ease;
`;

const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const LogLine = styled.div`
  font-size: 0.82rem;
  color: ${({ $dm, $ok }) => $ok ? '#22c55e' : ($dm ? '#c4b5fd' : '#4a2fa0')};
  line-height: 1.4;
`;

// ── Buttons ──────────────────────────────────────────────────────────────────

const ActionsRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.button`
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #7443f6, #9b67ff);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SecondaryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: transparent;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: ${({ $dm }) => ($dm ? '#251840' : '#ede8ff')}; border-color: #7443f6; }
`;

const HintText = styled.p`
  font-size: 0.78rem;
  color: ${({ $dm }) => ($dm ? '#6a5a9a' : '#a090cc')};
  margin: 0;
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function RoletaUsuariosForm() {
  const { darkMode: dm } = useDarkMode();
  const toast = useRef(null);

  const [uk, setUk] = useState('');
  const [ukStatus, setUkStatus] = useState('idle'); // idle | validating | valid | invalid
  const [ukError, setUkError] = useState('');

  const [pipelines, setPipelines] = useState([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [selectedPipelineIds, setSelectedPipelineIds] = useState([]);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [phase, setPhase] = useState('form'); // form | implementing | done | error
  const [logs, setLogs] = useState([]);
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const addLog = useCallback((msg) => setLogs((prev) => [...prev, msg]), []);

  const warn = (detail) =>
    toast.current?.show({ severity: 'warn', summary: 'Atenção', detail, life: 4000 });

  async function handleValidateUk() {
    const trimmed = uk.trim();
    if (!trimmed) { warn('Informe a User-Key antes de validar.'); return; }
    if (ukStatus === 'validating') return;

    setUkStatus('validating');
    setUkError('');
    setPipelines([]);
    setSelectedPipelineIds([]);
    setUsers([]);
    setSelectedUserIds([]);

    try {
      await validateUserKey(trimmed);
      setUkStatus('valid');

      setLoadingPipelines(true);
      const pipes = await fetchPipelines(trimmed);
      setPipelines(pipes);
      setLoadingPipelines(false);

      setLoadingUsers(true);
      const userList = await fetchUsers(trimmed);
      setUsers(userList);
      setLoadingUsers(false);
    } catch (err) {
      setUkStatus('invalid');
      setUkError(err.message || 'User-Key inválida ou sem permissão');
      setLoadingPipelines(false);
      setLoadingUsers(false);
    }
  }

  function togglePipeline(id) {
    setSelectedPipelineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleUser(id) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function validate() {
    if (ukStatus !== 'valid') { warn('Valide a User-Key antes de continuar.'); return false; }
    if (selectedPipelineIds.length === 0) { warn('Selecione pelo menos 1 funil.'); return false; }
    if (selectedUserIds.length < 2) { warn('Selecione pelo menos 2 usuários para a distribuição.'); return false; }
    return true;
  }

  async function handleImplement() {
    if (!validate()) return;

    const selectedPipelines = pipelines.filter((p) => selectedPipelineIds.includes(p.Id));
    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.Id));

    setPhase('implementing');
    setLogs([]);
    setPct(0);
    setErrorMsg('');

    const totalSteps = selectedUsers.length + 6;
    let stepsDone = 0;

    try {
      const res = await implementRoulette({
        uk: uk.trim(),
        pipelines: selectedPipelines,
        users: selectedUsers,
        onProgress: (msg) => {
          addLog(msg);
          if (msg.startsWith('✔')) {
            stepsDone++;
            setPct(Math.min(Math.round((stepsDone / totalSteps) * 95), 95));
          }
        },
      });
      setPct(100);
      setResult(res);
      logAction({ a: 'execucao', s: 'process-implementer', d: `Roleta de Usuários · ${selectedPipelines.length} funis · ${selectedUsers.length} usuários` }); // best-effort
      setPhase('done');
    } catch (err) {
      setErrorMsg(err.message || 'Erro desconhecido durante a implementação.');
      setPhase('error');
    }
  }

  function handleReset() {
    setUk('');
    setUkStatus('idle');
    setUkError('');
    setPipelines([]);
    setSelectedPipelineIds([]);
    setUsers([]);
    setSelectedUserIds([]);
    setPhase('form');
    setLogs([]);
    setPct(0);
    setResult(null);
    setErrorMsg('');
  }

  const selectedPipelines = pipelines.filter((p) => selectedPipelineIds.includes(p.Id));
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.Id));
  const canImplement =
    ukStatus === 'valid' &&
    selectedPipelineIds.length > 0 &&
    selectedUserIds.length >= 2 &&
    phase === 'form';

  return (
    <>
      <Toast ref={toast} />
      <FormWrapper>
        <UserKeyCard
          uk={uk}
          onUkChange={(v) => { setUk(v); setUkStatus('idle'); setUkError(''); }}
          status={ukStatus}
          errorMsg={ukError}
          onValidate={handleValidateUk}
          locked={phase !== 'form'}
        />

        {/* ── Funis ── */}
        {ukStatus === 'valid' && (
          <Card $dm={dm}>
            <SectionTitle $dm={dm}>
              <i className="pi pi-sitemap" />
              Funis *
            </SectionTitle>

            {loadingPipelines ? (
              <div style={{ fontSize: '0.85rem', color: dm ? '#9580c8' : '#7a6aaa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="pi pi-spin pi-spinner" style={{ color: '#7443f6' }} />
                Carregando funis…
              </div>
            ) : (
              <>
                <CountRow $dm={dm}>
                  <span>{pipelines.length} funis disponíveis</span>
                  {selectedPipelineIds.length > 0 && (
                    <Badge>{selectedPipelineIds.length} selecionado{selectedPipelineIds.length > 1 ? 's' : ''}</Badge>
                  )}
                </CountRow>
                <SelectorList>
                  {pipelines.map((p) => {
                    const sel = selectedPipelineIds.includes(p.Id);
                    return (
                      <SelectorItem
                        key={p.Id}
                        $dm={dm}
                        $selected={sel}
                        onClick={() => phase === 'form' && togglePipeline(p.Id)}
                      >
                        <Checkbox $checked={sel}>{sel && <i className="pi pi-check" />}</Checkbox>
                        <PipelineDot $color={p.Color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <ItemName $dm={dm}>{p.Name}</ItemName>
                        </div>
                      </SelectorItem>
                    );
                  })}
                </SelectorList>
              </>
            )}
          </Card>
        )}

        {/* ── Usuários ── */}
        {ukStatus === 'valid' && (
          <Card $dm={dm}>
            <SectionTitle $dm={dm}>
              <i className="pi pi-users" />
              Usuários *
            </SectionTitle>

            {loadingUsers ? (
              <div style={{ fontSize: '0.85rem', color: dm ? '#9580c8' : '#7a6aaa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="pi pi-spin pi-spinner" style={{ color: '#7443f6' }} />
                Carregando usuários…
              </div>
            ) : (
              <>
                <CountRow $dm={dm}>
                  <span>{users.length} usuários disponíveis</span>
                  {selectedUserIds.length > 0 && (
                    <Badge>{selectedUserIds.length} selecionado{selectedUserIds.length > 1 ? 's' : ''}</Badge>
                  )}
                </CountRow>
                <SelectorList>
                  {users.map((u) => {
                    const sel = selectedUserIds.includes(u.Id);
                    const initials = u.Name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? '?';
                    return (
                      <SelectorItem
                        key={u.Id}
                        $dm={dm}
                        $selected={sel}
                        onClick={() => phase === 'form' && toggleUser(u.Id)}
                      >
                        <Checkbox $checked={sel}>{sel && <i className="pi pi-check" />}</Checkbox>
                        <AvatarFallback>{initials}</AvatarFallback>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <ItemName $dm={dm}>{u.Name}</ItemName>
                          {u.Email && <ItemSub $dm={dm}>{u.Email}</ItemSub>}
                        </div>
                      </SelectorItem>
                    );
                  })}
                </SelectorList>
                {selectedUserIds.length === 1 && (
                  <Warning>
                    <i className="pi pi-exclamation-triangle" />
                    Selecione pelo menos 2 usuários para a roleta
                  </Warning>
                )}
              </>
            )}
          </Card>
        )}

        {/* ── Critério de distribuição ── */}
        {ukStatus === 'valid' && (
          <Card $dm={dm}>
            <SectionTitle $dm={dm}>
              <i className="pi pi-sliders-h" />
              Critério de distribuição
            </SectionTitle>
            <SelectorItem $dm={dm} $selected style={{ cursor: 'default' }}>
              <div style={{
                width: 17, height: 17, borderRadius: '50%',
                border: '2px solid #7443f6',
                background: '#7443f6',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
              </div>
              <div>
                <ItemName $dm={dm}>Round Robin (padrão)</ItemName>
                <ItemSub $dm={dm}>Distribui em ordem cíclica entre os usuários selecionados</ItemSub>
              </div>
            </SelectorItem>
          </Card>
        )}

        {/* ── Preview do que será criado ── */}
        {canImplement && (
          <PreviewBox $dm={dm}>
            <ContaAtivaHint uk={uk} />
            <PreviewTitle $dm={dm}>O que será criado na conta</PreviewTitle>
            <PreviewItem $dm={dm}><i className="pi pi-user" /> 1 contato auxiliar de controle</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-list" /> 1 campo contador no Contato</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-list" /> 2 campos no Negócio (contador + cliente auxiliar)</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-filter" /> 1 filtro de trigger ({selectedPipelines.map((p) => p.Name).join(', ')})</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-bolt" /> 1 automação de incremento</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-bolt" /> {selectedUsers.length} automação{selectedUsers.length > 1 ? 'ções' : ''} de distribuição (1 por usuário)</PreviewItem>
          </PreviewBox>
        )}

        {/* ── Progress ── */}
        {(phase === 'implementing' || phase === 'done') && (
          <ProgressCard $dm={dm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: dm ? '#c4b5fd' : '#4a2fa0' }}>
                {phase === 'done' ? '✅ Implementação concluída!' : '⚙️ Implementando roleta…'}
              </span>
              <span style={{ fontSize: '0.72rem', color: dm ? '#7a6aaa' : '#9580c8' }}>{pct}%</span>
            </div>
            <ProgressBar $dm={dm}><ProgressFill $pct={pct} /></ProgressBar>
            {logs.length > 0 && (
              <LogList>
                {logs.slice(-12).map((line, i, arr) => (
                  <LogLine key={i} $dm={dm} $ok={line.startsWith('✔') || line.startsWith('✅')}>
                    {line}
                  </LogLine>
                ))}
              </LogList>
            )}
          </ProgressCard>
        )}

        {/* ── Resultado ── */}
        {phase === 'done' && result && (
          <PreviewBox $dm={dm}>
            <PreviewTitle $dm={dm}>Itens criados na conta</PreviewTitle>
            <PreviewItem $dm={dm}><i className="pi pi-user" /> Cliente auxiliar — ID: {result.contactId}</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-list" /> Campo contador no Cliente — Key: {result.counterContactField?.Key}</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-list" /> Campo cliente auxiliar no Negócio — Key: {result.auxClientField?.Key}</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-list" /> Campo contador no Negócio — Key: {result.counterDealField?.Key}</PreviewItem>
            <PreviewItem $dm={dm}><i className="pi pi-bolt" /> {result.usersCount} automação{result.usersCount > 1 ? 'ções' : ''} de distribuição criada{result.usersCount > 1 ? 's' : ''}</PreviewItem>
          </PreviewBox>
        )}

        {/* ── Erro ── */}
        {phase === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '0.9rem 1rem',
            color: '#ef4444',
            fontSize: '0.87rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}>
            <i className="pi pi-times-circle" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <strong>Erro durante a implementação:</strong><br />
              {errorMsg}
            </div>
          </div>
        )}

        {/* ── Botões de ação ── */}
        {phase === 'form' && (
          <ActionsRow>
            <PrimaryBtn onClick={handleImplement} disabled={!canImplement}>
              <i className="pi pi-play" />
              Implementar Roleta
            </PrimaryBtn>
            {(selectedPipelineIds.length > 0 || selectedUserIds.length > 0) && (
              <SecondaryBtn $dm={dm} onClick={() => { setSelectedPipelineIds([]); setSelectedUserIds([]); }}>
                <i className="pi pi-times" /> Limpar seleção
              </SecondaryBtn>
            )}
          </ActionsRow>
        )}

        {(phase === 'done' || phase === 'error') && (
          <ActionsRow>
            <PrimaryBtn onClick={handleReset}>
              <i className="pi pi-refresh" />
              Nova implementação
            </PrimaryBtn>
          </ActionsRow>
        )}

        {phase === 'form' && ukStatus === 'valid' && (
          <HintText $dm={dm}>
            A implementação cria campos, filtros e automações diretamente na conta via API Ploomes. Esta ação não pode ser desfeita automaticamente.
          </HintText>
        )}
      </FormWrapper>
    </>
  );
}
