// src/services/ploomesKanbanService.js
import { apiFetchJson } from './http';

/**
 * Busca o funil de kanban fixo do backend (funil padrão configurado no servidor).
 *
 * Cada deal traz `triagem`: o JSON da pré-triagem gravado pelo n8n no campo
 * personalizado, já com JSON.parse feito no backend — ou `null` quando o card
 * não tem triagem (ex.: card antigo) ou o JSON está malformado.
 *
 * @returns {Promise<{
 *   pipeline: { id, name, archived, color },
 *   columns: Array<{ stage, deals: Array<{
 *     id, title, amount, stageId, pipelineId, statusId, contactId, contactName,
 *     ownerId, ownerName, createDate, lastUpdateDate,
 *     triagem: null | {
 *       v, triado_em, modelo, resolucao_rapida, confianca, severidade, categoria,
 *       recorrente_mapeado, resumo, intercom_id, birdie_url
 *     }
 *   }>, count, totalAmount }>,
 *   totalDeals: number
 * }>}
 */
export async function fetchKanbanFunnel() {
  return apiFetchJson('/api/ploomes-kanban/funnel', { method: 'GET' });
}

/**
 * Busca o detalhe de uma negociação (Workspace do caso): identificação, pessoas
 * (owner/criador/cliente), descrição, campos custom preenchidos, links
 * (Ploomes/Intercom), a triagem da IA, anexos e os registros de interação.
 * @param {number} dealId
 * @returns {Promise<{
 *   deal: {
 *     id, title, amount, stageId, statusId, contactId, contactName, ownerName,
 *     creatorName, descricao, triagem: null | object,
 *     camposExtras: Array<{ key, label, kind: 'text'|'longtext'|'option'|'url'|'email', value }>,
 *     intercomId: string|null, intercomUrl: string|null, ploomesUrl: string,
 *     createDate, lastUpdateDate
 *   },
 *   interactions: Array<{ id, content, date, typeId, type, author }>,
 *   attachments: Array<{ id, fileName, contentType, size, url }>
 * }>}
 */
export async function fetchDealCard(dealId) {
  return apiFetchJson(`/api/ploomes-kanban/deal/${dealId}`, { method: 'GET' });
}

/**
 * Autocomplete de "Cliente (conta)" do formulário de novo caso.
 * @param {string} q — termo de busca (mínimo 2 caracteres; menos → lista vazia)
 * @returns {Promise<{ contacts: Array<{ id:number, name:string }> }>}
 */
export async function searchFunnelContacts(q) {
  return apiFetchJson(`/api/ploomes-kanban/contacts?q=${encodeURIComponent(q || '')}`, {
    method: 'GET',
  });
}

/**
 * Metadados do formulário "Novo caso técnico" (backend N1 — a UK do Suporte é
 * do servidor; o front nunca fala com o Ploomes direto).
 * @returns {Promise<{
 *   pipeline: { id, name },
 *   stages: Array<{ id, name, pipelineId, ordination }>,
 *   defaultStageId: number,
 *   fields: Array<{ key, fieldKey, label, typeId, required, maxLen?, available,
 *                   options?: Array<{ id, name }> }>,
 *   titlePattern: string
 * }>}
 */
export async function getFormMeta() {
  return apiFetchJson('/api/ploomes-kanban/form-meta', { method: 'GET' });
}

/**
 * Cria o card técnico no funil do Ploomes (única escrita do módulo). O chamador
 * é responsável pela confirmação visual ANTES de invocar (PreviewBox/modal).
 * @param {{ titulo:string, ondeOcorreId:number, descricao:string, impactoId:number,
 *   stageId?:number, tipoDemandaId?:number, canalId?:number, linkIntercom?:string,
 *   intercomTicketId?:string, emailReportou?:string, videoLink?:string,
 *   paginaOcorrencia?:string, contactId?:number }} payload
 * @returns {Promise<{ ok:true, dealId:number, title:string, stageId:number,
 *   interactionNoteOk:boolean }>}
 */
export async function createDeal(payload) {
  return apiFetchJson('/api/ploomes-kanban/deals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
