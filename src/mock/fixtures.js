// demo/src/mock/fixtures.js
//
// Todo o "banco de dados" da demo. Determinístico (ver seed.js): a cada reload
// as telas mostram exatamente os mesmos números, o que deixa a navegação
// coerente e boa para print/gravação.
//
// Nada aqui vem de API. Empresas, pessoas e e-mails são inventados
// (domínios .invalid, que nunca resolvem).

import {
  reseed, rnd, int, pick, pickMany, chance, diasAtras, range,
  EMPRESAS, PESSOAS, AGENTES_N1, emailDe,
} from './seed';
import { DEMO_USER } from './demoSession';
import { PROFILES } from '../config/permissionsConfig';
import { TEAMS, TEAM_LABELS } from '../config/teamsConfig';

reseed();

// ─── Conta ativa / usuários Ploomes ──────────────────────────────────────────

export const CONTA_DEMO = {
  Id: 402931,
  Name: 'Aurora Componentes Industriais',
  LogoUrl: null,
};

export const USUARIOS_PLOOMES = range(14, (i) => {
  const nome = PESSOAS[i % PESSOAS.length];
  return {
    Id: 71200 + i * 7,
    Name: nome,
    Email: emailDe(nome, 'auroracomp.invalid'),
    AvatarUrl: null,
    Suspended: i > 11,
  };
});

// ─── Conta de permissões (Gerenciar Usuários) ────────────────────────────────

export const EQUIPES_PERMISSOES = Object.entries(TEAM_LABELS).map(([id, name]) => ({
  Id: Number(id),
  Name: name,
}));

export const USUARIOS_PERMISSOES = [
  {
    Id: DEMO_USER.id,
    Name: DEMO_USER.nome,
    Email: DEMO_USER.email,
    ProfileId: DEMO_USER.profileId,
    TeamId: DEMO_USER.teamId,
  },
  ...range(17, (i) => {
    const nome = PESSOAS[(i + 3) % PESSOAS.length];
    return {
      Id: 900010 + i,
      Name: nome,
      Email: emailDe(nome, 'ploomesdemo.invalid'),
      ProfileId: pick([
        PROFILES.BASICO, PROFILES.NORMAL, PROFILES.NORMAL,
        PROFILES.GESTOR, PROFILES.NORMAL,
      ]),
      TeamId: pick([
        TEAMS.SUPORTE_N1, TEAMS.SUPORTE_N1_PREMIUM, TEAMS.SUPORTE_N1_DEDICADO,
        TEAMS.SUPORTE_N2, TEAMS.CS, TEAMS.OPERACOES, TEAMS.PRODUTO,
      ]),
    };
  }),
];

// ─── Histórico de ações ──────────────────────────────────────────────────────

// Shape consumido por UserHistoryTimeline: { t, a, s, d, r }
//   t = timestamp ISO · a = ação canônica · s = service key · d = descrição
//   r = 'ok' | 'erro'
const ACOES_HISTORICO = [
  { a: 'extracao', s: 'changelog', d: 'Changelog · Negócios · Atualização · 1.240 logs' },
  { a: 'consulta', s: 'importation', d: 'Importação #88213 · 4.812 linhas' },
  { a: 'consulta', s: 'apihub', d: 'GET /Deals?$top=50' },
  { a: 'consulta', s: 'field-explorer', d: 'Entidade Clientes · 63 campos' },
  { a: 'execucao', s: 'emailfix', d: 'Troca de e-mail do usuário 71214' },
  { a: 'execucao', s: 'entity-merge', d: 'Mesclagem · Clientes · CNPJ · 18 grupos' },
  { a: 'consulta', s: 'queues', d: 'Filas do shard 12' },
  { a: 'extracao', s: 'account-documenter', d: 'Documentação da conta Aurora Componentes' },
  { a: 'extracao', s: 'user-audit', d: 'Auditoria · 4 usuários · 30 dias' },
  { a: 'consulta', s: 'ploomes-automacoes', d: '37 automações listadas' },
  { a: 'criacao', s: 'ploomes-kanban', d: 'Novo caso técnico no funil' },
  { a: 'login', s: null, d: 'Entrou no N1 App' },
];

export const HISTORICO = range(24, (i) => ({
  id: `hist-${i}`,
  ...ACOES_HISTORICO[i % ACOES_HISTORICO.length],
  r: chance(0.88) ? 'ok' : 'erro',
  t: diasAtras(Math.floor(i / 3)),
}));

// ─── Campos por entidade (Explorador de Campos / Merge / Changelog) ──────────

const CAMPOS_POR_ENTIDADE = {
  1: { // Clientes
    nativos: [
      ['Name', 'Nome', 1], ['Email', 'E-mail', 1], ['Register', 'CNPJ/CPF', 1],
      ['CityId', 'Cidade', 5], ['StateId', 'Estado', 5], ['Phones', 'Telefones', 1],
      ['CreateDate', 'Data de criação', 4], ['OwnerId', 'Responsável', 5],
    ],
    dinamicos: [
      ['contact_segmento', 'Segmento', 5], ['contact_porte', 'Porte da empresa', 5],
      ['contact_faturamento', 'Faturamento anual', 3], ['contact_origem', 'Origem do lead', 5],
      ['contact_nps', 'Nota NPS', 3], ['contact_contrato', 'Nº do contrato', 1],
      ['contact_renovacao', 'Data de renovação', 4], ['contact_ativo_erp', 'Ativo no ERP', 6],
    ],
  },
  2: { // Negócios
    nativos: [
      ['Title', 'Título', 1], ['Amount', 'Valor', 3], ['StageId', 'Etapa', 5],
      ['StatusId', 'Status', 5], ['ContactId', 'Cliente', 5], ['OwnerId', 'Responsável', 5],
      ['StartDate', 'Data de início', 4], ['FinishDate', 'Data de fechamento', 4],
    ],
    dinamicos: [
      ['deal_motivo_perda', 'Motivo da perda', 5], ['deal_produto', 'Produto principal', 5],
      ['deal_sla_horas', 'SLA (horas)', 3], ['deal_concorrente', 'Concorrente', 1],
      ['deal_desconto', 'Desconto aplicado', 3], ['deal_recorrente', 'Receita recorrente', 6],
    ],
  },
  7: { // Propostas
    nativos: [['Number', 'Número', 3], ['Amount', 'Valor total', 3], ['DealId', 'Negócio', 5]],
    dinamicos: [['quote_validade', 'Validade', 4], ['quote_condicao', 'Condição de pagamento', 5]],
  },
  24: { // Usuários
    nativos: [['Name', 'Nome', 1], ['Email', 'E-mail', 1], ['ProfileId', 'Perfil', 5]],
    dinamicos: [['user_ramal', 'Ramal', 1], ['user_unidade', 'Unidade', 5]],
  },
};

// Entidades sem definição própria caem aqui — ainda com volume suficiente para
// a tabela, a paginação e o painel de detalhes ficarem interessantes na demo.
const CAMPOS_GENERICOS = {
  nativos: [
    ['Id', 'Identificador', 3], ['Name', 'Nome', 1], ['Code', 'Código', 1],
    ['CreateDate', 'Data de criação', 4], ['LastUpdateDate', 'Última atualização', 4],
    ['OwnerId', 'Responsável', 5], ['Active', 'Ativo', 6],
  ],
  dinamicos: [
    ['custom_obs', 'Observações', 2], ['custom_prioridade', 'Prioridade', 5],
    ['custom_codigo_externo', 'Código externo (ERP)', 1],
    ['custom_categoria', 'Categoria', 5], ['custom_valor_ref', 'Valor de referência', 3],
    ['custom_revisado_em', 'Revisado em', 4],
  ],
};

const NOMES_ENTIDADE = {
  1: 'Clientes', 2: 'Negócios', 4: 'Vendas (CPQ)', 7: 'Propostas (CPQ)',
  10: 'Produtos', 11: 'Grupos de produtos', 12: 'Tarefas', 14: 'Produto da Proposta',
  15: 'Sua Empresa', 20: 'Produto da Venda', 24: 'Usuários', 25: 'Cidades',
  31: 'Estágios', 36: 'Registros de interação', 44: 'Funis', 66: 'Documentos (CPQ)',
  75: 'Produto de cliente',
};

export function nomeEntidade(entityId) {
  return NOMES_ENTIDADE[Number(entityId)] ?? `Entidade ${entityId}`;
}

/** Campos de uma entidade, no shape que o Explorador de Campos consome. */
export function camposDemo(entityId) {
  // Semente derivada da entidade: a mesma entidade devolve sempre os mesmos
  // campos, mesmo que a tela seja consultada várias vezes.
  reseed(0xc4 + Number(entityId) * 7919);
  const def = CAMPOS_POR_ENTIDADE[Number(entityId)] ?? CAMPOS_GENERICOS;
  let id = 3000 + Number(entityId) * 100;

  const monta = (lista, dynamic) => lista.map(([key, name, typeId]) => ({
    id: id++,
    key,
    name,
    typeId,
    dynamic,
    entityId: Number(entityId),
    optional: dynamic ? true : chance(0.5),
    disabled: false,
    formHidden: false,
    lastUpdateDate: diasAtras(int(3, 300)),
    options: typeId === 5
      ? range(int(3, 5), (i) => ({ id: 800 + i, name: pick([
        'Alta', 'Média', 'Baixa', 'Indústria', 'Serviços', 'Varejo', 'Ativo', 'Inativo',
      ]) }))
      : undefined,
  }));

  return [...monta(def.nativos, false), ...monta(def.dinamicos, true)];
}

// ─── Registros OData genéricos (Central da API, Jsonx) ───────────────────────

export function registrosODataDemo(entidade, n = 5) {
  const nome = String(entidade).replace(/[^A-Za-z]/g, '');
  const geradores = {
    Deals: (i) => ({
      Id: 30500 + i,
      Title: `Oportunidade ${30500 + i}`,
      Amount: int(3000, 240000),
      StageId: int(1, 6),
      StatusId: pick([1, 2, 3]),
      ContactId: 60100 + i,
      OwnerId: USUARIOS_PLOOMES[i % USUARIOS_PLOOMES.length].Id,
      CreateDate: diasAtras(int(1, 240)),
    }),
    Contacts: (i) => ({
      Id: 60100 + i,
      Name: EMPRESAS[i % EMPRESAS.length],
      Email: emailDe(PESSOAS[i % PESSOAS.length], 'cliente.invalid'),
      Register: `${int(10, 99)}.${int(100, 999)}.${int(100, 999)}/0001-${int(10, 99)}`,
      CityId: int(1000, 9000),
      CreateDate: diasAtras(int(1, 900)),
    }),
    Users: (i) => USUARIOS_PLOOMES[i % USUARIOS_PLOOMES.length],
    Fields: (i) => {
      const c = camposDemo(1)[i % camposDemo(1).length];
      return { Id: c.id, Key: c.key, Name: c.name, Dynamic: c.dynamic, Entity: { Id: 1, Name: 'Contacts' } };
    },
    Account: () => CONTA_DEMO,
  };
  const gen = geradores[nome] ?? ((i) => ({
    Id: 10000 + i,
    Name: `${nome || 'Registro'} ${i + 1}`,
    CreateDate: diasAtras(int(1, 200)),
  }));
  return range(n, gen);
}

// ─── Central da API: catálogo e requisições prontas ──────────────────────────

// Shape consumido por ApiHelper.jsx:
//   { endpoints: [{ name, methods[], deleteAllowed }], odataParams: [], bulkAllowed: [] }
export const CATALOGO_APIHUB = {
  endpoints: [
    { name: 'Deals', label: 'Negócios', entityId: 2, methods: ['GET', 'POST', 'PATCH'], deleteAllowed: true },
    { name: 'Contacts', label: 'Clientes', entityId: 1, methods: ['GET', 'POST', 'PATCH'], deleteAllowed: true },
    { name: 'Users', label: 'Usuários', entityId: 24, methods: ['GET', 'PATCH'], deleteAllowed: false },
    { name: 'Fields', label: 'Campos', entityId: null, methods: ['GET'], deleteAllowed: false },
    { name: 'Tasks', label: 'Tarefas', entityId: 12, methods: ['GET', 'POST', 'PATCH'], deleteAllowed: true },
    { name: 'Quotes', label: 'Propostas', entityId: 7, methods: ['GET', 'PATCH'], deleteAllowed: false },
    { name: 'Interactions', label: 'Registros de interação', entityId: 36, methods: ['GET', 'POST'], deleteAllowed: false },
  ],
  bulkAllowed: ['Deals', 'Contacts', 'Tasks'],
  odataParams: [
    { key: '$select', description: 'Escolhe as colunas retornadas.', example: '$select=Id,Title,Amount' },
    { key: '$filter', description: 'Filtra os registros por condição.', example: "$filter=StatusId eq 1" },
    { key: '$expand', description: 'Traz entidades relacionadas.', example: '$expand=Contact,Stage' },
    { key: '$orderby', description: 'Ordena o resultado.', example: '$orderby=CreateDate desc' },
    { key: '$top', description: 'Limita a quantidade de registros.', example: '$top=50' },
    { key: '$skip', description: 'Pula registros (paginação).', example: '$skip=100' },
    { key: '$count', description: 'Inclui a contagem total no retorno.', example: '$count=true' },
    { key: 'contains', description: 'Busca por trecho em texto.', example: "$filter=contains(Name,'Aurora')" },
  ],
};

// Shape consumido pelo modal "Modelos de requisição": { items: [...] }
export const REQUISICOES_PRONTAS = [
  {
    id: 'deals-abertos',
    title: 'Negócios em aberto (últimos 30 dias)',
    description: 'Lista negócios criados no último mês que ainda não foram fechados.',
    method: 'GET',
    endpoint: 'Deals',
    query: '$filter=StatusId eq 1&$orderby=CreateDate desc&$top=50',
    tag: 'Negócios',
  },
  {
    id: 'clientes-sem-email',
    title: 'Clientes sem e-mail cadastrado',
    description: 'Útil para higienização de base antes de campanhas.',
    method: 'GET',
    endpoint: 'Contacts',
    query: '$filter=Email eq null&$select=Id,Name,Register&$top=100',
    tag: 'Clientes',
  },
  {
    id: 'usuarios-suspensos',
    title: 'Usuários suspensos',
    description: 'Confere quem perdeu acesso sem ter sido removido da conta.',
    method: 'GET',
    endpoint: 'Users',
    query: '$filter=Suspended eq true&$select=Id,Name,Email',
    tag: 'Usuários',
  },
  {
    id: 'campos-dinamicos-negocio',
    title: 'Campos dinâmicos de Negócios',
    description: 'Todos os campos personalizados criados na entidade Negócios.',
    method: 'GET',
    endpoint: 'Fields',
    query: '$filter=Entity/Id eq 2 and Dynamic eq true&$expand=Entity',
    tag: 'Campos',
  },
  {
    id: 'tarefas-atrasadas',
    title: 'Tarefas atrasadas',
    description: 'Tarefas com vencimento anterior a hoje e ainda não concluídas.',
    method: 'GET',
    endpoint: 'Tasks',
    query: '$filter=Done eq false&$orderby=DueDate asc&$top=100',
    tag: 'Tarefas',
  },
];

// ─── Automações ──────────────────────────────────────────────────────────────

const NOMES_AUTOMACAO = [
  'Notificar responsável ao ganhar negócio',
  'Criar tarefa de follow-up em 3 dias',
  'Atualizar etapa ao receber proposta assinada',
  'Enviar e-mail de boas-vindas ao cliente novo',
  'Marcar SLA estourado após 48h sem interação',
  'Distribuir leads entre a equipe comercial',
  'Preencher segmento a partir do CNAE',
  'Arquivar negócios perdidos há mais de 180 dias',
  'Alertar gestor em desconto acima de 15%',
  'Sincronizar cliente com o ERP',
  'Registrar interação ao mudar de etapa',
  'Bloquear edição de proposta aprovada',
];

const GATILHOS = [
  { id: 1, name: 'Ao criar' },
  { id: 2, name: 'Ao editar' },
  { id: 3, name: 'Ao mudar de etapa' },
  { id: 4, name: 'Agendada (diária)' },
];

const ACOES_AUTOMACAO = [
  { actionId: 1, nome: 'Editar campo' },
  { actionId: 2, nome: 'Criar tarefa' },
  { actionId: 3, nome: 'Enviar e-mail' },
  { actionId: 4, nome: 'Notificar usuário' },
  { actionId: 5, nome: 'Disparar webhook' },
];

const CAMPOS_AUTOMACAO = [
  'StageId', 'Amount', 'StatusId', 'OwnerId',
  'deal_desconto', 'deal_sla_horas', 'contact_segmento', 'contact_ativo_erp',
];

/**
 * Shape consumido por PloomesAutomacoes.jsx:
 *   { id, name, enabled, disabledDueToError, entity:{id,name}, trigger:{id,name},
 *     triggerFields: string[], triggerFilter: null | {name,url,fields[]},
 *     actions: [{ id, actionId, fieldKey, value, valueLabel, fieldPathId }] }
 */
export function automacoesDemo() {
  reseed(0x51ab77);
  return NOMES_AUTOMACAO.map((name, i) => {
    const entity = pick([
      { id: 2, name: 'Negócios' }, { id: 1, name: 'Clientes' },
      { id: 7, name: 'Propostas' }, { id: 12, name: 'Tarefas' },
    ]);
    const temFiltro = chance(0.7);
    const camposFiltro = pickMany(CAMPOS_AUTOMACAO, int(1, 3));

    return {
      id: 21000 + i,
      name,
      enabled: chance(0.82),
      disabledDueToError: chance(0.08),
      entity,
      trigger: pick(GATILHOS),
      triggerFields: pickMany(CAMPOS_AUTOMACAO, int(1, 3)),
      triggerFilter: temFiltro
        ? {
          id: 31000 + i,
          name: `Filtro — ${name.slice(0, 24)}`,
          url: `$filter=${camposFiltro[0]}+eq+'${pick(['Ganho', 'Proposta', 'Indústria'])}'`,
          fields: camposFiltro,
        }
        : null,
      actions: range(int(1, 3), (a) => {
        const acao = pick(ACOES_AUTOMACAO);
        return {
          id: 32000 + i * 10 + a,
          actionId: acao.actionId,
          name: acao.nome,
          fieldKey: pick(CAMPOS_AUTOMACAO),
          value: pick(['48', '2', 'true', '15000']),
          valueLabel: pick(['48 horas', 'Negociação', 'Rodízio da equipe', 'Sim']),
          fieldPathId: chance(0.4) ? int(1, 40) : null,
        };
      }),
      createDate: diasAtras(int(20, 700)),
      lastUpdateDate: diasAtras(int(1, 60)),
      ownerName: pick(PESSOAS),
    };
  });
}

// ─── Funil técnico / Kanban ──────────────────────────────────────────────────

// Categorias reais da taxonomia (config/caseTaxonomy.js). Usar os slugs certos
// é o que faz o Funil resolver o CASE_TYPE, escolher o playbook de investigação
// e contar o caso como "resolvível por IA".
// Categoria e resumo andam pareados pelo índice: cada caso da demo fica
// coerente (a categoria explica o sintoma) e o Funil resolve o playbook certo.
const CATEGORIAS_TRIAGEM = [
  'automacoes', 'importacao', 'omie', 'campos',
  'api', 'formularios', 'registros / log', 'webhooks',
];

const RESUMOS_CASO = [
  'Cliente relata que a automação de SLA parou de disparar após a mudança de etapa do funil.',
  'Importação de clientes falhou em 240 linhas por CNPJ duplicado na base.',
  'Integração com o ERP não trouxe os pedidos das últimas 48h.',
  'Campo personalizado sumiu do formulário de proposta depois da atualização.',
  'Retorno 429 da API ao sincronizar mais de 5 mil registros por hora.',
  'Formulário externo não grava o campo de origem do lead.',
  'Relatório de vendas diverge do total exibido no dashboard do cliente.',
  'Webhook de negócio ganho chega duplicado no endpoint do cliente.',
];

const PLANOS_ACAO = [
  ['Confirmar a etapa configurada no gatilho', 'Rodar o teste de disparo manual', 'Ajustar o filtro de etapa e revalidar'],
  ['Baixar a planilha de erros', 'Deduplicar por CNPJ na origem', 'Reprocessar apenas as linhas rejeitadas'],
  ['Checar o token do integrador', 'Verificar a fila do shard', 'Forçar o bring do período pendente'],
  ['Conferir o perfil e a equipe do usuário', 'Validar as permissões do funil', 'Reaplicar o perfil e pedir novo login'],
];

export function triagemDemo(i = 0) {
  // Cerca de 1/3 dos casos é recorrente com confiança alta: assim a métrica
  // "Resolvíveis por IA" do topo do Funil não fica zerada na demo.
  const recorrente = i % 3 === 0;
  return {
    v: 2,
    triado_em: diasAtras(int(0, 5)),
    modelo: 'demo-offline',
    resolucao_rapida: recorrente,
    confianca: recorrente ? int(86, 97) : int(52, 84),
    severidade: pick(['baixa', 'media', 'alta', 'critica']),
    categoria: CATEGORIAS_TRIAGEM[i % CATEGORIAS_TRIAGEM.length],
    recorrente_mapeado: recorrente,
    resumo: RESUMOS_CASO[i % RESUMOS_CASO.length],
    plano_acao: PLANOS_ACAO[i % PLANOS_ACAO.length],
    intercom_id: `demo-conv-${8100 + i}`,
    birdie_url: null,
    fontes: range(3, (f) => ({
      titulo: pick([
        'Configurando SLA em funis', 'Erros comuns de importação',
        'Boas práticas de integração ERP', 'Perfis e permissões por equipe',
        'Limites de requisição da API',
      ]),
      url_central: 'https://ajuda.exemplo.invalid/artigo-demo',
      modulo: pick(['automacoes', 'importacao', 'integracoes', 'permissoes', 'api']),
      score: Number((0.72 + rnd() * 0.26).toFixed(2)),
    })),
  };
}

const ETAPAS_FUNIL = [
  { id: 501, name: 'Triagem', ordination: 1 },
  { id: 502, name: 'Em análise', ordination: 2 },
  { id: 503, name: 'Aguardando cliente', ordination: 3 },
  { id: 504, name: 'Com produto', ordination: 4 },
  { id: 505, name: 'Resolvido', ordination: 5 },
];

export function funilDemo() {
  reseed(0x9ac31);
  let seq = 0;
  const columns = ETAPAS_FUNIL.map((stage, idx) => {
    const qtd = [7, 5, 4, 3, 6][idx];
    const deals = range(qtd, () => {
      const i = seq++;
      const empresa = EMPRESAS[i % EMPRESAS.length];
      const owner = AGENTES_N1[i % AGENTES_N1.length];
      return {
        id: 77000 + i,
        title: `[${empresa}] ${RESUMOS_CASO[i % RESUMOS_CASO.length].slice(0, 46)}…`,
        amount: 0,
        stageId: stage.id,
        pipelineId: 4100,
        statusId: 1,
        contactId: 60100 + i,
        contactName: empresa,
        ownerId: 71200 + (i % 8) * 7,
        ownerName: owner,
        creatorName: pick(AGENTES_N1),
        createDate: diasAtras(int(0, 22)),
        lastUpdateDate: diasAtras(int(0, 9)),
        triagem: chance(0.85) ? triagemDemo(i) : null,
      };
    });
    return { stage, deals, count: deals.length, totalAmount: 0 };
  });

  return {
    pipeline: { id: 4100, name: 'Funil do Técnico N1', archived: false, color: '#7443f6' },
    board: { allowedOwners: AGENTES_N1 },
    columns,
    totalDeals: columns.reduce((acc, c) => acc + c.count, 0),
  };
}

export function cardDemo(dealId) {
  reseed(dealId || 1);
  const i = (dealId || 77000) % EMPRESAS.length;
  const empresa = EMPRESAS[i];
  return {
    deal: {
      id: dealId,
      title: `[${empresa}] ${RESUMOS_CASO[i % RESUMOS_CASO.length].slice(0, 46)}…`,
      amount: 0,
      stageId: 502,
      statusId: 1,
      contactId: 60100 + i,
      contactName: empresa,
      ownerName: pick(AGENTES_N1),
      creatorName: pick(AGENTES_N1),
      descricao: `${RESUMOS_CASO[i % RESUMOS_CASO.length]}\n\nO cliente enviou prints e o ID da conta. A equipe já validou que o comportamento se repete em outro usuário da mesma conta.`,
      camposExtras: [
        { key: 'onde_ocorre', label: 'Onde ocorre', kind: 'option', value: pick(['Web', 'Mobile', 'API', 'Integração']) },
        { key: 'impacto', label: 'Impacto', kind: 'option', value: pick(['Baixo', 'Médio', 'Alto']) },
        { key: 'canal', label: 'Canal de entrada', kind: 'option', value: pick(['Intercom', 'E-mail', 'Telefone']) },
        { key: 'pagina', label: 'Página da ocorrência', kind: 'url', value: 'https://app.exemplo.invalid/negocios/30512' },
        { key: 'email_reportou', label: 'Quem reportou', kind: 'email', value: emailDe(pick(PESSOAS), 'cliente.invalid') },
        { key: 'passos', label: 'Passos para reproduzir', kind: 'longtext', value: '1. Abrir o negócio\n2. Mudar a etapa para Proposta\n3. Observar que a automação não dispara' },
      ],
      intercomId: `demo-conv-${8100 + i}`,
      intercomUrl: 'https://app.intercom.invalid/conversa/demo',
      ploomesUrl: 'https://app.ploomes.invalid/negocio/demo',
      createDate: diasAtras(int(2, 20)),
      lastUpdateDate: diasAtras(int(0, 3)),
      triagem: triagemDemo(i),
    },
    interactions: range(5, (k) => ({
      id: 91000 + k,
      content: pick([
        'Cliente reenviou o print do erro.',
        'Solicitado o ID da conta e o horário exato da ocorrência.',
        'Reproduzido em ambiente interno — comportamento confirmado.',
        'Encaminhado ao time de produto para análise do log.',
        'Aguardando retorno do cliente sobre o teste sugerido.',
      ]),
      date: diasAtras(k + 1),
      typeId: 1,
      type: pick(['Nota', 'E-mail', 'Ligação']),
      author: pick(AGENTES_N1),
    })),
    attachments: range(2, (k) => ({
      id: 93000 + k,
      fileName: pick(['print-erro.png', 'log-automacao.txt', 'planilha-importacao.xlsx']),
      contentType: 'application/octet-stream',
      size: int(24000, 900000),
      url: 'about:blank#anexo-demo',
    })),
  };
}

export const FORM_META_FUNIL = {
  pipeline: { id: 4100, name: 'Funil do Técnico N1' },
  stages: ETAPAS_FUNIL.map((s) => ({ ...s, pipelineId: 4100 })),
  defaultStageId: 501,
  titlePattern: '[{cliente}] {resumo}',
  fields: [
    {
      key: 'ondeOcorreId', fieldKey: 'deal_onde_ocorre', label: 'Onde ocorre',
      typeId: 5, required: true, available: true,
      options: [
        { id: 1, name: 'Web' }, { id: 2, name: 'Mobile' },
        { id: 3, name: 'API' }, { id: 4, name: 'Integração' },
      ],
    },
    {
      key: 'impactoId', fieldKey: 'deal_impacto', label: 'Impacto',
      typeId: 5, required: true, available: true,
      options: [{ id: 1, name: 'Baixo' }, { id: 2, name: 'Médio' }, { id: 3, name: 'Alto' }],
    },
    {
      key: 'tipoDemandaId', fieldKey: 'deal_tipo_demanda', label: 'Tipo de demanda',
      typeId: 5, required: false, available: true,
      options: [{ id: 1, name: 'Bug' }, { id: 2, name: 'Dúvida' }, { id: 3, name: 'Melhoria' }],
    },
    {
      key: 'canalId', fieldKey: 'deal_canal', label: 'Canal',
      typeId: 5, required: false, available: true,
      options: [{ id: 1, name: 'Intercom' }, { id: 2, name: 'E-mail' }, { id: 3, name: 'Telefone' }],
    },
    { key: 'descricao', fieldKey: 'deal_descricao', label: 'Descrição', typeId: 2, required: true, maxLen: 4000, available: true },
    { key: 'linkIntercom', fieldKey: 'deal_link_intercom', label: 'Link do Intercom', typeId: 1, required: false, available: true },
    { key: 'intercomTicketId', fieldKey: 'deal_intercom_id', label: 'ID do ticket', typeId: 1, required: false, available: true },
    { key: 'emailReportou', fieldKey: 'deal_email', label: 'E-mail de quem reportou', typeId: 1, required: false, available: true },
    { key: 'videoLink', fieldKey: 'deal_video', label: 'Link do vídeo', typeId: 1, required: false, available: true },
    { key: 'paginaOcorrencia', fieldKey: 'deal_pagina', label: 'Página da ocorrência', typeId: 1, required: false, available: true },
  ],
};

// ─── Dashboard do Intercom ───────────────────────────────────────────────────

export function relatorioIntercom() {
  reseed(0x30f1a);
  const agents = AGENTES_N1.map((name, i) => {
    const atendidas = int(48, 210);
    return {
      id: `ag-${i + 1}`,
      name,
      team: pick(['Transacional N1', 'Premium N1', 'Dedicados N1']),
      conversations: atendidas,
      closed: Math.round(atendidas * (0.72 + rnd() * 0.24)),
      medianFirstResponse: int(3, 28),
      medianResolution: int(35, 480),
      csat: Number((3.9 + rnd() * 1.05).toFixed(2)),
      reopened: int(0, 9),
    };
  });

  const teams = ['Transacional N1', 'Premium N1', 'Dedicados N1'].map((name, i) => {
    const membros = agents.filter((a) => a.team === name);
    const conversas = membros.reduce((s, a) => s + a.conversations, 0) || int(120, 300);
    return {
      id: i + 1,
      name,
      conversations: conversas,
      closed: Math.round(conversas * 0.86),
      medianFirstResponse: int(4, 22),
      medianResolution: int(60, 420),
      csat: Number((4.0 + rnd() * 0.8).toFixed(2)),
      agents: membros.length,
    };
  });

  const total = agents.reduce((s, a) => s + a.conversations, 0);

  return {
    type: 'complete',
    generatedAt: new Date().toISOString(),
    period: { start: diasAtras(30), end: new Date().toISOString() },
    totals: {
      conversations: total,
      closed: Math.round(total * 0.87),
      open: Math.round(total * 0.13),
      medianFirstResponse: 11,
      medianResolution: 168,
      csat: 4.42,
      reopenRate: 0.061,
    },
    agents,
    teams,
    trend: range(30, (i) => ({
      date: new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10),
      conversations: int(28, 96),
      closed: int(22, 88),
      firstResponse: int(4, 26),
    })),
    distribution: [
      { label: 'Dúvida de uso', value: int(90, 180) },
      { label: 'Erro reportado', value: int(50, 130) },
      { label: 'Integração', value: int(30, 90) },
      { label: 'Financeiro', value: int(15, 60) },
      { label: 'Solicitação de melhoria', value: int(10, 45) },
    ],
  };
}

export function eventosRelatorioIntercom() {
  const relatorio = relatorioIntercom();
  const etapas = [
    'Buscando conversas no período',
    'Agrupando por equipe',
    'Calculando tempos de resposta',
    'Consolidando CSAT',
    'Montando séries do gráfico',
  ];
  return [
    { type: 'start', total: etapas.length },
    ...etapas.map((etapa, i) => ({
      type: 'progress', current: i + 1, total: etapas.length, etapa, message: etapa,
    })),
    relatorio,
  ];
}

// ─── Auditoria de IA ─────────────────────────────────────────────────────────

export function auditoriaIaDemo() {
  reseed(0x71bc2);
  return range(16, (i) => ({
    conversationId: `demo-conv-${9200 + i}`,
    clienteNome: EMPRESAS[i % EMPRESAS.length],
    clienteId: `cli-${60100 + i}`,
    estado: pick(['encerrado_ia', 'transferido_humano']),
    data: diasAtras(int(0, 14)),
    nota: int(1, 5),
    aderencia: int(52, 99),
    motivo: pick([
      'Resposta correta e completa',
      'Resposta parcial — faltou citar o pré-requisito',
      'Transferência adequada: caso exigia acesso à conta',
      'Transferência desnecessária: resposta estava na base',
      'Tom adequado, mas link do artigo incorreto',
    ]),
    resumo: pick(RESUMOS_CASO),
    auditado: chance(0.3),
  }));
}

// ─── Chamados (Extração de Chamados) ─────────────────────────────────────────

export function chamadosDemo() {
  reseed(0x4f22a);
  return range(22, (i) => ({
    id: 82000 + i,
    titulo: `[${EMPRESAS[i % EMPRESAS.length]}] ${pick(RESUMOS_CASO).slice(0, 50)}`,
    pipeline: pick(['Chamados de Produto', 'Chamados de Manutenção']),
    etapa: pick(['Triagem', 'Em análise', 'Aguardando cliente', 'Resolvido']),
    abertura: diasAtras(int(5, 300)),
    fechamento: chance(0.7) ? diasAtras(int(0, 4)) : null,
    responsavel: pick(AGENTES_N1),
    interacoes: int(2, 18),
  }));
}

// ─── Copilot (respostas fixas) ───────────────────────────────────────────────

const RESPOSTAS_COPILOT = [
  {
    chave: ['sla', 'prazo'],
    resposta: `O SLA de cards é configurado por funil, com dois campos e uma automação:

1. **Campo "SLA (horas)"** — numérico, criado na entidade Negócios.
2. **Campo "SLA estourado"** — booleano, atualizado pela automação.
3. **Automação agendada (diária)** — compara a última interação com o limite e marca o negócio.

Na Implementação Express existe o processo **SLA de Cards**, que cria os dois campos e a automação de uma vez.`,
  },
  {
    chave: ['importa', 'planilha'],
    resposta: `Quando a importação falha em parte das linhas, o caminho é:

1. Abrir a **Consulta de Importação** com o ID da importação.
2. Baixar a **Planilha com Logs** — a coluna de erro indica a causa por linha.
3. Os motivos mais comuns são registro duplicado, campo obrigatório vazio e opção inexistente em campo de lista.
4. Corrigir só as linhas rejeitadas e reimportar — as já inseridas não são duplicadas se o identificador for o mesmo.`,
  },
  {
    chave: ['api', 'limite', '429'],
    resposta: `O retorno **429** indica limite de requisições por hora atingido.

- O limite é por conta, não por usuário.
- Em ações em massa, use lotes menores e intervalo entre eles.
- A Central da API já aplica um limite seguro nas ações em massa.
- Se a integração do cliente estourar o limite com frequência, avalie sincronização incremental em vez de carga total.`,
  },
];

export function respostaCopilot(pergunta = '') {
  const q = String(pergunta).toLowerCase();
  const achado = RESPOSTAS_COPILOT.find((r) => r.chave.some((k) => q.includes(k)));

  const resposta = achado?.resposta ?? `Esta é uma **resposta de demonstração** — o N1 App está rodando em modo offline, sem consultar a base de conhecimento nem nenhum modelo de IA.

Na aplicação real, aqui apareceria a resposta gerada a partir dos artigos da Central de Ajuda e dos casos já resolvidos pelo time, com as fontes listadas abaixo.

Pergunta recebida: _${pergunta || '(vazia)'}_`;

  return {
    resposta,
    modelo: 'demo-offline',
    fontes: range(3, (i) => ({
      titulo: pick([
        'Configurando SLA em funis', 'Erros comuns de importação',
        'Boas práticas de integração ERP', 'Limites de requisição da API',
        'Perfis e permissões por equipe',
      ]),
      url_central: 'https://ajuda.exemplo.invalid/artigo-demo',
      modulo: pick(['automacoes', 'importacao', 'integracoes', 'api', 'permissoes']),
      score: Number((0.70 + rnd() * 0.28).toFixed(2)),
    })),
  };
}

// ─── Documentador de contas (markdown) ───────────────────────────────────────

export const DOC_CONTA_DEMO = `# Documentação da conta — ${CONTA_DEMO.Name}

> Documento gerado em **modo demonstração**. Todos os números são fictícios.

## Visão geral

| Item | Valor |
| --- | --- |
| ID da conta | ${CONTA_DEMO.Id} |
| Usuários ativos | 12 |
| Funis configurados | 4 |
| Automações ativas | 31 |
| Campos personalizados | 48 |

## Funis

### Funil Comercial
Etapas: Qualificação → Proposta → Negociação → Fechamento

- 4.210 negócios no total
- Ticket médio: R$ 18.400,00
- Taxa de conversão: 22%

### Funil de Pós-venda
Etapas: Onboarding → Implantação → Acompanhamento

- 612 negócios no total
- Tempo médio de implantação: 34 dias

## Automações em destaque

1. **Notificar responsável ao ganhar negócio** — dispara ao mudar o status para Ganho.
2. **Criar tarefa de follow-up em 3 dias** — agendada, roda diariamente.
3. **Sincronizar cliente com o ERP** — webhook para a integração Omie.

## Perfis e permissões

| Perfil | Usuários | Observação |
| --- | --- | --- |
| Administrador | 2 | Acesso total |
| Gestor comercial | 3 | Vê todos os funis |
| Vendedor | 7 | Vê apenas os próprios negócios |

## Pontos de atenção

- 3 automações desativadas há mais de 90 dias.
- 8 campos personalizados sem preenchimento nos últimos 6 meses.
- Integração com o ERP sem sincronização há 2 dias.
`;

export function markdownCompilado(payload = {}) {
  const titulo = payload.titulo || 'Procedimento sem título';
  return `# ${titulo}

**Módulo:** ${payload.moduloDestino || 'geral'}
**Tipo de fonte:** ${payload.tipoFonte || 'não informado'}

## Contexto

${payload.contexto || 'Contexto não informado pelo autor do conteúdo bruto.'}

## Procedimento

1. Confirmar o cenário relatado pelo cliente e coletar o ID da conta.
2. Reproduzir o comportamento em ambiente interno antes de escalar.
3. Aplicar a correção descrita e validar com o cliente.
4. Registrar o desfecho no card do caso.

## Sinais de que não é este o caso

- O erro só ocorre para um único usuário → investigar perfil e permissões.
- O comportamento some ao trocar de navegador → provável cache local.

## Conteúdo bruto recebido

\`\`\`
${String(payload.conteudo || '').slice(0, 600) || '(vazio)'}
\`\`\`

---
_Rascunho gerado em modo demonstração — nenhum modelo de IA foi consultado._
`;
}
