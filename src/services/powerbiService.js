// src/services/powerbiService.js
import { apiFetch } from './http';

async function ensureJson(resOrObj) {
  // Se veio um Response (tem .json), parseia; senão já é o objeto.
  return typeof resOrObj?.json === 'function' ? resOrObj.json() : resOrObj;
}

export async function getExportedTabs(accountKey) {
  const r = await apiFetch(`/api/pbi/supportaccess/${encodeURIComponent(accountKey)}`);
  return ensureJson(r);
}

export async function readPowerBILink(url, extraHeaders) {
  const r = await apiFetch('/api/pbi/read-link', {
    method: 'POST',
    body: JSON.stringify({ url, extraHeaders }),
  });
  return ensureJson(r);
}

/**
 * Busca dados do usuário Ploomes pelo Id.
 * Requer User-Key da conta.
 */
export async function getPloomesUser(userId, userKey) {
  const resp = await fetch(
    `https://api2.ploomes.com/Users?$filter=Id+eq+${userId}&$select=Id,Name,AvatarUrl`,
    { headers: { 'User-Key': userKey } }
  );
  if (!resp.ok) throw new Error(`Erro ao buscar usuário: ${resp.status}`);
  const data = await resp.json();
  return data?.value?.[0] ?? null;
}

/**
 * Busca informações da conta Ploomes (nome da conta).
 * Requer User-Key da conta.
 */
export async function getPloomesAccount(userKey) {
  const resp = await fetch(
    `https://api2.ploomes.com/Account?$select=Id,Name,LogoUrl`,
    { headers: { 'User-Key': userKey } }
  );
  if (!resp.ok) throw new Error(`Erro ao buscar conta: ${resp.status}`);
  const data = await resp.json();
  return data?.value?.[0] ?? null;
}
