// demo/src/mock/install.js
//
// Interceptador de rede da demo. Substitui `window.fetch` ANTES de qualquer
// módulo do app carregar (é o primeiro import do main.jsx), então todo o
// código original — services do backend, chamadas diretas ao Ploomes,
// downloads — passa por aqui sem nenhuma alteração nos arquivos do app.
//
// Consequência: a réplica NUNCA toca em API oficial. Se alguma rota escapar do
// mapeamento, o interceptor devolve um payload vazio plausível e loga um aviso
// no console — jamais deixa a requisição sair para a rede.

import { json, delay, latency } from './http';
import { rotasBackend } from './routes/backend';
import { rotasPloomes } from './routes/ploomes';

const fetchOriginal = typeof window !== 'undefined' ? window.fetch?.bind(window) : null;

/** Normaliza o 1º argumento do fetch (string | URL | Request) para URL absoluta. */
function resolverUrl(input) {
  const bruto = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input?.url ?? String(input);
  try {
    return new URL(bruto, window.location.origin);
  } catch {
    return new URL('/desconhecido', window.location.origin);
  }
}

/** Tenta parsear o corpo enviado como JSON (ignora FormData/blob/silencioso). */
async function lerCorpo(input, init) {
  const corpo = init?.body ?? (input instanceof Request ? await input.clone().text().catch(() => null) : null);
  if (corpo == null) return null;
  if (typeof FormData !== 'undefined' && corpo instanceof FormData) {
    return { __formData: true, campos: [...corpo.keys()] };
  }
  if (typeof corpo !== 'string') return null;
  try {
    return JSON.parse(corpo);
  } catch {
    return corpo;
  }
}

/** Rotas /api/* — casam pelo pathname, independente do host (API_BASE ou relativo). */
function acharRotaBackend(url, method) {
  return rotasBackend.find((r) => {
    if (r.metodo && r.metodo !== method) return false;
    return r.pattern.test(url.pathname);
  });
}

/** Serviços externos — casam pelo host. */
function acharRotaExterna(url) {
  return rotasPloomes.find((r) => r.host.test(url.hostname));
}

/** Resposta genérica para rotas ainda não mapeadas: nunca vaza para a rede. */
function respostaFallback(url) {
  console.warn(
    `[demo] Rota não mapeada — devolvendo payload vazio: ${url.pathname}${url.search}\n` +
    '        Adicione um handler em src/mock/routes/ para enriquecer esta tela.',
  );
  return json({
    ok: true,
    demo: true,
    aviso: 'Rota não mapeada na demonstração. Nenhuma API foi consultada.',
    value: [],
    items: [],
    data: [],
    total: 0,
  });
}

let instalado = false;

export function installMockNetwork() {
  if (instalado || typeof window === 'undefined') return;
  instalado = true;

  window.fetch = async function fetchMock(input, init = {}) {
    const url = resolverUrl(input);
    const method = String(init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);

    // Assets locais (Vite, imagens, .md via ?raw) seguem pelo fetch real.
    const mesmaOrigem = url.origin === window.location.origin;
    const ehApi = url.pathname.startsWith('/api/');
    if (mesmaOrigem && !ehApi) {
      return fetchOriginal(input, init);
    }

    const body = await lerCorpo(input, init);
    const contexto = { url, method, body, headers: init?.headers ?? {}, signal };

    // Latência simulada — a UI mostra os estados de carregamento de verdade.
    await delay(latency(), signal);

    try {
      const rotaApi = ehApi ? acharRotaBackend(url, method) : null;
      if (rotaApi) return await rotaApi.handler(contexto);

      const rotaExterna = acharRotaExterna(url);
      if (rotaExterna) return await rotaExterna.handler(contexto);

      return respostaFallback(url);
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      console.error('[demo] Erro ao montar resposta simulada:', err);
      return json({ erro: `Falha na simulação: ${err.message}` }, { status: 500 });
    }
  };

  // XHR e EventSource também são neutralizados: nada de rede na demo.
  if (typeof window.EventSource === 'function') {
    class EventSourceDemo extends EventTarget {
      constructor() {
        super();
        this.readyState = 0;
        console.warn('[demo] EventSource desativado no modo demonstração.');
      }

      close() {
        this.readyState = 2;
      }
    }
    window.EventSource = EventSourceDemo;
  }

  console.info(
    '%c N1 App · modo demonstração ',
    'background:#7443f6;color:#fff;font-weight:600;border-radius:4px;padding:2px 6px',
    '\nToda a rede está interceptada — nenhuma API oficial é consultada.',
  );
}
