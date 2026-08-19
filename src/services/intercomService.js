// src/services/intercomService.js
import { apiFetchJson, apiFetchRaw } from './http';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid';

/**
 * Aplica uma tag no Intercom para empresas ou contatos.
 */
export async function applyIntercomTag(type, tagName, ids) {
  return apiFetchJson('/api/intercom/tags', {
    method: 'POST',
    body: JSON.stringify({ type, tagName, ids }),
  });
}

/**
 * Retorna todas as tags da conta no Intercom.
 * @returns {Promise<{ tags: { id: string, name: string }[] }>}
 */
export async function listIntercomTags() {
  return apiFetchJson('/api/intercom/tags/list');
}

// =============================================================================
// NOVO FLUXO — jobManager + SSE inline + jobId correlacionado
// =============================================================================

/**
 * Inicia um job de análise de churn. Abre SSE na mesma conexão do POST.
 * Resolve com { type: 'complete', jobId, total, downloadUrl } ao terminar.
 * Rejeita com Error em caso de falha ou timeout.
 *
 * @param {{ modo: 'tag'|'id', tag_id?: string, company_id?: string, dias_limite?: number }} payload
 * @param {{ onProgress?: (data: object) => void }} options
 */
export async function executeChurnJob(payload, { onProgress } = {}) {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API_BASE}/api/intercom/churn/jobs`, {
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

  // Lê o stream SSE — mesmo padrão do apiHubService
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
      if (data.type === 'error') throw new Error(data.message || 'Erro no processamento do churn.');
      if (data.type === 'start' || data.type === 'progress') {
        onProgress?.(data);
      }
    }
  }

  throw new Error('Stream encerrou sem evento de conclusão.');
}

/**
 * Baixa o relatório de conversas de churn de um job concluído.
 * @param {string} jobId
 * @param {'md'|'json'} [format='md'] - Formato do arquivo retornado.
 * @returns {Promise<Response>}
 */
export async function downloadChurnXlsx(jobId, format = 'md') {
  return apiFetchRaw(`/api/intercom/churn/jobs/${jobId}/xlsx?format=${format}`);
}

// =============================================================================
// FLUXO ANTIGO — mantido para validação paralela
// DEPRECATED: remover após validação do novo fluxo (issue #XXX)
// =============================================================================

/**
 * @deprecated Use executeChurnJob() + downloadChurnXlsx()
 */
export async function triggerChurnN8n(payload) {
  return apiFetchJson('/api/intercom/n8n/churn', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * @deprecated Use executeChurnJob() (SSE inline, sem EventSource)
 */
export function createChurnEventSource() {
  return new EventSource(`${API_BASE}/api/intercom/n8n/events`);
}

/**
 * @deprecated Use downloadChurnXlsx(jobId)
 */
export async function downloadChurnResult() {
  return apiFetchRaw('/api/intercom/n8n/download');
}
