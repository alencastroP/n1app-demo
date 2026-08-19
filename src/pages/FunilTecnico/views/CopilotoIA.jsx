// src/pages/FunilTecnico/views/CopilotoIA.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { palette, Panel, PanelTitle, Chip, PrimaryBtn, GhostBtn, fadeUp } from '../components/ui';
import { resolvePlaybook } from '../../../config/funilTecnicoPlaybooks';
import { extractClientTargets } from '../../../config/caseTaxonomy';
import { validateUk, deepAnalysis, ragAsk, approveDeepAnalysisAction, getTriagemAvancada, sendTriagemFeedback } from '../../../services/funilTecnicoService';
import ConfiancaBar from '../components/ConfiancaBar';
import PlanoAcao from '../components/PlanoAcao';
import FontesRag from '../components/FontesRag';

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 7fr);
  gap: 1rem;
  align-items: start;
  animation: ${fadeUp} 0.3s ease;

  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;

const FocusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  margin-bottom: 0.55rem;
  color: ${({ $dark }) => palette($dark).text};
  i { font-size: 0.75rem; color: ${({ $dark }) => palette($dark).accent}; }
`;

const ConfCard = styled.div`
  margin-top: 0.9rem;
  padding: 0.85rem;
  border-radius: 11px;
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};

  .head { display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 700;
    color: ${({ $dark }) => palette($dark).muted}; margin-bottom: 0.5rem; }
  .hint { margin-top: 0.5rem; font-size: 0.72rem; color: ${({ $dark }) => palette($dark).faint}; }
`;

const Intro = styled.p`
  margin: 0 0 1rem;
  font-size: 0.86rem;
  line-height: 1.55;
  color: ${({ $dark }) => palette($dark).text};
`;

const GateBox = styled.div`
  padding: 1rem 1.1rem;
  border-radius: 12px;
  background: ${({ $dark }) => ($dark ? 'rgba(217,119,6,.09)' : 'rgba(217,119,6,.06)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(251,191,36,.28)' : 'rgba(217,119,6,.22)')};
  margin-top: 1rem;

  .top { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700;
    color: ${({ $dark }) => ($dark ? '#fbbf24' : '#b45309')}; margin-bottom: 0.4rem; }
  .desc { margin: 0; font-size: 0.78rem; line-height: 1.45; color: ${({ $dark }) => palette($dark).muted}; }
`;

const UkRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.7rem;

  .p-inputtext { flex: 1; min-width: 200px; font-size: 0.84rem; border-radius: 9px; }
`;

const Stream = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const Evt = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.78rem;
  line-height: 1.45;
  padding: 0.5rem 0.7rem;
  border-radius: 9px;
  color: ${({ $dark }) => palette($dark).text};
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};
  white-space: pre-wrap;
  word-break: break-word;

  i { font-size: 0.72rem; margin-top: 0.15rem; flex-shrink: 0; color: ${({ $dark }) => palette($dark).accent}; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.72rem; }
`;

const StateMsg = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  margin-top: 0.7rem;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  color: ${({ $dark, $err }) => ($err ? (($dark) ? '#fca5a5' : '#b91c1c') : palette($dark).muted)};
  background: ${({ $dark, $err }) =>
    $err ? (($dark) ? 'rgba(220,38,38,.12)' : 'rgba(220,38,38,.06)') : palette($dark).panel};
  border: 1px solid ${({ $dark, $err }) =>
    $err ? (($dark) ? 'rgba(248,113,113,.3)' : 'rgba(220,38,38,.2)') : palette($dark).border};
`;

const Final = styled.div`
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  background: ${({ $dark }) =>
    $dark ? 'linear-gradient(135deg,rgba(76,29,149,.32),rgba(30,20,58,.5))' : 'linear-gradient(135deg,rgba(139,92,246,.08),rgba(79,70,229,.05))'};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(139,92,246,.3)' : 'rgba(139,92,246,.2)')};

  .title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 800;
    color: ${({ $dark }) => palette($dark).textStrong}; margin-bottom: 0.6rem; }
  .body { font-size: 0.85rem; line-height: 1.55; white-space: pre-wrap; word-break: break-word;
    color: ${({ $dark }) => palette($dark).text}; }
`;

const Empty = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: ${({ $dark }) => palette($dark).faint};
  i { display: block; font-size: 2rem; opacity: .4; margin-bottom: 0.5rem; }
`;

const RagAnswer = styled.div`
  margin-top: 1rem;
  font-size: 0.84rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${({ $dark }) => palette($dark).text};
  padding: 0.85rem 0.95rem;
  border-radius: 10px;
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};
`;

const Approvals = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const ApprovalCard = styled.div`
  border-radius: 12px;
  padding: 0.9rem 1rem;
  background: ${({ $dark }) => ($dark ? 'rgba(217,119,6,.1)' : 'rgba(217,119,6,.06)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(251,191,36,.32)' : 'rgba(217,119,6,.24)')};

  .head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
  .resumo { font-size: 0.86rem; font-weight: 800; color: ${({ $dark }) => palette($dark).textStrong}; }
  .just { margin: 0 0 0.55rem; font-size: 0.78rem; line-height: 1.45; color: ${({ $dark }) => palette($dark).muted}; }
  .endpoint { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.74rem;
    color: ${({ $dark }) => palette($dark).accentStrong}; }
`;

const Method = styled.span`
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.12rem 0.44rem;
  border-radius: 6px;
  color: #fff;
  background: ${({ $method }) => ($method === 'POST' ? '#059669' : '#d97706')};
`;

const Payload = styled.pre`
  margin: 0 0 0.6rem;
  padding: 0.6rem 0.7rem;
  border-radius: 9px;
  max-height: 200px;
  overflow: auto;
  font-size: 0.72rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: ${({ $dark }) => palette($dark).text};
  background: ${({ $dark }) => ($dark ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.7)')};
  border: 1px solid ${({ $dark }) => palette($dark).border};
`;

const ApprovalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const DecidedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  color: ${({ $ok, $dark }) => ($ok ? (($dark) ? '#34d399' : '#059669') : (($dark) ? '#fca5a5' : '#b91c1c'))};
  background: ${({ $ok }) => ($ok ? 'rgba(16,185,129,.12)' : 'rgba(220,38,38,.1)')};
  border: 1px solid ${({ $ok }) => ($ok ? 'rgba(16,185,129,.3)' : 'rgba(220,38,38,.25)')};
  i { font-size: 0.74rem; }
`;

const RejectBtn = styled(GhostBtn)`
  color: ${({ $dark }) => ($dark ? '#fca5a5' : '#b91c1c')};
  border-color: ${({ $dark }) => ($dark ? 'rgba(248,113,113,.3)' : 'rgba(220,38,38,.25)')};
`;

function evtIconLabel(e) {
  switch (e.type) {
    case 'approval_request': return { icon: 'pi pi-lock', text: `Aprovação necessária: ${e.action?.resumo || e.name}` };
    case 'tool_call':   return { icon: e.write ? 'pi pi-pencil' : 'pi pi-database', text: `${e.write ? 'Escrita' : 'Consulta'}: ${e.name}` };
    case 'tool_result':
      if (e.rejected) return { icon: 'pi pi-ban', text: `Ação recusada: ${e.name}` };
      return { icon: e.ok ? 'pi pi-check' : 'pi pi-times', text: `${e.write ? 'Escrita' : 'Resultado'}: ${e.name}${e.count != null ? ` (${e.count})` : ''}` };
    case 'progress':    return { icon: 'pi pi-angle-right', text: e.msg || '' };
    default:            return { icon: 'pi pi-circle', text: e.msg || e.type };
  }
}

/**
 * Copiloto IA: plano "aprovar e executar". Passos de serviço/RAG rodam livres; a
 * análise profunda (dado do cliente → Claude) fica atrás do gate LGPD.
 *
 * @param {object}  caso        caso em foco
 * @param {boolean} deepUiHint  se a UI exibe o fluxo de análise profunda
 */
export default function CopilotoIA({ caso, dark, deepUiHint = false, onToast }) {
  const navigate = useNavigate();
  const abortRef = useRef(null);

  const [uk, setUk] = useState('');
  const [account, setAccount] = useState(null);
  const [ukState, setUkState] = useState({ status: 'idle', error: null }); // idle|validating|ok|error
  const [dynatraceLogs, setDynatraceLogs] = useState('');

  const [run, setRun] = useState({ status: 'idle', events: [], final: null, error: null }); // idle|running|done|error|disabled
  const [rag, setRag] = useState({ status: 'idle', data: null, error: null });
  const [jobId, setJobId] = useState(null);
  // Ações de escrita propostas: toolUseId → { action, status: 'pending'|'approved'|'rejected'|'sending' }
  const [approvals, setApprovals] = useState({});

  // Plano dirigido pela triagem — mesmo resolver do Workspace.
  const playbook = useMemo(() => resolvePlaybook(caso, caso?.triagem), [caso]);

  // Alvos do cliente (espelho do backend): sem alvo, a análise profunda fica
  // desabilitada — o backend recusaria de qualquer forma (defesa em camadas).
  const targets = useMemo(
    () => extractClientTargets({ triagem: caso?.triagem, titulo: caso?.title }),
    [caso],
  );

  // Feedback 👍/👎 da sessão (persistido no card; um voto por jobId).
  const [feedback, setFeedback] = useState({ status: 'idle', voto: null }); // idle|sending|sent

  const votar = async (voto, fbJobId) => {
    if (!fbJobId || feedback.status !== 'idle') return;
    setFeedback({ status: 'sending', voto });
    try {
      await sendTriagemFeedback({ dealId: caso.id, jobId: fbJobId, voto });
      setFeedback({ status: 'sent', voto });
      onToast?.('Feedback registrado no card. Obrigado!', 'success');
    } catch (err) {
      setFeedback({ status: 'idle', voto: null });
      onToast?.(err?.message || 'Falha ao registrar o feedback.');
    }
  };

  // Triagem avançada persistida no card (hidratação): reabrir o caso mostra a
  // última sessão antes de permitir nova execução.
  const [historico, setHistorico] = useState({ status: 'idle', turnos: [] });
  useEffect(() => {
    if (!caso?.id) return;
    let cancelled = false;
    setFeedback({ status: 'idle', voto: null }); // caso novo → feedback zerado
    setHistorico({ status: 'loading', turnos: [] });
    getTriagemAvancada(caso.id)
      .then((data) => {
        if (!cancelled) setHistorico({ status: 'done', turnos: data?.turnos || [] });
      })
      .catch(() => {
        if (!cancelled) setHistorico({ status: 'error', turnos: [] });
      });
    return () => { cancelled = true; };
  }, [caso?.id]);

  if (!caso) {
    return (
      <Empty $dark={dark}>
        <i className="pi pi-sparkles" />
        Selecione um caso na Fila ou no Kanban para acionar o Copiloto.
      </Empty>
    );
  }

  const runRag = async () => {
    const query = [caso.title, caso.triagem?.resumo].filter(Boolean).join(' — ').slice(0, 500);
    if (!query) return;
    setRag({ status: 'loading', data: null, error: null });
    try {
      const out = await ragAsk(query, {});
      setRag({ status: 'done', data: out, error: null });
    } catch {
      setRag({ status: 'error', data: null, error: 'IA indisponível em produção até liberação de rede.' });
    }
  };

  const validarUk = async () => {
    setUkState({ status: 'validating', error: null });
    setAccount(null);
    try {
      const res = await validateUk(uk);
      if (res?.ok) {
        setAccount(res.account);
        setUkState({ status: 'ok', error: null });
      } else {
        setUkState({ status: 'error', error: res?.erro || 'User-Key inválida.' });
      }
    } catch (err) {
      setUkState({ status: 'error', error: err?.message || 'Falha ao validar a User-Key.' });
    }
  };

  const decide = async (toolUseId, decision) => {
    if (!jobId) return;
    setApprovals((prev) => ({ ...prev, [toolUseId]: { ...prev[toolUseId], status: 'sending' } }));
    try {
      await approveDeepAnalysisAction({ jobId, toolUseId, decision });
      setApprovals((prev) => ({
        ...prev,
        [toolUseId]: { ...prev[toolUseId], status: decision === 'approve' ? 'approved' : 'rejected' },
      }));
    } catch (err) {
      // Janela encerrada (loop já seguiu): marca como expirada em vez de voltar a
      // "pendente" — senão a UI sugere que ainda dá para aprovar, mas não dá.
      const closed = /encerrada|window_closed/i.test(err?.message || '');
      onToast?.(err?.message || 'Falha ao registrar a decisão.');
      setApprovals((prev) => ({
        ...prev,
        [toolUseId]: { ...prev[toolUseId], status: closed ? 'expired' : 'pending' },
      }));
    }
  };

  const dispararAnalise = async () => {
    if (!uk.trim()) { setUkState({ status: 'error', error: 'Informe a User-Key do cliente.' }); return; }
    const ac = new AbortController();
    abortRef.current = ac;
    setJobId(null);
    setApprovals({});
    setRun({ status: 'running', events: [], final: null, error: null });

    try {
      const result = await deepAnalysis(
        { dealId: caso.id, clientUserKey: uk.trim(), savedTriage: caso.triagem, dynatraceLogs },
        {
          signal: ac.signal,
          onEvent: (evt) => {
            if (evt.type === 'start') { setJobId(evt.jobId); return; }
            if (evt.type === 'approval_request') {
              setApprovals((prev) => ({
                ...prev,
                [evt.toolUseId]: { action: evt.action, status: 'pending' },
              }));
            }
            setRun((prev) => ({ ...prev, events: [...prev.events, evt] }));
          },
        },
      );

      // Resposta não-SSE: gate desligado no backend, ou UK inválida.
      if (result && result.ok === false) {
        if (result.code === 'deep_analysis_disabled') {
          setRun((prev) => ({ ...prev, status: 'disabled', error: result.erro }));
        } else {
          setRun((prev) => ({ ...prev, status: 'error', error: result.erro || 'Análise recusada.' }));
        }
        return;
      }

      // Evento terminal de conclusão do SSE.
      setRun((prev) => ({ ...prev, status: 'done', final: result }));
    } catch (err) {
      if (err?.name === 'AbortError') {
        setRun((prev) => ({ ...prev, status: 'idle' }));
        return;
      }
      setRun((prev) => ({ ...prev, status: 'error', error: err?.message || 'Falha na análise.' }));
    } finally {
      abortRef.current = null;
    }
  };

  const cancelar = () => abortRef.current?.abort();

  const handleRunIa = (step) => {
    if (step.iaKind === 'rag') return runRag();
    // deep: rola até a seção de análise profunda (o disparo real é manual, com UK).
    if (step.iaKind === 'deep' && !deepUiHint) onToast?.('Análise profunda pendente de aprovação (LGPD).');
  };

  return (
    <Grid>
      {/* ── Caso em foco ───────────────────────────────────────────────────── */}
      <Panel $dark={dark}>
        <PanelTitle $dark={dark}><i className="pi pi-bullseye" /> Caso em foco</PanelTitle>

        {caso.categoria && (
          <div style={{ marginBottom: '0.6rem' }}>
            <Chip $color={dark ? '#c4b5fd' : '#6d28d9'}><i className="pi pi-tag" /> {caso.categoria}</Chip>
          </div>
        )}
        <FocusItem $dark={dark}><i className="pi pi-briefcase" /> {caso.title}</FocusItem>
        {caso.ownerName && <FocusItem $dark={dark}><i className="pi pi-user" /> {caso.ownerName}</FocusItem>}
        {caso.stageName && <FocusItem $dark={dark}><i className="pi pi-flag" /> {caso.stageName}</FocusItem>}
        <FocusItem $dark={dark}><i className="pi pi-clock" /> {caso.diasParado} dias parado</FocusItem>

        {caso.confianca != null && (
          <ConfCard $dark={dark}>
            <div className="head"><span>Confiança de resolução</span></div>
            <ConfiancaBar confianca={caso.confianca} dark={dark} />
            {caso.recorrente && (
              <p className="hint">Caso recorrente: correção já mapeada para esta categoria.</p>
            )}
          </ConfCard>
        )}
      </Panel>

      {/* ── Plano + análise ────────────────────────────────────────────────── */}
      <div>
        <Panel $dark={dark}>
          <PanelTitle $dark={dark}><i className="pi pi-sparkles" /> Copiloto N1 · plano de ação</PanelTitle>
          <Intro $dark={dark}>
            Montei um plano para este caso a partir da categoria <b>{caso.categoria || 'geral'}</b>.
            Aprove cada passo para executar. Passos que tocam dados do cliente respeitam a aprovação de privacidade.
          </Intro>

          <PlanoAcao
            steps={playbook.steps}
            dark={dark}
            dynatrace={{ logs: dynatraceLogs, onChange: setDynatraceLogs }}
            onOpenService={(step) => navigate(step.url)}
            onRunIa={handleRunIa}
            deepEnabled={deepUiHint}
            hasTarget={!targets.semAlvo}
            onToast={onToast}
          />

          {/* Q&A RAG inline */}
          {rag.status === 'loading' && (
            <StateMsg $dark={dark}><i className="pi pi-spinner pi-spin" /> Consultando a base de conhecimento…</StateMsg>
          )}
          {rag.status === 'error' && (
            <StateMsg $dark={dark} $err><i className="pi pi-exclamation-triangle" /> {rag.error}</StateMsg>
          )}
          {rag.status === 'done' && rag.data && (
            <>
              <RagAnswer $dark={dark}>{rag.data.resposta}</RagAnswer>
              <FontesRag fontes={rag.data.fontes} dark={dark} />
            </>
          )}
        </Panel>

        {/* ── Análise profunda (gated) ─────────────────────────────────────── */}
        <Panel $dark={dark} style={{ marginTop: '1rem' }}>
          <PanelTitle $dark={dark}><i className="pi pi-server" /> Análise profunda na conta do cliente</PanelTitle>

          {!deepUiHint ? (
            <GateBox $dark={dark}>
              <div className="top"><i className="pi pi-lock" /> Pendente de aprovação de privacidade (LGPD)</div>
              <p className="desc">
                Esta ação enviaria dados da conta do cliente (somente leitura) ao modelo de IA para
                investigação. O recurso está desabilitado até a liberação de privacidade. Prévia do que
                seria feito: validação da User-Key do cliente, consultas GET direcionadas (deal, campos,
                automações), correlação com a triagem e um diagnóstico com nível de confiança.
              </p>
            </GateBox>
          ) : (
            <>
              {/* Triagem avançada já persistida no card (sobrevive a fechar/reabrir) */}
              {historico.status === 'done' && historico.turnos.length > 0 && run.status === 'idle' && (
                <Stream style={{ marginTop: '0.6rem' }}>
                  <StateMsg $dark={dark}>
                    <i className="pi pi-history" />
                    Última triagem avançada deste card ({historico.turnos.length} turno{historico.turnos.length > 1 ? 's' : ''}) — recuperada do Ploomes.
                  </StateMsg>
                  {historico.turnos.map((t) => (
                    <Evt key={`${t.jobId}-${t.turno}-${t.id}`} $dark={dark}>
                      <i className="pi pi-sparkles" />
                      <span>
                        {t.texto || '(turno sem texto)'}
                        {t.toolCalls?.length > 0 && (
                          <> {'\n'}<code>consultas: {t.toolCalls.join(', ')}</code></>
                        )}
                      </span>
                    </Evt>
                  ))}
                  {/* Voto da sessão recuperada (jobId do último turno) */}
                  {feedback.status !== 'sent' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', opacity: 0.75 }}>Esta triagem ajudou?</span>
                      <GhostBtn $dark={dark} type="button" disabled={feedback.status === 'sending'}
                        onClick={() => votar('up', historico.turnos[historico.turnos.length - 1]?.jobId)}>
                        <i className="pi pi-thumbs-up" /> Sim
                      </GhostBtn>
                      <GhostBtn $dark={dark} type="button" disabled={feedback.status === 'sending'}
                        onClick={() => votar('down', historico.turnos[historico.turnos.length - 1]?.jobId)}>
                        <i className="pi pi-thumbs-down" /> Não
                      </GhostBtn>
                    </div>
                  )}
                </Stream>
              )}

              <Intro $dark={dark} style={{ marginTop: '0.8rem' }}>
                Informe a User-Key do <b>cliente</b>. A IA investiga por <b>leitura (GET) automática</b> e
                <b> pede sua aprovação</b> antes de qualquer criação/alteração (POST/PATCH). Nenhuma exclusão
                é permitida. A chave não é registrada em log.
              </Intro>

              <UkRow>
                <InputText
                  value={uk}
                  onChange={(e) => setUk(e.target.value)}
                  placeholder="User-Key do cliente"
                  type="password"
                  autoComplete="off"
                />
                <GhostBtn $dark={dark} onClick={validarUk} disabled={ukState.status === 'validating' || !uk.trim()} type="button">
                  {ukState.status === 'validating'
                    ? <><i className="pi pi-spinner pi-spin" /> Validando…</>
                    : <><i className="pi pi-check-circle" /> Validar UK</>}
                </GhostBtn>
              </UkRow>

              {ukState.status === 'ok' && account && (
                <StateMsg $dark={dark}><i className="pi pi-check-circle" /> Conta: <b>{account.name}</b></StateMsg>
              )}
              {ukState.status === 'error' && (
                <StateMsg $dark={dark} $err><i className="pi pi-exclamation-triangle" /> {ukState.error}</StateMsg>
              )}

              <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <PrimaryBtn
                  onClick={dispararAnalise}
                  disabled={run.status === 'running' || ukState.status !== 'ok' || targets.semAlvo}
                  title={targets.semAlvo
                    ? 'Sem alvo definido para investigar — revise a triagem'
                    : undefined}
                  type="button"
                >
                  {run.status === 'running'
                    ? <><i className="pi pi-spinner pi-spin" /> Analisando…</>
                    : <><i className="pi pi-sparkles" /> Aprovar e executar análise</>}
                </PrimaryBtn>
                {run.status === 'running' && (
                  <GhostBtn $dark={dark} onClick={cancelar} type="button"><i className="pi pi-times" /> Cancelar</GhostBtn>
                )}
              </div>

              {/* Stream de eventos */}
              {run.events.length > 0 && (
                <Stream>
                  {run.events.map((e, i) => {
                    const { icon, text } = evtIconLabel(e);
                    return (
                      <Evt key={i} $dark={dark}>
                        <i className={icon} />
                        <span>{text}</span>
                      </Evt>
                    );
                  })}
                </Stream>
              )}

              {/* Ações de escrita propostas — aprovação do técnico */}
              {Object.keys(approvals).length > 0 && (
                <Approvals>
                  {Object.entries(approvals).map(([toolUseId, ap]) => {
                    const a = ap.action || {};
                    const decided = ['approved', 'rejected', 'expired'].includes(ap.status);
                    return (
                      <ApprovalCard key={toolUseId} $dark={dark}>
                        <div className="head">
                          <i className="pi pi-lock" style={{ color: dark ? '#fbbf24' : '#b45309' }} />
                          <span className="resumo">{a.resumo || 'Ação de escrita'}</span>
                          {a.method && <Method $method={a.method}>{a.method}</Method>}
                          {a.endpoint && <span className="endpoint">/{a.endpoint}</span>}
                        </div>
                        {a.justificativa && <p className="just">{a.justificativa}</p>}
                        {a.payload && <Payload $dark={dark}>{JSON.stringify(a.payload, null, 2)}</Payload>}

                        {decided ? (
                          <DecidedBadge $dark={dark} $ok={ap.status === 'approved'}>
                            <i className={ap.status === 'approved' ? 'pi pi-check' : ap.status === 'expired' ? 'pi pi-clock' : 'pi pi-ban'} />
                            {ap.status === 'approved'
                              ? 'Aprovado — executando'
                              : ap.status === 'expired'
                                ? 'Janela encerrada — não executada'
                                : 'Recusado'}
                          </DecidedBadge>
                        ) : (
                          <ApprovalActions>
                            <PrimaryBtn
                              onClick={() => decide(toolUseId, 'approve')}
                              disabled={ap.status === 'sending'}
                              type="button"
                            >
                              {ap.status === 'sending'
                                ? <><i className="pi pi-spinner pi-spin" /> Enviando…</>
                                : <><i className="pi pi-check" /> Aprovar e executar</>}
                            </PrimaryBtn>
                            <RejectBtn
                              $dark={dark}
                              onClick={() => decide(toolUseId, 'reject')}
                              disabled={ap.status === 'sending'}
                              type="button"
                            >
                              <i className="pi pi-times" /> Recusar
                            </RejectBtn>
                          </ApprovalActions>
                        )}
                      </ApprovalCard>
                    );
                  })}
                </Approvals>
              )}

              {run.status === 'disabled' && (
                <GateBox $dark={dark}>
                  <div className="top"><i className="pi pi-lock" /> Pendente de aprovação de privacidade (LGPD)</div>
                  <p className="desc">{run.error}</p>
                </GateBox>
              )}
              {run.status === 'error' && (
                <StateMsg $dark={dark} $err><i className="pi pi-exclamation-triangle" /> {run.error}</StateMsg>
              )}
              {run.status === 'done' && run.final && (
                <>
                  <Final $dark={dark}>
                    <div className="title"><i className="pi pi-sparkles" /> Diagnóstico da análise profunda</div>
                    <div className="body">{run.final.diagnostico || 'Análise concluída sem texto de diagnóstico.'}</div>
                  </Final>
                  {/* Feedback 👍/👎 — vira InteractionRecord no card (fila de mineração) */}
                  <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {feedback.status === 'sent' ? (
                      <StateMsg $dark={dark}>
                        <i className={feedback.voto === 'up' ? 'pi pi-thumbs-up-fill' : 'pi pi-thumbs-down-fill'} />
                        Feedback registrado no card.
                      </StateMsg>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.76rem', opacity: 0.75 }}>Este diagnóstico ajudou?</span>
                        <GhostBtn $dark={dark} type="button" disabled={feedback.status === 'sending'}
                          onClick={() => votar('up', jobId)} title="Diagnóstico útil">
                          <i className="pi pi-thumbs-up" /> Sim
                        </GhostBtn>
                        <GhostBtn $dark={dark} type="button" disabled={feedback.status === 'sending'}
                          onClick={() => votar('down', jobId)} title="Diagnóstico não ajudou">
                          <i className="pi pi-thumbs-down" /> Não
                        </GhostBtn>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </Panel>
      </div>
    </Grid>
  );
}
