// src/components/intercom-dashboard/dashboardWidgets.js
//
// Catálogo dos widgets do Dashboard Intercom (fonte única para o painel de
// personalização, para o gating enviado ao backend e para a ordenação).
//
// - METRIC_WIDGETS: cards da grade superior (toggle apenas; ordem fixa na grade).
// - BLOCK_WIDGETS: blocos maiores (toggle + mover ↑/↓).
// Os ids batem com as chaves que o backend usa em widgetFlags().

export const METRIC_WIDGETS = [
  { id: 'volume', label: 'Volume', icon: 'pi-comments' },
  { id: 'csat', label: 'CSAT', icon: 'pi-star' },
  { id: 'ct', label: 'CT médio', icon: 'pi-clock' },
  { id: 'tmr', label: '1ª resposta', icon: 'pi-reply' },
  { id: 'sla', label: 'SLA', icon: 'pi-shield' },
  { id: 'states', label: 'Abertas / Fechadas', icon: 'pi-inbox' },
];

export const BLOCK_WIDGETS = [
  { id: 'trend', label: 'Tendência mensal' },
  { id: 'channel', label: 'Distribuição por canal' },
  { id: 'tags', label: 'Distribuição por tag' },
  { id: 'demand', label: 'Ranking por tipo de demanda' },
  { id: 'byTeam', label: 'Tabela por equipe' },
  { id: 'byAgent', label: 'Tabela por agente' },
];

// Métricas que aparecem como coluna nas tabelas por equipe/agente.
export const METRIC_COLUMNS = ['csat', 'ct', 'tmr', 'sla'];

// Preset padrão = layout atual (antes da Fase 3): métricas clássicas + trend +
// tabelas; widgets novos desligados.
export const DEFAULT_CONFIG = {
  enabled: {
    volume: true, csat: true, ct: true, sla: true, tmr: false, states: false,
    trend: true, channel: false, tags: false, demand: false, byTeam: true, byAgent: true,
  },
  order: ['trend', 'channel', 'tags', 'demand', 'byTeam', 'byAgent'],
};

// Kit sugerido na Fase 2 (o gestor pode aplicar com um clique).
export const RECOMMENDED_CONFIG = {
  enabled: {
    volume: true, csat: true, ct: true, sla: true, tmr: true, states: true,
    trend: true, channel: true, tags: true, demand: true, byTeam: true, byAgent: true,
  },
  order: ['trend', 'channel', 'tags', 'demand', 'byTeam', 'byAgent'],
};

const ALL_IDS = [...METRIC_WIDGETS, ...BLOCK_WIDGETS].map((w) => w.id);
const BLOCK_IDS = BLOCK_WIDGETS.map((w) => w.id);

// Normaliza uma config vinda de fora (preset salvo, versão antiga) para o shape
// atual: garante todas as chaves em `enabled` e uma `order` completa e válida.
export function normalizeConfig(config) {
  const base = config && typeof config === 'object' ? config : {};
  const enabled = {};
  for (const id of ALL_IDS) {
    enabled[id] = typeof base.enabled?.[id] === 'boolean' ? base.enabled[id] : DEFAULT_CONFIG.enabled[id];
  }
  const seen = new Set();
  const order = Array.isArray(base.order) ? base.order.filter((id) => BLOCK_IDS.includes(id) && !seen.has(id) && seen.add(id)) : [];
  for (const id of BLOCK_IDS) if (!order.includes(id)) order.push(id); // blocos ausentes vão para o fim
  return { enabled, order };
}

// Lista de widgets habilitados (ids) para enviar ao backend como gating.
export function enabledWidgetIds(config) {
  const c = normalizeConfig(config);
  return ALL_IDS.filter((id) => c.enabled[id]);
}
