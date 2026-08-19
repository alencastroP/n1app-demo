// src/pages/FunilTecnico/index.jsx
//
// Orquestrador do módulo "Funil do Técnico" (Central N1 → triagem assistida por
// IA). Carrega o funil, deriva casos/métricas e alterna entre 4 views:
//   Fila de Triagem · Kanban enriquecido · Workspace do caso · Copiloto IA.
//
// A análise profunda (dado do cliente → Claude) é gated: o backend é o gate
// autoritativo (FUNIL_DEEP_ANALYSIS_ENABLED); esta flag de UI só decide se o
// fluxo é exibido, sem nunca enviar dado antes da liberação.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useDarkMode } from '../../DarkModeContext';
import { fetchKanbanFunnel } from '../../services/ploomesKanbanService';
import { palette, spin, PrimaryBtn } from './components/ui';
import { flattenCasos, computeMetrics, deriveCaso } from './data';
import MetricCards from './components/MetricCards';
import NovoCasoModal from './components/NovoCasoModal';
import FilaTriagem from './views/FilaTriagem';
import KanbanEnriquecido from './views/KanbanEnriquecido';
import WorkspaceCaso from './views/WorkspaceCaso';
import CopilotoIA from './views/CopilotoIA';

// Flag de UI para o fluxo de análise profunda (o gate real é no backend).
const DEEP_UI_HINT = import.meta.env.VITE_FUNIL_DEEP_ANALYSIS_ENABLED === 'true';

const VIEWS = [
  { key: 'fila',      label: 'Fila de Triagem',   icon: 'pi-bolt' },
  { key: 'kanban',    label: 'Kanban enriquecido', icon: 'pi-th-large' },
  { key: 'workspace', label: 'Workspace do caso',  icon: 'pi-window-maximize' },
  { key: 'copiloto',  label: 'Copiloto IA',        icon: 'pi-sparkles' },
];

// Views que exigem um caso selecionado (gating: desabilitadas até a seleção).
const GATED_VIEWS = new Set(['workspace', 'copiloto']);

/** Lê o id do caso do query param `?caso=` (deep-link/refresh). */
function casoIdFromParams(params) {
  const n = Number(params.get('caso'));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/* ── shell ───────────────────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  padding: 1.25rem 1.25rem 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  color: ${({ $dark }) => palette($dark).text};
  background: ${({ $dark }) => palette($dark).bg};

  @media (max-width: 640px) { padding: 1rem 0.85rem 1.5rem 0.85rem; }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  row-gap: 0.7rem;
  gap: 1rem;
  padding: 0.95rem 1.1rem;
  border-radius: 16px;
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};
  box-shadow: ${({ $dark }) => ($dark ? '0 4px 24px rgba(0,0,0,.4)' : '0 2px 12px rgba(100,60,200,.07)')};

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HLeft = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 0.5rem;
  gap: 0.9rem;
  min-width: 0;
`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.8rem; font-weight: 600; padding: 0.4rem 0.85rem;
  border-radius: 10px; cursor: pointer;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.18)' : 'rgba(116,67,246,.16)')};
  background: ${({ $dark }) => ($dark ? 'rgba(76,29,149,.18)' : 'rgba(139,92,246,.06)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#6d28d9')};
  transition: background .15s ease, transform .15s ease;
  &:hover { transform: translateX(-2px); }
  i { font-size: 0.8rem; }
`;

const IconBox = styled.div`
  width: 42px; height: 42px; flex-shrink: 0; border-radius: 13px; display: grid; place-items: center;
  background: ${({ $dark }) =>
    $dark ? 'linear-gradient(145deg,rgba(139,92,246,.4),rgba(91,20,184,.35))' : 'linear-gradient(145deg,rgba(139,92,246,.22),rgba(91,20,184,.14))'};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(216,180,254,.3)' : 'rgba(116,67,246,.22)')};
  i { font-size: 1.2rem; color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')}; }
`;

const HTitle = styled.h1`
  font-size: 1.3rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;
  color: ${({ $dark }) => palette($dark).textStrong};
  overflow-wrap: break-word;
`;
const HSub = styled.p`
  font-size: 0.8rem; margin: 0; color: ${({ $dark }) => palette($dark).muted};
  overflow-wrap: break-word;
`;

const HRight = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 0.5rem;
  gap: 0.6rem;

  @media (max-width: 640px) { justify-content: flex-start; }
`;

const TotalBadge = styled.div`
  display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; font-weight: 700;
  padding: 0.35rem 0.8rem; border-radius: 999px;
  color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
  background: ${({ $dark }) => palette($dark).accentBg};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.22)' : 'rgba(139,92,246,.2)')};
  i { font-size: 0.7rem; }
`;

const ReloadBtn = styled.button`
  width: 34px; height: 34px; border-radius: 10px; cursor: pointer; display: grid; place-items: center;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.18)' : 'rgba(116,67,246,.16)')};
  background: ${({ $dark }) => ($dark ? 'rgba(76,29,149,.2)' : 'rgba(139,92,246,.07)')};
  color: ${({ $dark }) => ($dark ? '#a78bfa' : '#6d28d9')};
  i { font-size: 0.9rem; ${({ $spinning }) => $spinning && css`animation: ${spin} .9s linear infinite;`} }
`;

/* ── tabs ────────────────────────────────────────────────────────────────── */
const Tabs = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  padding: 0.4rem;
  border-radius: 13px;
  background: ${({ $dark }) => palette($dark).panelAlt};
  border: 1px solid ${({ $dark }) => palette($dark).border};
`;

const Tab = styled.button`
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.82rem; font-weight: 700; padding: 0.5rem 0.95rem; border-radius: 9px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  border: none;
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  color: ${({ $active, $dark }) => ($active ? '#fff' : palette($dark).muted)};
  background: ${({ $active }) => ($active ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'transparent')};
  transition: background .15s ease, color .15s ease, opacity .15s ease;
  &:hover {
    color: ${({ $active, $dark, $disabled }) =>
      $disabled ? palette($dark).muted : $active ? '#fff' : palette($dark).accentStrong};
  }
  i { font-size: 0.8rem; }
`;

/* Chip do caso selecionado (à direita das tabs): identifica o caso em foco e
   permite limpá-lo — o que volta o gating de Workspace/Copiloto. */
const CasoChip = styled.div`
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 0.45rem;
  max-width: 340px;
  font-size: 0.76rem; font-weight: 600; padding: 0.35rem 0.4rem 0.35rem 0.75rem; border-radius: 9px;
  color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
  background: ${({ $dark }) => palette($dark).accentBg};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.22)' : 'rgba(139,92,246,.2)')};
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  i { font-size: 0.72rem; flex-shrink: 0; }
  button {
    display: grid; place-items: center; width: 20px; height: 20px; flex-shrink: 0;
    border: none; border-radius: 6px; cursor: pointer; background: transparent;
    color: inherit;
    &:hover { background: ${({ $dark }) => ($dark ? 'rgba(196,181,253,.18)' : 'rgba(139,92,246,.14)')}; }
    i { font-size: 0.66rem; }
  }
`;

const Content = styled.div` flex: 1; min-height: 0; `;

const Center = styled.div`
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.8rem; padding: 3rem; text-align: center;
  color: ${({ $dark }) => palette($dark).muted};
  i { font-size: 2.6rem; opacity: .4; }
`;

/* ── component ───────────────────────────────────────────────────────────── */
export default function FunilTecnico() {
  const { darkMode: dark } = useDarkMode();
  const navigate = useNavigate();
  const toast = useRef(null);

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  // O caso selecionado vive na URL (`?caso=123`) para deep-link/refresh; só o
  // id — o caso é derivado dos `casos` recalculados, assim um "Recarregar"
  // reflete a triagem mais nova no Workspace/Copiloto sem snapshot velho.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCasoId = casoIdFromParams(searchParams);

  // Deep-link com caso na URL abre direto no Workspace.
  const [view, setView] = useState(() => (selectedCasoId ? 'workspace' : 'fila'));

  // Back/forward do navegador pode remover o ?caso= sem passar pelo clearCaso:
  // sai das views gated para não ficar preso num Workspace sem caso.
  useEffect(() => {
    if (!selectedCasoId) setView((v) => (GATED_VIEWS.has(v) ? 'fila' : v));
  }, [selectedCasoId]);

  const loadData = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    fetchKanbanFunnel()
      .then((data) => { if (!cancelled) setBoard(data); })
      .catch((err) => {
        if (cancelled || err?.isPermissionError) return;
        toast.current?.show({
          severity: 'error',
          summary: 'Erro ao carregar o funil',
          detail: err?.message || 'Falha ao buscar o funil.',
          life: 5000,
        });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => loadData(), [loadData]);

  const casos = useMemo(() => flattenCasos(board, dark), [board, dark]);
  const metrics = useMemo(() => computeMetrics(casos), [casos]);

  // Resolve o caso selecionado: primeiro entre os casos da whitelist; senão,
  // procura o deal em qualquer coluna do board (deep-link ou card recém-criado
  // pelo app, cujo owner é o usuário de integração — fora da whitelist).
  const selectedCaso = useMemo(() => {
    if (!selectedCasoId) return null;
    const own = casos.find((c) => c.id === selectedCasoId);
    if (own || !board?.columns) return own || null;
    for (const col of board.columns) {
      const deal = (col.deals || []).find((d) => d.id === selectedCasoId);
      if (deal) return deriveCaso(deal, col.stage, dark);
    }
    return null;
  }, [casos, board, selectedCasoId, dark]);

  const notify = useCallback((detail, severity = 'info') => {
    toast.current?.show({ severity, summary: 'Funil do Técnico', detail, life: 3500 });
  }, []);

  // Seleção grava o id na URL (deep-link); limpar volta o gating das tabs.
  const selectCaso = useCallback((casoId, nextView) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('caso', String(casoId));
      return next;
    });
    setView(nextView);
  }, [setSearchParams]);

  const openWorkspace = useCallback((caso) => selectCaso(caso.id, 'workspace'), [selectCaso]);
  const openCopiloto = useCallback((caso) => selectCaso(caso.id, 'copiloto'), [selectCaso]);

  const clearCaso = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('caso');
      return next;
    });
    setView((v) => (GATED_VIEWS.has(v) ? 'fila' : v));
  }, [setSearchParams]);

  // "+ Novo caso técnico" (Fase B): sucesso → refresh do funil + seleciona o caso.
  const [novoCasoOpen, setNovoCasoOpen] = useState(false);
  const handleCasoCriado = useCallback((dealId) => {
    setNovoCasoOpen(false);
    notify('Caso técnico criado no Ploomes.', 'success');
    loadData();
    selectCaso(dealId, 'workspace');
  }, [notify, loadData, selectCaso]);

  const totalOwned = casos.length;

  return (
    <Page $dark={dark}>
      <Toast ref={toast} />

      {/* Header — padrão próprio do módulo. TODO(merge): avaliar ServiceHeader
          (feat/plataforma-ux) na harmonização; esta branch mergeia por último. */}
      <Header $dark={dark}>
        <HLeft>
          <BackBtn $dark={dark} onClick={() => navigate('/central-n1')} title="Voltar à Central N1">
            <i className="pi pi-arrow-left" /> Central N1
          </BackBtn>
          <IconBox $dark={dark}><i className="pi pi-sitemap" /></IconBox>
          <div>
            <HTitle $dark={dark}>Funil do Técnico</HTitle>
            <HSub $dark={dark}>Sup | Casos Técnicos · triagem assistida por IA</HSub>
          </div>
        </HLeft>
        <HRight>
          {board && (
            <TotalBadge $dark={dark}>
              <i className="pi pi-briefcase" />
              {totalOwned} de {board.totalDeals} negociações
            </TotalBadge>
          )}
          <PrimaryBtn type="button" onClick={() => setNovoCasoOpen(true)} title="Criar caso técnico no funil do Ploomes">
            <i className="pi pi-plus" /> Novo caso técnico
          </PrimaryBtn>
          <ReloadBtn $dark={dark} $spinning={loading} onClick={loadData} disabled={loading} title="Recarregar">
            <i className="pi pi-refresh" />
          </ReloadBtn>
        </HRight>
      </Header>

      <NovoCasoModal
        visible={novoCasoOpen}
        dark={dark}
        onHide={() => setNovoCasoOpen(false)}
        onCreated={handleCasoCriado}
      />

      {/* Tabs — Workspace/Copiloto ficam gated até existir caso selecionado */}
      <Tabs $dark={dark}>
        {VIEWS.map((v) => {
          // Gating pelo caso RESOLVIDO no board (não só o id da URL): um
          // ?caso= inválido/deletado não destrava Workspace/Copiloto.
          const gated = GATED_VIEWS.has(v.key) && !selectedCaso;
          return (
            <Tab
              key={v.key}
              $dark={dark}
              $active={view === v.key}
              $disabled={gated}
              disabled={gated}
              title={gated ? 'Selecione um caso' : undefined}
              onClick={() => { if (!gated) setView(v.key); }}
              type="button"
            >
              <i className={`pi ${v.icon}`} /> {v.label}
            </Tab>
          );
        })}
        {selectedCasoId && (
          <CasoChip $dark={dark}>
            <i className="pi pi-file" />
            <span title={selectedCaso?.title || undefined}>
              {selectedCaso?.title || `Caso #${selectedCasoId}`}
            </span>
            <button type="button" onClick={clearCaso} title="Limpar caso selecionado">
              <i className="pi pi-times" />
            </button>
          </CasoChip>
        )}
      </Tabs>

      {/* Métricas (nas views de visão geral) */}
      {board && (view === 'fila' || view === 'kanban') && (
        <MetricCards metrics={metrics} dark={dark} />
      )}

      {/* Conteúdo */}
      <Content>
        {loading && !board && (
          <Center $dark={dark}>
            <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
            <p>Carregando negociações…</p>
          </Center>
        )}

        {!loading && !board && (
          <Center $dark={dark}>
            <i className="pi pi-inbox" />
            <p>Nenhuma informação disponível.</p>
          </Center>
        )}

        {board && view === 'fila' && (
          <FilaTriagem
            casos={casos}
            dark={dark}
            onResolver={openCopiloto}
            onRevisar={openWorkspace}
          />
        )}

        {board && view === 'kanban' && (
          <KanbanEnriquecido board={board} dark={dark} onOpenCaso={openWorkspace} />
        )}

        {board && view === 'workspace' && (
          <WorkspaceCaso
            caso={selectedCaso}
            dark={dark}
            deepUiHint={DEEP_UI_HINT}
            onGoCopiloto={openCopiloto}
            onToast={notify}
          />
        )}

        {board && view === 'copiloto' && (
          <CopilotoIA
            caso={selectedCaso}
            dark={dark}
            deepUiHint={DEEP_UI_HINT}
            onToast={notify}
          />
        )}
      </Content>
    </Page>
  );
}
