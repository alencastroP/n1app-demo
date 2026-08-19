// src/services/dailyResumeService.js
//
// ARQUITETURA ATUALIZADA:
// 1. Envia os arquivos de áudio para o backend, que transcreve no Groq Whisper
//    (a GROQ_API_KEY vive server-side — o browser nunca recebe a chave).
// 2. Concatena as transcrições em texto puro.
// 3. Envia APENAS o texto + metadata pro n8n (sem binários — resolve o bug do /tmp no Heroku).

import { apiFetchRaw } from './http';

const N8N_WEBHOOK_URL = 'https://n8n.demo.invalid/webhook/daily-demo';
const TIMEOUT_MS = 300_000; // 5 minutos (transcrição pode demorar mais)

/**
 * Transcreve os arquivos de áudio via backend (Groq Whisper).
 * @param {File[]} files
 * @param {AbortSignal} signal
 * @returns {Promise<Array<{ name: string, text: string }>>} transcrições na ordem dos arquivos
 */
async function transcribeFiles(files, signal) {
  const form = new FormData();
  for (const file of files) {
    form.append('files', file, file.name);
  }

  // apiFetchRaw injeta o Authorization e lança em erro; não setamos Content-Type
  // para o browser definir o boundary do multipart automaticamente.
  const resp = await apiFetchRaw('/api/daily-resume/transcribe', {
    method: 'POST',
    body: form,
    signal,
  });

  const data = await resp.json();
  return Array.isArray(data?.transcriptions) ? data.transcriptions : [];
}

/**
 * Transcreve todos os arquivos de áudio e envia o texto consolidado pro n8n.
 * @param {File[]} audioFiles - Arquivos de áudio (WAV, OGG, MP3, FLAC)
 * @param {string} uploadadoPor - Nome do usuário logado
 * @param {AbortSignal} [signal] - Sinal para cancelamento externo
 * @param {(msg: string) => void} [onProgress] - Callback de progresso (opcional)
 * @returns {Promise<{ ok: true, summary: string, transcription: string }>}
 */
export async function sendDailyAudio(audioFiles, uploadadoPor, signal, onProgress) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const combinedSignal = signal
    ? combineSignals(signal, controller.signal)
    : controller.signal;

  try {
    // ── ETAPA 1: Transcrição no backend (Groq) ───────────────────────────────
    const plural = audioFiles.length > 1 ? 's' : '';
    onProgress?.(`Transcrevendo ${audioFiles.length} arquivo${plural} de áudio...`);

    const results = await transcribeFiles(audioFiles, combinedSignal);

    // Reconstrói o texto consolidado preservando o label por track (comportamento anterior).
    const transcriptions = results.map((r, i) => {
      const label = audioFiles.length > 1 ? `[Track ${i + 1} — ${r.name}]\n` : '';
      return label + (r.text || '');
    });

    const fullTranscription = transcriptions.join('\n\n').trim();

    if (!fullTranscription) {
      throw new Error('Transcrição vazia — nenhuma fala detectada nos arquivos enviados.');
    }

    // ── ETAPA 2: Envia texto puro pro n8n (sem binários) ─────────────────────
    onProgress?.('Gerando resumo com IA...');

    const metadata = {
      voiceChannel: 'daily',
      uploadadoPor,
      participants: [],
      summaryChannelId: '1496673002706829522',
      startedAt: Date.now(), // milissegundos — correto para o n8n
    };

    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcription: fullTranscription,
        metadata,
      }),
      signal: combinedSignal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Erro n8n ${resp.status}: ${text.slice(0, 300)}`);
    }

    const data = await resp.json();
    if (!data?.ok || !data?.summary) {
      throw new Error('Resposta inesperada do servidor de resumo.');
    }

    return {
      ok: true,
      summary: data.summary,
      transcription: data.transcription ?? fullTranscription,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function combineSignals(...signals) {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig?.aborted) { controller.abort(); break; }
    sig?.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
