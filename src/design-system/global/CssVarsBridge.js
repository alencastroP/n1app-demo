/**
 * @file CssVarsBridge.js
 * @description Injeta CSS vars no `:root` — inofensivo para qualquer página.
 *
 *  Este arquivo NÃO altera aparência de elementos existentes. Ele só
 *  declara variáveis CSS que outros estilos podem consumir via `var(--x)`.
 *  Páginas que não usam essas vars não são afetadas em nada.
 *
 *  Inclui três grupos:
 *   1. Vars do tema PrimeReact (`--primary-color`, `--surface-*`, etc.) —
 *      o tema `bootstrap4-light-purple` consome estas internamente, então
 *      mapeá-las para os tokens do DS faz o PrimeReact "vestir" a marca
 *      Ploomes sem precisar trocar o CSS link dinamicamente.
 *   2. Vars legadas (`--accent`, `--bg-body`, `--surface`, etc.) — código
 *      pré-DS em ~8 arquivos consome estas via `var(--accent)`. Mantidas
 *      aqui para preservar compatibilidade durante a migração.
 *   3. Aliases `--n1-*` — atalhos para tokens do DS em CSS puro (fora
 *      de styled-components).
 *
 *  Para uso em produção (montado em `App.jsx`), use ESTE arquivo. Para
 *  estilizar componentes PrimeReact "crus" com a identidade Ploomes
 *  (Storybook ou páginas totalmente migradas), use também o
 *  `PrimeReactOverrides` — mas esteja ciente de que ele sobrescreve
 *  `.p-button`, `.p-inputtext`, etc. globalmente e pode mudar a aparência
 *  de páginas legadas.
 */

import { createGlobalStyle } from 'styled-components';

export const CssVarsBridge = createGlobalStyle`
  :root {
    /* ---- Tema PrimeReact (consumidas pelo bootstrap4-light-purple) ---- */
    --primary-color:        ${({ theme }) => theme.colors.primary};
    --primary-color-text:   ${({ theme }) => theme.colors.onPrimary};
    --text-color:           ${({ theme }) => theme.colors.text.primary};
    --text-color-secondary: ${({ theme }) => theme.colors.text.secondary};

    --surface-0:   ${({ theme }) => theme.colors.bg.surface};
    --surface-50:  ${({ theme }) => theme.colors.bg.surface};
    --surface-100: ${({ theme }) => theme.colors.bg.app};
    --surface-200: ${({ theme }) => theme.colors.bg.sunken};
    --surface-300: ${({ theme }) => theme.colors.border.default};
    --surface-400: ${({ theme }) => theme.colors.border.strong};
    --surface-500: ${({ theme }) => theme.colors.text.muted};
    --surface-600: ${({ theme }) => theme.colors.text.secondary};
    --surface-700: ${({ theme }) => theme.colors.text.primary};
    --surface-800: ${({ theme }) => theme.colors.text.brand};
    --surface-900: ${({ theme }) => theme.colors.text.brand};

    --surface-ground:  ${({ theme }) => theme.colors.bg.app};
    --surface-section: ${({ theme }) => theme.colors.bg.surface};
    --surface-card:    ${({ theme }) => theme.colors.bg.surface};
    --surface-overlay: ${({ theme }) => theme.colors.bg.elevated};
    --surface-border:  ${({ theme }) => theme.colors.border.default};
    --surface-hover:   ${({ theme }) => theme.colors.bg.sunken};

    --content-padding: ${({ theme }) => theme.spacing.lg};
    --inline-spacing:  ${({ theme }) => theme.spacing.sm};
    --border-radius:   ${({ theme }) => theme.radius.md};
    --focus-ring:      ${({ theme }) => theme.shadows.focus};
    --maskbg:          ${({ theme }) => theme.colors.bg.overlay};
    --highlight-bg:    ${({ theme }) => theme.colors.primarySoft};
    --highlight-text-color: ${({ theme }) => theme.colors.text.brand};

    /* ---- Atalhos --n1-* (acessíveis em CSS puro, fora do styled) ---- */
    --n1-primary:     ${({ theme }) => theme.colors.primary};
    --n1-bg-app:      ${({ theme }) => theme.colors.bg.app};
    --n1-bg-surface:  ${({ theme }) => theme.colors.bg.surface};
    --n1-bg-elevated: ${({ theme }) => theme.colors.bg.elevated};
    --n1-text:        ${({ theme }) => theme.colors.text.primary};
    --n1-text-muted:  ${({ theme }) => theme.colors.text.muted};
    --n1-border:      ${({ theme }) => theme.colors.border.default};
    --n1-radius-md:   ${({ theme }) => theme.radius.md};
    --n1-shadow-3:    ${({ theme }) => theme.shadows[3]};

    /* ---- Aliases legados — mantem var(--accent) funcionando ----
     * Estes vars eram declarados pelo antigo PrimeGlobalStyle.jsx.
     * Mantidos aqui enquanto ha codigo legado (ApiHelper, FieldExplorer,
     * EntityMerge, PloomesAutomacoes, ReadyActionsModal, BulkRequestStepper,
     * SankhyaService) que consome var(--accent) e similares.
     * Remova quando o grep nao retornar mais matches.
     * ----------------------------------------------------------- */
    --accent:                ${({ theme }) => theme.colors.primary};
    --accent-soft:           ${({ theme }) => theme.colors.primaryFocus};
    --accent-soft-strong:    ${({ theme }) => theme.colors.primarySoft};
    --bg-body:               ${({ theme }) => theme.colors.bg.app};
    --surface:               ${({ theme }) => theme.colors.bg.surface};
    --surface-alt:           ${({ theme }) => theme.colors.bg.sunken};
    --text-muted:            ${({ theme }) => theme.colors.text.muted};
    --scrollbar-track:       ${({ theme }) => theme.colors.scrollbar.track};
    --scrollbar-thumb:       ${({ theme }) => theme.colors.scrollbar.thumb};
    --scrollbar-thumb-hover: ${({ theme }) => theme.colors.scrollbar.thumbHover};
  }
`;

export default CssVarsBridge;
