// src/services/omieApi.js
import { apiFetch } from './http';

export async function getAccountInfo(userKey) {
  return apiFetch(`/api/omie/account-info?userKey=${encodeURIComponent(userKey)}`);
}

export async function getUserIdByName(userKey, name) {
  return apiFetch(`/api/omie/user-by-name?userKey=${encodeURIComponent(userKey)}&name=${encodeURIComponent(name)}`);
}

export async function getMe(userKey) {
  return apiFetch(`/api/omie/me?userKey=${encodeURIComponent(userKey)}`);
}

export async function postFirstSync(payload) {
  return apiFetch('/api/omie/firstsync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function postBring(entity, payload) {
  return apiFetch(`/api/omie/bring/${encodeURIComponent(entity)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function postForce(direction, payload) {
  return apiFetch(`/api/omie/force/${encodeURIComponent(direction)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
