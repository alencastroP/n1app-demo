// src/config/caseTaxonomy.js
//
// Taxonomia de casos do Funil do Técnico (ESPELHO frontend).
//
// ⚠️ FONTE DA VERDADE: backend/src/services/funilTecnicoTriage/caseTaxonomy.js
// (CJS). Este arquivo replica mapa, normalização e extração de alvos — mesmo
// padrão de sincronia de teamsConfig ↔ profileMiddleware. Mudou lá, muda aqui.
//
// A `categoria` do n8n é uma opção de "Sup | Onde ocorre?" normalizada
// (minúscula, sem acento) ou "geral" — docs/triagem-avancada/DISCOVERY.md §5.

export const CASE_TYPES = {
  LOGS: 'logs',
  AUTOMACAO: 'automacao',
  CAMPOS: 'campos',
  BULK: 'bulk',
  INTEGRACAO: 'integracao',
  OUTRO: 'outro',
};

export const CASE_TYPE_LABELS = {
  [CASE_TYPES.LOGS]: 'Logs / performance',
  [CASE_TYPES.AUTOMACAO]: 'Automação / fórmulas',
  [CASE_TYPES.CAMPOS]: 'Campos / formulários',
  [CASE_TYPES.BULK]: 'Ajuste em massa',
  [CASE_TYPES.INTEGRACAO]: 'Integração',
  [CASE_TYPES.OUTRO]: 'Geral',
};

/** Normaliza a categoria: minúsculas, sem acento, trim (idêntico ao back). */
export function normalizeCategoria(categoria) {
  const decomposed = String(categoria || '').normalize('NFD');
  let out = '';
  for (const ch of decomposed) {
    const code = ch.codePointAt(0);
    if (code >= 0x0300 && code <= 0x036f) continue; // remove diacríticos
    out += ch;
  }
  return out.trim().toLowerCase();
}

// categoria normalizada → CASE_TYPE. Fora do mapa → OUTRO. (Espelho do back.)
const CATEGORIA_TO_TIPO = {
  // LOGS
  'registros / log': CASE_TYPES.LOGS,
  'lentidao': CASE_TYPES.LOGS,
  'mobile - lentidao': CASE_TYPES.LOGS,
  // AUTOMACAO
  'automacoes': CASE_TYPES.AUTOMACAO,
  'workflow': CASE_TYPES.AUTOMACAO,
  'fluxo de aprovacao': CASE_TYPES.AUTOMACAO,
  'aprovacoes': CASE_TYPES.AUTOMACAO,
  'formulas': CASE_TYPES.AUTOMACAO,
  // CAMPOS
  'campos': CASE_TYPES.CAMPOS,
  'filtros e abas': CASE_TYPES.CAMPOS,
  'formularios': CASE_TYPES.CAMPOS,
  'formularios externos': CASE_TYPES.CAMPOS,
  // BULK
  'edicao em massa': CASE_TYPES.BULK,
  'importacao': CASE_TYPES.BULK,
  'exportador do excel': CASE_TYPES.BULK,
  'reversao': CASE_TYPES.BULK,
  // INTEGRACAO
  'api': CASE_TYPES.INTEGRACAO,
  'sankhya': CASE_TYPES.INTEGRACAO,
  'omie': CASE_TYPES.INTEGRACAO,
  'intercom': CASE_TYPES.INTEGRACAO,
  'integracao - neppo': CASE_TYPES.INTEGRACAO,
  'integracao personalizada': CASE_TYPES.INTEGRACAO,
  'activecampaign': CASE_TYPES.INTEGRACAO,
  'clicksign': CASE_TYPES.INTEGRACAO,
  'docusign': CASE_TYPES.INTEGRACAO,
  'econodata': CASE_TYPES.INTEGRACAO,
  'exact spotter': CASE_TYPES.INTEGRACAO,
  'facebook lead ads': CASE_TYPES.INTEGRACAO,
  'google calendar': CASE_TYPES.INTEGRACAO,
  'letssign': CASE_TYPES.INTEGRACAO,
  'meetime': CASE_TYPES.INTEGRACAO,
  'messenger': CASE_TYPES.INTEGRACAO,
  'movidesk': CASE_TYPES.INTEGRACAO,
  'outlook (calendario)': CASE_TYPES.INTEGRACAO,
  'power bi': CASE_TYPES.INTEGRACAO,
  'rd station': CASE_TYPES.INTEGRACAO,
  'whatsapp': CASE_TYPES.INTEGRACAO,
  'zenvia': CASE_TYPES.INTEGRACAO,
  'usuario de integracao': CASE_TYPES.INTEGRACAO,
  'webhooks': CASE_TYPES.INTEGRACAO,
};

/**
 * categoriaParaTipo(categoriaRaw) → CASE_TYPE.
 * Categoria ausente/desconhecida → OUTRO (nunca lança).
 */
export function categoriaParaTipo(categoriaRaw) {
  return CATEGORIA_TO_TIPO[normalizeCategoria(categoriaRaw)] || CASE_TYPES.OUTRO;
}

// ── Extração de alvos do cliente (best-effort — espelho do back) ─────────────
const FIELD_KEY_RE = /\b(?:deal|contact|product|order|quote|task)_[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\b/g;
const QUOTED_RE = /["'“”‘’«]([^"'“”‘’«»\n]{3,80})["'“”‘’»]/g;

/**
 * extractClientTargets({ triagem, descricao, titulo }) →
 *   { alvos, termos, semAlvo, fonte }
 * O frontend usa apenas `semAlvo` (habilita/desabilita a análise profunda);
 * o backend usa alvos/termos para montar o briefing.
 */
export function extractClientTargets({ triagem, descricao, titulo } = {}) {
  const inv = triagem?.investigacao;
  if (inv && typeof inv === 'object') {
    const alvos = (Array.isArray(inv.alvos) ? inv.alvos : [])
      .filter((a) => a && typeof a.identificador === 'string' && a.identificador.trim())
      .map((a) => ({
        entidade: typeof a.entidade === 'string' ? a.entidade : null,
        identificador: a.identificador.trim().slice(0, 120),
        por: a.por === 'id' ? 'id' : 'name',
      }));
    const termos = (Array.isArray(inv.termos_busca) ? inv.termos_busca : [])
      .filter((t) => typeof t === 'string' && t.trim())
      .map((t) => t.trim().slice(0, 120));
    if (alvos.length || termos.length) {
      return { alvos, termos, semAlvo: false, fonte: 'investigacao' };
    }
  }

  const texto = [triagem?.resumo, descricao, titulo].filter(Boolean).join('\n').slice(0, 6000);
  const alvos = [];
  const termos = [];

  for (const m of texto.matchAll(FIELD_KEY_RE)) {
    alvos.push({ entidade: 'Field', identificador: m[0], por: 'id' });
  }
  for (const m of texto.matchAll(QUOTED_RE)) {
    const nome = m[1].trim();
    if (nome && nome.split(/\s+/).length <= 8) termos.push(nome.slice(0, 120));
  }

  const dedup = (arr, key) => {
    const seen = new Set();
    return arr.filter((x) => {
      const k = key(x).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const alvosU = dedup(alvos, (a) => a.identificador).slice(0, 10);
  const termosU = dedup(termos.map((t) => ({ t })), (x) => x.t).map((x) => x.t).slice(0, 10);

  return {
    alvos: alvosU,
    termos: termosU,
    semAlvo: alvosU.length === 0 && termosU.length === 0,
    fonte: 'best-effort',
  };
}
