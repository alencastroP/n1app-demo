// src/pages/FieldExplorer.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';
import { Paginator } from 'primereact/paginator';
import { Dialog } from 'primereact/dialog';

import { useDarkMode } from '../DarkModeContext';
import { validateUserKey } from '../services/apiHubService';
import { fetchFieldsByEntity } from '../services/fieldsExplorerService';
import CredencialCard from '../components/CredencialCard';
import ServiceHeader from '../components/ServiceHeader';

// ---------- Estilo base ----------

const Page = styled.div`
  padding: 1rem 1rem 2rem 0rem;
  max-width: 1460px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
`;

const HeaderCard = styled(Card)`
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 14px !important;
  border: 1px dashed ${({ $darkMode }) => ($darkMode ? '#5b3cc4' : '#a88bff')};
  background: ${({ $darkMode }) => ($darkMode ? '#f0e7ff1a' : '#f5f2ff')};
  color: ${({ $darkMode }) => ($darkMode ? '#eae1ff' : '#2a115f')};
`;

const BodyCard = styled(Card)`
  width: 100%;
  border-radius: 14px !important;
  background: ${({ $darkMode }) => ($darkMode ? '#14012b' : '#ffffff')};
  border: 1px solid ${({ $darkMode }) => ($darkMode ? '#2a1f3d' : '#ececec')};
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: ${({ $darkMode }) => ($darkMode ? '#efeaff' : '#2a115f')};
`;

const Subtle = styled.small`
  opacity: 0.85;
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

const FieldLabel = styled.label`
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
`;

/* Botões principais – mesma altura, sem borda arredondada */
const StyledButton = styled(Button)`
  background-color: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
  height: 42px;
  font-size: 0.9rem;
  transition: background-color 0.2s ease, border-color 0.2s ease, filter 0.2s ease;

  &:hover:not(:disabled) {
    filter: brightness(0.93);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Botões do modal – primário (roxo) e secundário (neutro)
const ModalPrimaryButton = styled(Button)`
  background-color: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
  height: 38px;
  font-size: 0.9rem;
  padding: 0 1rem;
  transition: background-color 0.2s ease, border-color 0.2s ease, filter 0.2s ease;

  &:hover:not(:disabled) {
    filter: brightness(0.93);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalSecondaryButton = styled(Button)`
  background-color: ${({ $darkMode }) => ($darkMode ? 'transparent' : '#f3f4f6')};
  border-color: ${({ $darkMode }) => ($darkMode ? '#564b63ff' : '#d1d5db')};
  color: ${({ $darkMode }) => ($darkMode ? '#e5e7eb' : '#374151')};
  height: 38px;
  font-size: 0.9rem;
  padding: 0 1rem;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ $darkMode }) =>
      $darkMode ? '#1f2937' : '#e5e7eb'};
    border-color: ${({ $darkMode }) => ($darkMode ? '#6b7280' : '#9ca3af')};
    color: ${({ $darkMode }) => ($darkMode ? '#f9fafb' : '#111827')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalActions = styled.div`
  margin-top: 1.25rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

// Tabela estilizada
const TableWrapper = styled.div`
  margin-top: 1rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  .p-datatable {
    width: 100%;
  }

  .p-datatable-wrapper {
    overflow-x: auto;
    max-width: 100%;
  }

  .p-datatable-table {
    width: 100%;
    table-layout: fixed;
  }

  .p-datatable-header {
    background-color: ${({ $darkMode }) => ($darkMode ? '#2b1f49' : '#f5f2ff')};
    border-radius: 10px 10px 0 0;
    padding: 0.5rem 0.75rem;
  }

  .p-datatable-tbody > tr {
    transition: background-color 0.15s ease;
  }

  .p-datatable-tbody > tr:hover {
    background-color: ${({ $darkMode }) =>
      $darkMode ? 'rgba(168, 85, 247, 0.16)' : 'rgba(139, 92, 246, 0.08)'};
  }
`;

// Célula de Nome
const NameCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const NameTitle = styled.span`
  font-weight: 600;
`;

const NameSubtitle = styled.span`
  font-size: 0.75rem;
  opacity: 0.75;
`;

// Célula de Key
const KeyCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const KeyCode = styled.code`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.8rem;
  padding: 0.18rem 0.3rem;
  border-radius: 4px;
  background-color: ${({ $darkMode }) => ($darkMode ? '#111827' : '#f3f4f6')};
  color: ${({ $darkMode }) => ($darkMode ? '#e5e7eb' : '#111827')};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyButton = styled(Button)`
  && {
    width: 2rem;
    height: 2rem;
  }
`;

// Badge de origem
const OriginPillSpan = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${({ $dynamic }) => ($dynamic ? 'var(--accent-soft)' : 'transparent')};
  color: ${({ $dynamic, $darkMode }) =>
    $dynamic ? 'var(--accent)' : $darkMode ? '#e5e7eb' : '#4b5563'};
  border: 1px solid var(--accent);
`;

// Célula de tipo
const TypeCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
`;

const TypeIconBubble = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
  font-size: 0.9rem;
`;

// ---------- Modal de detalhes ----------

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const FieldIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $darkMode }) => ($darkMode ? '#241742' : '#ede9ff')};
  color: ${({ $darkMode }) => ($darkMode ? '#f5f3ff' : '#4c1d95')};
  flex-shrink: 0;
`;

const DetailTitle = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  color: ${({ $darkMode }) => ($darkMode ? '#f5f3ff' : '#1b103a')};
`;

const DetailKey = styled.code`
  font-size: 0.85rem;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
  background-color: ${({ $darkMode }) => ($darkMode ? '#241742' : '#f3f4ff')};
  color: ${({ $darkMode }) => ($darkMode ? '#e5deff' : '#433480')};
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
`;

const HeaderTag = styled.span`
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${({ $variant, $darkMode }) => {
    if ($variant === 'accent') {
      return $darkMode ? '#2b1f49' : '#ede9ff';
    }
    return $darkMode ? '#111827' : '#f3f4f6';
  }};
  color: ${({ $variant, $darkMode }) => {
    if ($variant === 'accent') {
      return $darkMode ? '#ede9ff' : '#4c1d95';
    }
    return $darkMode ? '#e5e7eb' : '#111827';
  }};
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.75rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  padding: 0.55rem 0.7rem;
  border-radius: 0.6rem;
  background-color: ${({ $darkMode }) => ($darkMode ? '#1b0f33' : '#f8fafc')};
  border: 1px solid ${({ $darkMode }) => ($darkMode ? '#261b47' : '#e5e7eb')};
`;

const DetailLabel = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.7;
  margin-bottom: 0.2rem;
`;

const DetailValue = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
`;

const StyledDropdown = styled(Dropdown)`
  &.p-dropdown {
    ${({ $darkMode }) => {
      const bg = $darkMode ? '#201335' : '#ffffff';
      const border = $darkMode ? '#2A2A3D' : '#ced4da';

      return `
        background: ${bg};
        border: 1px solid ${border};
        border-radius: 0;
        height: 42px;
        display: flex;
        align-items: center;
      `;
    }}
  }

  .p-dropdown-label {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 10px;
    font-size: 0.9rem;
  }

  .p-dropdown-trigger {
    background: transparent !important;
    border-left: none !important;
    width: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .p-dropdown-trigger-icon {
    color: ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')};
  }

  &.p-dropdown.p-focus {
    border-color: ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')};
    box-shadow: 0 0 0 1px
      ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')}55;
  }
`;

const StyledInput = styled(InputText)`
  background: var(--surface);
  border: 1px solid var(--border-accent);
  color: var(--text-color);
  border-radius: 0px;
  height: 42px;
  padding-left: 10px;
  font-size: 0.9rem;

  &:focus {
    border-color: var(--border-accent);
    box-shadow: none;
  }
`;

// ---------- Opções de entidade ----------

// EntityIds validados no mapa do Changelog (mesma API de Fields/Logs do Ploomes).
// Exibida em ordem alfabética (label). Ficam de fora entidades sem campos pesquisáveis
// nesta tela (ex.: Opções pré-cadastradas, Automações).
const entityOptions = [
  { label: 'Cidades', value: 25 },
  { label: 'Clientes', value: 1 },
  { label: 'Documentos (CPQ)', value: 66 },
  { label: 'Estágios (Deals@Stages)', value: 31 },
  { label: 'Funis (Deals@Pipelines)', value: 44 },
  { label: 'Grupos de produtos', value: 11 },
  { label: 'Negócios', value: 2 },
  { label: 'Produto da Proposta', value: 14},
  { label: 'Produto da Venda', value: 20},
  { label: 'Produto de cliente', value: 75 },
  { label: 'Produtos', value: 10 },
  { label: 'Propostas (CPQ)', value: 7 },
  { label: 'Registros de interação', value: 36 },
  { label: 'Sua Empresa', value: 15},
  { label: 'Tarefas', value: 12 },
  { label: 'Usuários', value: 24 },
  { label: 'Vendas (CPQ)', value: 4 },
];

// ---------- Tipos de campo ----------

const FIELD_TYPE_LABELS = {
  1: 'Texto simples',
  2: 'Texto multilinha',
  4: 'Número inteiro',
  5: 'Moeda',
  6: 'Número com casas decimais ilimitadas',
  7: 'Opções pré-cadastradas',
  8: 'Data',
  9: 'Horário',
  10: 'Checkbox',
  11: 'CPF',
  12: 'CNPJ',
  13: 'Porcentagem',
  17: 'Endereço',
  18: 'Imagem',
  19: 'Anexo',
  20: 'Cor',
  21: 'Assinatura DocuSign',
  22: 'Desenvolvedor',
  24: 'Assinatura D4Sign',
};

const FIELD_TYPE_ICONS = {
  1: 'pi pi-align-left',
  2: 'pi pi-align-justify',
  4: 'pi pi-sort-numeric-down',
  5: 'pi pi-dollar',
  6: 'pi pi-sort-numeric-up-alt',
  7: 'pi pi-list',
  8: 'pi pi-calendar',
  9: 'pi pi-clock',
  10: 'pi pi-check-square',
  11: 'pi pi-id-card',
  12: 'pi pi-id-card',
  13: 'pi pi-percentage',
  17: 'pi pi-map-marker',
  18: 'pi pi-images',
  19: 'pi pi-paperclip',
  20: 'pi pi-palette',
  21: 'pi pi-pencil',
  22: 'pi pi-code',
  24: 'pi pi-shield',
};

function mapTypeIdToLabel(typeId) {
  if (typeId == null) return '—';
  return FIELD_TYPE_LABELS[typeId] || `Tipo ${typeId}`;
}

function getTypeIcon(typeId) {
  return FIELD_TYPE_ICONS[typeId] || 'pi pi-tag';
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function FieldExplorer() {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  const [userKey, setUserKey] = useState('');
  const [accountPreview, setAccountPreview] = useState(null);

  const [selectedEntity, setSelectedEntity] = useState(null);

  const [loadingFields, setLoadingFields] = useState(false);
  const [fields, setFields] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(50);

  const [globalFilter, setGlobalFilter] = useState('');

  const [selectedField, setSelectedField] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // estados para utilização do campo
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageResults, setUsageResults] = useState([]);

  useEffect(() => {
    Tooltip && Tooltip.init && Tooltip.init();
  }, []);

  const canSearch = useMemo(
    () => !!userKey?.trim() && !!selectedEntity,
    [userKey, selectedEntity]
  );

  const selectedEntityLabel = useMemo(
    () => entityOptions.find((o) => o.value === selectedEntity)?.label || '',
    [selectedEntity]
  );

  function showSuccess(msg) {
    toast.current?.show({
      severity: 'success',
      summary: 'Sucesso',
      detail: msg,
      life: 3500,
    });
  }

  function showError(msg) {
    toast.current?.show({
      severity: 'error',
      summary: 'Erro',
      detail: msg,
      life: 6000,
    });
  }

  // Validador usado pelo CredencialCard — normaliza o shape da conta.
  async function handleValidateUK(uk) {
    const { account } = await validateUserKey(uk);
    if (!account) throw new Error('User-Key válida, porém sem conta retornada.');
    showSuccess('User-Key validada com sucesso.');
    return {
      accountId: account.id ?? account.Id ?? null,
      accountName: account.name ?? account.Name ?? null,
      logoUrl: account.logo ?? account.LogoUrl ?? null,
    };
  }

  async function loadFields() {
    if (!canSearch) {
      showError('Informe a User-Key e selecione uma entidade.');
      return;
    }
    try {
      setLoadingFields(true);
      const response = await fetchFieldsByEntity({
        userKey,
        entityId: selectedEntity,
      });

      const data = response?.data || [];
      setFields(data);
      setTotal(response?.total ?? data.length ?? 0);
      setPage(0);
      if (!data.length) {
        showSuccess('Nenhum campo encontrado para esta entidade.');
      }
    } catch (e) {
      showError(e?.message || 'Erro ao buscar campos.');
    } finally {
      setLoadingFields(false);
    }
  }

  function onSearchClick() {
    setGlobalFilter('');
    loadFields();
  }

  function onPageChange(e) {
    setPage(e.page);
    setRows(e.rows);
  }

  const filteredFields = useMemo(() => {
    const q = (globalFilter || '').trim().toLowerCase();
    if (!q) return fields;
    return fields.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.key?.toLowerCase().includes(q)
    );
  }, [fields, globalFilter]);

  const pagedFields = useMemo(() => {
    const start = page * rows;
    const end = start + rows;
    return filteredFields.slice(start, end);
  }, [filteredFields, page, rows]);

  const hasFields = fields.length > 0;
  const hasFilter = !!globalFilter.trim();

  const emptyMessage = !canSearch
    ? 'Informe a User-Key e selecione uma entidade.'
    : !hasFields
    ? 'Nenhum campo carregado. Clique em "Buscar campos".'
    : hasFilter
    ? 'Nenhum campo encontrado com este filtro.'
    : 'Nenhum campo encontrado.';

  // --------- Templates ----------

  const nameBodyTemplate = (row) => (
    <NameCell>
      <NameTitle>{row.name || 'Campo sem nome'}</NameTitle>
      <NameSubtitle>
        {row.id ? `Id: ${row.id}` : 'Sem Id de campo'}
      </NameSubtitle>
    </NameCell>
  );

  const keyBodyTemplate = (row) => (
    <KeyCell>
      <KeyCode $darkMode={darkMode}>{row.key || '—'}</KeyCode>
      {row.key && (
        <CopyButton
          type="button"
          icon="pi pi-copy"
          className="p-button-text p-button-rounded p-button-sm"
          onClick={() => {
            try {
              navigator.clipboard?.writeText(row.key);
              showSuccess('Chave copiada para a área de transferência.');
            } catch {
              showError('Não foi possível copiar a chave.');
            }
          }}
          tooltip="Copiar key"
          tooltipOptions={{ position: 'top' }}
        />
      )}
    </KeyCell>
  );

  const typeBodyTemplate = (row) => (
    <TypeCell>
      <TypeIconBubble>
        <i className={getTypeIcon(row.typeId)} />
      </TypeIconBubble>
      <span>{mapTypeIdToLabel(row.typeId)}</span>
    </TypeCell>
  );

  const originBodyTemplate = (row) => (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <OriginPillSpan $dynamic={row.dynamic} $darkMode={darkMode}>
        {row.dynamic ? 'Dinâmico' : 'Nativo'}
      </OriginPillSpan>
    </div>
  );

  function handleFieldDetails(field) {
    setSelectedField(field);
    setUsageResults([]);
    setUsageLoading(false);
    setDetailVisible(true);
  }

  const actionsBodyTemplate = (row) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Button
        type="button"
        icon="pi pi-info-circle"
        className="p-button-text p-button-rounded p-button-sm"
        onClick={() => handleFieldDetails(row)}
        tooltip="Detalhes do campo"
        tooltipOptions={{ position: 'top' }}
      />
    </div>
  );

  // ---------- Consulta de utilização do campo ----------
  // Mantém todas as seções existentes e adiciona:
  // - "Formulários que utilizam o campo" (Id + Nome do Form)
  // - "Funis (Pipelines) vinculados aos formulários" (PipelineId + PipelineName + FormId + FormName)

  async function handleFetchUsage() {
    if (!selectedField?.key) {
      showError('Campo sem chave interna.');
      return;
    }
    if (!userKey?.trim()) {
      showError('Informe a User-Key para consultar a utilização.');
      return;
    }

    setUsageLoading(true);
    setUsageResults([]);

    const fk = selectedField.key;

    const headers = {
      'User-Key': userKey,
      'Content-Type': 'application/json',
    };

    const endpoints = [
      {
        label: 'Campos',
        buildUrl: () =>
          `https://api2.ploomes.com/Fields?$filter=${encodeURIComponent(
            `Key eq '${fk}'`
          )}`,
      },
      {
        label: 'Campos — Fórmulas',
        buildUrl: () =>
          `https://api2.ploomes.com/Fields?$filter=${encodeURIComponent(
            `FormulaVariables/any(o:o/VariableFieldKey eq '${fk}')`
          )}&$select=Name,Key,EntityId&$top=300`,
      },
      {
        label: 'Campos — Campos derivados',
        buildUrl: () =>
          `https://api2.ploomes.com/Fields?$filter=${encodeURIComponent(
            `OriginFieldKey eq '${fk}'`
          )}&$select=Name,Key,EntityId&$top=300`,
      },
      {
        label: 'Automações — Ações',
        buildUrl: () =>
          `https://api2.ploomes.com/Automations?$filter=${encodeURIComponent(
            `Actions/any(Action:Action/FieldKey eq '${fk}')`
          )}&$select=Name,EntityId`,
      },
      {
        label: 'Automações — Filtros',
        buildUrl: () =>
          `https://api2.ploomes.com/Automations?$filter=${encodeURIComponent(
            `contains(TriggerFilter/Url,'${fk}') and Enabled eq true`
          )}&$select=Name,EntityId`,
      },
      {
        label: 'Checklists — Campos',
        buildUrl: () =>
          `https://api2.ploomes.com/Checklists?$filter=${encodeURIComponent(
            `Fields/any(f:f/FieldKey eq '${fk}')`
          )}&$select=Name&$expand=DealStage($select=Name,PipelineId)`,
      },
      {
        label: 'Checklists — Filtros',
        buildUrl: () =>
          `https://api2.ploomes.com/Checklists?$filter=${encodeURIComponent(
            `contains(DealFilter/Url,'${fk}')`
          )}&$select=Name&$expand=DealStage($select=Name,PipelineId)`,
      },
      {
        label: 'Templates de Documento',
        buildUrl: () =>
          `https://api2.ploomes.com/DocumentTemplates?$expand=Pages($filter=${encodeURIComponent(
            `contains(BodySourceCode,'${fk}')`
          )})&$filter=${encodeURIComponent(
            `Pages/any(p: contains(p/BodySourceCode,'${fk}'))`
          )}`,
      },
      // Formulários e Funis só existem para Negócios (entityId 2)
      ...(selectedField?.entityId === 2
        ? [
            {
              label: 'Formulários que utilizam o campo',
              id: 'formsByField',
              buildUrl: () =>
                `https://api2.ploomes.com/Forms?$filter=${encodeURIComponent(
                  `Fields/any(o: o/FieldKey eq '${fk}')`
                )}&$select=Id,Name`,
            },
          ]
        : []),
    ];

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const REQUEST_DELAY_MS = 350;
    const TIMEOUT_MS = 15000;

    // Faz um fetch com timeout e retries para 429 e timeout
    async function fetchWithRetry(url, opts) {
      const doFetch = async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          return await fetch(url, { ...opts, signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
      };

      let res;
      try {
        res = await doFetch();
      } catch (e) {
        // Timeout na primeira tentativa → tenta mais uma vez imediatamente
        if (e.name === 'AbortError') {
          try {
            res = await doFetch();
          } catch (e2) {
            if (e2.name === 'AbortError') {
              const err = new Error('Tempo limite excedido ao buscar esta categoria.');
              err.isTimeout = true;
              throw err;
            }
            throw e2;
          }
        } else {
          throw e;
        }
      }

      // 429 Too Many Requests → aguarda 1 minuto e tenta uma vez
      if (res.status === 429) {
        await delay(60000);
        try {
          res = await doFetch();
        } catch (e) {
          if (e.name === 'AbortError') {
            const err = new Error('Tempo limite excedido ao buscar esta categoria.');
            err.isTimeout = true;
            throw err;
          }
          throw e;
        }
        if (res.status === 429) {
          const err = new Error('Limite de requisições atingido. Tente novamente mais tarde.');
          err.isTooManyRequests = true;
          throw err;
        }
      }

      return res;
    }

    const results = [];
    let formsFound = [];

    // 1) Executa todos os endpoints "simples" (incluindo Forms, se entidade = Negócios)
    for (const ep of endpoints) {
      const url = ep.buildUrl();

      try {
        const res = await fetchWithRetry(url, { headers });
        await delay(REQUEST_DELAY_MS);

        if (!res.ok) {
          results.push({
            section: ep.label,
            error: true,
            errorMessage: `Erro na requisição (HTTP ${res.status}).`,
          });
          continue;
        }

        const json = await res.json();
        const data = json?.value ?? json ?? [];

        if (Array.isArray(data) && data.length) {
          results.push({ section: ep.label, entries: data });

          if (ep.id === 'formsByField') {
            formsFound = data;
          }
        }
      } catch (e) {
        console.error(`[FieldExplorer] ${ep.label}:`, e);
        results.push({
          section: ep.label,
          error: true,
          errorMessage: e.message || 'Erro ao consultar esta categoria.',
        });
      }
    }

    // 2) Se achou formulários, buscar os funis (pipelines) de cada formId
    if (formsFound.length) {
      const pipelinesEntries = [];
      let pipelinesError = null;

      for (const form of formsFound) {
        const formId = form.Id ?? form.id;
        const formName = form.Name ?? form.name ?? '(Formulário sem nome)';

        if (!formId) continue;

        const pipelineUrl = `https://api2.ploomes.com/Deals@Pipelines?$filter=${encodeURIComponent(
          `FormId eq ${formId}`
        )}`;

        try {
          const res = await fetchWithRetry(pipelineUrl, { headers });
          await delay(REQUEST_DELAY_MS);

          if (!res.ok) {
            pipelinesError = `Erro na requisição (HTTP ${res.status}).`;
            continue;
          }

          const json = await res.json();
          const data = json?.value ?? json ?? [];

          if (Array.isArray(data) && data.length) {
            data.forEach((p) => {
              pipelinesEntries.push({
                PipelineId: p.Id ?? p.id ?? null,
                PipelineName: p.Name ?? p.name ?? '(Funil sem nome)',
                FormId: p.FormId ?? formId,
                FormName: formName,
              });
            });
          }
        } catch (e) {
          console.error('[FieldExplorer] Pipelines:', e);
          pipelinesError = e.message || 'Erro ao consultar funis.';
        }
      }

      if (pipelinesEntries.length) {
        results.push({
          section: 'Funis (Pipelines) vinculados aos formulários',
          entries: pipelinesEntries,
        });
      } else if (pipelinesError) {
        results.push({
          section: 'Funis (Pipelines) vinculados aos formulários',
          error: true,
          errorMessage: pipelinesError,
        });
      }
    }

    const hasAnyResult = results.some((r) => !r.error);
    if (!hasAnyResult && results.length === 0) {
      showSuccess('Nenhuma utilização encontrada para este campo.');
    }

    setUsageResults(results);
    setUsageLoading(false);
  }

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
              title="Explorador de Campos"
              subtitle="Explore os campos de uma conta Ploomes e descubra onde cada um é utilizado."
            />
            <p style={{ margin: '0.75rem 0 0 0' }}>
              Uma visão consolidada dos campos das principais entidades da conta.
              Use este serviço como base para{' '}
              <strong>CPQ, automações, formulários e análises avançadas</strong>.
            </p>
            <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
              <li>Informe a mesma User-Key utilizada nos demais services.</li>
              <li>
                Selecione uma entidade e clique em <strong>Buscar campos</strong>.
              </li>
              <li>
                Use o <strong>Filtro rápido</strong> para encontrar um campo pelo
                nome ou pela chave interna.
              </li>
            </ul>
          </ColumnFlex>

          <ColumnFlex>
            {/* Seção de credencial unificada */}
            <CredencialCard
              uk={userKey}
              onUkChange={setUserKey}
              account={accountPreview}
              onAccountChange={setAccountPreview}
              onValidate={handleValidateUK}
              label="User-Key"
              placeholder="Cole a User-Key da conta"
            />
          </ColumnFlex>
        </LayoutRow>
      </HeaderCard>

      {/* Card principal */}
      <BodyCard $darkMode={darkMode}>
        <SectionTitle $darkMode={darkMode}>Campos por entidade</SectionTitle>
        <Subtle>
          Selecione a entidade desejada e liste todos os campos cadastrados
          (nativos e dinâmicos). Clique em um campo para ver{' '}
          <strong>onde ele é utilizado</strong> (automações, templates, formulários,
          funis etc.).
        </Subtle>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 16,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ minWidth: 260, flex: 1 }}>
            <FieldLabel>Entidade</FieldLabel>
            <StyledDropdown
              $darkMode={darkMode}
              value={selectedEntity}
              options={entityOptions}
              onChange={(e) => {
                setSelectedEntity(e.value);
                setFields([]);
                setTotal(0);
                setPage(0);
              }}
              placeholder="Selecione uma entidade"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <StyledButton
              type="button"
              icon="pi pi-search"
              label="Buscar campos"
              onClick={onSearchClick}
              disabled={!canSearch || loadingFields}
            />
          </div>

          <div style={{ minWidth: 220, flex: 1 }}>
            <FieldLabel>Filtro rápido</FieldLabel>
            <StyledInput
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPage(0);
              }}
              placeholder="Filtrar por nome ou chave"
              disabled={!fields.length}
              className="p-inputtext-sm"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <TableWrapper $darkMode={darkMode}>
          <DataTable
            value={pagedFields}
            loading={loadingFields}
            paginator={false}
            scrollable
            scrollHeight="460px"
            emptyMessage={emptyMessage}
            stripedRows
            size="small"
            style={{ width: '100%' }}
          >
            <Column
              field="name"
              header="Nome"
              body={nameBodyTemplate}
              sortable
              style={{ minWidth: '200px' }}
            />

            <Column
              field="key"
              header="Key"
              body={keyBodyTemplate}
              style={{ minWidth: '260px', width: '32%' }}
            />

            <Column
              header="Tipo"
              body={typeBodyTemplate}
              style={{ minWidth: '150px' }}
              headerStyle={{ textAlign: 'center' }}
              bodyStyle={{ textAlign: 'center' }}
            />

            <Column
              header="Origem"
              body={originBodyTemplate}
              style={{ minWidth: '130px' }}
              headerStyle={{ textAlign: 'center' }}
              bodyStyle={{ textAlign: 'center' }}
            />

            <Column
              header="Ações"
              body={actionsBodyTemplate}
              style={{ width: '80px', maxWidth: '80px' }}
              headerStyle={{ textAlign: 'center' }}
              bodyStyle={{ textAlign: 'center' }}
            />
          </DataTable>

          {fields.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Paginator
                first={page * rows}
                rows={rows}
                totalRecords={filteredFields.length}
                onPageChange={onPageChange}
                rowsPerPageOptions={[25, 50, 100, 200]}
              />
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <Subtle>
                  Exibindo {pagedFields.length} de {filteredFields.length} campos
                  {filteredFields.length !== total && total > 0
                    ? ` (total na conta: ${total})`
                    : ''}
                </Subtle>
              </div>
            </div>
          )}
        </TableWrapper>
      </BodyCard>

      {/* Modal de detalhes */}
      <Dialog
        header="Detalhes do campo"
        visible={detailVisible}
        style={{ width: '1000px', maxWidth: '95vw' }}
        modal
        blockScroll
        draggable={false}
        onHide={() => {
          setDetailVisible(false);
          setUsageResults([]);
          setUsageLoading(false);
        }}
      >
        {!!selectedField && (
          <>
            <DetailHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FieldIconWrapper $darkMode={darkMode}>
                  <i className="pi pi-hashtag" />
                </FieldIconWrapper>
                <div>
                  <DetailTitle $darkMode={darkMode}>
                    {selectedField.name || 'Campo sem nome'}
                  </DetailTitle>
                  <DetailKey $darkMode={darkMode}>
                    {selectedField.key || '—'}
                  </DetailKey>
                </div>
              </div>

              <HeaderMeta>
                {selectedEntityLabel && (
                  <HeaderTag $darkMode={darkMode}>
                    {selectedEntityLabel}
                  </HeaderTag>
                )}
                {selectedField.dynamic != null && (
                  <HeaderTag
                    $darkMode={darkMode}
                    $variant="accent"
                  >
                    {selectedField.dynamic ? 'Dinâmico' : 'Nativo'}
                  </HeaderTag>
                )}
              </HeaderMeta>
            </DetailHeader>

            <DetailGrid>
              <DetailItem $darkMode={darkMode}>
                <DetailLabel>Id do campo</DetailLabel>
                <DetailValue>{selectedField.id ?? '—'}</DetailValue>
              </DetailItem>

              <DetailItem $darkMode={darkMode}>
                <DetailLabel>Tipo de campo</DetailLabel>
                <DetailValue style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TypeIconBubble>
                    <i className={getTypeIcon(selectedField.typeId)} />
                  </TypeIconBubble>
                  {mapTypeIdToLabel(selectedField.typeId)}
                </DetailValue>
              </DetailItem>

              <DetailItem $darkMode={darkMode}>
                <DetailLabel>Última atualização</DetailLabel>
                <DetailValue>
                  {formatDateTime(selectedField.lastUpdateDate)}
                </DetailValue>
              </DetailItem>

              <DetailItem $darkMode={darkMode}>
                <DetailLabel>Obrigatoriedade</DetailLabel>
                <DetailValue>
                  {selectedField.optional ? 'Opcional' : 'Obrigatório'}
                </DetailValue>
              </DetailItem>

              <DetailItem $darkMode={darkMode}>
                <DetailLabel>Edição</DetailLabel>
                <DetailValue>
                  {selectedField.disabled ? 'Bloqueado para edição' : 'Editável'}
                </DetailValue>
              </DetailItem>

              <DetailItem $darkMode={darkMode}>
                <DetailLabel>Oculto no formulário</DetailLabel>
                <DetailValue>
                  {(() => {
                    const raw =
                      selectedField.formHidden ??
                      selectedField.FormHidden ??
                      false;
                    return raw ? 'Sim' : 'Não';
                  })()}
                </DetailValue>
              </DetailItem>
            </DetailGrid>

            <div style={{ marginTop: '1rem' }}>
              <Subtle>
                Abaixo você vê onde este campo está sendo utilizado na conta
                (campos, fórmulas, automações, checklists, templates, formulários
                e funis).
              </Subtle>
            </div>

            {/* Bloco de utilização do campo */}
            {usageResults.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Utilização do campo</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {usageResults.map((group, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        background: group.error
                          ? darkMode ? '#2a1010' : '#fff5f5'
                          : darkMode ? '#1b0f33' : '#f8fafc',
                        border: `1px solid ${
                          group.error
                            ? darkMode ? '#5c2020' : '#fca5a5'
                            : darkMode ? '#261b47' : '#e2e8f0'
                        }`,
                      }}
                    >
                      <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {group.error && (
                          <i className="pi pi-exclamation-triangle" style={{ color: '#ef4444', fontSize: '0.95rem' }} />
                        )}
                        {group.section}
                      </h4>

                      {group.error ? (
                        <span style={{ opacity: 0.75, fontSize: '0.875rem', color: darkMode ? '#fca5a5' : '#b91c1c' }}>
                          {group.errorMessage}
                        </span>
                      ) : group.entries.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '6px 0',
                            borderBottom:
                              i === group.entries.length - 1
                                ? 'none'
                                : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {/* Nome principal: Name, PipelineName ou FormName */}
                          <strong>
                            {item.Name ||
                              item.name ||
                              item.PipelineName ||
                              item.FormName ||
                              'Registro'}
                          </strong>

                          {/* Key de campo, quando existir */}
                          {item.Key && (
                            <span style={{ opacity: 0.7 }}> — {item.Key}</span>
                          )}

                          {/* Entidade (para campos / automações / checklists) */}
                          {item.EntityId != null && (
                            <span style={{ opacity: 0.6, marginLeft: 6 }}>
                              (Entidade: {item.EntityId})
                            </span>
                          )}

                          {/* DealStage (checklists) */}
                          {item.DealStage && (
                            <span style={{ opacity: 0.7, marginLeft: 6 }}>
                              — Etapa: {item.DealStage.Name} (Pipeline:{' '}
                              {item.DealStage.PipelineId})
                            </span>
                          )}

                          {/* Formulários: Id + PipelineId (do próprio form) */}
                          {item.Id != null && group.section.includes('Formulários') && (
                            <span style={{ opacity: 0.8, marginLeft: 6 }}>
                              — FormId: {item.Id}
                              {item.PipelineId != null &&
                                ` • PipelineId (no form): ${item.PipelineId}`}
                            </span>
                          )}

                          {/* Seção de pipelines: PipelineId + nome + FormId + FormName */}
                          {group.section.includes('Pipelines') && (
                            <>
                              {item.PipelineId != null && (
                                <span style={{ opacity: 0.8, marginLeft: 6 }}>
                                  — PipelineId: {item.PipelineId}
                                </span>
                              )}

                              {item.FormId != null && (
                                <span style={{ opacity: 0.8, marginLeft: 6 }}>
                                  — FormId: {item.FormId}
                                </span>
                              )}

                              {item.FormName && (
                                <span style={{ opacity: 0.8, marginLeft: 6 }}>
                                  (Formulário: {item.FormName})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ModalActions>
              <ModalPrimaryButton
                label="Consultar utilização"
                icon="pi pi-search"
                loading={usageLoading}
                onClick={handleFetchUsage}
              />
              <ModalSecondaryButton
                $darkMode={darkMode}
                label="Fechar"
                icon="pi pi-times"
                onClick={() => {
                  setDetailVisible(false);
                  setUsageResults([]);
                  setUsageLoading(false);
                }}
              />
            </ModalActions>
          </>
        )}
      </Dialog>
    </Page>
  );
}
