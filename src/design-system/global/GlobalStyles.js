/**
 * @file GlobalStyles.js
 * @description Reset MÍNIMO do N1 App Design System.
 *
 *  Esta versão é deliberadamente conservadora — ela só aplica regras
 *  que NÃO mudam layout de páginas legadas. Especificamente, NÃO faz:
 *
 *    - body { font-size }          (manteria 16px default — quebraria todas
 *                                   as páginas legadas que usam `rem` calculados
 *                                   sobre essa base)
 *    - body { background, color }  (deixa cada página decidir; a tela de Login,
 *                                   por exemplo, pinta o body com gradient próprio)
 *    - h1, h2, h3, p { margin: 0 } (quebraria espaçamento de páginas que dependem
 *                                   das margens default do browser)
 *    - a { color, text-decoration } (mudaria a aparência de links existentes)
 *
 *  O que ficou:
 *    - box-sizing: border-box (já era o que `PrimeGlobalStyle.jsx` aplicava)
 *    - html/body margin/padding zerados + min-height 100vh
 *    - scrollbar custom (cosmético, tema-aware)
 *    - :focus-visible ring (acessibilidade, não muda layout estático)
 *    - ::selection cor de marca (cosmético)
 *    - prefers-reduced-motion (acessibilidade)
 *
 *  Componentes do Design System têm seus PRÓPRIOS `font-family`, `font-size`,
 *  `color` e `background` — não dependem deste arquivo para parecer corretos.
 *  Por isso o reset não precisa ser agressivo.
 *
 *  Quando todas as páginas legadas forem migradas para o DS (item 21+ do
 *  guia de migração), você pode optar por uma versão mais opinativa deste
 *  arquivo — mas isso não é necessário enquanto a transição rola.
 */

import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  /* Focus ring acessível (apenas teclado). */
  :focus { outline: none; }
  :focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focus};
    border-radius: ${({ theme }) => theme.radius.sm};
  }

  /* Seleção de texto na cor de marca. */
  ::selection {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text.brand};
  }

  /* Scrollbar — WebKit. */
  *::-webkit-scrollbar { width: 8px; height: 8px; }
  *::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.scrollbar.track};
  }
  *::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.scrollbar.thumb};
    border-radius: ${({ theme }) => theme.radius.sm};
  }
  *::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.scrollbar.thumbHover};
  }

  /* Scrollbar — Firefox. */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) =>
      `${theme.colors.scrollbar.thumb} ${theme.colors.scrollbar.track}`};
  }

  /* Respeita preferência do usuário por menos animação. */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyles;
