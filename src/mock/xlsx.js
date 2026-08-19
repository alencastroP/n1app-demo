// demo/src/mock/xlsx.js
//
// Gera planilhas .xlsx de verdade no browser com a lib `xlsx` (já é dependência
// do app). Assim os botões de download da demo entregam um arquivo abrível,
// com dados fictícios — em vez de um blob vazio.

import * as XLSX from 'xlsx';

/**
 * @param {Array<object>} linhas  Array de objetos (as chaves viram cabeçalho).
 * @param {string} nomeAba
 * @returns {ArrayBuffer} conteúdo binário do .xlsx
 */
export function planilhaDemo(linhas, nomeAba = 'Demo') {
  const dados = Array.isArray(linhas) && linhas.length
    ? linhas
    : [{ aviso: 'Planilha de demonstração — sem dados reais.' }];

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomeAba.slice(0, 30));
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
