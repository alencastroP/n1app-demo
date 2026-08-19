/**
 * @file tokens/layout.js
 * @description Tokens de layout de página do N1 App Design System.
 *
 * Larguras padronizadas de container de página-formulário (consumidas pelo
 * FormShell). Substituem os max-width mágicos espalhados pelas páginas
 * (640/680/780/1040/1080/1460px…) por dois degraus canônicos.
 */

export const containers = {
  /** Formulários enxutos (poucos campos, fluxo vertical). */
  formNarrow: '720px',
  /** Formulários largos (tabelas, múltiplas colunas, pré-visualizações). */
  formWide: '960px',
};

export default containers;
