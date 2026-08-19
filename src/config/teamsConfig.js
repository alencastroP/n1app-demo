// src/config/teamsConfig.js
//
// Teams cadastradas na conta de permissões do Ploomes + matriz de acesso.
//
// Modelo:
//   - O ProfileId define o NÍVEL hierárquico (Básico < Geral < Gestor < Admin).
//   - A Team define QUAIS serviços (e sub-funcionalidades) o usuário acessa.
//   - Toda a matriz vive em SERVICE_RULES (tabela declarativa). Os gates de UI
//     e os middlewares do backend apenas CONSOMEM essa tabela via canAccessService /
//     canFeature — nunca decidem permissão localmente.
//   - Admin (PROFILES.ADMIN) sempre passa em tudo.

import { LEVELS, PROFILES, getLevel } from './permissionsConfig';

// ─── IDs das teams ───────────────────────────────────────────────────────────
// O Suporte N1 foi dividido em 3 subequipes na conta de permissões (jun/2026):
//   SUPORTE_N1 (9000101) foi RENOMEADO de "Suporte N1" p/ "Transacional N1" e
//   ganhou duas irmãs — "Premium N1" e "Dedicados N1". As três compartilham
//   exatamente as mesmas regras de acesso (ver SUPORTE_N1_ALL). Mantemos a
//   chave SUPORTE_N1 apontando p/ 9000101 por ser a que já vivia em
//   perTeamMinLevel e em código legado.
export const TEAMS = {
  SUPORTE_N1:             9000101, // "Transacional N1"
  SUPORTE_N1_PREMIUM:     9000102, // "Premium N1"
  SUPORTE_N1_DEDICADO:    9000103, // "Dedicados N1"
  SUPORTE_N2:             9000104,
  OPERACOES:              9000105,
  CS:                     9000106,
  PARCERIAS:              9000107,
  PRODUTO:                9000108,
  VENDAS:                 9000109,
  MARKETING:              9000110,
  TALENT:                 9000111,
  OPERACOES_ESTRATEGICAS: 9000112,
  UNI_PLOOMES:            9000113,
  OUTROS:                 9000114,
  ADMS:                   9000115, // "Técnicos N1" na conta (bucket interno/oculto)
};

export const TEAM_LABELS = {
  [TEAMS.SUPORTE_N1]:             'Transacional N1',
  [TEAMS.SUPORTE_N1_PREMIUM]:     'Premium N1',
  [TEAMS.SUPORTE_N1_DEDICADO]:    'Dedicados N1',
  [TEAMS.SUPORTE_N2]:             'Suporte N2',
  [TEAMS.OPERACOES]:              'Operações',
  [TEAMS.CS]:                     'Customer Sucess',
  [TEAMS.PARCERIAS]:              'Parcerias',
  [TEAMS.PRODUTO]:                'Produto',
  [TEAMS.VENDAS]:                 'Vendas',
  [TEAMS.MARKETING]:              'Marketing',
  [TEAMS.TALENT]:                 'Talent',
  [TEAMS.OPERACOES_ESTRATEGICAS]: 'Operações estratégicas',
  [TEAMS.UNI_PLOOMES]:            'Universidade Ploomes',
  [TEAMS.OUTROS]:                 'Outros',
  [TEAMS.ADMS]:                   'Técnicos N1',
};

// Grupos reaproveitados na matriz (legibilidade) ────────────────────────────
const ALL_TEAMS = Object.values(TEAMS);
// As 3 subequipes do Suporte N1 têm acesso idêntico. Use este grupo em vez de
// [TEAMS.SUPORTE_N1] em qualquer regra que valia p/ o antigo "Suporte N1".
const SUPORTE_N1_ALL = [
  TEAMS.SUPORTE_N1, TEAMS.SUPORTE_N1_PREMIUM, TEAMS.SUPORTE_N1_DEDICADO,
];
const SUPORTE_PRODUTO = [...SUPORTE_N1_ALL, TEAMS.SUPORTE_N2, TEAMS.PRODUTO];
const OPERACIONAIS = [
  ...SUPORTE_N1_ALL, TEAMS.SUPORTE_N2, TEAMS.PRODUTO,
  TEAMS.CS, TEAMS.OPERACOES, TEAMS.OPERACOES_ESTRATEGICAS,
];

// ─── Service keys ────────────────────────────────────────────────────────────
export const SERVICE_KEYS = {
  // Sempre visíveis (qualquer team)
  POWERBI:        'powerbi',
  IMPORTATION:    'importation',
  JSONX:          'jsonx',
  APIHUB:         'apihub',
  FIELD_EXPLORER: 'field-explorer',
  SANKHYA:        'sankhya',
  QUEUES:         'queues',
  PLOOMES_AUTOMACOES: 'ploomes-automacoes',
  PLOOMES_KANBAN:     'ploomes-kanban',

  // Restrição por team
  CHANGELOG:      'changelog',
  EMAILFIX:       'emailfix',
  INTERCOM_TAGS:  'intercom-tags',
  OMIE:                'omie',
  PROCESS_IMPLEMENTER: 'process-implementer',
  ENTITY_MERGE:        'entity-merge',
  PLOOMES_TICKETS:     'ploomes-tickets',
  COPILOT:             'copilot',
  ACCOUNT_DOCUMENTER:  'account-documenter',
  ACCOUNT_EXPORT:      'account-export',
  INTERCOM_CHURN:      'intercom-churn',
  INTERCOM_DASHBOARD:  'intercom-dashboard',
  GERENCIAR_USUARIOS:  'gerenciar-usuarios',
  CENTRAL_N1:          'central-n1',
  AUDITORIA_IA:        'auditoria-ia',
  USER_AUDIT:          'user-audit',
  KNOWLEDGE_COMPILER:  'knowledge-compiler',
};

// ─── Feature keys (sub-funcionalidades dentro de um serviço) ─────────────────
export const FEATURE_KEYS = {
  // Central da API
  API_METHOD_GET:    'api.method.GET',
  API_METHOD_WRITE:  'api.method.WRITE',   // POST / PATCH (simples)
  API_METHOD_DELETE: 'api.method.DELETE',  // DELETE (simples)
  API_BULK_CONFIG:   'api.bulk.config',    // ações em massa configuráveis (montadas à mão)
  API_BULK_WRITE:    'api.bulk.write',     // POST/PATCH em massa
  API_BULK_DELETE:   'api.bulk.delete',    // DELETE em massa (trava extra de gestor)
  API_READY_ACTIONS: 'api.bulk.ready',     // ações em massa prontas

  // Sankhya
  SANKHYA_CORRUPTED:   'sankhya.corrupted',    // buscar item corrompido
  SANKHYA_TOKEN_SWAP:  'sankhya.token-swap',   // troca de token

  // Omie
  OMIE_SYNC:        'omie.sync',         // Sincronizações (FirstSync/Bring) — visível
  OMIE_FIRST_SYNC:  'omie.first-sync',   // executar FirstSync a qualquer hora (admin)

  // Copilot
  COPILOT_DOCUMENTER: 'copilot.documenter', // botão "documentar conta"
  COPILOT_USE:        'copilot.use',        // usar o Copilot (envio de mensagens / botão)
};

// ─── Matriz declarativa de regras ────────────────────────────────────────────
//
// Para cada serviço:
//   teams:    teams permitidas a VER o serviço ('ALL' = qualquer team).
//   minLevel: nível mínimo padrão para acessar o serviço.
//   perTeamMinLevel: override de nível por team (sobrepõe minLevel para a team).
//   adminOnly: serviço exclusivo de admin (ignora teams/minLevel).
//   features:  sub-regras. Cada feature herda `teams` do serviço quando não
//              declara `teams` própria; `minLevel`/`perTeamMinLevel`/`adminOnly`
//              valem só para a feature.
//
// Admin sempre passa (tratado em canAccessService / canFeature).
const ACCESS = {
  // ── Serviços livres (todas as teams, básico+) ────────────────────────────
  [SERVICE_KEYS.POWERBI]:            { teams: 'ALL', minLevel: LEVELS.BASICO },
  [SERVICE_KEYS.IMPORTATION]:        { teams: 'ALL', minLevel: LEVELS.BASICO },
  [SERVICE_KEYS.JSONX]:              { teams: 'ALL', minLevel: LEVELS.BASICO },
  [SERVICE_KEYS.FIELD_EXPLORER]:     { teams: 'ALL', minLevel: LEVELS.BASICO },
  [SERVICE_KEYS.QUEUES]:             { teams: 'ALL', minLevel: LEVELS.BASICO },
  [SERVICE_KEYS.PLOOMES_AUTOMACOES]: { teams: 'ALL', minLevel: LEVELS.BASICO },
  // Funil do Técnico (dentro da Central N1): só admin por enquanto.
  [SERVICE_KEYS.PLOOMES_KANBAN]:     { adminOnly: true },
  // Central N1: exclusiva das equipes Suporte N1 (admin sempre passa).
  [SERVICE_KEYS.CENTRAL_N1]:         { teams: SUPORTE_N1_ALL, minLevel: LEVELS.BASICO },
  // Auditoria de IA (CloudHuman): card da Central N1 — mesma regra (Suporte N1, básico+).
  [SERVICE_KEYS.AUDITORIA_IA]:       { teams: SUPORTE_N1_ALL, minLevel: LEVELS.BASICO },

  // ── Central da API ────────────────────────────────────────────────────────
  // Serviço visível a todas as teams (básico+); restrições ficam nas features.
  [SERVICE_KEYS.APIHUB]: {
    teams: 'ALL',
    minLevel: LEVELS.BASICO,
    features: {
      // GET sempre liberado para quem vê o serviço.
      [FEATURE_KEYS.API_METHOD_GET]: { teams: 'ALL', minLevel: LEVELS.BASICO },

      // POST/PATCH simples: N1/N2/Produto básico+; demais teams geral+.
      [FEATURE_KEYS.API_METHOD_WRITE]: {
        teams: 'ALL',
        minLevel: LEVELS.NORMAL,
        perTeamMinLevel: {
          [TEAMS.SUPORTE_N1]:          LEVELS.BASICO,
          [TEAMS.SUPORTE_N1_PREMIUM]:  LEVELS.BASICO,
          [TEAMS.SUPORTE_N1_DEDICADO]: LEVELS.BASICO,
          [TEAMS.SUPORTE_N2]:          LEVELS.BASICO,
          [TEAMS.PRODUTO]:             LEVELS.BASICO,
        },
      },

      // DELETE simples: apenas N1/N2/Produto, geral+.
      [FEATURE_KEYS.API_METHOD_DELETE]: {
        teams: SUPORTE_PRODUTO,
        minLevel: LEVELS.NORMAL,
      },

      // Ações em massa configuráveis: apenas N1/N2/Produto, geral+.
      [FEATURE_KEYS.API_BULK_CONFIG]: {
        teams: SUPORTE_PRODUTO,
        minLevel: LEVELS.NORMAL,
      },
      // POST/PATCH em massa: dentro do bulk, mesmas teams, geral+.
      [FEATURE_KEYS.API_BULK_WRITE]: {
        teams: SUPORTE_PRODUTO,
        minLevel: LEVELS.NORMAL,
      },
      // DELETE em massa: trava extra de gestor (safety).
      [FEATURE_KEYS.API_BULK_DELETE]: {
        teams: SUPORTE_PRODUTO,
        minLevel: LEVELS.GESTOR,
      },

      // Ações em massa prontas: N1/N2/Produto/CS/Operações/OpsEstratégicas, geral+.
      [FEATURE_KEYS.API_READY_ACTIONS]: {
        teams: OPERACIONAIS,
        minLevel: LEVELS.NORMAL,
      },
    },
  },

  // ── Sankhya ────────────────────────────────────────────────────────────────
  // Consulta de itens + login rápido: todas as teams, básico+ (serviço base).
  [SERVICE_KEYS.SANKHYA]: {
    teams: 'ALL',
    minLevel: LEVELS.BASICO,
    features: {
      // Itens corrompidos: teams operacionais, geral+.
      [FEATURE_KEYS.SANKHYA_CORRUPTED]: {
        teams: OPERACIONAIS,
        minLevel: LEVELS.NORMAL,
      },
      // Troca de token: mesmas teams, geral+.
      [FEATURE_KEYS.SANKHYA_TOKEN_SWAP]: {
        teams: OPERACIONAIS,
        minLevel: LEVELS.NORMAL,
      },
    },
  },

  // ── Troca de e-mail ─────────────────────────────────────────────────────────
  // Todas as áreas, geral+.
  [SERVICE_KEYS.EMAILFIX]: {
    teams: 'ALL',
    minLevel: LEVELS.NORMAL,
  },

  // ── Tags Intercom ─────────────────────────────────────────────────────────
  [SERVICE_KEYS.INTERCOM_TAGS]: {
    teams: [TEAMS.CS, TEAMS.UNI_PLOOMES, ...SUPORTE_N1_ALL],
    minLevel: LEVELS.NORMAL,
  },

  // ── Omie ────────────────────────────────────────────────────────────────────
  [SERVICE_KEYS.OMIE]: {
    teams: [TEAMS.PARCERIAS, TEAMS.OPERACOES, ...SUPORTE_N1_ALL, TEAMS.SUPORTE_N2],
    minLevel: LEVELS.NORMAL,
    features: {
      // Sincronizações (card visível) — mesma regra do serviço.
      [FEATURE_KEYS.OMIE_SYNC]: {
        teams: [TEAMS.PARCERIAS, TEAMS.OPERACOES, ...SUPORTE_N1_ALL, TEAMS.SUPORTE_N2],
        minLevel: LEVELS.NORMAL,
      },
      // Executar FirstSync a qualquer hora: somente admin.
      // (Para os demais, a UI permite somente após as 18h.)
      [FEATURE_KEYS.OMIE_FIRST_SYNC]: { adminOnly: true },
    },
  },

  // ── Implementação Express ───────────────────────────────────────────────────
  [SERVICE_KEYS.PROCESS_IMPLEMENTER]: {
    teams: SUPORTE_N1_ALL,
    minLevel: LEVELS.BASICO,
  },

  // ── Mesclagem de Entidades — só admin ───────────────────────────────────────
  [SERVICE_KEYS.ENTITY_MERGE]: { adminOnly: true },

  // ── Extração de chamados (ex-Buscas Ploomes) ───────────────────────────────
  // Liberado para todas as áreas, perfil geral+.
  [SERVICE_KEYS.PLOOMES_TICKETS]: {
    teams: 'ALL',
    minLevel: LEVELS.NORMAL,
  },

  // ── Copilot ─────────────────────────────────────────────────────────────────
  // Exclusivo da equipe Suporte N1 (admin sempre passa). Visível a partir do
  // básico — mas USAR (enviar mensagens / botão) exige gestor+; perfis abaixo
  // apenas visualizam a interface.
  [SERVICE_KEYS.COPILOT]: {
    teams: SUPORTE_N1_ALL,
    minLevel: LEVELS.BASICO,
    features: {
      [FEATURE_KEYS.COPILOT_USE]: {
        teams: SUPORTE_N1_ALL,
        minLevel: LEVELS.GESTOR,
      },
    },
  },

  // ── Documentador de Contas (ex-Copilot) ─────────────────────────────────────
  // Serviço próprio na store. Mantém a regra antiga: todas as áreas, perfil geral+.
  [SERVICE_KEYS.ACCOUNT_DOCUMENTER]: {
    teams: 'ALL',
    minLevel: LEVELS.NORMAL,
  },

  // ── Exportação de Base — só admin por enquanto ──────────────────────────────
  [SERVICE_KEYS.ACCOUNT_EXPORT]: { adminOnly: true },

  // ── Compilador de Conhecimento — só admin (espelha o backend) ───────────────
  [SERVICE_KEYS.KNOWLEDGE_COMPILER]: { adminOnly: true },

  // ── Buscas Intercom / Churn ─────────────────────────────────────────────────
  [SERVICE_KEYS.INTERCOM_CHURN]: {
    teams: [...SUPORTE_N1_ALL, TEAMS.CS, TEAMS.OPERACOES],
    minLevel: LEVELS.GESTOR,
  },

  // ── Dashboard Intercom (Central N1) — mesma regra do churn ──────────────────
  [SERVICE_KEYS.INTERCOM_DASHBOARD]: {
    teams: [...SUPORTE_N1_ALL, TEAMS.CS, TEAMS.OPERACOES],
    minLevel: LEVELS.GESTOR,
  },

  // ── Changelog ───────────────────────────────────────────────────────────────
  // N1/N2/Produto: básico+. CS/Operações: geral+. (Limites: getChangelogLimit.)
  [SERVICE_KEYS.CHANGELOG]: {
    teams: [
      ...SUPORTE_N1_ALL, TEAMS.SUPORTE_N2, TEAMS.PRODUTO,
      TEAMS.CS, TEAMS.OPERACOES,
    ],
    minLevel: LEVELS.NORMAL,
    perTeamMinLevel: {
      [TEAMS.SUPORTE_N1]:          LEVELS.BASICO,
      [TEAMS.SUPORTE_N1_PREMIUM]:  LEVELS.BASICO,
      [TEAMS.SUPORTE_N1_DEDICADO]: LEVELS.BASICO,
      [TEAMS.SUPORTE_N2]:          LEVELS.BASICO,
      [TEAMS.PRODUTO]:             LEVELS.BASICO,
    },
  },

  // ── Gerenciar Usuários — só admin ───────────────────────────────────────────
  [SERVICE_KEYS.GERENCIAR_USUARIOS]: { adminOnly: true },

  // ── Auditoria de Histórico de Usuário ───────────────────────────────────────
  // Suporte N1 e CS. Acesso por team, sem gate de nível (geral por team).
  [SERVICE_KEYS.USER_AUDIT]: {
    teams: [...SUPORTE_N1_ALL, TEAMS.CS],
  },
};

// ─── Helpers internos ────────────────────────────────────────────────────────

function teamAllowed(rule, teamId) {
  if (!rule) return false;
  if (rule.teams === 'ALL') return true;
  if (!Array.isArray(rule.teams)) return false;
  if (teamId == null) return false;
  return rule.teams.includes(Number(teamId));
}

/** Nível mínimo efetivo para uma regra, considerando override por team. */
function effectiveMinLevel(rule, teamId) {
  const tid = teamId != null ? Number(teamId) : null;
  if (rule.perTeamMinLevel && tid != null && rule.perTeamMinLevel[tid] != null) {
    return rule.perTeamMinLevel[tid];
  }
  return rule.minLevel ?? LEVELS.BASICO;
}

/** Avalia uma regra (de serviço ou de feature) contra team + profile. */
function evaluateRule(rule, teamId, profileId) {
  if (!rule) return false;
  if (profileId === PROFILES.ADMIN) return true;
  if (rule.adminOnly) return false; // só admin passou acima
  if (!teamAllowed(rule, teamId)) return false;
  if (profileId == null) return false;
  return getLevel(profileId) >= effectiveMinLevel(rule, teamId);
}

// ─── API pública ─────────────────────────────────────────────────────────────

/** Retorna true se a team possui acesso ao serviço (ignora nível/admin). */
export function teamHasService(teamId, serviceKey) {
  const rule = ACCESS[serviceKey];
  if (!rule) return false;
  if (rule.adminOnly) return false;
  return teamAllowed(rule, teamId);
}

/**
 * Decide acesso a um SERVIÇO considerando team + nível + admin.
 */
export function canAccessService(serviceKey, teamId, profileId) {
  if (!serviceKey) return false;
  return evaluateRule(ACCESS[serviceKey], teamId, profileId);
}

/**
 * Decide acesso a uma SUB-FUNCIONALIDADE de um serviço.
 * Requer primeiro acesso ao serviço; depois avalia a regra da feature.
 * Uma feature que não declara `teams` herda a lista de teams do serviço.
 */
export function canFeature(serviceKey, featureKey, teamId, profileId) {
  if (profileId === PROFILES.ADMIN) return true;
  const svc = ACCESS[serviceKey];
  if (!svc) return false;
  if (!canAccessService(serviceKey, teamId, profileId)) return false;

  const feat = svc.features?.[featureKey];
  if (!feat) return false;

  // Herda teams do serviço quando a feature não declara as suas.
  const merged = feat.teams != null ? feat : { ...feat, teams: svc.teams };
  return evaluateRule(merged, teamId, profileId);
}

// ─── Helpers de UI / catálogo ─────────────────────────────────────────────────

/** Lista de teams selecionáveis pelo usuário no modal do primeiro login (ADMs oculto). */
export function getSelectableTeams() {
  return Object.entries(TEAM_LABELS)
    .filter(([id]) => Number(id) !== TEAMS.ADMS)
    .map(([id, name]) => ({ id: Number(id), name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function getTeamLabel(teamId) {
  return TEAM_LABELS[Number(teamId)] ?? null;
}

// Mantido para compat com chamadas antigas que esperavam um set de teams.
export { ALL_TEAMS };
