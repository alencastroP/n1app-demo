// src/components/apihub/ReadyActionsModal.jsx
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';

import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';

import { fetchPipelines, fetchStages } from '../../services/slaCardsService';
import { fetchFieldsByEntity } from '../../services/fieldsExplorerService';

import {
  scanNonNativeCities,
  executeDeleteNonNativeCities,
  executeFinishTasks,
  executeRestrictOptionFields,
  fetchRestrictOptionFieldsProfiles,
  executeGetDealHistory,
  executeFormatContactPhones,
  fetchCollaboratingUsersUsers,
  executeRemoveCollaboratingUsers,
  fetchSlaRetroativoFields,
  executeSlaRetroativo,
  previewUnifyDuplicateFields,
  executeUnifyDuplicateFields,
  fetchBulkFindReplaceFields,
  previewBulkFindReplace,
  executeBulkFindReplace,
  fetchBulkRangeUpdateFields,
  fetchBulkRangeUpdateFieldMeta,
  executeBulkRangeUpdate,
  executeBulkRenameUsers,
  executeCreateUsers,
  cancelBulkRequest,
} from '../../services/apiHubService';

/* Botão roxo principal — mesmo estilo do ApiHelper */
const AccentButton = styled(Button)`
  background-color: var(--accent) !important;
  border-color: var(--accent) !important;
  color: #ffffff;
  height: 42px;
  font-size: 0.9rem;
  box-shadow: none;
  background-image: none;
  padding: 0 16px;

  &:hover:not(:disabled) {
    filter: brightness(1.03);
  }
  &:focus {
    box-shadow: 0 0 0 1px var(--accent-soft);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: none;
  }
`;

const WarningBox = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
  background: ${({ $dark }) =>
    $dark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'};
  color: ${({ $dark }) => ($dark ? '#fca5a5' : '#991b1b')};
  margin: 12px 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ActionCard = styled.div`
  padding: 16px;
  border-radius: 10px;
  border: 1px solid
    ${({ $dark }) => ($dark ? '#2a1f3d' : '#e5e7eb')};
  background: ${({ $dark }) => ($dark ? '#14012b' : '#fafafa')};
  margin-bottom: 12px;
  cursor: pointer;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.12s;

  &:hover {
    border-color: var(--accent);
    box-shadow: ${({ $dark }) =>
      $dark
        ? '0 4px 18px rgba(116,67,246,0.22)'
        : '0 4px 16px rgba(116,67,246,0.12)'};
    transform: translateY(-1px);
  }
`;

const TAG_ICONS = {
  danger: 'pi-trash',
  warning: 'pi-bolt',
  info: 'pi-cog',
  success: 'pi-chart-bar',
};

// Definição das ações prontas (extensível — basta adicionar mais objetos)
const READY_ACTIONS = [
  {
    id: 'delete-non-native-cities',
    title: 'Deleção de cidades não nativas',
    description:
      'Busca e deleta todas as cidades cuja coluna IBGECode é nula ' +
      '(criadas por importação/integração incorreta). ' +
      'Cidades nativas do Ploomes possuem IBGECode preenchido e não são afetadas.',
    warning:
      'Esta ação é IRREVERSÍVEL. Todas as cidades sem IBGECode serão permanentemente deletadas da conta. ' +
      'Certifique-se de que o cliente já exportou a planilha de clientes com as cidades antes de prosseguir, ' +
      'pois após a deleção será necessário corrigir a base.',
    tag: 'Cities',
    tagSeverity: 'danger',
  },
  {
    id: 'finish-tasks',
    title: 'Finalizar tarefas em massa',
    description:
      'Finaliza uma lista de tarefas via POST Tasks({ID})/Finish. ' +
      'Cole os IDs separados por vírgula, quebra de linha ou espaço. ' +
      'Tarefas não acessíveis pela User-Key serão registradas como falha sem interromper o processo.',
    warning:
      'Só é possível finalizar tarefas próprias ou de terceiros que possuam ao menos um cliente vinculado. ' +
      'Tarefas sem acesso retornam 401 e serão exibidas no relatório de falhas.',
    tag: 'Tasks',
    tagSeverity: 'warning',
  },
  {
    id: 'restrict-option-fields',
    title: 'Restringir campos de opções por perfil de usuário',
    description:
      'Atualiza todos os campos de opções pré-cadastradas (TypeId = 7) da conta, ' +
      'definindo quais perfis de usuário podem criar novas opções. ' +
      'O processo lista automaticamente todos os campos e aplica o PATCH em cada um.',
    warning:
      'Esta ação altera as permissões de criação de opções em todos os campos de seleção da conta. ' +
      'Após a execução, usuários não com perfis não selecionados não poderão mais criar novas opções nesses campos.',
    tag: 'Fields',
    tagSeverity: 'info',
  },
  {
    id: 'deal-history',
    title: 'Histórico de ganhos e perdidos',
    description:
      'Consulta o último evento de ganho ou perda de cada negócio informado via Timeline do Ploomes. ' +
      'Cole os IDs dos negócios e receba uma planilha com DealId, data/hora do término, ' +
      'resultado (Ganho ou Perdido) e o usuário responsável pela ação.',
    warning:
      'Negócios que nunca foram ganhos ou perdidos aparecerão com resultado "Sem histórico" na planilha.',
    tag: 'Deals',
    tagSeverity: 'success',
  },
  {
    id: 'format-contact-phones',
    title: 'Formatar telefones de contatos',
    description:
      'Para cada contato informado, busca todos os telefones cadastrados e aplica a ' +
      'formatação do país selecionado. O tipo de cada telefone (Comercial, Celular, etc.) é preservado. ' +
      'Cole os IDs dos contatos separados por vírgula, espaço ou quebra de linha.',
    warning:
      'Todos os telefones dos contatos informados serão atualizados com o país selecionado. ' +
      'Certifique-se de que os contatos pertencem à conta do cliente antes de prosseguir.',
    tag: 'Contacts',
    tagSeverity: 'info',
  },
  {
    id: 'remove-collaborating-users',
    title: 'Remover usuários colaboradores',
    description:
      'Remove um ou mais usuários do campo de colaboradores de uma lista de clientes ou negócios, ' +
      'sem afetar os demais colaboradores cadastrados. ' +
      'Selecione a entidade, cole os IDs e escolha quais usuários serão removidos.',
    warning:
      'O campo de colaboradores será sobrescrito com os usuários restantes. ' +
      'Verifique os IDs antes de executar — a ação não pode ser desfeita automaticamente.',
    tag: 'Contacts/Deals',
    tagSeverity: 'warning',
  },
  {
    id: 'sla-retroativo',
    title: 'Preencher SLA retroativo de negócios',
    description:
      'Consulta o histórico de movimentação de estágios via Timeline de cada negócio informado ' +
      'e preenche os campos de data de entrada e/ou saída por estágio com PATCH em Deals. ' +
      'Carregue os campos da conta, mapeie entrada e saída para cada estágio desejado e informe os IDs dos negócios.',
    warning:
      'Os campos mapeados serão sobrescritos com as datas obtidas pelo histórico de timeline. ' +
      'Certifique-se de que o mapeamento estágio → campo está correto antes de executar.',
    tag: 'Deals',
    tagSeverity: 'info',
  },
  {
    id: 'unify-duplicate-fields',
    title: 'Unificar campos duplicados (de-para de valor)',
    description:
      'Copia, em massa, o valor de um campo de ORIGEM para um campo de DESTINO na mesma entidade, ' +
      'apenas quando o destino está vazio. Útil para consolidar dois campos personalizados que viraram duplicados. ' +
      'Selecione a entidade, os campos origem e destino, veja a prévia e execute.',
    warning:
      'A ação grava no campo destino apenas dos registros com origem preenchida e destino vazio. ' +
      'Não sobrescreve valores já existentes no destino e não altera o campo origem (idempotente). ' +
      'Rode a prévia e confira o de-para antes de executar.',
    tag: 'Dinâmico',
    tagSeverity: 'info',
  },
  {
    id: 'bulk-find-replace',
    title: 'Substituir em massa em um campo (regex)',
    description:
      'Aplica uma ou mais substituições por expressão regular ao conteúdo de um campo (nativo ou ' +
      'personalizado) de uma entidade. Ideal para ajustar HTML/CSS em massa — ex.: trocar ' +
      'width="600"/height="800" das tags <img> por width="800"/height="1022". ' +
      'Selecione a entidade e o campo, defina os de-para, escolha os registros por lista de IDs ou ' +
      'filtro OData e receba uma planilha com o antes e o depois.',
    warning:
      'A ação grava diretamente no campo escolhido de cada registro selecionado e NÃO pode ser ' +
      'desfeita automaticamente. Use o modo regex com cuidado: padrões abrangentes podem alterar ' +
      'trechos indesejados. Ao final é gerada uma planilha com o valor antes e depois de cada ' +
      'registro — confira antes de divulgar.',
    tag: 'Dinâmico',
    tagSeverity: 'warning',
  },
  {
    id: 'bulk-range-update',
    title: 'Atualização em massa por faixas de IDs',
    description:
      'Aplica valores diferentes a grupos distintos de IDs em um único fluxo. Selecione a entidade e o ' +
      'campo (nativo ou personalizado, de qualquer tipo), cole a lista de IDs e distribua-a em blocos — ' +
      'cada bloco consome os próximos N IDs e recebe um valor. Gera um PATCH por registro.',
    warning:
      'A ação grava diretamente no campo escolhido de cada registro e NÃO pode ser desfeita ' +
      'automaticamente. Não há endpoint de rollback na API do Ploomes — exporte os dados atuais antes ' +
      'de executar. Confira a prévia (ID → valor) antes de confirmar.',
    tag: 'Dinâmico',
    tagSeverity: 'warning',
  },
  {
    id: 'bulk-rename-users',
    title: 'Concatenar nomes de usuários em massa',
    description:
      'Adiciona um texto fixo antes ou depois do nome de uma lista de usuários. ' +
      'Para cada ID informado, o nome atual é lido e reescrito via PATCH Users({ID}). ' +
      'Caso de uso típico: incluir "(Inativo)" antes do nome de usuários desativados. ' +
      'Cole os IDs separados por vírgula, espaço ou quebra de linha.',
    warning:
      'A ação grava diretamente no nome de cada usuário e NÃO pode ser desfeita ' +
      'automaticamente. Nomes que já começam/terminam com o texto informado são ' +
      'ignorados (idempotente), então reexecutar não duplica o prefixo. Confira os IDs ' +
      'e o texto antes de executar.',
    tag: 'Users',
    tagSeverity: 'info',
  },
  {
    id: 'create-users',
    title: 'Criação de usuários em massa',
    description:
      'Cria vários usuários na conta de uma vez via POST Users. Cole a planilha ' +
      '(com cabeçalho Nome / E-mail / Senha) ou um JSON com a lista pronta. ' +
      'O app trata os dados, mostra a prévia e cria cada usuário na conta da User-Key informada.',
    warning:
      'A ação cria usuários reais na conta e pode gerar cobrança de licenças. ' +
      'E-mails já cadastrados falham individualmente (o lote não é interrompido). ' +
      'As senhas coladas trafegam para criar o acesso — nunca são gravadas em relatório. ' +
      'Confira a prévia antes de executar.',
    tag: 'Users',
    tagSeverity: 'warning',
  },
];

// ── Concatenar nomes de usuários ────────────────────────────────
const RENAME_POSITION_OPTIONS = [
  { label: 'Antes do nome (prefixo)', value: 'prefix' },
  { label: 'Depois do nome (sufixo)', value: 'suffix' },
];

const PHONE_COUNTRY_OPTIONS = [
  { label: '🇧🇷 Brasil',          value: 76  },
  { label: '🇦🇷 Argentina',       value: 32  },
  { label: '🇨🇱 Chile',           value: 152 },
  { label: '🇨🇴 Colômbia',        value: 170 },
  { label: '🇲🇽 México',          value: 484 },
  { label: '🇺🇸 Estados Unidos',  value: 840 },
];

// ── Unificar campos duplicados ──────────────────────────────────
// Entidades suportadas → EntityId em /Fields (Contacts=1, Deals=2, Quotes=7, Orders=4).
// Exibida em ordem alfabética (label).
const UNIFY_ENTITY_OPTIONS = [
  { label: 'Cliente (Contacts)',  value: 'Contacts', entityId: 1 },
  { label: 'Negócio (Deals)',     value: 'Deals',    entityId: 2 },
  { label: 'Pedido (Orders)',     value: 'Orders',   entityId: 4 },
  { label: 'Proposta (Quotes)',   value: 'Quotes',   entityId: 7 },
];

// TypeId → coluna de valor em OtherProperties (espelha o backend). Só estes são elegíveis no v1.
const UNIFY_VALUE_COLUMN_BY_TYPE = {
  1: 'StringValue', 2: 'BigStringValue', 4: 'IntegerValue',
  5: 'DecimalValue', 6: 'DecimalValue', 13: 'DecimalValue',
  8: 'DateTimeValue', 9: 'DateTimeValue', 10: 'BoolValue',
};
const UNIFY_TYPE_LABEL = {
  1: 'Texto', 2: 'Texto longo', 4: 'Inteiro',
  5: 'Decimal', 6: 'Monetário', 13: 'Porcentagem',
  8: 'Data', 9: 'Data/hora', 10: 'Sim/Não',
};
function unifyValueColumn(typeId) {
  return UNIFY_VALUE_COLUMN_BY_TYPE[Number(typeId)] || null;
}

// ── Substituir em massa (find & replace) ───────────────────────
// Entidades suportadas → EntityId em /Fields (Contacts=1, Deals=2, Products=10, Quotes=7, Orders=4).
// EntityId comprovado em produção pelo merge de duplicados (mergeController.js ENTITY_IDS) —
// Products é 10, não 3 (erro que existia aqui e fazia a action consultar a entidade errada).
// Exibida em ordem alfabética (label).
const FR_ENTITY_OPTIONS = [
  { label: 'Cliente (Contacts)',  value: 'Contacts', entityId: 1 },
  { label: 'Negócio (Deals)',     value: 'Deals',    entityId: 2 },
  { label: 'Pedido (Orders)',     value: 'Orders',   entityId: 4 },
  { label: 'Produto (Products)',  value: 'Products', entityId: 10 },
  { label: 'Proposta (Quotes)',   value: 'Quotes',   entityId: 7 },
];
const FR_SELECTION_OPTIONS = [
  { label: 'Colar lista de IDs', value: 'ids' },
  { label: 'Filtro OData ($filter)', value: 'filter' },
];
// Classificação de campos 100% por TypeId — enum GLOBAL do Ploomes (idêntico em toda conta), a mesma
// fonte usada pela página FieldExplorer. NENHUM nome de tipo (string) é usado como critério: confiar
// em string causou o bug recorrente de o Texto multilinha (TypeId 2) sumir/ficar bloqueado.
// Só texto é editável por regex → coluna de valor em OtherProperties: 1=StringValue, 2=BigStringValue.
const FR_TEXT_COLUMN_BY_TYPE = { 1: 'StringValue', 2: 'BigStringValue' };
// Rótulos legíveis por TypeId (espelha FieldExplorer.jsx). Campos fora da lista mostram "Tipo N".
const FR_TYPE_LABELS = {
  1: 'Texto simples', 2: 'Texto multilinha', 4: 'Número inteiro', 5: 'Moeda',
  6: 'Número decimal', 7: 'Opções (lista)', 8: 'Data', 9: 'Horário', 10: 'Checkbox',
  11: 'CPF', 12: 'CNPJ', 13: 'Porcentagem', 17: 'Endereço', 18: 'Imagem', 19: 'Anexo',
  20: 'Cor', 21: 'Assinatura DocuSign', 22: 'Desenvolvedor', 24: 'Assinatura D4Sign',
};
function frValueColumn(f) {
  return f ? (FR_TEXT_COLUMN_BY_TYPE[Number(f.typeId)] || null) : null;
}
function frIsEligibleField(f) {
  return !!frValueColumn(f); // elegível ⇔ campo de texto (TypeId 1 ou 2)
}
function frFieldTypeLabel(f) {
  return FR_TYPE_LABELS[Number(f?.typeId)] || `Tipo ${f?.typeId ?? '?'}`;
}

// ── Atualização em massa por faixas de IDs ──────────────────────
// EntityId em /Fields — IDs comprovados em produção e documentados na PLOOMES_API_KNOWLEDGE_BASE.md
// §3.5 (1=Contact, 2=Deal, 4=Order, 7=Quote, 10=Products). ATENÇÃO: Order=4 e Quote=7 (é um erro
// comum trocá-los). Tasks=12 e InteractionRecords=36 são adicionais desta ação.
// Exibida em ordem alfabética (label).
const RU_ENTITY_OPTIONS = [
  { label: 'Cliente (Contacts)',              value: 'Contacts',            entityId: 1 },
  { label: 'Negócio (Deals)',                 value: 'Deals',               entityId: 2 },
  { label: 'Produto (Products)',              value: 'Products',            entityId: 10 },
  { label: 'Proposta (Quotes)',               value: 'Quotes',              entityId: 7 },
  { label: 'Registro de Contato (InteractionRecords)', value: 'InteractionRecords', entityId: 36 },
  { label: 'Tarefa (Tasks)',                  value: 'Tasks',               entityId: 12 },
  { label: 'Venda / Pedido (Orders)',         value: 'Orders',              entityId: 4 },
];
// Tipos de campo que não dá para preencher por esta ação (imagem, anexo, endereço, cor, assinaturas,
// desenvolvedor) — pré-filtro do dropdown de campos. O suporte real é confirmado pelo /field-meta,
// que resolve o slot por NativeType (cobre campos relacionais como Usuário/Produto/Contato).
const RU_UNSUPPORTED_TYPES = new Set([17, 18, 19, 20, 21, 22, 24]);
function ruFieldListSupported(f) {
  return !RU_UNSUPPORTED_TYPES.has(Number(f?.typeId));
}
// Kinds cujo valor é escolhido numa lista (Id → rótulo) vinda do /field-meta.
const RU_CHOICE_KINDS = ['option', 'user', 'product', 'contact', 'currency', 'object'];
/** Como coletar o valor de cada bloco, a partir da meta resolvida pelo backend (slot + kind). */
function ruMetaInputType(meta) {
  if (!meta || !meta.slot) return null;
  if (meta.kind === 'bool') return 'bool';
  if (RU_CHOICE_KINDS.includes(meta.kind)) return 'choice';
  if (meta.slot === 'IntegerValue') return 'integer';
  if (meta.slot === 'DecimalValue') return 'decimal';
  if (meta.slot === 'DateTimeValue') return 'datetime';
  return 'text';
}

export default function ReadyActionsModal({
  visible,
  onHide,
  userKey,
  darkMode,
  toast,
}) {
  // Qual ação está selecionada (null = lista)
  const [selectedAction, setSelectedAction] = useState(null);

  // Scan
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { total, ids }

  // Confirmação
  const [exportConfirmed, setExportConfirmed] = useState(false);

  // Execução (progresso SSE)
  const [executing, setExecuting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    logs: [],
    success: 0,
    failed: 0,
  });

  // Resultado final
  const [result, setResult] = useState(null);

  // ── Finish Tasks: input de IDs ──────────────────────────────────
  const [taskIdsInput, setTaskIdsInput] = useState('');

  // ── Deal History: input de IDs ──────────────────────────────────
  const [dealIdsInput, setDealIdsInput] = useState('');

  // ── Format Contact Phones: input de IDs e país ─────────────────
  const [contactIdsInput, setContactIdsInput] = useState('');
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(76);

  // ── Concatenar nomes de usuários: IDs, texto e posição ─────────
  const [renameUserIdsInput, setRenameUserIdsInput] = useState('');
  const [renameText, setRenameText] = useState('');
  const [renamePosition, setRenamePosition] = useState('prefix'); // 'prefix' | 'suffix'

  // ── Criação de usuários em massa: colagem (planilha ou JSON) ────
  const [createUsersInput, setCreateUsersInput] = useState('');

  // ── Restrict Option Fields: seleção de perfis ───────────────────
  const [profilesList, setProfilesList] = useState(null); // null = não carregado ainda
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState([]);

  // ── SLA Retroativo ─────────────────────────────────────────────
  const [slaFieldsList, setSlaFieldsList] = useState(null);    // null = não carregado
  const [slaFieldsLoading, setSlaFieldsLoading] = useState(false);
  const [slaPipelinesList, setSlaPipelinesList] = useState(null); // null = não carregado
  const [slaPipelinesLoading, setSlaPipelinesLoading] = useState(false);
  const [slaSelectedPipeline, setSlaSelectedPipeline] = useState(null);
  const [slaStagesList, setSlaStagesList] = useState([]);      // estágios do funil selecionado
  const [slaStagesLoading, setSlaStagesLoading] = useState(false);
  // [{ stageId: number, stageName: string, entryFieldKey: string|null, exitFieldKey: string|null }]
  const [slaMappings, setSlaMappings] = useState([]);
  const [slaDealIdsInput, setSlaDealIdsInput] = useState('');

  // ── Remove Collaborating Users ──────────────────────────────────
  const [rcuEntityType, setRcuEntityType] = useState('Contacts');
  const [rcuEntityIdsInput, setRcuEntityIdsInput] = useState('');
  const [rcuUsersList, setRcuUsersList] = useState(null); // null = não carregado
  const [rcuUsersLoading, setRcuUsersLoading] = useState(false);
  const [rcuSelectedUserIds, setRcuSelectedUserIds] = useState([]);
  const [rcuUserSearch, setRcuUserSearch] = useState('');

  // ── Unify Duplicate Fields ─────────────────────────────────────
  const [unifyEntity, setUnifyEntity] = useState(null);
  const [unifyFields, setUnifyFields] = useState(null);        // null = não carregado
  const [unifyFieldsLoading, setUnifyFieldsLoading] = useState(false);
  const [unifySourceKey, setUnifySourceKey] = useState(null);
  const [unifyTargetKey, setUnifyTargetKey] = useState(null);
  const [unifyPreview, setUnifyPreview] = useState(null);      // null = não previsto; { count, entity }
  const [unifyPreviewLoading, setUnifyPreviewLoading] = useState(false);

  // ── Bulk Find & Replace ────────────────────────────────────────
  const [frEntity, setFrEntity] = useState(null);
  const [frFields, setFrFields] = useState(null);              // null = não carregado (TODOS os tipos)
  const [frFieldsLoading, setFrFieldsLoading] = useState(false);
  const [frTypeFilter, setFrTypeFilter] = useState(null);      // null = "Todos os tipos"
  const [frFieldKey, setFrFieldKey] = useState(null);
  // [{ find: string, replace: string }] — find é tratado como regex no backend
  const [frReplacements, setFrReplacements] = useState([{ find: '', replace: '' }]);
  const [frSelectionMode, setFrSelectionMode] = useState('ids'); // 'ids' | 'filter'
  const [frIdsInput, setFrIdsInput] = useState('');
  const [frFilterInput, setFrFilterInput] = useState('');
  // Prévia obrigatória antes de executar — qualquer mudança nos campos acima invalida (null) a prévia atual.
  const [frPreviewing, setFrPreviewing] = useState(false);
  const [frPreviewData, setFrPreviewData] = useState(null); // { total, changed, unchanged, failed, rows }

  // ── Atualização em massa por faixas de IDs ─────────────────────
  const [ruEntity, setRuEntity] = useState(null);
  const [ruFields, setRuFields] = useState(null);            // null = não carregado
  const [ruFieldsLoading, setRuFieldsLoading] = useState(false);
  const [ruFieldKey, setRuFieldKey] = useState(null);
  const [ruFieldMeta, setRuFieldMeta] = useState(null);      // { nativeType, slot, kind, options, truncated }
  const [ruOptions, setRuOptions] = useState(null);          // lista de escolhas (opção/usuário/produto/contato/moeda)
  const [ruOptionsLoading, setRuOptionsLoading] = useState(false);
  const [ruIdsInput, setRuIdsInput] = useState('');
  // blocos: [{ count: number|null, value: any }] — count null = "restante" (consome o que sobrar)
  const [ruBlocks, setRuBlocks] = useState([{ count: null, value: '' }]);
  const [ruSuppressWebhooks, setRuSuppressWebhooks] = useState(false);
  const [ruConfirmed, setRuConfirmed] = useState(false);     // confirma operação irreversível

  const logsEndRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────

  function showToast(severity, summary, detail, life = 4000) {
    toast.current?.show({ severity, summary, detail, life });
  }

  function resetState() {
    setSelectedAction(null);
    setScanning(false);
    setScanResult(null);
    setExportConfirmed(false);
    setExecuting(false);
    setJobId(null);
    setCancelling(false);
    setProgress({ current: 0, total: 0, logs: [], success: 0, failed: 0 });
    setResult(null);
    setTaskIdsInput('');
    setDealIdsInput('');
    setContactIdsInput('');
    setSelectedPhoneCountry(76);
    setRenameUserIdsInput('');
    setRenameText('');
    setRenamePosition('prefix');
    setCreateUsersInput('');
    setProfilesList(null);
    setProfilesLoading(false);
    setSelectedProfileIds([]);
    setRcuEntityType('Contacts');
    setRcuEntityIdsInput('');
    setRcuUsersList(null);
    setRcuUsersLoading(false);
    setRcuSelectedUserIds([]);
    setRcuUserSearch('');
    setSlaFieldsList(null);
    setSlaFieldsLoading(false);
    setSlaPipelinesList(null);
    setSlaPipelinesLoading(false);
    setSlaSelectedPipeline(null);
    setSlaStagesList([]);
    setSlaStagesLoading(false);
    setSlaMappings([]);
    setSlaDealIdsInput('');
    setUnifyEntity(null);
    setUnifyFields(null);
    setUnifyFieldsLoading(false);
    setUnifySourceKey(null);
    setUnifyTargetKey(null);
    setUnifyPreview(null);
    setUnifyPreviewLoading(false);
    setFrEntity(null);
    setFrFields(null);
    setFrFieldsLoading(false);
    setFrTypeFilter(null);
    setFrFieldKey(null);
    setFrReplacements([{ find: '', replace: '' }]);
    setFrSelectionMode('ids');
    setFrIdsInput('');
    setFrFilterInput('');
    setFrPreviewing(false);
    setFrPreviewData(null);
    setRuEntity(null);
    setRuFields(null);
    setRuFieldsLoading(false);
    setRuFieldKey(null);
    setRuFieldMeta(null);
    setRuOptions(null);
    setRuOptionsLoading(false);
    setRuIdsInput('');
    setRuBlocks([{ count: null, value: '' }]);
    setRuSuppressWebhooks(false);
    setRuConfirmed(false);
  }

  function handleHide() {
    if (executing || frPreviewing) return; // bloqueia fechamento durante execução/prévia
    resetState();
    onHide();
  }

  // ── Scan ───────────────────────────────────────────────────────

  async function handleScan() {
    if (!userKey?.trim()) {
      showToast(
        'warn',
        'Atenção',
        'Informe e valide a User-Key antes de buscar.'
      );
      return;
    }

    try {
      setScanning(true);
      setScanResult(null);
      setExportConfirmed(false);
      setResult(null);

      const data = await scanNonNativeCities(userKey);
      setScanResult(data);

      if (data.total === 0) {
        showToast(
          'info',
          'Nenhuma cidade encontrada',
          'Não há cidades não nativas nesta conta.'
        );
      } else {
        showToast(
          'success',
          'Busca concluída',
          `Encontradas ${data.total} cidades não nativas.`
        );
      }
    } catch (err) {
      showToast(
        'error',
        'Erro na busca',
        err?.message || 'Falha ao buscar cidades.'
      );
      setScanResult(null);
    } finally {
      setScanning(false);
    }
  }

  // ── Execute ────────────────────────────────────────────────────

  async function handleExecute() {
    if (!scanResult?.ids?.length || !exportConfirmed || !userKey?.trim())
      return;

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({
        current: 0,
        total: scanResult.ids.length,
        logs: [],
        success: 0,
        failed: 0,
      });

      const resp = await executeDeleteNonNativeCities({
        userKeyOverride: userKey,
        ids: scanResult.ids,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);

          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success:
                data.success !== undefined ? data.success : prev.success,
              failed:
                data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => {
              logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Deleção finalizada${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast(
        'error',
        'Erro na execução',
        err?.message || 'Falha ao deletar cidades.'
      );
    }
  }

  // ── Cancel ─────────────────────────────────────────────────────

  async function handleCancel() {
    if (!jobId) return;
    try {
      setCancelling(true);
      await cancelBulkRequest(jobId);
      showToast(
        'info',
        'Cancelamento solicitado',
        'Aguarde o item atual finalizar...'
      );
    } catch (err) {
      showToast('error', 'Erro', err?.message || 'Falha ao cancelar.');
      setCancelling(false);
    }
  }

  // ── Finish Tasks ───────────────────────────────────────────────

  function parseTaskIds(raw) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }

  async function handleFinishTasks() {
    const ids = parseTaskIds(taskIdsInput);
    if (ids.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum ID válido encontrado na lista.');
      return;
    }
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: ids.length, logs: [], success: 0, failed: 0 });

      const resp = await executeFinishTasks({
        userKeyOverride: userKey,
        taskIds: ids,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Finalização de tarefas concluída${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao finalizar tarefas.');
    }
  }

  function renderFinishTasks() {
    if (executing) return renderProgressView('Finalizando tarefas em massa...', 'Isso pode levar alguns minutos dependendo da quantidade de tarefas');
    if (result) return renderFinishTasksResult();

    const action = READY_ACTIONS.find((a) => a.id === 'finish-tasks');
    const parsedCount = parseTaskIds(taskIdsInput).length;

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          {action.description}
        </p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <strong>Cole os IDs das tarefas</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Aceita IDs separados por vírgula, espaço ou quebra de linha.
          </p>
          <InputTextarea
            value={taskIdsInput}
            onChange={(e) => setTaskIdsInput(e.target.value)}
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            placeholder={'123456\n789012\n345678'}
            disabled={!userKey?.trim()}
          />
          {parsedCount > 0 && (
            <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
              <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
              {parsedCount} ID{parsedCount !== 1 ? 's' : ''} reconhecido{parsedCount !== 1 ? 's' : ''}.
            </small>
          )}
        </div>

        <AccentButton
          label={`Finalizar ${parsedCount > 0 ? parsedCount + ' ' : ''}tarefa${parsedCount !== 1 ? 's' : ''}`}
          icon="pi pi-check"
          onClick={handleFinishTasks}
          disabled={parsedCount === 0 || !userKey?.trim()}
        />
      </>
    );
  }

  function renderFinishTasksResult() {
    const hasFailed = result.failedIds?.length > 0;

    function downloadReport() {
      const report = {
        readyAction: 'finish-tasks',
        executedAt: new Date().toISOString(),
        total: result.total,
        success: result.success,
        failed: result.failed,
        cancelled: result.cancelled,
        successIds: result.successIds || [],
        failedIds: result.failedIds || [],
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finish-tasks-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : hasFailed
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Finalização de tarefas cancelada'
            : hasFailed
            ? 'Finalização de tarefas concluída com erros'
            : 'Tarefas finalizadas com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Sucesso', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {hasFailed && (
          <div
            style={{
              textAlign: 'left',
              marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              IDs com falha ({result.failedIds.length})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: '8px 12px',
                background: darkMode ? '#120125' : '#fafafa',
              }}
            >
              {result.failedIds.map(({ id, status, message }) => (
                <div
                  key={id}
                  style={{
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    marginBottom: 4,
                    color: '#ef4444',
                  }}
                >
                  ID {id} — {status} — {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <Button
            label="Baixar relatório JSON"
            icon="pi pi-download"
            severity="secondary"
            onClick={downloadReport}
          />
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Deal History ───────────────────────────────────────────────

  function parseDealIds(raw) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }

  async function handleGetDealHistory() {
    const ids = parseDealIds(dealIdsInput);
    if (ids.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum ID válido encontrado na lista.');
      return;
    }
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: ids.length, logs: [], success: 0, failed: 0 });

      const resp = await executeGetDealHistory({
        userKeyOverride: userKey,
        dealIds: ids,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Histórico concluído${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao buscar histórico.');
    }
  }

  function renderDealHistory() {
    if (executing) return renderProgressView('Buscando histórico de negócios...', 'Isso pode levar alguns minutos dependendo da quantidade de negócios');
    if (result) return renderDealHistoryResult();

    const action = READY_ACTIONS.find((a) => a.id === 'deal-history');
    const parsedCount = parseDealIds(dealIdsInput).length;

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          {action.description}
        </p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <strong>Cole os IDs dos negócios</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Aceita IDs separados por vírgula, espaço ou quebra de linha.
          </p>
          <InputTextarea
            value={dealIdsInput}
            onChange={(e) => setDealIdsInput(e.target.value)}
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            placeholder={'123456\n789012\n345678'}
            disabled={!userKey?.trim()}
          />
          {parsedCount > 0 && (
            <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
              <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
              {parsedCount} ID{parsedCount !== 1 ? 's' : ''} reconhecido{parsedCount !== 1 ? 's' : ''}.
            </small>
          )}
        </div>

        <AccentButton
          label={`Buscar histórico${parsedCount > 0 ? ` de ${parsedCount} negócio${parsedCount !== 1 ? 's' : ''}` : ''}`}
          icon="pi pi-search"
          onClick={handleGetDealHistory}
          disabled={parsedCount === 0 || !userKey?.trim()}
        />
      </>
    );
  }

  function renderDealHistoryResult() {
    const hasFailed = result.failedItems?.length > 0;

    function downloadCsv() {
      const header = 'DealId,DateTime,Resultado,Usuario';
      const rows = (result.records || []).map((r) => {
        const dt = r.DateTime
          ? new Date(r.DateTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
          : '';
        const usuario = (r.Usuario || '').replace(/"/g, '""');
        return `${r.DealId},"${dt}","${r.Resultado}","${usuario}"`;
      });
      const csv = [header, ...rows].join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-negocios-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : hasFailed
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Busca cancelada'
            : hasFailed
            ? 'Histórico concluído com erros'
            : 'Histórico obtido com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Sucesso', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {hasFailed && (
          <div
            style={{
              textAlign: 'left',
              marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Negócios com falha ({result.failedItems.length})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: '8px 12px',
                background: darkMode ? '#120125' : '#fafafa',
              }}
            >
              {result.failedItems.map(({ dealId, status, message }) => (
                <div
                  key={dealId}
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: 4, color: '#ef4444' }}
                >
                  ID {dealId} — {status} — {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {(result.records?.length > 0) && (
            <Button
              label="Baixar planilha CSV"
              icon="pi pi-download"
              severity="secondary"
              onClick={downloadCsv}
            />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Format Contact Phones ──────────────────────────────────────

  function parseContactIds(raw) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }

  async function handleFormatContactPhones() {
    const ids = parseContactIds(contactIdsInput);
    if (ids.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum ID válido encontrado na lista.');
      return;
    }
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: ids.length, logs: [], success: 0, failed: 0 });

      const resp = await executeFormatContactPhones({
        userKeyOverride: userKey,
        contactIds: ids,
        countryId: selectedPhoneCountry,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Formatação de telefones concluída${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao formatar telefones.');
    }
  }

  function renderFormatContactPhones() {
    if (executing) return renderProgressView('Formatando telefones de contatos...', 'Isso pode levar alguns minutos dependendo da quantidade de contatos');
    if (result) return renderFormatContactPhonesResult();

    const action = READY_ACTIONS.find((a) => a.id === 'format-contact-phones');
    const parsedCount = parseContactIds(contactIdsInput).length;

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          {action.description}
        </p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <strong>País / máscara do telefone</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Todos os telefones serão atualizados com a máscara do país selecionado.
          </p>
          <Dropdown
            value={selectedPhoneCountry}
            options={PHONE_COUNTRY_OPTIONS}
            onChange={(e) => setSelectedPhoneCountry(e.value)}
            style={{ width: '100%' }}
            disabled={!userKey?.trim()}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>Cole os IDs dos contatos</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Aceita IDs separados por vírgula, espaço ou quebra de linha.
          </p>
          <InputTextarea
            value={contactIdsInput}
            onChange={(e) => setContactIdsInput(e.target.value)}
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            placeholder={'123456\n789012\n345678'}
            disabled={!userKey?.trim()}
          />
          {parsedCount > 0 && (
            <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
              <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
              {parsedCount} ID{parsedCount !== 1 ? 's' : ''} reconhecido{parsedCount !== 1 ? 's' : ''}.
            </small>
          )}
        </div>

        <AccentButton
          label={`Formatar telefones${parsedCount > 0 ? ` de ${parsedCount} contato${parsedCount !== 1 ? 's' : ''}` : ''}`}
          icon="pi pi-phone"
          onClick={handleFormatContactPhones}
          disabled={parsedCount === 0 || !userKey?.trim()}
        />
      </>
    );
  }

  function renderFormatContactPhonesResult() {
    const hasFailed = result.failedIds?.length > 0;

    function downloadReport() {
      const report = {
        readyAction: 'format-contact-phones',
        executedAt: new Date().toISOString(),
        total: result.total,
        success: result.success,
        failed: result.failed,
        cancelled: result.cancelled,
        failedIds: result.failedIds || [],
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `format-contact-phones-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : hasFailed
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Formatação cancelada'
            : hasFailed
            ? 'Formatação concluída com erros'
            : 'Telefones formatados com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Sucesso', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {hasFailed && (
          <div
            style={{
              textAlign: 'left',
              marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Contatos com falha ({result.failedIds.length})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: '8px 12px',
                background: darkMode ? '#120125' : '#fafafa',
              }}
            >
              {result.failedIds.map(({ id, status, message }) => (
                <div
                  key={id}
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: 4, color: '#ef4444' }}
                >
                  ID {id} — {status} — {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {hasFailed && (
            <Button
              label="Baixar relatório JSON"
              icon="pi pi-download"
              severity="secondary"
              onClick={downloadReport}
            />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Remove Collaborating Users ─────────────────────────────────

  function parseEntityIds(raw) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }

  async function handleLoadRcuUsers() {
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    try {
      setRcuUsersLoading(true);
      const data = await fetchCollaboratingUsersUsers({ userKeyOverride: userKey });
      setRcuUsersList(data.users || []);
    } catch (err) {
      showToast('error', 'Erro ao carregar usuários', err?.message || 'Falha ao buscar usuários.');
    } finally {
      setRcuUsersLoading(false);
    }
  }

  function toggleRcuUser(id) {
    setRcuSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleRemoveCollaboratingUsers() {
    const ids = parseEntityIds(rcuEntityIdsInput);
    if (ids.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum ID válido encontrado na lista.');
      return;
    }
    if (rcuSelectedUserIds.length === 0) {
      showToast('warn', 'Atenção', 'Selecione ao menos um usuário para remover.');
      return;
    }
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: ids.length, logs: [], success: 0, failed: 0 });

      const resp = await executeRemoveCollaboratingUsers({
        userKeyOverride: userKey,
        entityType: rcuEntityType,
        entityIds: ids,
        userIdsToRemove: rcuSelectedUserIds,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Remoção de colaboradores concluída${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao remover colaboradores.');
    }
  }

  function renderRemoveCollaboratingUsers() {
    if (executing) return renderProgressView('Removendo usuários colaboradores...', 'Isso pode levar alguns minutos dependendo da quantidade de registros');
    if (result) return renderRemoveCollaboratingUsersResult();

    const action = READY_ACTIONS.find((a) => a.id === 'remove-collaborating-users');
    const parsedCount = parseEntityIds(rcuEntityIdsInput).length;
    const entityLabel = rcuEntityType === 'Contacts' ? 'clientes' : 'negócios';

    const ENTITY_OPTIONS = [
      { label: 'Cliente (Contacts)', value: 'Contacts' },
      { label: 'Negócio (Deals)', value: 'Deals' },
    ];

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          {action.description}
        </p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        {/* Seleção de entidade */}
        <div style={{ marginBottom: 16 }}>
          <strong>Entidade</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Selecione se os IDs informados são de clientes ou negócios.
          </p>
          <Dropdown
            value={rcuEntityType}
            options={ENTITY_OPTIONS}
            onChange={(e) => {
              setRcuEntityType(e.value);
              setRcuEntityIdsInput('');
            }}
            style={{ width: '100%' }}
            disabled={!userKey?.trim()}
          />
        </div>

        {/* Lista de IDs */}
        <div style={{ marginBottom: 16 }}>
          <strong>Cole os IDs dos {entityLabel}</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Aceita IDs separados por vírgula, espaço ou quebra de linha.
          </p>
          <InputTextarea
            value={rcuEntityIdsInput}
            onChange={(e) => setRcuEntityIdsInput(e.target.value)}
            rows={5}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            placeholder={'123456\n789012\n345678'}
            disabled={!userKey?.trim()}
          />
          {parsedCount > 0 && (
            <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
              <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
              {parsedCount} ID{parsedCount !== 1 ? 's' : ''} reconhecido{parsedCount !== 1 ? 's' : ''}.
            </small>
          )}
        </div>

        <Divider />

        {/* Seleção de usuários a remover */}
        <div style={{ marginBottom: 16 }}>
          <strong>Usuários a remover do campo colaborador</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Carregue os usuários da conta e selecione quais serão removidos do campo.
          </p>

          {rcuUsersList === null ? (
            <Button
              label="Carregar usuários da conta"
              icon={rcuUsersLoading ? 'pi pi-spin pi-spinner' : 'pi pi-users'}
              onClick={handleLoadRcuUsers}
              disabled={!userKey?.trim() || rcuUsersLoading}
              severity="secondary"
            />
          ) : (
            <>
              {/* Campo de busca */}
              <span className="p-input-icon-left" style={{ display: 'block', marginBottom: 8 }}>
                <i className="pi pi-search" style={{ left: '0.75rem' }} />
                <InputText
                  value={rcuUserSearch}
                  onChange={(e) => setRcuUserSearch(e.target.value)}
                  placeholder="Pesquisar usuário..."
                  style={{ width: '100%', paddingLeft: '2.2rem', fontSize: '0.875rem' }}
                />
              </span>

              {/* Contagem */}
              <small style={{ opacity: 0.6, display: 'block', marginBottom: 8 }}>
                {rcuUsersList.length} usuário{rcuUsersList.length !== 1 ? 's' : ''} no total
                {rcuUserSearch.trim() && ` — ${rcuUsersList.filter((u) => u.Name.toLowerCase().includes(rcuUserSearch.toLowerCase())).length} encontrado${rcuUsersList.filter((u) => u.Name.toLowerCase().includes(rcuUserSearch.toLowerCase())).length !== 1 ? 's' : ''}`}
              </small>

              {/* Lista filtrável */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '10px 14px',
                  background: darkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(139, 92, 246, 0.06)',
                  borderRadius: 8,
                  marginBottom: 12,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {rcuUsersList
                  .filter((u) => u.Name.toLowerCase().includes(rcuUserSearch.toLowerCase()))
                  .map((user) => (
                    <div
                      key={user.Id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                      onClick={() => toggleRcuUser(user.Id)}
                    >
                      <Checkbox
                        inputId={`rcu-user-${user.Id}`}
                        checked={rcuSelectedUserIds.includes(user.Id)}
                        onChange={() => toggleRcuUser(user.Id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        htmlFor={`rcu-user-${user.Id}`}
                        style={{ cursor: 'pointer', fontSize: '0.9rem', pointerEvents: 'none' }}
                      >
                        {user.Name}
                        <span style={{ opacity: 0.45, marginLeft: 6, fontSize: '0.78rem' }}>
                          (id: {user.Id})
                        </span>
                      </label>
                    </div>
                  ))}
                {rcuUsersList.filter((u) => u.Name.toLowerCase().includes(rcuUserSearch.toLowerCase())).length === 0 && (
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.85rem' }}>
                    Nenhum usuário encontrado para "{rcuUserSearch}".
                  </p>
                )}
              </div>

              {rcuSelectedUserIds.length === 0 && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
                  <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
                  Selecione ao menos um usuário para remover.
                </p>
              )}
              {rcuSelectedUserIds.length > 0 && (
                <small style={{ opacity: 0.75, display: 'block', marginBottom: 12 }}>
                  <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
                  {rcuSelectedUserIds.length} usuário{rcuSelectedUserIds.length !== 1 ? 's' : ''} selecionado{rcuSelectedUserIds.length !== 1 ? 's' : ''} para remoção.
                </small>
              )}
            </>
          )}
        </div>

        <AccentButton
          label={`Remover colaboradores${parsedCount > 0 ? ` de ${parsedCount} ${entityLabel.slice(0, -1)}${parsedCount !== 1 ? 's' : ''}` : ''}`}
          icon="pi pi-user-minus"
          onClick={handleRemoveCollaboratingUsers}
          disabled={parsedCount === 0 || rcuSelectedUserIds.length === 0 || !userKey?.trim()}
        />
      </>
    );
  }

  function renderRemoveCollaboratingUsersResult() {
    const hasFailed = result.failedIds?.length > 0;

    function downloadReport() {
      const report = {
        readyAction: 'remove-collaborating-users',
        executedAt: new Date().toISOString(),
        entityType: rcuEntityType,
        total: result.total,
        success: result.success,
        failed: result.failed,
        cancelled: result.cancelled,
        failedIds: result.failedIds || [],
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remove-collaborating-users-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : hasFailed
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Remoção cancelada'
            : hasFailed
            ? 'Remoção concluída com erros'
            : 'Colaboradores removidos com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Sucesso', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {hasFailed && (
          <div
            style={{
              textAlign: 'left',
              marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Registros com falha ({result.failedIds.length})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: '8px 12px',
                background: darkMode ? '#120125' : '#fafafa',
              }}
            >
              {result.failedIds.map(({ id, status, message }) => (
                <div
                  key={id}
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: 4, color: '#ef4444' }}
                >
                  ID {id} — {status} — {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {hasFailed && (
            <Button
              label="Baixar relatório JSON"
              icon="pi pi-download"
              severity="secondary"
              onClick={downloadReport}
            />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── SLA Retroativo handlers ────────────────────────────────────

  async function handleLoadSlaPipelines() {
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    try {
      setSlaPipelinesLoading(true);
      setSlaSelectedPipeline(null);
      setSlaStagesList([]);
      setSlaMappings([]);
      const [pipelines, fields] = await Promise.all([
        fetchPipelines(userKey),
        fetchSlaRetroativoFields({ userKeyOverride: userKey }),
      ]);
      setSlaPipelinesList(pipelines);
      setSlaFieldsList(fields.fields || []);
      if (pipelines.length === 0) {
        showToast('info', 'Sem funis', 'Nenhum funil ativo encontrado na conta.');
      }
    } catch (err) {
      showToast('error', 'Erro ao carregar dados', err?.message || 'Falha ao buscar funis e campos.');
    } finally {
      setSlaPipelinesLoading(false);
    }
  }

  async function handleSelectSlaPipeline(pipeline) {
    setSlaSelectedPipeline(pipeline);
    setSlaStagesList([]);
    setSlaMappings([]);
    if (!pipeline) return;
    try {
      setSlaStagesLoading(true);
      const stages = await fetchStages(userKey, pipeline.Id);
      setSlaStagesList(stages);
      setSlaMappings(stages.map((s) => ({
        stageId: s.Id,
        stageName: s.Name,
        entryFieldKey: null,
        exitFieldKey: null,
      })));
    } catch (err) {
      showToast('error', 'Erro ao carregar estágios', err?.message || 'Falha ao buscar estágios.');
    } finally {
      setSlaStagesLoading(false);
    }
  }

  function parseSlaDealsIds(raw) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }

  async function handleExecuteSlaRetroativo() {
    const ids = parseSlaDealsIds(slaDealIdsInput);
    const validMappings = slaMappings.filter((m) => m.entryFieldKey || m.exitFieldKey);
    if (ids.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum ID de negócio válido encontrado.');
      return;
    }
    if (validMappings.length === 0) {
      showToast('warn', 'Atenção', 'Configure ao menos um estágio com campo de entrada ou saída.');
      return;
    }
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: ids.length, logs: [], success: 0, failed: 0 });

      const resp = await executeSlaRetroativo({
        userKeyOverride: userKey,
        dealIds: ids,
        fieldMappings: validMappings.map((m) => ({
          stageId: m.stageId,
          entryFieldKey: m.entryFieldKey || null,
          exitFieldKey: m.exitFieldKey || null,
        })),
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `SLA retroativo concluído${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao preencher SLA retroativo.');
    }
  }

  function renderSlaRetroativo() {
    if (executing) return renderProgressView('Preenchendo SLA retroativo...', 'Isso pode levar alguns minutos dependendo da quantidade de negócios');
    if (result) return renderSlaRetroativoResult();

    const action = READY_ACTIONS.find((a) => a.id === 'sla-retroativo');
    const parsedCount = parseSlaDealsIds(slaDealIdsInput).length;
    const validMappings = slaMappings.filter((m) => m.entryFieldKey || m.exitFieldKey);

    const fieldOptions = (slaFieldsList || []).map((f) => ({
      label: `${f.Name} (${f.Key})`,
      value: f.Key,
    }));
    const NULL_OPTION = { label: '— não preencher —', value: null };

    const fieldValueTemplate = (option) => (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
        {option ? option.label : <span style={{ opacity: 0.5 }}>Selecionar...</span>}
      </span>
    );

    const pipelineOptions = (slaPipelinesList || []).map((p) => ({
      label: p.Name,
      value: p,
    }));

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          {action.description}
        </p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        {/* Passo 1: Carregar funis e campos */}
        <div style={{ marginBottom: 16 }}>
          <strong>Passo 1:</strong> Carregar funis e campos de negócio
          <div style={{ marginTop: 8 }}>
            <AccentButton
              label={slaPipelinesLoading ? 'Carregando...' : slaPipelinesList ? `${slaPipelinesList.length} funil(is) carregado(s) — Recarregar` : 'Carregar funis e campos'}
              icon={slaPipelinesLoading ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
              onClick={handleLoadSlaPipelines}
              disabled={slaPipelinesLoading || !userKey?.trim()}
            />
          </div>
        </div>

        {/* Passo 2: Selecionar funil */}
        {slaPipelinesList && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 2:</strong> Selecionar funil
              <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Os estágios do funil serão carregados automaticamente para mapeamento.
              </p>
              <Dropdown
                value={slaSelectedPipeline}
                options={pipelineOptions}
                onChange={(e) => handleSelectSlaPipeline(e.value)}
                placeholder="Selecione um funil..."
                style={{ width: '100%' }}
                disabled={slaStagesLoading}
              />
              {slaStagesLoading && (
                <small style={{ display: 'block', marginTop: 6, opacity: 0.75 }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: 4 }} />
                  Carregando estágios...
                </small>
              )}
            </div>
          </>
        )}

        {/* Passo 3: Mapeamento estágio → campos */}
        {slaStagesList.length > 0 && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 3:</strong> Mapear campos de entrada e saída por estágio
              <p style={{ margin: '4px 0 10px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Para cada estágio, selecione o campo a ser preenchido com a data de entrada e/ou saída.
                Deixe "— não preencher —" para ignorar o estágio.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 1fr',
                  gap: '6px 8px',
                  alignItems: 'center',
                  marginBottom: 6,
                  padding: '4px 4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  opacity: 0.6,
                }}
              >
                <span>Estágio</span>
                <span>Campo entrada</span>
                <span>Campo saída</span>
              </div>

              {slaMappings.map((mapping, idx) => (
                <div
                  key={mapping.stageId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr 1fr',
                    gap: '6px 8px',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.875rem',
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: darkMode ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.07)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                    title={mapping.stageName}
                  >
                    {mapping.stageName}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <Dropdown
                      placeholder="Entrada"
                      value={mapping.entryFieldKey}
                      options={[NULL_OPTION, ...fieldOptions]}
                      onChange={(e) => {
                        const updated = [...slaMappings];
                        updated[idx] = { ...updated[idx], entryFieldKey: e.value };
                        setSlaMappings(updated);
                      }}
                      valueTemplate={fieldValueTemplate}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                      filter
                      filterPlaceholder="Buscar campo..."
                    />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <Dropdown
                      placeholder="Saída"
                      value={mapping.exitFieldKey}
                      options={[NULL_OPTION, ...fieldOptions]}
                      onChange={(e) => {
                        const updated = [...slaMappings];
                        updated[idx] = { ...updated[idx], exitFieldKey: e.value };
                        setSlaMappings(updated);
                      }}
                      valueTemplate={fieldValueTemplate}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                      filter
                      filterPlaceholder="Buscar campo..."
                    />
                  </div>
                </div>
              ))}

              {validMappings.length > 0 && (
                <small style={{ display: 'block', marginTop: 4, opacity: 0.75 }}>
                  <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
                  {validMappings.length} estágio(s) com campo configurado.
                </small>
              )}
            </div>

            <Divider />

            {/* Passo 4: IDs de negócios */}
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 4:</strong> Informe os IDs dos negócios
              <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Aceita IDs separados por vírgula, espaço ou quebra de linha.
              </p>
              <InputTextarea
                value={slaDealIdsInput}
                onChange={(e) => setSlaDealIdsInput(e.target.value)}
                rows={5}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
                placeholder={'123456\n789012\n345678'}
              />
              {parsedCount > 0 && (
                <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
                  <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
                  {parsedCount} ID{parsedCount !== 1 ? 's' : ''} reconhecido{parsedCount !== 1 ? 's' : ''}.
                </small>
              )}
            </div>

            <AccentButton
              label={`Executar${parsedCount > 0 ? ` em ${parsedCount} negócio${parsedCount !== 1 ? 's' : ''}` : ''}`}
              icon="pi pi-play"
              onClick={handleExecuteSlaRetroativo}
              disabled={parsedCount === 0 || validMappings.length === 0}
            />
          </>
        )}
      </>
    );
  }

  function renderSlaRetroativoResult() {
    const hasFailed = result.failedIds?.length > 0;

    function downloadReport() {
      const report = {
        readyAction: 'sla-retroativo',
        executedAt: new Date().toISOString(),
        total: result.total,
        success: result.success,
        failed: result.failed,
        cancelled: result.cancelled,
        failedIds: result.failedIds || [],
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sla-retroativo-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : hasFailed
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Preenchimento cancelado'
            : hasFailed
            ? 'SLA retroativo concluído com erros'
            : 'SLA retroativo preenchido com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Sucesso', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {hasFailed && (
          <div
            style={{
              textAlign: 'left',
              marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Negócios com falha ({result.failedIds.length})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: '8px 12px',
                background: darkMode ? '#120125' : '#fafafa',
              }}
            >
              {result.failedIds.map(({ id, status, message }) => (
                <div
                  key={id}
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: 4, color: '#ef4444' }}
                >
                  ID {id} — {status} — {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {hasFailed && (
            <Button
              label="Baixar relatório JSON"
              icon="pi pi-download"
              severity="secondary"
              onClick={downloadReport}
            />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Render: Lista de ações ─────────────────────────────────────

  // ── Concatenar nomes de usuários em massa ──────────────────────

  function parseUserIds(raw) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }

  async function handleBulkRenameUsers() {
    const ids = parseUserIds(renameUserIdsInput);
    if (ids.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum ID válido encontrado na lista.');
      return;
    }
    if (!renameText.trim()) {
      showToast('warn', 'Atenção', 'Informe o texto a ser concatenado.');
      return;
    }
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: ids.length, logs: [], success: 0, failed: 0 });

      const resp = await executeBulkRenameUsers({
        userKeyOverride: userKey,
        userIds: ids,
        text: renameText,
        position: renamePosition,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Concatenação de nomes concluída${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao concatenar nomes.');
    }
  }

  // ── Criação de usuários em massa ───────────────────────────────

  // Cabeçalhos aceitos (PT/EN, sem acento/caixa) → chave canônica do Ploomes.
  const CREATE_USERS_HEADER_MAP = {
    nome: 'Name', name: 'Name',
    email: 'Email', 'e-mail': 'Email', mail: 'Email',
    senha: 'Password', password: 'Password', pass: 'Password',
  };
  const CREATE_USERS_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function normHeader(h) {
    return String(h || '').trim().toLowerCase().replace(/^["']|["']$/g, '');
  }

  /**
   * Faz o parse da colagem em uma lista de { Name, Email, Password } (+ extras).
   * Aceita:
   *   1) JSON: array de objetos (chaves Name/Email/Password ou Nome/E-mail/Senha).
   *   2) Planilha: TSV/CSV com linha de cabeçalho contendo Nome, E-mail e Senha.
   * Retorna { rows, invalid, error } — rows já validadas; invalid com o motivo.
   */
  function parseCreateUsers(raw) {
    const text = String(raw || '').trim();
    if (!text) return { rows: [], invalid: [], error: null };

    let records = null;

    // 1) Tenta JSON primeiro (array de objetos).
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        records = arr.map((o) => {
          const out = {};
          for (const [k, v] of Object.entries(o || {})) {
            const canon = CREATE_USERS_HEADER_MAP[normHeader(k)];
            out[canon || k] = v;
          }
          return out;
        });
      } catch {
        return { rows: [], invalid: [], error: 'JSON inválido — verifique a estrutura colada.' };
      }
    }

    // 2) Planilha (TSV/CSV com cabeçalho).
    if (records === null) {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        return { rows: [], invalid: [], error: 'Cole ao menos o cabeçalho (Nome, E-mail, Senha) e uma linha de dados.' };
      }
      const delim = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
      const headers = lines[0].split(delim).map((h) => CREATE_USERS_HEADER_MAP[normHeader(h)] || normHeader(h));
      if (!headers.includes('Name') || !headers.includes('Email') || !headers.includes('Password')) {
        return { rows: [], invalid: [], error: 'Cabeçalho precisa conter as colunas Nome, E-mail e Senha.' };
      }
      records = lines.slice(1).map((line) => {
        const cells = line.split(delim);
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = (cells[idx] ?? '').trim().replace(/^["']|["']$/g, '');
        });
        return obj;
      });
    }

    // Valida cada registro.
    const rows = [];
    const invalid = [];
    records.forEach((rec, i) => {
      const Name = String(rec.Name ?? '').trim();
      const Email = String(rec.Email ?? '').trim();
      const Password = String(rec.Password ?? '');
      const reasons = [];
      if (!Name) reasons.push('nome vazio');
      if (!Email) reasons.push('e-mail vazio');
      else if (!CREATE_USERS_EMAIL_RE.test(Email)) reasons.push('e-mail inválido');
      if (!Password) reasons.push('senha vazia');
      if (reasons.length > 0) {
        invalid.push({ line: i + 1, email: Email || '(sem e-mail)', reason: reasons.join('; ') });
      } else {
        const { Name: _n, Email: _e, Password: _p, ...extra } = rec;
        rows.push({ ...extra, Name, Email, Password });
      }
    });

    return { rows, invalid, error: null };
  }

  async function handleCreateUsers() {
    const { rows, invalid, error } = parseCreateUsers(createUsersInput);
    if (error) {
      showToast('warn', 'Não foi possível ler os dados', error);
      return;
    }
    if (rows.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum usuário válido para criar.');
      return;
    }
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    if (invalid.length > 0) {
      showToast('info', 'Linhas ignoradas', `${invalid.length} linha(s) inválida(s) serão puladas.`);
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: rows.length, logs: [], success: 0, failed: 0 });

      const resp = await executeCreateUsers({
        userKeyOverride: userKey,
        users: rows,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Criação de usuários concluída${label}`,
        `Criados: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao criar usuários.');
    }
  }

  function renderCreateUsers() {
    if (executing) return renderProgressView('Criando usuários em massa...', 'Isso pode levar alguns minutos dependendo da quantidade de usuários');
    if (result) return renderCreateUsersResult();

    const action = READY_ACTIONS.find((a) => a.id === 'create-users');
    const { rows, invalid, error } = parseCreateUsers(createUsersInput);
    const canExecute = rows.length > 0 && !error && userKey?.trim();

    return (
      <>
        <Button label="Voltar" icon="pi pi-arrow-left" text onClick={resetState} style={{ marginBottom: 12 }} />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>{action.description}</p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        <div style={{ marginBottom: 8 }}>
          <strong>Cole a planilha ou um JSON</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            <strong>Planilha:</strong> copie do Excel/Sheets incluindo o cabeçalho com as colunas{' '}
            <code>Nome</code>, <code>E-mail</code> e <code>Senha</code>.{' '}
            <strong>JSON:</strong> um array de objetos com <code>Name</code>, <code>Email</code> e{' '}
            <code>Password</code> (ou Nome/E-mail/Senha). Campos extras (ex.: <code>ProfileId</code>) são enviados como estão.
          </p>
          <InputTextarea
            value={createUsersInput}
            onChange={(e) => setCreateUsersInput(e.target.value)}
            rows={9}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
            placeholder={'Nome\tE-mail\tSenha\nMaria Silva\tmaria@empresa.com\tSenha@2026\nJoão Souza\tjoao@empresa.com\tSenha@2026'}
            disabled={!userKey?.trim()}
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '6px 0 0' }}>
            <i className="pi pi-times-circle" style={{ marginRight: 6 }} />
            {error}
          </p>
        )}

        {!error && rows.length > 0 && (
          <small style={{ opacity: 0.8, display: 'block', marginTop: 6 }}>
            <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
            {rows.length} usuário(s) válido(s) reconhecido(s).
            {invalid.length > 0 && (
              <span style={{ color: '#f59e0b', marginLeft: 8 }}>
                {invalid.length} linha(s) inválida(s) serão ignoradas.
              </span>
            )}
          </small>
        )}

        {/* Prévia dos válidos (senha nunca exibida) */}
        {!error && rows.length > 0 && (
          <div
            style={{
              marginTop: 12, border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8, overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px', background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              Prévia — {rows.length} usuário(s) a criar
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', background: darkMode ? '#120125' : '#fafafa' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: darkMode ? '#1a0a2e' : '#f1f1f1' }}>
                    <th style={{ textAlign: 'left', padding: '6px 10px' }}>Nome</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px' }}>E-mail</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px' }}>Senha</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((u, idx) => (
                    <tr key={idx} style={{ borderTop: `1px solid ${darkMode ? '#2a1f3d' : '#eee'}` }}>
                      <td style={{ padding: '5px 10px' }}>{u.Name}</td>
                      <td style={{ padding: '5px 10px', fontFamily: 'monospace' }}>{u.Email}</td>
                      <td style={{ padding: '5px 10px', opacity: 0.6 }}>••••••••</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 200 && (
                <div style={{ padding: '6px 10px', fontSize: '0.78rem', opacity: 0.7 }}>
                  … e mais {rows.length - 200} usuário(s).
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detalhe das linhas inválidas */}
        {!error && invalid.length > 0 && (
          <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#f59e0b' }}>
            {invalid.slice(0, 5).map((iv) => (
              <div key={iv.line}>
                <i className="pi pi-exclamation-triangle" style={{ marginRight: 4 }} />
                Linha {iv.line} ({iv.email}): {iv.reason}
              </div>
            ))}
            {invalid.length > 5 && <div>… e mais {invalid.length - 5} linha(s) inválida(s).</div>}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <AccentButton
            label={`Criar ${rows.length > 0 ? rows.length + ' ' : ''}usuário${rows.length !== 1 ? 's' : ''}`}
            icon="pi pi-user-plus"
            onClick={handleCreateUsers}
            disabled={!canExecute}
          />
        </div>
      </>
    );
  }

  function renderCreateUsersResult() {
    const hasFailed = result.failed > 0;
    const rowsOut = result.auditRows || [];

    function downloadCsv() {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = 'Nome,Email,Status,Id,Detalhe';
      const lines = rowsOut.map((r) =>
        [esc(r.Name), esc(r.Email), esc(r.Status), esc(r.Id), esc(r.Detalhe)].join(',')
      );
      const csv = [header, ...lines].join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `criacao-usuarios-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16, color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e' }}>
          <i className={result.cancelled ? 'pi pi-exclamation-triangle' : hasFailed ? 'pi pi-exclamation-circle' : 'pi pi-check-circle'} />
        </div>
        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled ? 'Criação cancelada' : hasFailed ? 'Criação concluída com erros' : 'Usuários criados com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20, padding: 12,
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)', borderRadius: 8,
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Criados', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {result.failedItems?.length > 0 && (
          <div
            style={{
              textAlign: 'left', marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`, borderRadius: 8, overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px', background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`, fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              E-mails com falha ({result.failedItems.length})
            </div>
            <div style={{ maxHeight: 160, overflowY: 'auto', padding: '8px 12px', background: darkMode ? '#120125' : '#fafafa' }}>
              {result.failedItems.map((f, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: 4, color: '#ef4444' }}>
                  {f.email} — {f.status || '—'} — {f.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {rowsOut.length > 0 && (
            <Button label="Baixar relatório CSV" icon="pi pi-download" severity="secondary" onClick={downloadCsv} />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  function renderBulkRenameUsers() {
    if (executing) return renderProgressView('Concatenando nomes de usuários...', 'Isso pode levar alguns minutos dependendo da quantidade de usuários');
    if (result) return renderBulkRenameUsersResult();

    const action = READY_ACTIONS.find((a) => a.id === 'bulk-rename-users');
    const parsedCount = parseUserIds(renameUserIdsInput).length;
    const trimmedText = renameText.trim();

    // Prévia do resultado com um nome de exemplo
    const sampleName = 'Maria Silva';
    const previewName = trimmedText
      ? renamePosition === 'prefix'
        ? `${trimmedText} ${sampleName}`
        : `${sampleName} ${trimmedText}`
      : sampleName;

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          {action.description}
        </p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <strong>Texto a concatenar</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Um espaço é inserido automaticamente entre o texto e o nome.
          </p>
          <InputText
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            style={{ width: '100%' }}
            placeholder="Ex.: (Inativo)"
            disabled={!userKey?.trim()}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>Posição</strong>
          <Dropdown
            value={renamePosition}
            options={RENAME_POSITION_OPTIONS}
            onChange={(e) => setRenamePosition(e.value)}
            style={{ width: '100%', marginTop: 6 }}
            disabled={!userKey?.trim()}
          />
          {trimmedText && (
            <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
              Prévia: <code>{previewName}</code>
            </small>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>Cole os IDs dos usuários</strong>
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Aceita IDs separados por vírgula, espaço ou quebra de linha.
          </p>
          <InputTextarea
            value={renameUserIdsInput}
            onChange={(e) => setRenameUserIdsInput(e.target.value)}
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            placeholder={'123456\n789012\n345678'}
            disabled={!userKey?.trim()}
          />
          {parsedCount > 0 && (
            <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
              <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
              {parsedCount} ID{parsedCount !== 1 ? 's' : ''} reconhecido{parsedCount !== 1 ? 's' : ''}.
            </small>
          )}
        </div>

        <AccentButton
          label={`Concatenar${parsedCount > 0 ? ` em ${parsedCount} usuário${parsedCount !== 1 ? 's' : ''}` : ''}`}
          icon="pi pi-pencil"
          onClick={handleBulkRenameUsers}
          disabled={parsedCount === 0 || !trimmedText || !userKey?.trim()}
        />
      </>
    );
  }

  function renderBulkRenameUsersResult() {
    const hasFailed = result.failedIds?.length > 0;

    function downloadReport() {
      const report = {
        readyAction: 'bulk-rename-users',
        executedAt: new Date().toISOString(),
        text: result.text,
        position: result.position,
        total: result.total,
        success: result.success,
        skipped: result.skipped,
        failed: result.failed,
        cancelled: result.cancelled,
        auditRows: result.auditRows || [],
        failedIds: result.failedIds || [],
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-rename-users-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : hasFailed
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Concatenação cancelada'
            : hasFailed
            ? 'Concatenação concluída com erros'
            : 'Nomes concatenados com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Alterados', value: result.success, color: '#22c55e' },
            { label: 'Ignorados', value: result.skipped ?? 0, color: '#f59e0b' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {hasFailed && (
          <div
            style={{
              textAlign: 'left',
              marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              IDs com falha ({result.failedIds.length})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: '8px 12px',
                background: darkMode ? '#120125' : '#fafafa',
              }}
            >
              {result.failedIds.map(({ id, status, message }) => (
                <div
                  key={id}
                  style={{
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    marginBottom: 4,
                    color: '#ef4444',
                  }}
                >
                  ID {id} — {status} — {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <Button
            label="Baixar relatório JSON"
            icon="pi pi-download"
            severity="secondary"
            onClick={downloadReport}
          />
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  function renderActionList() {
    return (
      <>
        <p style={{ marginTop: 0, opacity: 0.85 }}>
          Selecione uma ação para executar. Todas as ações abaixo são restritas
          a administradores e requerem User-Key validada.
        </p>
        {READY_ACTIONS.map((action) => {
          const iconClass = TAG_ICONS[action.tagSeverity] || 'pi-bolt';
          return (
            <ActionCard
              key={action.id}
              $dark={darkMode}
              onClick={() => setSelectedAction(action.id)}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: darkMode ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.09)',
                    }}
                  >
                    <i
                      className={`pi ${iconClass}`}
                      style={{ fontSize: '1rem', color: 'var(--accent)' }}
                    />
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.97rem' }}>{action.title}</strong>
                    <Tag
                      value={action.tag}
                      severity={action.tagSeverity}
                      style={{ marginLeft: 8, verticalAlign: 'middle', fontSize: '0.72rem' }}
                    />
                  </div>
                </div>
                <Button
                  label="Selecionar"
                  icon="pi pi-arrow-right"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAction(action.id);
                  }}
                  text
                  size="small"
                />
              </div>
              <p
                style={{ margin: '10px 0 0 0', opacity: 0.8, fontSize: '0.88rem' }}
              >
                {action.description}
              </p>
            </ActionCard>
          );
        })}
      </>
    );
  }

  // ── Render: Fluxo de deleção de cidades ────────────────────────

  function renderDeleteNonNativeCities() {
    if (executing) return renderProgressView();
    if (result) return renderResultView();

    const action = READY_ACTIONS.find(
      (a) => a.id === 'delete-non-native-cities'
    );

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p
          style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}
        >
          {action.description}
        </p>

        <WarningBox $dark={darkMode}>
          <i
            className="pi pi-exclamation-triangle"
            style={{ marginRight: 8 }}
          />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        {/* Passo 1: Buscar cidades */}
        <div style={{ marginBottom: 16 }}>
          <strong>Passo 1:</strong> Buscar cidades não nativas
          <div style={{ marginTop: 8 }}>
            <AccentButton
              label={scanning ? 'Buscando...' : 'Buscar cidades'}
              icon={scanning ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
              onClick={handleScan}
              disabled={scanning || !userKey?.trim()}
            />
          </div>

          {scanResult && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: darkMode
                  ? 'rgba(168, 85, 247, 0.1)'
                  : 'rgba(139, 92, 246, 0.08)',
                border: `1px solid ${darkMode ? '#5b3cc4' : '#c9bbff'}`,
              }}
            >
              {scanResult.total === 0 ? (
                <span style={{ opacity: 0.8 }}>
                  <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 6 }} />
                  Nenhuma cidade não nativa encontrada.
                </span>
              ) : (
                <>
                  <strong
                    style={{ fontSize: '1.1rem', color: 'var(--accent)' }}
                  >
                    {scanResult.total}
                  </strong>{' '}
                  cidades não nativas encontradas.
                </>
              )}
            </div>
          )}
        </div>

        {/* Passo 2+3: Confirmar e Executar (só se scan > 0) */}
        {scanResult && scanResult.total > 0 && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 2:</strong> Confirmar exportação
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <Checkbox
                  inputId="exportCheck"
                  onChange={(e) => setExportConfirmed(e.checked)}
                  checked={exportConfirmed}
                />
                {/* Exigir confirmação antes de deletar — após a deleção o cliente precisará corrigir a base */}
                <label htmlFor="exportCheck" style={{ cursor: 'pointer' }}>
                  Confirmo que o cliente já exportou a planilha de clientes com
                  as cidades.
                </label>
              </div>
            </div>

            <Divider />
            <div>
              <strong>Passo 3:</strong> Executar deleção
              <div style={{ marginTop: 8 }}>
                <AccentButton
                  label={`Executar deleção de ${scanResult.total} cidades`}
                  icon="pi pi-trash"
                  onClick={handleExecute}
                  disabled={!exportConfirmed}
                  style={
                    exportConfirmed
                      ? {
                          backgroundColor: '#dc2626',
                          borderColor: '#dc2626',
                        }
                      : undefined
                  }
                />
              </div>
              {!exportConfirmed && (
                <small
                  style={{ opacity: 0.7, display: 'block', marginTop: 6 }}
                >
                  Marque a confirmação acima para habilitar o botão.
                </small>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  // ── Render: Progresso (durante execução) ───────────────────────

  function renderProgressView(title = 'Deletando cidades não nativas...', subtitle = 'Isso pode levar alguns minutos dependendo da quantidade de cidades') {
    const pct =
      progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            opacity: 0.8,
            color: 'var(--accent)',
          }}
        >
          <i className="pi pi-spin pi-spinner" />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {title}
        </h3>
        <p style={{ opacity: 0.8, margin: '0 0 16px 0', fontSize: '1rem' }}>
          Aguarde enquanto o processo é executado.
        </p>

        {/* Grid de métricas — mesmo layout do bulk progress existente */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px',
            background: darkMode
              ? 'rgba(168, 85, 247, 0.1)'
              : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginBottom: '4px',
              }}
            >
              Processados
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              {progress.current}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              de {progress.total}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginBottom: '4px',
              }}
            >
              Sucesso
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#22c55e',
              }}
            >
              {progress.success}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              {progress.total > 0
                ? `${Math.round(
                    (progress.success / progress.total) * 100
                  )}%`
                : '0%'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginBottom: '4px',
              }}
            >
              Falhas
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ef4444',
              }}
            >
              {progress.failed}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              {progress.total > 0
                ? `${Math.round(
                    (progress.failed / progress.total) * 100
                  )}%`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '0.85rem',
          }}
        >
          <span style={{ fontWeight: 600 }}>Progresso geral:</span>
          <span style={{ opacity: 0.9 }}>{pct}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: 'var(--surface-border)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: 'var(--accent)',
              width: `${pct}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <small
          style={{ opacity: 0.6, display: 'block', marginBottom: '10px' }}
        >
          {subtitle}
        </small>

        <Button
          label={cancelling ? 'Cancelando...' : 'Cancelar'}
          icon={cancelling ? 'pi pi-spin pi-spinner' : 'pi pi-times'}
          severity="danger"
          onClick={handleCancel}
          disabled={!jobId || cancelling}
          style={{ marginBottom: '10px' }}
        />

        {/* Logs */}
        {progress.logs.length > 0 && renderLogsSection(progress.logs, 10)}
      </div>
    );
  }

  // ── Render: Resultado final ────────────────────────────────────

  function renderResultView() {
    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled
              ? '#f59e0b'
              : result.failed > 0
              ? '#ef4444'
              : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : result.failed > 0
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Deleção cancelada'
            : result.failed > 0
            ? 'Deleção finalizada com erros'
            : 'Deleção concluída com sucesso'}
        </h3>

        {/* Stats finais */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode
              ? 'rgba(168, 85, 247, 0.1)'
              : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginBottom: '4px',
              }}
            >
              Total
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              {result.total}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginBottom: '4px',
              }}
            >
              Sucesso
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#22c55e',
              }}
            >
              {result.success}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginBottom: '4px',
              }}
            >
              Falhas
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ef4444',
              }}
            >
              {result.failed}
            </div>
          </div>
        </div>

        {/* Logs finais (mostra últimos 20) */}
        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            marginTop: 16,
          }}
        >
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Render: Logs de execução (reutilizado nas views de progresso e resultado) ──

  function renderLogsSection(logs, lastN) {
    return (
      <div
        style={{
          marginTop: '20px',
          border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
          borderRadius: '8px',
          overflow: 'hidden',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            background: darkMode ? '#1a0a2e' : '#f9f9f9',
            borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontSize: '0.9rem' }}>
            Logs de Execução ({logs.length})
          </strong>
          <small style={{ opacity: 0.7 }}>
            Últimos {lastN} registros
          </small>
        </div>
        <div
          style={{
            padding: '10px 12px',
            background: darkMode ? '#120125' : '#fafafa',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {logs.slice(-lastN).map((log, idx) => {
            const isSuccess = log.includes('✓');
            const isError = log.includes('✗');
            return (
              <div
                key={idx}
                style={{
                  fontSize: '0.8rem',
                  marginBottom: '6px',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  background: isSuccess
                    ? darkMode
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(34, 197, 94, 0.05)'
                    : isError
                    ? darkMode
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(239, 68, 68, 0.05)'
                    : 'transparent',
                  color: isSuccess
                    ? '#22c55e'
                    : isError
                    ? '#ef4444'
                    : 'inherit',
                  borderLeft: `3px solid ${
                    isSuccess
                      ? '#22c55e'
                      : isError
                      ? '#ef4444'
                      : 'transparent'
                  }`,
                  paddingLeft: '10px',
                }}
              >
                {log}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>
    );
  }

  // ── Restrict Option Fields ─────────────────────────────────────

  async function handleLoadProfiles() {
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    try {
      setProfilesLoading(true);
      const data = await fetchRestrictOptionFieldsProfiles({ userKeyOverride: userKey });
      setProfilesList(data.profiles || []);
      // pré-selecionar todos os perfis
      setSelectedProfileIds((data.profiles || []).map((p) => p.Id));
    } catch (err) {
      showToast('error', 'Erro ao carregar perfis', err?.message || 'Falha ao buscar perfis.');
    } finally {
      setProfilesLoading(false);
    }
  }

  function toggleProfile(id) {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleRestrictOptionFields() {
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    if (selectedProfileIds.length === 0) {
      showToast('warn', 'Atenção', 'Selecione ao menos um perfil antes de executar.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: 0, logs: [], success: 0, failed: 0 });

      const resp = await executeRestrictOptionFields({
        userKeyOverride: userKey,
        profileIds: selectedProfileIds,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Restrição de campos concluída${label}`,
        `Sucesso: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao restringir campos.');
    }
  }

  function renderRestrictOptionFields() {
    if (executing) return renderProgressView('Restringindo campos de opções...', 'Isso pode levar alguns minutos dependendo da quantidade de campos');
    if (result) return renderRestrictOptionFieldsResult();

    const action = READY_ACTIONS.find((a) => a.id === 'restrict-option-fields');

    return (
      <>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          text
          onClick={resetState}
          style={{ marginBottom: 12 }}
        />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          Atualiza todos os campos de opções pré-cadastradas (TypeId = 7) da conta,
          definindo quais perfis podem criar novas opções.
        </p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        {/* Etapa: selecionar perfis */}
        {profilesList === null ? (
          <Button
            label="Carregar perfis da conta"
            icon={profilesLoading ? 'pi pi-spin pi-spinner' : 'pi pi-users'}
            onClick={handleLoadProfiles}
            disabled={!userKey?.trim() || profilesLoading}
            severity="secondary"
          />
        ) : (
          <>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem' }}>
              Selecione os perfis que terão permissão para criar novas opções:
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '10px 14px',
                background: darkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(139, 92, 246, 0.06)',
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {profilesList.map((profile) => (
                <div
                  key={profile.Id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  <Checkbox
                    inputId={`profile-${profile.Id}`}
                    checked={selectedProfileIds.includes(profile.Id)}
                    onChange={() => toggleProfile(profile.Id)}
                  />
                  <label
                    htmlFor={`profile-${profile.Id}`}
                    style={{ cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    {profile.Name}
                    <span style={{ opacity: 0.5, marginLeft: 6, fontSize: '0.78rem' }}>
                      (id: {profile.Id})
                    </span>
                  </label>
                </div>
              ))}
            </div>
            {selectedProfileIds.length === 0 && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
                <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
                Selecione ao menos um perfil.
              </p>
            )}
            <AccentButton
              label="Executar restrição de campos"
              icon="pi pi-lock"
              onClick={handleRestrictOptionFields}
              disabled={selectedProfileIds.length === 0}
            />
          </>
        )}
      </>
    );
  }

  function renderRestrictOptionFieldsResult() {
    const hasFailed = result.failedItems?.length > 0;

    function downloadReport() {
      const report = {
        readyAction: 'restrict-option-fields',
        executedAt: new Date().toISOString(),
        total: result.total,
        success: result.success,
        failed: result.failed,
        cancelled: result.cancelled,
        failedItems: result.failedItems || [],
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restrict-option-fields-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : hasFailed
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Restrição de campos cancelada'
            : hasFailed
            ? 'Restrição de campos concluída com erros'
            : 'Campos restritos com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Sucesso', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {hasFailed && (
          <div
            style={{
              textAlign: 'left',
              marginBottom: 16,
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: darkMode ? '#1a0a2e' : '#f9f9f9',
                borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Campos com falha ({result.failedItems.length})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: '8px 12px',
                background: darkMode ? '#120125' : '#fafafa',
              }}
            >
              {result.failedItems.map(({ key, name, status, message }) => (
                <div
                  key={key}
                  style={{
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    marginBottom: 4,
                    color: '#ef4444',
                  }}
                >
                  {name} ({key}) — {status} — {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {hasFailed && (
            <Button
              label="Baixar relatório JSON"
              icon="pi pi-download"
              severity="secondary"
              onClick={downloadReport}
            />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Unify Duplicate Fields handlers ────────────────────────────

  function getUnifySelection() {
    const fields = unifyFields || [];
    return {
      sourceField: fields.find((f) => f.key === unifySourceKey) || null,
      targetField: fields.find((f) => f.key === unifyTargetKey) || null,
    };
  }

  async function handleLoadUnifyFields() {
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    const entityOpt = UNIFY_ENTITY_OPTIONS.find((e) => e.value === unifyEntity);
    if (!entityOpt) {
      showToast('warn', 'Atenção', 'Selecione a entidade antes de carregar os campos.');
      return;
    }
    try {
      setUnifyFieldsLoading(true);
      setUnifyFields(null);
      setUnifySourceKey(null);
      setUnifyTargetKey(null);
      setUnifyPreview(null);
      const resp = await fetchFieldsByEntity({ userKey, entityId: entityOpt.entityId, page: 1, pageSize: 500 });
      const eligible = (resp.data || []).filter((f) => unifyValueColumn(f.typeId));
      setUnifyFields(eligible);
      if (eligible.length === 0) {
        showToast('info', 'Sem campos elegíveis', 'Nenhum campo de valor simples (texto, número, data, sim/não) encontrado nesta entidade.');
      }
    } catch (err) {
      showToast('error', 'Erro ao carregar campos', err?.message || 'Falha ao buscar campos.');
    } finally {
      setUnifyFieldsLoading(false);
    }
  }

  async function handlePreviewUnify() {
    const { sourceField, targetField } = getUnifySelection();
    if (!unifyEntity || !sourceField || !targetField || !userKey?.trim()) return;
    try {
      setUnifyPreviewLoading(true);
      setUnifyPreview(null);
      const resp = await previewUnifyDuplicateFields({
        userKeyOverride: userKey,
        entity: unifyEntity,
        sourceFieldId: sourceField.id,
        sourceFieldKey: sourceField.key,
        sourceTypeId: sourceField.typeId,
        targetFieldId: targetField.id,
        targetFieldKey: targetField.key,
        targetTypeId: targetField.typeId,
      });
      setUnifyPreview(resp);
      showToast('success', 'Prévia concluída', `${resp.count} registro(s) candidatos à atualização.`);
    } catch (err) {
      showToast('error', 'Erro na prévia', err?.message || 'Falha ao contar registros.');
    } finally {
      setUnifyPreviewLoading(false);
    }
  }

  async function handleExecuteUnify() {
    const { sourceField, targetField } = getUnifySelection();
    if (!unifyEntity || !sourceField || !targetField || !unifyPreview || !userKey?.trim()) return;
    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: unifyPreview.count || 0, logs: [], success: 0, failed: 0 });

      const resp = await executeUnifyDuplicateFields({
        userKeyOverride: userKey,
        entity: unifyEntity,
        sourceFieldId: sourceField.id,
        sourceFieldKey: sourceField.key,
        sourceTypeId: sourceField.typeId,
        targetFieldId: targetField.id,
        targetFieldKey: targetField.key,
        targetTypeId: targetField.typeId,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Unificação concluída${label}`,
        `Copiados: ${resp.success} | Ignorados: ${resp.skipped} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao unificar campos.');
    }
  }

  function renderUnifyDuplicateFields() {
    if (executing) return renderProgressView('Unificando campos duplicados...', 'Isso pode levar alguns minutos dependendo da quantidade de registros');
    if (result) return renderUnifyDuplicateFieldsResult();

    const action = READY_ACTIONS.find((a) => a.id === 'unify-duplicate-fields');
    const { sourceField, targetField } = getUnifySelection();
    const differentFields = sourceField && targetField && sourceField.id !== targetField.id;
    const sameColumn =
      sourceField && targetField &&
      unifyValueColumn(sourceField.typeId) === unifyValueColumn(targetField.typeId);
    const canPreview = !!(unifyEntity && sourceField && targetField && differentFields && sameColumn);

    const fieldOptions = (unifyFields || []).map((f) => ({
      label: `${f.name} · ${f.key} · id ${f.id} · ${UNIFY_TYPE_LABEL[f.typeId] || 'tipo ' + f.typeId}`,
      value: f.key,
    }));
    const fieldValueTemplate = (option) => (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
        {option ? option.label : <span style={{ opacity: 0.5 }}>Selecionar...</span>}
      </span>
    );

    return (
      <>
        <Button label="Voltar" icon="pi pi-arrow-left" text onClick={resetState} style={{ marginBottom: 12 }} />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>{action.description}</p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        {/* Passo 1: entidade */}
        <div style={{ marginBottom: 16 }}>
          <strong>Passo 1:</strong> Selecionar a entidade
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            A unificação ocorre nos campos personalizados (OtherProperties) da entidade escolhida.
          </p>
          <Dropdown
            value={unifyEntity}
            options={UNIFY_ENTITY_OPTIONS}
            onChange={(e) => {
              setUnifyEntity(e.value);
              setUnifyFields(null);
              setUnifySourceKey(null);
              setUnifyTargetKey(null);
              setUnifyPreview(null);
            }}
            placeholder="Selecione a entidade..."
            style={{ width: '100%' }}
            disabled={!userKey?.trim()}
          />
        </div>

        {/* Passo 2: carregar campos */}
        {unifyEntity && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 2:</strong> Carregar campos da entidade
              <div style={{ marginTop: 8 }}>
                <AccentButton
                  label={unifyFieldsLoading ? 'Carregando...' : unifyFields ? `${unifyFields.length} campo(s) elegível(is) — Recarregar` : 'Carregar campos'}
                  icon={unifyFieldsLoading ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
                  onClick={handleLoadUnifyFields}
                  disabled={unifyFieldsLoading || !userKey?.trim()}
                />
              </div>
            </div>
          </>
        )}

        {/* Passo 3: origem/destino */}
        {unifyFields && unifyFields.length > 0 && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 3:</strong> Escolher campo origem e destino
              <p style={{ margin: '4px 0 10px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                O valor da ORIGEM será copiado para o DESTINO apenas onde o destino estiver vazio. Os dois campos devem ter tipos de valor compatíveis.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: 4 }}>Campo origem (duplicado)</label>
                  <Dropdown
                    value={unifySourceKey}
                    options={fieldOptions}
                    onChange={(e) => { setUnifySourceKey(e.value); setUnifyPreview(null); }}
                    placeholder="Origem..."
                    valueTemplate={fieldValueTemplate}
                    style={{ width: '100%' }}
                    filter
                    filterPlaceholder="Buscar campo..."
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: 4 }}>Campo destino (correto)</label>
                  <Dropdown
                    value={unifyTargetKey}
                    options={fieldOptions}
                    onChange={(e) => { setUnifyTargetKey(e.value); setUnifyPreview(null); }}
                    placeholder="Destino..."
                    valueTemplate={fieldValueTemplate}
                    style={{ width: '100%' }}
                    filter
                    filterPlaceholder="Buscar campo..."
                  />
                </div>
              </div>

              {sourceField && targetField && !differentFields && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '10px 0 0 0' }}>
                  <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
                  Origem e destino não podem ser o mesmo campo.
                </p>
              )}
              {sourceField && targetField && differentFields && !sameColumn && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '10px 0 0 0' }}>
                  <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
                  Tipos incompatíveis ({UNIFY_TYPE_LABEL[sourceField.typeId]} × {UNIFY_TYPE_LABEL[targetField.typeId]}). Escolha campos do mesmo tipo de valor.
                </p>
              )}
            </div>

            {/* Passo 4: prévia */}
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 4:</strong> Pré-visualizar
              <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Conta quantos registros têm origem preenchida e destino vazio. Obrigatório antes de executar.
              </p>
              <AccentButton
                label={unifyPreviewLoading ? 'Calculando...' : 'Pré-visualizar contagem'}
                icon={unifyPreviewLoading ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
                onClick={handlePreviewUnify}
                disabled={!canPreview || unifyPreviewLoading}
              />
              {unifyPreview && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                    border: `1px solid ${darkMode ? '#5b3cc4' : '#c9bbff'}`,
                  }}
                >
                  {unifyPreview.count === 0 ? (
                    <span style={{ opacity: 0.8 }}>
                      <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 6 }} />
                      Nenhum registro a atualizar com este de-para.
                    </span>
                  ) : (
                    <>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{unifyPreview.count}</strong>{' '}
                      registro(s) candidatos (estimativa — a execução reconfirma item a item).
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Passo 5: executar */}
            {unifyPreview && unifyPreview.count > 0 && (
              <>
                <Divider />
                <div>
                  <strong>Passo 5:</strong> Executar
                  <div style={{ marginTop: 8 }}>
                    <AccentButton
                      label={`Executar unificação em ${unifyEntity}`}
                      icon="pi pi-play"
                      onClick={handleExecuteUnify}
                      disabled={!canPreview || executing}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </>
    );
  }

  function renderUnifyDuplicateFieldsResult() {
    const entityName = result.entity || 'Entidade';
    const hasAudit = (result.auditRows?.length || 0) > 0;

    function downloadCsv() {
      const header = `${entityName}Id,Valor,Acao,Detalhe`;
      const rows = (result.auditRows || []).map((r) => {
        const valor = String(r.Valor ?? '').replace(/"/g, '""');
        const detalhe = String(r.Detalhe ?? '').replace(/"/g, '""');
        return `${r.EntityId},"${valor}","${r.Acao}","${detalhe}"`;
      });
      const csv = [header, ...rows].join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unificar-campos-${entityName}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : result.failed > 0 ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : result.failed > 0
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Unificação cancelada'
            : result.failed > 0
            ? 'Unificação concluída com erros'
            : 'Unificação concluída com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Copiados', value: result.success, color: '#22c55e' },
            { label: 'Ignorados', value: result.skipped, color: '#f59e0b' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {hasAudit && (
            <Button label="Baixar CSV de auditoria" icon="pi pi-download" severity="secondary" onClick={downloadCsv} />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Bulk Find & Replace handlers ───────────────────────────────

  function getFrField() {
    return (frFields || []).find((f) => f.key === frFieldKey) || null;
  }

  function parseFrIds(raw) {
    return raw
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }

  function updateFrReplacement(idx, patch) {
    setFrReplacements((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setFrPreviewData(null);
  }
  function addFrReplacement() {
    setFrReplacements((prev) => [...prev, { find: '', replace: '' }]);
    setFrPreviewData(null);
  }
  function removeFrReplacement(idx) {
    setFrReplacements((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    setFrPreviewData(null);
  }

  async function handleLoadFrFields() {
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    const entityOpt = FR_ENTITY_OPTIONS.find((e) => e.value === frEntity);
    if (!entityOpt) {
      showToast('warn', 'Atenção', 'Selecione a entidade antes de carregar os campos.');
      return;
    }
    try {
      setFrFieldsLoading(true);
      setFrFields(null);
      setFrFieldKey(null);
      setFrTypeFilter(null);
      // Endpoint dedicado a esta ação — filtra por Entity/Id (propriedade de navegação), o mesmo
      // padrão usado pela página de Changelog global. Não reaproveita fetchFieldsByEntity.
      const resp = await fetchBulkFindReplaceFields({ userKeyOverride: userKey, entityId: entityOpt.entityId });
      const all = resp.fields || [];
      setFrFields(all);
      if (all.length === 0) {
        showToast('info', 'Sem campos', 'Nenhum campo encontrado nesta entidade.');
      }
    } catch (err) {
      showToast('error', 'Erro ao carregar campos', err?.message || 'Falha ao buscar campos.');
    } finally {
      setFrFieldsLoading(false);
    }
  }

  /**
   * Valida campo/substituições/seleção e devolve o payload pronto para preview ou execute.
   * Retorna null (com toast de erro) se algo estiver faltando — evita duplicar as mesmas
   * validações nos dois handlers.
   */
  function buildFrPayloadOrWarn() {
    const field = getFrField();
    if (!frEntity || !field || !userKey?.trim()) return null;

    const replacements = frReplacements
      .map((r) => ({ find: String(r.find || ''), replace: String(r.replace || '') }))
      .filter((r) => r.find);
    if (replacements.length === 0) {
      showToast('warn', 'Atenção', 'Informe ao menos um padrão de busca.');
      return null;
    }
    // valida regex client-side para feedback imediato
    for (const r of replacements) {
      try {
        new RegExp(r.find, 'g');
      } catch (e) {
        showToast('error', 'Regex inválida', `"${r.find}": ${e.message}`);
        return null;
      }
    }

    const ids = frSelectionMode === 'ids' ? parseFrIds(frIdsInput) : [];
    const filter = frSelectionMode === 'filter' ? frFilterInput.trim() : '';
    if (frSelectionMode === 'ids' && ids.length === 0) {
      showToast('warn', 'Atenção', 'Cole ao menos um ID válido.');
      return null;
    }
    if (frSelectionMode === 'filter' && !filter) {
      showToast('warn', 'Atenção', 'Informe um filtro OData.');
      return null;
    }

    return {
      field: {
        id: field.id,
        key: field.key,
        name: field.name,
        typeId: field.typeId, // backend mapeia a coluna de valor por TypeId
        dynamic: field.dynamic,
        propertyName: field.propertyName,
        updatePropertyName: field.updatePropertyName,
      },
      replacements,
      ids,
      filter,
    };
  }

  /**
   * Prévia obrigatória: NÃO grava nada. Busca o valor atual de cada registro selecionado e calcula
   * como ficaria após os de-paras — é o substituições (regex) que decide, registro a registro, o que
   * de fato seria alterado (itens sem match no padrão aparecem como "sem alteração").
   */
  async function handlePreviewFindReplace() {
    const payload = buildFrPayloadOrWarn();
    if (!payload) return;

    try {
      setFrPreviewing(true);
      setFrPreviewData(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: payload.ids.length || 0, logs: [], success: 0, failed: 0 });

      const resp = await previewBulkFindReplace({
        userKeyOverride: userKey,
        entity: frEntity,
        ...payload,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setFrPreviewData(resp);
      setFrPreviewing(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : resp.changed > 0 ? 'success' : 'info',
        `Prévia concluída${label}`,
        `Seriam alterados: ${resp.changed} | Sem alteração: ${resp.unchanged} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setFrPreviewing(false);
      setJobId(null);
      showToast('error', 'Erro na prévia', err?.message || 'Falha ao pré-visualizar.');
    }
  }

  async function handleExecuteFindReplace() {
    if (!frPreviewData || frPreviewData.changed === 0) return; // exige prévia com ao menos 1 alteração

    const payload = buildFrPayloadOrWarn();
    if (!payload) return;

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: payload.ids.length || 0, logs: [], success: 0, failed: 0 });

      const resp = await executeBulkFindReplace({
        userKeyOverride: userKey,
        entity: frEntity,
        ...payload,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Substituição concluída${label}`,
        `Alterados: ${resp.success} | Sem alteração: ${resp.skipped} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao substituir.');
    }
  }

  function renderBulkFindReplace() {
    if (executing) return renderProgressView('Substituindo conteúdo em massa...', 'Isso pode levar alguns minutos dependendo da quantidade de registros');
    if (frPreviewing) return renderProgressView('Pré-visualizando substituições...', 'Buscando o valor atual de cada registro selecionado — nenhuma alteração é salva nesta etapa');
    if (result) return renderBulkFindReplaceResult();

    const action = READY_ACTIONS.find((a) => a.id === 'bulk-find-replace');
    const field = getFrField();

    // Filtro de tipo do Passo 3 — agrupado por TypeId (não por string de rótulo, que poderia colidir).
    const frFieldsList = frFields || [];
    const frTextCount = frFieldsList.filter(frIsEligibleField).length; // Texto simples + multilinha
    const frTypeIdsPresent = Array.from(new Set(frFieldsList.map((f) => Number(f.typeId))))
      .sort((a, b) => frFieldTypeLabel({ typeId: a }).localeCompare(frFieldTypeLabel({ typeId: b }), 'pt-BR'));
    const frTypeFilterOptions = [
      { label: `Todos os tipos (${frFieldsList.length})`, value: null },
      ...(frTextCount > 0 ? [{ label: `★ Somente texto editável (${frTextCount})`, value: 'text' }] : []),
      ...frTypeIdsPresent.map((tid) => ({
        label: `${frFieldTypeLabel({ typeId: tid })} (${frFieldsList.filter((f) => Number(f.typeId) === tid).length})`,
        value: tid,
      })),
    ];

    const fieldsForOptions = frTypeFilter == null
      ? frFieldsList
      : frTypeFilter === 'text'
        ? frFieldsList.filter(frIsEligibleField)
        : frFieldsList.filter((f) => Number(f.typeId) === frTypeFilter);
    // Campos de texto (editáveis) primeiro, depois por nome — garante que Texto e Multilinha
    // apareçam no topo da lista, nunca escondidos no meio de dezenas de campos não editáveis.
    const fieldOptions = [...fieldsForOptions]
      .sort((a, b) => {
        const ea = frIsEligibleField(a) ? 0 : 1;
        const eb = frIsEligibleField(b) ? 0 : 1;
        if (ea !== eb) return ea - eb;
        return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
      })
      .map((f) => {
        const eligible = frIsEligibleField(f);
        return {
          label: `${f.name} · ${f.dynamic ? 'personalizado' : 'nativo'} · ${frFieldTypeLabel(f)}${eligible ? '' : ' · não editável'}`,
          value: f.key,
          disabled: !eligible,
        };
      });
    const fieldValueTemplate = (option) => (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
        {option ? option.label : <span style={{ opacity: 0.5 }}>Selecionar...</span>}
      </span>
    );

    const validReplacements = frReplacements.filter((r) => String(r.find || '').trim());
    const idsCount = frSelectionMode === 'ids' ? parseFrIds(frIdsInput).length : 0;
    const selectionReady =
      frSelectionMode === 'ids' ? idsCount > 0 : !!frFilterInput.trim();
    const canPreview = !!(frEntity && field && validReplacements.length > 0 && selectionReady && userKey?.trim());
    const canExecute = canPreview && !!frPreviewData && frPreviewData.changed > 0;

    return (
      <>
        <Button label="Voltar" icon="pi pi-arrow-left" text onClick={resetState} style={{ marginBottom: 12 }} />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>{action.description}</p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        {/* Passo 1: entidade */}
        <div style={{ marginBottom: 16 }}>
          <strong>Passo 1:</strong> Selecionar a entidade
          <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
            A substituição é aplicada a um campo (nativo ou personalizado) da entidade escolhida —
            apenas campos de texto podem ser efetivamente alterados.
          </p>
          <Dropdown
            value={frEntity}
            options={FR_ENTITY_OPTIONS}
            onChange={(e) => {
              setFrEntity(e.value);
              setFrFields(null);
              setFrTypeFilter(null);
              setFrFieldKey(null);
              setFrPreviewData(null);
            }}
            placeholder="Selecione a entidade..."
            style={{ width: '100%' }}
            disabled={!userKey?.trim()}
          />
        </div>

        {/* Passo 2: carregar campos */}
        {frEntity && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 2:</strong> Carregar campos da entidade
              <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Busca <strong>todos</strong> os campos da entidade (nativos e personalizados, de qualquer
                tipagem). Campos de <strong>Texto simples</strong> e <strong>Texto multilinha</strong> ficam
                disponíveis para edição; os demais aparecem listados, porém bloqueados.
              </p>
              <div style={{ marginTop: 8 }}>
                <AccentButton
                  label={frFieldsLoading ? 'Carregando...' : frFields ? `${frFields.length} campo(s) carregado(s) — Recarregar` : 'Carregar campos'}
                  icon={frFieldsLoading ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
                  onClick={handleLoadFrFields}
                  disabled={frFieldsLoading || !userKey?.trim()}
                />
              </div>
              {frFields && (
                <small style={{ opacity: 0.75, display: 'block', marginTop: 8 }}>
                  <i className="pi pi-check-circle" style={{ marginRight: 6, color: '#22c55e' }} />
                  {frFields.length} campo(s) na entidade · <strong>{frTextCount}</strong> de texto editável(is)
                  {frTextCount === 0 && ' — esta entidade não possui campos de texto para substituição.'}
                </small>
              )}
            </div>
          </>
        )}

        {/* Passo 3: escolher campo */}
        {frFields && frFields.length > 0 && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 3:</strong> Escolher o campo a editar
              <div style={{ marginTop: 8, marginBottom: 10 }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: 4 }}>
                  Filtrar por tipo
                </label>
                <Dropdown
                  value={frTypeFilter}
                  options={frTypeFilterOptions}
                  onChange={(e) => { setFrTypeFilter(e.value); setFrFieldKey(null); setFrPreviewData(null); }}
                  style={{ width: '100%' }}
                />
              </div>
              <Dropdown
                value={frFieldKey}
                options={fieldOptions}
                onChange={(e) => { setFrFieldKey(e.value); setFrPreviewData(null); }}
                placeholder="Campo..."
                valueTemplate={fieldValueTemplate}
                style={{ width: '100%' }}
                filter
                filterPlaceholder="Buscar campo..."
                emptyFilterMessage="Nenhum campo encontrado"
              />
              <small style={{ opacity: 0.7, display: 'block', marginTop: 6 }}>
                Campos de texto vêm primeiro na lista. Os marcados como "não editável" não podem ser usados
                aqui — só <strong>Texto simples</strong> e <strong>Texto multilinha</strong> são elegíveis.
              </small>
            </div>
          </>
        )}

        {/* Campo selecionado não é de texto — bloqueia avanço (defensivo; a UI já desabilita a opção) */}
        {field && !frIsEligibleField(field) && (
          <>
            <Divider />
            <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
              <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
              "{field.name}" é do tipo {frFieldTypeLabel(field)} — esta ação só suporta campos de Texto ou Multilinha. Escolha outro campo no Passo 3.
            </p>
          </>
        )}

        {/* Passo 4: substituições */}
        {field && frIsEligibleField(field) && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 4:</strong> Definir as substituições (regex)
              <p style={{ margin: '4px 0 10px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Cada linha é um de-para. "De" é uma expressão regular; todas as ocorrências no campo são trocadas.
                Ex.: <code>width="600"</code> → <code>width="800"</code>. Use <code>\d+</code> para dígitos e <code>$1</code> para grupos.
              </p>
              {frReplacements.map((r, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <InputText
                    value={r.find}
                    onChange={(e) => updateFrReplacement(idx, { find: e.target.value })}
                    placeholder={'De (regex) ex.: width="600"'}
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                  <i className="pi pi-arrow-right" style={{ opacity: 0.6 }} />
                  <InputText
                    value={r.replace}
                    onChange={(e) => updateFrReplacement(idx, { replace: e.target.value })}
                    placeholder={'Para ex.: width="800"'}
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    severity="danger"
                    onClick={() => removeFrReplacement(idx)}
                    disabled={frReplacements.length <= 1}
                    tooltip="Remover"
                  />
                </div>
              ))}
              <Button label="Adicionar substituição" icon="pi pi-plus" text size="small" onClick={addFrReplacement} />
            </div>

            {/* Passo 5: seleção de registros */}
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 5:</strong> Escolher os registros a editar
              <div style={{ marginTop: 8, marginBottom: 10 }}>
                <Dropdown
                  value={frSelectionMode}
                  options={FR_SELECTION_OPTIONS}
                  onChange={(e) => { setFrSelectionMode(e.value); setFrPreviewData(null); }}
                  style={{ width: '100%' }}
                />
              </div>

              {frSelectionMode === 'ids' ? (
                <>
                  <InputTextarea
                    value={frIdsInput}
                    onChange={(e) => { setFrIdsInput(e.target.value); setFrPreviewData(null); }}
                    rows={5}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    placeholder={'123456\n789012\n345678'}
                  />
                  {idsCount > 0 && (
                    <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
                      <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
                      {idsCount} ID{idsCount !== 1 ? 's' : ''} reconhecido{idsCount !== 1 ? 's' : ''}.
                    </small>
                  )}
                </>
              ) : (
                <>
                  <InputText
                    value={frFilterInput}
                    onChange={(e) => { setFrFilterInput(e.target.value); setFrPreviewData(null); }}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    placeholder={"contains(Title,'Proposta')"}
                  />
                  <small style={{ opacity: 0.7, display: 'block', marginTop: 6 }}>
                    Apenas o conteúdo do <code>$filter</code> (sem <code>$filter=</code>). O backend pagina e edita todos os que casarem.
                  </small>
                </>
              )}
            </div>

            {/* Passo 6: pré-visualizar (obrigatório antes de executar) */}
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 6:</strong> Pré-visualizar
              <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Busca o valor atual de cada registro selecionado e mostra como ficaria após os de-paras —
                nenhuma alteração é salva nesta etapa. Só registros cujo conteúdo realmente casa com algum
                padrão aparecem como "Alterado"; os demais ficam marcados como "Sem alteração" e são
                ignorados na execução.
              </p>
              <AccentButton
                label="Pré-visualizar alterações"
                icon="pi pi-search"
                onClick={handlePreviewFindReplace}
                disabled={!canPreview || frPreviewing}
              />

              {frPreviewData && renderFrPreviewPanel(frPreviewData)}
            </div>

            {/* Passo 7: executar — só liberado após prévia com ao menos 1 alteração */}
            <Divider />
            <div>
              <strong>Passo 7:</strong> Executar
              {frPreviewData && frPreviewData.changed === 0 && (
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', color: '#f59e0b' }}>
                  <i className="pi pi-info-circle" style={{ marginRight: 6 }} />
                  A prévia não encontrou nenhum registro que seria alterado — nada a executar.
                </p>
              )}
              {!frPreviewData && (
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.7 }}>
                  Rode a prévia no Passo 6 antes de executar.
                </p>
              )}
              <div style={{ marginTop: 8 }}>
                <AccentButton
                  label={`Substituir em ${frEntity}`}
                  icon="pi pi-play"
                  onClick={handleExecuteFindReplace}
                  disabled={!canExecute || executing}
                />
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  /** Painel inline da prévia (Passo 6): contadores + tabela antes/depois + CSV. */
  function renderFrPreviewPanel(data) {
    const STATUS_LABEL = { alterado: 'Alterado', 'sem-alteracao': 'Sem alteração', erro: 'Erro' };
    const STATUS_COLOR = { alterado: '#22c55e', 'sem-alteracao': darkMode ? '#9ca3af' : '#6b7280', erro: '#ef4444' };

    function downloadPreviewCsv() {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = `Id,Status,ValorAntes,ValorDepois`;
      const rows = (data.rows || []).map((r) =>
        [r.id, esc(STATUS_LABEL[r.status] || r.status), esc(r.before), esc(r.after)].join(',')
      );
      const csv = [header, ...rows].join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `previa-substituicao-${data.entity || 'entidade'}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ marginTop: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '10px',
            marginBottom: 12,
            padding: '10px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: data.total, color: 'var(--accent)' },
            { label: 'Seriam alterados', value: data.changed, color: '#22c55e' },
            { label: 'Sem alteração', value: data.unchanged, color: '#f59e0b' },
            { label: 'Falhas', value: data.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {(data.rows?.length || 0) > 0 && (
          <div
            style={{
              border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxHeight: 280,
                overflow: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr
                    style={{
                      position: 'sticky',
                      top: 0,
                      background: darkMode ? '#1a0a2e' : '#f9f9f9',
                      zIndex: 1,
                    }}
                  >
                    <th style={{ textAlign: 'left', padding: '8px 10px', whiteSpace: 'nowrap' }}>Id</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Antes</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Depois</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', whiteSpace: 'nowrap' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${darkMode ? '#2a1f3d' : '#eee'}` }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{r.id}</td>
                      <td
                        style={{ padding: '6px 10px', fontFamily: 'monospace', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={r.before}
                      >
                        {r.before || <span style={{ opacity: 0.5 }}>(vazio)</span>}
                      </td>
                      <td
                        style={{ padding: '6px 10px', fontFamily: 'monospace', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={r.after}
                      >
                        {r.after || <span style={{ opacity: 0.5 }}>(vazio)</span>}
                      </td>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', color: STATUS_COLOR[r.status], fontWeight: 600 }}>
                        {STATUS_LABEL[r.status] || r.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Button label="Baixar prévia (CSV)" icon="pi pi-download" severity="secondary" size="small" onClick={downloadPreviewCsv} />
      </div>
    );
  }

  function renderBulkFindReplaceResult() {
    const entityName = result.entity || 'Entidade';
    const hasAudit = (result.auditRows?.length || 0) > 0;

    function downloadCsv() {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = `${entityName}Id,Campo,ValorAntes,ValorDepois,Acao,Detalhe`;
      const rows = (result.auditRows || []).map((r) =>
        [r.EntityId, esc(result.fieldName || ''), esc(r.ValorAntes), esc(r.ValorDepois), esc(r.Acao), esc(r.Detalhe)].join(',')
      );
      const csv = [header, ...rows].join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `substituir-em-massa-${entityName}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: result.cancelled ? '#f59e0b' : result.failed > 0 ? '#ef4444' : '#22c55e',
          }}
        >
          <i
            className={
              result.cancelled
                ? 'pi pi-exclamation-triangle'
                : result.failed > 0
                ? 'pi pi-exclamation-circle'
                : 'pi pi-check-circle'
            }
          />
        </div>

        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled
            ? 'Substituição cancelada'
            : result.failed > 0
            ? 'Substituição concluída com erros'
            : 'Substituição concluída com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Alterados', value: result.success, color: '#22c55e' },
            { label: 'Sem alteração', value: result.skipped, color: '#f59e0b' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {hasAudit && (
            <Button label="Baixar planilha (antes/depois)" icon="pi pi-download" severity="secondary" onClick={downloadCsv} />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Atualização em massa por faixas de IDs — handlers ──────────

  function getRuField() {
    return (ruFields || []).find((f) => f.key === ruFieldKey) || null;
  }

  /** Faz o parse da lista de IDs colada, separando válidos, inválidos e duplicados. */
  function parseRuIds(raw) {
    const tokens = String(raw || '').split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    const ids = [];
    const invalid = [];
    const seen = new Set();
    const dupSet = new Set();
    for (const t of tokens) {
      const n = Number(t);
      if (!Number.isInteger(n) || n <= 0) { invalid.push(t); continue; }
      if (seen.has(n)) { dupSet.add(n); continue; }
      seen.add(n);
      ids.push(n);
    }
    return { ids, invalid, duplicates: [...dupSet] };
  }

  /** Distribui os IDs (em ordem) pelos blocos. count null = bloco "restante". */
  function computeRuAssignments(ids, blocks) {
    const out = [];
    let idx = 0;
    blocks.forEach((b, blockIndex) => {
      const take = b.count == null ? (ids.length - idx) : Math.max(0, Number(b.count) || 0);
      for (let k = 0; k < take && idx < ids.length; k++) {
        out.push({ id: ids[idx], value: b.value, blockIndex });
        idx++;
      }
    });
    return { assignments: out, consumed: idx };
  }

  /** Rótulo legível de um valor de bloco (resolve opção → Nome, bool → Sim/Não). */
  function ruDisplayValue(value) {
    if (value === '' || value == null) return '—';
    const inputType = ruMetaInputType(ruFieldMeta);
    if (inputType === 'choice') {
      const opt = (ruOptions || []).find((o) => String(o.Id) === String(value));
      return opt ? `${opt.Name} (#${opt.Id})` : String(value);
    }
    if (inputType === 'bool') return String(value) === 'true' ? 'Sim' : 'Não';
    return String(value);
  }

  function updateRuBlock(idx, patch) {
    setRuBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }
  function addRuBlock() {
    // novo bloco entra ANTES de qualquer bloco "restante" (count null), preservando-o por último
    setRuBlocks((prev) => {
      const next = [...prev];
      const remainderAt = next.findIndex((b) => b.count == null);
      const block = { count: 1, value: '' };
      if (remainderAt === -1) next.push(block);
      else next.splice(remainderAt, 0, block);
      return next;
    });
  }
  function removeRuBlock(idx) {
    setRuBlocks((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }
  function toggleRuRemainder(idx, isRemainder) {
    setRuBlocks((prev) =>
      prev.map((b, i) => {
        if (i === idx) return { ...b, count: isRemainder ? null : 1 };
        // garante no máx. 1 bloco "restante": ao marcar um, os demais voltam a ter count numérico
        if (isRemainder && b.count == null) return { ...b, count: 1 };
        return b;
      })
    );
  }

  async function handleLoadRuFields() {
    if (!userKey?.trim()) {
      showToast('warn', 'Atenção', 'Informe e valide a User-Key antes de continuar.');
      return;
    }
    const entityOpt = RU_ENTITY_OPTIONS.find((e) => e.value === ruEntity);
    if (!entityOpt) {
      showToast('warn', 'Atenção', 'Selecione a entidade antes de carregar os campos.');
      return;
    }
    try {
      setRuFieldsLoading(true);
      setRuFields(null);
      setRuFieldKey(null);
      setRuFieldMeta(null);
      setRuOptions(null);
      const resp = await fetchBulkRangeUpdateFields({ userKeyOverride: userKey, entityId: entityOpt.entityId });
      const all = resp.fields || [];
      setRuFields(all);
      if (all.length === 0) showToast('info', 'Sem campos', 'Nenhum campo encontrado nesta entidade.');
    } catch (err) {
      showToast('error', 'Erro ao carregar campos', err?.message || 'Falha ao buscar campos.');
    } finally {
      setRuFieldsLoading(false);
    }
  }

  /**
   * Ao escolher um campo, resolve sua "forma" (slot + kind) no backend e já traz a lista de escolhas
   * quando o campo é de opção ou referência (Usuário/Produto/Contato/Moeda) — é o que faltava para o
   * campo "Responsável" trazer os usuários.
   */
  async function handleSelectRuField(key) {
    setRuFieldKey(key);
    setRuFieldMeta(null);
    setRuOptions(null);
    setRuBlocks([{ count: null, value: '' }]); // valores antigos não servem para o novo campo
    setRuConfirmed(false);
    const field = (ruFields || []).find((f) => f.key === key);
    if (!field) return;
    try {
      setRuOptionsLoading(true);
      const meta = await fetchBulkRangeUpdateFieldMeta({ userKeyOverride: userKey, fieldId: field.id });
      setRuFieldMeta(meta);
      setRuOptions(meta.options || []);
      if (!meta.slot) {
        showToast('warn', 'Campo não suportado', 'Este tipo de campo não pode ser preenchido por esta ação.');
      } else if (RU_CHOICE_KINDS.includes(meta.kind) && (meta.options || []).length === 0) {
        showToast('info', 'Sem opções', 'Não foram encontradas opções/registros para escolher neste campo.');
      } else if (meta.truncated) {
        showToast('info', 'Lista grande', 'Mostrando os primeiros 300 registros — refine se necessário.');
      }
    } catch (err) {
      showToast('error', 'Erro ao carregar o campo', err?.message || 'Falha ao resolver o campo.');
    } finally {
      setRuOptionsLoading(false);
    }
  }

  async function handleExecuteRangeUpdate() {
    const field = getRuField();
    if (!ruEntity || !field || !userKey?.trim()) {
      showToast('warn', 'Atenção', 'Selecione entidade, campo e informe a User-Key.');
      return;
    }
    const { ids } = parseRuIds(ruIdsInput);
    const { assignments } = computeRuAssignments(ids, ruBlocks);
    if (assignments.length === 0) {
      showToast('warn', 'Atenção', 'Nenhum ID recebeu valor — verifique a lista e os blocos.');
      return;
    }

    try {
      setExecuting(true);
      setResult(null);
      setJobId(null);
      setCancelling(false);
      setProgress({ current: 0, total: assignments.length, logs: [], success: 0, failed: 0 });

      const resp = await executeBulkRangeUpdate({
        userKeyOverride: userKey,
        entity: ruEntity,
        field: {
          key: field.key,
          typeId: field.typeId,
          slot: ruFieldMeta?.slot,            // resolvido por NativeType (cobre campos relacionais)
          dynamic: field.dynamic,
          propertyName: field.propertyName,
          updatePropertyName: field.updatePropertyName,
          name: field.name,
        },
        assignments: assignments.map((a) => ({ id: a.id, value: a.value })),
        suppressWebhooks: ruSuppressWebhooks,
        onProgress: (data) => {
          if (data.jobId) setJobId(data.jobId);
          setProgress((prev) => {
            const next = {
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              logs: data.log ? [...prev.logs, data.log] : prev.logs,
              success: data.success !== undefined ? data.success : prev.success,
              failed: data.failed !== undefined ? data.failed : prev.failed,
            };
            setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return next;
          });
        },
      });

      setResult(resp);
      setExecuting(false);
      setJobId(null);

      const label = resp.cancelled ? ' (cancelado)' : '';
      showToast(
        resp.cancelled ? 'warn' : 'success',
        `Atualização concluída${label}`,
        `Atualizados: ${resp.success} | Falhas: ${resp.failed} | Total: ${resp.total}`
      );
    } catch (err) {
      setExecuting(false);
      setJobId(null);
      showToast('error', 'Erro na execução', err?.message || 'Falha ao atualizar.');
    }
  }

  function renderBulkRangeUpdate() {
    if (executing) return renderProgressView('Atualizando registros em massa...', 'Isso pode levar alguns minutos dependendo da quantidade de IDs');
    if (result) return renderBulkRangeUpdateResult();

    const action = READY_ACTIONS.find((a) => a.id === 'bulk-range-update');
    const field = getRuField();
    // A "forma" do campo (slot/kind) é resolvida pelo backend ao selecioná-lo (cobre relacionais).
    const inputKind = ruMetaInputType(ruFieldMeta);
    const fieldSupported = !!ruFieldMeta?.slot;

    // Campos preenchíveis primeiro, por nome; tipos não preenchíveis (imagem, anexo…) desabilitados.
    const fieldOptions = [...(ruFields || [])]
      .sort((a, b) => {
        const sa = ruFieldListSupported(a) ? 0 : 1;
        const sb = ruFieldListSupported(b) ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
      })
      .map((f) => {
        const supported = ruFieldListSupported(f);
        return {
          label: `${f.name} · ${f.dynamic ? 'personalizado' : 'nativo'} · ${frFieldTypeLabel(f)}${supported ? '' : ' · não preenchível'}`,
          value: f.key,
          disabled: !supported,
        };
      });
    const fieldValueTemplate = (option) => (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
        {option ? option.label : <span style={{ opacity: 0.5 }}>Selecionar...</span>}
      </span>
    );

    const { ids, invalid, duplicates } = parseRuIds(ruIdsInput);
    const idsCount = ids.length;
    const { assignments, consumed } = computeRuAssignments(ids, ruBlocks);
    const leftover = idsCount - consumed;

    // Validações de blocos
    const fixedSum = ruBlocks
      .filter((b) => b.count != null)
      .reduce((acc, b) => acc + (Math.max(0, Number(b.count) || 0)), 0);
    const sumExceeds = fixedSum > idsCount;
    const blocksHaveValue = ruBlocks.every((b) => String(b.value ?? '').trim() !== '');
    const blockCountsValid = ruBlocks.every((b) => b.count == null || (Number.isInteger(Number(b.count)) && Number(b.count) >= 1));

    const idsClean = idsCount > 0 && invalid.length === 0 && duplicates.length === 0;
    const canExecute = !!(
      ruEntity && field && fieldSupported && userKey?.trim() &&
      idsClean && blocksHaveValue && blockCountsValid && !sumExceeds &&
      assignments.length > 0 && ruConfirmed && !executing
    );

    return (
      <>
        <Button label="Voltar" icon="pi pi-arrow-left" text onClick={resetState} style={{ marginBottom: 12 }} />

        <h4 style={{ margin: '0 0 4px 0' }}>{action.title}</h4>
        <p style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>{action.description}</p>

        <WarningBox $dark={darkMode}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
          <strong>Atenção:</strong> {action.warning}
        </WarningBox>

        {!userKey?.trim() && (
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="pi pi-lock" style={{ marginRight: 6 }} />
            Volte à Central da API e informe/valide a User-Key antes de continuar.
          </p>
        )}

        <Divider />

        {/* Passo 1: entidade */}
        <div style={{ marginBottom: 16 }}>
          <strong>Passo 1:</strong> Selecionar a entidade
          <Dropdown
            value={ruEntity}
            options={RU_ENTITY_OPTIONS}
            onChange={(e) => {
              setRuEntity(e.value);
              setRuFields(null);
              setRuFieldKey(null);
              setRuFieldMeta(null);
              setRuOptions(null);
              setRuBlocks([{ count: null, value: '' }]);
              setRuConfirmed(false);
            }}
            placeholder="Selecione a entidade..."
            style={{ width: '100%', marginTop: 8 }}
            disabled={!userKey?.trim()}
          />
        </div>

        {/* Passo 2: carregar campos */}
        {ruEntity && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 2:</strong> Carregar campos da entidade
              <div style={{ marginTop: 8 }}>
                <AccentButton
                  label={ruFieldsLoading ? 'Carregando...' : ruFields ? `${ruFields.length} campo(s) — Recarregar` : 'Carregar campos'}
                  icon={ruFieldsLoading ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
                  onClick={handleLoadRuFields}
                  disabled={ruFieldsLoading || !userKey?.trim()}
                />
              </div>
            </div>
          </>
        )}

        {/* Passo 3: escolher campo */}
        {ruFields && ruFields.length > 0 && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 3:</strong> Escolher o campo a atualizar
              <Dropdown
                value={ruFieldKey}
                options={fieldOptions}
                onChange={(e) => handleSelectRuField(e.value)}
                placeholder="Campo..."
                valueTemplate={fieldValueTemplate}
                style={{ width: '100%', marginTop: 8 }}
                filter
                filterPlaceholder="Buscar campo..."
                emptyFilterMessage="Nenhum campo encontrado"
              />
              {field && ruOptionsLoading && (
                <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: 4 }} />
                  Resolvendo o campo e suas opções...
                </small>
              )}
              {field && !ruOptionsLoading && ruFieldMeta?.slot && (
                <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
                  <i className="pi pi-info-circle" style={{ marginRight: 4 }} />
                  {field.dynamic ? 'Personalizado' : 'Nativo'} · {frFieldTypeLabel(field)} ·
                  {' '}grava em <code>{ruFieldMeta.slot}</code>
                  {field.dynamic ? ` (FieldKey ${field.key})` : ` (${field.updatePropertyName || field.propertyName})`}
                  {RU_CHOICE_KINDS.includes(ruFieldMeta.kind) && ` · ${(ruOptions || []).length} escolha(s)`}
                </small>
              )}
            </div>
          </>
        )}

        {/* Passo 4: lista de IDs */}
        {field && fieldSupported && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 4:</strong> Colar a lista de IDs (em ordem)
              <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Os IDs são consumidos na ordem informada. Aceita vírgula, espaço ou quebra de linha.
              </p>
              <InputTextarea
                value={ruIdsInput}
                onChange={(e) => setRuIdsInput(e.target.value)}
                rows={5}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
                placeholder={'101\n102\n103\n104'}
              />
              {idsCount > 0 && (
                <small style={{ opacity: 0.75, display: 'block', marginTop: 6 }}>
                  <i className="pi pi-check-circle" style={{ color: '#22c55e', marginRight: 4 }} />
                  {idsCount} ID{idsCount !== 1 ? 's' : ''} válido{idsCount !== 1 ? 's' : ''}.
                </small>
              )}
              {invalid.length > 0 && (
                <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                  <i className="pi pi-times-circle" style={{ marginRight: 4 }} />
                  {invalid.length} valor(es) não numérico(s): {invalid.slice(0, 5).join(', ')}{invalid.length > 5 ? '…' : ''}
                </small>
              )}
              {duplicates.length > 0 && (
                <small style={{ color: '#f59e0b', display: 'block', marginTop: 4 }}>
                  <i className="pi pi-exclamation-triangle" style={{ marginRight: 4 }} />
                  {duplicates.length} ID(s) duplicado(s): {duplicates.slice(0, 5).join(', ')}{duplicates.length > 5 ? '…' : ''}
                </small>
              )}
            </div>

            {/* Passo 5: blocos de valor */}
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 5:</strong> Definir os blocos de valor
              <p style={{ margin: '4px 0 10px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                Cada bloco consome os próximos N IDs e aplica o valor. Marque "restante" para um bloco
                que pega todos os IDs que sobrarem.
              </p>

              {ruBlocks.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap',
                    padding: '8px', borderRadius: 8,
                    border: `1px solid ${darkMode ? '#2a1f3d' : '#e5e7eb'}`,
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7, minWidth: 52 }}>
                    Bloco {idx + 1}
                  </span>

                  {b.count == null ? (
                    <span style={{ fontSize: '0.85rem', minWidth: 96, opacity: 0.9 }}>
                      <i className="pi pi-asterisk" style={{ fontSize: '0.7rem', marginRight: 4 }} />
                      IDs restantes
                    </span>
                  ) : (
                    <InputText
                      value={String(b.count)}
                      onChange={(e) => updateRuBlock(idx, { count: e.target.value.replace(/[^\d]/g, '') })}
                      placeholder="Qtd"
                      style={{ width: 70, fontSize: '0.85rem' }}
                    />
                  )}

                  {/* Valor — input depende do tipo do campo (escalar, opção/referência ou bool) */}
                  {inputKind === 'choice' ? (
                    <Dropdown
                      value={b.value === '' ? null : b.value}
                      options={(ruOptions || []).map((o) => ({ label: `${o.Name} (#${o.Id})`, value: o.Id }))}
                      onChange={(e) => updateRuBlock(idx, { value: e.value })}
                      placeholder={ruOptionsLoading ? 'Carregando...' : 'Selecionar...'}
                      style={{ flex: 1, minWidth: 160 }}
                      filter
                      disabled={ruOptionsLoading}
                    />
                  ) : inputKind === 'bool' ? (
                    <Dropdown
                      value={b.value === '' ? null : b.value}
                      options={[{ label: 'Sim (true)', value: 'true' }, { label: 'Não (false)', value: 'false' }]}
                      onChange={(e) => updateRuBlock(idx, { value: e.value })}
                      placeholder="Valor..."
                      style={{ flex: 1, minWidth: 160 }}
                    />
                  ) : (
                    <InputText
                      value={b.value}
                      onChange={(e) => updateRuBlock(idx, { value: e.target.value })}
                      placeholder={
                        inputKind === 'integer' ? 'Valor inteiro (ex.: 10)'
                          : inputKind === 'decimal' ? 'Valor decimal (ex.: 10.5)'
                            : inputKind === 'datetime' ? 'Data (AAAA-MM-DD)'
                              : 'Valor'
                      }
                      style={{ flex: 1, minWidth: 160, fontSize: '0.85rem' }}
                    />
                  )}

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Checkbox
                      inputId={`ru-rem-${idx}`}
                      checked={b.count == null}
                      onChange={(e) => toggleRuRemainder(idx, e.checked)}
                    />
                    <label htmlFor={`ru-rem-${idx}`} style={{ fontSize: '0.78rem', cursor: 'pointer' }}>restante</label>
                  </span>

                  <Button
                    icon="pi pi-trash"
                    text
                    severity="danger"
                    onClick={() => removeRuBlock(idx)}
                    disabled={ruBlocks.length <= 1}
                    tooltip="Remover bloco"
                  />
                </div>
              ))}

              <Button label="Adicionar bloco" icon="pi pi-plus" text size="small" onClick={addRuBlock} />

              {sumExceeds && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '8px 0 0 0' }}>
                  <i className="pi pi-times-circle" style={{ marginRight: 6 }} />
                  A soma dos blocos ({fixedSum}) excede o total de IDs ({idsCount}).
                </p>
              )}
              {!sumExceeds && leftover > 0 && (
                <p style={{ color: '#f59e0b', fontSize: '0.85rem', margin: '8px 0 0 0' }}>
                  <i className="pi pi-info-circle" style={{ marginRight: 6 }} />
                  {leftover} ID(s) ficarão sem valor. Adicione um bloco "restante" para incluí-los.
                </p>
              )}
            </div>

            {/* Passo 6: preview */}
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <strong>Passo 6:</strong> Pré-visualizar (ID → valor → endpoint)
              {assignments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 8 }}>
                  Defina IDs válidos e blocos com valor para ver a prévia.
                </p>
              ) : (
                <div
                  style={{
                    marginTop: 8, border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                    borderRadius: 8, overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px', background: darkMode ? '#1a0a2e' : '#f9f9f9',
                      borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                      fontSize: '0.85rem', fontWeight: 600,
                    }}
                  >
                    {assignments.length} registro(s) serão atualizados
                  </div>
                  <div style={{ maxHeight: 220, overflowY: 'auto', background: darkMode ? '#120125' : '#fafafa' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ position: 'sticky', top: 0, background: darkMode ? '#1a0a2e' : '#f1f1f1' }}>
                          <th style={{ textAlign: 'left', padding: '6px 10px' }}>ID</th>
                          <th style={{ textAlign: 'left', padding: '6px 10px' }}>Valor</th>
                          <th style={{ textAlign: 'left', padding: '6px 10px' }}>Endpoint</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.slice(0, 200).map((a) => (
                          <tr key={a.id} style={{ borderTop: `1px solid ${darkMode ? '#2a1f3d' : '#eee'}` }}>
                            <td style={{ padding: '5px 10px', fontFamily: 'monospace' }}>{a.id}</td>
                            <td style={{ padding: '5px 10px' }}>{ruDisplayValue(a.value)}</td>
                            <td style={{ padding: '5px 10px', fontFamily: 'monospace', opacity: 0.8 }}>
                              PATCH /{ruEntity}({a.id})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {assignments.length > 200 && (
                      <div style={{ padding: '6px 10px', fontSize: '0.78rem', opacity: 0.7 }}>
                        … e mais {assignments.length - 200} registro(s).
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Passo 7: opções e executar */}
            <Divider />
            <div>
              <strong>Passo 7:</strong> Confirmar e executar
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Checkbox
                  inputId="ru-webhooks"
                  checked={ruSuppressWebhooks}
                  onChange={(e) => setRuSuppressWebhooks(e.checked)}
                />
                <label htmlFor="ru-webhooks" style={{ cursor: 'pointer', fontSize: '0.88rem' }}>
                  Suprimir webhooks durante a operação (<code>?webhooks=false</code>)
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Checkbox
                  inputId="ru-confirm"
                  checked={ruConfirmed}
                  onChange={(e) => setRuConfirmed(e.checked)}
                />
                <label htmlFor="ru-confirm" style={{ cursor: 'pointer', fontSize: '0.88rem' }}>
                  Entendo que a operação é <strong>irreversível</strong> e que exportei os dados atuais antes.
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <AccentButton
                  label={`Atualizar ${assignments.length || ''} registro${assignments.length !== 1 ? 's' : ''} em ${ruEntity || ''}`}
                  icon="pi pi-play"
                  onClick={handleExecuteRangeUpdate}
                  disabled={!canExecute}
                />
              </div>
            </div>
          </>
        )}

        {/* Campo selecionado não suportado (meta resolvida, mas sem slot gravável) */}
        {field && !ruOptionsLoading && ruFieldMeta && !ruFieldMeta.slot && (
          <>
            <Divider />
            <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
              <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
              "{field.name}" é do tipo {frFieldTypeLabel(field)} — não suportado nesta ação. Escolha outro campo.
            </p>
          </>
        )}
      </>
    );
  }

  function renderBulkRangeUpdateResult() {
    const hasFailed = result.failed > 0;

    function downloadCsv() {
      const header = 'EntityId,Valor,Status,Acao,Detalhe';
      const rows = (result.auditRows || []).map((r) => {
        const detalhe = String(r.Detalhe || '').replace(/"/g, '""');
        const valor = String(r.Valor ?? '').replace(/"/g, '""');
        return `${r.EntityId},"${valor}",${r.Status ?? ''},${r.Acao || ''},"${detalhe}"`;
      });
      const csv = [header, ...rows].join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atualizacao-massa-faixas-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16, color: result.cancelled ? '#f59e0b' : hasFailed ? '#ef4444' : '#22c55e' }}>
          <i className={result.cancelled ? 'pi pi-exclamation-triangle' : hasFailed ? 'pi pi-exclamation-circle' : 'pi pi-check-circle'} />
        </div>
        <h3 style={{ margin: '0 0 8px 0' }}>
          {result.cancelled ? 'Atualização cancelada' : hasFailed ? 'Atualização concluída com erros' : 'Atualização concluída com sucesso'}
        </h3>

        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20, padding: 12,
            background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)', borderRadius: 8,
          }}
        >
          {[
            { label: 'Total', value: result.total, color: 'var(--accent)' },
            { label: 'Atualizados', value: result.success, color: '#22c55e' },
            { label: 'Falhas', value: result.failed, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {progress.logs.length > 0 && renderLogsSection(progress.logs, 20)}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {(result.auditRows?.length > 0) && (
            <Button label="Baixar planilha CSV" icon="pi pi-download" severity="secondary" onClick={downloadCsv} />
          )}
          <Button label="Nova ação" icon="pi pi-refresh" onClick={resetState} />
          <Button label="Fechar" icon="pi pi-times" onClick={handleHide} />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────

  return (
    <Dialog
      header="Ações em massa"
      visible={visible}
      onHide={handleHide}
      style={{ width: 700, maxWidth: '95vw' }}
      modal
      blockScroll
      draggable={false}
      closable={!executing && !frPreviewing}
    >
      {selectedAction === null && renderActionList()}
      {selectedAction === 'delete-non-native-cities' &&
        renderDeleteNonNativeCities()}
      {selectedAction === 'finish-tasks' && renderFinishTasks()}
      {selectedAction === 'restrict-option-fields' && renderRestrictOptionFields()}
      {selectedAction === 'deal-history' && renderDealHistory()}
      {selectedAction === 'format-contact-phones' && renderFormatContactPhones()}
      {selectedAction === 'remove-collaborating-users' && renderRemoveCollaboratingUsers()}
      {selectedAction === 'sla-retroativo' && renderSlaRetroativo()}
      {selectedAction === 'unify-duplicate-fields' && renderUnifyDuplicateFields()}
      {selectedAction === 'bulk-find-replace' && renderBulkFindReplace()}
      {selectedAction === 'bulk-range-update' && renderBulkRangeUpdate()}
      {selectedAction === 'bulk-rename-users' && renderBulkRenameUsers()}
      {selectedAction === 'create-users' && renderCreateUsers()}
    </Dialog>
  );
}
