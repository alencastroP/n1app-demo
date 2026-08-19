// services/volumeComprasService.js
// Chamadas diretas à API do Ploomes para implementação do processo "Volume de Compras".
//
// Cria, na entidade Cliente (EntityId 1), 5 campos de moeda (TypeId 5) e o conjunto
// de automações que mantém esses valores corretos:
//   - 1 automação de SOMA (negócio ganho) → MES + ANO + TOTAL
//   - 15 automações de SUBTRAÇÃO (excluído/perdido/reaberto × 5 períodos)
//   - 1 automação PERIÓDICA mensal (vira MES → MES_ANT e zera MES)
//   - 1 automação PERIÓDICA anual  (vira ANO → ANO_ANT e zera ANO)
//
// Todos os shapes de payload abaixo foram confirmados contra exemplos reais de
// uma conta canary (filtro de data relativa, automação periódica TriggerId 17 e
// automação de soma escrevendo no Cliente a partir do Negócio).

import * as XLSX from 'xlsx';

const PLOOMES = 'https://api2.ploomes.com';
const DELAY_MS = 800;

// ── IDs nativos confirmados (canary) ─────────────────────────────────────────
const DEAL_AMOUNT_FIELD_ID = 1053; // Negócio.Valor (deal_amount)
const FIELD_PATH_DEAL_TO_CLIENT = 40; // Negócio -> Cliente
const FIELD_PATH_DEAL_SELF = 70;      // Negócio (self)
const FIELD_PATH_CLIENT_SELF = 140;   // Cliente (self) — usado nas periódicas

const ENTITY_CLIENT = 1;
const ENTITY_DEAL = 2;
const FIELD_TYPE_CURRENCY = 5; // Moeda (DecimalValue)

// Gatilhos
const TRIGGER_DELETED = 7;   // item excluído
const TRIGGER_WON = 8;       // negócio ganho
const TRIGGER_LOST = 9;      // negócio perdido
const TRIGGER_REOPENED = 10; // negócio reaberto
const TRIGGER_PERIODIC = 17; // periodicamente

// Unidades de repetição (canary): 3 = mês, 4 = ano
const REPEAT_UNIT_MONTH = 3;
const REPEAT_UNIT_YEAR = 4;

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function h(uk) {
  return { 'Content-Type': 'application/json', 'User-Key': uk };
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function ploomesGet(uk, path, base = PLOOMES) {
  const resp = await fetch(`${base}${path}`, { headers: h(uk) });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = `HTTP ${resp.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch (_) {}
    throw new Error(msg);
  }
  return resp.json();
}

async function ploomesPost(uk, path, body, base = PLOOMES) {
  const resp = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: h(uk),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = `HTTP ${resp.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch (_) {}
    throw new Error(msg);
  }
  return resp.json();
}

async function ploomesDelete(uk, path, base = PLOOMES) {
  const resp = await fetch(`${base}${path}`, {
    method: 'DELETE',
    headers: h(uk),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = `HTTP ${resp.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch (_) {}
    throw new Error(msg);
  }
}

// ── Validação ──────────────────────────────────────────────────────────────────

export async function validateUserKey(uk) {
  const data = await ploomesGet(
    uk,
    '/Users?$top=1&$select=Id,Name&$count=true&$filter=Integration+eq+false+and+Editable+eq+true'
  );
  return {
    count: data['@odata.count'] ?? 0,
    firstUserName: data.value?.[0]?.Name ?? null,
  };
}

// ── Dados da conta ─────────────────────────────────────────────────────────────

export async function fetchPipelines(uk) {
  const data = await ploomesGet(
    uk,
    '/Deals@Pipelines?$filter=Archived+eq+false&$select=Id,Name,Archived,Color,IconId'
  );
  return data.value ?? [];
}

// ── Definição dos 5 campos ──────────────────────────────────────────────────────
// Chaves internas → nome EXATO (spec §2). A ordem importa apenas para o resumo.

export const FIELD_DEFS = [
  { key: 'mes',      name: 'Volume de compras do mês' },
  { key: 'mes_ant',  name: 'Volume de compras do mês passado' },
  { key: 'ano',      name: 'Volume de compras do ano' },
  { key: 'ano_ant',  name: 'Volume de compras do ano passado' },
  { key: 'total',    name: 'Volume de compras total' },
];

// ── Builders de payload ─────────────────────────────────────────────────────────

function buildFieldPayload(name) {
  return {
    EntityId: ENTITY_CLIENT,
    TypeId: FIELD_TYPE_CURRENCY,
    Name: name,
  };
}

const ACTION_EDIT_DATA = {
  Id: 1,
  Name: 'Editar dados',
  FieldKeyRequired: true,
  FieldKeyOrRecipientsEmailAddressRequired: false,
  DealStageIdRequired: false,
  EmailTemplateIdRequired: false,
  TaskDaysFromNowRequired: false,
  RequestBodyRequired: false,
  LossReasonIdRequired: false,
};

// Filtro "sem condições" não é usado aqui — todos os filtros têm funis e/ou data.
//
// Filtro de NEGÓCIO por funis (+ opcionalmente data relativa de término).
// `relativeDateToken`: '$thismonth' | '$lastmonth' | '$thisyear' | '$lastyear' | null
function buildDealFilterPayload(name, pipelines, relativeDateToken = null) {
  const pipeUrl = pipelines.map((p) => `PipelineId+eq+${p.Id}`).join('+or+');
  const fields = [
    {
      LogicalGroupNumber: 1,
      FieldKey: 'deal_pipeline',
      OperationId: 1,
      RelativeDate: false,
      Interval: false,
      FieldPath: [{ FieldKey: 'deal_pipeline', Ordination: 1 }],
      Values: pipelines.map((p) => ({ IntegerValue: p.Id })),
    },
  ];

  let url = `$filter=((${pipeUrl}))`;

  if (relativeDateToken) {
    // Shape de data relativa de término confirmado no canary:
    //   FieldKey "deal_finish_date", RelativeDate true, Values [{ StringValue: "$thismonth" }]
    fields.push({
      LogicalGroupNumber: 1,
      FieldKey: 'deal_finish_date',
      OperationId: 1,
      RelativeDate: true,
      Interval: false,
      FieldPath: [],
      Values: [{ StringValue: relativeDateToken }],
    });
    url = `$filter=((${pipeUrl})+and+(date(FinishDate)+eq+${relativeDateToken}))`;
  }

  return {
    Name: name,
    Url: url,
    EntityId: ENTITY_DEAL,
    Listable: false,
    Fields: fields,
    AllowedUsers: [],
    AllowedTeams: [],
  };
}

// Filtro de CLIENTE sem condições — usado pelas automações periódicas.
function buildClientFilterPayload(name) {
  return {
    Name: name,
    Url: '$filter=true',
    EntityId: ENTITY_CLIENT,
    Listable: false,
    Fields: [],
    AllowedUsers: [],
    AllowedTeams: [],
  };
}

// Ação "Editar dados" que escreve em um campo do Cliente a partir de uma fórmula
// `[Cliente.<Nome>] <op> [Negócio.Valor]`, disparada a partir do Negócio.
// `op`: '+' (soma) | '-' (subtração)
function buildDealFormulaAction(targetField, op) {
  const formula = `[Cliente.${targetField.name}]${op}[Negócio.Valor]`;
  return {
    FieldKey: targetField.key,
    FieldPathId: FIELD_PATH_DEAL_TO_CLIENT,
    DecimalValue: null,
    Fields: [
      {
        FieldKey: targetField.key,
        MappedFieldPathId: null,
        MappedFieldKey: null,
        DaysFromNow: null,
        InternalFormula: formula,
        GeneratedFormula: false,
        FormulaVariables: [
          {
            VariableName: `Cliente.${targetField.name}`,
            VariableFieldKey: targetField.key,
            VariableField: { Id: targetField.id },
            VariableProperty: null,
            FieldPathId: FIELD_PATH_DEAL_TO_CLIENT,
            DefaultValue: '0',
            Required: false,
            IsFieldStandardVariable: true,
          },
          {
            VariableName: 'Negócio.Valor',
            VariableFieldKey: 'deal_amount',
            VariableField: { Id: DEAL_AMOUNT_FIELD_ID },
            VariableProperty: null,
            FieldPathId: FIELD_PATH_DEAL_SELF,
            DefaultValue: '0',
            Required: false,
            IsFieldStandardVariable: true,
          },
        ],
      },
    ],
    ShouldClearFieldValues: false,
    ActionId: 1,
    Action: ACTION_EDIT_DATA,
  };
}

// Automação de NEGÓCIO (soma ou subtração). `actions` é o array já montado.
function buildDealAutomation({ name, triggerId, filterId, actions }) {
  return {
    Name: name,
    TriggerId: triggerId,
    TriggerFilterId: filterId,
    TriggerDealStageId: null,
    EntityId: ENTITY_DEAL,
    BlockTriggerByAutomation: true,
    HasTriggerFields: false,
    TriggerFields: [],
    Actions: actions,
  };
}

// Ação periódica "puxar valor de um campo" (Cliente self, FieldPathId 140).
// Confirmado no canary: MappedFieldKey + MappedFieldPathId, sem InternalFormula.
function buildPullValueAction(targetField, sourceField) {
  return {
    FieldKey: targetField.key,
    FieldPathId: FIELD_PATH_CLIENT_SELF,
    DecimalValue: null,
    Fields: [
      {
        FieldKey: targetField.key,
        MappedFieldPathId: FIELD_PATH_CLIENT_SELF,
        MappedFieldKey: sourceField.key,
        DaysFromNow: null,
        InternalFormula: null,
        FormulaVariables: null,
      },
    ],
    ShouldClearFieldValues: false,
    ActionId: 1,
    Action: ACTION_EDIT_DATA,
  };
}

// Ação periódica "valor estático = 0" (zera o campo). Confirmado no canary:
// DecimalValue null + Fields [] zera o campo.
function buildZeroValueAction(targetField) {
  return {
    FieldKey: targetField.key,
    FieldPathId: FIELD_PATH_CLIENT_SELF,
    DecimalValue: null,
    Fields: [],
    ShouldClearFieldValues: false,
    ActionId: 1,
    Action: ACTION_EDIT_DATA,
  };
}

// Automação PERIÓDICA (TriggerId 17, entidade Cliente).
// `unitId`: REPEAT_UNIT_MONTH | REPEAT_UNIT_YEAR
function buildPeriodicAutomation({ name, filterId, unitId, startDateTime, actions }) {
  return {
    Name: name,
    TriggerId: TRIGGER_PERIODIC,
    TriggerFilterId: filterId,
    TriggerDealStageId: null,
    EntityId: ENTITY_CLIENT,
    BlockTriggerByAutomation: true,
    HasTriggerFields: false,
    TriggerFields: [],
    Actions: actions,
    TriggerRepeatStartDateTime: startDateTime,
    TriggerRepeatIntervalUnitId: unitId,
    TriggerRepeatIntervalLength: 1,
  };
}

// ── Datas de agendamento das periódicas ──────────────────────────────────────────
// As periódicas devem rodar de madrugada. Como Date.now()/new Date() não estão
// disponíveis dentro de workflows, mas ESTE código roda no browser do usuário,
// usamos new Date() normalmente para calcular o próximo dia 1.

function nextMonthlyStart() {
  const now = new Date();
  // primeiro dia do PRÓXIMO mês, 03:00 horário local
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1, 3, 0, 0);
  return formatPloomesOffset(d);
}

function nextYearlyStart() {
  const now = new Date();
  // 01/01 do PRÓXIMO ano, 03:00 horário local
  const d = new Date(now.getFullYear() + 1, 0, 1, 3, 0, 0);
  return formatPloomesOffset(d);
}

// "2026-06-01T03:00:00-03:00"
function formatPloomesOffset(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const tzMin = -d.getTimezoneOffset(); // ex.: -180 (UTC-3) → +180? getTimezoneOffset retorna 180 para UTC-3
  const sign = tzMin >= 0 ? '+' : '-';
  const abs = Math.abs(tzMin);
  const tz = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${tz}`
  );
}

// ── Plano de subtrações (3 gatilhos × 5 períodos) ────────────────────────────────
// Cada item: { triggerId, triggerLabel, fieldKey (campo-alvo), dateToken (null = TOTAL) }

const SUB_TRIGGERS = [
  { triggerId: TRIGGER_DELETED,  label: 'excluído' },
  { triggerId: TRIGGER_LOST,     label: 'perdido' },
  { triggerId: TRIGGER_REOPENED, label: 'reaberto' },
];

// (campo-alvo, token de data relativa). TOTAL não filtra por data.
const SUB_PERIODS = [
  { fieldKey: 'mes_ant', token: '$lastmonth', periodLabel: 'mês passado' },
  { fieldKey: 'mes',     token: '$thismonth', periodLabel: 'este mês' },
  { fieldKey: 'ano_ant', token: '$lastyear',  periodLabel: 'ano passado' },
  { fieldKey: 'ano',     token: '$thisyear',  periodLabel: 'este ano' },
  { fieldKey: 'total',   token: null,         periodLabel: 'total' },
];

// Quantidade total de itens criados (para barra de progresso):
//   5 campos + filtros + automações
//   Soma: 1 filtro + 1 automação
//   Subtração: 15 filtros + 15 automações
//   Periódicas: 2 filtros + 2 automações
export const TOTAL_FIELDS = FIELD_DEFS.length; // 5
export const TOTAL_FILTERS = 1 + SUB_TRIGGERS.length * SUB_PERIODS.length + 2; // 1 + 15 + 2 = 18
export const TOTAL_AUTOMATIONS = TOTAL_FILTERS; // 18 (1 filtro por automação)

// ── Implementação principal ───────────────────────────────────────────────────────

/**
 * Executa a implementação completa do Volume de Compras.
 * @param {object} params
 * @param {string}   params.uk
 * @param {Array}    params.pipelines   — [{ Id, Name, Color }]
 * @param {Function} params.onProgress  — (msg: string) => void
 * @returns {Promise<object>} resultado com IDs criados
 */
export async function implementVolumeCompras({ uk, pipelines, onProgress }) {
  const log = (msg) => onProgress?.(msg);

  const createdFields = [];      // [{ key, id, name, fieldKey }]
  const createdFilters = [];     // [{ name, filterId }]
  const createdAutomations = []; // [{ name, automationId }]
  let totalErrors = 0;

  // ── 1. Criar os 5 campos de moeda no Cliente ──────────────────────────────────
  const field = {}; // key → { key, id, name }  (key = chave interna; .key passa a ser o FieldKey real)
  for (const def of FIELD_DEFS) {
    try {
      await sleep(DELAY_MS);
      const resp = await ploomesPost(uk, '/Fields', buildFieldPayload(def.name));
      const created = resp.value?.[0];
      field[def.key] = { key: created.Key, id: created.Id, name: def.name };
      createdFields.push({ internalKey: def.key, fieldKey: created.Key, fieldId: created.Id, name: def.name });
      log(`✔ Campo "${def.name}" criado`);
    } catch (err) {
      log(`⚠ Erro ao criar campo "${def.name}": ${err.message}`);
      totalErrors++;
    }
  }

  // Se algum campo essencial falhou, aborta — as automações dependem das keys/ids.
  const missing = FIELD_DEFS.filter((d) => !field[d.key]);
  if (missing.length > 0) {
    log(`⚠ ${missing.length} campo(s) não foram criados. Abortando criação de automações.`);
    return finalize();
  }

  // Helper para criar filtro + automação de negócio em sequência.
  async function createDealAutomation({ name, triggerId, relativeToken, actions }) {
    let filterId = null;
    try {
      await sleep(DELAY_MS);
      const fResp = await ploomesPost(uk, '/Filters', buildDealFilterPayload(name, pipelines, relativeToken));
      filterId = fResp.value?.[0]?.Id;
      createdFilters.push({ name, filterId });
      log(`✔ Filtro "${name}" criado`);
    } catch (err) {
      log(`⚠ Erro ao criar filtro "${name}": ${err.message}`);
      totalErrors++;
      return;
    }
    try {
      await sleep(DELAY_MS);
      const aResp = await ploomesPost(
        uk,
        '/Automations',
        buildDealAutomation({ name, triggerId, filterId, actions })
      );
      createdAutomations.push({ name, automationId: aResp.value?.[0]?.Id });
      log(`✔ Automação "${name}" criada`);
    } catch (err) {
      log(`⚠ Erro ao criar automação "${name}": ${err.message}`);
      totalErrors++;
    }
  }

  // ── 2. Automação de SOMA (negócio ganho) → MES, ANO, TOTAL ────────────────────
  await createDealAutomation({
    name: '(Volume de Compras) Soma - Negócio ganho',
    triggerId: TRIGGER_WON,
    relativeToken: null,
    actions: [
      buildDealFormulaAction(field.mes, '+'),
      buildDealFormulaAction(field.ano, '+'),
      buildDealFormulaAction(field.total, '+'),
    ],
  });

  // ── 3. Automações de SUBTRAÇÃO (3 gatilhos × 5 períodos) ──────────────────────
  for (const trig of SUB_TRIGGERS) {
    for (const period of SUB_PERIODS) {
      const targetField = field[period.fieldKey];
      const name = `(Volume de Compras) Subtração ${trig.label} - ${period.periodLabel}`;
      await createDealAutomation({
        name,
        triggerId: trig.triggerId,
        relativeToken: period.token,
        actions: [buildDealFormulaAction(targetField, '-')],
      });
    }
  }

  // ── 4. Automação PERIÓDICA mensal: MES_ANT ← MES, depois MES ← 0 ──────────────
  await createPeriodicAutomation({
    name: '(Volume de Compras) Periódica mensal - virada de mês',
    unitId: REPEAT_UNIT_MONTH,
    startDateTime: nextMonthlyStart(),
    actions: [
      buildPullValueAction(field.mes_ant, field.mes), // puxa ANTES de zerar
      buildZeroValueAction(field.mes),
    ],
  });

  // ── 5. Automação PERIÓDICA anual: ANO_ANT ← ANO, depois ANO ← 0 ───────────────
  await createPeriodicAutomation({
    name: '(Volume de Compras) Periódica anual - virada de ano',
    unitId: REPEAT_UNIT_YEAR,
    startDateTime: nextYearlyStart(),
    actions: [
      buildPullValueAction(field.ano_ant, field.ano),
      buildZeroValueAction(field.ano),
    ],
  });

  async function createPeriodicAutomation({ name, unitId, startDateTime, actions }) {
    let filterId = null;
    try {
      await sleep(DELAY_MS);
      const fResp = await ploomesPost(uk, '/Filters', buildClientFilterPayload(name));
      filterId = fResp.value?.[0]?.Id;
      createdFilters.push({ name, filterId });
      log(`✔ Filtro "${name}" criado`);
    } catch (err) {
      log(`⚠ Erro ao criar filtro "${name}": ${err.message}`);
      totalErrors++;
      return;
    }
    try {
      await sleep(DELAY_MS);
      const aResp = await ploomesPost(
        uk,
        '/Automations',
        buildPeriodicAutomation({ name, filterId, unitId, startDateTime, actions })
      );
      createdAutomations.push({ name, automationId: aResp.value?.[0]?.Id });
      log(`✔ Automação "${name}" criada`);
    } catch (err) {
      log(`⚠ Erro ao criar automação "${name}": ${err.message}`);
      totalErrors++;
    }
  }

  function finalize() {
    log(totalErrors === 0
      ? '✅ Volume de Compras implementado com sucesso!'
      : `✅ Implementação concluída com ${totalErrors} erro(s). Verifique os itens marcados com ⚠ acima.`
    );
    return {
      totalErrors,
      createdFields,
      createdFilters,
      createdAutomations,
    };
  }

  return finalize();
}

// ── Desfazer implementação ──────────────────────────────────────────────────────

/**
 * Deleta todos os itens criados por uma implementação anterior.
 * Ordem: automações → filtros → campos.
 */
export async function undoVolumeCompras({ uk, result, onProgress }) {
  const log = (msg) => onProgress?.(msg);
  let totalErrors = 0;

  // ── Automações ──────────────────────────────────────────────────────────────
  let autoDeleted = 0;
  for (const { name, automationId } of result.createdAutomations) {
    if (!automationId) continue;
    try {
      await sleep(DELAY_MS);
      await ploomesDelete(uk, `/Automations(${automationId})`);
      autoDeleted++;
      log(`✔ Automação "${name}" deletada`);
    } catch (err) {
      log(`⚠ Erro ao deletar automação "${name}": ${err.message}`);
      totalErrors++;
    }
  }
  log(`📋 ${autoDeleted}/${result.createdAutomations.length} automação(ões) deletada(s)`);

  // ── Filtros ─────────────────────────────────────────────────────────────────
  let filterDeleted = 0;
  for (const { name, filterId } of result.createdFilters) {
    if (!filterId) continue;
    try {
      await sleep(DELAY_MS);
      await ploomesDelete(uk, `/Filters(${filterId})`);
      filterDeleted++;
      log(`✔ Filtro "${name}" deletado`);
    } catch (err) {
      log(`⚠ Erro ao deletar filtro "${name}": ${err.message}`);
      totalErrors++;
    }
  }
  log(`📋 ${filterDeleted}/${result.createdFilters.length} filtro(s) deletado(s)`);

  // ── Campos ──────────────────────────────────────────────────────────────────
  // Campos dinâmicos do Ploomes são deletados pela Key (texto), que precisa vir
  // entre aspas simples na URL OData — diferente do Id numérico.
  let fieldDeleted = 0;
  for (const { name, fieldKey } of result.createdFields) {
    if (!fieldKey) continue;
    try {
      await sleep(DELAY_MS);
      await ploomesDelete(uk, `/Fields('${fieldKey}')`);
      fieldDeleted++;
      log(`✔ Campo "${name}" deletado`);
    } catch (err) {
      log(`⚠ Erro ao deletar campo "${name}": ${err.message}`);
      totalErrors++;
    }
  }
  log(`📋 ${fieldDeleted}/${result.createdFields.length} campo(s) deletado(s)`);

  log(totalErrors === 0
    ? '✅ Implementação desfeita com sucesso!'
    : `✅ Deleção concluída com ${totalErrors} erro(s). Verifique os itens marcados com ⚠ acima.`
  );

  return { totalErrors };
}

// ── Planilha de IDs criados ──────────────────────────────────────────────────────

export function downloadVolumeComprasSpreadsheet(result) {
  const { createdFields, createdAutomations, createdFilters } = result;
  const maxRows = Math.max(createdFields.length, createdAutomations.length, createdFilters.length);

  const rows = [];
  for (let i = 0; i < maxRows; i++) {
    const f = createdFields[i];
    const a = createdAutomations[i];
    const fil = createdFilters[i];
    rows.push({
      'Campo - Nome': f?.name ?? '',
      'Campo - ID': f?.fieldId ?? '',
      'Campo - Key': f?.fieldKey ?? '',
      'Filtro - Nome': fil?.name ?? '',
      'Filtro - ID': fil?.filterId ?? '',
      'Automação - Nome': a?.name ?? '',
      'Automação - ID': a?.automationId ?? '',
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 34 }, { wch: 14 }, { wch: 40 }, { wch: 44 }, { wch: 14 }, { wch: 44 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Volume de Compras');
  XLSX.writeFile(wb, 'volume_compras_implementacao.xlsx');
}
