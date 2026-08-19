// demo/src/mock/seed.js
//
// Gerador determinístico: a demo mostra sempre os MESMOS dados a cada reload
// (bom para print, apresentação e gravação de vídeo). Nada aqui vem de API.

let _state = 0x2f6e2b1;

/** Reinicia a sequência — permite gerar o mesmo bloco de dados N vezes. */
export function reseed(n = 0x2f6e2b1) {
  _state = n;
}

/** PRNG xorshift32 — [0, 1). */
export function rnd() {
  _state ^= _state << 13;
  _state ^= _state >>> 17;
  _state ^= _state << 5;
  _state >>>= 0;
  return _state / 0xffffffff;
}

export function int(min, max) {
  return min + Math.floor(rnd() * (max - min + 1));
}

export function pick(arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

export function pickMany(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  }
  return out;
}

export function chance(p) {
  return rnd() < p;
}

/** Data ISO com N dias (e horas aleatórias) no passado. */
export function diasAtras(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(int(8, 19), int(0, 59), int(0, 59), 0);
  return d.toISOString();
}

export function range(n, fn) {
  return Array.from({ length: n }, (_, i) => fn(i));
}

// ─── Pools de nomes fictícios ────────────────────────────────────────────────
// Empresas e pessoas inventadas: nenhuma corresponde a cliente real.

export const EMPRESAS = [
  'Aurora Componentes', 'Bracatinga Alimentos', 'Cortex Logística', 'Delta Nove Engenharia',
  'Estúdio Malva', 'Farol Distribuidora', 'Grão Norte Agro', 'Helios Energia',
  'Ígneo Metalurgia', 'Jacarandá Móveis', 'Kaleido Design', 'Lumen Serviços',
  'Marumbi Transportes', 'Nirvana Cosméticos', 'Orion Telecom', 'Pampa Sementes',
  'Quartzo Mineração', 'Rota Verde Turismo', 'Solaris Climatização', 'Tapajós Papel',
  'Umbu Bebidas', 'Vertex Software', 'Wagner Ferramentas', 'Xerém Construções',
  'Yaguará Pescados', 'Zênite Consultoria', 'Amarilis Química', 'Bordô Vinhos',
  'Cascavel Autopeças', 'Dunas Hotelaria',
];

export const PESSOAS = [
  'Ana Beatriz Rocha', 'Bruno Tavares', 'Camila Nogueira', 'Diego Marchetti',
  'Elisa Vasconcelos', 'Fábio Rezende', 'Giovana Prado', 'Henrique Baldin',
  'Isadora Lemes', 'João Vitor Serra', 'Karina Mesquita', 'Leandro Bugalho',
  'Mariana Cardoso', 'Nelson Aguiar', 'Olívia Fontes', 'Paulo Ribas',
  'Queila Moraes', 'Rafael Antunes', 'Sabrina Duarte', 'Thiago Peixoto',
  'Ubirajara Neto', 'Valentina Cruz', 'Wesley Amorim', 'Yasmin Barreto',
];

export const AGENTES_N1 = [
  'Ana Beatriz Rocha', 'Bruno Tavares', 'Camila Nogueira', 'Diego Marchetti',
  'Elisa Vasconcelos', 'Fábio Rezende', 'Giovana Prado', 'Henrique Baldin',
];

/** E-mail fictício derivado do nome (domínio .invalid nunca resolve). */
export function emailDe(nome, dominio = 'exemplo.invalid') {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/[^a-z ]/g, '')
    .split(' ')
    .slice(0, 2)
    .join('.');
  return `${slug}@${dominio}`;
}
