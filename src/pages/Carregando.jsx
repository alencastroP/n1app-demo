import { useEffect, useRef, useState, useCallback } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import styled from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import { apiFetch } from '../services/http';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  background-color: none;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  min-height: 100vh;
  h2 { color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')}; }
  p { color: ${({ darkMode }) => (darkMode ? '#b8b8b8' : '#7443f6')}; }
  .p-progressbar { background-color: ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e9ecef')}; border-radius: 10px; }
  .p-progressbar .p-progressbar-value { background-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')}; }
  .p-card { background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#f9f7ff')}; color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
           border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e1e5eb')}; border-radius: 1rem; box-shadow: ${({ darkMode }) => (darkMode ? '1.5px 1.5px 1.5px 1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)')}; }
  .p-card .p-card-title { color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')}; }
  .p-card .p-card-content { color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#374151')}; }
  .p-card strong { color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')}; }
  .p-button { background-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')}; border-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')}; color: #fff; }
  .p-button:hover { background-color: ${({ darkMode }) => (darkMode ? '#7e4dd1' : '#5e49a6')}; border-color: ${({ darkMode }) => (darkMode ? '#7e4dd1' : '#5e49a6')}; }
  .p-button:focus { box-shadow: 0 0 0 0.2rem ${({ darkMode }) => (darkMode ? 'rgba(110, 56, 197, 0.25)' : 'rgba(116, 67, 246, 0.25)')}; }
`;

const ExtracaoInfo = styled.div`
  p { margin: 0.5rem 0; color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#374151')}; }
  .timestamp { font-size: 0.85rem; color: ${({ darkMode }) => (darkMode ? '#888888' : '#999')}; margin-top: 1rem; }
`;

export default function Carregando() {
  const [phase, setPhase] = useState('preparing'); // 'preparing' | 'generating' | 'done' | 'cancelled' | 'error'
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [extracaoInfo, setExtracaoInfo] = useState(null);
  const [progressInfo, setProgressInfo] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  const ranRef = useRef(false);
  const pollingRef = useRef(null);
  const sessionIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const estimatedTimeMsRef = useRef(null);
  const progressTimerRef = useRef(null);
  const extractionDoneRef = useRef(false);
  const abortControllerRef = useRef(null);
  const realProgressRef = useRef(0); // progresso real do backend (0-95)

  const GEN_DELAY_MS = 800;
  const POLLING_INTERVAL = 1000;
  const PROGRESS_TICK_MS = 500; // atualiza barra a cada 500ms

  // Função para calcular progresso baseado no tempo estimado
  const startTimeBasedProgress = useCallback((estimatedMs) => {
    if (!estimatedMs || estimatedMs <= 0) return;

    estimatedTimeMsRef.current = estimatedMs;
    startTimeRef.current = Date.now();

    progressTimerRef.current = setInterval(() => {
      if (extractionDoneRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const timePercent = (elapsed / estimatedMs) * 100;

      // Usa o maior entre progresso por tempo e progresso real do backend
      const bestPercent = Math.max(timePercent, realProgressRef.current);

      // Cap em 95% — se chegar lá e não terminou, fica parado
      const cappedPercent = Math.min(bestPercent, 95);
      setProgress(Math.round(cappedPercent));
    }, PROGRESS_TICK_MS);
  }, []);

  // Cancelar extração
  const handleCancel = useCallback(async () => {
    if (cancelling) return;
    setCancelling(true);

    const sessionId = sessionIdRef.current;

    try {
      // Notifica o backend para cancelar o processamento (se já tiver sessionId)
      if (sessionId) {
        await apiFetch(`/api/changelog/cancel/${sessionId}`, { method: 'POST' });
      }
    } catch (err) {
      console.warn('Erro ao cancelar no backend:', err);
    }

    // Aborta o fetch da extração (funciona mesmo sem sessionId)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Limpa timers
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setPhase('cancelled');
  }, [cancelling]);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const payload = JSON.parse(localStorage.getItem('extracaoPayload') || 'null');
    if (!payload) {
      navigate('/changelog', { replace: true });
      return;
    }
    // Remove imediatamente para que F5 não reinicie a extração
    localStorage.removeItem('extracaoPayload');
    setExtracaoInfo(payload);

    // Calcula tempo estimado localmente (0.085s por log) para iniciar barra imediatamente
    const logsCount = payload.logsCount || 0;
    const localEstimatedMs = logsCount * 85;

    // Inicia barra de progresso baseada no tempo imediatamente
    if (localEstimatedMs > 0) {
      startTimeBasedProgress(localEstimatedMs);
    }

    // Polling de progresso real
    // apiFetch retorna JSON parsed diretamente para endpoints application/json
    const pollProgress = async (sessionId) => {
      try {
        const progressData = await apiFetch(`/api/changelog/progress/${sessionId}`, {
          method: 'GET',
        });

        if (progressData) {
          setProgressInfo(progressData);

          // Alimenta o progresso real para o timer usar
          if (progressData.percentage != null) {
            realProgressRef.current = progressData.percentage;
          }

          // Se o backend retornou tempo estimado, atualiza a ref
          if (progressData.estimatedTimeMs && !estimatedTimeMsRef.current) {
            estimatedTimeMsRef.current = progressData.estimatedTimeMs;
          }

          if (progressData.status === 'done' || progressData.status === 'error' || progressData.status === 'cancelled') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            if (progressData.status === 'cancelled') {
              setPhase('cancelled');
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao obter progresso:', err);
      }
    };

    // AbortController para poder cancelar o fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;

    (async () => {
      try {
        const res = await apiFetch('/api/changelog/extract', {
          method: 'POST',
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const sessionId = res.headers.get('X-Session-Id');
        if (sessionId) {
          sessionIdRef.current = sessionId;

          pollingRef.current = setInterval(() => {
            pollProgress(sessionId);
          }, POLLING_INTERVAL);

          pollProgress(sessionId);
        }

        const blob = res && typeof res.blob === 'function' ? await res.blob() : res;

        // Extração concluída
        extractionDoneRef.current = true;

        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        // Pula direto para 100%
        setProgress(100);
        setPhase('generating');

        setTimeout(() => {
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          setPhase('done');

          const historico = JSON.parse(localStorage.getItem('historicoExtracoes') || '[]');
          historico.unshift({
            id: Date.now(),
            entidade: payload.entity,
            acao: payload.action,
            periodo: `${new Date(payload.startDate).toLocaleString()} - ${new Date(payload.endDate).toLocaleString()}`,
            campos: payload.fieldKeys || [],
            data: new Date().toLocaleString(),
            payloadCompleto: payload,
            logsCount: payload.logsCount || null,
            accountInfo: payload.accountInfo || null,
            progressInfo: progressInfo
          });
          localStorage.setItem('historicoExtracoes', JSON.stringify(historico.slice(0, 5)));
        }, GEN_DELAY_MS);
      } catch (err) {
        // Se foi cancelamento do usuário, não mostra erro
        if (err.name === 'AbortError') {
          console.log('Extração cancelada pelo usuário');
          return;
        }
        console.error(err);
        extractionDoneRef.current = true;
        setErrorMessage(err.message || 'Falha ao processar extração');
        setPhase('error');
      } finally {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      }
    })();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []); // <— sem dependências

  // libera o ObjectURL quando trocar/desmontar
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  // Formata tempo restante estimado
  const formatTimeRemaining = () => {
    if (!estimatedTimeMsRef.current || !startTimeRef.current) return null;
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, estimatedTimeMsRef.current - elapsed);

    if (remaining <= 0) return 'Finalizando...';

    const totalSeconds = Math.ceil(remaining / 1000);
    if (totalSeconds < 60) return `~${totalSeconds}s restantes`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `~${minutes}min ${seconds}s restantes`;
  };

  return (
    <Container darkMode={darkMode} className="flex flex-column align-items-center justify-content-center h-screen gap-4 px-3">
      {phase === 'preparing' && <h2>Extraindo changelog…</h2>}
      {phase === 'generating' && <h2>Gerando planilha…</h2>}
      {phase === 'done' && <h2>Gerando Excel...</h2>}
      {phase === 'cancelled' && <h2>Extração cancelada</h2>}
      {phase === 'error' && <h2>Erro na extração</h2>}

      {phase === 'preparing' && (
        <>
          <ProgressBar value={progress} style={{ width: '80%', height: '20px' }} />
          {progressInfo && progressInfo.current > 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p>
                Processando: {progressInfo.current?.toLocaleString?.()} de {progressInfo.total?.toLocaleString?.()} logs
              </p>
              {progressInfo.skipped > 0 && (
                <p style={{ color: '#ff9800', fontSize: '0.9rem' }}>
                  {progressInfo.skipped} log{progressInfo.skipped > 1 ? 's' : ''} pulado{progressInfo.skipped > 1 ? 's' : ''} (corrompido{progressInfo.skipped > 1 ? 's' : ''})
                </p>
              )}
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {progressInfo.processed?.toLocaleString?.()} logs extraídos com sucesso
              </p>
            </div>
          ) : (
            <p>Preparando extração de {extracaoInfo?.logsCount?.toLocaleString?.() ?? '—'} logs…</p>
          )}
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            {formatTimeRemaining()}
          </p>
          <Button
            label={cancelling ? 'Cancelando…' : 'Cancelar extração'}
            icon={cancelling ? 'pi pi-spin pi-spinner' : 'pi pi-times'}
            className="p-button-outlined mt-2"
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              backgroundColor: 'transparent',
              borderColor: darkMode ? '#6e38c5ff' : '#7443f6',
              color: darkMode ? '#b389f5' : '#7443f6',
            }}
          />
        </>
      )}

      {phase === 'generating' && (
        <>
          <ProgressBar mode="indeterminate" style={{ width: '80%', height: '20px' }} />
          <p>Consolidando o arquivo…</p>
        </>
      )}

      {phase === 'cancelled' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            A extração foi cancelada.
            {progressInfo?.processed > 0 && (
              <> Foram processados {progressInfo.processed.toLocaleString()} logs antes do cancelamento.</>
            )}
          </p>
          <Button
            label="Voltar ao formulário"
            icon="pi pi-arrow-left"
            onClick={() => navigate('/changelog', { replace: true })}
          />
        </div>
      )}

      {phase === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Ocorreu um erro durante a extração.
          </p>
          {errorMessage && (
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>
              {errorMessage}
            </p>
          )}
          <Button
            label="Voltar ao formulário"
            icon="pi pi-arrow-left"
            onClick={() => navigate('/changelog', { replace: true })}
          />
        </div>
      )}

      {phase === 'done' && downloadUrl && extracaoInfo && (
        <>
          <Card title="Resumo da Extração" className="w-full md:w-6 shadow-2">
            <ExtracaoInfo darkMode={darkMode}>
              {extracaoInfo?.accountInfo && (
                <p>
                  <strong>Conta:</strong> {extracaoInfo.accountInfo.Name} &nbsp;
                  <strong>(Id:</strong> {extracaoInfo.accountInfo.Id})
                </p>
              )}
              <p><strong>Entidade:</strong> {extracaoInfo.entity ?? '—'}</p>
              <p><strong>Ação:</strong> {extracaoInfo.action ?? '—'}</p>
              <p><strong>Período:</strong> {new Date(extracaoInfo.startDate).toLocaleString()} - {new Date(extracaoInfo.endDate).toLocaleString()}</p>
              {extracaoInfo?.logsCount != null && (
                <p><strong>Quantidade de logs:</strong> {extracaoInfo.logsCount.toLocaleString()}</p>
              )}
              {progressInfo && progressInfo.processed != null && (
                <>
                  <p><strong>Logs processados:</strong> {progressInfo.processed.toLocaleString()}</p>
                  {progressInfo.skipped > 0 && (
                    <p style={{ color: '#ff9800' }}>
                      <strong>Logs pulados:</strong> {progressInfo.skipped} (logs corrompidos ou indisponíveis)
                    </p>
                  )}
                </>
              )}
              <p className="timestamp">Extração concluída em {new Date().toLocaleString()}</p>
            </ExtracaoInfo>
          </Card>

          <div className="flex gap-2 mt-2">
            <Button
              label="Baixar Excel"
              icon="pi pi-download"
              onClick={() => {
                if (!downloadUrl) return;
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'changelog.xlsx';
                a.click();
              }}
            />
          </div>
        </>
      )}
    </Container>
  );
}
