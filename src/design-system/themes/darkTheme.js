/**
 * @file darkTheme.js
 * @description Tema dark do N1 App. Consumido pelo ThemeProvider do styled-components.
 */

import { darkSemantic, palette } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { containers } from '../tokens/layout';
import { darkShadows } from '../tokens/shadows';
import { breakpoints, media } from '../tokens/breakpoints';
import { zIndex } from '../tokens/zIndex';
import { transitions } from '../tokens/transitions';

export const darkTheme = {
  mode: 'dark',
  colors: darkSemantic,
  palette,
  typography,
  spacing,
  radius,
  containers,
  shadows: darkShadows,
  breakpoints,
  media,
  zIndex,
  transitions,
};

export default darkTheme;
