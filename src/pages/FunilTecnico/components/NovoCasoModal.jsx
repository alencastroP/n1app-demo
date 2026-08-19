// src/pages/FunilTecnico/components/NovoCasoModal.jsx
//
// Modal "+ Novo caso técnico" v2 (Fase 4 do v3.1): cria o card no funil do
// Ploomes via backend N1. Fluxo em 2 passos — formulário em seções
// (Identificação · Contexto · Vínculos, com opcionais num grupo colapsável) e
// revisão ANTES do POST, como manda a regra do módulo.
//
// A criação é SEMPRE no primeiro estágio do funil (📑 Backlog), resolvido
// dinamicamente pelo form-meta — o payload não envia stageId e não existe
// escolha de estágio no formulário.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { ProgressSpinner } from 'primereact/progressspinner';
import { palette, PrimaryBtn, GhostBtn } from './ui';
import { getFormMeta, createDeal, searchFunnelContacts } from '../../../services/ploomesKanbanService';

/* ── styles ──────────────────────────────────────────────────────────────── */
const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  color: ${({ $dark }) => palette($dark).text};
`;

const SectionTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0.3rem 0 0;
  color: ${({ $dark }) => ($dark ? 'rgba(196,181,253,.7)' : 'rgba(109,40,217,.6)')};

  i { font-size: 0.76rem; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;

  label {
    font-size: 0.74rem;
    font-weight: 700;
    color: ${({ $dark }) => palette($dark).muted};
    .req { color: ${({ $dark }) => ($dark ? '#fb7185' : '#e11d48')}; }
  }
`;

const LabelRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

/* Contador de caracteres dos textos longos. */
const Counter = styled.span`
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
  color: ${({ $dark }) => palette($dark).faint};
`;

/* Erro inline de um campo específico (validação por campo). */
const FieldError = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#fb7185' : '#be123c')};

  i { font-size: 0.66rem; }
`;

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

/* Grupo colapsável dos campos opcionais ("Detalhes adicionais"). */
const CollapseBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.3rem 0.55rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  color: ${({ $dark }) => palette($dark).accentStrong};

  &:hover { background: ${({ $dark }) => palette($dark).accentBg}; }
  i { font-size: 0.7rem; }
`;

const ErrorMsg = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  color: ${({ $dark }) => ($dark ? '#fb7185' : '#be123c')};
  background: ${({ $dark }) => ($dark ? 'rgba(225,29,72,.12)' : 'rgba(225,29,72,.07)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(251,113,133,.3)' : 'rgba(225,29,72,.2)')};
  i { font-size: 0.8rem; }
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem 1rem;
  color: ${({ $dark }) => palette($dark).muted};
  font-size: 0.82rem;
`;

/* PreviewBox de confirmação: o que será criado, onde, com quais campos. */
const Preview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: ${({ $dark }) => palette($dark).panelSoft};
  border: 1px solid ${({ $dark }) => palette($dark).borderSoft};

  .head {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.78rem; font-weight: 700;
    color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
    i { color: ${({ $dark }) => palette($dark).accent}; }
  }
  .title {
    font-size: 0.9rem; font-weight: 800;
    color: ${({ $dark }) => palette($dark).textStrong};
    word-break: break-word;
  }
`;

const PreviewItem = styled.div`
  display: flex;
  gap: 0.45rem;
  font-size: 0.78rem;

  .k { font-weight: 700; color: ${({ $dark }) => palette($dark).muted}; white-space: nowrap; }
  .v { color: ${({ $dark }) => palette($dark).text}; word-break: break-word; }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding-top: 0.35rem;
`;

/* ── helpers ─────────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  titulo: '',
  descricao: '',
  ondeOcorreId: null,
  impactoId: null,
  tipoDemandaId: null,
  canalId: null,
  cliente: null, // { id, name } do autocomplete de contas
  linkIntercom: '',
  intercomTicketId: '',
  emailReportou: '',
  videoLink: '',
  paginaOcorrencia: '',
};

/** Espelha o padrão de título do backend: {emoji do impacto} | {onde} | {título}. */
function previewTitle(impactoNome, ondeNome, titulo) {
  const token = String(impactoNome || '').trim().split(/\s+/)[0] || '';
  const emoji = token && !/[\p{L}\p{N}]/u.test(token) ? token : '❓';
  return `${emoji} | ${ondeNome || '—'} | ${titulo || '—'}`;
}

/**
 * Modal de criação de caso técnico.
 * @param {{ visible:boolean, dark:boolean, onHide:()=>void,
 *           onCreated:(dealId:number)=>void }} props
 */
export default function NovoCasoModal({ visible, dark, onHide, onCreated }) {
  const [meta, setMeta] = useState({ status: 'idle', data: null, error: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [clienteSugestoes, setClienteSugestoes] = useState([]);
  // Sequência da última busca de cliente: descarta respostas fora de ordem
  // (uma request antiga que resolve depois sobrescreveria a lista atual e o
  // forceSelection poderia limpar um nome válido no blur).
  const clienteSeq = useRef(0);

  // Carrega o form-meta ao abrir (e reseta o estado do fluxo).
  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setDetalhesOpen(false);
    setStep('form');
    setError(null);
    setMeta({ status: 'loading', data: null, error: null });
    getFormMeta()
      .then((data) => {
        if (!cancelled) setMeta({ status: 'done', data, error: null });
      })
      .catch((err) => {
        if (cancelled || err?.isPermissionError) return;
        setMeta({ status: 'error', data: null, error: err?.message || 'Falha ao carregar o formulário.' });
      });
    return () => { cancelled = true; };
  }, [visible]);

  const fields = useMemo(() => {
    const list = meta.data?.fields || [];
    return new Map(list.filter((f) => f.available).map((f) => [f.key, f]));
  }, [meta.data]);

  const optionsOf = useCallback((key) => fields.get(key)?.options || [], [fields]);
  const optionName = useCallback(
    (key, id) => optionsOf(key).find((o) => o.id === id)?.name || null,
    [optionsOf],
  );

  // Estágio de criação: sempre o default do funil (primeiro por Ordination).
  const defaultStageName = useMemo(
    () => meta.data?.stages?.find((s) => s.id === meta.data?.defaultStageId)?.name || 'Backlog',
    [meta.data],
  );

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e?.value ?? e;
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((fe) => (fe[key] ? { ...fe, [key]: null } : fe));
    setError(null);
  };
  const setDrop = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.value }));
    setFieldErrors((fe) => (fe[key] ? { ...fe, [key]: null } : fe));
    setError(null);
  };

  const buscarClientes = async (e) => {
    const seq = ++clienteSeq.current;
    try {
      const res = await searchFunnelContacts(e.query);
      if (seq === clienteSeq.current) setClienteSugestoes(res?.contacts || []);
    } catch {
      // autocomplete é opcional; falha não bloqueia o form (só a busca atual).
      if (seq === clienteSeq.current) setClienteSugestoes([]);
    }
  };

  const validate = () => {
    const errs = {};
    if (String(form.titulo).trim().length < 3) errs.titulo = 'Mínimo de 3 caracteres.';
    if (form.ondeOcorreId == null) errs.ondeOcorreId = 'Escolha onde o problema ocorre.';
    if (form.impactoId == null) errs.impactoId = 'Escolha o impacto na operação.';
    if (!String(form.descricao).trim()) errs.descricao = 'Descreva a demanda em detalhes.';
    return errs;
  };

  const goConfirm = () => {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setError('Revise os campos destacados antes de continuar.');
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const clienteId = form.cliente && typeof form.cliente === 'object' ? form.cliente.id : null;
      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        ondeOcorreId: form.ondeOcorreId,
        impactoId: form.impactoId,
        ...(form.tipoDemandaId != null ? { tipoDemandaId: form.tipoDemandaId } : {}),
        ...(form.canalId != null ? { canalId: form.canalId } : {}),
        ...(Number.isInteger(clienteId) ? { contactId: clienteId } : {}),
        ...(form.linkIntercom.trim() ? { linkIntercom: form.linkIntercom.trim() } : {}),
        ...(form.intercomTicketId.trim() ? { intercomTicketId: form.intercomTicketId.trim() } : {}),
        ...(form.emailReportou.trim() ? { emailReportou: form.emailReportou.trim() } : {}),
        ...(form.videoLink.trim() ? { videoLink: form.videoLink.trim() } : {}),
        ...(form.paginaOcorrencia.trim() ? { paginaOcorrencia: form.paginaOcorrencia.trim() } : {}),
      };
      const res = await createDeal(payload);
      onCreated?.(res.dealId);
    } catch (err) {
      if (!err?.isPermissionError) {
        setError(err?.message || 'Falha ao criar o card no Ploomes.');
        setStep('form');
      }
    } finally {
      setSending(false);
    }
  };

  const dropProps = { optionLabel: 'name', optionValue: 'id', filter: true, showClear: true };
  const invalid = (key) => (fieldErrors[key] ? 'p-invalid' : undefined);
  const fieldErr = (key) => fieldErrors[key] && (
    <FieldError $dark={dark}><i className="pi pi-exclamation-circle" /> {fieldErrors[key]}</FieldError>
  );

  // Quantos opcionais já foram preenchidos (hint no botão do grupo colapsado).
  const detalhesPreenchidos = [
    form.tipoDemandaId != null,
    form.canalId != null,
    !!form.cliente,
    !!form.linkIntercom.trim(),
    !!form.intercomTicketId.trim(),
    !!form.emailReportou.trim(),
    !!form.videoLink.trim(),
    !!form.paginaOcorrencia.trim(),
  ].filter(Boolean).length;

  return (
    <Dialog
      header="Novo caso técnico"
      visible={visible}
      onHide={() => { if (!sending) onHide?.(); }}
      modal
      dismissableMask={!sending}
      style={{ width: 'min(880px, 96vw)' }}
    >
      {meta.status === 'loading' && (
        <Center $dark={dark}>
          <ProgressSpinner style={{ width: 36, height: 36 }} strokeWidth="4" />
          Carregando o formulário do funil…
        </Center>
      )}

      {meta.status === 'error' && (
        <Center $dark={dark}>
          <ErrorMsg $dark={dark}><i className="pi pi-exclamation-triangle" /> {meta.error}</ErrorMsg>
          <GhostBtn $dark={dark} type="button" onClick={onHide}>Fechar</GhostBtn>
        </Center>
      )}

      {meta.status === 'done' && step === 'form' && (
        <Body $dark={dark}>
          {/* ── Identificação ─────────────────────────────────────────────── */}
          <SectionTitle $dark={dark}><i className="pi pi-id-card" /> Identificação</SectionTitle>

          <Field $dark={dark}>
            <LabelRow>
              <label htmlFor="nc-titulo">Título <span className="req">*</span></label>
              <Counter $dark={dark}>{form.titulo.length}/200</Counter>
            </LabelRow>
            <InputText
              id="nc-titulo"
              className={invalid('titulo')}
              value={form.titulo}
              onChange={set('titulo')}
              maxLength={200}
              placeholder="Resumo curto do problema (vira o título do card)"
            />
            {fieldErr('titulo')}
          </Field>

          <Row2>
            <Field $dark={dark}>
              <label>Onde ocorre? <span className="req">*</span></label>
              <Dropdown
                className={invalid('ondeOcorreId')}
                value={form.ondeOcorreId}
                onChange={setDrop('ondeOcorreId')}
                options={optionsOf('ondeOcorreId')}
                placeholder="Módulo/área do Ploomes"
                {...dropProps}
              />
              {fieldErr('ondeOcorreId')}
            </Field>
            <Field $dark={dark}>
              <label>Impacto na operação <span className="req">*</span></label>
              <Dropdown
                className={invalid('impactoId')}
                value={form.impactoId}
                onChange={setDrop('impactoId')}
                options={optionsOf('impactoId')}
                placeholder="Severidade percebida"
                {...dropProps}
              />
              {fieldErr('impactoId')}
            </Field>
          </Row2>

          {/* ── Contexto ──────────────────────────────────────────────────── */}
          <SectionTitle $dark={dark}><i className="pi pi-align-left" /> Contexto</SectionTitle>

          <Field $dark={dark}>
            <LabelRow>
              <label htmlFor="nc-desc">Descrição detalhada da demanda <span className="req">*</span></label>
              <Counter $dark={dark}>{form.descricao.length}/8000</Counter>
            </LabelRow>
            <InputTextarea
              id="nc-desc"
              className={invalid('descricao')}
              value={form.descricao}
              onChange={set('descricao')}
              rows={5}
              autoResize
              maxLength={8000}
              placeholder="Contexto, passos para reproduzir, exemplos e o resultado esperado…"
            />
            {fieldErr('descricao')}
          </Field>

          {/* ── Detalhes adicionais (opcionais, colapsável) ───────────────── */}
          <CollapseBtn $dark={dark} type="button" onClick={() => setDetalhesOpen((v) => !v)}>
            <i className={`pi ${detalhesOpen ? 'pi-chevron-up' : 'pi-chevron-down'}`} />
            Detalhes adicionais{detalhesPreenchidos > 0 ? ` (${detalhesPreenchidos} preenchidos)` : ''}
          </CollapseBtn>

          {detalhesOpen && (
            <>
              <Row2>
                {fields.has('tipoDemandaId') && (
                  <Field $dark={dark}>
                    <label>Tipo de demanda</label>
                    <Dropdown
                      value={form.tipoDemandaId}
                      onChange={setDrop('tipoDemandaId')}
                      options={optionsOf('tipoDemandaId')}
                      placeholder="Opcional"
                      {...dropProps}
                    />
                  </Field>
                )}
                {fields.has('canalId') && (
                  <Field $dark={dark}>
                    <label>Canal de atendimento</label>
                    <Dropdown
                      value={form.canalId}
                      onChange={setDrop('canalId')}
                      options={optionsOf('canalId')}
                      placeholder="Opcional"
                      {...dropProps}
                    />
                  </Field>
                )}
              </Row2>

              {fields.has('paginaOcorrencia') && (
                <Field $dark={dark}>
                  <label htmlFor="nc-pagina">Página de ocorrência</label>
                  <InputText
                    id="nc-pagina"
                    value={form.paginaOcorrencia}
                    onChange={set('paginaOcorrencia')}
                    maxLength={500}
                    placeholder="URL da tela do Ploomes onde o problema acontece (opcional)"
                  />
                </Field>
              )}

              {/* ── Vínculos ─────────────────────────────────────────────── */}
              <SectionTitle $dark={dark}><i className="pi pi-link" /> Vínculos</SectionTitle>

              <Row2>
                <Field $dark={dark}>
                  <label htmlFor="nc-cliente">Cliente (conta)</label>
                  <AutoComplete
                    inputId="nc-cliente"
                    value={form.cliente}
                    suggestions={clienteSugestoes}
                    completeMethod={buscarClientes}
                    field="name"
                    delay={400}
                    minLength={2}
                    forceSelection
                    onChange={(e) => { setForm((f) => ({ ...f, cliente: e.value })); setError(null); }}
                    placeholder="Buscar conta pelo nome (opcional)"
                  />
                </Field>
                {fields.has('emailReportou') && (
                  <Field $dark={dark}>
                    <label htmlFor="nc-email">E-mail do user que reportou</label>
                    <InputText
                      id="nc-email"
                      value={form.emailReportou}
                      onChange={set('emailReportou')}
                      maxLength={200}
                      placeholder="Opcional"
                    />
                  </Field>
                )}
              </Row2>

              <Row2>
                {fields.has('linkIntercom') && (
                  <Field $dark={dark}>
                    <label htmlFor="nc-link">Link do Intercom</label>
                    <InputText
                      id="nc-link"
                      value={form.linkIntercom}
                      onChange={set('linkIntercom')}
                      maxLength={500}
                      placeholder="Opcional"
                    />
                  </Field>
                )}
                {fields.has('intercomTicketId') && (
                  <Field $dark={dark}>
                    <label htmlFor="nc-ticket">ID do ticket do Intercom</label>
                    <InputText
                      id="nc-ticket"
                      value={form.intercomTicketId}
                      onChange={set('intercomTicketId')}
                      maxLength={100}
                      placeholder="Opcional"
                    />
                  </Field>
                )}
              </Row2>

              {fields.has('videoLink') && (
                <Field $dark={dark}>
                  <label htmlFor="nc-video">Link de vídeo/evidência</label>
                  <InputText
                    id="nc-video"
                    value={form.videoLink}
                    onChange={set('videoLink')}
                    maxLength={500}
                    placeholder="Loom, Drive, Birdie… (opcional)"
                  />
                </Field>
              )}
            </>
          )}

          {error && (
            <ErrorMsg $dark={dark}><i className="pi pi-exclamation-triangle" /> {error}</ErrorMsg>
          )}

          <Actions>
            <GhostBtn $dark={dark} type="button" onClick={onHide}>Cancelar</GhostBtn>
            <PrimaryBtn type="button" onClick={goConfirm}>
              <i className="pi pi-arrow-right" /> Revisar e criar
            </PrimaryBtn>
          </Actions>
        </Body>
      )}

      {meta.status === 'done' && step === 'confirm' && (
        <Body $dark={dark}>
          <Preview $dark={dark}>
            <div className="head">
              <i className="pi pi-eye" />
              Será criado no funil técnico "{meta.data.pipeline.name}" do Ploomes, em {defaultStageName}
            </div>
            <div className="title">
              {previewTitle(optionName('impactoId', form.impactoId), optionName('ondeOcorreId', form.ondeOcorreId), form.titulo.trim())}
            </div>
            <PreviewItem $dark={dark}>
              <span className="k">Onde ocorre:</span>
              <span className="v">{optionName('ondeOcorreId', form.ondeOcorreId)}</span>
            </PreviewItem>
            <PreviewItem $dark={dark}>
              <span className="k">Impacto:</span>
              <span className="v">{optionName('impactoId', form.impactoId)}</span>
            </PreviewItem>
            {form.tipoDemandaId != null && (
              <PreviewItem $dark={dark}>
                <span className="k">Tipo de demanda:</span>
                <span className="v">{optionName('tipoDemandaId', form.tipoDemandaId)}</span>
              </PreviewItem>
            )}
            {form.canalId != null && (
              <PreviewItem $dark={dark}>
                <span className="k">Canal:</span>
                <span className="v">{optionName('canalId', form.canalId)}</span>
              </PreviewItem>
            )}
            {form.cliente && typeof form.cliente === 'object' && (
              <PreviewItem $dark={dark}>
                <span className="k">Cliente:</span>
                <span className="v">{form.cliente.name}</span>
              </PreviewItem>
            )}
            {!!form.emailReportou.trim() && (
              <PreviewItem $dark={dark}>
                <span className="k">E-mail do reportante:</span>
                <span className="v">{form.emailReportou.trim()}</span>
              </PreviewItem>
            )}
            {!!form.linkIntercom.trim() && (
              <PreviewItem $dark={dark}>
                <span className="k">Link do Intercom:</span>
                <span className="v">{form.linkIntercom.trim()}</span>
              </PreviewItem>
            )}
            {!!form.intercomTicketId.trim() && (
              <PreviewItem $dark={dark}>
                <span className="k">Ticket Intercom:</span>
                <span className="v">{form.intercomTicketId.trim()}</span>
              </PreviewItem>
            )}
            {!!form.videoLink.trim() && (
              <PreviewItem $dark={dark}>
                <span className="k">Vídeo/evidência:</span>
                <span className="v">{form.videoLink.trim()}</span>
              </PreviewItem>
            )}
            {!!form.paginaOcorrencia.trim() && (
              <PreviewItem $dark={dark}>
                <span className="k">Página de ocorrência:</span>
                <span className="v">{form.paginaOcorrencia.trim()}</span>
              </PreviewItem>
            )}
            <PreviewItem $dark={dark}>
              <span className="k">Descrição:</span>
              <span className="v">
                {form.descricao.trim().slice(0, 280)}
                {form.descricao.trim().length > 280 ? '…' : ''}
              </span>
            </PreviewItem>
          </Preview>

          {error && (
            <ErrorMsg $dark={dark}><i className="pi pi-exclamation-triangle" /> {error}</ErrorMsg>
          )}

          <Actions>
            <GhostBtn $dark={dark} type="button" disabled={sending} onClick={() => setStep('form')}>
              <i className="pi pi-arrow-left" /> Voltar
            </GhostBtn>
            <PrimaryBtn type="button" disabled={sending} onClick={submit}>
              <i className={sending ? 'pi pi-spinner pi-spin' : 'pi pi-check'} />
              {sending ? 'Criando…' : 'Confirmar e criar'}
            </PrimaryBtn>
          </Actions>
        </Body>
      )}
    </Dialog>
  );
}
