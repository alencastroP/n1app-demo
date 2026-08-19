// src/services/ragService.js
//
// Cliente do agente Q&A do RAG (POST /api/rag/ask). Usado pelo painel
// "Teste RAG (admin)" do N1 Copilot para diagnosticar se a cadeia
// (embeddings + Anthropic) já funciona em produção ou segue bloqueada pela rede.
//
// Mesmo padrão dos demais services: API_BASE por env, JWT do localStorage.

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Pergunta ao agente de Q&A do RAG.
 * @param {string} pergunta
 * @param {{ modulo?: string|string[], confianca?: string|string[] }} [filtros]
 * @returns {Promise<{ resposta: string, fontes: Array<{titulo,url_central,modulo,score}>, modelo: string|null }>}
 * @throws {Error} com `.status` (HTTP) e `.code` quando o backend responde
 *   não-2xx; falhas de rede propagam a mensagem original (ex.: "Failed to fetch")
 *   — é justamente isso que queremos diagnosticar em produção.
 */
export async function askRag(pergunta, filtros = {}) {
  const resp = await fetch(`${API_BASE}/api/rag/ask`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ pergunta, filtros }),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(json?.erro ?? `HTTP ${resp.status}`);
    err.status = resp.status;
    err.code = json?.code;
    throw err;
  }
  return json;
}
