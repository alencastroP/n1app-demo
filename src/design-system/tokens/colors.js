/**
 * @file colors.js
 * @description Tokens de cor do N1 App Design System.
 *
 * Estrutura:
 *  - palette        : escalas cruas (purple 50..950, neutralLight/neutralDark, status)
 *  - lightSemantic  : tokens semânticos para tema light
 *  - darkSemantic   : tokens semânticos para tema dark
 *  - createColors(mode) : retorna o objeto semântico do modo solicitado
 *
 * Paleta primária Ploomes (canônica):
 *   #7443F6 (brand)  #1E0C45 (brand dark)  #EBE5FF (brand light)
 * Secundárias Ploomes:
 *   #DBD4FF #C7B0FF #AB82FF #8529FF #7814EB #610FC7 #5212A1 #330870
 */

export const palette = {
  /** Escala oficial Ploomes (50..950). Brand = 500. */
  purple: {
    50:  '#F8F4FF',
    100: '#EBE5FF',
    200: '#DBD4FF',
    300: '#C7B0FF',
    400: '#AB82FF',
    500: '#7443F6',
    600: '#7814EB',
    700: '#610FC7',
    800: '#5212A1',
    900: '#330870',
    950: '#1E0C45',
  },

  /** Acento Ploomes fora da escala 50..950 (usar com parcimônia). */
  purpleAccent: '#8529FF',

  /** Neutros para tema light. Valores 500..900 são gray Tailwind para garantir
   *  contraste AA quando usados como texto. Valores 200..300 são tons "purple-tinted"
   *  para alinhar com a identidade Ploomes em borders e backgrounds sutis. */
  neutralLight: {
    0:   '#FFFFFF',
    50:  '#FAFAFB',
    100: '#F5F5FA',
    200: '#E6DEF5',
    300: '#D8CAEF',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  /** Neutros para tema dark, derivados da paleta Ploomes. */
  neutralDark: {
    0:   '#0E071B',
    50:  '#1A0E2E',
    100: '#221540',
    200: '#2A1F3D',
    300: '#3E2A6A',
    400: '#5E49A6',
    500: '#7C68C7',
    600: '#9F8FD3',
    700: '#C9BDF5',
    800: '#EFEAFF',
  },

  success: { 50: '#F0FDF4', 500: '#22C55E', 700: '#15803D', 900: '#14532D' },
  warning: { 50: '#FFFBEB', 500: '#F59E0B', 700: '#B45309', 900: '#78350F' },
  danger:  { 50: '#FEF2F2', 500: '#EF4444', 700: '#B91C1C', 900: '#7F1D1D' },
  info:    { 50: '#EFF6FF', 500: '#3B82F6', 700: '#1D4ED8', 900: '#1E3A8A' },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/** Tokens semânticos para tema light. */
export const lightSemantic = {
  mode: 'light',

  primary:        palette.purple[500],
  primaryHover:   palette.purple[600],
  primaryActive:  palette.purple[700],
  primarySoft:    palette.purple[100],
  primaryFocus:   'rgba(116, 67, 246, 0.25)',
  onPrimary:      palette.white,

  secondary:      palette.purple[100],
  secondaryHover: palette.purple[200],
  onSecondary:    palette.purple[950],

  success: palette.success[500],
  warning: palette.warning[500],
  danger:  palette.danger[500],
  info:    palette.info[500],

  successSoft: palette.success[50],
  warningSoft: palette.warning[50],
  dangerSoft:  palette.danger[50],
  infoSoft:    palette.info[50],

  text: {
    primary:   palette.neutralLight[900], // 17.7:1 vs bg.surface — AAA
    secondary: palette.neutralLight[700], // 10.3:1 — AAA
    muted:     palette.neutralLight[600], // 7.5:1 — AAA  (era [500], falhava no bg.app)
    disabled:  palette.neutralLight[400], // não é elegível a WCAG por definição
    inverse:   palette.neutralLight[0],
    brand:     palette.purple[950],       // 17.6:1 — AAA
    link:      palette.purple[600],       // 5.5:1 — AA
  },

  /** Cores para texto sobre fundos de status. Garantem AA texto normal. */
  onStatus: {
    success: palette.success[900], // texto escuro sobre success.500
    warning: palette.warning[900], // texto escuro sobre warning.500
    danger:  palette.neutralLight[0], // branco — AA apenas em large text
    info:    palette.neutralLight[0], // branco — AA apenas em large text
  },

  bg: {
    app:      palette.neutralLight[100],
    surface:  palette.neutralLight[0],
    elevated: palette.neutralLight[0],
    sunken:   palette.neutralLight[50],
    overlay:  'rgba(14, 7, 27, 0.45)',
  },

  border: {
    default: palette.neutralLight[200],
    strong:  palette.neutralLight[300],
    subtle:  palette.neutralLight[100],
    focus:   palette.purple[500],
  },

  scrollbar: {
    track: palette.neutralLight[100],
    thumb: palette.purple[200],
    thumbHover: palette.purple[400],
  },
};

/** Tokens semânticos para tema dark. */
export const darkSemantic = {
  mode: 'dark',

  primary:        palette.purple[400],
  primaryHover:   palette.purple[300],
  primaryActive:  palette.purple[200],
  primarySoft:    palette.purple[950],
  primaryFocus:   'rgba(171, 130, 255, 0.40)',
  onPrimary:      palette.purple[950],

  secondary:      palette.purple[900],
  secondaryHover: palette.purple[800],
  onSecondary:    palette.purple[100],

  success: palette.success[500],
  warning: palette.warning[500],
  danger:  palette.danger[500],
  info:    palette.info[500],

  successSoft: 'rgba(34, 197, 94, 0.15)',
  warningSoft: 'rgba(245, 158, 11, 0.15)',
  dangerSoft:  'rgba(239, 68, 68, 0.15)',
  infoSoft:    'rgba(59, 130, 246, 0.18)',

  text: {
    primary:   palette.neutralDark[800], // 15.6:1 vs bg.surface — AAA
    secondary: palette.neutralDark[700], // 10.5:1 — AAA
    muted:     palette.neutralDark[600], // 6.4:1 — AA
    disabled:  palette.neutralDark[500],
    inverse:   palette.purple[950],
    brand:     palette.purple[100],      // 15.0:1 — AAA
    link:      palette.purple[300],      // 9.7:1 — AAA
  },

  /** Cores para texto sobre fundos de status. */
  onStatus: {
    success: palette.success[900],
    warning: palette.warning[900],
    danger:  palette.neutralLight[0],
    info:    palette.neutralLight[0],
  },

  bg: {
    app:      palette.neutralDark[0],
    surface:  palette.neutralDark[50],
    elevated: palette.neutralDark[100],
    sunken:   palette.neutralDark[0],
    overlay:  'rgba(0, 0, 0, 0.65)',
  },

  border: {
    default: palette.neutralDark[200],
    strong:  palette.neutralDark[300],
    subtle:  palette.neutralDark[100],
    focus:   palette.purple[400],
  },

  scrollbar: {
    track: palette.neutralDark[0],
    thumb: palette.neutralDark[300],
    thumbHover: palette.purple[500],
  },
};

/** Retorna o objeto semântico para o modo solicitado. */
export function createColors(mode = 'light') {
  return mode === 'dark' ? darkSemantic : lightSemantic;
}

export default { palette, lightSemantic, darkSemantic, createColors };
