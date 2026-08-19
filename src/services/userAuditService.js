// src/services/userAuditService.js
// Cliente do backend de Auditoria de Histórico de Usuário.
// Padrão de job assíncrono (igual ao account-export): start → polling → download.
// Usa apiFetch (JSON) e apiFetchRaw (binário/ZIP) — nunca axios.

import { apiFetch, apiFetchRaw } from './http';

/**
 * Lista usuários da conta a partir da User-Key (também valida a UK).
 * Retorna array de { Id, Name, Suspended, Email, AvatarUrl }.
 */
export async function listUsers(userKey) {
  // UK via header (não em query string) — evita expor a chave em logs/histórico.
  const data = await apiFetch('/api/user-audit/users', {
    method: 'GET',
    headers: { 'User-Key': userKey },
  });
  return data?.users ?? [];
}

/**
 * Inicia a extração em background. Retorna { jobId, status }.
 * body: { userKey, userIds:[], dateStart:'YYYY-MM-DD', dateEnd:'YYYY-MM-DD' }
 */
export async function startExtraction(payload) {
  return apiFetch('/api/user-audit/extract', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Consulta o status do job (polling). `since` = nº de logs já recebidos, para
 * trazer só os novos. Retorna { status, progress, total, info, logs, logCount,
 * error, summary, hasFile }.
 */
export async function getStatus(jobId, since = 0) {
  return apiFetch(`/api/user-audit/${jobId}/status?since=${since}`, { method: 'GET' });
}

/** Solicita o cancelamento do job. */
export async function cancel(jobId) {
  return apiFetch(`/api/user-audit/${jobId}/cancel`, { method: 'POST' });
}

/** Baixa o ZIP gerado pelo job (binário). Retorna um Blob. */
export async function downloadZip(jobId) {
  const resp = await apiFetchRaw(`/api/user-audit/${jobId}/download`, { method: 'GET' });
  if (!resp) return null;
  return resp.blob();
}
