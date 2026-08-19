/**
 * @file useTheme.js
 * @description Hook + Context do ThemeProvider do DS.
 *
 *   useTheme() retorna:
 *     mode          : 'light' | 'dark' | 'system' (escolha do usuário, persistida)
 *     resolvedMode  : 'light' | 'dark' (resolvido depois do prefers-color-scheme)
 *     theme         : objeto do styled-components ThemeProvider
 *     setMode(mode) : altera e persiste
 *     toggleMode()  : alterna entre light/dark (ignora 'system')
 *     isDark        : atalho boolean
 */

import { createContext, useContext } from 'react';

export const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      '[N1 DS] useTheme() chamado fora de <ThemeProvider>. ' +
      'Envolva sua app com <ThemeProvider> de "@/design-system".'
    );
  }
  return ctx;
}

export default useTheme;
