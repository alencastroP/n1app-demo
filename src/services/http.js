// src/services/http.js
import { showPermissionToast } from './globalToast';
import { clearContaAtivaStorage } from './accountSessionStorage';

const API_BASE = (import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid').replace(/\/+$/, '');

/**
 * Trata respostas de erro do backend. Específico para:
 *   - 401: token inválido → desloga
 *   - 403 com `code: 'permission_denied'`: erro de permissão do nosso app
 *     → dispara Toast global + redireciona para /services
 *     → lança PermissionError marcado para callers que quiserem suprimir a UI
 * Outros erros viram Error genérica com a mensagem do backend.
 */
export class PermissionError extends Error {
  constructor(message, { reason, serviceKey } = {}) {
    super(message);
    this.name = 'PermissionError';
    this.isPermissionError = true;
    this.reason = reason;
    this.serviceKey = serviceKey;
  }
}

async function handleError(resp) {
  if (resp.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('partnersUK');
    clearContaAtivaStorage();
    window.location.assign('/');
    return;
  }

  const text = await resp.text().catch(() => '');
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}

  // 403 de permissão do nosso app (marcado pelo profileMiddleware)
  if (resp.status === 403 && json?.code === 'permission_denied') {
    const message = json.erro || 'Você não tem permissão para acessar este recurso.';
    showPermissionToast(message);
    // Redireciona para /services se não estiver lá ainda
    if (typeof window !== 'undefined' && !/^\/services\/?$/.test(window.location.pathname)) {
      setTimeout(() => window.location.assign('/services'), 800);
    }
    throw new PermissionError(message, {
      reason: json.reason,
      serviceKey: json.serviceKey,
    });
  }

  let message = `${resp.status} ${resp.statusText} — ${text.slice(0, 500)}`;
  if (json?.erro) message = json.erro;
  else if (json?.error) message = json.error;

  // Anexa o corpo parseado: rotas que sinalizam o que fazer a seguir (ex.:
  // `needsSupportUserKey` na troca de token Sankhya) precisam de mais que a mensagem.
  const err = new Error(message);
  if (json) err.body = json;
  throw err;
}

export async function apiFetch(path, init = {}) {
  const token = localStorage.getItem('token');

  const headers = new Headers(init.headers || {});
  // FormData define o próprio Content-Type (com boundary) — não forçar JSON.
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  const partnersUK = localStorage.getItem('partnersUK');
  if (partnersUK && String(path).startsWith('/api/emailfix') && !headers.has('X-Partners-UK')) {
    headers.set('X-Partners-UK', partnersUK);
  }
  const resp = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!resp.ok) {
    await handleError(resp);
    return; // handleError já redirecionou (401) ou lançou
  }

  const ct = resp.headers.get('content-type') || '';
  return ct.includes('application/json') ? resp.json() : resp;
}

export async function apiFetchRaw(path, init = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers || {});
  // FormData define o próprio Content-Type (com boundary) — não forçar JSON.
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const resp = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!resp.ok) {
    await handleError(resp);
    return;
  }
  return resp;
}

export async function apiFetchJson(path, init = {}) {
  const resp = await apiFetchRaw(path, init);
  const ct = resp.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Esperava JSON, recebeu: ${ct || 'desconhecido'} — ${text.slice(0, 200)}`);
  }
  return resp.json();
}

export default apiFetch;
