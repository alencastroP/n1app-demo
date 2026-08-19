// src/services/sankhyaApi.js
import { apiFetch } from './http';

/**
 * Obtém o AccountId baseado na User-Key
 * @param {string} userKey - User-Key do Ploomes
 * @returns {Promise<number>} AccountId
 */
export async function getAccountId(userKey) {
  const response = await apiFetch(`/api/sankhya/account-id?userKey=${encodeURIComponent(userKey)}`, {
    method: 'GET'
  });
  return response.accountId;
}

/**
 * Verifica o login rápido no Sankhya
 * @param {number} accountId - ID da conta
 * @param {string} userKey - User-Key do Ploomes
 * @returns {Promise<Object>} Dados do login (bearerToken, error)
 */
export async function checkLogin(accountId, userKey) {
  return apiFetch(`/api/sankhya/check-login/${accountId}`, {
    method: 'GET',
    headers: {
      'user-key': userKey
    }
  });
}

/**
 * Consulta dados de parceiro (TGFPAR)
 * @param {Object} params
 * @param {number} params.accountId - ID da conta
 * @param {string} params.codigoParceiro - Código do parceiro (ou "*" para todos)
 * @param {Array<string>} params.campos - Lista de campos a retornar (opcional)
 * @param {string} params.userKey - User-Key do Ploomes
 * @returns {Promise<Object>} Dados do parceiro
 */
export async function consultarParceiro({ accountId, codigoParceiro, campos, userKey }) {
  return apiFetch('/api/sankhya/consultar-parceiro', {
    method: 'POST',
    headers: {
      'user-key': userKey
    },
    body: JSON.stringify({ accountId, codigoParceiro, campos })
  });
}

/**
 * Lista os campos disponíveis para consulta de parceiro
 * @returns {Promise<Array>} Lista de campos disponíveis
 */
export async function getCamposParceiro() {
  const response = await apiFetch('/api/sankhya/campos-parceiro', {
    method: 'GET'
  });
  return response.campos;
}

/**
 * Valida a versão da integração Sankhya e retorna o histórico de edições da conta.
 * @param {Object} params
 * @param {number} params.accountId - ID da conta
 * @param {string} params.userKey - User-Key do Ploomes
 * @param {string} params.env - 'PROD' | 'HOMOLOG'
 * @returns {Promise<{ version: number|null, latest: Object, history: Array }>}
 */
export async function getLastIntegrations({ accountId, userKey, env = 'PROD' }) {
  return apiFetch(`/api/sankhya/last-integrations/${accountId}?env=${encodeURIComponent(env)}`, {
    method: 'GET',
    headers: { 'user-key': userKey },
  });
}

/**
 * Consulta a versão do Sankhya (SK) instalado no cliente — usada para abrir
 * chamados com o suporte da Sankhya (apptoken/v2).
 * @param {Object} params
 * @param {string} params.userKey - User-Key da conta do cliente com o SK ativado
 * @param {string} params.env - 'PROD' | 'HOMOLOG'
 * @returns {Promise<{ version: string|null, raw: Object|null }>}
 */
export async function getClientSankhyaVersion({ userKey, env = 'PROD' }) {
  return apiFetch(`/api/sankhya/client-version?env=${encodeURIComponent(env)}`, {
    method: 'GET',
    headers: { 'user-key': userKey },
  });
}

/**
 * Troca o token de integração Sankhya.
 * O backend valida a versão (V2/V3) e executa o fluxo correto automaticamente.
 * @param {Object} params
 * @param {string} params.userKey - User-Key do usuário real da conta (quem troca o token)
 * @param {string} params.newToken - Novo token de integração
 * @param {string} params.env - 'PROD' | 'HOMOLOG'
 * @param {string} [params.supportUserKey] - UK de um usuário de suporte, usada apenas na
 *   checagem de versão (admin/qa) quando a UK da conta é recusada lá
 * @returns {Promise<{ version: number, env: string, result: Object }>}
 */
export async function trocaToken({ userKey, newToken, env = 'PROD', supportUserKey }) {
  const headers = { 'user-key': userKey };
  if (supportUserKey) headers['support-user-key'] = supportUserKey;

  return apiFetch(`/api/sankhya/troca-token?env=${encodeURIComponent(env)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ newToken }),
  });
}
