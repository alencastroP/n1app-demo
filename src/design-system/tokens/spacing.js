/**
 * @file spacing.js
 * @description Escala 4px do N1 App Design System.
 *
 * Use os aliases (xs..4xl) sempre que possível.
 * Acesse degraus intermediários via `spacing.scale[N]` (N * 4px).
 */

const scale = {
  0:  '0',
  1:  '0.25rem', // 4px
  2:  '0.5rem',  // 8px
  3:  '0.75rem', // 12px
  4:  '1rem',    // 16px
  5:  '1.25rem', // 20px
  6:  '1.5rem',  // 24px
  7:  '1.75rem', // 28px
  8:  '2rem',    // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  14: '3.5rem',  // 56px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

export const spacing = {
  none: scale[0],
  xs:   scale[1],
  sm:   scale[2],
  md:   scale[3],
  lg:   scale[4],
  xl:   scale[6],
  '2xl': scale[8],
  '3xl': scale[12],
  '4xl': scale[16],
  scale,
};

export default spacing;
