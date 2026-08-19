// src/services/fieldsExplorerService.js
import { apiFetchJson } from './http';

/**
 * Busca TODOS os campos da entidade informada.
 * O backend pagina internamente na API Ploomes até coletar a lista completa —
 * não há limite de 500 campos.
 * params:
 *  - userKey   (string, obrigatória)
 *  - entityId  (number, obrigatório)
 */
export async function fetchFieldsByEntity({ userKey, entityId }) {
  const params = new URLSearchParams({
    userKey: String(userKey || ''),
    entityId: String(entityId),
  });

  return apiFetchJson(`/api/fields-explorer/by-entity?${params.toString()}`, {
    method: 'GET',
  });
}
