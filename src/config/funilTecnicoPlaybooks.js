// src/config/funilTecnicoPlaybooks.js
//
// Playbooks do Funil do Técnico: mapa `categoria` (da triagem da IA) → passos de
// "caso recorrente". Config-driven, para reaproveitar os serviços N1 que JÁ
// resolvem cada tipo de caso, sem duplicar lógica de resolução.
//
// Cada passo tem um `tipo`:
//   - 'service' : deep-link para um serviço N1 existente (abre por `url`).
//   - 'manual'  : ação manual do técnico (ex.: rodar query no Dynatrace).
//   - 'ia'      : ação de IA (Fase C, gated). `iaKind`: 'rag' (base interna) | 'deep' (conta do cliente).
//
// `serviceKey` é metadado (validação/telemetria); a navegação usa `url`.

import { SERVICE_KEYS } from './teamsConfig';
import { CASE_TYPES, categoriaParaTipo, normalizeCategoria as normalizeCat } from './caseTaxonomy';

export const PLAYBOOK_STEP = { SERVICE: 'service', MANUAL: 'manual', IA: 'ia' };

// Query padrão sugerida para o passo Dynatrace (o técnico ajusta os filtros).
export const DYNATRACE_HINT =
  'fetch spans | filter status_code >= 400 | fields start_time, span.name, url.path, status_code, duration';

// Passos de IA reutilizados em vários playbooks (mantidos como fábricas p/ não
// compartilhar a mesma referência de objeto entre categorias).
const ragStep = () => ({
  tipo: PLAYBOOK_STEP.IA,
  iaKind: 'rag',
  label: 'Triagem com IA (base interna)',
  descricao: 'Consulta a base de conhecimento N1 (RAG). Não envia dados do cliente.',
  icon: 'pi pi-book',
});

const deepStep = () => ({
  tipo: PLAYBOOK_STEP.IA,
  iaKind: 'deep',
  label: 'Diagnóstico profundo na conta do cliente',
  descricao: 'IA investiga a conta do cliente (somente leitura). Requer aprovação de privacidade (LGPD).',
  icon: 'pi pi-sparkles',
  // Só habilita quando o briefing tem identificador do CLIENTE a investigar
  // (extractClientTargets → !semAlvo). Sem alvo, fica desabilitado com tooltip.
  requiresTarget: true,
});

const dynatraceStep = () => ({
  tipo: PLAYBOOK_STEP.MANUAL,
  label: 'Coletar logs no Dynatrace',
  descricao: 'Rode a query sugerida, cole os logs obtidos e anexe-os para alimentar a análise.',
  icon: 'pi pi-search',
  dynatrace: true,
  query: DYNATRACE_HINT,
});

// ── Mapa categoria → playbook ────────────────────────────────────────────────
// As chaves são normalizadas (minúsculas, sem acento) — ver normalizeCategoria.
const PLAYBOOKS = {
  integracao: {
    label: 'Integração',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Revisar automação de integração',
        descricao: 'Confira a automação que dispara o envio e o endpoint configurado.',
        icon: 'pi pi-cog',
        url: '/ploomes-automacoes',
        serviceKey: SERVICE_KEYS.PLOOMES_AUTOMACOES,
      },
      dynatraceStep(),
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Testar o endpoint na Central da API',
        descricao: 'Reproduza a requisição com parâmetros OData e valide o retorno.',
        icon: 'pi pi-link',
        url: '/apihub',
        serviceKey: SERVICE_KEYS.APIHUB,
      },
      deepStep(),
    ],
  },

  automacoes: {
    label: 'Automações',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Consultar automações da conta',
        descricao: 'Liste as automações, veja os campos usados em filtros e ações.',
        icon: 'pi pi-cog',
        url: '/ploomes-automacoes',
        serviceKey: SERVICE_KEYS.PLOOMES_AUTOMACOES,
      },
      ragStep(),
      deepStep(),
    ],
  },

  campos: {
    label: 'Campos',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Explorar campos da entidade',
        descricao: 'Liste campos (nativos e dinâmicos) e identifique duplicados/divergências.',
        icon: 'pi pi-sliders-h',
        url: '/field-explorer',
        serviceKey: SERVICE_KEYS.FIELD_EXPLORER,
      },
      ragStep(),
      deepStep(),
    ],
  },

  cpq: {
    label: 'CPQ',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Explorar campos do CPQ',
        descricao: 'Verifique os campos de produto/proposta envolvidos no cálculo.',
        icon: 'pi pi-sliders-h',
        url: '/field-explorer',
        serviceKey: SERVICE_KEYS.FIELD_EXPLORER,
      },
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Inspecionar via Central da API',
        descricao: 'Consulte produtos, grupos e regras diretamente pela API.',
        icon: 'pi pi-link',
        url: '/apihub',
        serviceKey: SERVICE_KEYS.APIHUB,
      },
      deepStep(),
    ],
  },

  workflow: {
    label: 'Workflow',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Revisar automações do workflow',
        descricao: 'Confira gatilhos, filtros e ações do fluxo em questão.',
        icon: 'pi pi-cog',
        url: '/ploomes-automacoes',
        serviceKey: SERVICE_KEYS.PLOOMES_AUTOMACOES,
      },
      dynatraceStep(),
      deepStep(),
    ],
  },

  sankhya: {
    label: 'Sankhya',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Abrir ferramentas Sankhya',
        descricao: 'Consulte itens, teste login/token e busque itens corrompidos.',
        icon: 'pi pi-server',
        url: '/sankhya',
        serviceKey: SERVICE_KEYS.SANKHYA,
      },
      dynatraceStep(),
      deepStep(),
    ],
  },
};

// Playbook genérico quando a categoria não tem mapa específico (ou vem ausente).
// = playbook do CASE_TYPE OUTRO: orientação base — RAG + diagnóstico profundo.
// NUNCA deixa o Plano de Ação vazio.
const DEFAULT_PLAYBOOK = {
  label: 'Geral',
  steps: [
    {
      tipo: PLAYBOOK_STEP.SERVICE,
      label: 'Inspecionar via Central da API',
      descricao: 'Reproduza a consulta e valide o dado direto na API.',
      icon: 'pi pi-link',
      url: '/apihub',
      serviceKey: SERVICE_KEYS.APIHUB,
    },
    ragStep(),
    deepStep(),
  ],
};

// ── Playbooks por CASE_TYPE (taxonomia) ──────────────────────────────────────
// Usados quando a categoria não tem playbook específico acima. As categorias
// com playbook próprio (integracao, automacoes, campos, cpq, workflow, sankhya)
// continuam preferidas — são mais finas que o tipo.
const CASE_TYPE_PLAYBOOKS = {
  [CASE_TYPES.LOGS]: {
    label: 'Logs / performance',
    steps: [
      {
        ...dynatraceStep(),
        label: 'Gerar e rodar query de logs (Dynatrace)',
        descricao: 'Use a query sugerida (ajuste os filtros ao caso), rode no Dynatrace e cole os logs para alimentar a análise.',
      },
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Consultar registros via API Ploomes',
        descricao: 'Valide changelog/registros do objeto afetado com um GET escopado na Central da API.',
        icon: 'pi pi-database',
        url: '/apihub',
        serviceKey: SERVICE_KEYS.APIHUB,
      },
      ragStep(),
      deepStep(),
    ],
  },

  [CASE_TYPES.AUTOMACAO]: {
    label: 'Automação / fórmulas',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Inspecionar automações da conta',
        descricao: 'Liste as automações do cliente, filtros e preenchimentos — localize a automação citada no caso.',
        icon: 'pi pi-cog',
        url: '/ploomes-automacoes',
        serviceKey: SERVICE_KEYS.PLOOMES_AUTOMACOES,
      },
      ragStep(),
      deepStep(),
    ],
  },

  [CASE_TYPES.CAMPOS]: {
    label: 'Campos / formulários',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Inspecionar campos da entidade',
        descricao: 'Liste os campos (nativos e dinâmicos), keys e opções — confira o campo citado no caso.',
        icon: 'pi pi-sliders-h',
        url: '/field-explorer',
        serviceKey: SERVICE_KEYS.FIELD_EXPLORER,
      },
      ragStep(),
      deepStep(),
    ],
  },

  [CASE_TYPES.BULK]: {
    label: 'Ajuste em massa',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Atualização em massa (Central da API)',
        descricao: 'Monte a atualização em massa (bulk/faixas) com validação antes de executar.',
        icon: 'pi pi-bolt',
        url: '/apihub',
        serviceKey: SERVICE_KEYS.APIHUB,
      },
      {
        tipo: PLAYBOOK_STEP.MANUAL,
        label: 'Planejar o ajuste massivo',
        descricao: 'Levante o de-para (planilha do cliente), o filtro exato dos registros e valide uma amostra antes do lote inteiro.',
        icon: 'pi pi-list-check',
      },
      ragStep(),
      deepStep(),
    ],
  },

  [CASE_TYPES.INTEGRACAO]: {
    label: 'Integração',
    steps: [
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Revisar automação de integração',
        descricao: 'Confira a automação que dispara o envio e o endpoint configurado.',
        icon: 'pi pi-cog',
        url: '/ploomes-automacoes',
        serviceKey: SERVICE_KEYS.PLOOMES_AUTOMACOES,
      },
      dynatraceStep(),
      {
        tipo: PLAYBOOK_STEP.SERVICE,
        label: 'Testar o endpoint na Central da API',
        descricao: 'Reproduza a requisição com parâmetros OData e valide o retorno.',
        icon: 'pi pi-link',
        url: '/apihub',
        serviceKey: SERVICE_KEYS.APIHUB,
      },
      deepStep(),
    ],
  },

  [CASE_TYPES.OUTRO]: DEFAULT_PLAYBOOK,
};

/** Normalização da categoria agora vive em caseTaxonomy (re-export p/ compat). */
export const normalizeCategoria = normalizeCat;

/**
 * Retorna o playbook da categoria informada, na ordem de preferência:
 *   1. playbook específico da categoria (mais fino);
 *   2. playbook do CASE_TYPE da taxonomia (categoriaParaTipo);
 *   3. genérico (OUTRO) — nunca vazio.
 * @param {string} categoria
 * @returns {{ label:string, steps:Array<object> }}
 */
export function getPlaybook(categoria) {
  const key = normalizeCategoria(categoria);
  return PLAYBOOKS[key] || CASE_TYPE_PLAYBOOKS[categoriaParaTipo(categoria)] || DEFAULT_PLAYBOOK;
}

// ── Resolver dirigido pela triagem (Fase C) ─────────────────────────────────
// Queries Dynatrace por categoria: mesma base do DYNATRACE_HINT, com filtro
// específico do domínio. O técnico ajusta os filtros antes de rodar.
const DYNATRACE_QUERIES = {
  integracao:
    "fetch spans | filter status_code >= 400 | filter contains(url.path, 'webhook') or contains(span.name, 'integration') | fields start_time, span.name, url.path, status_code, duration",
  workflow:
    "fetch spans | filter status_code >= 400 | filter contains(span.name, 'workflow') or contains(span.name, 'automation') | fields start_time, span.name, url.path, status_code, duration",
  sankhya:
    "fetch spans | filter status_code >= 400 | filter contains(url.path, 'sankhya') | fields start_time, span.name, url.path, status_code, duration",
};

/**
 * Monta o plano de ação de um caso a partir do playbook da categoria E dos
 * dados da triagem do n8n (Fase C). Mantém o formato tipado dos passos
 * ('service' | 'manual' | 'ia'); apenas enriquece/acrescenta:
 *   - passo Dynatrace ganha a query sugerida (da triagem quando existir —
 *     campo futuro `dynatrace_query` — senão o template da categoria);
 *   - caso recorrente com resolução rápida ganha um 1º passo "Aplicar correção
 *     mapeada" com `writeGated: true` (implicaria escrita no Ploomes — fora do
 *     escopo atual; o CTA renderiza desabilitado, "Disponível em breve").
 *
 * @param {object|null} caso     caso derivado (data.js)
 * @param {object|null} triagem  JSON da pré-triagem do n8n (pode ser null)
 * @returns {{ label:string, steps:Array<object> }}
 */
export function resolvePlaybook(caso, triagem) {
  const categoria = triagem?.categoria ?? caso?.categoria;
  const base = getPlaybook(categoria);
  const key = normalizeCategoria(categoria);
  const steps = base.steps.map((s) => ({ ...s }));

  for (const step of steps) {
    if (step.tipo === PLAYBOOK_STEP.MANUAL && step.dynatrace) {
      const daTriagem =
        typeof triagem?.dynatrace_query === 'string' && triagem.dynatrace_query.trim()
          ? triagem.dynatrace_query.trim()
          : null;
      step.query = daTriagem || DYNATRACE_QUERIES[key] || step.query || DYNATRACE_HINT;
      if (daTriagem) {
        step.descricao = `Query sugerida pela pré-triagem da IA. ${step.descricao}`;
      }
    }
  }

  if (triagem?.recorrente_mapeado && triagem?.resolucao_rapida) {
    steps.unshift({
      tipo: PLAYBOOK_STEP.MANUAL,
      label: 'Aplicar correção mapeada',
      descricao:
        typeof triagem.resolucao_rapida === 'string'
          ? triagem.resolucao_rapida
          : 'Correção recorrente mapeada pela pré-triagem, com alta confiança de resolução.',
      icon: 'pi pi-check-circle',
      writeGated: true, // escrita no Ploomes — fase futura
    });
  }

  return { label: base.label, steps, caseType: categoriaParaTipo(categoria) };
}

export { PLAYBOOKS, DEFAULT_PLAYBOOK, CASE_TYPE_PLAYBOOKS };
