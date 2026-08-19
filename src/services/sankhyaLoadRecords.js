// src/services/sankhyaLoadRecords.js
import { apiFetch } from './http';

/* ── Entidades suportadas ────────────────────────────── */

/**
 * Cada entidade define:
 *  - filters: campos do critério WHERE (1 ou mais). Todos viram `this.CAMPO = valor`
 *             unidos por AND. Baseados nas queries validadas na coleção Postman.
 *  - availableFields: campos selecionáveis no MultiSelect ({ value, label }).
 *                     Vazio na seleção => envia '*' (todos os campos da tabela).
 */
export const ENTITIES = [
  {
    id: 'parceiro',
    label: 'Cliente parceiro (TGFPAR)',
    table: 'TGFPAR',
    rootEntity: 'Parceiro',
    filters: [
      { field: 'CODPARC', label: 'Código do parceiro (CODPARC)' },
    ],
    availableFields: [
      { value: 'CODPARC', label: 'CODPARC — Código do Parceiro' },
      { value: 'TIPPESSOA', label: 'TIPPESSOA — Tipo de pessoa (F/J)' },
      { value: 'NOMEPARC', label: 'NOMEPARC — Nome do Parceiro' },
      { value: 'RAZAOSOCIAL', label: 'RAZAOSOCIAL — Razão Social' },
      { value: 'CGC_CPF', label: 'CGC_CPF — CPF/CNPJ' },
      { value: 'CLIENTE', label: 'CLIENTE — É cliente (S/N)' },
      { value: 'FORNECEDOR', label: 'FORNECEDOR — É fornecedor (S/N)' },
      { value: 'ATIVO', label: 'ATIVO — Ativo (S/N)' },
      { value: 'CODCID', label: 'CODCID — Código da cidade' },
      { value: 'CLASSIFICMS', label: 'CLASSIFICMS — Classificação ICMS' },
      { value: 'IDENTINSCESTAD', label: 'IDENTINSCESTAD — Inscrição Estadual' },
      { value: 'CODVEND', label: 'CODVEND — Código do Vendedor' },
      { value: 'TELEFONE', label: 'TELEFONE — Telefone' },
      { value: 'EMAIL', label: 'EMAIL — E-mail' },
      { value: 'OBSERVACAO', label: 'OBSERVACAO — Observação' },
      { value: 'DTCAD', label: 'DTCAD — Data de cadastro' },
      { value: 'DTALTER', label: 'DTALTER — Data da última alteração' },
    ],
  },
  {
    id: 'contato',
    label: 'Cliente contato (TGFCTT)',
    table: 'TGFCTT',
    rootEntity: 'Contato',
    filters: [
      { field: 'CODPARC', label: 'Código do parceiro (CODPARC)' },
      { field: 'CODCONTATO', label: 'Código do contato (CODCONTATO)' },
    ],
    availableFields: [
      { value: 'CODPARC', label: 'CODPARC — Código do Parceiro vinculado' },
      { value: 'CODCONTATO', label: 'CODCONTATO — Código do Contato' },
      { value: 'NOMECONTATO', label: 'NOMECONTATO — Nome do contato' },
      { value: 'APELIDO', label: 'APELIDO — Apelido do contato' },
      { value: 'CPF', label: 'CPF — CPF do contato' },
      { value: 'TELEFONE', label: 'TELEFONE — Telefone' },
      { value: 'EMAIL', label: 'EMAIL — E-mail' },
      { value: 'ATIVO', label: 'ATIVO — Ativo (S/N)' },
      { value: 'DTALTER', label: 'DTALTER — Data da última alteração' },
      { value: 'DHALTER', label: 'DHALTER — Data/hora da última alteração' },
    ],
  },
  {
    id: 'vendedor',
    label: 'Vendedor (TGFVEN)',
    table: 'TGFVEN',
    rootEntity: 'Vendedor',
    filters: [
      { field: 'CODVEND', label: 'Código do vendedor (CODVEND)' },
    ],
    availableFields: [
      { value: 'CODVEND', label: 'CODVEND — Código do Vendedor' },
      { value: 'APELIDO', label: 'APELIDO — Nome/Apelido do vendedor' },
      { value: 'CODPARC', label: 'CODPARC — Código do Parceiro' },
      { value: 'CODFUNC', label: 'CODFUNC — Funcionário (usuário Sankhya)' },
      { value: 'TIPVEND', label: 'TIPVEND — Tipo de vendedor' },
      { value: 'EMAIL', label: 'EMAIL — E-mail do vendedor' },
      { value: 'ATIVO', label: 'ATIVO — Ativo (S/N)' },
      { value: 'DTALTER', label: 'DTALTER — Data da última alteração' },
    ],
  },
  {
    id: 'produto',
    label: 'Produtos (TGFPRO)',
    table: 'TGFPRO',
    rootEntity: 'Produto',
    filters: [
      { field: 'CODPROD', label: 'Código do produto (CODPROD)' },
    ],
    availableFields: [
      { value: 'CODPROD', label: 'CODPROD — Código do Produto/Serviço' },
      { value: 'DESCRPROD', label: 'DESCRPROD — Descrição do produto' },
      { value: 'CODGRUPOPROD', label: 'CODGRUPOPROD — Código do Grupo de Produto' },
      { value: 'CODVOL', label: 'CODVOL — Unidade/volume padrão' },
      { value: 'USOPROD', label: 'USOPROD — Usado como (Produto/Serviço)' },
      { value: 'MARCA', label: 'MARCA — Marca do produto' },
      { value: 'REFFORN', label: 'REFFORN — Referência do fornecedor' },
      { value: 'NCM', label: 'NCM — NCM (fiscal)' },
      { value: 'LOCAL', label: 'LOCAL — Local de estoque' },
      { value: 'ATIVO', label: 'ATIVO — Ativo (S/N)' },
      { value: 'DTALTER', label: 'DTALTER — Data da última alteração' },
    ],
  },
  {
    id: 'cabecalho-nota',
    label: 'Cabeçalho de nota (TGFCAB)',
    table: 'TGFCAB',
    rootEntity: 'CabecalhoNota',
    filters: [
      { field: 'NUNOTA', label: 'Número único da nota (NUNOTA)' },
    ],
    availableFields: [
      { value: 'NUNOTA', label: 'NUNOTA — Número único da nota' },
      { value: 'CODPARC', label: 'CODPARC — Código do Parceiro (cliente)' },
      { value: 'CODVEND', label: 'CODVEND — Código do Vendedor' },
      { value: 'CODCONTATO', label: 'CODCONTATO — Código do Contato' },
      { value: 'CODEMP', label: 'CODEMP — Código da empresa (filial)' },
      { value: 'CODTIPOPER', label: 'CODTIPOPER — Tipo de operação (TOP)' },
      { value: 'CODTIPVENDA', label: 'CODTIPVENDA — Tipo de negociação' },
      { value: 'CODNAT', label: 'CODNAT — Natureza' },
      { value: 'CODCENCUS', label: 'CODCENCUS — Centro de custo' },
      { value: 'TIPMOV', label: 'TIPMOV — Tipo de movimento' },
      { value: 'STATUSNOTA', label: 'STATUSNOTA — Status da nota (A/L)' },
      { value: 'CIF_FOB', label: 'CIF_FOB — Modalidade de frete (C/F/R)' },
      { value: 'DTNEG', label: 'DTNEG — Data de negociação' },
      { value: 'VLRNOTA', label: 'VLRNOTA — Valor total da nota' },
      { value: 'PERCDESC', label: 'PERCDESC — Percentual de desconto' },
      { value: 'OBSERVACAO', label: 'OBSERVACAO — Observação' },
      { value: 'DTALTER', label: 'DTALTER — Data da última alteração' },
    ],
  },
  {
    id: 'item-nota',
    label: 'Itens de nota (TGFITE)',
    table: 'TGFITE',
    rootEntity: 'ItemNota',
    filters: [
      { field: 'NUNOTA', label: 'Número único da nota (NUNOTA)' },
    ],
    availableFields: [
      { value: 'NUNOTA', label: 'NUNOTA — Número único da nota (cabeçalho)' },
      { value: 'SEQUENCIA', label: 'SEQUENCIA — Sequência do item' },
      { value: 'CODPROD', label: 'CODPROD — Código do produto/serviço' },
      { value: 'QTDNEG', label: 'QTDNEG — Quantidade negociada' },
      { value: 'VLRUNIT', label: 'VLRUNIT — Valor unitário' },
      { value: 'VLRTOT', label: 'VLRTOT — Valor total do item' },
      { value: 'PERCDESC', label: 'PERCDESC — Percentual de desconto do item' },
      { value: 'CODVOL', label: 'CODVOL — Unidade/volume' },
      { value: 'CODLOCALORIG', label: 'CODLOCALORIG — Local de origem (estoque)' },
      { value: 'REFERENCIA', label: 'REFERENCIA — Referência do produto' },
      { value: 'CONTROLE', label: 'CONTROLE — Controle/variação do produto' },
    ],
  },
  {
    id: 'usuario',
    label: 'Usuários (TSIUSU)',
    table: 'TSIUSU',
    rootEntity: 'Usuario',
    filters: [
      { field: 'CODPARC', label: 'Código do parceiro (CODPARC)' },
    ],
    // Apenas campos confirmados na doc oficial. Outros campos (status/datas) não
    // têm nome técnico confirmado — deixar vazio (envia '*') para trazer todos.
    availableFields: [
      { value: 'CODUSU', label: 'CODUSU — Código do usuário' },
      { value: 'NOMEUSU', label: 'NOMEUSU — Nome/login do usuário' },
      { value: 'EMAIL', label: 'EMAIL — E-mail do usuário' },
    ],
  },
];

/* ── Montagem do payload ─────────────────────────────── */

/**
 * Monta o body para PUT LoadRecords
 * @param {Object} entity - item de ENTITIES
 * @param {Object} filterValues - mapa { CAMPO: valor } para os filtros da entidade
 * @param {string[]} fields - campos selecionados (vazio = '*')
 */
export function buildLoadRecordsPayload(entity, filterValues, fields) {
  const list = fields.length > 0 ? fields.join(',') : '*';

  // Monta `this.CAMPO = valor` para cada filtro, unidos por AND.
  const expression = entity.filters
    .map((f) => `this.${f.field} = ${String(filterValues[f.field]).trim()}`)
    .join(' and ');

  return {
    serviceName: 'CRUDServiceProvider.loadRecords',
    requestBody: {
      dataSet: {
        rootEntity: entity.rootEntity,
        includePresentationFields: 'N',
        offsetPage: '0',
        criteria: {
          expression: {
            $: expression,
          },
        },
        entity: {
          fieldset: {
            list,
          },
        },
      },
    },
  };
}

/**
 * Campo de varredura de uma entidade (operador `>`), usado pela busca de itens
 * corrompidos. Por padrão é o primeiro filtro da entidade.
 */
export function getScanField(entity) {
  return entity.scanField || entity.filters[0].field;
}

/**
 * Monta o body para um "scan" sequencial: `this.CAMPO > valor`.
 * @param {Object} entity - item de ENTITIES
 * @param {string} fromCode - código a partir do qual buscar
 * @param {string[]} fields - campos selecionados (vazio = '*')
 */
export function buildScanPayload(entity, fromCode, fields) {
  const list = fields.length > 0 ? fields.join(',') : '*';
  const scanField = getScanField(entity);

  return {
    serviceName: 'CRUDServiceProvider.loadRecords',
    requestBody: {
      dataSet: {
        rootEntity: entity.rootEntity,
        includePresentationFields: 'N',
        offsetPage: '0',
        criteria: {
          expression: {
            $: `this.${scanField} > ${String(fromCode).trim()}`,
          },
        },
        entity: {
          fieldset: {
            list,
          },
        },
      },
    },
  };
}

/* ── Parse do response ───────────────────────────────── */

/**
 * Normaliza a resposta de LoadRecords em { columns, rows }
 * @param {Object} response - JSON retornado pelo Sankhya
 * @returns {{ columns: string[], rows: Object[] }}
 */
export function parseSankhyaLoadRecordsResponse(response) {
  const entities = response?.responseBody?.entities;
  if (!entities) return { columns: [], rows: [] };

  // colunas
  const fieldsMeta = entities.metadata?.fields?.field ?? [];
  const columns = fieldsMeta.map((f) => f.name);

  // entidades: pode ser objeto (1 item) ou array (múltiplos)
  let rawEntities = entities.entity;
  if (!rawEntities) return { columns, rows: [] };
  if (!Array.isArray(rawEntities)) rawEntities = [rawEntities];

  const rows = rawEntities.map((ent) => {
    const row = {};
    columns.forEach((col, idx) => {
      row[col] = ent[`f${idx}`]?.$ ?? '';
    });
    return row;
  });

  return { columns, rows };
}

/* ── Detecção de datas suspeitas ─────────────────────── */

const DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})\s/;

/**
 * Verifica se um valor string contém uma data com ano < 1900
 */
export function isSuspiciousDate(value) {
  if (typeof value !== 'string') return false;
  const m = value.match(DATE_REGEX);
  if (!m) return false;
  const year = parseInt(m[3], 10);
  return year < 1900;
}

/**
 * Analisa as rows e retorna quais linhas/campos são suspeitos
 * @param {string[]} columns
 * @param {Object[]} rows
 * @returns {{ rowIndex: number, field: string, value: string }[]}
 */
export function detectSuspiciousFields(columns, rows) {
  const suspects = [];
  rows.forEach((row, rowIndex) => {
    columns.forEach((col) => {
      if (isSuspiciousDate(row[col])) {
        suspects.push({ rowIndex, field: col, value: row[col] });
      }
    });
  });
  return suspects;
}

/* ── Chamada à API (via backend proxy) ───────────────── */

/**
 * Chama PUT /api/sankhya/load-records/:accountId via backend
 */
export async function callLoadRecords({ accountId, env, userKey, payload }) {
  return apiFetch(
    `/api/sankhya/load-records/${accountId}?env=${env}`,
    {
      method: 'PUT',
      headers: { 'user-key': userKey },
      body: JSON.stringify({ payload }),
    },
  );
}
