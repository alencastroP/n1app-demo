/**
 * @file breakpoints.js
 * @description Breakpoints responsivos. Mobile-first.
 */

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl':'1536px',
};

/** Helpers de media query (use no styled-components com template literal). */
export const media = {
  up: (key) => `@media (min-width: ${breakpoints[key]})`,
  down: (key) => `@media (max-width: calc(${breakpoints[key]} - 1px))`,
  between: (min, max) =>
    `@media (min-width: ${breakpoints[min]}) and (max-width: calc(${breakpoints[max]} - 1px))`,
};

export default breakpoints;
