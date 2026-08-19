// src/config/servicesCatalog.js
//
// Catálogo de serviços do N1 App.
// A visibilidade de cada serviço é determinada pela team do usuário
// (via TEAM_SERVICES em teamsConfig.js). O campo `key` de cada serviço
// é exatamente a service key usada no mapeamento.

import { SERVICE_KEYS, canAccessService } from './teamsConfig';

export const FAVORITE_SERVICES_STORAGE_KEY = 'n1app.favoriteServices';

export const servicesCatalog = [
  {
    key: SERVICE_KEYS.CHANGELOG,
    section: 'Extrações',
    label: 'Extração de Changelog',
    shortLabel: 'Changelog',
    icon: 'pi pi-database',
    url: '/changelog',
    description: 'Configure e extraia dados de alterações no sistema.',
  },
  {
    key: SERVICE_KEYS.USER_AUDIT,
    section: 'Extrações',
    label: 'Auditoria de Usuários',
    shortLabel: 'Auditoria de Usuários',
    icon: 'pi pi-history',
    url: '/auditoria-usuarios',
    description: 'Extraia o histórico de alterações e navegação de usuários em planilhas (uma por usuário) num ZIP.',
  },
  {
    key: SERVICE_KEYS.POWERBI,
    section: 'Extrações',
    label: 'Power BI',
    shortLabel: 'Power BI',
    icon: 'pi pi-chart-bar',
    url: '/powerbi',
    description: 'Consultar abas exportadas e ler links de dados.',
  },
  {
    key: SERVICE_KEYS.IMPORTATION,
    section: 'Extrações',
    label: 'Consulta de Importação',
    shortLabel: 'Consulta de Importação',
    icon: 'pi pi-upload',
    url: '/importation',
    description: 'Visualize dados, mapeamento e status das importações.',
  },
  {
    key: SERVICE_KEYS.JSONX,
    section: 'Extrações',
    label: 'Conversor JSON para Excel',
    shortLabel: 'JSON para Excel',
    icon: 'pi pi-file-excel',
    url: '/jsonx',
    description: 'Converta retornos JSON (com expands) em CSV/XLSX.',
  },
  {
    key: SERVICE_KEYS.ACCOUNT_DOCUMENTER,
    section: 'Extrações',
    label: 'Documentador de Contas',
    shortLabel: 'Documentador',
    icon: 'pi pi-file-export',
    url: '/account-documenter',
    description: 'Documente a configuração completa de uma conta: funis, automações, CPQ, perfis e uso.',
  },
  {
    key: SERVICE_KEYS.ACCOUNT_EXPORT,
    section: 'Extrações',
    label: 'Exportação de Base',
    shortLabel: 'Exportação de Base',
    icon: 'pi pi-cloud-download',
    url: '/account-export',
    description: 'Exporte todos os dados de uma conta (negócios, clientes, propostas, vendas…) em planilhas por entidade.',
  },
  {
    key: SERVICE_KEYS.KNOWLEDGE_COMPILER,
    section: 'Ferramentas',
    label: 'Compilador de Conhecimento',
    shortLabel: 'Compilador',
    icon: 'pi pi-book',
    url: '/services/knowledge-compiler',
    description: 'Transforme conteúdo bruto (casos, procedimentos, transcrições) em rascunho .md pronto para revisão e ingestão no RAG.',
  },
  {
    key: SERVICE_KEYS.OMIE,
    section: 'Integrações',
    label: 'Omie',
    shortLabel: 'Omie',
    icon: 'pi pi-sync',
    url: '/omie',
    description: 'Sincronizações (FirstSync/bring), forçar integração e consultar informações da conta.',
  },
  {
    key: SERVICE_KEYS.APIHUB,
    section: 'Integrações',
    label: 'Central da API',
    shortLabel: 'Central da API',
    icon: 'pi pi-link',
    url: '/apihub',
    description: 'Monte requisições, parâmetros OData e ações em massa com limite seguro.',
  },
  {
    key: SERVICE_KEYS.FIELD_EXPLORER,
    section: 'Ferramentas',
    label: 'Explorador de Campos',
    shortLabel: 'Explorador de Campos',
    icon: 'pi pi-sliders-h',
    url: '/field-explorer',
    description: 'Liste campos por entidade e diferencie campos nativos e dinâmicos.',
  },
  {
    key: SERVICE_KEYS.SANKHYA,
    section: 'Integrações',
    label: 'Sankhya',
    shortLabel: 'Sankhya',
    icon: 'pi pi-server',
    url: '/sankhya',
    description: 'Consultas de itens, teste de login, troca de token e busca de itens corrompidos.',
  },
  {
    key: SERVICE_KEYS.EMAILFIX,
    section: 'Ferramentas',
    label: 'Troca de e-mail',
    shortLabel: 'Troca de Email',
    icon: 'pi pi-at',
    url: '/emailfix',
    description: 'Troque e-mails de contas sem acesso ou inativas.',
  },
  {
    key: SERVICE_KEYS.ENTITY_MERGE,
    section: 'Ferramentas',
    label: 'Mesclagem de Entidades',
    shortLabel: 'Mesclagem de Entidades',
    icon: 'pi pi-clone',
    url: '/services/entity-merge',
    description: 'Detecte e mescle registros duplicados com geração de relatório CSV.',
  },
  {
    key: SERVICE_KEYS.PLOOMES_AUTOMACOES,
    section: 'Ferramentas',
    label: 'Consulta de Automações',
    shortLabel: 'Automações Ploomes',
    icon: 'pi pi-cog',
    url: '/ploomes-automacoes',
    description: 'Consulte todas as automações da conta, veja os campos nos filtros e ações e pesquise por campo específico.',
  },
  {
    key: SERVICE_KEYS.PROCESS_IMPLEMENTER,
    section: 'Ferramentas',
    label: 'Implementação Express',
    shortLabel: 'Implementação Express',
    icon: 'pi pi-bolt',
    url: '/process-implementer',
    description: 'Implemente automações e configurações padronizadas em contas Ploomes.',
  },
  {
    key: SERVICE_KEYS.QUEUES,
    section: 'Integrações',
    label: 'Filas por Shard',
    shortLabel: 'Filas por Shard',
    icon: 'pi pi-chart-line',
    url: '/queues',
    description: 'Consulte a quantidade de Webhooks e Automações em fila por shard.',
  },
  {
    key: SERVICE_KEYS.INTERCOM_TAGS,
    section: 'Intercom',
    label: 'Tags Intercom',
    shortLabel: 'Tags Intercom',
    icon: 'pi pi-tag',
    url: '/intercom-tags',
    description: 'Aplique marcadores em empresas ou contatos no Intercom com validação de IDs.',
  },
  {
    key: SERVICE_KEYS.INTERCOM_CHURN,
    section: 'Intercom',
    label: 'Buscas Intercom',
    shortLabel: 'Buscas Intercom',
    icon: 'pi pi-search',
    url: '/intercom-churn',
    description: 'Dispare fluxos de análise de churn no N8N por tag ou ID de empresa no Intercom.',
  },
  {
    key: SERVICE_KEYS.PLOOMES_TICKETS,
    section: 'Ferramentas',
    label: 'Extração de Chamados',
    shortLabel: 'Extração de Chamados',
    icon: 'pi pi-ticket',
    url: '/ploomes-tickets',
    description: 'Extraia o histórico de chamados (produto e manutenção) de um cliente em JSON para análise externa.',
  },
  {
    key: SERVICE_KEYS.COPILOT,
    section: 'Assistente',
    label: 'N1 Copilot',
    shortLabel: 'Copilot',
    icon: 'pi pi-sparkles',
    url: '/copilot',
    description: 'Assistente de IA para suporte e consultas internas.',
  },
];

export function isServiceVisible(service, teamId, profileId) {
  return canAccessService(service.key, teamId, profileId);
}

export function getVisibleServices(teamId, profileId) {
  return servicesCatalog.filter((service) => isServiceVisible(service, teamId, profileId));
}

export function groupServicesBySection(services) {
  return services.reduce((acc, service) => {
    if (!acc[service.section]) acc[service.section] = [];
    acc[service.section].push(service);
    return acc;
  }, {});
}

export function readFavoriteServiceKeys() {
  try {
    const raw = localStorage.getItem(FAVORITE_SERVICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((key) => typeof key === 'string');
  } catch {
    return [];
  }
}

export function writeFavoriteServiceKeys(keys) {
  const unique = Array.from(new Set(keys));
  localStorage.setItem(FAVORITE_SERVICES_STORAGE_KEY, JSON.stringify(unique));
  return unique;
}

export function toggleFavoriteServiceKey(serviceKey) {
  const current = readFavoriteServiceKeys();
  const exists = current.includes(serviceKey);
  const updated = exists
    ? current.filter((k) => k !== serviceKey)
    : [...current, serviceKey];

  writeFavoriteServiceKeys(updated);

  window.dispatchEvent(
    new CustomEvent('favorite-services-updated', {
      detail: { keys: updated },
    }),
  );

  return updated;
}
