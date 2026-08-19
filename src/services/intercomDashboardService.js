// src/services/intercomDashboardService.js
import { apiFetchJson, apiFetchRaw } from './http';

/**
 * Exporta o relatório já gerado em XLSX. O backend só formata o payload (não
 * rebate no Intercom), então a planilha reflete exatamente os números da tela.
 * Segue o padrão de export do app: apiFetchRaw + blob + link de download.
 * @param {object} report  payload do evento 'complete'
 */
export async function exportReport(report) {
  const resp = await apiFetchRaw('/api/intercom/dashboard/export', {
    method: 'POST',
    body: JSON.stringify({ report }),
  });
  if (!resp) return; // 401 já redirecionado pelo handleError
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashboard_intercom_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Busca as opções de filtro (equipes e agentes) para o dashboard.
 * @returns {Promise<{ teams: {id:number, name:string}[], agents: {id:string, name:string}[] }>}
 */
export async function getOptions() {
  return apiFetchJson('/api/intercom/dashboard/options');
}

/**
 * Gera o relatório via SSE (POST com stream).
 * Resolve com o objeto do evento 'complete'. Rejeita com Error em falha.
 * Resolve com undefined apenas no 401 (handleError já redirecionou).
 *
 * @param {{ periodStart:number, periodEnd:number, teamIds:number[], agentIds?:string[], excludeChamadosFup?:boolean }} payload
 * @param {{ onProgress?: (data: object) => void, signal?: AbortSignal }} options
 */
export async function runReport(payload, { onProgress, signal } = {}) {
  // apiFetchRaw injeta base + token + Content-Type e trata !resp.ok (401/403)
  // via handleError, devolvendo o Response cru (body intacto) para o SSE.
  const resp = await apiFetchRaw('/api/intercom/dashboard/report', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
  // Em 401 o handleError redireciona e retorna undefined — encerra silenciosamente.
  if (!resp) return;

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Processa uma linha do stream. Retorna o evento 'complete' quando chegar;
  // lança em evento 'error'; undefined nos demais casos.
  const handleLine = (line) => {
    if (!line.startsWith('data: ')) return undefined;
    let data;
    try {
      data = JSON.parse(line.slice(6));
    } catch {
      return undefined;
    }

    if (data.type === 'complete') return data;
    if (data.type === 'error') throw new Error(data.erro || data.message || 'Erro no processamento.');
    if (data.type === 'start' || data.type === 'progress') {
      onProgress?.(data);
    }
    return undefined;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const completed = handleLine(line);
      if (completed) return completed;
    }
  }

  // Flush final: um caractere multibyte pendente no decoder e/ou uma última
  // linha entregue sem '\n' (proxy pode não repassar o LF final) ficariam
  // presos no buffer — sem isso o evento 'complete' seria perdido.
  buffer += decoder.decode();
  for (const line of buffer.split('\n')) {
    const completed = handleLine(line);
    if (completed) return completed;
  }

  throw new Error('Stream encerrou sem evento de conclusão.');
}
