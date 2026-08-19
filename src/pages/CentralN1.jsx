// src/pages/CentralN1.jsx
//
// Central N1 — página agregadora dos recursos exclusivos da equipe Suporte N1.
// Config-driven: os cards vêm de config/centralN1Config.js, agrupados por seção.
// Estados de card: 'ativo' (navega), 'em-breve' e 'desativado' (inertes, com badge).
//
// Controles:
//   - Busca por nome/descrição.
//   - Filtro por status (Todos / Ativos / Em breve / Desativados — só os presentes).
//   - Visualização (persistida em localStorage):
//       'secoes' : blocos por categoria, cada um com fundo tonal (região comum).
//       'grade'  : grade plana de todos os recursos (eyebrow indica a categoria).
//       'lista'  : linhas compactas (eyebrow indica a categoria).
//
// Background: no dark é transparente (herda do layout); no light a página usa
// palette.purple[50] (off-white violeta, mesmo tratamento de "superfície
// destacada" do Funil Técnico) para separar as seções do fundo cinza do shell.
// Tema via useDarkMode() + transient prop $dm, ancorado nos tokens do DS.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS } from '../config/teamsConfig';
import { centralN1Config, CENTRAL_N1_SECTIONS } from '../config/centralN1Config';
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
const c = (dm) => createColors(dm ? 'dark' : 'light');
const sh = (dm) => createShadows(dm ? 'dark' : 'light');

// Identidade visual por categoria — ícone do cabeçalho, tinte do tile do ícone
// (fg/bg) e o fundo/borda sutis do painel da seção.
const SECTION_TONE = {
  'Operação': {
    icon: 'pi pi-bolt',
    fg: (dm) => (dm ? palette.purple[400] : palette.purple[500]),
    bg: (dm) => (dm ? 'rgba(171,130,255,0.14)' : 'rgba(116,67,246,0.10)'),
    surface: (dm) => (dm ? 'rgba(133,41,255,0.07)' : 'rgba(116,67,246,0.045)'),
    edge: (dm) => (dm ? 'rgba(171,130,255,0.18)' : 'rgba(116,67,246,0.16)'),
  },
  'Análises & IA': {
    icon: 'pi pi-chart-line',
    fg: () => palette.info[500],
    bg: (dm) => (dm ? 'rgba(59,130,246,0.16)' : 'rgba(59,130,246,0.10)'),
    surface: (dm) => (dm ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)'),
    edge: (dm) => (dm ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.16)'),
  },
  'Utilitários': {
    icon: 'pi pi-wrench',
    fg: (dm) => (dm ? palette.neutralDark[600] : palette.neutralLight[600]),
    bg: (dm) => (dm ? 'rgba(159,143,211,0.14)' : 'rgba(107,114,128,0.10)'),
    surface: (dm) => (dm ? 'rgba(159,143,211,0.06)' : 'rgba(107,114,128,0.045)'),
    edge: (dm) => (dm ? 'rgba(159,143,211,0.16)' : 'rgba(107,114,128,0.14)'),
  },
};
const toneFor = (secao) => SECTION_TONE[secao] ?? SECTION_TONE['Utilitários'];

const BADGE = {
  ativo:        { label: 'Ativo',      icon: 'pi pi-check-circle' },
  'em-breve':   { label: 'Em breve',   icon: 'pi pi-clock' },
  desativado:   { label: 'Desativado', icon: 'pi pi-ban' },
};

// Rótulos (plural) dos filtros de status.
const STATUS_FILTER_LABEL = {
  ativo: 'Ativos',
  'em-breve': 'Em breve',
  desativado: 'Desativados',
};
const STATUS_ORDER = ['ativo', 'em-breve', 'desativado'];

const VIEWS = [
  { key: 'secoes', label: 'Seções', icon: 'pi pi-table' },
  { key: 'grade',  label: 'Grade',  icon: 'pi pi-th-large' },
  { key: 'lista',  label: 'Lista',  icon: 'pi pi-bars' },
];
const VIEW_STORAGE_KEY = 'centralN1:view';

/* ── layout ─────────────────────────────────────────────────────────────── */
const Page = styled.div`
  position: relative;
  /* O <Main> do Layout aplica padding: 2rem; usamos margens negativas para
     "estourar" esse padding e fazer um único fundo cobrir toda a área de
     conteúdo — evita o efeito de dois tons (fundo da Page vs. do Container). */
  margin: -2rem;
  min-height: 100vh; /* preenche a viewport mesmo com pouco conteúdo */
  box-sizing: border-box;
  padding: 2rem clamp(1.25rem, 4vw, 3rem) 5rem;
  background: ${({ $dm }) => ($dm ? 'none' : palette.purple[50])};
  color: ${({ $dm }) => c($dm).text.primary};
  transition: ${presets.color};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${({ $dm }) => c($dm).border.subtle};
`;

const BrandTile = styled.div`
  width: 54px;
  height: 54px;
  flex: none;
  border-radius: ${radius.xl};
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.4rem;
  background: linear-gradient(135deg, ${palette.purple[500]}, ${palette.purple[400]});
  box-shadow: ${({ $dm }) => ($dm ? sh(true)[4] : '0 8px 20px rgba(116,67,246,0.30)')};
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-right: auto;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${({ $dm }) => c($dm).text.primary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ $dm }) => c($dm).text.secondary};
`;

const TeamChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.95rem;
  border-radius: ${radius.full};
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ $dm }) => c($dm).primary};
  background: ${({ $dm }) => c($dm).primarySoft};
  border: 1px solid ${({ $dm }) => ($dm ? 'rgba(171,130,255,0.30)' : 'rgba(116,67,246,0.22)')};

  i { font-size: 0.82rem; }
`;

/* ── controles (busca + filtros + visualização) ──────────────────────────── */
const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
`;

const Search = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 360px;

  i {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.85rem;
    color: ${({ $dm }) => c($dm).text.muted};
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 2rem 0 2.15rem;
  font-size: 0.88rem;
  border-radius: ${radius.full};
  color: ${({ $dm }) => c($dm).text.primary};
  background: ${({ $dm }) => c($dm).bg.surface};
  border: 1px solid ${({ $dm }) => c($dm).border.default};
  transition: ${presets.base};

  &::placeholder { color: ${({ $dm }) => c($dm).text.muted}; }
  &:focus {
    outline: none;
    border-color: ${({ $dm }) => ($dm ? palette.purple[400] : palette.purple[500])};
    box-shadow: ${({ $dm }) => sh($dm).focus};
  }
`;

const ClearSearch = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: ${({ $dm }) => c($dm).text.muted};
  background: transparent;
  transition: ${presets.base};
  i { font-size: 0.7rem; }
  &:hover { background: ${({ $dm }) => c($dm).bg.sunken}; color: ${({ $dm }) => c($dm).text.primary}; }
`;

/* Segmented control reutilizado por status e visualização. */
const Segmented = styled.div`
  display: inline-flex;
  padding: 4px;
  gap: 2px;
  border-radius: ${radius.full};
  background: ${({ $dm }) => c($dm).bg.surface};
  border: 1px solid ${({ $dm }) => c($dm).border.default};
  box-shadow: ${({ $dm }) => sh($dm)[1]};
`;

const SegBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.8rem;
  border: none;
  border-radius: ${radius.full};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: ${presets.base};
  color: ${({ $dm, $active }) => ($active ? c($dm).onPrimary : c($dm).text.secondary)};
  background: ${({ $active }) =>
    $active
      ? `linear-gradient(135deg, ${palette.purple[500]}, ${palette.purple[400]})`
      : 'transparent'};
  box-shadow: ${({ $dm, $active }) => ($active ? sh($dm)[2] : 'none')};

  &:hover {
    color: ${({ $dm, $active }) => ($active ? c($dm).onPrimary : c($dm).text.primary)};
    background: ${({ $dm, $active }) =>
      $active
        ? `linear-gradient(135deg, ${palette.purple[500]}, ${palette.purple[400]})`
        : $dm
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(116,67,246,0.06)'};
  }
  &:focus-visible { outline: none; box-shadow: ${({ $dm }) => sh($dm).focus}; }

  i { font-size: 0.76rem; }

  /* Em telas estreitas, mantém só o ícone no toggle de visualização. */
  @media (max-width: 560px) {
    ${({ $iconOnlyMobile }) => $iconOnlyMobile && 'span { display: none; } padding: 0.46rem 0.6rem;'}
  }
`;

const ViewGroup = styled(Segmented)`
  margin-left: auto;
`;

/* ── seção (bloco por categoria, com fundo tonal) ─────────────────────────── */
const Section = styled.section`
  padding: 1.25rem 1.35rem 1.5rem;
  border-radius: ${radius['2xl']};
  background: ${({ $tone, $dm }) => $tone.surface($dm)};
  border: 1px solid ${({ $tone, $dm }) => $tone.edge($dm)};
  /* Sombra suave só no light: destaca o painel sobre o fundo purple[50]
     (no dark o contraste tonal já resolve). */
  box-shadow: ${({ $dm }) => ($dm ? 'none' : sh(false)[1])};
  margin-bottom: 1.25rem;
  &:last-of-type { margin-bottom: 0; }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.1rem;
`;

const SectionIcon = styled.div`
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: ${radius.lg};
  display: grid;
  place-items: center;
  font-size: 0.95rem;
  color: ${({ $tone, $dm }) => $tone.fg($dm)};
  background: ${({ $tone, $dm }) => $tone.bg($dm)};
`;

const SectionLabel = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${({ $dm }) => c($dm).text.primary};
`;

const SectionCount = styled.span`
  flex: none;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.12rem 0.5rem;
  border-radius: ${radius.full};
  color: ${({ $dm }) => c($dm).text.muted};
  background: ${({ $dm }) => c($dm).bg.surface};
  border: 1px solid ${({ $dm }) => c($dm).border.subtle};
`;

const SectionRule = styled.div`
  flex: 1;
  height: 1px;
  background: ${({ $tone, $dm }) => $tone.edge($dm)};
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

/* ── card de recurso ─────────────────────────────────────────────────────── */
const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.25rem;
  border-radius: ${radius.xl};
  background: ${({ $dm }) => c($dm).bg.surface};
  border: 1px solid ${({ $dm }) => c($dm).border.default};
  box-shadow: ${({ $dm }) => sh($dm)[2]};
  transition: ${presets.base};

  ${({ $inert, $dm }) =>
    $inert
      ? 'cursor: default;'
      : `
    cursor: pointer;
    &:hover {
      transform: translateY(-3px);
      border-color: ${$dm ? palette.purple[400] : palette.purple[500]};
      box-shadow: ${sh($dm)[4]};
    }
    &:focus-visible {
      outline: none;
      box-shadow: ${sh($dm).focus};
    }
  `}

  ${({ $dimmed }) => $dimmed && 'opacity: 0.55;'}
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
`;

const CardIcon = styled.div`
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: ${radius.lg};
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  color: ${({ $tone, $dm }) => $tone.fg($dm)};
  background: ${({ $tone, $dm }) => $tone.bg($dm)};
`;

const Eyebrow = styled.span`
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${({ $tone, $dm }) => $tone.fg($dm)};
`;

const CardName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ $dm }) => c($dm).text.primary};
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: ${({ $dm }) => c($dm).text.secondary};
`;

const CardCta = styled.div`
  margin-top: auto;
  padding-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $dm }) => c($dm).primary};

  i { transition: transform ${durations.base} ${easings.standard}; }
  ${Card}:hover & i { transform: translateX(4px); }
`;

/* ── linha (visualização "lista") ────────────────────────────────────────── */
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-radius: ${radius.xl};
  background: ${({ $dm }) => c($dm).bg.surface};
  border: 1px solid ${({ $dm }) => c($dm).border.default};
  box-shadow: ${({ $dm }) => sh($dm)[1]};
  transition: ${presets.base};

  ${({ $inert, $dm }) =>
    $inert
      ? 'cursor: default;'
      : `
    cursor: pointer;
    &:hover {
      border-color: ${$dm ? palette.purple[400] : palette.purple[500]};
      box-shadow: ${sh($dm)[3]};
    }
    &:focus-visible { outline: none; box-shadow: ${sh($dm).focus}; }
  `}

  ${({ $dimmed }) => $dimmed && 'opacity: 0.55;'}
`;

const RowText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
`;

const RowDesc = styled.span`
  font-size: 0.8rem;
  color: ${({ $dm }) => c($dm).text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowArrow = styled.i`
  flex: none;
  color: ${({ $dm }) => c($dm).primary};
  font-size: 0.85rem;
  transition: transform ${durations.base} ${easings.standard};
  ${Row}:hover & { transform: translateX(4px); }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: ${radius.full};
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex: none;

  ${({ $variant, $dm }) => {
    const col = c($dm);
    if ($variant === 'ativo') {
      return `color: ${palette.success[$dm ? 500 : 700]}; background: ${col.successSoft};`;
    }
    if ($variant === 'em-breve') {
      return `color: ${palette.info[$dm ? 500 : 700]}; background: ${col.infoSoft};`;
    }
    return `
      color: ${col.text.muted};
      background: ${$dm ? 'rgba(159,143,211,0.14)' : 'rgba(107,114,128,0.10)'};
    `;
  }}

  i { font-size: 0.62rem; }
`;

/* ── estado vazio ────────────────────────────────────────────────────────── */
const Empty = styled.div`
  text-align: center;
  padding: 3.5rem 1rem;
  border-radius: ${radius['2xl']};
  border: 1px dashed ${({ $dm }) => c($dm).border.default};
  color: ${({ $dm }) => c($dm).text.muted};

  i { font-size: 1.7rem; display: block; margin-bottom: 0.6rem; opacity: 0.6; }
  p { margin: 0; font-size: 0.9rem; }
`;

/* ── FAB (atalho para o N1 Copilot) ──────────────────────────────────────── */
const Fab = styled.button`
  position: fixed;
  right: clamp(1rem, 3vw, 2rem);
  bottom: clamp(1rem, 3vw, 2rem);
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.35rem;
  cursor: pointer;
  background: linear-gradient(135deg, ${palette.purple[500]}, ${palette.purple[400]});
  box-shadow: 0 12px 28px rgba(116,67,246,0.45);
  transition: ${presets.base};
  z-index: 40;

  &:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 16px 34px rgba(116,67,246,0.55); }
  &:focus-visible { outline: none; box-shadow: ${({ $dm }) => sh($dm).focus}, 0 12px 28px rgba(116,67,246,0.45); }
`;

/* ── helpers de interação dos cards ──────────────────────────────────────── */
function cardInteractionProps(item, inert, onOpen) {
  if (inert) return { 'aria-disabled': true };
  return {
    role: 'button',
    tabIndex: 0,
    onClick: () => onOpen(item),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(item);
      }
    },
  };
}

/* ── subcomponentes ──────────────────────────────────────────────────────── */
function ResourceCard({ item, dm, onOpen, showSection }) {
  const active = item.status === 'ativo';
  const inert = !active;
  const dimmed = item.status === 'desativado';
  const badge = BADGE[item.status];
  const tone = toneFor(item.secao);
  return (
    <Card $dm={dm} $inert={inert} $dimmed={dimmed} {...cardInteractionProps(item, inert, onOpen)}>
      <CardTop>
        <CardIcon $dm={dm} $tone={tone}>
          <i className={item.icone} />
        </CardIcon>
        {badge && (
          <Badge $variant={item.status} $dm={dm}>
            <i className={badge.icon} />
            {badge.label}
          </Badge>
        )}
      </CardTop>
      {showSection && <Eyebrow $dm={dm} $tone={tone}>{item.secao}</Eyebrow>}
      <CardName $dm={dm}>{item.nome}</CardName>
      {item.descricao && <CardDesc $dm={dm}>{item.descricao}</CardDesc>}
      {active && (
        <CardCta $dm={dm}>
          {item.ctaLabel ?? 'Acessar'}
          <i className="pi pi-arrow-right" />
        </CardCta>
      )}
    </Card>
  );
}

function ResourceRow({ item, dm, onOpen, showSection }) {
  const active = item.status === 'ativo';
  const inert = !active;
  const dimmed = item.status === 'desativado';
  const badge = BADGE[item.status];
  const tone = toneFor(item.secao);
  return (
    <Row $dm={dm} $inert={inert} $dimmed={dimmed} {...cardInteractionProps(item, inert, onOpen)}>
      <CardIcon $dm={dm} $tone={tone}>
        <i className={item.icone} />
      </CardIcon>
      <RowText>
        {showSection && <Eyebrow $dm={dm} $tone={tone}>{item.secao}</Eyebrow>}
        <CardName $dm={dm}>{item.nome}</CardName>
        {item.descricao && <RowDesc $dm={dm}>{item.descricao}</RowDesc>}
      </RowText>
      {badge && (
        <Badge $variant={item.status} $dm={dm}>
          <i className={badge.icon} />
          {badge.label}
        </Badge>
      )}
      {active && <RowArrow className="pi pi-arrow-right" $dm={dm} />}
    </Row>
  );
}

/* ── componente ─────────────────────────────────────────────────────────── */
export default function CentralN1() {
  const { darkMode: dm } = useDarkMode();
  const { isAdmin, canService } = useUserProfile();
  const navigate = useNavigate();

  const [view, setView] = useState(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    return VIEWS.some((v) => v.key === stored) ? stored : 'secoes';
  });
  const changeView = (key) => {
    setView(key);
    localStorage.setItem(VIEW_STORAGE_KEY, key);
  };

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');

  const handleOpen = (item) => {
    if (item.status === 'ativo' && item.rota) navigate(item.rota);
  };

  // Cards adminOnly só aparecem para administradores (a rota também é protegida).
  const visible = useMemo(
    () => centralN1Config.filter((card) => !card.adminOnly || isAdmin),
    [isAdmin]
  );

  // Filtros de status disponíveis (apenas os presentes nos cards visíveis).
  const statusFilters = useMemo(() => {
    const present = new Set(visible.map((card) => card.status));
    return [
      { key: 'todos', label: 'Todos' },
      ...STATUS_ORDER.filter((s) => present.has(s)).map((s) => ({
        key: s,
        label: STATUS_FILTER_LABEL[s],
      })),
    ];
  }, [visible]);

  // Aplica busca + filtro de status.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((card) => {
      if (status !== 'todos' && card.status !== status) return false;
      if (q) {
        const hay = `${card.nome} ${card.descricao ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visible, status, query]);

  // Seções na ordem fixa (para a visualização "secoes"), só com itens filtrados.
  const sections = useMemo(
    () =>
      CENTRAL_N1_SECTIONS.map((secao) => ({
        secao,
        items: filtered.filter((card) => card.secao === secao),
      })).filter((s) => s.items.length > 0),
    [filtered]
  );

  const hasResults = filtered.length > 0;
  const showFab = canService(SERVICE_KEYS.COPILOT);

  return (
    <Page $dm={dm}>
      <Header $dm={dm}>
        <BrandTile $dm={dm}>
          <i className="pi pi-compass" />
        </BrandTile>
        <HeaderText>
          <Title $dm={dm}>Central N1</Title>
          <Subtitle $dm={dm}>Recursos exclusivos do Suporte N1.</Subtitle>
        </HeaderText>
        <TeamChip $dm={dm}>
          <i className="pi pi-users" />
          Suporte N1
        </TeamChip>
      </Header>

      <Controls>
        <Search $dm={dm}>
          <i className="pi pi-search" />
          <SearchInput
            $dm={dm}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar recurso…"
            aria-label="Buscar recurso"
          />
          {query && (
            <ClearSearch $dm={dm} onClick={() => setQuery('')} aria-label="Limpar busca">
              <i className="pi pi-times" />
            </ClearSearch>
          )}
        </Search>

        <Segmented $dm={dm} role="group" aria-label="Filtrar por status">
          {statusFilters.map((s) => (
            <SegBtn
              key={s.key}
              $dm={dm}
              $active={status === s.key}
              onClick={() => setStatus(s.key)}
            >
              {s.label}
            </SegBtn>
          ))}
        </Segmented>

        <ViewGroup $dm={dm} role="tablist" aria-label="Modo de visualização">
          {VIEWS.map((v) => (
            <SegBtn
              key={v.key}
              $dm={dm}
              $active={view === v.key}
              $iconOnlyMobile
              role="tab"
              aria-selected={view === v.key}
              title={v.label}
              onClick={() => changeView(v.key)}
            >
              <i className={v.icon} />
              <span>{v.label}</span>
            </SegBtn>
          ))}
        </ViewGroup>
      </Controls>

      {!hasResults && (
        <Empty $dm={dm}>
          <i className="pi pi-inbox" />
          <p>Nenhum recurso encontrado com os filtros atuais.</p>
        </Empty>
      )}

      {/* ── Seções (blocos com fundo tonal) ─────────────────────────────── */}
      {hasResults && view === 'secoes' &&
        sections.map(({ secao, items }) => {
          const tone = toneFor(secao);
          return (
            <Section key={secao} $dm={dm} $tone={tone}>
              <SectionHead>
                <SectionIcon $dm={dm} $tone={tone}>
                  <i className={tone.icon} />
                </SectionIcon>
                <SectionLabel $dm={dm}>{secao}</SectionLabel>
                <SectionCount $dm={dm}>
                  {items.length} {items.length === 1 ? 'recurso' : 'recursos'}
                </SectionCount>
                <SectionRule $dm={dm} $tone={tone} />
              </SectionHead>
              <Grid>
                {items.map((item) => (
                  <ResourceCard key={item.key} item={item} dm={dm} onOpen={handleOpen} />
                ))}
              </Grid>
            </Section>
          );
        })}

      {/* ── Grade (plana) ────────────────────────────────────────────────── */}
      {hasResults && view === 'grade' && (
        <Grid>
          {filtered.map((item) => (
            <ResourceCard key={item.key} item={item} dm={dm} onOpen={handleOpen} showSection />
          ))}
        </Grid>
      )}

      {/* ── Lista (compacta) ─────────────────────────────────────────────── */}
      {hasResults && view === 'lista' && (
        <List>
          {filtered.map((item) => (
            <ResourceRow key={item.key} item={item} dm={dm} onOpen={handleOpen} showSection />
          ))}
        </List>
      )}

      {showFab && (
        <Fab
          $dm={dm}
          title="Abrir N1 Copilot"
          aria-label="Abrir N1 Copilot"
          onClick={() => navigate('/copilot')}
        >
          <i className="pi pi-sparkles" />
        </Fab>
      )}
    </Page>
  );
}
