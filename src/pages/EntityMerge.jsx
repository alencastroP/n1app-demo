// src/pages/EntityMerge.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { Card as PrimeCard } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { SelectButton } from 'primereact/selectbutton';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';
import 'primeicons/primeicons.css';

import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS } from '../config/teamsConfig';
import { validateUserKey } from '../services/apiHubService';
import CredencialCard from '../components/CredencialCard';
import ServiceHeader from '../components/ServiceHeader';
import {
  getEntityFields,
  startMerge,
  getJobStatus,
  cancelJob,
  getActiveJob,
  downloadCsv,
} from '../services/mergeService';

// ─── Constantes ─────────────────────────────────────────────────────────────

const ENTITIES = [
  { label: 'Clientes', value: 'Contacts' },
  { label: 'Negócios', value: 'Deals', disabled: true },
  { label: 'Produtos', value: 'Products', disabled: true },
  { label: 'Grupos', value: 'Groups', disabled: true },
];

const MERGE_MODELS = [
  {
    label: 'Modelo 1 — Campo identificador',
    value: 'model1',
    description:
      'O usuário preenche um campo personalizado nos itens duplicados com o Id do item original. Apenas os registros com esse campo preenchido são mesclados.',
  },
  {
    label: 'Modelo 2 — Item mais antigo',
    value: 'model2',
    description:
      'Detecta duplicados por um campo selecionado (nome, e-mail, CNPJ, CPF). O item com a data de criação mais antiga é considerado o original.',
  },
  {
    label: 'Modelo 3 — Maior histórico',
    value: 'model3',
    description:
      'Detecta duplicados pelo mesmo campo. O item com mais entidades vinculadas (proposta, venda, documento, negócio, tarefa, interação) é considerado o original. Em caso de empate, usa a data de criação.',
  },
];

// Campos nativos permitidos para detecção de duplicidade (Modelos 2 e 3)
const DUPLICATE_FIELD_OPTIONS = [
  { label: 'Nome', value: 'Name' },
  { label: 'E-mail', value: 'Email' },
  { label: 'CNPJ', value: 'CNPJ' },
  { label: 'CPF', value: 'CPF' },
];

const MERGE_MODEL_LABELS = Object.fromEntries(MERGE_MODELS.map((m) => [m.value, m.label]));
const ENTITY_LABELS = Object.fromEntries(ENTITIES.map((e) => [e.value, e.label]));

const POLL_INTERVAL_MS = 2000;

// ─── O que é mesclado / perdido ───────────────────────────────────────────────

const MERGE_INFO = {
  Contacts: {
    merged: [
      'Negócios (como empresa ou como pessoa vinculada)',
      'Contatos vinculados à empresa (passam para a empresa original)',
      'Filiais (CompanyId atualizado para a empresa original)',
      'Tarefas (ContactId atualizado)',
      'Registros de interação (recriados no item original)',
    ],
    lost: [
      'Propostas (Quotes) *',
      'Vendas (Orders) *',
      'Documentos *',
    ],
    lostNote: '* Somente se não estiverem vinculados a um negócio que foi migrado para o item original.',
  },
};

// ─── Styled Components ───────────────────────────────────────────────────────

const Page = styled.div`
  padding: 1rem 1rem 2rem 0rem;
  max-width: 1460px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
`;

const HeaderCard = styled(PrimeCard)`
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 14px !important;
  border: 1px dashed ${({ $darkMode }) => ($darkMode ? '#5b3cc4' : '#a88bff')};
  background: ${({ $darkMode }) => ($darkMode ? '#f0e7ff1a' : '#f5f2ff')};
  color: ${({ $darkMode }) => ($darkMode ? '#eae1ff' : '#2a115f')};
`;

const LayoutRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
`;

const ColumnFlex = styled.div`
  flex: 1;
  min-width: 280px;
`;

const ContentCard = styled.div`
  background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#ffffff')};
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};
  box-shadow: ${({ $dark }) =>
    $dark
      ? '0 4px 16px rgba(0,0,0,0.5)'
      : '0 2px 10px rgba(100, 60, 180, 0.07)'};
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: ${({ $dark }) => ($dark ? '#d6d5da' : '#0a0025')};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${({ $dark }) => ($dark ? '#bbb' : '#555')};
  }
`;

const ModelDescription = styled.p`
  font-size: 0.85rem;
  color: ${({ $dark }) => ($dark ? '#bbb' : '#666')};
  margin: 0 0 1.25rem 0;
  padding: 0.75rem 1rem;
  background: ${({ $dark }) => ($dark ? '#12082a' : '#ece9f8')};
  border-radius: 0.5rem;
  border-left: 3px solid var(--accent, #7c3aed);
`;

const InfoList = styled.ul`
  margin: 0.25rem 0 0 1rem;
  padding: 0;
  font-size: 0.85rem;
`;

const LogBox = styled.div`
  background: ${({ $dark }) => ($dark ? '#0d0520' : '#1e1e2f')};
  color: #a8ffb0;
  border-radius: 0.6rem;
  padding: 0.75rem 1rem;
  font-family: monospace;
  font-size: 0.8rem;
  max-height: 260px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;

  label {
    font-size: 0.9rem;
    cursor: pointer;
    color: ${({ $dark }) => ($dark ? '#ccc' : '#333')};
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusSeverity(status) {
  const map = { running: 'warning', completed: 'success', cancelled: 'secondary', error: 'danger' };
  return map[status] || 'info';
}

function statusLabel(status) {
  const map = { running: 'Executando', completed: 'Concluído', cancelled: 'Cancelado', error: 'Erro' };
  return map[status] || status;
}

// ─── Componente principal ─────────────────────────────────────────────────────

// Gate de permissão fora do componente com hooks (rules-of-hooks).
export default function EntityMerge() {
  const { darkMode } = useDarkMode();
  const { canService } = useUserProfile();

  if (!canService(SERVICE_KEYS.ENTITY_MERGE)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: darkMode ? '#f87171' : '#dc2626' }}>
        <i className="pi pi-lock" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem' }}>Acesso restrito</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return <EntityMergeContent />;
}

function EntityMergeContent() {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  // UK + validação
  const [userKey, setUserKey] = useState('');
  const [accountPreview, setAccountPreview] = useState(null);

  // Configuração
  const [entity, setEntity] = useState(null);
  const [mergeModel, setMergeModel] = useState(null);
  const [withDelete, setWithDelete] = useState(true);
  const [contactTypeFilter, setContactTypeFilter] = useState('all');

  // Campos da entidade (carregados após selecionar entidade + UK validada)
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Modelo 1: campo identificador selecionado
  const [identifierField, setIdentifierField] = useState(null);

  // Modelos 2/3: campo de detecção de duplicidade
  const [duplicateFieldKey, setDuplicateFieldKey] = useState(null);

  // Job state
  const [job, setJob] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pollRef = useRef(null);

  // ── Polling ────────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const data = await getJobStatus(id);
          setJob(data);
          if (data.status !== 'running') stopPolling();
        } catch {
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  // Ao montar, verifica se há job ativo no servidor
  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveJob();
        if (active.active && active.jobId) {
          setJobId(active.jobId);
          const data = await getJobStatus(active.jobId);
          setJob(data);
          if (data.status === 'running') startPolling(active.jobId);
        }
      } catch {
        // ignora — sem job ativo
      }
    })();
    return stopPolling;
  }, [startPolling, stopPolling]);

  // ── Carrega campos ao selecionar entidade ──────────────────────────────────

  useEffect(() => {
    if (!entity || !accountPreview) {
      setFields([]);
      setIdentifierField(null);
      return;
    }

    setLoadingFields(true);
    setIdentifierField(null);

    getEntityFields({ userKey, entity })
      .then(({ fields: f }) => setFields(f ?? []))
      .catch(() => {
        setFields([]);
        toast.current?.show({ severity: 'warn', summary: 'Aviso', detail: 'Não foi possível carregar os campos da entidade.', life: 5000 });
      })
      .finally(() => setLoadingFields(false));
  }, [entity, accountPreview]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validação de UK ────────────────────────────────────────────────────────

  // Valida no service da página e normaliza o retorno para o CredencialCard.
  async function handleValidateUK(uk) {
    const { account } = await validateUserKey(uk);
    if (!account) throw new Error('User-Key válida, porém sem conta retornada.');
    toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'User-Key validada.', life: 3500 });
    return {
      accountId: account.id ?? account.Id ?? null,
      accountName: account.name ?? account.Name ?? null,
      logoUrl: account.logo ?? account.LogoUrl ?? null,
    };
  }

  // Editar a UK invalida também os campos carregados da entidade.
  function handleUkChange(value) {
    setUserKey(value);
    setFields([]);
    setIdentifierField(null);
  }

  function handleAccountChange(acc) {
    setAccountPreview(acc);
    if (!acc) {
      setFields([]);
      setIdentifierField(null);
    }
  }

  // ── Ações ──────────────────────────────────────────────────────────────────

  async function handleStart() {
    setError('');
    if (!userKey.trim()) return setError('Informe a User-Key.');
    if (!accountPreview) return setError('Valide a User-Key antes de iniciar.');
    if (!entity) return setError('Selecione a entidade.');
    if (!mergeModel) return setError('Selecione o modelo de mesclagem.');

    if (mergeModel === 'model1') {
      if (!identifierField) return setError('Selecione o campo identificador.');
    } else {
      if (!duplicateFieldKey) return setError('Selecione o campo de detecção de duplicidade.');
    }

    setLoading(true);
    try {
      const params = {
        userKey: userKey.trim(),
        entity,
        mergeModel,
        withDelete,
        ...(entity === 'Contacts' ? { contactTypeFilter } : {}),
      };

      if (mergeModel === 'model1') {
        params.identifierFieldId = identifierField.Id;
        params.identifierFieldKey = identifierField.Key;
      } else {
        params.duplicateFieldKey = duplicateFieldKey;
      }

      const res = await startMerge(params);
      setJobId(res.jobId);
      const data = await getJobStatus(res.jobId);
      setJob(data);
      startPolling(res.jobId);
    } catch (err) {
      setError(err.message || 'Erro ao iniciar merge.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!jobId) return;
    try {
      await cancelJob(jobId);
      stopPolling();
      const data = await getJobStatus(jobId);
      setJob(data);
    } catch (err) {
      setError(err.message || 'Erro ao cancelar.');
    }
  }

  async function handleDownloadCsv() {
    if (!jobId) return;
    try {
      const url = await downloadCsv(jobId);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merge-${entity}-${jobId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Erro ao baixar CSV.');
    }
  }

  function handleReset() {
    stopPolling();
    setJob(null);
    setJobId(null);
    setError('');
    setEntity(null);
    setMergeModel(null);
    setIdentifierField(null);
    setDuplicateFieldKey(null);
    setWithDelete(true);
    setContactTypeFilter('all');
    setFields([]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isRunning = job?.status === 'running';
  const isCompleted = job?.status === 'completed';
  const progress = job?.progress ?? 0;

  const selectedModelInfo = MERGE_MODELS.find((m) => m.value === mergeModel);

  // Opções de campos para o Dropdown do campo identificador (Modelo 1)
  const fieldOptions = fields.map((f) => ({
    label: `${f.Name}${f.Dynamic ? ' (personalizado)' : ''}`,
    value: f,
  }));

  const mergeInfo = MERGE_INFO[entity];

  return (
    <Page>
      <Toast ref={toast} />
      <Tooltip target=".info-tip" position="top" />

      {/* Cabeçalho + User-Key */}
      <HeaderCard $darkMode={darkMode}>
        <LayoutRow>
          <ColumnFlex>
            <ServiceHeader
              variant="standalone"
              platforms={['ploomes']}
              title="Mesclagem de Entidades"
              subtitle="Unifique registros duplicados de uma conta em um só, escolhendo qual registro prevalece."
            />
            <ul style={{ margin: '0.75rem 0 0 18px', padding: 0, fontSize: '0.88rem' }}>
              <li>Disponível apenas para usuários com perfil <strong>Admin</strong>.</li>
              <li>Informe a User-Key e valide a conta antes de configurar a mesclagem.</li>
              <li>Escolha o modelo, a entidade e os campos de identificação.</li>
              <li>Acompanhe o progresso em tempo real e baixe o relatório ao final.</li>
            </ul>
          </ColumnFlex>

          <ColumnFlex>
            <CredencialCard
              uk={userKey}
              onUkChange={handleUkChange}
              account={accountPreview}
              onAccountChange={handleAccountChange}
              onValidate={handleValidateUK}
              label="User-Key"
              placeholder="Cole a User-Key da conta"
            />
          </ColumnFlex>
        </LayoutRow>
      </HeaderCard>

      {/* Configuração */}
      {!job && (
        <ContentCard $dark={darkMode}>
          <CardTitle $dark={darkMode}>
            <i className="pi pi-cog" />
            Configuração
          </CardTitle>

          <FormGrid>
            {/* Entidade */}
            <Field $dark={darkMode}>
              <label>Entidade</label>
              <Dropdown
                value={entity}
                options={ENTITIES}
                onChange={(e) => {
                  setEntity(e.value);
                  setIdentifierField(null);
                  setDuplicateFieldKey(null);
                }}
                placeholder="Selecione a entidade"
                style={{ width: '100%' }}
                disabled={!accountPreview}
              />
            </Field>

            {/* Modelo de mesclagem */}
            <Field $dark={darkMode}>
              <label>Modelo de mesclagem</label>
              <Dropdown
                value={mergeModel}
                options={MERGE_MODELS}
                onChange={(e) => {
                  setMergeModel(e.value);
                  setIdentifierField(null);
                  setDuplicateFieldKey(null);
                }}
                placeholder="Selecione o modelo"
                style={{ width: '100%' }}
                disabled={!entity}
              />
            </Field>
          </FormGrid>

          {/* Filtro de tipo de cliente (apenas Contacts) */}
          {entity === 'Contacts' && (
            <Field $dark={darkMode} style={{ marginBottom: '1.25rem', maxWidth: 400 }}>
              <label>
                Tipo de cliente{' '}
                <i
                  className="pi pi-info-circle info-tip"
                  data-pr-tooltip="Filtra quais tipos de contato serão incluídos na mesclagem. TypeId 1 = Empresa, TypeId 2 = Pessoa."
                />
              </label>
              <SelectButton
                value={contactTypeFilter}
                onChange={(e) => e.value && setContactTypeFilter(e.value)}
                options={[
                  { label: 'Ambos', value: 'all' },
                  { label: 'Apenas empresas', value: 'company' },
                  { label: 'Apenas pessoas', value: 'person' },
                ]}
                style={{ marginTop: 4 }}
              />
            </Field>
          )}

          {/* Descrição do modelo selecionado */}
          {selectedModelInfo && (
            <ModelDescription $dark={darkMode}>{selectedModelInfo.description}</ModelDescription>
          )}

          {/* Campo identificador (Modelo 1) */}
          {mergeModel === 'model1' && entity && (
            <Field $dark={darkMode} style={{ marginBottom: '1.25rem', maxWidth: 480 }}>
              <label>
                Campo identificador{' '}
                <i
                  className="pi pi-info-circle info-tip"
                  data-pr-tooltip="Campo personalizado preenchido com o Id do item original. Somente itens com esse campo preenchido serão mesclados."
                />
              </label>
              <Dropdown
                value={identifierField}
                options={fieldOptions}
                onChange={(e) => setIdentifierField(e.value)}
                placeholder={loadingFields ? 'Carregando campos...' : 'Selecione o campo'}
                style={{ width: '100%' }}
                disabled={loadingFields || fields.length === 0}
                filter
              />
            </Field>
          )}

          {/* Campo de detecção de duplicidade (Modelos 2 e 3) */}
          {(mergeModel === 'model2' || mergeModel === 'model3') && entity && (
            <Field $dark={darkMode} style={{ marginBottom: '1.25rem', maxWidth: 360 }}>
              <label>
                Campo de detecção de duplicidade{' '}
                <i
                  className="pi pi-info-circle info-tip"
                  data-pr-tooltip="Itens com o mesmo valor nesse campo serão considerados duplicados."
                />
              </label>
              <Dropdown
                value={duplicateFieldKey}
                options={DUPLICATE_FIELD_OPTIONS}
                onChange={(e) => setDuplicateFieldKey(e.value)}
                placeholder="Selecione o campo"
                style={{ width: '100%' }}
              />
            </Field>
          )}

          {/* O que será mesclado / perdido */}
          {mergeInfo && mergeModel && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: darkMode ? '#7eff91' : '#16a34a', marginBottom: 4 }}>
                  ✓ Será mesclado
                </div>
                <InfoList>
                  {mergeInfo.merged.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </InfoList>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: darkMode ? '#ff9090' : '#dc2626', marginBottom: 4 }}>
                  ✗ Será perdido (não migrado)
                </div>
                <InfoList>
                  {mergeInfo.lost.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </InfoList>
                {mergeInfo.lostNote && (
                  <div style={{ fontSize: '0.78rem', color: darkMode ? '#ffb96e' : '#92400e', marginTop: 6, maxWidth: 260 }}>
                    {mergeInfo.lostNote}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checkbox de deleção */}
          {mergeModel && (
            <CheckboxRow $dark={darkMode}>
              <Checkbox
                inputId="withDelete"
                checked={withDelete}
                onChange={(e) => setWithDelete(e.checked)}
              />
              <label htmlFor="withDelete">
                Deletar os itens duplicados após a mesclagem{' '}
                <i
                  className="pi pi-info-circle info-tip"
                  data-pr-tooltip="Se desmarcado, os vínculos serão transferidos mas os duplicados não serão excluídos."
                />
              </label>
            </CheckboxRow>
          )}

          {error && (
            <Message severity="error" text={error} style={{ marginBottom: '1rem', width: '100%' }} />
          )}

          <Button
            label="Iniciar Mesclagem"
            icon="pi pi-play"
            onClick={handleStart}
            loading={loading}
            disabled={loading || !accountPreview}
          />
        </ContentCard>
      )}

      {/* Progresso */}
      {job && (
        <ContentCard $dark={darkMode}>
          <CardTitle $dark={darkMode}>
            <i className="pi pi-spinner pi-spin" style={{ display: isRunning ? 'inline' : 'none' }} />
            <i className="pi pi-chart-line" style={{ display: isRunning ? 'none' : 'inline' }} />
            Progresso do Job
          </CardTitle>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Tag severity={statusSeverity(job.status)} value={statusLabel(job.status)} />
            <span style={{ fontSize: '0.85rem', color: darkMode ? '#bbb' : '#555' }}>
              Entidade: <strong>{ENTITY_LABELS[job.entity] ?? job.entity}</strong>&nbsp;|&nbsp;
              Modelo: <strong>{MERGE_MODEL_LABELS[job.mergeModel] ?? job.mergeModel}</strong>&nbsp;|&nbsp;
              Deleção: <strong>{job.withDelete ? 'Sim' : 'Não'}</strong>
            </span>
            <span style={{ fontSize: '0.85rem', color: darkMode ? '#bbb' : '#555' }}>
              Pares: <strong>{job.processed}/{job.total}</strong>&nbsp;|&nbsp;
              Sucesso: <strong style={{ color: '#22c55e' }}>{job.success}</strong>&nbsp;|&nbsp;
              Falhas: <strong style={{ color: '#ef4444' }}>{job.failed}</strong>
            </span>
          </div>

          <ProgressBar value={progress} style={{ marginBottom: '1rem', height: '1.2rem' }} />

          {job.logs && job.logs.length > 0 && (
            <LogBox $dark={darkMode}>{job.logs.join('\n')}</LogBox>
          )}

          {error && (
            <Message severity="error" text={error} style={{ marginTop: '1rem', width: '100%' }} />
          )}

          <ActionRow>
            {isRunning && (
              <Button
                label="Cancelar"
                icon="pi pi-times"
                severity="danger"
                outlined
                onClick={handleCancel}
              />
            )}
            {isCompleted && (
              <Button
                label="Baixar CSV"
                icon="pi pi-download"
                severity="success"
                onClick={handleDownloadCsv}
              />
            )}
            {!isRunning && (
              <Button
                label="Novo merge"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                onClick={handleReset}
              />
            )}
          </ActionRow>
        </ContentCard>
      )}
    </Page>
  );
}
