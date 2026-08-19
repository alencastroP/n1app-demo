// src/services/sankhyaEnvironment.js

export const SANKHYA_ENV = {
  PROD: 'PROD',
  HOMOLOG: 'HOMOLOG',
};

const BASE_URLS = {
  [SANKHYA_ENV.PROD]:    'https://sankhya-admin.demo.invalid',
  [SANKHYA_ENV.HOMOLOG]: 'https://sankhya-homolog.demo.invalid',
};

export const ENV_LABELS = {
  [SANKHYA_ENV.PROD]:    'Sankhya (Produção)',
  [SANKHYA_ENV.HOMOLOG]: 'Sandhyabox (Homolog)',
};

/**
 * Retorna o baseUrl do Sankhya para o ambiente selecionado.
 * @param {string} env - SANKHYA_ENV.PROD ou SANKHYA_ENV.HOMOLOG
 * @returns {string} Base URL
 */
export function getSankhyaBaseUrl(env) {
  return BASE_URLS[env] || BASE_URLS[SANKHYA_ENV.PROD];
}
