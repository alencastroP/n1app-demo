// services/slaCardsService.js
// Chamadas diretas à API do Ploomes para implementação do SLA de Cards

import * as XLSX from 'xlsx';

const PLOOMES = 'https://api2.ploomes.com';
const DELAY_MS = 800;

function h(uk) {
  return { 'Content-Type': 'application/json', 'User-Key': uk };
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
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

async function ploomesPatch(uk, path, body, base = PLOOMES) {
  const resp = await fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: h(uk),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = `HTTP ${resp.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch (_) {}
    throw new Error(msg);
  }
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

export async function fetchStages(uk, pipelineId) {
  const data = await ploomesGet(
    uk,
    `/Deals@Stages?$filter=PipelineId+eq+${pipelineId}&$orderby=Ordination+asc&$select=Id,Name,PipelineId,Ordination`
  );
  return data.value ?? [];
}

export async function fetchAllStages(uk, pipelines) {
  const results = {};
  for (const pipeline of pipelines) {
    const stages = await fetchStages(uk, pipeline.Id);
    results[pipeline.Id] = stages;
  }
  return results;
}

// ── Helpers de data ────────────────────────────────────────────────────────────

// "2025-10-15T15:20:05.06-03:00" → "2025-10-15T15:20:05-03:00"
function normalizeDateTimeValue(isoStr) {
  return isoStr.replace(/(\d{2}:\d{2}:\d{2})\.\d+(-\d{2}:\d{2}|Z)/, '$1$2');
}

// "2025-10-15T15:20:05-03:00" → "10/15/2025 03:20:05 PM" (formato esperado pela fórmula de horas)
function formatDateForTextField(isoStr) {
  const m = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return isoStr;
  const [, year, month, day, h24, min, sec] = m;
  const h = parseInt(h24, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = String(h % 12 || 12).padStart(2, '0');
  return `${month}/${day}/${year} ${h12}:${min}:${sec} ${ampm}`;
}

// ── Builders de payload ────────────────────────────────────────────────────────

function buildFieldPayload(name, typeId) {
  return {
    Name: name,
    EntityId: 2,
    TypeId: typeId,
    Unique: false,
    UseCheckbox: false,
    Languages: [
      { LanguageId: 1, Name: name },
      { LanguageId: 2, Name: '' },
      { LanguageId: 3, Name: '' },
      { LanguageId: 4, Name: '' },
    ],
    DefaultStringValue: null,
    DefaultBigStringValue: null,
    DefaultIntegerValue: null,
    DefaultDecimalValue: null,
    DefaultDateTimeValue: null,
    DefaultBoolValue: null,
    ProductGroupId: null,
    GeneratedFormula: false,
    InternalFormula: null,
    FieldHideFormula: null,
    FieldDisableFormula: null,
    RequiredFieldFormula: null,
    ExternalFormulaUrl: null,
    ExternalFormulaMethod: null,
    ExternalFormulaHeaders: null,
    ExternalFormulaRequestBody: null,
    ExternalFormulaResponsePaths: [],
    ExternalFormulaMappedFields: [],
    FormulaVariables: [],
    AllowedUsers: [],
    AllowedTeams: [],
    AllowedUserProfiles: [],
    ExhibitionAllowedUsers: [],
    ExhibitionAllowedTeams: [],
    ExhibitionAllowedUserProfiles: [],
    RequiredRulesAffectedUsers: [],
    RequiredRulesAffectedTeams: [],
    RequiredRulesAffectedUserProfiles: [],
    CreateOptionsAllowedUsers: [],
    CreateOptionsAllowedTeams: [],
    CreateOptionsAllowedUserProfiles: [{ ProfileId: 1 }],
  };
}

function buildFilterPayload(stageName) {
  return {
    Name: `(SLA Cards) - Automação ${stageName}`,
    Url: '$filter=true',
    EntityId: 2,
    Listable: false,
    Fields: [],
    AllowedUsers: [],
    AllowedTeams: [],
  };
}

function buildFormulaVariable(varName, fieldKey, fieldId) {
  return {
    VariableName: varName,
    VariableFieldKey: fieldKey,
    VariableField: { Id: fieldId },
    VariableProperty: null,
    FieldPathId: 70,
    DefaultValue: '0',
    Required: false,
    IsFieldStandardVariable: true,
  };
}

// Fórmula para preencher campo de entrada de texto com timestamp atual (hora local -3h)
const FORMULA_ENTRY_TEXT = `let data = new Date();
data.setHours(data.getHours()-3);
data.toISOString;
data`;

// Fórmula para calcular DIAS entre dois campos de data (TypeId 8)
function buildDaysFormula(prevFieldName, currFieldName) {
  return `(function (inicial, final) {
  if (inicial == 0 || inicial == "" || inicial == null || final == 0 || final == "" || final == null) {
    return 0;
  }
  let data_inicial = new Date(inicial);
  let data_final = new Date(final);
  let diferenca = data_final - data_inicial;
  let dias = diferenca / (1000 * 3600 * 24);
  return dias.toString();
})("[Negócio.${prevFieldName}]", "[Negócio.${currFieldName}]");`;
}

// Fórmula para calcular HORAS entre dois campos de texto (TypeId 1, formato "MM/DD/YYYY HH:MM:SS AM/PM")
function buildHoursFormula(prevFieldName, currFieldName) {
  return `(function (inicial, final) {
  if (!inicial || !final) return 0;
  function parseDate(str) {
    var parts = str.split(" ");
    var dateParts = parts[0].split("/");
    var timeParts = parts[1].split(":");
    var ampm = parts[2];
    var month = parseInt(dateParts[0], 10) - 1;
    var day = parseInt(dateParts[1], 10);
    var year = parseInt(dateParts[2], 10);
    var hour = parseInt(timeParts[0], 10);
    var minute = parseInt(timeParts[1], 10);
    var second = parseInt(timeParts[2], 10);
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return new Date(year, month, day, hour, minute, second);
  }
  var data1 = parseDate(inicial);
  var data2 = parseDate(final);
  var diferencaMs = data2 - data1;
  var diferencaHoras = diferencaMs / (1000 * 60 * 60);
  return diferencaHoras.toFixed(0);
})("[Negócio.${prevFieldName}]", "[Negócio.${currFieldName}]");`;
}

// ── Action builders ─────────────────────────────────────────────────────────────

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

function makeAction(fieldKey, fields) {
  return {
    FieldKey: fieldKey,
    FieldPathId: 70,
    DateTimeValue: null,
    Fields: fields,
    ShouldClearFieldValues: false,
    ActionId: 1,
    Action: ACTION_EDIT_DATA,
  };
}

// Fields[] item for a date/datetime field filled with "today + 0 days"
function dateFieldItem(fieldKey) {
  return {
    FieldKey: fieldKey,
    MappedFieldPathId: null,
    MappedFieldKey: null,
    DaysFromNow: 0,
    InternalFormula: null,
    FormulaVariables: null,
  };
}

// Fields[] item for a text/formula field
function formulaFieldItem(fieldKey, formula, vars) {
  return {
    FieldKey: fieldKey,
    MappedFieldPathId: null,
    MappedFieldKey: null,
    DaysFromNow: null,
    InternalFormula: formula,
    FormulaVariables: vars,
  };
}

// Constrói o payload de automação para um estágio.
// Cada automação tem:
//   Action 0 — preenche campo de ENTRADA do estágio atual
//   Action 1 — preenche campo de SAÍDA do estágio ANTERIOR (se aplicável)
//   Action N — calcula SLA em dias e/ou horas (se aplicável e não for o 1º estágio)
function buildAutomationPayload({
  stageName,
  stageId,
  filterId,
  isFirst,
  slaType, // 'days' | 'hours' | 'both' | 'none'
  entryField,      // { Id, Key, Name } — campo de entrada do estágio atual
  prevEntryField,  // { Id, Key, Name } — campo de entrada do estágio anterior (null se isFirst)
  slaFieldDays,    // { Id, Key, Name } — campo de dias (null se não aplicável)
  slaFieldHours,   // { Id, Key, Name } — campo de horas (null se não aplicável)
  includeExitDate, // boolean
  prevExitField,   // { Id, Key, Name } — campo de saída do estágio anterior (null se isFirst)
}) {
  const actions = [];
  const useDateType = slaType === 'days' || slaType === 'none';

  // Action 0: preencher entrada do estágio atual
  actions.push(makeAction(entryField.Key,
    useDateType
      ? [dateFieldItem(entryField.Key)]
      : [formulaFieldItem(entryField.Key, FORMULA_ENTRY_TEXT, [])]
  ));

  // Action 1: preencher saída do estágio anterior (na mesma automação)
  if (includeExitDate && !isFirst && prevExitField) {
    actions.push(makeAction(prevExitField.Key,
      useDateType
        ? [dateFieldItem(prevExitField.Key)]
        : [formulaFieldItem(prevExitField.Key, FORMULA_ENTRY_TEXT, [])]
    ));
  }

  // Actions de cálculo de SLA (só a partir do 2º estágio)
  if (!isFirst && prevEntryField) {
    if ((slaType === 'days' || slaType === 'both') && slaFieldDays) {
      const formula = buildDaysFormula(prevEntryField.Name, entryField.Name);
      const vars = [
        buildFormulaVariable(`Negócio.${prevEntryField.Name}`, prevEntryField.Key, prevEntryField.Id),
        buildFormulaVariable(`Negócio.${entryField.Name}`, entryField.Key, entryField.Id),
      ];
      actions.push(makeAction(slaFieldDays.Key,
        [formulaFieldItem(slaFieldDays.Key, formula, vars)]
      ));
    }

    if ((slaType === 'hours' || slaType === 'both') && slaFieldHours) {
      const formula = buildHoursFormula(prevEntryField.Name, entryField.Name);
      const vars = [
        buildFormulaVariable(`Negócio.${prevEntryField.Name}`, prevEntryField.Key, prevEntryField.Id),
        buildFormulaVariable(`Negócio.${entryField.Name}`, entryField.Key, entryField.Id),
      ];
      actions.push(makeAction(slaFieldHours.Key,
        [formulaFieldItem(slaFieldHours.Key, formula, vars)]
      ));
    }
  }

  return {
    Name: `(SLA Cards) - Automação ${stageName}`,
    TriggerId: 1,
    TriggerFilterId: filterId,
    TriggerDealStageId: stageId,
    EntityId: 2,
    BlockTriggerByAutomation: true,
    Actions: actions,
    HasTriggerFields: false,
    TriggerFields: [],
  };
}

// ── Implementação principal ────────────────────────────────────────────────────

/**
 * Retorna o TypeId do campo de entrada baseado no tipo de SLA selecionado.
 * 'days' | 'none' → 8 (Data)
 * 'hours' | 'both' → 1 (Texto)
 */
export function getEntryFieldTypeId(slaType) {
  return slaType === 'days' || slaType === 'none' ? 8 : 1;
}

/**
 * Executa a implementação completa do SLA de Cards.
 * @param {object} params
 * @param {string} params.uk
 * @param {Array}  params.pipelines         — [{ Id, Name }]
 * @param {object} params.stagesByPipeline   — { [pipelineId]: [{ Id, Name, PipelineId, Ordination }] }
 * @param {string} params.fieldPrefix        — prefixo para o nome dos campos de entrada
 * @param {boolean} params.dynamicNaming     — true = "Entrada {Estágio}", false = "{prefix} {Estágio}"
 * @param {string} params.slaType            — 'days' | 'hours' | 'both' | 'none'
 * @param {boolean} params.fillRetroactive
 * @param {Function} params.onProgress       — (msg: string) => void
 * @returns {Promise<object>} resultado com IDs criados
 */
export async function implementSlaCards({
  uk,
  pipelines,
  stagesByPipeline,
  fieldPrefix,
  dynamicNaming,
  slaType,
  fillRetroactive,
  includeExitDate = true,
  onProgress,
}) {
  const log = (msg) => onProgress?.(msg);
  const entryTypeId = getEntryFieldTypeId(slaType);

  const createdFields = [];
  const createdFilters = [];
  const createdAutomations = [];
  let totalErrors = 0;

  // Mapas de campos por estágio (stageId → { Id, Key, Name })
  const entryFieldByStageId = {};
  const exitFieldByStageId = {};

  // Totaliza estágios para progresso
  const allStages = pipelines.flatMap(p => stagesByPipeline[p.Id] || []);
  const totalStages = allStages.length;
  let processed = 0;

  for (const pipeline of pipelines) {
    const stages = (stagesByPipeline[pipeline.Id] || [])
      .slice()
      .sort((a, b) => a.Ordination - b.Ordination);

    for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
      const stage = stages[stageIdx];
      const isFirst = stageIdx === 0;
      const prevStage = isFirst ? null : stages[stageIdx - 1];
      const prevEntryField = prevStage ? entryFieldByStageId[prevStage.Id] : null;

      // Gerar nome do campo de entrada
      const entryFieldName = dynamicNaming
        ? `Entrada ${stage.Name}`
        : `${fieldPrefix} ${stage.Name}`;

      log(`[${pipeline.Name}] ${stage.Name}: criando campo de entrada...`);

      // 1. Criar campo de entrada
      let entryField = null;
      try {
        await sleep(DELAY_MS);
        const resp = await ploomesPost(uk, '/Fields', buildFieldPayload(entryFieldName, entryTypeId));
        entryField = resp.value?.[0];
        entryFieldByStageId[stage.Id] = { Id: entryField.Id, Key: entryField.Key, Name: entryFieldName };
        createdFields.push({ pipelineId: pipeline.Id, pipelineName: pipeline.Name, stageId: stage.Id, stageName: stage.Name, type: 'entry', fieldId: entryField.Id, fieldKey: entryField.Key });
        log(`✔ Campo "${entryFieldName}" criado`);
      } catch (err) {
        log(`⚠ Erro ao criar campo de entrada para "${stage.Name}": ${err.message}`);
        totalErrors++;
        processed++;
        continue;
      }

      // 2. Criar campo de saída (se solicitado)
      if (includeExitDate) {
        const exitFieldName = dynamicNaming
          ? `Saída ${stage.Name}`
          : `${fieldPrefix} Saída ${stage.Name}`;
        try {
          await sleep(DELAY_MS);
          const resp = await ploomesPost(uk, '/Fields', buildFieldPayload(exitFieldName, entryTypeId));
          const exitField = resp.value?.[0];
          exitFieldByStageId[stage.Id] = { Id: exitField.Id, Key: exitField.Key, Name: exitFieldName };
          createdFields.push({ pipelineId: pipeline.Id, pipelineName: pipeline.Name, stageId: stage.Id, stageName: stage.Name, type: 'exit', fieldId: exitField.Id, fieldKey: exitField.Key });
          log(`✔ Campo "${exitFieldName}" criado`);
        } catch (err) {
          log(`⚠ Erro ao criar campo de saída para "${stage.Name}": ${err.message}`);
          totalErrors++;
        }
      }

      // 3. Criar campos auxiliares de SLA (se aplicável)
      let slaFieldDays = null;
      let slaFieldHours = null;

      if (slaType === 'days' || slaType === 'both') {
        try {
          await sleep(DELAY_MS);
          const daysName = `Dias no estágio ${stage.Name}`;
          const resp = await ploomesPost(uk, '/Fields', buildFieldPayload(daysName, 4));
          slaFieldDays = { Id: resp.value?.[0]?.Id, Key: resp.value?.[0]?.Key, Name: daysName };
          createdFields.push({ pipelineId: pipeline.Id, pipelineName: pipeline.Name, stageId: stage.Id, stageName: stage.Name, type: 'sla-days', fieldId: slaFieldDays.Id, fieldKey: slaFieldDays.Key });
          log(`✔ Campo "${daysName}" criado`);
        } catch (err) {
          log(`⚠ Erro ao criar campo de dias para "${stage.Name}": ${err.message}`);
          totalErrors++;
        }
      }

      if (slaType === 'hours' || slaType === 'both') {
        try {
          await sleep(DELAY_MS);
          const hoursName = `Horas no estágio ${stage.Name}`;
          const resp = await ploomesPost(uk, '/Fields', buildFieldPayload(hoursName, 4));
          slaFieldHours = { Id: resp.value?.[0]?.Id, Key: resp.value?.[0]?.Key, Name: hoursName };
          createdFields.push({ pipelineId: pipeline.Id, pipelineName: pipeline.Name, stageId: stage.Id, stageName: stage.Name, type: 'sla-hours', fieldId: slaFieldHours.Id, fieldKey: slaFieldHours.Key });
          log(`✔ Campo "${hoursName}" criado`);
        } catch (err) {
          log(`⚠ Erro ao criar campo de horas para "${stage.Name}": ${err.message}`);
          totalErrors++;
        }
      }

      // 4. Criar filtro
      let filterId = null;
      try {
        await sleep(DELAY_MS);
        const resp = await ploomesPost(uk, '/Filters', buildFilterPayload(stage.Name));
        filterId = resp.value?.[0]?.Id;
        createdFilters.push({ stageId: stage.Id, filterId });
        log(`✔ Filtro para "${stage.Name}" criado`);
      } catch (err) {
        log(`⚠ Erro ao criar filtro para "${stage.Name}": ${err.message}`);
        totalErrors++;
        processed++;
        continue;
      }

      // 5. Criar automação
      try {
        await sleep(DELAY_MS);
        const prevExitField = prevStage ? (exitFieldByStageId[prevStage.Id] ?? null) : null;
        const automPayload = buildAutomationPayload({
          stageName: stage.Name,
          stageId: stage.Id,
          filterId,
          isFirst,
          slaType,
          entryField: entryFieldByStageId[stage.Id],
          prevEntryField,
          slaFieldDays,
          slaFieldHours,
          includeExitDate,
          prevExitField,
        });
        const resp = await ploomesPost(uk, '/Automations', automPayload);
        createdAutomations.push({ pipelineId: pipeline.Id, pipelineName: pipeline.Name, stageId: stage.Id, stageName: stage.Name, automationId: resp.value?.[0]?.Id });
        log(`✔ Automação "${stage.Name}" criada`);
      } catch (err) {
        log(`⚠ Erro ao criar automação para "${stage.Name}": ${err.message}`);
        totalErrors++;
      }

      processed++;
    }
  }

  if (fillRetroactive) {
    // TODO: retroativos — implementar em versão futura
    log('ℹ Preenchimento retroativo ainda não disponível nesta versão.');
  }

  log(totalErrors === 0
    ? '✅ SLA de Cards implementado com sucesso!'
    : `✅ Implementação concluída com ${totalErrors} erro(s). Verifique os itens marcados com ⚠ acima.`
  );

  return {
    totalStages,
    processed,
    totalErrors,
    createdFields,
    createdFilters,
    createdAutomations,
    fillRetroactive,
  };
}

// ── Desfazer implementação ─────────────────────────────────────────────────────

/**
 * Deleta todos os itens criados por uma implementação anterior.
 * Ordem: automações → filtros → campos (das dependências para as raízes).
 */
export async function undoSlaImplementation({ uk, result, onProgress }) {
  const log = (msg) => onProgress?.(msg);
  let totalErrors = 0;

  // 1. Deletar automações
  for (const { stageName, automationId } of result.createdAutomations) {
    if (!automationId) continue;
    try {
      await sleep(DELAY_MS);
      await ploomesDelete(uk, `/Automations(${automationId})`);
      log(`✔ Automação "${stageName}" deletada`);
    } catch (err) {
      log(`⚠ Erro ao deletar automação "${stageName}": ${err.message}`);
      totalErrors++;
    }
  }

  // 2. Deletar filtros
  for (const { filterId } of result.createdFilters) {
    if (!filterId) continue;
    try {
      await sleep(DELAY_MS);
      await ploomesDelete(uk, `/Filters(${filterId})`);
      log(`✔ Filtro ${filterId} deletado`);
    } catch (err) {
      log(`⚠ Erro ao deletar filtro ${filterId}: ${err.message}`);
      totalErrors++;
    }
  }

  // 3. Deletar campos
  // Campos dinâmicos são deletados pela Key (texto entre aspas simples na URL),
  // não pelo Id numérico — DELETE por Id retorna 404.
  for (const { stageName, type, fieldKey } of result.createdFields) {
    if (!fieldKey) continue;
    try {
      await sleep(DELAY_MS);
      await ploomesDelete(uk, `/Fields('${fieldKey}')`);
      log(`✔ Campo "${type}" de "${stageName}" deletado`);
    } catch (err) {
      log(`⚠ Erro ao deletar campo "${type}" de "${stageName}": ${err.message}`);
      totalErrors++;
    }
  }

  log(totalErrors === 0
    ? '✅ Implementação desfeita com sucesso!'
    : `✅ Deleção concluída com ${totalErrors} erro(s). Verifique os itens marcados com ⚠ acima.`
  );

  return { totalErrors };
}

// ── Planilha de IDs criados ────────────────────────────────────────────────────

/**
 * Gera e baixa um arquivo .xlsx com os IDs de campos e automações criados.
 */
export function downloadSlaSpreadsheet(result) {
  const { createdFields, createdAutomations } = result;
  const maxRows = Math.max(createdFields.length, createdAutomations.length);

  const rows = [];
  for (let i = 0; i < maxRows; i++) {
    const f = createdFields[i];
    const a = createdAutomations[i];
    rows.push({
      'Fields - Funil': f?.pipelineName ?? '',
      'Fields - ID': f?.fieldId ?? '',
      'Fields - Key': f?.fieldKey ?? '',
      'Fields - Estágio': f?.stageName ?? '',
      'Fields - Tipo': f?.type ?? '',
      'Automations - Funil': a?.pipelineName ?? '',
      'Automations - ID': a?.automationId ?? '',
      'Automations - Estágio': a?.stageName ?? '',
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 28 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SLA Cards');
  XLSX.writeFile(wb, 'sla_cards_implementacao.xlsx');
}

// ── Preenchimento retroativo ───────────────────────────────────────────────────

/**
 * Busca todos os negócios dos funis selecionados, lê o histórico de estágios
 * no timeline de cada um e preenche retroativamente os campos de data de
 * entrada/saída e SLA criados pela implementação.
 *
 * @param {string}   params.uk
 * @param {Array}    params.pipelines         — [{ Id, Name }]
 * @param {object}   params.slaResult         — retorno de implementSlaCards
 * @param {string}   params.slaType           — 'days'|'hours'|'both'|'none'
 * @param {boolean}  params.includeExitDate
 * @param {Function} params.onProgress        — (msg: string) => void
 * @param {Function} params.onPct             — (pct: number) => void
 */
export async function fillRetroactiveSla({
  uk,
  pipelines,
  slaResult,
  slaType,
  includeExitDate,
  onProgress,
  onPct,
}) {
  const log = (msg) => onProgress?.(msg);
  const entryTypeId = ['days', 'none'].includes(slaType) ? 8 : 1;

  // Monta mapeamento: stageId → { entry, exit, 'sla-days', 'sla-hours' }
  const fieldByStageId = {};
  for (const f of slaResult.createdFields) {
    if (!fieldByStageId[f.stageId]) fieldByStageId[f.stageId] = {};
    fieldByStageId[f.stageId][f.type] = { Key: f.fieldKey };
  }
  const knownStageIds = new Set(Object.keys(fieldByStageId).map(Number));

  let totalErrors = 0;

  // ── Fase 1: coletar IDs de negócios por funil ──────────────────────────────
  log('🔍 Buscando negócios nos funis selecionados...');
  const dealIdsByPipeline = {};
  let grandTotal = 0;

  for (const pipeline of pipelines) {
    dealIdsByPipeline[pipeline.Id] = [];
    let skip = 0;
    while (true) {
      await sleep(DELAY_MS);
      const data = await ploomesGet(
        uk,
        `/Deals?$filter=PipelineId+eq+${pipeline.Id}&$select=Id&$top=100&$skip=${skip}`
      );
      const batch = data.value ?? [];
      dealIdsByPipeline[pipeline.Id].push(...batch.map(d => d.Id));
      if (batch.length < 100) break;
      skip += 100;
    }
    log(`📋 [${pipeline.Name}] ${dealIdsByPipeline[pipeline.Id].length} negócio(s) encontrado(s)`);
    grandTotal += dealIdsByPipeline[pipeline.Id].length;
  }

  log(`📊 Total a processar: ${grandTotal} negócio(s)`);
  let processedDeals = 0;

  // ── Fase 2: processar cada negócio ────────────────────────────────────────
  for (const pipeline of pipelines) {
    const dealIds = dealIdsByPipeline[pipeline.Id];
    if (dealIds.length === 0) continue;
    log(`\n[${pipeline.Name}] Iniciando preenchimento retroativo...`);

    for (const dealId of dealIds) {
      // GET timeline do negócio com paginação
      let timelineEntries = [];
      try {
        let tlSkip = 0;
        const TL_TOP = 5;
        while (true) {
          await sleep(DELAY_MS);
          const data = await ploomesGet(
            uk,
            `/Timeline?timelineId=3&dealId=${dealId}` +
            `&$expand=DealStageHistory($expand=Stage,NewStage)` +
            `&$orderby=Id+desc` +
            `&$select=EntityId,DealId,DateTime,DealStageHistory` +
            `&$filter=EntityId+eq+8` +
            `&$top=${TL_TOP}&$skip=${tlSkip}`
          );
          const batch = data.value ?? [];
          timelineEntries.push(...batch);
          if (batch.length < TL_TOP) break;
          tlSkip += TL_TOP;
        }
      } catch (err) {
        log(`⚠ Deal ${dealId}: erro ao buscar timeline — ${err.message}`);
        totalErrors++;
        processedDeals++;
        onPct?.(Math.round((processedDeals / grandTotal) * 100));
        continue;
      }

      // Extrai datas de entrada e saída por estágio.
      // Timeline está em ordem decrescente; a primeira ocorrência de cada
      // estágio é a movimentação mais recente.
      // Entradas sem NewStageId representam a criação do card no estágio
      // inicial — usamos esse DateTime como entryDate daquele estágio.
      const stageData = {}; // stageId → { entryDate, exitDate }
      for (const entry of timelineEntries) {
        const history = entry.DealStageHistory;
        if (!history) continue;
        const exitedId  = history.StageId;
        const enteredId = history.NewStageId;
        const dt = entry.DateTime;

        if (enteredId != null) {
          if (!stageData[enteredId]) stageData[enteredId] = {};
          if (!stageData[enteredId].entryDate) stageData[enteredId].entryDate = dt;
        } else {
          // Criação do card: StageId é o estágio inicial, sem NewStageId
          if (!stageData[exitedId]) stageData[exitedId] = {};
          if (!stageData[exitedId].entryDate) stageData[exitedId].entryDate = dt;
        }

        if (!stageData[exitedId]) stageData[exitedId] = {};
        if (enteredId != null && !stageData[exitedId].exitDate) stageData[exitedId].exitDate = dt;
      }

      // Monta OtherProperties para o PATCH
      const otherProperties = [];

      for (const stageIdStr of Object.keys(stageData)) {
        const stageId = Number(stageIdStr);
        if (!knownStageIds.has(stageId)) continue;

        const sd = stageData[stageIdStr];
        const fields = fieldByStageId[stageId];
        if (!fields) continue;

        // Data de entrada
        if (fields.entry && sd.entryDate) {
          if (entryTypeId === 8) {
            otherProperties.push({
              FieldKey: fields.entry.Key,
              DateTimeValue: normalizeDateTimeValue(sd.entryDate),
            });
          } else {
            otherProperties.push({
              FieldKey: fields.entry.Key,
              StringValue: formatDateForTextField(sd.entryDate),
            });
          }
        }

        // Data de saída
        if (includeExitDate && fields.exit && sd.exitDate) {
          if (entryTypeId === 8) {
            otherProperties.push({
              FieldKey: fields.exit.Key,
              DateTimeValue: normalizeDateTimeValue(sd.exitDate),
            });
          } else {
            otherProperties.push({
              FieldKey: fields.exit.Key,
              StringValue: formatDateForTextField(sd.exitDate),
            });
          }
        }

        // Cálculo de SLA (apenas se houver entrada E saída)
        if (sd.entryDate && sd.exitDate) {
          const diffMs = new Date(sd.exitDate) - new Date(sd.entryDate);

          if ((slaType === 'days' || slaType === 'both') && fields['sla-days']) {
            otherProperties.push({
              FieldKey: fields['sla-days'].Key,
              IntegerValue: Math.max(0, Math.round(diffMs / (1000 * 3600 * 24))),
            });
          }

          if ((slaType === 'hours' || slaType === 'both') && fields['sla-hours']) {
            otherProperties.push({
              FieldKey: fields['sla-hours'].Key,
              IntegerValue: Math.max(0, Math.round(diffMs / (1000 * 3600))),
            });
          }
        }
      }

      if (otherProperties.length === 0) {
        log(`ℹ Deal ${dealId}: sem histórico nos estágios implementados`);
        processedDeals++;
        onPct?.(Math.round((processedDeals / grandTotal) * 100));
        continue;
      }

      // PATCH do negócio
      try {
        await sleep(DELAY_MS);
        await ploomesPatch(uk, `/Deals(${dealId})`, { OtherProperties: otherProperties });
        log(`✔ Deal ${dealId}: ${otherProperties.length} campo(s) atualizado(s)`);
      } catch (err) {
        log(`⚠ Deal ${dealId}: erro no PATCH — ${err.message}`);
        totalErrors++;
      }

      processedDeals++;
      onPct?.(Math.round((processedDeals / grandTotal) * 100));
    }
  }

  log(totalErrors === 0
    ? `✅ Retroativo concluído! ${processedDeals} negócio(s) processado(s).`
    : `✅ Retroativo concluído com ${totalErrors} erro(s). ${processedDeals} negócio(s) processado(s).`
  );

  return { totalDeals: grandTotal, processedDeals, totalErrors };
}
