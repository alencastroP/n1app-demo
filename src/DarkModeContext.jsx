/**
 * DarkModeContext — fachada de compatibilidade do Design System.
 *
 *  ⚠️ Este arquivo NÃO mantém estado próprio mais.
 *
 *  Ele continua exportando `<DarkModeProvider>` e `useDarkMode()` com o
 *  mesmo contrato público de antes, mas por baixo dos panos delega tudo
 *  para o <ThemeProvider> do Design System (`@/design-system`).
 *
 *  Vantagem: os ~60 componentes legados que importam `useDarkMode()`
 *  continuam funcionando sem mudança, mas existe apenas UMA fonte de
 *  verdade — o ThemeProvider do DS — então cada toggle gera um único
 *  ciclo de re-render em vez de dois.
 *
 *  Pré-requisito: `<DarkModeProvider>` precisa estar montado DENTRO do
 *  `<ThemeProvider>` do DS (é o que `App.jsx` faz).
 *
 *  Este arquivo deve ser deletado quando todos os consumidores forem
 *  migrados para `useTheme()` direto do DS (item 22 do migration guide).
 */

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useTheme } from './design-system/providers/useTheme';

const DarkModeContext = createContext(null);

export function DarkModeProvider({ children }) {
  const { isDark, setMode } = useTheme();

  const setDarkMode = useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(isDark) : Boolean(updater);
      setMode(next ? 'dark' : 'light');
    },
    [isDark, setMode]
  );

  const value = useMemo(
    () => ({ darkMode: isDark, setDarkMode }),
    [isDark, setDarkMode]
  );

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext);
  if (!ctx) {
    throw new Error(
      'useDarkMode() chamado fora de <DarkModeProvider>. ' +
      'Garanta que App.jsx envolveu a árvore com <DarkModeProvider> ' +
      '(que por sua vez precisa estar dentro do <ThemeProvider> do DS).'
    );
  }
  return ctx;
}
