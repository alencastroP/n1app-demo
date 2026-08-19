// src/services/ploomesTicketsService.js
// Cliente do serviço "Buscas Ploomes": lookup do cliente + extração assíncrona
// dos chamados (produto/manutenção) em JSON para download.

import { apiFetchJson, apiFetchRaw } from './http';

/**
 * Consulta sincronamente o cliente no Ploomes pelo id do partners.
 * Retorna também a contagem de chamados em cada funil (fixos + extras
 * selecionados) para o período escolhido.
 *
 * @param {{ partnersId: string, periodo: string, dataInicio?: string,
 *           pipelineIds?: number[] }} payload
 * @returns {Promise<{ partnersId: string, contactId: number, nome: string,
 *                     dataInicio: string|null, pipelineIds: number[],
 *                     counts: { porFunil: Array<{ id: number, key: string,
 *                       nome: string, fixed: boolean, total: number }>,
 *                       total: number } }>}
 */
/**
 * Lista os funis da conta interna para o usuário escolher quais incluir na
 * extração além dos funis fixos (produto/manutenção).
 *
 * @returns {Promise<{ pipelines: Array<{ id: number, nome: string, fixed: boolean }>,
 *                     fixedIds: number[] }>}
 */
export async function fetchPloomesTicketsPipelines() {
  return apiFetchJson('/api/ploomes-tickets/pipelines');
}

export async function lookupPloomesContact(payload) {
  return apiFetchJson('/api/ploomes-tickets/contact-lookup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Inicia o job de extração em background. Retorna o jobId imediatamente.
 * O cliente deve fazer polling em /status até `status === 'completed'`.
 *
 * @param {{ partnersId: string, contactId: number, nome: string,
 *           periodo: string, dataInicio?: string }} payload
 * @returns {Promise<{ jobId: string, status: 'started' }>}
 */
export async function startPloomesTicketsJob(payload) {
  return apiFetchJson('/api/ploomes-tickets/jobs/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPloomesTicketsJobStatus(jobId) {
  return apiFetchJson(`/api/ploomes-tickets/jobs/${encodeURIComponent(jobId)}/status`);
}

export async function cancelPloomesTicketsJob(jobId) {
  return apiFetchJson(`/api/ploomes-tickets/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: 'POST',
  });
}

export async function downloadPloomesTicketsJson(jobId) {
  return apiFetchRaw(`/api/ploomes-tickets/jobs/${encodeURIComponent(jobId)}/download`);
}
