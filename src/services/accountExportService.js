// src/services/accountExportService.js
// Exportação de Base: validação de UKs, pré-triagem (SSE), job de extração e download.

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid';
const BASE = `${API_BASE}/api/account-export`;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Valida um array de User-Keys.
 * @param {string[]} keys
 * @returns {Promise<{ accountId, accountName, validatedKeys }>}
 */
export async function validateKeys(keys) {
  const resp = await fetch(`${BASE}/validate-keys`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ keys }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.erro ?? `HTTP ${resp.status}`);
  return json;
}

/**
 * Pré-triagem por $count (SSE). Resolve com { counts, errors }.
 * @param {{ keys: string[] }} params
 * @param {{ onProgress?:(m:string)=>void }} [callbacks]
 * @returns {{ promise: Promise<object>, abort: () => void }}
 */
export function runTriage({ keys }, { onProgress } = {}) {
  const controller = new AbortController();

  const promise = (async () => {
    const resp = await fetch(`${BASE}/triage`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ keys }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      let msg = `HTTP ${resp.status}`;
      try { msg = JSON.parse(text)?.erro ?? msg; } catch { /* não era JSON */ }
      throw new Error(msg);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let evt = null, data = null;
    let result = null;

    const dispatch = () => {
      if (!evt || data === null) return;
      try {
        const parsed = JSON.parse(data);
        if (evt === 'progress' || evt === 'start') onProgress?.(parsed.message ?? '');
        else if (evt === 'complete') result = parsed;
        else if (evt === 'error') throw new Error(parsed.message ?? 'Erro na triagem');
        else if (evt === 'cancelled') throw Object.assign(new Error('Triagem cancelada'), { cancelled: true });
      } catch (e) {
        if (e?.cancelled) throw e;
        // JSON.parse de heartbeat — ignora
      }
      evt = null; data = null;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const t = line.trimEnd();
        if (t.startsWith('event:')) evt = t.slice(6).trim();
        else if (t.startsWith('data:')) data = t.slice(5).trim();
        else if (t === '') dispatch();
      }
    }
    if (!result) throw new Error('Triagem encerrou sem resultado.');
    return result;
  })();

  return { promise, abort: () => controller.abort() };
}

/**
 * Inicia o job de exportação.
 * @returns {Promise<{ jobId: string }>}
 */
export async function startExport({ keys, accountId, accountName }) {
  const resp = await fetch(`${BASE}/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ keys, accountId, accountName }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.erro ?? `HTTP ${resp.status}`);
  return json;
}

/** Consulta status + logs incrementais do job. */
export async function getStatus(jobId, since = 0) {
  const resp = await fetch(`${BASE}/${jobId}/status?since=${since}`, { headers: authHeaders() });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.erro ?? `HTTP ${resp.status}`);
  return json;
}

/** Cancela o job. */
export async function cancelExport(jobId) {
  await fetch(`${BASE}/${jobId}/cancel`, { method: 'POST', headers: authHeaders() }).catch(() => {});
}

/** URL de download do .zip (com token na query não é possível; baixa via fetch + blob). */
export async function downloadZip(jobId, accountName) {
  const resp = await fetch(`${BASE}/${jobId}/download`, { headers: authHeaders() });
  if (!resp.ok) {
    const json = await resp.json().catch(() => ({}));
    throw new Error(json?.erro ?? `HTTP ${resp.status}`);
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export_${String(accountName || 'conta').replace(/[^\w-]+/g, '_')}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
