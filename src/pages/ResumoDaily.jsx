// src/pages/ResumoDaily.jsx
//
// Página standalone "Resumo da Daily" — Central N1.
// Admin-only (a rota já está protegida em App.jsx com RotaProtegidaAdmin).
// Visual irmão de CentralN1.jsx: tokens DS + useDarkMode() + transient prop $dm.
// Sem sistema de chat, sem session — estado local puro.

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import { sendDailyAudio } from '../services/dailyResumeService';
import {
  createColors,
  createShadows,
  palette,
  radius,
  presets,
  durations,
  easings,
} from '../design-system/tokens';

/* ── helpers de tema ──────────────────────────────────────────────────────── */
const c  = (dm) => createColors(dm ? 'dark' : 'light');
const sh = (dm) => createShadows(dm ? 'dark' : 'light');

/* ── keyframes ────────────────────────────────────────────────────────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/* ── layout ───────────────────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100%;
  padding: 2rem clamp(1.25rem, 4vw, 3rem) 4rem;
  background: ${({ $dm }) => c($dm).bg.app};
  color: ${({ $dm }) => c($dm).text.primary};
  transition: ${presets.color};
  animation: ${fadeIn} 0.35s ease;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  border-radius: ${radius.full};
  border: 1px solid ${({ $dm }) => ($dm ? 'rgba(171,130,255,0.30)' : 'rgba(116,67,246,0.22)')};
  background: transparent;
  color: ${({ $dm }) => c($dm).primary};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: ${presets.base};
  i { font-size: 0.78rem; }

  &:hover {
    background: ${({ $dm }) => c($dm).primarySoft};
    border-color: ${({ $dm }) => c($dm).primary};
  }
`;

/* ── conteúdo principal ───────────────────────────────────────────────────── */
const ContentCard = styled.div`
  background: ${({ $dm }) => c($dm).bg.surface};
  border: 1px solid ${({ $dm }) => c($dm).border.default};
  border-radius: ${radius.xl};
  box-shadow: ${({ $dm }) => sh($dm)[2]};
  padding: 2rem;
  max-width: 680px;
  animation: ${fadeIn} 0.3s ease;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ $dm }) => c($dm).text.muted};
`;

/* ── upload zone ──────────────────────────────────────────────────────────── */
const UploadZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px dashed
    ${({ $dm, $hasFiles }) =>
      $hasFiles
        ? palette.purple[500]
        : ($dm ? palette.neutralDark[300] : palette.neutralLight[200])};
  border-radius: ${radius.lg};
  background: ${({ $dm, $hasFiles }) =>
    $hasFiles
      ? ($dm ? 'rgba(116,67,246,0.10)' : 'rgba(116,67,246,0.04)')
      : c($dm).bg.sunken};
  cursor: pointer;
  transition: border-color ${durations.base} ${easings.standard},
              background   ${durations.base} ${easings.standard};
  text-align: center;

  &:hover {
    border-color: ${palette.purple[500]};
    background: ${({ $dm }) =>
      $dm ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.06)'};
  }
`;

const UploadInput = styled.input`
  display: none;
`;

const UploadIcon = styled.span`
  font-size: 2rem;
`;

const UploadText = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ $dm }) => ($dm ? palette.purple[300] : palette.purple[700])};
`;

const UploadSub = styled.span`
  font-size: 0.75rem;
  color: ${({ $dm }) => c($dm).text.muted};
`;

/* ── file list ────────────────────────────────────────────────────────────── */
const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.75rem;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.7rem;
  border-radius: ${radius.md};
  background: ${({ $dm }) => ($dm ? palette.neutralDark[100] : palette.purple[50])};
  border: 1px solid ${({ $dm }) => ($dm ? palette.neutralDark[200] : palette.purple[200])};
  font-size: 0.82rem;
  color: ${({ $dm }) => ($dm ? palette.purple[300] : palette.purple[700])};
  animation: ${slideUp} 0.2s ease;
`;

const FileIcon = styled.i`
  color: ${palette.purple[500]};
  flex-shrink: 0;
`;

const FileSize = styled.span`
  font-size: 0.72rem;
  opacity: 0.6;
  margin-left: 2px;
`;

const FileRemove = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${palette.danger[500]};
  padding: 0 2px;
  margin-left: auto;
  font-size: 0.8rem;
  opacity: 0.65;
  flex-shrink: 0;
  transition: opacity ${durations.fast} ${easings.standard};

  &:hover { opacity: 1; }
`;

/* ── action bar ───────────────────────────────────────────────────────────── */
const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: ${radius.md};
  border: none;
  background: ${palette.purple[500]};
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background ${durations.fast} ${easings.standard},
              box-shadow  ${durations.fast} ${easings.standard};

  &:hover:not(:disabled) {
    background: ${palette.purple[600]};
    box-shadow: 0 4px 14px rgba(116,67,246,0.35);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i { font-size: 0.88rem; }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border-radius: ${radius.md};
  border: 1.5px solid ${({ $dm }) =>
    $dm ? 'rgba(171,130,255,0.35)' : 'rgba(116,67,246,0.30)'};
  background: transparent;
  color: ${({ $dm }) => c($dm).primary};
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background ${durations.fast} ${easings.standard};

  &:hover:not(:disabled) {
    background: ${({ $dm }) => c($dm).primarySoft};
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  i { font-size: 0.85rem; }
`;

const Hint = styled.p`
  font-size: 0.78rem;
  color: ${({ $dm }) => c($dm).text.muted};
  margin: ${({ $mt }) => $mt ?? '0.4rem'} 0 0;
`;

/* ── progress / sending ───────────────────────────────────────────────────── */
const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.8rem 1rem;
  border-radius: ${radius.md};
  background: ${({ $dm }) => ($dm ? palette.neutralDark[100] : palette.purple[50])};
  border: 1px solid ${({ $dm }) => ($dm ? palette.neutralDark[200] : palette.purple[200])};
  margin-top: 1rem;
  font-size: 0.88rem;
  color: ${({ $dm }) => c($dm).text.secondary};
  animation: ${fadeIn} 0.3s ease;

  i {
    color: ${palette.purple[500]};
    font-size: 1rem;
    animation: ${css`${spin} 0.9s linear infinite`};
  }
`;

/* ── summary card ─────────────────────────────────────────────────────────── */
const SummaryCard = styled.div`
  background: ${({ $dm }) => c($dm).bg.surface};
  border: 1px solid ${({ $dm }) => c($dm).border.default};
  border-radius: ${radius.lg};
  padding: 1.1rem 1.25rem;
  font-size: 0.9rem;
  color: ${({ $dm }) => c($dm).text.primary};
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: ${({ $dm }) => sh($dm)[1]};
  animation: ${slideUp} 0.3s ease;
`;

/* ── transcription details ────────────────────────────────────────────────── */
const TranscriptionDetails = styled.details`
  margin-top: 0.75rem;
  animation: ${slideUp} 0.3s ease;

  summary {
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 600;
    color: ${({ $dm }) => c($dm).text.muted};
    padding: 0.45rem 0.75rem;
    border-radius: ${radius.md};
    border: 1px solid ${({ $dm }) => c($dm).border.default};
    background: ${({ $dm }) => c($dm).bg.sunken};
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    user-select: none;
    transition: background ${durations.fast} ${easings.standard},
                border-color ${durations.fast} ${easings.standard};

    &::-webkit-details-marker { display: none; }

    &:hover {
      background: ${({ $dm }) => c($dm).primarySoft};
      border-color: ${palette.purple[500]};
      color: ${palette.purple[500]};
    }
  }

  &[open] summary {
    border-color: ${palette.purple[500]};
    color: ${palette.purple[500]};
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
  }
`;

const TranscriptionBody = styled.div`
  background: ${({ $dm }) => c($dm).bg.sunken};
  border: 1px solid ${palette.purple[500]};
  border-top: none;
  border-bottom-left-radius: ${radius.md};
  border-bottom-right-radius: ${radius.md};
  padding: 0.8rem 1rem;
  font-size: 0.8rem;
  color: ${({ $dm }) => c($dm).text.secondary};
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 340px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.3) transparent;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(116,67,246,0.3);
    border-radius: 4px;
  }
`;

/* ── error state ──────────────────────────────────────────────────────────── */
const ErrorBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  border-radius: ${radius.md};
  background: ${({ $dm }) => c($dm).dangerSoft};
  border: 1px solid ${({ $dm }) => ($dm ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.25)')};
  color: ${({ $dm }) => ($dm ? palette.danger[500] : palette.danger[700])};
  font-size: 0.88rem;
  line-height: 1.5;
  animation: ${fadeIn} 0.25s ease;

  i { flex-shrink: 0; margin-top: 2px; }
`;

/* ── divider ──────────────────────────────────────────────────────────────── */
const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ $dm }) => c($dm).border.default};
  margin: 1.5rem 0;
`;

/* ── componente principal ─────────────────────────────────────────────────── */
export default function ResumoDaily() {
  const { darkMode: dm } = useDarkMode();
  const navigate = useNavigate();

  // Máquina de fases: null (idle) → 'awaiting-files' → 'sending' → 'done' | 'error'
  const [phase, setPhase] = useState('awaiting-files');
  const [files, setFiles] = useState([]);         // File[]
  const [summary, setSummary] = useState('');
  const [transcription, setTranscription] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const abortRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cancela qualquer requisição pendente ao desmontar
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  /* ── handlers ──────────────────────────────────────────────────────────── */
  const handleFilesChange = useCallback((e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles((prev) => {
      const existing = prev.map((f) => f.name);
      const fresh = selected.filter((f) => !existing.includes(f.name));
      return [...prev, ...fresh];
    });
    e.target.value = '';
  }, []);

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSend = useCallback(async () => {
    if (files.length === 0 || phase !== 'awaiting-files') return;

    const userName = localStorage.getItem('userName') || 'Usuário';
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('sending');
    setProgressMsg('Iniciando...');
    setErrorMsg('');

    try {
      const result = await sendDailyAudio(
        [...files],
        userName,
        controller.signal,
        (msg) => setProgressMsg(msg),
      );

      setSummary(result.summary);
      setTranscription(result.transcription ?? '');
      setPhase('done');
    } catch (err) {
      if (err.name === 'AbortError') return; // cancelado pelo usuário — silêncio
      setErrorMsg(err?.message || 'Erro ao processar o áudio. Tente novamente.');
      setPhase('error');
    } finally {
      abortRef.current = null;
    }
  }, [files, phase]);

  const handleReset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setFiles([]);
    setSummary('');
    setTranscription('');
    setProgressMsg('');
    setErrorMsg('');
    setPhase('awaiting-files');
  }, []);

  /* ── render ────────────────────────────────────────────────────────────── */
  return (
    <Page $dm={dm}>
      <ServiceHeader
        platforms={[]}
        icon="pi pi-microphone"
        title="Resumo da Daily"
        subtitle="Transcreva áudios da reunião e gere a ata automática com IA."
        actions={
          <BackBtn $dm={dm} onClick={() => navigate('/central-n1')}>
            <i className="pi pi-arrow-left" />
            Voltar
          </BackBtn>
        }
      />

      <ContentCard $dm={dm}>

        {/* ── FASE: awaiting-files ── */}
        {phase === 'awaiting-files' && (
          <>
            <SectionTitle $dm={dm}>Arquivos de áudio</SectionTitle>

            <UploadZone
              $dm={dm}
              $hasFiles={files.length > 0}
              htmlFor="daily-audio-input"
            >
              <UploadInput
                id="daily-audio-input"
                ref={fileInputRef}
                type="file"
                multiple
                accept=".wav,.ogg,.mp3,.flac,audio/wav,audio/ogg,audio/mpeg,audio/flac"
                onChange={handleFilesChange}
              />
              <UploadIcon>🎙️</UploadIcon>
              <UploadText $dm={dm}>
                {files.length > 0
                  ? 'Clique para adicionar mais arquivos'
                  : 'Clique para selecionar os áudios da daily'}
              </UploadText>
              <UploadSub $dm={dm}>
                WAV · OGG · MP3 · FLAC — múltiplos arquivos permitidos
              </UploadSub>
            </UploadZone>

            {files.length > 0 && (
              <FileList>
                {files.map((f, i) => (
                  <FileItem key={i} $dm={dm}>
                    <FileIcon className="pi pi-file-audio" />
                    {f.name}
                    <FileSize>({(f.size / 1024 / 1024).toFixed(1)} MB)</FileSize>
                    <FileRemove
                      onClick={() => removeFile(i)}
                      title="Remover arquivo"
                    >
                      <i className="pi pi-times" />
                    </FileRemove>
                  </FileItem>
                ))}
              </FileList>
            )}

            <ActionBar>
              <PrimaryButton onClick={handleSend} disabled={files.length === 0}>
                <i className="pi pi-send" />
                Enviar para transcrição
              </PrimaryButton>
              <SecondaryButton $dm={dm} onClick={() => navigate('/central-n1')}>
                <i className="pi pi-arrow-left" />
                Cancelar
              </SecondaryButton>
            </ActionBar>

            <Hint $dm={dm}>
              {files.length === 0
                ? 'Selecione pelo menos 1 arquivo de áudio gravado pelo Craig Bot.'
                : `${files.length} arquivo(s) selecionado(s) — pronto para enviar.`}
            </Hint>
          </>
        )}

        {/* ── FASE: sending ── */}
        {phase === 'sending' && (
          <>
            <SectionTitle $dm={dm}>Processando áudio</SectionTitle>

            <ProgressRow $dm={dm}>
              <i className="pi pi-spin pi-spinner" />
              {progressMsg || 'Aguardando resposta do servidor...'}
            </ProgressRow>

            <Hint $dm={dm} $mt="0.75rem">
              A transcrição pode levar entre 1 e 3 minutos dependendo da duração
              da gravação. Não feche esta aba.
            </Hint>
          </>
        )}

        {/* ── FASE: done ── */}
        {phase === 'done' && (
          <>
            <SectionTitle $dm={dm}>Resumo gerado</SectionTitle>

            <SummaryCard $dm={dm}>{summary}</SummaryCard>

            {transcription && (
              <TranscriptionDetails $dm={dm}>
                <summary>
                  <i className="pi pi-file-edit" />
                  Ver transcrição completa
                </summary>
                <TranscriptionBody $dm={dm}>{transcription}</TranscriptionBody>
              </TranscriptionDetails>
            )}

            <Divider $dm={dm} />

            <ActionBar>
              <PrimaryButton onClick={handleReset}>
                <i className="pi pi-refresh" />
                Novo resumo
              </PrimaryButton>
              <SecondaryButton $dm={dm} onClick={() => navigate('/central-n1')}>
                <i className="pi pi-arrow-left" />
                Voltar
              </SecondaryButton>
            </ActionBar>
          </>
        )}

        {/* ── FASE: error ── */}
        {phase === 'error' && (
          <>
            <SectionTitle $dm={dm}>Erro ao processar</SectionTitle>

            <ErrorBox $dm={dm}>
              <i className="pi pi-exclamation-triangle" />
              {errorMsg || 'Ocorreu um erro inesperado. Tente novamente.'}
            </ErrorBox>

            <ActionBar>
              <PrimaryButton onClick={handleReset}>
                <i className="pi pi-refresh" />
                Tentar novamente
              </PrimaryButton>
              <SecondaryButton $dm={dm} onClick={() => navigate('/central-n1')}>
                <i className="pi pi-arrow-left" />
                Voltar
              </SecondaryButton>
            </ActionBar>
          </>
        )}
      </ContentCard>
    </Page>
  );
}
