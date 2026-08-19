// src/pages/FunilTecnico/components/ui.js
//
// Paleta e átomos de estilo compartilhados pelo módulo Funil do Técnico.
// Fonte única da paleta (violeta Ploomes + severidades) para não repetir tokens
// em cada componente/view. Dark mode via prop transient `$dark` (padrão da página).

import styled, { keyframes, css } from 'styled-components';

/** Retorna os tokens de cor do módulo para o tema atual. */
export const palette = (dark) => ({
  // Superfície do wrapper da página (Page do orquestrador): no dark o módulo
  // assenta no fundo geral da aplicação (sem "segundo fundo", como a Central
  // N1); no light mantém o container destacado.
  bg: dark ? 'transparent' : '#faf8ff',
  panel: dark ? '#130d24' : '#ffffff',
  panelAlt: dark ? '#160b2a' : '#f5f3ff',
  panelSoft: dark ? '#1a0e2e' : '#faf8ff',
  border: dark ? '#231b3a' : '#ede9fb',
  borderSoft: dark ? '#2a1b50' : '#eae6fb',
  text: dark ? '#e2e8f0' : '#1e1b4b',
  textStrong: dark ? '#f3e8ff' : '#3b0764',
  muted: dark ? 'rgba(226,232,240,.55)' : 'rgba(91,33,182,.55)',
  faint: dark ? 'rgba(196,181,253,.45)' : 'rgba(109,40,217,.4)',
  accent: dark ? '#a78bfa' : '#7c3aed',
  accentStrong: dark ? '#c4b5fd' : '#6d28d9',
  accentBg: dark ? 'rgba(76,29,149,.28)' : 'rgba(139,92,246,.1)',
  money: dark ? '#6ee7b7' : '#065f46',
});

// Severidade → cor (light/dark). Fallback = 'media'.
export const SEVERIDADE = {
  baixa:   { label: 'Baixa',   light: '#059669', dark: '#34d399', icon: 'pi-chart-bar' },
  media:   { label: 'Média',   light: '#d97706', dark: '#fbbf24', icon: 'pi-chart-bar' },
  alta:    { label: 'Alta',    light: '#ea580c', dark: '#fb923c', icon: 'pi-chart-bar' },
  critica: { label: 'Crítica', light: '#e11d48', dark: '#fb7185', icon: 'pi-exclamation-triangle' },
};

export const severidadeColor = (sev, dark) => {
  const s = SEVERIDADE[sev] || SEVERIDADE.media;
  return dark ? s.dark : s.light;
};

// Ordem de prioridade (maior = mais urgente) para ordenação.
export const SEVERIDADE_RANK = { critica: 4, alta: 3, media: 2, baixa: 1 };

// Status do deal (Ploomes StatusId).
export const STATUS = {
  1: { label: 'Em aberto', icon: 'pi-circle',       light: '#7c3aed', dark: '#a78bfa' },
  2: { label: 'Ganha',     icon: 'pi-check-circle', light: '#059669', dark: '#34d399' },
  3: { label: 'Perdida',   icon: 'pi-times-circle', light: '#e11d48', dark: '#fb7185' },
};

// Ícone-fallback por tipo de passo do playbook (quando o passo não define `icon`).
export const PLAYBOOK_STEP_ICON = {
  service: 'pi pi-arrow-up-right',
  manual: 'pi pi-user-edit',
  ia: 'pi pi-sparkles',
};

// ── animações ────────────────────────────────────────────────────────────────
export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
`;
export const spin = keyframes`
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
`;

// ── átomos reutilizáveis ──────────────────────────────────────────────────────
export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.16rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}1c`};
  border: 1px solid ${({ $color }) => `${$color}3a`};

  i { font-size: 0.62rem; }
`;

export const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.18)' : 'rgba(116,67,246,.16)')};
  background: ${({ $dark }) => ($dark ? 'rgba(76,29,149,.18)' : 'rgba(139,92,246,.06)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#6d28d9')};
  transition: background .15s ease, border-color .15s ease;

  &:hover:not(:disabled) {
    background: ${({ $dark }) => ($dark ? 'rgba(139,92,246,.3)' : 'rgba(139,92,246,.14)')};
    border-color: ${({ $dark }) => ($dark ? 'rgba(216,180,254,.35)' : 'rgba(109,40,217,.3)')};
  }
  &:disabled { opacity: .5; cursor: not-allowed; }

  i { font-size: 0.78rem; }
`;

export const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.95rem;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  transition: filter .15s ease, transform .15s ease;

  &:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
  &:disabled { opacity: .5; cursor: not-allowed; }

  i { font-size: 0.82rem; }
`;

export const spinCss = css`
  animation: ${spin} 0.9s linear infinite;
`;

/** Fundo/moldura de painel padrão do módulo. */
export const Panel = styled.section`
  border-radius: 15px;
  padding: 1rem 1.1rem;
  background: ${({ $dark }) => palette($dark).panelAlt};
  border: 1px solid ${({ $dark }) => palette($dark).border};
`;

export const PanelTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.85rem;
  color: ${({ $dark }) => ($dark ? 'rgba(196,181,253,.7)' : 'rgba(109,40,217,.6)')};

  i { font-size: 0.8rem; }
`;
