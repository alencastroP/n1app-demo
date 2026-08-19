// src/pages/CompiladorConhecimento.jsx
// Compilador de Conhecimento (admin-only): transforma conteúdo bruto (casos,
// procedimentos, transcrições, docs de conta...) em rascunho .md pronto para
// revisão humana. O app NÃO salva no RAG — o operador baixa o .md e segue o
// fluxo manual: rascunho → pending-review/ → revisar → promover → rag-ingest → commit.

import { useRef, useState } from 'react';
import styled from 'styled-components';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import { useDarkMode } from '../DarkModeContext';
import { FormShell } from '../design-system';
import { CopyButton } from '../design-system';
import ServiceHeader from '../components/ServiceHeader';
import { compilarConhecimento } from '../services/compiladorConhecimentoService';

// ─── Constantes ───────────────────────────────────────────────────────────

const TIPOS_FONTE = [
  { label: 'Caso técnico', value: 'caso-tecnico' },
  { label: 'Procedimento / guia', value: 'procedimento-guia' },
  { label: 'Documentação de conta', value: 'doc-conta' },
  { label: 'Transcrição de vídeo', value: 'transcript-video' },
  { label: 'Página Notion/Coda', value: 'pagina-notion-coda' },
  { label: 'Atendimento de chat', value: 'atendimento-chat' },
];

const TIPOS_CASO = [
  { label: 'Logs', value: 'logs' },
  { label: 'Automação', value: 'automacao' },
  { label: 'Campos', value: 'campos' },
  { label: 'Bulk', value: 'bulk' },
  { label: 'Integração', value: 'integracao' },
  { label: 'Outro', value: 'outro' },
];

const MODULOS_SUGERIDOS = [
  'casos-tecnicos',
  'guia-triagem',
  'n1app-api',
  'ferramentas-suporte',
  'integracoes-nativas',
  'automacoes',
  'campos-formularios',
  'negocios-funis',
  'clientes',
  'usuarios',
  'relatorios-metas',
  'propostas-documentos',
  'geral-sem-modulo',
];

// ─── Styled Components ───────────────────────────────────────────────────

const ReminderBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.4;
  background: ${(p) => (p.$dm ? '#1e1236' : '#EBE5FF')};
  border: 1px solid ${(p) => (p.$dm ? '#3d2a6b' : '#DBD4FF')};
  color: ${(p) => (p.$dm ? '#d8ccff' : '#3a1f7a')};

  i {
    font-size: 1rem;
    flex-shrink: 0;
    color: ${(p) => (p.$dm ? '#AB82FF' : '#7443F6')};
  }

  code {
    background: ${(p) => (p.$dm ? '#160d28' : '#fff')};
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 0.82rem;
  }
`;

const ContentCard = styled.div`
  background: ${(p) => (p.$dm ? '#1a0e2e' : '#ffffff')};
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.5rem;
  border: 1px solid ${(p) => (p.$dm ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};
  box-shadow: ${(p) =>
    p.$dm ? '0 4px 16px rgba(0,0,0,0.5)' : '0 2px 10px rgba(100, 60, 180, 0.07)'};
`;

const CardTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 1.1rem 0;
  color: ${(p) => (p.$dm ? '#d6d5da' : '#0a0025')};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.1rem;
  margin-bottom: 1.1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${(p) => (p.$dm ? '#bbb' : '#555')};
  }
`;

const StyledTextArea = styled(InputTextarea)`
  width: 100% !important;
  resize: vertical !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace !important;
  background: ${(p) => (p.$dm ? '#160d28' : '#fafafa')} !important;
  color: ${(p) => (p.$dm ? '#e7e2ff' : '#0a0025')} !important;
  border: 1px solid ${(p) => (p.$dm ? '#2A2A3D' : '#e0dde2')} !important;
`;

const ConteudoTextArea = styled(StyledTextArea)`
  min-height: 340px;
`;

const ContextoTextArea = styled(StyledTextArea)`
  min-height: 110px;
`;

const MarkdownTextArea = styled(StyledTextArea)`
  min-height: 380px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1rem;
`;

const ResultHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
`;

const FilenameTag = styled.code`
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 6px;
  background: ${(p) => (p.$dm ? '#221540' : '#F5F5FA')};
  color: ${(p) => (p.$dm ? '#AB82FF' : '#7443F6')};
`;

const AvisosBox = styled.div`
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: ${(p) => (p.$dm ? '#2e2210' : '#FFF7E6')};
  border: 1px solid ${(p) => (p.$dm ? '#5c4415' : '#F59E0B')};
  color: ${(p) => (p.$dm ? '#ffd98a' : '#7a5200')};
  font-size: 0.85rem;

  ul {
    margin: 0.35rem 0 0 1.1rem;
    padding: 0;
  }
`;

// ─── Componente ───────────────────────────────────────────────────────────

export default function CompiladorConhecimento() {
  const { darkMode } = useDarkMode();
  const dm = darkMode;
  const toast = useRef(null);

  // Form
  const [tipoFonte, setTipoFonte] = useState(null);
  const [moduloDestino, setModuloDestino] = useState('');
  const [moduloSugestoes, setModuloSugestoes] = useState(MODULOS_SUGERIDOS);
  const [titulo, setTitulo] = useState('');
  const [tipoCaso, setTipoCaso] = useState(null);
  const [fontesCards, setFontesCards] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [contexto, setContexto] = useState('');

  // Estado da compilação
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null); // { filename, avisos, modelo }
  const [markdownEditado, setMarkdownEditado] = useState('');

  function buscarModulos(e) {
    const q = (e.query || '').toLowerCase();
    if (!q) return setModuloSugestoes(MODULOS_SUGERIDOS);
    setModuloSugestoes(MODULOS_SUGERIDOS.filter((m) => m.toLowerCase().includes(q)));
  }

  const podeCompilar = !!moduloDestino?.trim() && !!conteudo?.trim() && !loading;

  async function handleCompilar() {
    if (!moduloDestino?.trim()) {
      return toast.current?.show({ severity: 'warn', summary: 'Aviso', detail: 'Selecione ou informe o módulo de destino.', life: 4000 });
    }
    if (!conteudo?.trim()) {
      return toast.current?.show({ severity: 'warn', summary: 'Aviso', detail: 'Cole o conteúdo bruto a ser compilado.', life: 4000 });
    }
    if (!tipoFonte) {
      return toast.current?.show({ severity: 'warn', summary: 'Aviso', detail: 'Selecione o tipo de fonte.', life: 4000 });
    }

    setLoading(true);
    setResultado(null);
    try {
      const payload = {
        tipoFonte,
        moduloDestino: moduloDestino.trim(),
        conteudo,
        ...(titulo?.trim() ? { titulo: titulo.trim() } : {}),
        ...(contexto?.trim() ? { contexto: contexto.trim() } : {}),
        ...(tipoFonte === 'caso-tecnico' && tipoCaso ? { tipoCaso } : {}),
        ...(fontesCards?.trim() ? { fontesCards: fontesCards.trim() } : {}),
      };

      const resp = await compilarConhecimento(payload);
      setResultado(resp);
      setMarkdownEditado(resp.markdown || '');
      toast.current?.show({ severity: 'success', summary: 'Compilado', detail: 'Rascunho gerado com sucesso.', life: 3500 });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: err.message || 'Não foi possível compilar o conteúdo.', life: 6000 });
    } finally {
      setLoading(false);
    }
  }

  function handleBaixar() {
    if (!resultado) return;
    const blob = new Blob([markdownEditado], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultado.filename || 'rascunho.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <FormShell
      width="wide"
      header={(
        <ServiceHeader
          icon="pi pi-book"
          title="Compilador de Conhecimento"
          subtitle="Transforme conteúdo bruto em rascunho .md pronto para revisão e ingestão no RAG."
        />
      )}
    >
      <Toast ref={toast} />

      <ReminderBox $dm={dm}>
        <i className="pi pi-info-circle" />
        <span>
          Este app <strong>não salva no RAG</strong>. Fluxo: rascunho → <code>pending-review/</code> → revisar → promover → <code>rag-ingest</code> → commit.
        </span>
      </ReminderBox>

      {/* Formulário */}
      <ContentCard $dm={dm}>
        <CardTitle $dm={dm}>
          <i className="pi pi-pencil" />
          Fonte do conteúdo
        </CardTitle>

        <FormGrid>
          <Field $dm={dm}>
            <label>Tipo de fonte *</label>
            <Dropdown
              value={tipoFonte}
              options={TIPOS_FONTE}
              onChange={(e) => setTipoFonte(e.value)}
              placeholder="Selecione o tipo de fonte"
              style={{ width: '100%' }}
            />
          </Field>

          <Field $dm={dm}>
            <label>Módulo de destino *</label>
            <AutoComplete
              value={moduloDestino}
              suggestions={moduloSugestoes}
              completeMethod={buscarModulos}
              onChange={(e) => setModuloDestino(e.value)}
              placeholder="ex.: casos-tecnicos"
              style={{ width: '100%' }}
              inputStyle={{ width: '100%' }}
              dropdown
            />
          </Field>

          <Field $dm={dm}>
            <label>Título (opcional)</label>
            <InputText
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título curto e descritivo"
            />
          </Field>

          {tipoFonte === 'caso-tecnico' && (
            <Field $dm={dm}>
              <label>Tipo de caso</label>
              <Dropdown
                value={tipoCaso}
                options={TIPOS_CASO}
                onChange={(e) => setTipoCaso(e.value)}
                placeholder="Selecione o tipo de caso"
                style={{ width: '100%' }}
              />
            </Field>
          )}

          <Field $dm={dm}>
            <label>Fontes / cards (opcional)</label>
            <InputText
              value={fontesCards}
              onChange={(e) => setFontesCards(e.target.value)}
              placeholder="ex.: 302672801, 302623405"
            />
          </Field>
        </FormGrid>

        <Field $dm={dm} style={{ marginBottom: '1.1rem' }}>
          <label>Conteúdo bruto *</label>
          <ConteudoTextArea
            $dm={dm}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Cole aqui o conteúdo bruto: transcrição, texto do card, procedimento, trecho de doc..."
            autoResize={false}
          />
        </Field>

        <Field $dm={dm} style={{ marginBottom: '0.5rem' }}>
          <label>Contexto / observações (opcional)</label>
          <ContextoTextArea
            $dm={dm}
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Observações do operador para orientar a compilação (opcional)"
            autoResize={false}
          />
        </Field>

        <ActionRow>
          <Button
            label={loading ? 'Compilando…' : 'Compilar'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-sparkles'}
            onClick={handleCompilar}
            disabled={!podeCompilar}
            loading={loading}
          />
        </ActionRow>
      </ContentCard>

      {/* Resultado */}
      {resultado && (
        <ContentCard $dm={dm}>
          <ResultHeaderRow>
            <CardTitle $dm={dm} style={{ marginBottom: 0 }}>
              <i className="pi pi-file-check" />
              Rascunho gerado
            </CardTitle>
            <FilenameTag $dm={dm}>{resultado.filename}</FilenameTag>
          </ResultHeaderRow>

          <Field $dm={dm} style={{ marginBottom: '1rem' }}>
            <label>Markdown (editável antes de baixar)</label>
            <MarkdownTextArea
              $dm={dm}
              value={markdownEditado}
              onChange={(e) => setMarkdownEditado(e.target.value)}
              autoResize={false}
            />
          </Field>

          <ActionRow>
            <Button
              label="Baixar .md"
              icon="pi pi-download"
              severity="success"
              onClick={handleBaixar}
            />
            <CopyButton value={markdownEditado} label="Copiar markdown" />
          </ActionRow>

          {Array.isArray(resultado.avisos) && resultado.avisos.length > 0 && (
            <AvisosBox $dm={dm}>
              <strong><i className="pi pi-exclamation-triangle" /> Avisos</strong>
              <ul>
                {resultado.avisos.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </AvisosBox>
          )}
        </ContentCard>
      )}
    </FormShell>
  );
}
