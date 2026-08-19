// src/config/permissionsConfig.js
//
// Sistema de permissões do N1 App.
//
// Modelo:
//   - O ProfileId do Ploomes determina o NÍVEL hierárquico do usuário
//     (Básico → Acesso geral → Acesso gestor → Admin).
//   - A Team determina QUAIS serviços o usuário visualiza (definido em teamsConfig.js).
//   - Perfis antigos (N1_PLUS, N2_PRODUTO, N1_GERAL, UNIPLOO) continuam existindo
//     na conta de permissões e são mapeados para os novos níveis.

// ─── Profile IDs ─────────────────────────────────────────────────────────────
export const PROFILES = {
  ADMIN:  1,
  GESTOR: 9000201, // "Acesso gestor"
  NORMAL: 9000202, // "Acesso geral"
  BASICO: 9000203, // "Acesso básico"

  // Perfis legados que ainda existem na conta — mapeados para os novos níveis
  LEGACY_N1_PLUS:    9000204,
  LEGACY_N2_PRODUTO: 9000205,
  LEGACY_N1_GERAL:   9000206,
  LEGACY_UNIPLOO:    9000207,
};

// ─── Níveis hierárquicos ─────────────────────────────────────────────────────
export const LEVELS = {
  BASICO: 0,
  NORMAL: 1,
  GESTOR: 2,
  ADMIN:  3,
};

const PROFILE_TO_LEVEL = {
  [PROFILES.ADMIN]:             LEVELS.ADMIN,
  [PROFILES.GESTOR]:            LEVELS.GESTOR,
  [PROFILES.LEGACY_N1_PLUS]:    LEVELS.GESTOR,
  [PROFILES.LEGACY_N2_PRODUTO]: LEVELS.GESTOR,
  [PROFILES.NORMAL]:            LEVELS.NORMAL,
  [PROFILES.LEGACY_N1_GERAL]:   LEVELS.NORMAL,
  [PROFILES.LEGACY_UNIPLOO]:    LEVELS.NORMAL,
  [PROFILES.BASICO]:            LEVELS.BASICO,
};

export function getLevel(profileId) {
  return PROFILE_TO_LEVEL[Number(profileId)] ?? LEVELS.BASICO;
}

export function hasLevel(profileId, minLevel) {
  return getLevel(profileId) >= minLevel;
}

/** Atalho legado mantido para compatibilidade: `can(profiles.X)` continua válido. */
export function hasAccess(profileId, minLevel) {
  return hasLevel(profileId, minLevel);
}

// ─── Limite de logs do Changelog por nível + team ───────────────────────────
//
// Matriz (admin sempre 20k):
//   N1 / N2 / Produto:  básico 3k · geral 5k · gestor 10k
//   CS / Operações:                geral 3k · gestor 5k   (sem acesso no básico)
//
// IDs de team replicados aqui para evitar import circular com teamsConfig.js
// (teamsConfig importa este módulo). Mantê-los em sincronia com TEAMS.
const CHANGELOG_TEAMS = {
  SUPORTE_N1:          9000101, // Transacional N1
  SUPORTE_N1_PREMIUM:  9000102, // Premium N1
  SUPORTE_N1_DEDICADO: 9000103, // Dedicados N1
  SUPORTE_N2:          9000104,
  OPERACOES:           9000105,
  CS:                  9000106,
  PRODUTO:             9000108,
};

const CHANGELOG_SUPORTE_PRODUTO = [
  CHANGELOG_TEAMS.SUPORTE_N1,
  CHANGELOG_TEAMS.SUPORTE_N1_PREMIUM,
  CHANGELOG_TEAMS.SUPORTE_N1_DEDICADO,
  CHANGELOG_TEAMS.SUPORTE_N2,
  CHANGELOG_TEAMS.PRODUTO,
];

export function getChangelogLimit(profileId, teamId) {
  const lvl = getLevel(profileId);
  if (lvl >= LEVELS.ADMIN) return 20000;

  const tid = teamId != null ? Number(teamId) : null;
  const isSuporteProduto = tid != null && CHANGELOG_SUPORTE_PRODUTO.includes(tid);

  if (isSuporteProduto) {
    // N1 / N2 / Produto — acesso a partir do básico
    if (lvl >= LEVELS.GESTOR) return 10000;
    if (lvl >= LEVELS.NORMAL) return 5000;
    if (lvl >= LEVELS.BASICO) return 3000;
    return 0;
  }

  // CS / Operações (e qualquer outra team com acesso) — somente geral+
  if (lvl >= LEVELS.GESTOR) return 5000;
  if (lvl >= LEVELS.NORMAL) return 3000;
  return 0;
}

// ─── Labels ──────────────────────────────────────────────────────────────────
export const LEVEL_LABELS = {
  [LEVELS.BASICO]: 'Acesso básico',
  [LEVELS.NORMAL]: 'Acesso geral',
  [LEVELS.GESTOR]: 'Acesso gestor',
  [LEVELS.ADMIN]:  'Administrador',
};

export const PROFILE_LABELS = {
  [PROFILES.ADMIN]:             'Administrador',
  [PROFILES.GESTOR]:            'Acesso gestor',
  [PROFILES.NORMAL]:            'Acesso geral',
  [PROFILES.BASICO]:            'Acesso básico',
  [PROFILES.LEGACY_N1_PLUS]:    'Acesso gestor',
  [PROFILES.LEGACY_N2_PRODUTO]: 'Acesso gestor',
  [PROFILES.LEGACY_N1_GERAL]:   'Acesso geral',
  [PROFILES.LEGACY_UNIPLOO]:    'Acesso geral',
};

/**
 * Compat: `profiles.X` mapeia para o nível mínimo equivalente ao perfil antigo.
 * Permite que código existente como `can(profiles.UNIPLOO)` continue funcionando
 * — `can` passa a checar o nível do usuário (já normalizado a partir do profileId).
 */
export const profiles = {
  ADMIN:         LEVELS.ADMIN,
  N1_PLUS:       LEVELS.GESTOR,
  N2_PRODUTO:    LEVELS.GESTOR,
  N1_GERAL:      LEVELS.NORMAL,
  UNIPLOO:       LEVELS.NORMAL,
  ACESSO_BASICO: LEVELS.BASICO,
};
