// src/services/userHistoryService.js
//
// Histórico de ações do usuário — fala com /api/user-history no backend
// (persistência na conta de permissões do Ploomes; o front nunca vê a chave).

import { apiFetch } from './http';

/** Retorna o histórico do próprio usuário (array desc, mais novo primeiro). */
export async function getHistory() {
  const data = await apiFetch('/api/user-history');
  return Array.isArray(data?.items) ? data.items : [];
}

/**
 * Retorna o histórico de OUTRO usuário pelo e-mail (array desc).
 * Restrito a Admin (qualquer usuário) e Gestor (só da própria equipe) — o backend
 * autoriza; o front só chama a partir da tela de Gerenciar Usuários.
 */
export async function getHistoryOf(email) {
  const data = await apiFetch(`/api/user-history/of?email=${encodeURIComponent(email)}`);
  return Array.isArray(data?.items) ? data.items : [];
}

/**
 * Registra uma ação: { a, s, d?, r?, id? } — fire-and-forget (backend responde 202).
 * Best-effort: NUNCA lança para o chamador; histórico não pode quebrar a ação principal.
 */
export async function logAction(entry) {
  try {
    await apiFetch('/api/user-history/log', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.warn('[userHistory] falha ao registrar ação:', err?.message || 'erro desconhecido');
  }
}
