// src/services/funilTecnicoService.js
//
// Camada de acesso da Fase 2/3 do Funil do Técnico:
//   - validateUk   → valida a User-Key do CLIENTE (POST /api/funil-tecnico/validate-uk)
//   - ragAsk       → Q&A na base INTERNA de conhecimento (POST /api/rag/ask) — não envia dado de cliente
//   - deepAnalysis → análise profunda com IA sobre a conta do cliente (SSE) — gated por flag no backend
//
// Regras: nada de axios (usa fetch/apiFetch*); SSE consumido por
// fetch + ReadableStream (molde do auditoriaIAService); a User-Key do cliente
// nunca é logada.

import { apiFetchJson } from './http';

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  'https://backend.demo.invalid';

/**
 * Valida a User-Key do cliente. O backend nunca devolve 401/403 aqui (não
 * desloga o usuário N1): UK inválida volta como { ok:false, erro }.
 * @param {string} clientUserKey
 * @returns {Promise<{ ok:true, account:{ id, name, logo } } | { ok:false, erro:string }>}
 */
export async function validateUk(clientUserKey) {
  const uk = String(clientUserKey || '').trim();
  if (!uk) return { ok: false, erro: 'Informe a User-Key do cliente.' };
  return apiFetchJson('/api/funil-tecnico/validate-uk', {
    method: 'POST',
    body: JSON.stringify({ clientUserKey: uk }),
  });
}

/**
 * "Triagem com IA usando o RAG" — pergunta à base INTERNA de conhecimento.
 * NÃO envia dado de cliente. O backend espera o campo `pergunta` (não `query`).
 *
 * @param {string} query   pergunta em texto
 * @param {{ modulo?: string|string[], confianca?: string|string[] }} [filtros]
 * @returns {Promise<{ resposta:string, fontes:Array<{titulo,url_central,modulo,score}>, modelo:string|null }>}
 */
export async function ragAsk(query, filtros = {}) {
  const pergunta = String(query || '').trim();
  if (!pergunta) throw new Error('Digite uma pergunta para a base de conhecimento.');
  return apiFetchJson('/api/rag/ask', {
    method: 'POST',
    body: JSON.stringify({ pergunta, filtros: filtros || {} }),
  });
}

/**
 * Conversa da triagem avançada persistida no card do Suporte (InteractionRecords
 * com marcador do app). Usada para HIDRATAR o Copiloto ao reabrir um caso —
 * fechar/reabrir não perde a triagem já executada.
 *
 * @param {number} dealId
 * @returns {Promise<{ dealId:number, turnos:Array<{ id, date, jobId, turno, papel, texto, toolCalls, geradoEm }> }>}
 */
export async function getTriagemAvancada(dealId) {
  return apiFetchJson(`/api/funil-tecnico/${Number(dealId)}/triagem-avancada`);
}

/**
 * Feedback 👍/👎 de uma sessão de triagem avançada — vira InteractionRecord no
 * card do Suporte (fila de mineração de padrões de caso).
 *
 * @param {{ dealId:number, jobId:string, voto:'up'|'down', comentario?:string }} params
 * @returns {Promise<{ ok:boolean, alreadySent?:boolean, erro?:string }>}
 */
export async function sendTriagemFeedback({ dealId, jobId, voto, comentario }) {
  return apiFetchJson(`/api/funil-tecnico/${Number(dealId)}/triagem-feedback`, {
    method: 'POST',
    body: JSON.stringify({ jobId, voto, comentario }),
  });
}

/**
 * Entrega a decisão do técnico para UMA ação de escrita (POST/PATCH) proposta
 * pela IA durante a análise profunda. A execução acontece no loop do servidor.
 *
 * @param {{ jobId:string, toolUseId:string, decision:'approve'|'reject' }} params
 * @returns {Promise<{ ok:boolean, alreadyDecided?:boolean, erro?:string }>}
 */
export async function approveDeepAnalysisAction({ jobId, toolUseId, decision }) {
  return apiFetchJson('/api/funil-tecnico/approve', {
    method: 'POST',
    body: JSON.stringify({ jobId, toolUseId, decision }),
  });
}

/**
 * Análise profunda com IA (mini-MCP na conta do cliente), via SSE.
 * Gated no backend por FUNIL_DEEP_ANALYSIS_ENABLED — quando off, o endpoint
 * responde JSON { ok:false, code:'deep_analysis_disabled' } e NÃO abre o stream.
 *
 * Eventos repassados a onEvent: start | progress | tool_call | tool_result | approval_request.
 * Em approval_request, use approveDeepAnalysisAction({jobId,toolUseId,decision}) para liberar/recusar.
 * Resolve com o payload do evento terminal:
 *   { type:'complete', diagnostico, stopReason, toolCalls }        (sucesso)
 *   { ok:false, code, erro }                                       (gate/UK — sem SSE)
 * Rejeita (throw) em erro de rede, HTTP não-ok, ou evento SSE { type:'error', erro }.
 *
 * @param {{ dealId:number, clientUserKey:string, savedTriage?:any, dynatraceLogs?:string }} payload
 * @param {{ onEvent?: (evt:object) => void, signal?: AbortSignal }} [options]
 */
export async function deepAnalysis(payload, { onEvent, signal } = {}) {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API_BASE}/api/funil-tecnico/deep-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  const ct = resp.headers.get('content-type') || '';

  // Respostas não-SSE: gate LGPD desligado, UK inválida, ou validação (400).
  // Todas chegam como JSON — tratamos como terminal, sem tentar ler stream.
  if (!ct.includes('text/event-stream')) {
    let data = null;
    try { data = await resp.json(); } catch { /* corpo vazio/ilegível */ }
    if (!resp.ok) {
      throw new Error(data?.erro || `Falha na análise (HTTP ${resp.status}).`);
    }
    // { ok:false, code:'deep_analysis_disabled' | ... } → devolve para a UI decidir.
    return data ?? { ok: false, erro: 'Resposta inesperada do servidor.' };
  }

  // Caminho SSE (fase habilitada): lê o stream e repassa cada evento.
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
      let evt;
      try { evt = JSON.parse(line.slice(6)); } catch { continue; }

      if (evt.type === 'complete') return evt;
      // O endpoint do funil emite a mensagem de erro na chave `erro` (não `message`).
      if (evt.type === 'error') throw new Error(evt.erro || 'Falha na análise com IA.');
      // start | progress | tool_call | tool_result → repassa para a UI.
      onEvent?.(evt);
    }
  }

  throw new Error('Stream encerrou sem evento de conclusão.');
}
