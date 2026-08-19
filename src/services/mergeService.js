// src/services/mergeService.js
import { apiFetchJson, apiFetchRaw } from './http';

/**
 * Busca os campos de uma entidade (para seleção de campo identificador / duplicidade).
 * @param {{ userKey: string, entity: string }} params
 * @returns {Promise<{ fields: Array<{ Id, Key, Name, Dynamic, EntityId }> }>}
 */
export async function getEntityFields({ userKey, entity }) {
  const params = new URLSearchParams({ userKey, entity });
  return apiFetchJson(`/api/merge/fields?${params}`, { method: 'GET' });
}

/**
 * Inicia um job de mesclagem.
 * @param {{
 *   userKey: string,
 *   entity: string,
 *   mergeModel: string,
 *   identifierFieldId?: number,
 *   identifierFieldKey?: string,
 *   duplicateFieldKey?: string,
 *   withDelete: boolean,
 * }} params
 * @returns {Promise<{ jobId: string, status: string, message: string }>}
 */
export async function startMerge(params) {
  return apiFetchJson('/api/merge/start', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Retorna o status e progresso de um job.
 * @param {string} jobId
 */
export async function getJobStatus(jobId) {
  return apiFetchJson(`/api/merge/job/${jobId}`, { method: 'GET' });
}

/**
 * Cancela um job em execução.
 * @param {string} jobId
 */
export async function cancelJob(jobId) {
  return apiFetchJson(`/api/merge/cancel/${jobId}`, { method: 'POST' });
}

/**
 * Verifica se há um job de merge ativo.
 */
export async function getActiveJob() {
  return apiFetchJson('/api/merge/active', { method: 'GET' });
}

/**
 * Download do CSV ao final de um job concluído.
 * @param {string} jobId
 * @returns {Promise<string>} URL do blob
 */
export async function downloadCsv(jobId) {
  const resp = await apiFetchRaw(`/api/merge/job/${jobId}/csv`, { method: 'GET' });
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}
