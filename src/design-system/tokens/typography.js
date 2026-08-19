/**
 * @file typography.js
 * @description Tokens tipográficos do N1 App Design System.
 *
 * Default body = 14px (app denso de Suporte/Ops, não SaaS público).
 * Manrope é a fonte oficial do N1 App (Montserrat como fallback histórico).
 */

export const fonts = {
  sans:
    "'Manrope', 'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, " +
    "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono:
    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, " +
    "Menlo, Monaco, Consolas, 'Courier New', monospace",
};

/** Escala canônica (8 níveis). Base = 14px para densidade. */
export const sizes = {
  xs:    '0.75rem',   // 12px — caption, tag
  sm:    '0.8125rem', // 13px — helper text
  base:  '0.875rem',  // 14px — body default
  md:    '0.9375rem', // 15px — body confortável
  lg:    '1rem',      // 16px — section subtitle
  xl:    '1.125rem',  // 18px — h3
  '2xl': '1.25rem',   // 20px — h2
  '3xl': '1.5rem',    // 24px — h1
  '4xl': '1.875rem',  // 30px — page title
  '5xl': '2.25rem',   // 36px — hero
};

export const weights = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
};

export const lineHeights = {
  tight:   1.2,
  snug:    1.35,
  normal:  1.5,
  relaxed: 1.6,
  loose:   1.75,
};

export const letterSpacings = {
  tight:  '-0.01em',
  normal: '0',
  wide:   '0.025em',
  wider:  '0.05em',
};

/**
 * Variants pré-compostas (size + weight + line-height + letter-spacing).
 * Use no styled-components: `${({ theme }) => theme.typography.variants.h1}`.
 */
export const variants = {
  h1: {
    fontSize: sizes['4xl'],
    fontWeight: weights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  h2: {
    fontSize: sizes['3xl'],
    fontWeight: weights.bold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontSize: sizes['2xl'],
    fontWeight: weights.semibold,
    lineHeight: lineHeights.snug,
  },
  h4: {
    fontSize: sizes.xl,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.snug,
  },
  body: {
    fontSize: sizes.base,
    fontWeight: weights.regular,
    lineHeight: lineHeights.normal,
  },
  bodyStrong: {
    fontSize: sizes.base,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.normal,
  },
  small: {
    fontSize: sizes.sm,
    fontWeight: weights.regular,
    lineHeight: lineHeights.normal,
  },
  caption: {
    fontSize: sizes.xs,
    fontWeight: weights.medium,
    lineHeight: lineHeights.snug,
  },
  label: {
    fontSize: sizes.sm,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.snug,
  },
  overline: {
    fontSize: sizes.xs,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.wider,
    textTransform: 'uppercase',
  },
  code: {
    fontFamily: fonts.mono,
    fontSize: sizes.sm,
    fontWeight: weights.regular,
    lineHeight: lineHeights.snug,
  },
};

export const typography = {
  fonts,
  sizes,
  weights,
  lineHeights,
  letterSpacings,
  variants,
};

export default typography;
