// demo/src/mock/routes/ploomes.js
//
// Rotas dos serviços que o front chama DIRETO (sem passar pelo backend):
//   · api2.ploomes.com            — OData (Account, Users, Fields, Deals…)
//   · logs-api.ploomes.com        — contagem de logs do Changelog
//   · sankhya-query-api.ploomes.com — consultas do módulo Sankhya
//   · webhooks n8n                — disparos de fluxo
//
// Em modo demo nenhuma dessas chamadas sai da máquina: o interceptor devolve
// as respostas montadas aqui.

import { json } from '../http';
import { int, pick, range, EMPRESAS, PESSOAS } from '../seed';
import {
  CONTA_DEMO, USUARIOS_PLOOMES, camposDemo, registrosODataDemo, nomeEntidade,
} from '../fixtures';

/** Nome da entidade OData a partir do path (`/Deals(123)` → `Deals`). */
function entidadeDoPath(pathname) {
  const primeiro = pathname.replace(/^\//, '').split('/')[0] || '';
  return primeiro.split('(')[0];
}

/** Lê `$top` da query, com teto para não gerar listas absurdas na demo. */
function topDaQuery(url, padrao = 20) {
  const top = Number(url.searchParams.get('$top'));
  if (!Number.isFinite(top) || top <= 0) return padrao;
  return Math.min(top, 100);
}

export const rotasPloomes = [
  // ── api2.ploomes.com ──────────────────────────────────────────────────────
  {
    host: /(^|\.)api2\.ploomes\.com$/,
    handler: async ({ url, method }) => {
      const entidade = entidadeDoPath(url.pathname);

      // Escritas (PATCH/POST/DELETE) usadas pela Implementação Express:
      // a demo confirma sucesso sem alterar nada.
      if (method === 'PATCH' || method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      if (method === 'POST') {
        return json({ Id: int(90000, 99999), Name: 'Registro criado (demo)' }, { status: 201 });
      }

      if (/^Account$/i.test(entidade)) {
        return json({ value: [CONTA_DEMO] });
      }

      if (/^Users$/i.test(entidade)) {
        // `$filter=Id eq 71207` → devolve só aquele usuário.
        const filtro = url.searchParams.get('$filter') || '';
        const idFiltrado = /Id\s+eq\s+(\d+)/i.exec(filtro)?.[1];
        if (idFiltrado) {
          const achado = USUARIOS_PLOOMES.find((u) => u.Id === Number(idFiltrado));
          return json({ value: achado ? [achado] : [] });
        }
        return json({ value: USUARIOS_PLOOMES });
      }

      if (/^Fields$/i.test(entidade)) {
        const filtro = url.searchParams.get('$filter') || '';
        const entityId = Number(/Entity\/Id\s+eq\s+(\d+)/i.exec(filtro)?.[1]) || 1;
        return json({
          value: camposDemo(entityId).map((f) => ({
            Id: f.id,
            Key: f.key,
            Name: f.name,
            Dynamic: f.dynamic,
            TypeId: f.typeId,
            UpdatePropertyName: f.dynamic ? null : f.key,
            Entity: { Id: f.entityId, Name: nomeEntidade(f.entityId) },
            Options: f.options ?? [],
          })),
        });
      }

      if (/^(Pipelines|Stages)$/i.test(entidade)) {
        return json({
          value: range(5, (i) => ({
            Id: 500 + i,
            Name: ['Qualificação', 'Proposta', 'Negociação', 'Fechamento', 'Pós-venda'][i],
            Ordination: i + 1,
            PipelineId: 4100,
          })),
        });
      }

      return json({
        '@odata.count': 128,
        value: registrosODataDemo(entidade, topDaQuery(url)),
      });
    },
  },

  // ── logs-api.ploomes.com (contagem do Changelog) ──────────────────────────
  {
    host: /(^|\.)logs-api\.ploomes\.com$/,
    handler: async ({ url }) => {
      if (/ChangeLog\/Count/i.test(url.pathname)) {
        // O front usa esse número para avisar sobre o limite do perfil.
        return json(1240);
      }
      return json({ value: [] });
    },
  },

  // ── sankhya-query-api.ploomes.com ─────────────────────────────────────────
  {
    host: /(^|\.)sankhya-query-api\.ploomes\.com$/,
    handler: async () => json({
      status: '1',
      responseBody: {
        rows: range(6, (i) => [
          String(1200 + i),
          EMPRESAS[i % EMPRESAS.length],
          pick(['S', 'N']),
          String(int(1, 900)),
        ]),
        fieldsMetadata: [
          { name: 'CODPARC', label: 'Código' },
          { name: 'NOMEPARC', label: 'Parceiro' },
          { name: 'ATIVO', label: 'Ativo' },
          { name: 'CODVEND', label: 'Vendedor' },
        ],
      },
    }),
  },

  // ── Webhook de automação (Resumo da Daily, churn) ─────────────────────────
  // O host real foi substituído por `n8n.demo.invalid` nos services da réplica.
  {
    host: /^n8n\.demo\.invalid$/,
    handler: async () => json({
      ok: true,
      message: 'Fluxo n8n disparado em modo demonstração — nada foi enviado.',
      resumo: [
        '## Resumo da daily (demo)',
        '',
        '**Ontem:** fila de chamados reduzida em 18%; dois casos de integração escalados ao produto.',
        '**Hoje:** revisar pendências do cliente Aurora e fechar a triagem do funil técnico.',
        '**Bloqueios:** aguardando retorno do time de produto sobre o webhook duplicado.',
      ].join('\n'),
    }),
  },
];
