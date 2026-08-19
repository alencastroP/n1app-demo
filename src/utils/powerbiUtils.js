export const ENTITY_LABEL = {
  1: 'Clientes',
  2: 'Negócios',
  4: 'Vendas',
  7: 'Propostas',
  10: 'Produtos',
  12: 'Tarefas',
  14: 'Produto da Proposta',
  20: 'Produto da Venda',
  24: 'Usuários',
  36: 'Registro de interação',
  66: 'Documentos',
  68: 'Produto do Documento',
  75: 'Produto de Cliente',
};

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return iso;
  }
}

export function statusFrom(errorName) {
  return errorName ? `Erro: ${errorName}` : 'OK';
}

const INTERVAL_UNIT_LABEL = {
  0: 'minuto(s)',
  1: 'hora(s)',
  2: 'dia(s)',
  3: 'semana(s)',
  4: 'mês(es)',
};

export function formatInterval(unit, value) {
  if (unit == null || value == null) return '—';
  const label = INTERVAL_UNIT_LABEL[unit] ?? `unidade ${unit}`;
  return `A cada ${value} ${label}`;
}

export function formatScheduledTime(hour, minutes) {
  if (hour == null) return '—';
  const h = String(hour).padStart(2, '0');
  const m = String(minutes ?? 0).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Aceita link completo (callback/<accountKey>?code=<hash>) OU accountKey pura
 */
export function parsePbiInput(raw) {
  const s = String(raw || '').trim();
  if (!s) return { isLink: false, url: '', accountKey: '', hash: '' };

  try {
    const u = new URL(s);
    const m = u.pathname.match(/\/callback\/([^/]+)/i);
    const accountKey = m ? m[1] : '';
    const hash = u.searchParams.get('code') || '';
    if (accountKey) return { isLink: true, url: s, accountKey, hash };
  } catch { 
    /* não é URL */ 
  }

  return { isLink: false, url: '', accountKey: s, hash: '' };
}

export const buildPbiUrl = (accountKey, escapedHash) =>
  `https://pbi.ploomes.com/powerbi/callback/${encodeURIComponent(accountKey)}?code=${escapedHash}`;