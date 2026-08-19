// utils/changelogUtils.js

// Exibida em ordem alfabética (label).
export const entityOptions = [
  { label: 'Clientes', value: 1 },
  { label: 'Documentos', value: 66 },
  { label: 'Negócios', value: 2 },
  { label: 'Propostas', value: 7 },
  { label: 'Registro de Interação', value: 36 },
  { label: 'Tarefas', value: 12 },
  { label: 'Usuários', value: 24 },
  { label: 'Vendas', value: 4 },
];

export const actionOptions = [
  { label: 'Criação', value: 1 },
  { label: 'Atualização', value: 2 },
  { label: 'Deleção', value: 3 },
  { label: 'Ganhar', value: 4 },
  { label: 'Perder', value: 5 },
  { label: 'Reabrir', value: 6 },
];

export const MAX_LOGS = 5000;

// Offset de timezone local (ex.: -03:00)
export const tzOffset = () => {
  const m = -new Date().getTimezoneOffset();
  const sign = m >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(m) / 60)).padStart(2, '0');
  const mm = String(Math.abs(m) % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};

// Formatar data com hora e timezone
export const formatDateTime = (dateObj) => {
  const d = new Date(dateObj);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  const SS = String(d.getSeconds()).padStart(2, '0');
  const MS = String(d.getMilliseconds()).padStart(3, '0');
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}.${MS}${tzOffset()}`;
};

// Parser de data PT-BR
export const parseDateTimePT = (str) => {
  if (!str) return null;
  const re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;
  const m = String(str).trim().match(re);
  if (!m) return null;
  const [_, dd, mm, yyyy, HH = '0', MM = '0'] = m;
  const d = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(HH),
    Number(MM),
    0,
    0
  );
  return isNaN(d) ? null : d;
};

// Validar formulário
export const validateForm = (userKey, startDate, endDate, logFields, toast) => {
  if (!userKey?.trim()) {
    toast.current?.show({
      severity: 'warn',
      summary: 'User Key',
      detail: 'Informe a User Key.',
    });
    return false;
  }
  if (!startDate || !endDate) {
    toast.current?.show({
      severity: 'warn',
      summary: 'Período',
      detail: 'Selecione as datas de início e término.',
    });
    return false;
  }
  if (new Date(endDate) < new Date(startDate)) {
    toast.current?.show({
      severity: 'warn',
      summary: 'Período inválido',
      detail: 'A data de término deve ser maior que a de início.',
    });
    return false;
  }
  if (!logFields.length) {
    toast.current?.show({
      severity: 'warn',
      summary: 'Campos do Log',
      detail: 'Selecione ao menos um campo do log.',
    });
    return false;
  }
  return true;
};

// Construir payload
export const buildPayload = (
  userKey,
  startDate,
  endDate,
  entity,
  action,
  userId,
  selectedFieldKeys,
  logFields,
  apiFields
) => {
  const parts = [
    `DateTime: { $gte: new Date('${formatDateTime(startDate)}'), $lte: new Date('${formatDateTime(endDate)}') }`,
  ];
  if (entity) parts.push(`EntityId: ${entity}`);
  if (action) parts.push(`ActionId: ${action}`);

  if (Array.isArray(userId) && userId.length > 0) {
    const userIds = userId.map((u) => u.Id);
    if (userIds.length === 1) {
      parts.push(`UserId: ${userIds[0]}`);
    } else {
      parts.push(`UserId: { $in: [${userIds.join(',')}] }`);
    }
  }

  const filtroString = `{ ${parts.join(', ')} }`;

  const selectedKeys = selectedFieldKeys.map((f) => f.Key);
  const raiz = [];
  const dinamico = [];

  selectedKeys.forEach((key) => {
    const field = apiFields.find((f) => f.Key === key);
    if (!field) return;
    if (field.Dynamic) {
      dinamico.push(field.Key);
    } else {
      raiz.push(field.UpdatePropertyName || field.Key);
    }
  });

  const logFieldKeys = logFields.map((f) => (typeof f === 'object' ? f.key : f));

  const payload = {
    userKey,
    filtro: filtroString,
    camposRaiz: Array.from(new Set(raiz)),
    camposDinamico: Array.from(new Set(dinamico)),
    camposLog: logFieldKeys,
  };

  localStorage.setItem(
    'extracaoPayload',
    JSON.stringify({
      ...payload,
      startDate,
      endDate,
      entity,
      action,
      fieldKeys: selectedKeys,
    })
  );

  return payload;
};

// Contar logs
export const contarLogs = async (userKey, filtroStr) => {
  const r = await fetch('https://logs-api.ploomes.com/api/ChangeLog/Count', {
    method: 'POST',
    headers: { 'User-Key': userKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Filter: filtroStr }),
  });
  if (!r.ok) throw new Error('Falha ao contar logs');
  return await r.json();
};

// Validar conta
export const validateAccount = async (uk) => {
  try {
    if (!uk?.trim()) return null;
    const r = await fetch('https://api2.ploomes.com/Account?$select=Id,Name', {
      headers: { 'User-Key': uk, 'Content-Type': 'application/json' },
    });
    if (!r.ok) throw new Error('Falha ao obter conta');
    const j = await r.json();
    return j?.value?.[0] ?? null;
  } catch {
    return null;
  }
};

// Fetch usuários
export const fetchAllUsers = async (userKey) => {
  const response = await fetch(`https://api2.ploomes.com/Users?$select=Id,Name,Email`, {
    method: 'GET',
    headers: {
      'User-Key': userKey,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
  const data = await response.json();
  return data.value || [];
};

// Fetch campos
export const fetchAllFields = async (userKey, entity) => {
  let filterQuery = '';
  if (entity) {
    filterQuery = `&$filter=Entity/Id eq ${entity}`;
  }

  const response = await fetch(
    `https://api2.ploomes.com/Fields?$select=Id,Key,Name,Entity,UpdatePropertyName,Dynamic&$expand=Entity${filterQuery}`,
    {
      method: 'GET',
      headers: {
        'User-Key': userKey,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
  const data = await response.json();
  return data.value || [];
};