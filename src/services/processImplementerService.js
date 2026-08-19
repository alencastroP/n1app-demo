// src/services/processImplementerService.js

const BASE = '/api/process-implementer';

function authHeaders(userKey = '') {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(userKey ? { 'x-user-key': userKey } : {}),
  };
}

/**
 * Busca a lista de processos disponíveis.
 * @returns {Promise<Array>} Array de { id, name, description }
 */
export async function fetchProcesses() {
  const res = await fetch(`${BASE}/processes`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.erro || `Erro ${res.status} ao buscar processos`);
  }

  const data = await res.json();
  return data.processes || [];
}

/**
 * Executa um processo pelo seu ID.
 * @param {string} processId
 * @param {string} userKey
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function runProcess(processId, userKey = '') {
  const res = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: authHeaders(userKey),
    body: JSON.stringify({ processId }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.erro || `Erro ${res.status} ao executar processo`);
  }

  return data;
}
