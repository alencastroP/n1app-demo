/**
 * @file lightTheme.js
 * @description Tema light do N1 App. Consumido pelo ThemeProvider do styled-components.
 */

import { lightSemantic, palette } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { containers } from '../tokens/layout';
import { lightShadows } from '../tokens/shadows';
import { breakpoints, media } from '../tokens/breakpoints';
import { zIndex } from '../tokens/zIndex';
import { transitions } from '../tokens/transitions';

export const lightTheme = {
  mode: 'light',
  colors: lightSemantic,
  palette,
  typography,
  spacing,
  radius,
  containers,
  shadows: lightShadows,
  breakpoints,
  media,
  zIndex,
  transitions,
};

export default lightTheme;
