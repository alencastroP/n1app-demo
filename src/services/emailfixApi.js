// src/services/emailfixApi.js
import { apiFetch } from './http';

function partnersUK() {
  return localStorage.getItem('partnersUK') || '';
}

export function listUsersByAccount(accountId) {
  return apiFetch(`/api/emailfix/users?accountId=${encodeURIComponent(accountId)}`, {
    headers: { 'X-Partners-UK': partnersUK() }
  });
}

export function changeEmail(userId, email) {
  return apiFetch(`/api/emailfix/users/${encodeURIComponent(userId)}/email`, {
    method: 'PATCH',
    headers: { 'X-Partners-UK': partnersUK() },
    body: JSON.stringify({ email })
  });
}
