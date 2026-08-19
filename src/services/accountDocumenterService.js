// src/services/accountDocumenterService.js

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid';

function getAuthHeaders() {
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
  const resp = await fetch(`${API_BASE}/api/account-documenter/validate-keys`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ keys }),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.erro ?? `HTTP ${resp.status}`);
  return json;
}

/**
 * Inicia a extração via SSE.
 * @param {{ keys: string[], accountId: string, accountName: string }} params
 * @param {{ onProgress, onComplete, onError, onCancelled }} callbacks
 * @returns {() => void} função para abortar (cancelar)
 */
export function startExtraction({ keys, accountId, accountName }, { onProgress, onComplete, onError, onCancelled }) {
  const controller = new AbortController();

  (async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/account-documenter/extract`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ keys, accountId, accountName }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        let msg = `HTTP ${resp.status}`;
        try { msg = JSON.parse(text)?.erro ?? msg; } catch (_) { /* não era JSON */ }
        onError(msg);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // Estado SSE persiste entre chunks
      let currentEvent = null;
      let currentData = null;
      console.log('[SSE] Reader iniciado, aguardando chunks...');

      function dispatchEvent() {
        if (!currentEvent || currentData === null) return;
        console.log('[SSE] dispatch | event=', currentEvent, '| data=', currentData.slice(0, 100));
        try {
          const parsed = JSON.parse(currentData);
          if (currentEvent === 'progress' || currentEvent === 'start') {
            onProgress(parsed.message ?? '');
          } else if (currentEvent === 'complete') {
            onComplete(parsed);
          } else if (currentEvent === 'error') {
            const detail = parsed.stack ? ` [${parsed.stack}]` : '';
            onError((parsed.message ?? 'Erro desconhecido') + detail);
          } else if (currentEvent === 'cancelled') {
            onCancelled?.(parsed.message ?? 'Extração cancelada.');
          }
        } catch (e) { console.error('[SSE] JSON.parse falhou:', e.message, '| data=', currentData); }
        currentEvent = null;
        currentData = null;
      }

      while (true) {
        const { done, value } = await reader.read();
        console.log('[SSE] chunk recebido | done=', done, '| bytes=', value?.length);
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        console.log('[SSE] buffer atual:', JSON.stringify(buffer.slice(0, 300)));

        // Processa todas as linhas completas; mantém incompleta no buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trimEnd(); // remove apenas \r no final (CRLF)
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
          } else if (trimmed.startsWith('data:')) {
            currentData = trimmed.slice(5).trim();
          } else if (trimmed === '') {
            // Linha em branco = fim do evento SSE
            dispatchEvent();
          }
          // Linhas começando com ':' são comentários/heartbeat — ignora
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // AbortError gerado pelo controller.abort() local = cancelamento intencional
        onCancelled?.('Extração cancelada pelo usuário.');
      } else {
        onError(err.message ?? 'Erro de conexão');
      }
    }
  })();

  return () => controller.abort();
}
