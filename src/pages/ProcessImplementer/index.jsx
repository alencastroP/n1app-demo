import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { processesConfig } from '../../config/processesConfig';

const RoletaUsuariosForm = lazy(() => import('./forms/RoletaUsuariosForm'));
const SlaCardsForm = lazy(() => import('./forms/SlaCardsForm'));
const VolumeComprasForm = lazy(() => import('./forms/VolumeComprasForm'));

const FORM_MAP = {
  'roleta-usuarios': RoletaUsuariosForm,
  'sla-cards': SlaCardsForm,
  'volume-compras': VolumeComprasForm,
};

// ── Animations ──────────────────────────────────────────────────────────────

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Layout ──────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const PageHeader = styled.div`
  flex-shrink: 0;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  margin-bottom: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.55rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#4a2fa0')};
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  i { color: #7443f6; font-size: 1.3rem; }
`;

const PageSubtitle = styled.p`
  font-size: 0.92rem;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  margin: 0;
`;

const ContentRow = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 0;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

// ── Lista lateral ────────────────────────────────────────────────────────────

const ListPanel = styled.div`
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 1.25rem;
  border-right: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};

  @media (max-width: 640px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
    padding-right: 0;
    padding-bottom: 0.75rem;
    flex-direction: row;
    overflow-x: auto;
  }
`;

const ListSectionLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? '#6a5a9a' : '#a090cc')};
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.15rem;
`;

const ListItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1.5px solid ${({ $active, $dm }) =>
    $active ? '#7443f6' : ($dm ? '#2d2a3e' : '#e4e0f5')};
  background: ${({ $active, $dm }) =>
    $active
      ? ($dm ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.08)')
      : ($dm ? '#1a1230' : '#fff')};
  color: ${({ $active, $dm }) =>
    $active ? '#7443f6' : ($dm ? '#c4b5fd' : '#4a2fa0')};
  font-size: 0.92rem;
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;

  i { font-size: 1.05rem; color: #7443f6; flex-shrink: 0; }

  &:hover:not([data-active='true']) {
    background: ${({ $dm }) => ($dm ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.06)')};
    border-color: #7443f6;
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    flex-shrink: 0;
    min-width: 200px;
  }
`;

// ── Painel direito ───────────────────────────────────────────────────────────

const RightPanel = styled.div`
  flex: 1;
  min-width: 0;
  padding-left: 2rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 640px) {
    padding-left: 0;
  }
`;

const FormScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.3) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.3); border-radius: 4px; }
`;

const FormCenter = styled.div`
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  animation: ${slideUp} 0.25s ease;
`;

const FormHeader = styled.div`
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
`;

const FormTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#3d2a80')};
  margin: 0 0 0.35rem 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  i { color: #7443f6; }
`;

const FormDescription = styled.p`
  font-size: 0.88rem;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  margin: 0;
  line-height: 1.55;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.85rem;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  padding: 2rem;

  i { font-size: 2.5rem; color: #7443f6; opacity: 0.55; }
  h2 { margin: 0; font-size: 1.1rem; color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#3d2a80')}; font-weight: 700; }
  p { margin: 0; font-size: 0.92rem; max-width: 380px; line-height: 1.55; }
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function ProcessImplementer() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  const [selectedSlug, setSelectedSlug] = useState(urlSlug ?? null);

  useEffect(() => {
    setSelectedSlug(urlSlug ?? null);
  }, [urlSlug]);

  function selectProcess(slug) {
    setSelectedSlug(slug);
    navigate(`/process-implementer/${slug}`, { replace: false });
  }

  const selected = processesConfig.find((p) => p.slug === selectedSlug);
  const FormComponent = selected ? FORM_MAP[selected.slug] : null;

  return (
    <PageWrapper>
      <PageHeader $dm={darkMode}>
        <PageTitle $dm={darkMode}>
          <i className="pi pi-bolt" />
          Implementação Express
        </PageTitle>
        <PageSubtitle $dm={darkMode}>
          Configure e implemente automações padronizadas em contas Ploomes
        </PageSubtitle>
      </PageHeader>

      <ContentRow>
        <ListPanel $dm={darkMode}>
          <ListSectionLabel $dm={darkMode}>Processos disponíveis</ListSectionLabel>
          {processesConfig.map((proc) => (
            <ListItem
              key={proc.slug}
              $dm={darkMode}
              $active={proc.slug === selectedSlug}
              data-active={proc.slug === selectedSlug}
              onClick={() => selectProcess(proc.slug)}
            >
              <i className={proc.icone} />
              {proc.nome}
            </ListItem>
          ))}
        </ListPanel>

        <RightPanel>
          {selected && FormComponent ? (
            <FormScroll>
              <FormCenter key={selected.slug}>
                <FormHeader $dm={darkMode}>
                  <FormTitle $dm={darkMode}>
                    <i className={selected.icone} />
                    {selected.nome}
                  </FormTitle>
                  <FormDescription $dm={darkMode}>{selected.descricao}</FormDescription>
                </FormHeader>

                <Suspense fallback={
                  <div style={{ padding: '1rem 0', color: darkMode ? '#9580c8' : '#7a6aaa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="pi pi-spin pi-spinner" style={{ color: '#7443f6' }} />
                    Carregando…
                  </div>
                }>
                  <FormComponent />
                </Suspense>
              </FormCenter>
            </FormScroll>
          ) : (
            <EmptyState $dm={darkMode}>
              <i className="pi pi-arrow-left" />
              <h2>Selecione um processo</h2>
              <p>
                Escolha uma das implementações express ao lado para abrir o
                formulário de configuração.
              </p>
            </EmptyState>
          )}
        </RightPanel>
      </ContentRow>
    </PageWrapper>
  );
}
