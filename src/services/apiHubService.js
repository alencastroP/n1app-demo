// src/services/apiHubService.js
import { apiFetchJson } from './http';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid';

/** Extrai mensagem legível de uma resposta HTTP não-ok. */
async function _httpError(response) {
  const text = await response.text().catch(() => '');
  try {
    const json = JSON.parse(text);
    if (json?.erro) return new Error(json.erro);
  } catch (_) { /* não era JSON */ }
  return new Error(`HTTP ${response.status} — ${text.slice(0, 300)}`);
}

export async function getApiHubCatalog() {
  return apiFetchJson('/api/apihub/catalog', { method: 'GET' });
}

export async function getReadyRequests() {
  // Usa apiFetchJson para incluir Authorization/JWT do app
  return apiFetchJson('/api/apihub/ready-requests', { method: 'GET' });
}

export async function validateUserKey(userKey) {
  const q = new URLSearchParams({ userKey }).toString();
  return apiFetchJson(`/api/apihub/validate-uk?${q}`, { method: 'GET' });
}

/**
 * pathId: opcional — quando informado e o método for PATCH/DELETE,
 *         monta o endpoint como `${endpoint}(${pathId})`
 */
export async function sendSingleRequest({ endpoint, method, query, body, userKeyOverride, pathId }) {
  const m = String(method).toUpperCase();
  const endpointWithPath = pathId && (m === 'PATCH' || m === 'DELETE')
    ? `${endpoint}(${pathId})`
    : endpoint;

  if (m === 'DELETE') {
    return apiFetchJson('/api/apihub/request', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: endpointWithPath, query: '', userKeyOverride }),
    });
  }

  return apiFetchJson('/api/apihub/request', {
    method: 'POST',
    body: JSON.stringify({ endpoint: endpointWithPath, method: m, query, body, userKeyOverride }),
  });
}

/**
 * Bulk:
 *  - items: [{ id: ... }, ...] (ou ["123","456",...])
 *  - pathWithId: se true, o backend monta `${endpoint}(${item.id})` por item
 */
export async function sendBulkRequest({
  endpoint, method, items, queryTemplate, bodyTemplate, userKeyOverride, pathWithId = false,
}) {
  return apiFetchJson('/api/apihub/bulk', {
    method: 'POST',
    body: JSON.stringify({ endpoint, method, items, queryTemplate, bodyTemplate, userKeyOverride, pathWithId }),
  });
}

/**
 * Bulk com streaming de progresso via SSE:
 *  - onProgress: callback chamado a cada atualização de progresso
 *    - recebe: { type, current, total, success, failed, log, jobId }
 *  - retorna: Promise que resolve com o resultado final
 */
export async function sendBulkRequestWithProgress({
  endpoint, method, items, queryTemplate, bodyTemplate, userKeyOverride, pathWithId = false, onProgress
}) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        endpoint,
        method,
        items,
        queryTemplate,
        bodyTemplate,
        userKeyOverride,
        pathWithId,
        streamProgress: true
      })
    })
    .then(async response => {
      if (!response.ok) {
        throw await _httpError(response);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processStream() {
        reader.read().then(({ done, value }) => {
          if (done) {
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'complete') {
                  resolve(data);
                } else if (data.type === 'error') {
                  reject(new Error(data.error));
                } else if (data.type === 'progress' || data.type === 'start') {
                  if (onProgress) {
                    onProgress(data);
                  }
                }
              } catch (e) {
                console.error('Erro ao parsear SSE:', e);
              }
            }
          });

          processStream();
        }).catch(reject);
      }

      processStream();
    })
    .catch(reject);
  });
}

/**
 * Execute: finaliza tarefas em massa com SSE de progresso.
 * taskIds: number[] — lista de IDs fornecida pelo usuário.
 * onProgress: callback chamado a cada evento SSE (start/progress).
 * Resolve com o resultado final { total, success, failed, successIds, failedIds, ... }
 */
export async function executeFinishTasks({ userKeyOverride, taskIds, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/finish-tasks/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, taskIds }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Busca os perfis de usuário da conta para seleção antes de executar a ação.
 * Retorna array de { Id, Name }.
 */
export async function fetchRestrictOptionFieldsProfiles({ userKeyOverride }) {
  const params = new URLSearchParams({ userKeyOverride });
  return apiFetchJson(
    `/api/apihub/ready-actions/restrict-option-fields/profiles?${params}`,
    { method: 'GET' }
  );
}

/**
 * Execute: restringe campos de opções (TypeId eq 7) aplicando CreateOptionsAllowedUserProfiles
 * com os perfis selecionados pelo usuário.
 * Mesmo protocolo SSE das demais ações prontas.
 * @param {string} userKeyOverride
 * @param {number[]} profileIds - IDs dos perfis selecionados
 * @param {function} onProgress
 */
export async function executeRestrictOptionFields({ userKeyOverride, profileIds, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/restrict-option-fields/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, profileIds }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Execute: busca o histórico de ganho/perda de cada negócio informado.
 * Mesmo protocolo SSE das demais ações prontas.
 * @param {string} userKeyOverride
 * @param {number[]} dealIds
 * @param {function} onProgress
 */
export async function executeGetDealHistory({ userKeyOverride, dealIds, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/deal-history/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, dealIds }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Execute: formata telefones de contatos para o padrão brasileiro (CountryId=76).
 * Protocolo SSE idêntico às demais ações prontas.
 * @param {string} userKeyOverride
 * @param {number[]} contactIds
 * @param {function} onProgress
 */
export async function executeFormatContactPhones({ userKeyOverride, contactIds, countryId = 76, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/format-contact-phones/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, contactIds, countryId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Lista usuários ativos da conta para seleção antes de executar a ação de remover colaboradores.
 * Retorna { users: [{ Id, Name }] }
 */
export async function fetchCollaboratingUsersUsers({ userKeyOverride }) {
  const params = new URLSearchParams({ userKeyOverride });
  return apiFetchJson(
    `/api/apihub/ready-actions/remove-collaborating-users/users?${params}`,
    { method: 'GET' }
  );
}

/**
 * Execute: remove usuários colaboradores de uma lista de entidades (Contacts ou Deals).
 * Protocolo SSE idêntico às demais ações prontas.
 * @param {string} userKeyOverride
 * @param {'Contacts'|'Deals'} entityType
 * @param {number[]} entityIds
 * @param {number[]} userIdsToRemove
 * @param {function} onProgress
 */
export async function executeRemoveCollaboratingUsers({ userKeyOverride, entityType, entityIds, userIdsToRemove, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/remove-collaborating-users/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, entityType, entityIds, userIdsToRemove }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Busca todos os campos de negócio (EntityId=8) da conta para mapeamento SLA retroativo.
 * Retorna { fields: [{ Id, Key, Name, TypeId }] }
 */
export async function fetchSlaRetroativoFields({ userKeyOverride }) {
  const params = new URLSearchParams({ userKeyOverride });
  return apiFetchJson(
    `/api/apihub/ready-actions/sla-retroativo/fields?${params}`,
    { method: 'GET' }
  );
}

/**
 * Execute: preenche datas de entrada/saída de estágio retroativamente via timeline.
 * @param {string} userKeyOverride
 * @param {number[]} dealIds
 * @param {{ stageId: number, entryFieldKey: string|null, exitFieldKey: string|null }[]} fieldMappings
 * @param {function} onProgress
 */
export async function executeSlaRetroativo({ userKeyOverride, dealIds, fieldMappings, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/sla-retroativo/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, dealIds, fieldMappings }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Lista TODOS os campos (qualquer tipo) da entidade para a ação "Substituir em massa".
 * Implementação dedicada — filtra por Entity/Id (propriedade de navegação), o mesmo padrão já
 * comprovado em produção pela página de Changelog global, em vez do filtro genérico por EntityId
 * usado em fetchFieldsByEntity (que não retornava a lista completa de forma confiável aqui).
 * Retorna { fields: [{ id, key, name, typeId, typeName, dynamic, propertyName, updatePropertyName }] }
 */
export async function fetchBulkFindReplaceFields({ userKeyOverride, entityId }) {
  const params = new URLSearchParams({ userKeyOverride, entityId: String(entityId) });
  return apiFetchJson(
    `/api/apihub/ready-actions/bulk-find-replace/fields?${params}`,
    { method: 'GET' }
  );
}

/**
 * Preview: NÃO grava nada — busca o valor ATUAL do campo de cada registro selecionado e calcula
 * como ficaria após aplicar os de-paras regex. Gate obrigatório no front antes de liberar o
 * "Executar". Mesmo protocolo SSE das demais ações prontas.
 * Resolve com { entity, fieldName, total, changed, unchanged, failed, cancelled, rows }.
 * rows: [{ id, before, after, status: 'alterado'|'sem-alteracao'|'erro', detail }]
 * @param {object} p — mesmos campos de executeBulkFindReplace (abaixo) + onProgress
 */
export async function previewBulkFindReplace({
  userKeyOverride, entity, field, replacements, ids = [], filter = '', onProgress,
}) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/bulk-find-replace/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, entity, field, replacements, ids, filter }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Execute: substitui em massa (find & replace por regex) o conteúdo de um campo
 * (nativo ou personalizado) dos registros selecionados.
 * Mesmo protocolo SSE das demais ações prontas.
 * Resolve com { entity, fieldName, total, success, skipped, failed, cancelled, auditRows }.
 * @param {object} p
 * @param {string} p.userKeyOverride
 * @param {'Contacts'|'Deals'|'Products'|'Quotes'|'Orders'} p.entity
 * @param {{id:number,key:string,name:string,typeId:number,dynamic:boolean,propertyName:string,updatePropertyName:string}} p.field
 * @param {{find:string,replace:string}[]} p.replacements
 * @param {number[]} p.ids       - lista de IDs (quando seleção por IDs)
 * @param {string} p.filter      - $filter OData (quando seleção por filtro)
 * @param {function} p.onProgress
 */
export async function executeBulkFindReplace({
  userKeyOverride, entity, field, replacements, ids = [], filter = '', onProgress,
}) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/bulk-find-replace/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, entity, field, replacements, ids, filter }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

// ────────────────────────────────────────────────────────────────
// AÇÃO PRONTA: Atualização em massa por faixas de IDs
// ────────────────────────────────────────────────────────────────

/**
 * Lista TODOS os campos (qualquer tipo) da entidade para a ação "Atualização em massa por faixas".
 * Query idêntica à do bulk-find-replace (comprovada em produção).
 * Retorna { fields: [{ id, key, name, typeId, dynamic, propertyName, updatePropertyName }] }
 */
export async function fetchBulkRangeUpdateFields({ userKeyOverride, entityId }) {
  const params = new URLSearchParams({ userKeyOverride, entityId: String(entityId) });
  return apiFetchJson(
    `/api/apihub/ready-actions/bulk-range-update/fields?${params}`,
    { method: 'GET' }
  );
}

/**
 * Resolve a "forma" de um campo (escalar / opção / referência) pelo Id e já traz a lista de
 * escolhas quando aplicável (opção, usuário, produto, contato, moeda). O backend usa o NativeType
 * do campo para definir o slot de valor e busca as escolhas no endpoint da entidade referenciada.
 * Retorna { nativeType, slot, kind, optionsTableId, options: [{ Id, Name }], truncated }.
 */
export async function fetchBulkRangeUpdateFieldMeta({ userKeyOverride, fieldId }) {
  const params = new URLSearchParams({ userKeyOverride, fieldId: String(fieldId) });
  return apiFetchJson(
    `/api/apihub/ready-actions/bulk-range-update/field-meta?${params}`,
    { method: 'GET' }
  );
}

/**
 * Execute: aplica um valor por bloco a cada ID informado, via PATCH no registro.
 * Mesmo protocolo SSE das demais ações prontas.
 * Resolve com { entity, fieldName, total, success, failed, cancelled, auditRows }.
 * @param {object} p
 * @param {string} p.userKeyOverride
 * @param {'Contacts'|'Deals'|'Quotes'|'Orders'|'Products'|'Tasks'|'InteractionRecords'} p.entity
 * @param {{key:string,typeId:number,dynamic:boolean,propertyName:string,updatePropertyName:string,name:string}} p.field
 * @param {{id:number,value:any}[]} p.assignments  - par ID → valor (já distribuído pelos blocos)
 * @param {boolean} p.suppressWebhooks
 * @param {function} p.onProgress
 */
export async function executeBulkRangeUpdate({
  userKeyOverride, entity, field, assignments, suppressWebhooks = false, onProgress,
}) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/bulk-range-update/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, entity, field, assignments, suppressWebhooks }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

// ────────────────────────────────────────────────────────────────
// AÇÃO PRONTA: Concatenar nomes de usuários em massa
// ────────────────────────────────────────────────────────────────

/**
 * Execute: para cada userId informado, lê o Name atual e reescreve via PATCH Users({id}),
 * concatenando um texto fixo antes (prefix) ou depois (suffix) do nome. Idempotente:
 * usuários cujo nome já começa/termina com o texto são ignorados (contam como "skipped").
 * Mesmo protocolo SSE das demais ações prontas.
 * Resolve com { total, success, skipped, failed, cancelled, text, position, auditRows, failedIds }.
 * @param {object} p
 * @param {string} p.userKeyOverride
 * @param {number[]} p.userIds
 * @param {string} p.text                 - texto a concatenar
 * @param {'prefix'|'suffix'} p.position
 * @param {function} p.onProgress
 */
export async function executeBulkRenameUsers({ userKeyOverride, userIds, text, position = 'prefix', onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/bulk-rename-users/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, userIds, text, position }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Execute: cria usuários em massa via POST Users. Recebe a lista já parseada
 * pelo frontend (planilha/JSON colado → objetos com Name/Email/Password + extras).
 * Mesmo protocolo SSE das demais ações prontas.
 * Resolve com { total, success, failed, cancelled, auditRows, failedItems }.
 * @param {object} p
 * @param {string} p.userKeyOverride
 * @param {Array<{Name:string,Email:string,Password:string}>} p.users
 * @param {function} p.onProgress
 */
export async function executeCreateUsers({ userKeyOverride, users, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/create-users/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, users }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/** Cancelar um bulk em andamento pelo jobId */
export async function cancelBulkRequest(jobId) {
  return apiFetchJson('/api/apihub/cancel-bulk', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  });
}

// ────────────────────────────────────────────────────────────────
// AÇÕES PRONTAS (Ready Actions)
// ────────────────────────────────────────────────────────────────

/**
 * Scan: busca cidades não nativas (IBGECode eq null) na conta do userKey.
 * O backend pagina internamente (limite de 300 itens por resposta da API Ploomes).
 * Retorna { total, ids: [number] }
 */
export async function scanNonNativeCities(userKeyOverride) {
  return apiFetchJson('/api/apihub/ready-actions/delete-non-native-cities/scan', {
    method: 'POST',
    body: JSON.stringify({ userKeyOverride }),
  });
}

/**
 * Execute: deleta cidades não nativas com SSE de progresso.
 * Mesmo protocolo SSE do sendBulkRequestWithProgress (start/progress/complete/error).
 */
export async function executeDeleteNonNativeCities({ userKeyOverride, ids, onProgress }) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/delete-non-native-cities/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userKeyOverride, ids }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}

/**
 * Preview: conta (estimativa via $count=true) os registros que casam
 * "origem preenchida E destino vazio" para a unificação de campos.
 * Retorna { count, entity }.
 * @param {object} p
 * @param {string} p.userKeyOverride
 * @param {'Contacts'|'Deals'|'Quotes'|'Orders'} p.entity
 * @param {number} p.sourceFieldId
 * @param {string} p.sourceFieldKey
 * @param {number} p.sourceTypeId
 * @param {number} p.targetFieldId
 * @param {string} p.targetFieldKey
 * @param {number} p.targetTypeId
 */
export async function previewUnifyDuplicateFields({
  userKeyOverride, entity,
  sourceFieldId, sourceFieldKey, sourceTypeId,
  targetFieldId, targetFieldKey, targetTypeId,
}) {
  return apiFetchJson('/api/apihub/ready-actions/unify-duplicate-fields/preview', {
    method: 'POST',
    body: JSON.stringify({
      userKeyOverride, entity,
      sourceFieldId, sourceFieldKey, sourceTypeId,
      targetFieldId, targetFieldKey, targetTypeId,
    }),
  });
}

/**
 * Execute: copia, em massa, o valor do campo origem para o campo destino
 * (somente quando o destino está vazio) nos OtherProperties da entidade.
 * Mesmo protocolo SSE das demais ações prontas.
 * Resolve com o resultado final { entity, total, success, failed, skipped, cancelled, auditRows }.
 * @param {object} p — mesmos campos de previewUnifyDuplicateFields + onProgress
 */
export async function executeUnifyDuplicateFields({
  userKeyOverride, entity,
  sourceFieldId, sourceFieldKey, sourceTypeId,
  targetFieldId, targetFieldKey, targetTypeId,
  onProgress,
}) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/apihub/ready-actions/unify-duplicate-fields/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        userKeyOverride, entity,
        sourceFieldId, sourceFieldKey, sourceTypeId,
        targetFieldId, targetFieldKey, targetTypeId,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await _httpError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream() {
          reader.read().then(({ done, value }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (data.type === 'progress' || data.type === 'start') {
                    if (onProgress) onProgress(data);
                  }
                } catch (e) {
                  console.error('Erro ao parsear SSE:', e);
                }
              }
            });

            processStream();
          }).catch(reject);
        }

        processStream();
      })
      .catch(reject);
  });
}
