/**
 * @file themes/index.js
 * @description Barrel + helper para escolha de tema.
 */

import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';

/** Retorna o tema correspondente ao modo dado. */
export function getTheme(mode = 'light') {
  return mode === 'dark' ? darkTheme : lightTheme;
}

export { lightTheme, darkTheme };
export default { lightTheme, darkTheme, getTheme };
