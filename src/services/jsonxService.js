// src/services/jsonxService.js
import { apiFetchRaw } from './http';

/** Extrai filename do header Content-Disposition (quando existir) */
function getFilenameFromDisposition(disposition) {
  if (!disposition) return null;
  // exemplos: attachment; filename="json_convert_173064934.xlsx"
  const matchQuoted = /filename\*?=(?:UTF-8'')?"([^"]+)"/i.exec(disposition);
  if (matchQuoted && matchQuoted[1]) return decodeURIComponent(matchQuoted[1]);

  const matchBare = /filename\*?=(.+)$/i.exec(disposition);
  if (matchBare && matchBare[1]) {
    return decodeURIComponent(matchBare[1].trim());
  }
  return null;
}

/**
 * Converte JSON para CSV/XLSX (chama o backend).
 * - Informe EITHER { text } (JSON colado) OU { file } (File .json)
 * - format: 'csv' | 'xlsx' (padrão: 'xlsx')
 * Retorna: { blob, filename }
 */
export async function convertJson({ text, file, format = 'xlsx' } = {}) {
  if (!text && !file) {
    throw new Error('Forneça o JSON colado (text) ou um arquivo .json (file).');
  }
  const fmt = String(format || 'xlsx').toLowerCase();

  let init;
  let path = `/api/jsonx/convert?format=${encodeURIComponent(fmt)}`;

  if (file) {
    const form = new FormData();
    form.append('file', file); // campo "file" no backend (multer.single)
    init = { method: 'POST', body: form }; // NÃO definir Content-Type manualmente
  } else {
    // text (string) pode ser JSON string; envie como body JSON com campo "json"
    init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: text }),
    };
  }

  // Usa apiFetchRaw pra manter headers e ler blob
  const resp = await apiFetchRaw(path, init);

  // Alguns erros do back podem vir em JSON (content-type application/json). Trate:
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await resp.json();
    // back manda { aviso, rows, columns } quando não há linhas
    // ou { erro, detalhe } em erro
    if (data?.erro) {
      throw new Error(`${data.erro}${data.detalhe ? ` — ${data.detalhe}` : ''}`);
    }
    // Caso “sem linhas”, devolvemos um CSV/XLSX vazio como cortesia?
    // Aqui preferimos informar claramente:
    throw new Error(data?.aviso || 'Resposta JSON recebida do servidor.');
  }

  const disposition = resp.headers.get('content-disposition') || '';
  const filename =
    getFilenameFromDisposition(disposition) ||
    `json_convert.${fmt === 'csv' ? 'csv' : 'xlsx'}`;

  const blob = await resp.blob();
  return { blob, filename };
}

/** Utilidade simples pra forçar download local */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
