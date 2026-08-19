// services/rouletteImplementerService.js
// Chamadas diretas à API do Ploomes para implementação da Roleta de Usuários

const PLOOMES = 'https://api2.ploomes.com';

function h(uk) {
  return { 'Content-Type': 'application/json', 'User-Key': uk };
}

async function ploomesGet(uk, path) {
  const resp = await fetch(`${PLOOMES}${path}`, { headers: h(uk) });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = `HTTP ${resp.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch (_) {}
    throw new Error(msg);
  }
  return resp.json();
}

async function ploomesPost(uk, path, body) {
  const resp = await fetch(`${PLOOMES}${path}`, {
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

/**
 * Valida se a User-Key é válida realizando uma chamada simples.
 * @returns {{ count: number, firstUserName: string }}
 */
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

export async function fetchUsers(uk) {
  const data = await ploomesGet(
    uk,
    '/Users?$filter=Integration+eq+false+and+Editable+eq+true+and+Suspended+eq+false&$select=Id,Name,Email,AvatarUrl&$count=true'
  );
  return data.value ?? [];
}

// ── Builders de body ───────────────────────────────────────────────────────────

function actionBase() {
  return {
    ShouldClearFieldValues: false,
    ActionId: 1,
    Action: {
      Id: 1,
      Name: 'Editar dados',
      FieldKeyRequired: true,
      FieldKeyOrRecipientsEmailAddressRequired: false,
      DealStageIdRequired: false,
      EmailTemplateIdRequired: false,
      TaskDaysFromNowRequired: false,
      RequestBodyRequired: false,
      LossReasonIdRequired: false,
    },
  };
}

function buildCounterFilter(pipelines) {
  const urlParts = pipelines.map(p => `PipelineId+eq+${p.Id}`).join('+or+');
  return {
    Name: 'Roleta de usuários - contador',
    Url: `$filter=((${urlParts}))`,
    EntityId: 2,
    Listable: false,
    Fields: [
      {
        LogicalGroupNumber: 1,
        FieldKey: 'deal_pipeline',
        OperationId: 1,
        RelativeDate: false,
        Interval: false,
        FieldPath: [{ FieldKey: 'deal_pipeline', Ordination: 1 }],
        Values: pipelines.map(p => ({ IntegerValue: p.Id })),
      },
    ],
  };
}

function buildCounterAutomation({ filterId, contactId, auxClientField, counterContactField, counterDealField, userCount }) {
  return {
    Name: 'Roleta de usuários - contador',
    TriggerId: 5,
    TriggerFilterId: filterId,
    EntityId: 2,
    BlockTriggerByAutomation: true,
    Actions: [
      {
        FieldKey: auxClientField.Key,
        FieldPathId: 70,
        Fields: [{ FieldKey: auxClientField.Key, MappedFieldPathId: 70, MappedFieldKey: 'deal_contact' }],
        ...actionBase(),
      },
      {
        Id: 2,
        FieldKey: 'deal_contact',
        FieldPathId: 70,
        IntegerValue: contactId,
        ...actionBase(),
      },
      {
        Id: 3,
        FieldKey: counterContactField.Key,
        FieldPathId: 40,
        Fields: [
          {
            FieldKey: counterContactField.Key,
            InternalFormula: `(function(contador,nmrUsuarios){\r\n  if(contador<nmrUsuarios){\r\n    return contador+1\r\n  } else {\r\n    return 0\r\n  }\r\n})([Cliente.(Roleta de usuários) Contador oficial],${userCount - 1})`,
            GeneratedFormula: false,
            FormulaVariables: [
              {
                VariableName: 'Cliente.(Roleta de usuários) Contador oficial',
                VariableFieldKey: counterContactField.Key,
                VariableField: { Id: counterContactField.Id },
                FieldPathId: 40,
                DefaultValue: '0',
                Required: false,
                IsFieldStandardVariable: true,
              },
            ],
          },
        ],
        ...actionBase(),
      },
      {
        Id: 4,
        FieldKey: counterDealField.Key,
        FieldPathId: 70,
        Fields: [{ FieldKey: counterDealField.Key, MappedFieldPathId: 40, MappedFieldKey: counterContactField.Key }],
        ...actionBase(),
      },
      {
        Id: 5,
        FieldKey: 'deal_contact',
        FieldPathId: 70,
        Values: [],
        IntegerValue: null,
        Fields: [{ FieldKey: 'deal_contact', MappedFieldPathId: 70, MappedFieldKey: auxClientField.Key }],
        ...actionBase(),
      },
    ],
    HasTriggerFields: false,
  };
}

function buildDistributionFilter({ user, index, counterDealField }) {
  return {
    Name: `[ROLETA] (${index + 1}) Responsável = ${index}  -> ${user.Name}`,
    Url: `$filter=(((OtherProperties/any(o:+o/FieldId+eq+${counterDealField.Id}+and+(o/IntegerValue+eq+${index})))))`,
    EntityId: 2,
    Listable: false,
    Fields: [
      {
        LogicalGroupNumber: 1,
        FieldKey: counterDealField.Key,
        OperationId: 1,
        RelativeDate: false,
        Interval: false,
        Values: [{ IntegerValue: index }],
      },
    ],
  };
}

function buildDistributionAutomation({ user, index, filterId, counterDealField }) {
  return {
    Name: `[ROLETA] (${index + 1}) Responsável = ${index}  -> ${user.Name}`,
    TriggerId: 6,
    TriggerFilterId: filterId,
    TriggerDealStageId: null,
    EntityId: 2,
    BlockTriggerByAutomation: false,
    Actions: [
      {
        FieldKey: 'deal_owner',
        FieldPathId: 70,
        IntegerValue: user.Id,
        ...actionBase(),
      },
    ],
    HasTriggerFields: true,
    TriggerFields: [{ FieldKey: counterDealField.Key }],
  };
}

// ── Implementação principal ────────────────────────────────────────────────────

/**
 * Executa a implementação completa da Roleta de Usuários.
 * @param {{ uk: string, pipelines: Array, users: Array, onProgress: Function }} params
 * @returns {Promise<object>} resultado com os IDs e chaves criados
 */
export async function implementRoulette({ uk, pipelines, users, onProgress }) {
  const log = (msg) => onProgress?.(msg);

  // 1. Criar cliente auxiliar (fake contact)
  log('Criando cliente auxiliar da roleta...');
  const contactResp = await ploomesPost(uk, '/Contacts', {
    Name: '(Não deletar) Cliente Fake para roleta',
  });
  const contactId = contactResp.value[0].Id;
  log(`✔ Cliente auxiliar criado (ID: ${contactId})`);

  // 2. Campo contador no cliente
  log('Criando campo contador no cliente...');
  const counterContactResp = await ploomesPost(uk, '/Fields', {
    Name: '(Roleta) Contador oficial',
    EntityId: 1,
    TypeId: 4,
  });
  const counterContactField = counterContactResp.value[0]; // { Id, Key }
  log(`✔ Campo contador no cliente criado`);

  // 3. Campo cliente auxiliar nos negócios
  log('Criando campo cliente auxiliar nos negócios...');
  const auxClientResp = await ploomesPost(uk, '/Fields', {
    Name: '(Roleta) - cliente oficial',
    EntityId: 2,
    TypeId: 7,
    SecondaryEntityId: 1,
  });
  const auxClientField = auxClientResp.value[0];
  log(`✔ Campo cliente auxiliar nos negócios criado`);

  // 4. Campo contador nos negócios
  log('Criando campo contador nos negócios...');
  const counterDealResp = await ploomesPost(uk, '/Fields', {
    Name: '(Roleta) - contador oficial do negócio',
    EntityId: 2,
    TypeId: 4,
  });
  const counterDealField = counterDealResp.value[0];
  log(`✔ Campo contador nos negócios criado`);

  // 5. Filtro da automação de contador
  log('Criando filtro da automação de contador...');
  const counterFilterResp = await ploomesPost(uk, '/Filters', buildCounterFilter(pipelines));
  const counterFilterId = counterFilterResp.value[0].Id;
  log(`✔ Filtro da automação criado`);

  // 6. Automação de contador
  log('Criando automação de contador...');
  await ploomesPost(
    uk,
    '/Automations',
    buildCounterAutomation({
      filterId: counterFilterId,
      contactId,
      auxClientField,
      counterContactField,
      counterDealField,
      userCount: users.length,
    })
  );
  log(`✔ Automação "Roleta de usuários - contador" criada`);

  // 7. Automações de distribuição (uma por usuário)
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    log(`Criando distribuição para ${user.Name} (${i + 1}/${users.length})...`);

    const distFilterResp = await ploomesPost(
      uk,
      '/Filters',
      buildDistributionFilter({ user, index: i, counterDealField })
    );
    const distFilterId = distFilterResp.value[0].Id;

    await ploomesPost(
      uk,
      '/Automations',
      buildDistributionAutomation({ user, index: i, filterId: distFilterId, counterDealField })
    );
    log(`✔ Distribuição criada para ${user.Name}`);
  }

  log('✔ Roleta de usuários implementada com sucesso!');

  return {
    contactId,
    counterContactField,
    auxClientField,
    counterDealField,
    pipelinesCount: pipelines.length,
    usersCount: users.length,
  };
}
