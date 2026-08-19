// src/pages/FunilTecnico/views/WorkspaceCaso.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { ProgressSpinner } from 'primereact/progressspinner';
import { palette, Panel, PanelTitle, Chip, fadeUp } from '../components/ui';
import { resolvePlaybook } from '../../../config/funilTecnicoPlaybooks';
import { extractClientTargets } from '../../../config/caseTaxonomy';
import { fetchDealCard } from '../../../services/ploomesKanbanService';
import { ragAsk } from '../../../services/funilTecnicoService';
import SeveridadeTag from '../components/SeveridadeTag';
import ConfiancaBar from '../components/ConfiancaBar';
import PlanoAcao from '../components/PlanoAcao';
import FontesRag from '../components/FontesRag';

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 5fr) minmax(0, 3.4fr);
  gap: 1rem;
  align-items: start;
  animation: ${fadeUp} 0.3s ease;

  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  margin-bottom: 0.85rem;
  &:last-child { margin-bottom: 0; }
`;

const FieldLabel = styled.div`
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.22rem;
  color: ${({ $dark }) => palette($dark).faint};
`;

const FieldValue = styled.div`
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${({ $dark, $muted }) => ($muted ? palette($dark).faint : palette($dark).text)};
  font-style: ${({ $muted }) => ($muted ? 'italic' : 'normal')};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Diag = styled.div`
  border-radius: 12px;
  padding: 1rem 1.1rem;
  background: ${({ $dark }) =>
    $dark ? 'linear-gradient(135deg,rgba(76,29,149,.32),rgba(30,20,58,.5))' : 'linear-gradient(135deg,rgba(139,92,246,.08),rgba(79,70,229,.05))'};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(139,92,246,.3)' : 'rgba(139,92,246,.2)')};
`;

const DiagHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  row-gap: 0.5rem;
  gap: 0.6rem;
  margin-bottom: 0.7rem;

  .left { display: flex; align-items: center; gap: 0.55rem; min-width: 0; }
  .icon {
    width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0;
    color: #fff; background: linear-gradient(135deg,#7c3aed,#4f46e5);
    i { font-size: 0.85rem; }
  }
  .title { font-size: 0.92rem; font-weight: 800; color: ${({ $dark }) => palette($dark).textStrong}; overflow-wrap: break-word; }
  .sub { font-size: 0.68rem; color: ${({ $dark }) => palette($dark).faint}; overflow-wrap: break-word; }
`;

const DiagText = styled.p`
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${({ $dark }) => palette($dark).text};
`;

const NoTriage = styled.div`
  padding: 1.5rem 1.1rem;
  border-radius: 12px;
  font-size: 0.82rem;
  text-align: center;
  color: ${({ $dark }) => palette($dark).faint};
  border: 1px dashed ${({ $dark }) => palette($dark).border};

  i { display: block; font-size: 1.6rem; opacity: .5; margin-bottom: 0.4rem; }
`;

const RagBox = styled.div`
  margin-top: 1rem;
`;

const RagAnswer = styled.div`
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

const StateMsg = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  color: ${({ $dark, $err }) =>
    $err ? (($dark) ? '#fca5a5' : '#b91c1c') : palette($dark).muted};
  background: ${({ $dark, $err }) =>
    $err ? (($dark) ? 'rgba(220,38,38,.12)' : 'rgba(220,38,38,.06)') : palette($dark).panel};
  border: 1px solid ${({ $dark, $err }) =>
    $err ? (($dark) ? 'rgba(248,113,113,.3)' : 'rgba(220,38,38,.2)') : palette($dark).border};
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 3rem 1rem;
  color: ${({ $dark }) => palette($dark).muted};
`;

const LinkBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  max-width: 100%;
  color: ${({ $dark }) => palette($dark).accentStrong};
  background: ${({ $dark }) => palette($dark).accentBg};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.22)' : 'rgba(139,92,246,.2)')};

  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  i { font-size: 0.72rem; flex-shrink: 0; }
`;

/* Identificação do card: id monoespaçado + ações (copiar / abrir no Ploomes). */
const IdValue = styled.span`
  font-size: 0.86rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({ $dark }) => palette($dark).textStrong};
`;

const IconBtn = styled.button`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  cursor: pointer;
  background: transparent;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.22)' : 'rgba(139,92,246,.2)')};
  color: ${({ $dark }) => palette($dark).accentStrong};

  &:hover { background: ${({ $dark }) => palette($dark).accentBg}; }
  i { font-size: 0.68rem; }
`;

/* Botão de texto discreto (Expandir/Recolher, Mais detalhes). */
const TextBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.18rem 0.35rem;
  margin-top: 0.3rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: ${({ $dark }) => palette($dark).accentStrong};

  &:hover { background: ${({ $dark }) => palette($dark).accentBg}; }
  i { font-size: 0.64rem; }
`;

/* Descrição longa com clamp de ~6 linhas até o "Expandir". */
const ClampText = styled(FieldValue)`
  ${({ $clamped }) => $clamped && css`
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

/* Timeline de interações reais do deal (/deal/:id). */
const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimelineItem = styled.div`
  position: relative;
  padding: 0 0 0.9rem 1.15rem;
  border-left: 2px solid ${({ $dark }) => palette($dark).borderSoft};

  &:last-child { padding-bottom: 0.1rem; }

  &::before {
    content: '';
    position: absolute;
    left: -5px;
    top: 4px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${({ $dark }) => palette($dark).accent};
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    font-size: 0.68rem;
    font-weight: 700;
    color: ${({ $dark }) => palette($dark).muted};
    .quando { font-weight: 500; color: ${({ $dark }) => palette($dark).faint}; }
  }

  .conteudo {
    margin-top: 0.2rem;
    font-size: 0.79rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    color: ${({ $dark }) => palette($dark).text};
  }
`;

const TIMELINE_MAX = 30;
const TIMELINE_CONTENT_MAX = 500;

const dtFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : dtFmt.format(d);
};

/** Acha o registro de pré-triagem da IA nas interações (texto humano do diagnóstico). */
function findTriageRecord(interactions = []) {
  return interactions.find((it) => {
    const c = (it.content || '').toLowerCase();
    return c.includes('pré-triagem') || c.includes('pre-triagem') || c.includes('triagem automática');
  }) || null;
}

// Heurística do clamp da descrição: só oferece "Expandir" quando o texto tende
// a passar de ~6 linhas (medir a caixa renderizada não compensa aqui).
const DESCRICAO_CLAMP_CHARS = 380;
const descricaoLonga = (texto = '') =>
  texto.length > DESCRICAO_CLAMP_CHARS || (texto.match(/\n/g) || []).length >= 6;

/** Ícone `pi pi-*` por tipo de anexo. */
function attachmentIcon(contentType = '', fileName = '') {
  const ct = String(contentType).toLowerCase();
  const ext = String(fileName).split('.').pop()?.toLowerCase() || '';
  if (ct.startsWith('image/')) return 'pi-image';
  if (ct.startsWith('video/')) return 'pi-video';
  if (ct.includes('pdf') || ext === 'pdf') return 'pi-file-pdf';
  if (ct.includes('spreadsheet') || ct.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'pi-file-excel';
  if (ct.includes('word') || ['doc', 'docx'].includes(ext)) return 'pi-file-word';
  return 'pi-file';
}

const fmtSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

// Campos custom que aparecem direto no painel; o resto vai para "Mais detalhes".
const CAMPOS_PRIMARIOS = new Set(['tipoDemanda', 'canal']);

/**
 * Workspace do caso: detalhe do deal + diagnóstico da triagem (n8n) + plano de
 * ação (playbook por categoria) + Q&A RAG. NÃO chama Claude aqui — o RAG usa a
 * base interna; a análise profunda fica no Copiloto (gated).
 *
 * @param {object} caso        caso derivado (com triagem) selecionado
 * @param {boolean} deepUiHint se a UI deve exibir o passo de análise profunda
 * @param {(caso)=>void} onGoCopiloto  handoff para o Copiloto (passo de IA profunda)
 * @param {(msg)=>void} onToast
 */
export default function WorkspaceCaso({ caso, dark, deepUiHint = false, onGoCopiloto, onToast }) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dynatraceLogs, setDynatraceLogs] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [maisDetalhesOpen, setMaisDetalhesOpen] = useState(false);

  // Estado do RAG (base interna).
  const [rag, setRag] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    if (!caso?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    setRag({ status: 'idle', data: null, error: null });
    setDynatraceLogs('');
    setDescExpanded(false);
    setMaisDetalhesOpen(false);

    fetchDealCard(caso.id)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => {
        if (cancelled || err?.isPermissionError) return;
        setError(err?.message || 'Falha ao carregar a negociação.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [caso?.id]);

  // Triagem: prioriza a do detalhe (mais fresca; pode ser o fallback retroativo
  // derivado da timeline pelo backend), cai na do caso do funil.
  const triagem = detail?.deal?.triagem || caso?.triagem || null;
  const retroativa = triagem?.origem === 'timeline-fallback';
  const triageRecord = useMemo(
    () => findTriageRecord(detail?.interactions),
    [detail],
  );

  // Plano de ação dirigido pela triagem: passos do playbook do CASE_TYPE /
  // categoria, enriquecidos com os dados da pré-triagem do card.
  const playbook = useMemo(() => resolvePlaybook(caso, triagem), [caso, triagem]);

  // Alvos do cliente no briefing (espelho do backend): sem alvo, a análise
  // profunda fica desabilitada com tooltip — a IA não teria o que investigar.
  const targets = useMemo(
    () => extractClientTargets({
      triagem,
      descricao: detail?.deal?.descricao,
      titulo: caso?.title,
    }),
    [triagem, detail, caso?.title],
  );

  const runRag = async () => {
    const query = [caso?.title, triagem?.resumo].filter(Boolean).join(' — ').slice(0, 500);
    if (!query) return;
    setRag({ status: 'loading', data: null, error: null });
    try {
      const out = await ragAsk(query, {});
      setRag({ status: 'done', data: out, error: null });
    } catch {
      // Egress bloqueado / embeddings indisponível em prod → aviso localizado, sem quebrar a tela.
      setRag({
        status: 'error',
        data: null,
        error: 'IA indisponível em produção até liberação de rede.',
      });
    }
  };

  const handleRunIa = (step) => {
    if (step.iaKind === 'rag') return runRag();
    if (step.iaKind === 'deep') return onGoCopiloto?.(caso);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(caso.id));
      onToast?.('ID do card copiado.', 'success');
    } catch {
      onToast?.('Não foi possível copiar o ID.', 'warn');
    }
  };

  if (!caso) {
    return (
      <Center $dark={dark}>
        <i className="pi pi-inbox" style={{ fontSize: '1.8rem' }} />
        <span>Selecione um caso na Fila ou no Kanban para abrir o workspace.</span>
      </Center>
    );
  }

  if (loading) {
    return (
      <Center $dark={dark}>
        <ProgressSpinner style={{ width: 42, height: 42 }} strokeWidth="4" />
        <span>Carregando o caso…</span>
      </Center>
    );
  }
  if (error) {
    return (
      <Center $dark={dark}>
        <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.8rem' }} />
        <span>{error}</span>
      </Center>
    );
  }

  const deal = detail?.deal || {};
  const clienteNome = deal.contactName || caso?.contactName || null;

  // Campos custom preenchidos (o backend já descarta vazios/placeholder).
  const camposExtras = deal.camposExtras || [];
  const camposPrimarios = camposExtras.filter((c) => CAMPOS_PRIMARIOS.has(c.key));
  const camposLinks = camposExtras.filter((c) => c.kind === 'url' && !CAMPOS_PRIMARIOS.has(c.key));
  const camposSecundarios = camposExtras.filter(
    (c) => c.kind !== 'url' && !CAMPOS_PRIMARIOS.has(c.key),
  );
  const attachments = detail?.attachments || [];

  // Vínculos sempre da fonte mais fresca (detalhe > triagem do funil).
  const intercomUrl = deal.intercomUrl || null;
  const intercomId = deal.intercomId || caso?.intercomId || null;
  const birdieUrl = triagem?.birdie_url || caso?.birdieUrl || null;

  const descricao = deal.descricao || '';
  const clampDescricao = descricaoLonga(descricao) && !descExpanded;

  return (
    <Grid>
      {/* ── Esquerda: identificação + detalhes do caso ─────────────────────── */}
      <Panel $dark={dark}>
        <PanelTitle $dark={dark}><i className="pi pi-info-circle" /> Detalhes do caso</PanelTitle>

        <Field>
          <FieldLabel $dark={dark}>Card</FieldLabel>
          <Row>
            <IdValue $dark={dark}>#{caso.id}</IdValue>
            <IconBtn $dark={dark} type="button" title="Copiar ID do card" onClick={copyId}>
              <i className="pi pi-copy" />
            </IconBtn>
            {deal.ploomesUrl && (
              <LinkBtn $dark={dark} href={deal.ploomesUrl} target="_blank" rel="noopener noreferrer">
                <i className="pi pi-external-link" /> <span>Abrir no Ploomes</span>
              </LinkBtn>
            )}
          </Row>
        </Field>

        <Field>
          <FieldLabel $dark={dark}>Caso</FieldLabel>
          <FieldValue $dark={dark}>{caso?.title || deal.title}</FieldValue>
        </Field>
        <Field>
          <FieldLabel $dark={dark}>Cliente</FieldLabel>
          <FieldValue $dark={dark} $muted={!clienteNome}>{clienteNome || 'Sem cliente vinculado'}</FieldValue>
        </Field>
        <Field>
          <FieldLabel $dark={dark}>Responsável</FieldLabel>
          <FieldValue $dark={dark} $muted={!(deal.ownerName || caso?.ownerName)}>
            {deal.ownerName || caso?.ownerName || '—'}
          </FieldValue>
        </Field>
        {deal.creatorName && (
          <Field>
            <FieldLabel $dark={dark}>Criado por</FieldLabel>
            <FieldValue $dark={dark}>{deal.creatorName}</FieldValue>
          </Field>
        )}

        <Row style={{ marginBottom: '0.85rem' }}>
          <div>
            <FieldLabel $dark={dark}>Severidade</FieldLabel>
            {caso?.severidade
              ? <SeveridadeTag severidade={caso.severidade} dark={dark} />
              : <FieldValue $dark={dark} $muted>—</FieldValue>}
          </div>
          <div style={{ marginLeft: '1.2rem' }}>
            <FieldLabel $dark={dark}>Parado há</FieldLabel>
            <FieldValue $dark={dark}>{caso?.diasParado ?? 0} dias</FieldValue>
          </div>
        </Row>

        {camposPrimarios.map((c) => (
          <Field key={c.key}>
            <FieldLabel $dark={dark}>{c.label}</FieldLabel>
            <FieldValue $dark={dark}>{c.value}</FieldValue>
          </Field>
        ))}

        <Field>
          <FieldLabel $dark={dark}>Descrição</FieldLabel>
          <ClampText $dark={dark} $muted={!descricao} $clamped={clampDescricao}>
            {descricao || 'Sem descrição.'}
          </ClampText>
          {descricaoLonga(descricao) && (
            <TextBtn $dark={dark} type="button" onClick={() => setDescExpanded((v) => !v)}>
              <i className={`pi ${descExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`} />
              {descExpanded ? 'Recolher' : 'Expandir'}
            </TextBtn>
          )}
        </Field>

        {(intercomUrl || intercomId || birdieUrl) && (
          <Field>
            <FieldLabel $dark={dark}>Ticket vinculado</FieldLabel>
            <Row>
              {intercomUrl && (
                <LinkBtn $dark={dark} href={intercomUrl} target="_blank" rel="noopener noreferrer">
                  <i className="pi pi-comments" /> <span>Conversa no Intercom</span>
                </LinkBtn>
              )}
              {intercomId && (
                <Chip $color={dark ? '#a78bfa' : '#7c3aed'}>
                  <i className="pi pi-hashtag" /> {intercomId}
                </Chip>
              )}
              {birdieUrl && (
                <LinkBtn $dark={dark} href={birdieUrl} target="_blank" rel="noopener noreferrer">
                  <i className="pi pi-video" /> <span>Ver gravação</span>
                </LinkBtn>
              )}
            </Row>
          </Field>
        )}

        {(camposLinks.length > 0 || attachments.length > 0) && (
          <Field>
            <FieldLabel $dark={dark}>Links e anexos</FieldLabel>
            <Row>
              {camposLinks.map((c) => (
                <LinkBtn
                  key={c.key}
                  $dark={dark}
                  href={c.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={c.value}
                >
                  <i className={`pi ${c.key === 'videoLink' ? 'pi-video' : 'pi-globe'}`} />
                  <span>{c.label}</span>
                </LinkBtn>
              ))}
              {attachments.map((a) => (
                <LinkBtn
                  key={a.id}
                  $dark={dark}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={a.fileName}
                >
                  <i className={`pi ${attachmentIcon(a.contentType, a.fileName)}`} />
                  <span>{a.fileName}</span>
                  {fmtSize(a.size) && <span>· {fmtSize(a.size)}</span>}
                </LinkBtn>
              ))}
            </Row>
          </Field>
        )}

        {camposSecundarios.length > 0 && (
          <Field>
            <TextBtn
              $dark={dark}
              type="button"
              style={{ marginTop: 0 }}
              onClick={() => setMaisDetalhesOpen((v) => !v)}
            >
              <i className={`pi ${maisDetalhesOpen ? 'pi-chevron-up' : 'pi-chevron-down'}`} />
              Mais detalhes ({camposSecundarios.length})
            </TextBtn>
            {maisDetalhesOpen && (
              <div style={{ marginTop: '0.6rem' }}>
                {camposSecundarios.map((c) => (
                  <Field key={c.key}>
                    <FieldLabel $dark={dark}>{c.label}</FieldLabel>
                    {c.kind === 'email' ? (
                      <FieldValue $dark={dark}>
                        <a href={`mailto:${c.value}`} style={{ color: 'inherit' }}>{c.value}</a>
                      </FieldValue>
                    ) : (
                      <FieldValue $dark={dark}>{c.value}</FieldValue>
                    )}
                  </Field>
                ))}
                {deal.createDate && (
                  <Field>
                    <FieldLabel $dark={dark}>Criado em</FieldLabel>
                    <FieldValue $dark={dark}>{fmtDate(deal.createDate)}</FieldValue>
                  </Field>
                )}
              </div>
            )}
          </Field>
        )}
      </Panel>

      {/* ── Centro: diagnóstico da IA (triagem do n8n) + RAG ────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {triagem ? (
          <Diag $dark={dark}>
            <DiagHead $dark={dark}>
              <div className="left">
                <div className="icon"><i className="pi pi-sparkles" /></div>
                <div>
                  <div className="title">Diagnóstico da IA</div>
                  <div className="sub">
                    {retroativa ? 'Pré-triagem recuperada da timeline' : 'Pré-triagem automática concluída'}
                    {triagem.triado_em ? ` · ${fmtDate(triagem.triado_em)}` : ''}
                    {triagem.modelo ? ` · ${triagem.modelo}` : ''}
                  </div>
                </div>
              </div>
              {caso?.confianca != null && (
                <div style={{ minWidth: 130 }}>
                  <ConfiancaBar confianca={caso.confianca} dark={dark} showLabel />
                </div>
              )}
            </DiagHead>

            {(retroativa || caso?.severidade || triagem.recorrente_mapeado || triagem.resolucao_rapida) && (
              <Row style={{ marginBottom: '0.6rem' }}>
                {retroativa && (
                  <Chip $color={dark ? '#94a3b8' : '#64748b'} title="Derivada do 1º registro de pré-triagem da timeline — sem campo de triagem no card">
                    <i className="pi pi-history" /> Triagem retroativa
                  </Chip>
                )}
                {caso?.severidade && <SeveridadeTag severidade={caso.severidade} dark={dark} />}
                {triagem.recorrente_mapeado && (
                  <Chip $color={dark ? '#34d399' : '#059669'}>
                    <i className="pi pi-replay" /> Recorrente mapeado
                  </Chip>
                )}
                {triagem.resolucao_rapida && (
                  <Chip $color={dark ? '#a78bfa' : '#7c3aed'}>
                    <i className="pi pi-bolt" /> Resolução rápida
                  </Chip>
                )}
              </Row>
            )}

            <DiagText $dark={dark}>
              {(retroativa ? triagem.resumo : triageRecord?.content || triagem.resumo) || 'Sem resumo da triagem.'}
            </DiagText>

            {triagem.resolucao_rapida && (
              <div style={{ marginTop: '0.7rem' }}>
                <FieldLabel $dark={dark}>Resolução rápida sugerida</FieldLabel>
                <DiagText $dark={dark}>
                  {typeof triagem.resolucao_rapida === 'string'
                    ? triagem.resolucao_rapida
                    : 'Correção recorrente mapeada — alta chance de resolução imediata (ver plano de ação).'}
                </DiagText>
              </div>
            )}
          </Diag>
        ) : (
          <NoTriage $dark={dark}>
            <i className="pi pi-inbox" />
            Este caso ainda não tem triagem da IA.
          </NoTriage>
        )}

        {/* Q&A RAG (base interna) */}
        {rag.status !== 'idle' && (
          <Panel $dark={dark}>
            <PanelTitle $dark={dark}><i className="pi pi-book" /> Triagem com IA · base interna</PanelTitle>
            <RagBox>
              {rag.status === 'loading' && (
                <StateMsg $dark={dark}>
                  <i className="pi pi-spinner pi-spin" /> Consultando a base de conhecimento…
                </StateMsg>
              )}
              {rag.status === 'error' && (
                <StateMsg $dark={dark} $err>
                  <i className="pi pi-exclamation-triangle" /> {rag.error}
                </StateMsg>
              )}
              {rag.status === 'done' && rag.data && (
                <>
                  <RagAnswer $dark={dark}>{rag.data.resposta}</RagAnswer>
                  <FontesRag fontes={rag.data.fontes} dark={dark} />
                </>
              )}
            </RagBox>
          </Panel>
        )}

        {/* Timeline: interações reais do deal (mais recentes primeiro). */}
        {(detail?.interactions?.length ?? 0) > 0 && (
          <Panel $dark={dark}>
            <PanelTitle $dark={dark}>
              <i className="pi pi-history" /> Timeline · {detail.interactions.length} interações
            </PanelTitle>
            <Timeline>
              {detail.interactions.slice(0, TIMELINE_MAX).map((it) => (
                <TimelineItem key={it.id} $dark={dark}>
                  <div className="meta">
                    {it.author && <span>{it.author}</span>}
                    {it.type && <span>· {it.type}</span>}
                    {it.date && <span className="quando">{fmtDate(it.date)}</span>}
                  </div>
                  <div className="conteudo">
                    {(it.content || '').slice(0, TIMELINE_CONTENT_MAX)}
                    {(it.content || '').length > TIMELINE_CONTENT_MAX ? '…' : ''}
                  </div>
                </TimelineItem>
              ))}
            </Timeline>
            {detail.interactions.length > TIMELINE_MAX && (
              <StateMsg $dark={dark} style={{ marginTop: '0.6rem' }}>
                <i className="pi pi-info-circle" />
                Mostrando as {TIMELINE_MAX} interações mais recentes.
              </StateMsg>
            )}
          </Panel>
        )}
      </div>

      {/* ── Direita: plano de ação ─────────────────────────────────────────── */}
      <Panel $dark={dark}>
        <PanelTitle $dark={dark}><i className="pi pi-list-check" /> Plano de ação</PanelTitle>
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
      </Panel>
    </Grid>
  );
}
