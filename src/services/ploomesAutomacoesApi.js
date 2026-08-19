import { apiFetch, apiFetchRaw } from './http';

/**
 * Lista automações da conta Ploomes, com expansão de filtros e ações.
 * @param {Object} params
 * @param {string} params.userKey - User-Key do Ploomes
 * @param {string[]} [params.terms] - Lista de keys/propertyNames dos campos selecionados (OR matching)
 * @param {number} [params.editsEntityId] - Mantém só automações com ação que edita campos dessa entidade
 * @returns {Promise<{ automations: Array, total: number }>}
 */
export async function getAutomations({ userKey, terms = null, editsEntityId = null }) {
  const params = new URLSearchParams();
  if (terms?.length) params.set('terms', terms.join(','));
  if (editsEntityId != null) params.set('editsEntityId', String(editsEntityId));
  const qs = params.toString();

  return apiFetch(`/api/ploomes-automacoes${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: { 'user-key': userKey }
  });
}

export async function exportAutomations({ userKey }) {
  // apiFetchRaw adiciona Authorization Bearer e usa o API_BASE correto
  const res  = await apiFetchRaw('/api/ploomes-automacoes/export', {
    headers: { 'user-key': userKey }
  });
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `automacoes_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAutomationsEditingEntity({ userKey, entityId }) {
  const res  = await apiFetchRaw(`/api/ploomes-automacoes/export-entity-edits?entityId=${entityId}`, {
    headers: { 'user-key': userKey }
  });
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `automacoes_entidade_${entityId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
