// services/accountSessionStorage.js
// Storage da "conta ativa" (sessionStorage, por aba) — módulo puro, sem React.
// Existe separado do AccountSessionContext para que código fora da árvore
// React (http.js, guards de rota, logout) limpe a sessão sem importar o
// Provider — services permanecem agnósticos de React.

export const CONTA_ATIVA_STORAGE_KEY = 'n1app.contaAtiva';

// Evento interno: avisa o AccountSessionProvider quando o storage é limpo por
// código fora do React (logout, 401, RotaProtegida), para o estado em memória
// não sobreviver ao fim da sessão do app na mesma aba.
export const CONTA_ATIVA_CLEARED_EVENT = 'n1app:conta-ativa-cleared';

/** Limpa o storage da conta ativa e notifica o provider (se montado). */
export function clearContaAtivaStorage() {
  try { sessionStorage.removeItem(CONTA_ATIVA_STORAGE_KEY); } catch { /* storage indisponível */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONTA_ATIVA_CLEARED_EVENT));
  }
}
