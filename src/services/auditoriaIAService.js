// src/services/auditoriaIAService.js
//
// Auditoria de IA (CloudHuman) — molde churn (SSE inline + jobId correlacionado).
import { apiFetchJson } from './http';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid';

/**
 * Inicia um job de auditoria de IA. Abre SSE na mesma conexão do POST.
 * Resolve com { type: 'complete', jobId, total, resultados } ao terminar.
 * Rejeita com Error em caso de falha ou timeout.
 *
 * Período (dataInicio/dataFim) é opcional quando há filtro específico
 * (conversationId / clienteNome / clienteId). A ordenação é client-side na tabela.
 *
 * @param {{
 *   dataInicio?: string,   // ISO 8601
 *   dataFim?: string,      // ISO 8601
 *   estado: 'encerrado_ia'|'transferido_humano'|'todos',
 *   conversationId?: string,
 *   clienteNome?: string,
 *   clienteId?: string
 * }} payload
 * @param {{ onProgress?: (data: object) => void }} options
 */
export async function executeAuditoriaJob(payload, { onProgress } = {}) {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API_BASE}/api/auditoria-ia/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let message = `${resp.status} — ${text.slice(0, 300)}`;
    try { const j = JSON.parse(text); if (j?.erro) message = j.erro; } catch (_) {}
    throw new Error(message);
  }

  // Lê o stream SSE — mesmo padrão do intercomService/apiHubService
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let data;
      try { data = JSON.parse(line.slice(6)); } catch (_) { continue; }

      if (data.type === 'complete') return data;
      if (data.type === 'error') throw new Error(data.message || 'Erro no processamento da auditoria.');
      if (data.type === 'start' || data.type === 'progress') {
        onProgress?.(data);
      }
    }
  }

  throw new Error('Stream encerrou sem evento de conclusão.');
}

/**
 * Aplica a tag "Auditado" na conversa do Intercom.
 * @param {string} conversationId
 * @returns {Promise<{ ok: true, conversationId: string }>}
 */
export async function marcarAuditado(conversationId) {
  return apiFetchJson('/api/auditoria-ia/mark-audited', {
    method: 'POST',
    body: JSON.stringify({ conversationId }),
  });
}
