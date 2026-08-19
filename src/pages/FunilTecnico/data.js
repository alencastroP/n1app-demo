// src/pages/FunilTecnico/data.js
//
// Derivação de dados do Funil do Técnico: transforma os deals crus do backend
// (com `triagem` já parseada) em "casos" com campos derivados, e calcula as
// métricas do topo. Sem estilo, sem React — só lógica pura, testável e
// reaproveitada pelo orquestrador e pelas views.

import { severidadeColor, SEVERIDADE_RANK } from './components/ui';
import { CASE_TYPES, categoriaParaTipo } from '../../config/caseTaxonomy';

// Whitelist de responsáveis do suporte (Fase D): deixou de ser hardcode — vem
// do backend (env FUNIL_ALLOWED_OWNERS) no payload do /funnel como
// `board.allowedOwners`. Lista vazia/ausente = todos os owners aparecem.

/**
 * Um owner passa na whitelist? Lista vazia/ausente libera todos.
 * @param {string|null} ownerName
 * @param {Array<string>|undefined} allowedOwners
 */
export function isAllowedOwner(ownerName, allowedOwners) {
  if (!Array.isArray(allowedOwners) || allowedOwners.length === 0) return true;
  return allowedOwners.includes(ownerName);
}

// Confiança mínima para o caso ser considerado "resolvível por IA".
export const CONFIANCA_RESOLVIVEL = 85;

// Dias parados a partir do qual o caso conta como "SLA estourado".
export const SLA_LIMIT_DIAS = 7;

const MS_DIA = 24 * 60 * 60 * 1000;

/** Dias inteiros desde uma data ISO até agora (0 se ausente/ inválida). */
export function daysSince(iso) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / MS_DIA));
}

/**
 * Deriva um "caso" a partir de um deal + o estágio (coluna) em que ele está.
 * Cards SEM triagem viram casos válidos, apenas sem os campos de IA.
 * @param {object} deal
 * @param {{ id:number, name:string }} [stage]
 * @param {boolean} [dark]
 */
export function deriveCaso(deal, stage, dark = false) {
  const t = deal?.triagem && typeof deal.triagem === 'object' ? deal.triagem : null;
  const confianca = typeof t?.confianca === 'number' ? t.confianca : null;
  const recorrente = t?.recorrente_mapeado === true;
  const caseType = categoriaParaTipo(t?.categoria);

  return {
    id: deal.id,
    title: deal.title,
    amount: deal.amount ?? null,
    statusId: deal.statusId ?? null,
    ownerName: deal.ownerName || null,
    contactName: deal.contactName || null, // null no funil; resolvido no detalhe
    stageId: deal.stageId ?? stage?.id ?? null,
    stageName: stage?.name || null,
    lastUpdateDate: deal.lastUpdateDate || null,
    diasParado: daysSince(deal.lastUpdateDate),

    // Campos de triagem (podem ser null quando não há triagem).
    triagem: t,
    categoria: t?.categoria || null,
    caseType,
    severidade: t?.severidade || null,
    severidadeColor: t?.severidade ? severidadeColor(t.severidade, dark) : null,
    confianca,
    recorrente,
    resumo: t?.resumo || null,
    resolucaoRapida: t?.resolucao_rapida || null,
    intercomId: t?.intercom_id || null,
    birdieUrl: t?.birdie_url || null,
    triadoEm: t?.triado_em || null,
    modelo: t?.modelo || null,

    // Derivado: caso é resolvível automaticamente por IA? Exige confiança alta
    // E um playbook de investigação não-genérico (CASE_TYPE ≠ OUTRO) — sem
    // playbook dirigido, a IA não tem caminho mapeado para resolver.
    resolvivelIA:
      !!t && recorrente && confianca != null && confianca >= CONFIANCA_RESOLVIVEL &&
      caseType !== CASE_TYPES.OUTRO,
  };
}

/**
 * Achata as colunas do board em casos, aplicando a whitelist de responsáveis
 * vinda do backend (`board.allowedOwners`; vazia = todos).
 * @param {{ columns: Array<{ stage, deals }>, allowedOwners?: string[] }} board
 * @param {boolean} dark
 * @returns {Array<object>} casos
 */
export function flattenCasos(board, dark = false) {
  if (!board?.columns) return [];
  const casos = [];
  for (const col of board.columns) {
    for (const deal of col.deals || []) {
      if (!isAllowedOwner(deal.ownerName, board.allowedOwners)) continue;
      casos.push(deriveCaso(deal, col.stage, dark));
    }
  }
  return casos;
}

/**
 * Métricas do topo, sobre os casos EM ABERTO (statusId === 1).
 * @param {Array<object>} casos
 */
export function computeMetrics(casos) {
  const abertos = casos.filter((c) => c.statusId === 1);
  const resolviveisIA = abertos.filter((c) => c.resolvivelIA).length;
  const slaEstourado = abertos.filter((c) => c.diasParado >= SLA_LIMIT_DIAS).length;
  const somaParado = abertos.reduce((s, c) => s + c.diasParado, 0);
  const tempoMedioParado = abertos.length ? Math.round(somaParado / abertos.length) : 0;

  return {
    casosAbertos: abertos.length,
    resolviveisIA,
    slaEstourado,
    tempoMedioParado,
  };
}

// Comparadores de ordenação da Fila.
export const SORTERS = {
  severidade: (a, b) =>
    (SEVERIDADE_RANK[b.severidade] || 0) - (SEVERIDADE_RANK[a.severidade] || 0) ||
    b.diasParado - a.diasParado,
  parado: (a, b) => b.diasParado - a.diasParado,
  confianca: (a, b) => (b.confianca ?? -1) - (a.confianca ?? -1),
};
