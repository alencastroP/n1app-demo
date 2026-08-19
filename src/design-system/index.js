/**
 * @file design-system/index.js
 * @description Barrel principal do N1 App Design System.
 *
 *  Uso típico:
 *    import {
 *      ThemeProvider, useTheme,
 *      GlobalStyles, PrimeReactOverrides,
 *      lightTheme, darkTheme,
 *    } from '@/design-system';
 *
 *  Tokens crus continuam acessíveis via subpath:
 *    import { palette, spacing } from '@/design-system/tokens';
 */

export * from './tokens';
export { lightTheme, darkTheme, getTheme } from './themes';
export { ThemeProvider } from './providers/ThemeProvider';
export { useTheme, ThemeContext } from './providers/useTheme';
export { GlobalStyles } from './global/GlobalStyles';
export { CssVarsBridge } from './global/CssVarsBridge';
export { PrimeReactOverrides } from './global/PrimeReactOverrides';
export * from './components';
