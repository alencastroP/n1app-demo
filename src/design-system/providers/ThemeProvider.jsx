/**
 * @file ThemeProvider.jsx
 * @description Provider de tema do N1 App Design System.
 *
 *  - Envolve a árvore com o ThemeProvider do styled-components.
 *  - Aceita `defaultMode`: 'light' | 'dark' | 'system'.
 *  - Quando 'system', segue `prefers-color-scheme` do SO e reage a mudanças.
 *  - Persiste a escolha do usuário em `localStorage` (chave `n1app:theme`).
 *  - Aplica `data-theme="dark|light"` e classe `.dark` no <html>
 *    (compatível com o CSS legado em index.css enquanto a migração rola).
 *  - Atualiza `<meta name="theme-color">` para o background do app.
 *  - Não monta nenhum estilo global — isso fica em <GlobalStyles />.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { getTheme } from '../themes';
import { ThemeContext } from './useTheme';

const STORAGE_KEY = 'n1app:theme';
const VALID_MODES = ['light', 'dark', 'system'];

function readStoredMode() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return VALID_MODES.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

function persistMode(mode) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage indisponível — ignora silenciosamente */
  }
}

function getSystemMode() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyDomTheme(resolvedMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  const isDark = resolvedMode === 'dark';

  root.setAttribute('data-theme', resolvedMode);
  body?.setAttribute('data-theme', resolvedMode);
  root.classList.toggle('dark', isDark);
  body?.classList.toggle('dark', isDark);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#0E071B' : '#FFFFFF');
  }
}

export function ThemeProvider({ defaultMode = 'system', children }) {
  const initialMode = VALID_MODES.includes(defaultMode) ? defaultMode : 'system';
  const [mode, setModeState] = useState(() => readStoredMode() ?? initialMode);
  const [systemMode, setSystemMode] = useState(getSystemMode);

  // Acompanha mudanças do SO quando o modo é 'system'.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemMode(e.matches ? 'dark' : 'light');
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, []);

  const resolvedMode = mode === 'system' ? systemMode : mode;

  // Aplica no DOM e persiste a cada mudança.
  useEffect(() => {
    applyDomTheme(resolvedMode);
  }, [resolvedMode]);

  useEffect(() => {
    persistMode(mode);
  }, [mode]);

  const setMode = useCallback((next) => {
    if (!VALID_MODES.includes(next)) {
      console.warn(`[N1 DS] modo inválido "${next}". Use light | dark | system.`);
      return;
    }
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((curr) => {
      const current = curr === 'system' ? systemMode : curr;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemMode]);

  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      isDark: resolvedMode === 'dark',
      theme,
      setMode,
      toggleMode,
    }),
    [mode, resolvedMode, theme, setMode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
