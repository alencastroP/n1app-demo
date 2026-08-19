// src/config/ploomesTicketsPrompts.js
//
// 🔒 Conteúdo substituído nesta réplica.
// Os prompts reais descrevem a metodologia de análise de chamados do time e
// referenciam ferramentas internas. Aqui ficam textos genéricos, preservando
// os mesmos ids, títulos e ícones para a tela continuar idêntica.
//
// Cada build() recebe: { nome, periodoLabel, jsonFile }.

const rodape = (jsonFile) =>
  `\n\nO arquivo ${jsonFile} está anexado a esta conversa.` +
  '\n\n---\nPrompt de demonstração — o conteúdo real é de uso interno e não acompanha esta réplica.';

export const PLOOMES_TICKETS_PROMPTS = [
  {
    id: 'completo',
    icon: 'pi-sparkles',
    titulo: 'Análise completa (relatório + dashboard)',
    descricao: 'Revisão escrita dos chamados somada a um painel visual.',
    build: ({ nome, jsonFile }) =>
      `Faça uma análise completa dos chamados da conta ${nome} a partir do arquivo anexado.\n\n` +
      'Entregue duas partes:\n' +
      '1. Um relatório escrito em pt-BR com os principais problemas, causas e desfechos.\n' +
      '2. Um painel visual com a distribuição dos chamados por tema, status e período.' +
      rodape(jsonFile),
  },
  {
    id: 'revisao',
    icon: 'pi-file-edit',
    titulo: 'Só a revisão escrita',
    descricao: 'Texto corrido, sem gráficos, pronto para colar num documento.',
    build: ({ nome, jsonFile }) =>
      `Escreva uma revisão técnica em pt-BR dos chamados da conta ${nome}, ` +
      'a partir do arquivo anexado.\n\n' +
      'Organize por tema, cite os chamados que sustentam cada ponto e finalize ' +
      'com uma lista de recomendações.' +
      rodape(jsonFile),
  },
  {
    id: 'dashboard',
    icon: 'pi-chart-bar',
    titulo: 'Só o dashboard interativo (HTML)',
    descricao: 'Página única, sem dependências externas.',
    build: ({ nome, jsonFile }) =>
      `Gere um dashboard em HTML (página única, sem dependências externas) sobre ` +
      `os chamados da conta ${nome}, a partir do arquivo anexado.\n\n` +
      'Inclua: total por período, distribuição por tema, tempo médio de resolução ' +
      'e a lista de chamados com filtro por texto.' +
      rodape(jsonFile),
  },
  {
    id: 'pauta',
    icon: 'pi-calendar',
    titulo: 'Roteiro de pauta para reunião',
    descricao: 'Tópicos enxutos para conduzir uma conversa com o cliente.',
    build: ({ nome, jsonFile }) =>
      `Tenho reunião com o cliente ${nome} em {HORA_REUNIAO}. ` +
      'Monte um roteiro de pauta enxuto a partir do arquivo anexado.\n\n' +
      'Traga: o que foi resolvido no período, o que segue em aberto, ' +
      'riscos a mencionar e as perguntas que eu preciso fazer.' +
      rodape(jsonFile),
  },
  {
    id: 'aprofundamento',
    icon: 'pi-search-plus',
    titulo: 'Aprofundamento em um ponto específico',
    descricao: 'Investiga um tema isolado com mais profundidade.',
    build: ({ nome, jsonFile }) =>
      `Quero aprofundar UM ponto da conta ${nome}: {PONTO_ESPECIFICO}.\n\n` +
      'A partir do arquivo anexado, reúna tudo o que se relaciona com esse ponto: ' +
      'histórico, tentativas de solução, o que ficou pendente e o próximo passo sugerido.' +
      rodape(jsonFile),
  },
];

export function periodoToLabel(periodo, dataInicio) {
  const map = {
    '7d': 'últimos 7 dias',
    '30d': 'último mês',
    '6m': 'últimos 6 meses',
    '1y': 'último ano',
    all: 'todo o período',
  };
  if (periodo === 'custom') {
    return dataInicio ? `desde ${dataInicio}` : 'o período selecionado';
  }
  return map[periodo] || 'o período selecionado';
}
