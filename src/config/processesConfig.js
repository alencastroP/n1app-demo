import { profiles } from './permissionsConfig';

export const processesConfig = [
  {
    slug: 'roleta-usuarios',
    nome: 'Roleta de Usuários',
    descricao:
      'Distribui negócios automaticamente entre responsáveis usando round-robin. A cada novo negócio criado nos funis selecionados, o sistema atribui o próximo responsável da lista de forma cíclica, sem intervenção manual.',
    icone: 'pi pi-sync',
    requisitos: [
      'Funil ativo com etapas configuradas',
      'Pelo menos 2 usuários ativos e não suspensos na conta',
      'Permissão para criar campos, filtros e automações na conta',
    ],
    requiredProfile: null,
  },
  {
    slug: 'sla-cards',
    nome: 'SLA de Cards',
    descricao:
      'Rastreia o tempo de permanência de negócios em cada etapa do funil. Cria campos de data de entrada/saída e campos de cálculo (dias e/ou horas) para cada etapa, populados automaticamente por automações nativas do Ploomes.',
    icone: 'pi pi-clock',
    requisitos: [
      'Funil ativo com etapas configuradas',
      'Permissão para criar campos, filtros e automações na conta',
    ],
    requiredProfile: null,
  },
  {
    slug: 'volume-compras',
    nome: 'Volume de Compras',
    descricao:
      'Calcula automaticamente o volume de negócios ganhos por cliente. Cria 5 campos de moeda no Cliente (mês, mês passado, ano, ano passado e total) e as automações que somam ao ganhar e subtraem ao perder, reabrir ou excluir um negócio — mantendo os valores corretos nas viradas de mês e ano.',
    icone: 'pi pi-dollar',
    requisitos: [
      'Pelo menos 1 funil ativo',
      'Permissão para criar campos, filtros e automações na conta',
    ],
    requiredProfile: null,
  },
];
