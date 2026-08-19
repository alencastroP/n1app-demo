/**
 * @file shadows.js
 * @description Escala de elevação (5 níveis) com variantes light + dark.
 *
 *   1 — subtle    : hover sutil em inputs, micro chips
 *   2 — soft      : cards pequenos, badges elevados
 *   3 — standard  : cards padrão, dropdowns
 *   4 — strong    : modais, popovers
 *   5 — overlay   : dialogs full-screen, overlays
 *
 *  focus — anel de foco visível (consumido como box-shadow extra)
 */

export const lightShadows = {
  none: 'none',
  1: '0 1px 2px rgba(14, 7, 27, 0.05)',
  2: '0 2px 4px rgba(14, 7, 27, 0.08)',
  3: '0 4px 12px rgba(14, 7, 27, 0.12)',
  4: '0 8px 20px rgba(14, 7, 27, 0.16)',
  5: '0 16px 32px rgba(14, 7, 27, 0.22)',
  focus: '0 0 0 2px rgba(116, 67, 246, 0.25)',
  focusDanger: '0 0 0 2px rgba(239, 68, 68, 0.30)',
  focusSuccess: '0 0 0 2px rgba(34, 197, 94, 0.30)',
};

export const darkShadows = {
  none: 'none',
  1: '0 1px 2px rgba(0, 0, 0, 0.30)',
  2: '0 2px 8px rgba(0, 0, 0, 0.40)',
  3: '0 4px 12px rgba(0, 0, 0, 0.50)',
  4: '0 8px 24px rgba(0, 0, 0, 0.55)',
  5: '0 16px 32px rgba(0, 0, 0, 0.65)',
  focus: '0 0 0 2px rgba(171, 130, 255, 0.40)',
  focusDanger: '0 0 0 2px rgba(239, 68, 68, 0.40)',
  focusSuccess: '0 0 0 2px rgba(34, 197, 94, 0.40)',
};

/** Retorna a escala de shadows para o modo dado. */
export function createShadows(mode = 'light') {
  return mode === 'dark' ? darkShadows : lightShadows;
}

export default { lightShadows, darkShadows, createShadows };
