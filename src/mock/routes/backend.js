// demo/src/mock/routes/backend.js
//
// Respostas fixas para as rotas /api/* do backend do N1 App.
// Cada handler recebe { url, method, body, headers, signal } e devolve um
// Response nativo (helpers em ../http.js). Nada aqui sai da máquina do usuário.

import { json, erro, blob, sse, delay } from '../http';
import { DEMO_USER, criarTokenDemo } from '../demoSession';
import { int, pick, chance, diasAtras, range, EMPRESAS, PESSOAS, emailDe } from '../seed';
import { planilhaDemo } from '../xlsx';
import {
  CONTA_DEMO, USUARIOS_PLOOMES, USUARIOS_PERMISSOES, EQUIPES_PERMISSOES, HISTORICO,
  camposDemo, registrosODataDemo, CATALOGO_APIHUB, REQUISICOES_PRONTAS,
  automacoesDemo, funilDemo, cardDemo, FORM_META_FUNIL, triagemDemo,
  eventosRelatorioIntercom, relatorioIntercom, auditoriaIaDemo, chamadosDemo,
  respostaCopilot, DOC_CONTA_DEMO, markdownCompilado,
} from '../fixtures';
import {
  progressoChangelog, resetarChangelog,
  iniciarJobMerge, cancelarJobMerge, statusJobMerge,
  iniciarJobTickets, cancelarJobTickets, statusJobTickets,
  iniciarJobAuditoria, cancelarJobAuditoria, statusJobAuditoria,
} from '../jobs';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Açúcar sintático: [regex do pathname, handler, método opcional]. */
function rota(pattern, handler, metodo = null) {
  return { pattern, handler, metodo };
}

export const rotasBackend = [
  // ── Autenticação — a demo aceita qualquer e-mail/senha ────────────────────
  rota(/^\/api\/partners\/login$/, async ({ body }) => {
    if (!body?.email || !body?.password) return erro('Informe e-mail e senha.', 401);
    return json({ ok: true, userName: DEMO_USER.nome, partnersUK: 'demo-partners-user-key' });
  }),

  rota(/^\/api\/auth\/login$/, async ({ body }) =>
    json({ token: criarTokenDemo(body?.email), email: body?.email || DEMO_USER.email })),

  // ── Perfil / permissões ───────────────────────────────────────────────────
  rota(/^\/api\/profile\/me/, async () =>
    json({ id: DEMO_USER.id, profileId: DEMO_USER.profileId, teamId: DEMO_USER.teamId })),

  rota(/^\/api\/profile\/teams$/, async () => json({ teams: EQUIPES_PERMISSOES })),

  rota(/^\/api\/profile\/users$/, async () => json({ users: USUARIOS_PERMISSOES })),

  rota(/^\/api\/profile\/users\/\d+$/, async ({ method, body, url }) => {
    if (method === 'PATCH') {
      const id = Number(url.pathname.split('/').pop());
      const alvo = USUARIOS_PERMISSOES.find((u) => u.Id === id);
      if (alvo) {
        if (body?.profileId != null) alvo.ProfileId = Number(body.profileId);
        if (body?.teamId != null) alvo.TeamId = Number(body.teamId);
      }
    }
    return json({ ok: true });
  }),

  // ── Histórico de ações ────────────────────────────────────────────────────
  rota(/^\/api\/user-history\/log$/, async () => json({ ok: true }, { status: 202 })),
  rota(/^\/api\/user-history\/of/, async () => json({ items: HISTORICO.slice(0, 14) })),
  rota(/^\/api\/user-history$/, async () => json({ items: HISTORICO })),

  // ── Filas por shard ───────────────────────────────────────────────────────
  rota(/^\/api\/queues\/(\d+)$/, async ({ url }) => json({
    shard: Number(url.pathname.split('/').pop()),
    webhooks: int(120, 8400),
    automations: int(40, 3200),
    updatedAt: new Date().toISOString(),
  })),

  // ── Consulta de importação ────────────────────────────────────────────────
  rota(/^\/api\/importation$/, async ({ body }) => {
    const total = int(420, 5200);
    const erros = int(0, Math.floor(total * 0.08));
    const atualizados = int(0, Math.floor((total - erros) * 0.4));
    return json({
      Id: body?.importationId || '88213',
      CreateDate: diasAtras(int(1, 20)),
      CreatorId: USUARIOS_PLOOMES[3].Id,
      TotalRows: total,
      InsertedEntities: total - erros - atualizados,
      UpdatedEntities: atualizados,
      ErrorRows: erros,
      TemplateId: body?.templateId ?? 1,
      SpreadsheetUrl: 'about:blank#planilha-original-demo',
      SpreadsheetWithLogsUrl: 'about:blank#planilha-com-logs-demo',
      MappedFields: [
        { FieldKey: 'contact_name', ColumnIndex: 0 },
        { FieldKey: 'contact_email', ColumnIndex: 1 },
        { FieldKey: 'contact_cnpj', ColumnIndex: 2 },
        { FieldKey: 'contact_city', ColumnIndex: 3 },
        { FieldKey: 'contact_segmento', ColumnIndex: 4 },
        { FieldKey: 'contact_porte', ColumnIndex: 5 },
      ],
    });
  }),

  rota(/^\/api\/importation\/user$/, async ({ body }) =>
    json(USUARIOS_PLOOMES.find((u) => u.Id === Number(body?.userId)) ?? USUARIOS_PLOOMES[3])),

  rota(/^\/api\/importation\/fields$/, async ({ body }) => {
    const rotulos = {
      contact_name: 'Nome do cliente',
      contact_email: 'E-mail',
      contact_cnpj: 'CNPJ',
      contact_city: 'Cidade',
      contact_segmento: 'Segmento (personalizado)',
      contact_porte: 'Porte da empresa (personalizado)',
    };
    return json((body?.keys || []).map((k) => ({
      Key: k,
      Name: rotulos[k] ?? k,
      PropertyName: k,
      Languages: { ptBr: { Name: rotulos[k] ?? k } },
    })));
  }),

  // ── Changelog: extração (XLSX) + progresso ────────────────────────────────
  rota(/^\/api\/changelog\/extract$/, async ({ signal }) => {
    resetarChangelog();
    // Demora proposital: a tela de Carregando mostra a barra andando.
    await delay(5400, signal);
    const linhas = range(60, (i) => ({
      Data: new Date(Date.now() - i * 36e5).toLocaleString('pt-BR'),
      Usuario: PESSOAS[i % PESSOAS.length],
      Entidade: pick(['Negócios', 'Clientes', 'Propostas', 'Tarefas']),
      Acao: pick(['Criação', 'Atualização', 'Deleção']),
      Campo: pick(['Título', 'Etapa', 'Valor', 'Responsável', 'Status']),
      De: pick(['Em aberto', 'Qualificação', 'R$ 12.400,00', '—']),
      Para: pick(['Proposta', 'Negociação', 'R$ 18.900,00', 'Ganho']),
    }));
    return blob(
      planilhaDemo(linhas, 'Changelog'),
      `changelog_demo_${new Date().toISOString().slice(0, 10)}.xlsx`,
      XLSX_MIME,
      { 'X-Session-Id': 'demo-session-changelog' },
    );
  }),

  rota(/^\/api\/changelog\/progress\//, async () => {
    const pct = progressoChangelog();
    return json({
      status: 'running',
      percentage: pct,
      processed: Math.round((pct / 100) * 1240),
      total: 1240,
      estimatedTimeMs: 5400,
      phase: pct < 35 ? 'Consultando logs' : pct < 75 ? 'Enriquecendo campos' : 'Montando planilha',
    });
  }),

  rota(/^\/api\/changelog\/cancel\//, async () => json({ ok: true, cancelled: true })),

  // ── Central da API ────────────────────────────────────────────────────────
  rota(/^\/api\/apihub\/catalog$/, async () => json(CATALOGO_APIHUB)),

  rota(/^\/api\/apihub\/ready-requests$/, async () => json({ items: REQUISICOES_PRONTAS })),

  rota(/^\/api\/apihub\/validate-uk/, async () =>
    json({ ok: true, valid: true, accountId: CONTA_DEMO.Id, accountName: CONTA_DEMO.Name })),

  rota(/^\/api\/apihub\/request$/, async ({ body, method }) => {
    if (method === 'DELETE') {
      return json({ ok: true, status: 204, data: null, elapsedMs: int(90, 400) });
    }
    const endpoint = String(body?.endpoint || 'Deals').replace(/^\//, '');
    return json({
      ok: true,
      status: 200,
      elapsedMs: int(120, 900),
      data: { '@odata.count': 128, value: registrosODataDemo(endpoint, 5) },
    });
  }),

  rota(/^\/api\/apihub\/cancel-bulk$/, async () => json({ ok: true, cancelled: true })),

  rota(/^\/api\/apihub\/bulk$/, async ({ body }) => {
    const total = Array.isArray(body?.items) ? body.items.length : 12;
    const eventos = [{ type: 'start', total, jobId: 'demo-bulk-1' }];
    let sucesso = 0;
    let falha = 0;
    for (let i = 1; i <= total; i++) {
      const ok = chance(0.9);
      if (ok) sucesso += 1; else falha += 1;
      eventos.push({
        type: 'progress',
        jobId: 'demo-bulk-1',
        current: i,
        total,
        success: sucesso,
        failed: falha,
        log: {
          index: i,
          id: body?.items?.[i - 1]?.id ?? i,
          status: ok ? 200 : 400,
          ok,
          message: ok ? 'OK' : 'Registro bloqueado por automação (demo)',
        },
      });
    }
    eventos.push({
      type: 'complete', jobId: 'demo-bulk-1', total, success: sucesso, failed: falha, results: [],
    });
    return sse(eventos, { step: 140 });
  }),

  rota(/^\/api\/apihub\/ready-actions\/[^/]+\/(preview|scan)$/, async () => json({
    ok: true,
    total: 24,
    items: range(24, (i) => ({
      id: 5100 + i,
      name: `${EMPRESAS[i % EMPRESAS.length]} — registro ${5100 + i}`,
      de: pick(['SP', 'Sao Paulo', 'S. Paulo']),
      para: 'São Paulo',
    })),
  })),

  rota(/^\/api\/apihub\/ready-actions\/[^/]+\/execute$/, async () => {
    const total = 24;
    const eventos = [{ type: 'start', total }];
    for (let i = 1; i <= total; i++) {
      eventos.push({
        type: 'progress', current: i, total, success: i, failed: 0,
        log: { index: i, id: 5100 + i, ok: true, status: 200, message: 'Atualizado (demo)' },
      });
    }
    eventos.push({ type: 'complete', total, success: total, failed: 0, results: [] });
    return sse(eventos, { step: 120 });
  }),

  // ── Explorador de campos ──────────────────────────────────────────────────
  rota(/^\/api\/fields-explorer\/by-entity/, async ({ url }) => {
    const entityId = Number(url.searchParams.get('entityId')) || 1;
    const data = camposDemo(entityId);
    return json({ data, total: data.length, entityId });
  }),

  // ── Power BI ──────────────────────────────────────────────────────────────
  rota(/^\/api\/pbi\/supportaccess\//, async () => json(range(6, (i) => ({
    id: 900 + i,
    tableName: ['Negócios', 'Clientes', 'Propostas', 'Tarefas', 'Vendas', 'Usuários'][i],
    link: `https://demo.local/powerbi/tabela-${i + 1}`,
    userId: USUARIOS_PLOOMES[i % USUARIOS_PLOOMES.length].Id,
    createDate: diasAtras(int(1, 90)),
    rowCount: int(120, 24000),
  })))),

  rota(/^\/api\/pbi\/read-link$/, async () => json({
    columns: ['Id', 'Título', 'Cliente', 'Etapa', 'Valor', 'Responsável', 'Atualizado em'],
    rows: range(25, (i) => [
      String(30500 + i),
      `Oportunidade ${30500 + i}`,
      EMPRESAS[i % EMPRESAS.length],
      pick(['Qualificação', 'Proposta', 'Negociação', 'Fechamento']),
      `R$ ${int(3, 240)}.${String(int(0, 999)).padStart(3, '0')},00`,
      PESSOAS[i % PESSOAS.length],
      new Date(Date.now() - i * 864e5).toLocaleDateString('pt-BR'),
    ]),
    total: 25,
  })),

  // ── Troca de e-mail ───────────────────────────────────────────────────────
  rota(/^\/api\/emailfix\/users\/[^/]+\/email$/, async ({ body }) =>
    json({ ok: true, email: body?.email, message: 'E-mail atualizado (demo).' })),

  rota(/^\/api\/emailfix\/users/, async () => json({
    users: USUARIOS_PLOOMES.map((u) => ({ ...u, LastLogin: diasAtras(int(1, 120)) })),
  })),

  // ── Mesclagem de entidades ────────────────────────────────────────────────
  rota(/^\/api\/merge\/fields/, async ({ url }) => json({
    fields: camposDemo(url.searchParams.get('entity') === 'Deals' ? 2 : 1).map((f) => ({
      Id: f.id, Key: f.key, Name: f.name, Dynamic: f.dynamic, EntityId: f.entityId,
    })),
  })),

  rota(/^\/api\/merge\/active$/, async () => json({ active: false, job: null })),

  rota(/^\/api\/merge\/start$/, async () => {
    iniciarJobMerge();
    return json({ jobId: 'demo-merge-1', status: 'running', message: 'Job iniciado (demo).' });
  }),

  rota(/^\/api\/merge\/cancel\//, async () => {
    cancelarJobMerge();
    return json({ ok: true, status: 'cancelled' });
  }),

  rota(/^\/api\/merge\/job\/[^/]+\/csv$/, async () => blob(
    ['grupo,mantido,mesclado,campo_chave',
      ...range(18, (i) => `G${i + 1},${41000 + i * 2},${41001 + i * 2},CNPJ`)].join('\n'),
    'mesclagem_demo.csv', 'text/csv; charset=utf-8',
  )),

  rota(/^\/api\/merge\/job\//, async () => json(statusJobMerge())),

  // ── Sankhya ───────────────────────────────────────────────────────────────
  rota(/^\/api\/sankhya\/account-id/, async () => json({ accountId: CONTA_DEMO.Id })),

  rota(/^\/api\/sankhya\/check-login\//, async () => json({
    ok: true,
    bearerToken: 'demo.sankhya.bearer.token.exemplo',
    expiresIn: 3600,
    ambiente: 'PROD',
    error: null,
  })),

  rota(/^\/api\/sankhya\/campos-parceiro$/, async () => json({
    campos: [
      { campo: 'CODPARC', descricao: 'Código do parceiro' },
      { campo: 'NOMEPARC', descricao: 'Nome do parceiro' },
      { campo: 'RAZAOSOCIAL', descricao: 'Razão social' },
      { campo: 'CGC_CPF', descricao: 'CNPJ/CPF' },
      { campo: 'ATIVO', descricao: 'Ativo' },
      { campo: 'CLIENTE', descricao: 'É cliente' },
      { campo: 'EMAIL', descricao: 'E-mail' },
      { campo: 'TELEFONE', descricao: 'Telefone' },
      { campo: 'CIDADE', descricao: 'Cidade' },
    ],
  })),

  rota(/^\/api\/sankhya\/consultar-parceiro$/, async () => json({
    total: 3,
    parceiros: range(3, (i) => ({
      CODPARC: String(1200 + i),
      NOMEPARC: EMPRESAS[i],
      RAZAOSOCIAL: `${EMPRESAS[i]} LTDA`,
      CGC_CPF: `${int(10, 99)}.${int(100, 999)}.${int(100, 999)}/0001-${int(10, 99)}`,
      ATIVO: 'S',
      CLIENTE: 'S',
      EMAIL: emailDe(PESSOAS[i], 'parceiro.invalid'),
      TELEFONE: `(11) 9${int(1000, 9999)}-${int(1000, 9999)}`,
      CIDADE: pick(['São Paulo', 'Joinville', 'Campinas']),
    })),
  })),

  rota(/^\/api\/sankhya\/last-integrations\//, async () => json({
    version: 4,
    latest: {
      version: 4, env: 'PROD', updatedAt: diasAtras(6),
      updatedBy: PESSOAS[2], note: 'Atualização de endpoint de estoque',
    },
    history: range(6, (i) => ({
      version: 4 - i,
      env: 'PROD',
      updatedAt: diasAtras(6 + i * 21),
      updatedBy: PESSOAS[i % PESSOAS.length],
      note: pick([
        'Troca de token do integrador',
        'Ajuste no mapeamento de parceiros',
        'Correção de itens corrompidos',
        'Migração para v4 da query API',
      ]),
    })),
  })),

  rota(/^\/api\/sankhya\/client-version/, async () =>
    json({ version: '4.28.1', raw: { build: '2026.03.11', modulo: 'SK-Integrador' } })),

  rota(/^\/api\/sankhya\/troca-token/, async ({ method }) => (method === 'GET'
    ? json({ ok: true, tokenAtual: 'demo-token-atual-****', env: 'PROD' })
    : json({ ok: true, message: 'Token trocado com sucesso (demo).', env: 'PROD' }))),

  // ── Omie ──────────────────────────────────────────────────────────────────
  rota(/^\/api\/omie\/account-info/, async () => json({
    accountId: CONTA_DEMO.Id,
    accountName: CONTA_DEMO.Name,
    omieAppKey: '21********45',
    integrationActive: true,
    lastSync: diasAtras(1),
    entidades: [
      { entidade: 'Clientes', total: 1284, ultimaSync: diasAtras(1) },
      { entidade: 'Produtos', total: 743, ultimaSync: diasAtras(1) },
      { entidade: 'Pedidos', total: 2190, ultimaSync: diasAtras(2) },
      { entidade: 'Notas fiscais', total: 1877, ultimaSync: diasAtras(2) },
    ],
  })),

  rota(/^\/api\/omie\/me/, async () =>
    json({ Id: USUARIOS_PLOOMES[0].Id, Name: USUARIOS_PLOOMES[0].Name, AccountId: CONTA_DEMO.Id })),

  rota(/^\/api\/omie\/user-by-name/, async ({ url }) => {
    const nome = (url.searchParams.get('name') || '').toLowerCase();
    const achado = USUARIOS_PLOOMES.find((u) => u.Name.toLowerCase().includes(nome));
    return json({ user: achado ?? USUARIOS_PLOOMES[1] });
  }),

  rota(/^\/api\/omie\/(firstsync|bring|force)/, async () => json({
    ok: true,
    jobId: 'demo-omie-1',
    message: 'Sincronização disparada (demo). Nada foi enviado à Omie.',
  })),

  // ── Intercom ──────────────────────────────────────────────────────────────
  rota(/^\/api\/intercom\/tags\/list$/, async () => json({
    tags: [
      { id: '9001', name: 'churn-risco-alto' },
      { id: '9002', name: 'onboarding-2026' },
      { id: '9003', name: 'plano-enterprise' },
      { id: '9004', name: 'nps-detrator' },
      { id: '9005', name: 'integracao-erp' },
      { id: '9006', name: 'suporte-premium' },
    ],
  })),

  rota(/^\/api\/intercom\/tags$/, async ({ body }) => json({
    ok: true,
    applied: (body?.ids || []).length,
    failed: 0,
    tagName: body?.tagName,
    details: (body?.ids || []).map((id) => ({ id, ok: true })),
  })),

  rota(/^\/api\/intercom\/dashboard\/options$/, async () => json({
    teams: [
      { id: 1, name: 'Transacional N1' },
      { id: 2, name: 'Premium N1' },
      { id: 3, name: 'Dedicados N1' },
      { id: 4, name: 'Suporte N2' },
    ],
    agents: relatorioIntercom().agents.map((a) => ({ id: a.id, name: a.name })),
  })),

  rota(/^\/api\/intercom\/dashboard\/report$/, async () =>
    sse(eventosRelatorioIntercom(), { step: 260 })),

  rota(/^\/api\/intercom\/dashboard\/export$/, async () => blob(
    planilhaDemo(relatorioIntercom().agents, 'Dashboard'),
    'dashboard_intercom_demo.xlsx', XLSX_MIME,
  )),

  rota(/^\/api\/intercom\/churn\/jobs\/[^/]+\/xlsx/, async () => blob(
    ['# Análise de churn (demo)', '', ...range(6, (i) =>
      `## ${EMPRESAS[i]}\n\n- Conversas: ${int(3, 28)}\n- Sentimento: ${pick(['neutro', 'negativo', 'positivo'])}\n- Motivo principal: ${pick(['preço', 'integração', 'suporte', 'adoção'])}\n`,
    )].join('\n'),
    'churn_demo.md', 'text/markdown; charset=utf-8',
  )),

  rota(/^\/api\/intercom\/churn\/jobs$/, async () => {
    const total = 18;
    const eventos = [{ type: 'start', jobId: 'demo-churn-1', total }];
    for (let i = 1; i <= total; i++) {
      const empresa = EMPRESAS[i % EMPRESAS.length];
      eventos.push({
        type: 'progress', jobId: 'demo-churn-1', current: i, total,
        empresa, message: `Analisando conversas de ${empresa}…`,
      });
    }
    eventos.push({
      type: 'complete', jobId: 'demo-churn-1', total,
      downloadUrl: '/api/intercom/churn/jobs/demo-churn-1/xlsx?format=md',
    });
    return sse(eventos, { step: 180 });
  }),

  rota(/^\/api\/intercom\/n8n\/churn$/, async () =>
    json({ ok: true, jobId: 'demo-churn-1', message: 'Fluxo disparado (demo).' })),

  rota(/^\/api\/intercom\/n8n\/download$/, async () =>
    blob('# Relatório de churn (demo)\n', 'churn_demo.md', 'text/markdown; charset=utf-8')),

  // ── Extração de chamados ──────────────────────────────────────────────────
  rota(/^\/api\/ploomes-tickets\/pipelines$/, async () => json({
    pipelines: [
      {
        id: 41001,
        name: 'Chamados de Produto',
        stages: [
          { id: 1, name: 'Triagem' }, { id: 2, name: 'Em análise' },
          { id: 3, name: 'Aguardando cliente' }, { id: 4, name: 'Resolvido' },
        ],
      },
      {
        id: 41002,
        name: 'Chamados de Manutenção',
        stages: [
          { id: 5, name: 'Aberto' }, { id: 6, name: 'Em correção' }, { id: 7, name: 'Fechado' },
        ],
      },
    ],
  })),

  rota(/^\/api\/ploomes-tickets\/contact-lookup$/, async () => json({
    contacts: range(4, (i) => ({
      id: 60100 + i,
      name: EMPRESAS[i],
      email: emailDe(PESSOAS[i], 'cliente.invalid'),
      accountId: CONTA_DEMO.Id,
    })),
  })),

  rota(/^\/api\/ploomes-tickets\/jobs\/start$/, async () => {
    iniciarJobTickets();
    return json({ jobId: 'demo-tickets-1', status: 'running' });
  }),

  rota(/^\/api\/ploomes-tickets\/jobs\/[^/]+\/status$/, async () => json(statusJobTickets())),

  rota(/^\/api\/ploomes-tickets\/jobs\/[^/]+\/cancel$/, async () => {
    cancelarJobTickets();
    return json({ ok: true, status: 'cancelled' });
  }),

  rota(/^\/api\/ploomes-tickets\/jobs\/[^/]+\/download$/, async () =>
    blob(JSON.stringify(chamadosDemo(), null, 2), 'chamados_demo.json', 'application/json')),

  // ── Consulta de automações ────────────────────────────────────────────────
  rota(/^\/api\/ploomes-automacoes\/export/, async () => blob(
    planilhaDemo(automacoesDemo().map((a) => ({
      Id: a.id,
      Nome: a.name,
      Entidade: a.entity.name,
      Gatilho: a.trigger.name,
      Ativa: a.enabled ? 'Sim' : 'Não',
      Filtros: a.triggerFilter ? a.triggerFilter.fields.length : 0,
      Acoes: a.actions.length,
    })), 'Automações'),
    'automacoes_demo.xlsx', XLSX_MIME,
  )),

  rota(/^\/api\/ploomes-automacoes/, async () => {
    const automations = automacoesDemo();
    return json({ automations, total: automations.length });
  }),

  // ── Funil técnico / Kanban ────────────────────────────────────────────────
  rota(/^\/api\/ploomes-kanban\/funnel$/, async () => json(funilDemo())),

  rota(/^\/api\/ploomes-kanban\/deal\/(\d+)$/, async ({ url }) =>
    json(cardDemo(Number(url.pathname.split('/').pop())))),

  rota(/^\/api\/ploomes-kanban\/contacts/, async ({ url }) => {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    if (q.length < 2) return json({ contacts: [] });
    return json({
      contacts: EMPRESAS.filter((e) => e.toLowerCase().includes(q)).slice(0, 8)
        .map((nome, i) => ({ id: 60200 + i, name: nome })),
    });
  }),

  rota(/^\/api\/ploomes-kanban\/form-meta$/, async () => json(FORM_META_FUNIL)),

  rota(/^\/api\/ploomes-kanban\/deals$/, async ({ body }) => json({
    ok: true,
    dealId: 77123,
    title: body?.titulo || 'Novo caso técnico (demo)',
    stageId: body?.stageId ?? FORM_META_FUNIL.defaultStageId,
    interactionNoteOk: true,
  })),

  rota(/^\/api\/funil-tecnico\/validate-uk$/, async () =>
    json({ ok: true, accountId: CONTA_DEMO.Id, accountName: CONTA_DEMO.Name })),

  rota(/^\/api\/funil-tecnico\/approve$/, async () =>
    json({ ok: true, message: 'Triagem aprovada (demo).' })),

  rota(/^\/api\/funil-tecnico\/\d+\/triagem-feedback$/, async () =>
    json({ ok: true, message: 'Feedback registrado (demo).' })),

  rota(/^\/api\/funil-tecnico\/\d+\/triagem-avancada$/, async () =>
    json({ ok: true, ...triagemDemo(1), aprofundada: true })),

  rota(/^\/api\/funil-tecnico\/deep-analysis$/, async () => sse([
    { type: 'start', total: 4 },
    { type: 'progress', current: 1, total: 4, etapa: 'Coletando interações' },
    { type: 'progress', current: 2, total: 4, etapa: 'Consultando base de conhecimento' },
    { type: 'progress', current: 3, total: 4, etapa: 'Correlacionando casos parecidos' },
    { type: 'progress', current: 4, total: 4, etapa: 'Redigindo plano de ação' },
    { type: 'complete', analise: triagemDemo(2) },
  ], { step: 520 })),

  // ── Auditoria de IA ───────────────────────────────────────────────────────
  rota(/^\/api\/auditoria-ia\/jobs$/, async () => {
    const resultados = auditoriaIaDemo();
    const eventos = [{ type: 'start', jobId: 'demo-audit-1', total: resultados.length }];
    resultados.forEach((r, i) => eventos.push({
      type: 'progress',
      jobId: 'demo-audit-1',
      current: i + 1,
      total: resultados.length,
      message: `Avaliando conversa ${r.conversationId}…`,
    }));
    eventos.push({
      type: 'complete', jobId: 'demo-audit-1', total: resultados.length, resultados,
    });
    return sse(eventos, { step: 150 });
  }),

  rota(/^\/api\/auditoria-ia\/mark-audited$/, async () => json({ ok: true })),

  // ── Auditoria de usuários ─────────────────────────────────────────────────
  rota(/^\/api\/user-audit\/users$/, async () => json({ users: USUARIOS_PLOOMES })),

  rota(/^\/api\/user-audit\/extract$/, async () => {
    iniciarJobAuditoria();
    return json({ jobId: 'demo-audit-users-1', status: 'running' });
  }),

  rota(/^\/api\/user-audit\/[^/]+\/status/, async ({ url }) =>
    json(statusJobAuditoria(Number(url.searchParams.get('since')) || 0))),

  rota(/^\/api\/user-audit\/[^/]+\/cancel$/, async () => {
    cancelarJobAuditoria();
    return json({ ok: true, status: 'cancelled' });
  }),

  rota(/^\/api\/user-audit\/[^/]+\/download$/, async () => blob(
    planilhaDemo(range(40, (i) => ({
      Usuario: PESSOAS[i % PESSOAS.length],
      Acao: pick(['Login', 'Editou negócio', 'Exportou relatório', 'Criou cliente']),
      Data: new Date(Date.now() - i * 72e5).toLocaleString('pt-BR'),
      IP: `189.${int(1, 250)}.${int(1, 250)}.${int(1, 250)}`,
    })), 'Auditoria'),
    'auditoria_usuarios_demo.xlsx', XLSX_MIME,
  )),

  // ── Documentador de contas ────────────────────────────────────────────────
  rota(/^\/api\/account-documenter\/validate-keys$/, async () =>
    json({ ok: true, valid: true, accountId: CONTA_DEMO.Id, accountName: CONTA_DEMO.Name })),

  rota(/^\/api\/account-documenter\/extract$/, async () => sse([
    { type: 'start', total: 7 },
    { type: 'progress', current: 1, total: 7, etapa: 'Funis e etapas' },
    { type: 'progress', current: 2, total: 7, etapa: 'Campos personalizados' },
    { type: 'progress', current: 3, total: 7, etapa: 'Automações' },
    { type: 'progress', current: 4, total: 7, etapa: 'CPQ e tabelas de preço' },
    { type: 'progress', current: 5, total: 7, etapa: 'Perfis e permissões' },
    { type: 'progress', current: 6, total: 7, etapa: 'Uso e adoção' },
    { type: 'progress', current: 7, total: 7, etapa: 'Gerando documento' },
    {
      type: 'complete',
      accountName: CONTA_DEMO.Name,
      markdown: DOC_CONTA_DEMO,
      documento: DOC_CONTA_DEMO,
      filename: 'documentacao_aurora_demo.md',
    },
  ], { step: 620 })),

  // ── Exportação de base ────────────────────────────────────────────────────
  rota(/^\/api\/account-export/, async () => sse([
    { type: 'start', total: 5, entidades: ['Negócios', 'Clientes', 'Propostas', 'Vendas', 'Tarefas'] },
    { type: 'progress', current: 1, total: 5, entidade: 'Negócios', linhas: 4210 },
    { type: 'progress', current: 2, total: 5, entidade: 'Clientes', linhas: 1284 },
    { type: 'progress', current: 3, total: 5, entidade: 'Propostas', linhas: 932 },
    { type: 'progress', current: 4, total: 5, entidade: 'Vendas', linhas: 611 },
    { type: 'progress', current: 5, total: 5, entidade: 'Tarefas', linhas: 2870 },
    { type: 'complete', total: 5, arquivos: 5, downloadUrl: 'about:blank#export-demo' },
  ], { step: 700 })),

  // ── Copilot / RAG ─────────────────────────────────────────────────────────
  rota(/^\/api\/rag\/ask$/, async ({ body }) => json(respostaCopilot(body?.pergunta))),

  // ── Compilador de conhecimento ────────────────────────────────────────────
  rota(/^\/api\/knowledge-compiler\/compile$/, async ({ body }) => json({
    filename: `${String(body?.titulo || 'rascunho-demo').toLowerCase().replace(/\s+/g, '-')}.md`,
    markdown: markdownCompilado(body),
    avisos: [
      'Conteúdo gerado em modo demonstração — nenhum modelo de IA foi consultado.',
      'Revise os passos antes de promover para o RAG.',
    ],
    modelo: 'demo-offline',
  })),

  // ── Resumo da daily ───────────────────────────────────────────────────────
  rota(/^\/api\/daily-resume\/transcribe$/, async () => json({
    transcriptions: [
      { name: 'daily-01.ogg', text: 'Time alinhou a fila de chamados do dia e priorizou os casos de integração.' },
      { name: 'daily-02.ogg', text: 'Pendência do cliente Aurora segue aguardando retorno do time de produto.' },
    ],
  })),

  // ── Implementação Express ─────────────────────────────────────────────────
  rota(/^\/api\/process-implementer\/processes$/, async () => json({
    processes: [
      { id: 'sla-cards', name: 'SLA de Cards', description: 'Cria campos e automações de SLA no funil informado.' },
      { id: 'volume-compras', name: 'Volume de Compras', description: 'Configura o cálculo de volume por cliente.' },
      { id: 'roleta-usuarios', name: 'Roleta de Usuários', description: 'Distribui negócios entre os responsáveis.' },
    ],
  })),

  rota(/^\/api\/process-implementer\/validate-keys$/, async () =>
    json({ ok: true, valid: true, accountId: CONTA_DEMO.Id, accountName: CONTA_DEMO.Name })),

  rota(/^\/api\/process-implementer\/run$/, async () => json({
    success: true,
    message: 'Processo implementado com sucesso (demo). Nenhuma conta foi alterada.',
  })),

  rota(/^\/api\/process-implementer\/(start|triage)$/, async () =>
    json({ ok: true, jobId: 'demo-proc-1', status: 'running' })),

  // ── Conversor JSON → Excel ────────────────────────────────────────────────
  rota(/^\/api\/jsonx\/convert/, async ({ url }) => {
    const linhas = range(12, (i) => ({
      Id: 5200 + i,
      Nome: EMPRESAS[i % EMPRESAS.length],
      Valor: int(1000, 90000),
      Status: pick(['Aberto', 'Ganho', 'Perdido']),
    }));
    if (url.searchParams.get('format') === 'csv') {
      const csv = [
        Object.keys(linhas[0]).join(','),
        ...linhas.map((l) => Object.values(l).join(',')),
      ].join('\n');
      return blob(csv, 'json_convert_demo.csv', 'text/csv; charset=utf-8');
    }
    return blob(planilhaDemo(linhas, 'Convertido'), 'json_convert_demo.xlsx', XLSX_MIME);
  }),
];
