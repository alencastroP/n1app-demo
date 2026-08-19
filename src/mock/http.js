// demo/src/mock/http.js
//
// Helpers para fabricar objetos `Response` nativos — o app inteiro consome
// `fetch` normalmente (resp.ok / .json() / .blob() / .headers.get() /
// .body.getReader()), então tudo aqui devolve Response de verdade.

/** Espera `ms`, respeitando AbortSignal (usado por telas com botão cancelar). */
export function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = setTimeout(() => {
      signal?.removeEventListener?.('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    signal?.addEventListener?.('abort', onAbort, { once: true });
  });
}

/** Latência simulada — dá a sensação de rede sem travar a navegação. */
export function latency(min = 180, max = 520) {
  return min + Math.floor(Math.random() * (max - min));
}

export function json(data, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function text(body, { status = 200, headers = {} } = {}) {
  return new Response(String(body), {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers },
  });
}

export function erro(mensagem, status = 400, extra = {}) {
  return json({ erro: mensagem, ...extra }, { status });
}

export function blob(data, filename, contentType = 'application/octet-stream', extraHeaders = {}) {
  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...extraHeaders,
    },
  });
}

/**
 * Stream SSE (`data: {...}\n\n`) emitido em etapas, com pausa entre elas.
 * É o formato consumido por apiHubService, intercomDashboardService,
 * intercomService (churn), auditoriaIAService e funilTecnicoService.
 *
 * @param {Array<object|(() => object)>} eventos
 * @param {{ step?: number, headers?: object }} opts
 */
export function sse(eventos, { step = 260, headers = {} } = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const item of eventos) {
        const payload = typeof item === 'function' ? item() : item;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        await new Promise((r) => setTimeout(r, step));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      ...headers,
    },
  });
}

/** Igual ao `sse`, mas com linhas NDJSON cruas (sem o prefixo `data: `). */
export function ndjson(linhas, { step = 260 } = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const item of linhas) {
        const payload = typeof item === 'function' ? item() : item;
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        await new Promise((r) => setTimeout(r, step));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
