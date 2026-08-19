// src/services/compiladorConhecimentoService.js
// Compilador de Conhecimento: transforma conteúdo bruto em rascunho .md
// pronto para revisão manual (pending-review/ → promover → rag-ingest).
//
// Rota consumida (admin-only no backend): POST /api/knowledge-compiler/compile

import { apiFetchJson } from './http';

/**
 * Compila um conteúdo bruto em markdown estruturado.
 * @param {{
 *   tipoFonte: string,
 *   moduloDestino: string,
 *   titulo?: string,
 *   conteudo: string,
 *   contexto?: string,
 *   tipoCaso?: string,
 *   fontesCards?: string,
 * }} payload
 * @returns {Promise<{ filename: string, markdown: string, avisos: string[], modelo: string }>}
 */
export async function compilarConhecimento(payload) {
  return apiFetchJson('/api/knowledge-compiler/compile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export default compilarConhecimento;
