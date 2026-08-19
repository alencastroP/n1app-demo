import { apiFetchJson } from './http';

export async function postImportationData(userKey, importationId, templateId = 1) {
  if (!userKey || !importationId) throw new Error('User-Key e ID da importação são obrigatórios');

  const res = await apiFetchJson('/api/importation', {
    method: 'POST',
    body: JSON.stringify({ userKey, importationId, templateId }),
  });

  if (Array.isArray(res)) {
    const found = res.find(i => String(i?.Id).trim().toLowerCase() === String(importationId).trim().toLowerCase());
    if (found) return found;
  }
  return res;
}

export async function getCreatorUser(userKey, userId) {
  return await apiFetchJson('/api/importation/user', {
    method: 'POST',
    body: JSON.stringify({ userKey, userId }),
  });
}

export async function getFieldsByKeys(userKey, keys) {
  // DEBUG
  console.log('[FRONT] chamando /api/importation/fields com keys=', keys);

  return await apiFetchJson('/api/importation/fields', {
    method: 'POST',
    body: JSON.stringify({ userKey, keys }),
  });
}
