// demo/src/mock/jobs.js
//
// Jobs assíncronos simulados. As telas de Mesclagem, Extração de Chamados,
// Auditoria de Usuários e Changelog fazem polling de status — aqui o progresso
// é derivado do tempo decorrido desde o início, então as barras andam sozinhas.

import { int, pick, range, EMPRESAS, PESSOAS, AGENTES_N1, diasAtras } from './seed';

/** Cria um job cujo progresso (0→100) é função do tempo. */
function criarJob(duracaoMs) {
  return {
    inicio: 0,
    duracao: duracaoMs,
    cancelado: false,
    start() {
      this.inicio = Date.now();
      this.cancelado = false;
    },
    cancel() {
      this.cancelado = true;
    },
    /** Percentual 0-100. */
    pct() {
      if (!this.inicio) return 0;
      const decorrido = Date.now() - this.inicio;
      return Math.min(100, Math.round((decorrido / this.duracao) * 100));
    },
    status() {
      if (this.cancelado) return 'cancelled';
      if (!this.inicio) return 'idle';
      return this.pct() >= 100 ? 'done' : 'running';
    },
  };
}

// ─── Changelog (progresso da extração) ───────────────────────────────────────

const jobChangelog = criarJob(5200);

export function progressoChangelog() {
  // A primeira consulta de progresso inicia o cronômetro.
  if (!jobChangelog.inicio) jobChangelog.start();
  return Math.min(97, jobChangelog.pct());
}

export function resetarChangelog() {
  jobChangelog.inicio = 0;
}

// ─── Mesclagem de entidades ──────────────────────────────────────────────────

const jobMerge = criarJob(14000);
const TOTAL_MERGE = 46;

export function iniciarJobMerge() {
  jobMerge.start();
}

export function cancelarJobMerge() {
  jobMerge.cancel();
}

export function statusJobMerge() {
  const pct = jobMerge.pct();
  const status = jobMerge.status();
  const processados = Math.round((pct / 100) * TOTAL_MERGE);
  return {
    jobId: 'demo-merge-1',
    status: status === 'idle' ? 'running' : status,
    progress: pct,
    processed: processados,
    total: TOTAL_MERGE,
    merged: Math.round(processados * 0.62),
    skipped: Math.round(processados * 0.38),
    deleted: 0,
    hasFile: status === 'done',
    message: status === 'done'
      ? 'Mesclagem concluída — relatório disponível para download.'
      : `Analisando duplicidades… ${processados}/${TOTAL_MERGE}`,
    logs: range(Math.min(processados, 12), (i) => ({
      at: new Date().toISOString(),
      level: 'info',
      message: `Grupo G${i + 1}: mantido ${41000 + i * 2}, mesclado ${41001 + i * 2}`,
    })),
  };
}

// ─── Extração de chamados ────────────────────────────────────────────────────

const jobTickets = criarJob(11000);
const TOTAL_TICKETS = 22;

export function iniciarJobTickets() {
  jobTickets.start();
}

export function cancelarJobTickets() {
  jobTickets.cancel();
}

export function statusJobTickets() {
  const pct = jobTickets.pct();
  const status = jobTickets.status();
  const processados = Math.round((pct / 100) * TOTAL_TICKETS);
  return {
    jobId: 'demo-tickets-1',
    status: status === 'idle' ? 'running' : status,
    progress: pct,
    processed: processados,
    total: TOTAL_TICKETS,
    hasFile: status === 'done',
    info: status === 'done'
      ? 'Extração concluída — JSON pronto para download.'
      : `Coletando interações do chamado ${82000 + processados}…`,
    error: null,
  };
}

// ─── Auditoria de usuários (ZIP por usuário) ─────────────────────────────────

const jobAuditoria = criarJob(16000);
const USUARIOS_AUDITADOS = 4;

export function iniciarJobAuditoria() {
  jobAuditoria.start();
}

export function cancelarJobAuditoria() {
  jobAuditoria.cancel();
}

export function statusJobAuditoria(since = 0) {
  const pct = jobAuditoria.pct();
  const status = jobAuditoria.status();
  const totalLogs = 24;
  const logsGerados = Math.round((pct / 100) * totalLogs);

  const todosLogs = range(logsGerados, (i) => ({
    at: new Date(Date.now() - (logsGerados - i) * 600).toISOString(),
    level: i % 7 === 6 ? 'warn' : 'info',
    message: pick([
      `Coletando histórico de ${PESSOAS[i % PESSOAS.length]}`,
      `Página ${i + 1} de logs recebida`,
      `Montando planilha de ${PESSOAS[i % PESSOAS.length]}`,
      'Consolidando navegação por sessão',
    ]),
  }));

  return {
    jobId: 'demo-audit-users-1',
    status: status === 'idle' ? 'running' : status,
    progress: pct,
    total: USUARIOS_AUDITADOS,
    processed: Math.round((pct / 100) * USUARIOS_AUDITADOS),
    info: status === 'done'
      ? 'ZIP gerado com uma planilha por usuário.'
      : 'Extraindo histórico dos usuários selecionados…',
    logs: todosLogs.slice(since),
    logCount: todosLogs.length,
    error: null,
    hasFile: status === 'done',
    summary: status === 'done'
      ? {
        usuarios: USUARIOS_AUDITADOS,
        linhas: 1873,
        periodo: '30 dias',
        arquivos: USUARIOS_AUDITADOS,
      }
      : null,
  };
}
