// src/config/centralN1Config.js
//
// Catálogo dos recursos da Central N1 (exclusiva da equipe Suporte N1).
// A página CentralN1.jsx renderiza os cards a partir deste array, agrupando
// por `secao`. Cada item tem um `status`:
//   - 'ativo':      card clicável, navega para `rota`.
//   - 'em-breve':   card inerte, badge "Em breve" (sem rota — placeholder).
//   - 'desativado': card inerte e esmaecido, badge "Desativado" (sem rota).
//
// Os itens 'em-breve'/'desativado' são apenas placeholders VISUAIS — não há
// funcionalidade por trás deles ainda.
//
// `adminOnly: true` esconde o card de quem não é admin (a rota também é
// protegida por RotaProtegidaAdmin) — evita mostrar um card que redirecionaria.

export const centralN1Config = [
  // ── Operação ────────────────────────────────────────────────────────────
  {
    key: 'funil-tecnico',
    nome: 'Funil do Técnico',
    icone: 'pi pi-filter',
    rota: '/central-n1/funil-tecnico',
    status: 'ativo',
    ctaLabel: 'Abrir funil',
    secao: 'Operação',
    descricao: 'Visualize as negociações do funil agrupadas por estágio.',
  },

  // ── Análises & IA ─────────────────────────────────────────────────────────
  {
    key: 'analise-negativas',
    nome: 'Análise de Negativas',
    icone: 'pi pi-chart-pie',
    status: 'em-breve',
    secao: 'Análises & IA',
    descricao: 'Entenda os motivos de negativas e tendências do período.',
  },
  {
    key: 'dashboard-intercom',
    nome: 'Dashboard Intercom',
    icone: 'pi pi-comments',
    rota: '/intercom-dashboard',
    status: 'ativo',
    ctaLabel: 'Acessar',
    secao: 'Análises & IA',
    descricao: 'Métricas de atendimento e conversas consolidadas do Intercom.',
  },
  {
    key: 'auditoria-ia-cloudhuman',
    nome: 'Auditoria de IA (CloudHuman)',
    icone: 'pi pi-verified',
    rota: '/central-n1/auditoria-ia',
    status: 'ativo',
    ctaLabel: 'Auditar',
    secao: 'Análises & IA',
    descricao: 'Audite respostas geradas por IA com revisão assistida.',
  },

  // ── Utilitários ─────────────────────────────────────────────────────────
  {
    key: 'resumo-daily',
    nome: 'Resumo da Daily',
    icone: 'pi pi-list-check',
    rota: '/central-n1/resumo-daily',
    status: 'ativo',
    ctaLabel: 'Gerar resumo',
    adminOnly: true, // rota protegida por RotaProtegidaAdmin — só admin vê o card
    secao: 'Utilitários',
    descricao: 'Gere um resumo automático dos pontos da daily.',
  },
];

// Ordem fixa das seções na renderização.
export const CENTRAL_N1_SECTIONS = ['Operação', 'Análises & IA', 'Utilitários'];
