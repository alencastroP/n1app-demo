// src/services/globalToast.js
//
// Pequeno bus de eventos para disparar Toasts de qualquer lugar do app,
// inclusive de código fora da árvore React (ex.: http.js).
//
// O componente <GlobalToast /> escuta o evento e renderiza o Toast.

const EVENT_NAME = 'n1app:global-toast';

/**
 * Dispara um Toast global.
 * @param {Object} options
 * @param {'info'|'success'|'warn'|'error'} [options.severity='info']
 * @param {string} [options.summary]
 * @param {string} options.detail
 * @param {number} [options.life=4000]
 */
export function showToast({ severity = 'info', summary, detail, life = 4000 } = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: { severity, summary, detail, life },
    })
  );
}

export function showPermissionToast(message, summary = 'Acesso negado') {
  showToast({
    severity: 'warn',
    summary,
    detail: message || 'Você não tem permissão para acessar este recurso.',
    life: 5000,
  });
}

export const GLOBAL_TOAST_EVENT = EVENT_NAME;
