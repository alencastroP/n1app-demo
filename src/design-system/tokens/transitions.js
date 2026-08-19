/**
 * @file transitions.js
 * @description Durations e easings padrão.
 */

export const durations = {
  instant: '0ms',
  fast:    '120ms',
  base:    '200ms',
  slow:    '320ms',
  slower:  '480ms',
};

export const easings = {
  /** Material standard — entradas e saídas equilibradas. */
  standard:   'cubic-bezier(0.2, 0, 0, 1)',
  /** Entradas suaves (decelera no fim). */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Saídas rápidas (acelera no fim). */
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Bounce sutil — para feedback de sucesso. */
  bounce:     'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear:     'linear',
};

/** Presets prontos para `transition`. */
export const presets = {
  base:    `all ${durations.base} ${easings.standard}`,
  fast:    `all ${durations.fast} ${easings.standard}`,
  slow:    `all ${durations.slow} ${easings.standard}`,
  fade:    `opacity ${durations.base} ${easings.standard}`,
  color:   `color ${durations.fast} ${easings.standard}, background-color ${durations.fast} ${easings.standard}, border-color ${durations.fast} ${easings.standard}`,
  shadow:  `box-shadow ${durations.base} ${easings.standard}`,
  transform: `transform ${durations.base} ${easings.standard}`,
};

export const transitions = { durations, easings, presets };

export default transitions;
