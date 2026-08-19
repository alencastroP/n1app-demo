// src/context/AccountSessionContext.jsx
// Sessão global de "conta ativa" (User-Key validada), por aba.
//
// Segurança (decisões deliberadas — não alterar sem revisar o fluxo):
//  - Persistência APENAS em memória + sessionStorage (morre com a aba).
//    NUNCA localStorage.
//  - Sem TTL: a conta ativa dura enquanto durar a sessão do app. É limpa
//    SEMPRE no logout E no login (clearContaAtivaStorage) — quem reloga
//    precisa reinserir a UK.
//  - A UK nunca é logada, exibida ou incluída em mensagens de erro.
//  - Os formulários sempre exigem confirmação explícita do usuário antes de
//    usar a conta ativa (pré-preenchimento com chip Confirmar/Trocar).

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  CONTA_ATIVA_STORAGE_KEY,
  CONTA_ATIVA_CLEARED_EVENT,
} from '../services/accountSessionStorage';

function readStoredConta() {
  try {
    const raw = sessionStorage.getItem(CONTA_ATIVA_STORAGE_KEY);
    if (!raw) return null;
    const conta = JSON.parse(raw);
    if (!conta?.uk || !conta?.accountId) return null;
    return conta;
  } catch {
    return null;
  }
}

function writeStoredConta(conta) {
  try {
    if (conta) sessionStorage.setItem(CONTA_ATIVA_STORAGE_KEY, JSON.stringify(conta));
    else sessionStorage.removeItem(CONTA_ATIVA_STORAGE_KEY);
  } catch { /* storage indisponível */ }
}

const AccountSessionContext = createContext(null);

export function AccountSessionProvider({ children }) {
  const [conta, setConta] = useState(() => readStoredConta());

  // Espelho em ref para callbacks estáveis não recriarem closure a cada uso.
  const contaRef = useRef(conta);
  contaRef.current = conta;

  /**
   * Ativa uma conta já validada (dados vindos de accountSessionService.validateAccount).
   * @param {{ uk: string, accountId: number, accountName: string, logoUrl?: string|null }} dados
   */
  const ativarConta = useCallback(({ uk, accountId, accountName, logoUrl = null }) => {
    const nova = { uk, accountId, accountName, logoUrl, validatedAt: Date.now() };
    writeStoredConta(nova);
    setConta(nova);
  }, []);

  /** Encerra a sessão da conta ativa (estado + sessionStorage). */
  const encerrarConta = useCallback(() => {
    writeStoredConta(null);
    setConta(null);
  }, []);

  /** Retorna a conta ativa corrente (ou null). Mantido como função para os
   *  consumidores lerem o valor mais recente dentro de handlers. */
  const usarContaAtiva = useCallback(() => contaRef.current, []);

  // Sincroniza o estado em memória quando o storage é limpo fora do React
  // (logout do Layout, login, 401 do http.js, RotaProtegida): sem isso, a
  // conta sobreviveria em memória a um logout sem reload da página.
  useEffect(() => {
    const onCleared = () => setConta(null);
    window.addEventListener(CONTA_ATIVA_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(CONTA_ATIVA_CLEARED_EVENT, onCleared);
  }, []);

  return (
    <AccountSessionContext.Provider value={{ conta, ativarConta, encerrarConta, usarContaAtiva }}>
      {children}
    </AccountSessionContext.Provider>
  );
}

export function useAccountSession() {
  const ctx = useContext(AccountSessionContext);
  if (!ctx) throw new Error('useAccountSession must be used inside AccountSessionProvider');
  return ctx;
}
