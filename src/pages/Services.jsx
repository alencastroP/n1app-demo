import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import styled, { css, keyframes } from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useUserProfile } from '../context/UserProfileContext';
import { useAccountControlSlot } from '../context/AccountControlSlotContext';
import { getChangelogLimit } from '../config/permissionsConfig';
import { SERVICE_KEYS, FEATURE_KEYS } from '../config/teamsConfig';
import {
  getVisibleServices,
  groupServicesBySection,
  readFavoriteServiceKeys,
  toggleFavoriteServiceKey,
} from '../config/servicesCatalog';

// Ordem preferencial dos blocos. Categorias novas do catálogo que não estejam
// aqui entram depois, em ordem alfabética — nunca somem da Store.
const SECTION_ORDER = ['Extrações', 'Integrações', 'Ferramentas', 'Intercom', 'Assistente'];

// Título do bloco quando difere do nome da categoria (a aba usa o nome curto).
const SECTION_TITLES = {
  'Integrações': 'Integrações & API',
};

// Janela entre o clique e a troca de rota: tempo de o card acender e os irmãos
// recuarem. Curto o bastante para não ser lido como lentidão.
const OPEN_TRANSITION_MS = 160;

// ── Paleta da Store ──────────────────────────────────────────────────────────
// Os tons escuros vêm do modelo aprovado: superfície do bloco mais funda que a
// do card, para o card ler como elevado. Os claros são a contraparte da mesma
// família (roxo Ploomes), mantendo as proporções de contraste.
const ACCENT_GRADIENT = 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)';

const surface = (darkMode) => (darkMode ? '#150b23' : '#f9f7ff');
const cardSurface = (darkMode) =>
  darkMode
    ? 'linear-gradient(180deg, #1c1030 0%, #180d29 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #fbf9ff 100%)';
const hairline = (darkMode) => (darkMode ? 'rgba(139,92,246,0.18)' : 'rgba(116,67,246,0.14)');
const hairlineSoft = (darkMode) => (darkMode ? 'rgba(139,92,246,0.14)' : 'rgba(116,67,246,0.12)');
const accentBorder = (darkMode) => (darkMode ? 'rgba(168,85,247,0.55)' : 'rgba(116,67,246,0.45)');
const textStrong = (darkMode) => (darkMode ? '#ece9f6' : '#2a0a50');
const textMuted = (darkMode) => (darkMode ? 'rgba(236,233,246,0.62)' : 'rgba(58,0,92,0.65)');
const textFaint = (darkMode) => (darkMode ? 'rgba(236,233,246,0.45)' : 'rgba(58,0,92,0.5)');

const Container = styled.div`
  min-height: 100vh;
  padding: 1rem 1rem 1rem 3rem;
  width: 100%;
  color: ${({ darkMode }) => textStrong(darkMode)};
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.9rem;
  padding: 1.1rem 1.25rem;
  border-radius: 14px;
  margin-bottom: 1.3rem;
  color: ${({ darkMode }) => textStrong(darkMode)};
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(180deg, rgba(124,58,237,0.14) 0%, rgba(124,58,237,0.03) 100%)'
      : 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, rgba(124,58,237,0.02) 100%)'};
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(139,92,246,0.20)' : 'rgba(139,92,246,0.22)'};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const HeaderIconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: ${ACCENT_GRADIENT};
  box-shadow: 0 6px 18px rgba(109, 40, 217, 0.35);
`;

const HeaderIcon = styled.i`
  font-size: 1.1rem;
  color: #fff;
`;

const HeaderTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.1;
`;

const HeaderTitle = styled.h2`
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
  color: ${({ darkMode }) => textStrong(darkMode)};
`;

const HeaderSubtitle = styled.span`
  font-size: 0.8rem;
  margin-top: 0.25rem;
  color: ${({ darkMode }) => (darkMode ? 'rgba(236,233,246,0.55)' : 'rgba(58,0,92,0.6)')};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const HeaderBadge = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  white-space: nowrap;
  background: transparent;
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b21b6')};
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.3)'};
`;

// Segmented control: as abas são FILTROS de navegação, não ações primárias —
// só a categoria ativa recebe preenchimento (Gestalt: similaridade + figura/fundo).
const Navbar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  padding: 0.2rem;
  border-radius: 11px;
  background: ${({ darkMode }) =>
    darkMode ? 'rgba(124,58,237,0.10)' : 'rgba(124,58,237,0.07)'};
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(139,92,246,0.20)' : 'rgba(139,92,246,0.18)'};
`;

const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex: 1 1 130px;
  min-height: 36px;
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

  background: ${({ $active }) => ($active ? ACCENT_GRADIENT : 'transparent')};
  color: ${({ $active, darkMode }) => {
    if ($active) return '#fff';
    return darkMode ? 'rgba(236,233,246,0.60)' : 'rgba(58,0,92,0.62)';
  }};
  box-shadow: ${({ $active }) =>
    $active ? '0 4px 12px rgba(109, 40, 217, 0.30)' : 'none'};

  &:hover:not(:disabled) {
    background: ${({ $active, darkMode }) => {
      if ($active) return ACCENT_GRADIENT;
      return darkMode ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.10)';
    }};
    color: ${({ $active, darkMode }) => {
      if ($active) return '#fff';
      return darkMode ? '#ece9f6' : '#4c1d95';
    }};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ darkMode }) =>
      darkMode ? 'rgba(196,181,253,0.35)' : 'rgba(124,58,237,0.3)'};
  }
`;

const NavCount = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.6;
`;

const Module = styled.section`
  background: ${({ darkMode }) => surface(darkMode)};
  border-radius: 14px;
  padding: 1.25rem 1.5rem 1.5rem;
  margin-bottom: 1.5rem;
  scroll-margin-top: 1rem;
  border: 1px solid ${({ darkMode }) => hairline(darkMode)};
`;

const ModuleHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
`;

const ModuleTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  color: ${({ darkMode }) => textStrong(darkMode)};
`;

const ModuleCount = styled.span`
  font-size: 0.78rem;
  font-weight: 500;
  white-space: nowrap;
  color: ${({ darkMode }) => textFaint(darkMode)};
`;

// Régua degradê no lugar do border-bottom cheio: fecha a linha do título sem
// cortar o bloco em dois.
const ModuleRule = styled.span`
  flex: 1;
  height: 1px;
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(90deg, rgba(139,92,246,0.35), transparent 92%)'
      : 'linear-gradient(90deg, rgba(116,67,246,0.28), transparent 92%)'};
`;

// GRID com no máximo 3 cards por linha
const CardContainer = styled.div`
  display: grid;
  gap: 1rem;
  align-items: stretch;

  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));

  /* Em telas largas, fixa em 3 colunas */
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const openPulse = keyframes`
  from { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.45); }
  to   { box-shadow: 0 0 0 10px rgba(147, 51, 234, 0); }
`;

// Card em grid de 3 linhas (topo / descrição elástica / rodapé): o rodapé fica
// ancorado no fim independentemente do tamanho da descrição, então a linha de
// botões "Acessar" alinha entre os cards e o olho desce uma coluna só.
const StyledCard = styled.article`
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.85rem;
  height: 100%;
  padding: 1.1rem;
  border-radius: 14px;
  cursor: pointer;
  background: ${({ darkMode }) => cardSurface(darkMode)};
  color: ${({ darkMode }) => textStrong(darkMode)};
  border: 1px solid ${({ $opening, darkMode }) =>
    ($opening ? accentBorder(darkMode) : hairline(darkMode))};
  transition: opacity 0.18s ease, box-shadow 0.2s ease, transform 0.2s ease,
    border-color 0.2s ease;

  /* Durante a saída para o serviço: o card clicado acende e sobe, os irmãos
     recuam — a atenção fica em quem vai virar a próxima tela. */
  opacity: ${({ $dimmed }) => ($dimmed ? 0.4 : 1)};
  pointer-events: ${({ $dimmed }) => ($dimmed ? 'none' : 'auto')};

  ${({ $opening }) =>
    $opening
      ? css`
          transform: translateY(-4px) scale(1.015);
          animation: ${openPulse} ${OPEN_TRANSITION_MS + 240}ms ease-out;
        `
      : css`
          &:hover {
            border-color: ${({ darkMode }) => accentBorder(darkMode)};
            transform: translateY(-2px);
            box-shadow: ${({ darkMode }) =>
              darkMode
                ? '0 12px 30px rgba(10, 4, 20, 0.5)'
                : '0 12px 30px rgba(100, 60, 180, 0.16)'};
          }
        `}
`;

const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const CardIcon = styled.div`
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 12px;
  background: ${({ darkMode }) =>
    darkMode ? 'rgba(139,92,246,0.16)' : 'rgba(116,67,246,0.10)'};
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(139,92,246,0.32)' : 'rgba(116,67,246,0.22)'};
  display: flex;
  justify-content: center;
  align-items: center;

  i {
    font-size: 1.25rem;
    color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#6a4fcf')};
  }
`;

const CardTitle = styled.h2`
  flex: 1;
  min-width: 0;
  margin: 0;
  align-self: center;
  color: ${({ darkMode }) => textStrong(darkMode)};
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.3;
`;

const CardDescription = styled.p`
  margin: 0;
  color: ${({ darkMode }) => textMuted(darkMode)};
  font-size: 0.85rem;
  line-height: 1.5;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  padding-top: 0.8rem;
  border-top: 1px solid ${({ darkMode }) => hairlineSoft(darkMode)};
`;

const StyledButton = styled(Button)`
  background: ${ACCENT_GRADIENT};
  border: 0;
  border-radius: 9px;
  color: #fff;
  padding: 0.48rem 0.95rem;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: ${({ darkMode }) =>
    darkMode
      ? '0 6px 16px rgba(109, 40, 217, 0.32)'
      : '0 6px 16px rgba(109, 40, 217, 0.22)'};
  transition: filter 0.2s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.12);
  }
  &:active:not(:disabled) {
    filter: brightness(0.92);
  }
`;

const FavoriteButton = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.1rem;
  border-radius: 50%;
  flex: none;
  color: ${({ active, darkMode }) => {
    if (active) return darkMode ? '#a78bfa' : '#7443f6';
    return darkMode ? 'rgba(236,233,246,0.28)' : 'rgba(58,0,92,0.28)';
  }};
  transition: transform 0.15s ease, color 0.2s ease, background-color 0.2s ease;

  i {
    font-size: 1.05rem;
  }

  &:hover {
    transform: scale(1.2);
    background-color: ${({ darkMode }) =>
      darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
  }
`;

export default function Services() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  const [selectedModule, setSelectedModule] = useState(null);
  // Um ref por bloco de categoria — as seções vêm do catálogo, não de uma
  // lista fixa, então os refs também são dinâmicos.
  const sectionRefs = useRef({});

  const { canDo, isAdmin, profileId, teamId } = useUserProfile();
  // A Store tem cabeçalho próprio: recebe o controle de sessão na linha do
  // título, ao lado da contagem de serviços.
  const { registerSlot } = useAccountControlSlot();
  const [favoriteKeys, setFavoriteKeys] = useState(() => readFavoriteServiceKeys());

  // Serviço em abertura: segura a transição de saída até a troca de rota.
  const [openingKey, setOpeningKey] = useState(null);
  const openTimerRef = useRef(null);
  useEffect(() => () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
  }, []);

  const visibleServices = useMemo(
    () => getVisibleServices(teamId, profileId),
    [teamId, profileId]
  );
  const groupedServices = useMemo(
    () => groupServicesBySection(visibleServices),
    [visibleServices]
  );

  // Um bloco por categoria de serviço presente no catálogo visível.
  const sections = useMemo(() => {
    const present = Object.keys(groupedServices).filter(
      (section) => (groupedServices[section] || []).length > 0
    );
    const known = SECTION_ORDER.filter((section) => present.includes(section));
    const extras = present
      .filter((section) => !SECTION_ORDER.includes(section))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return [...known, ...extras];
  }, [groupedServices]);

  const activeSection = selectedModule && sections.includes(selectedModule)
    ? selectedModule
    : sections[0];

  const serviceDetailsByKey = {
    changelog: {
      descriptionSuffix:
        !isAdmin ? ` (Limite: ${getChangelogLimit(profileId, teamId).toLocaleString('pt-BR')} logs)` : '',
    },
    omie: {
      descriptionOverride: canDo(SERVICE_KEYS.OMIE, FEATURE_KEYS.OMIE_SYNC)
        ? 'Sincronizações (FirstSync/bring) e forçar integração.'
        : 'Forçar integração e consultar informações da conta.',
    },
  };

  const toggleFavorite = (serviceKey) => {
    const updated = toggleFavoriteServiceKey(serviceKey);
    setFavoriteKeys(updated);
  };

  const handleNavClick = (section) => {
    setSelectedModule(section);
    sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Abertura de um serviço: destaca o card, apaga os irmãos e só então troca de
  // rota, com view transition quando o browser suporta (cross-fade entre as duas
  // telas em vez do corte seco). Quem pediu menos movimento navega direto.
  const openService = (service) => {
    if (openingKey) return; // navegação já em curso
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      navigate(service.url);
      return;
    }
    setOpeningKey(service.key);
    openTimerRef.current = setTimeout(
      () => navigate(service.url, { viewTransition: true }),
      OPEN_TRANSITION_MS
    );
  };

  return (
    <Container darkMode={darkMode}>
      <Header darkMode={darkMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <HeaderLeft>
            <HeaderIconWrap>
              <HeaderIcon className="pi pi-shop" />
            </HeaderIconWrap>
            <HeaderTitleBlock>
              <HeaderTitle darkMode={darkMode}>Store</HeaderTitle>
              <HeaderSubtitle darkMode={darkMode}>Ferramentas e integrações favoritas</HeaderSubtitle>
            </HeaderTitleBlock>
          </HeaderLeft>
          <HeaderActions>
            <HeaderBadge darkMode={darkMode}>
              {visibleServices.length} {visibleServices.length === 1 ? 'serviço' : 'serviços'}
            </HeaderBadge>
            <span ref={registerSlot} />
          </HeaderActions>
        </div>

        <Navbar darkMode={darkMode} aria-label="Categorias de serviço">
          {sections.map((section) => (
            <NavButton
              key={section}
              $active={activeSection === section}
              aria-pressed={activeSection === section}
              darkMode={darkMode}
              onClick={() => handleNavClick(section)}
              type="button"
            >
              {section}
              <NavCount>{(groupedServices[section] || []).length}</NavCount>
            </NavButton>
          ))}
        </Navbar>
      </Header>

      {sections.map((section) => {
        const servicesInSection = groupedServices[section] || [];
        const sectionTitle = SECTION_TITLES[section] ?? section;

        return (
          <Module
            key={section}
            ref={(el) => {
              sectionRefs.current[section] = el;
            }}
            darkMode={darkMode}
          >
            <ModuleHead>
              <ModuleTitle darkMode={darkMode}>{sectionTitle}</ModuleTitle>
              <ModuleCount darkMode={darkMode}>
                {servicesInSection.length} {servicesInSection.length === 1 ? 'serviço' : 'serviços'}
              </ModuleCount>
              <ModuleRule darkMode={darkMode} />
            </ModuleHead>

            <CardContainer>
              {servicesInSection.map((service) => {
                const isFavorite = favoriteKeys.includes(service.key);
                const detail = serviceDetailsByKey[service.key] || {};
                const isOpening = openingKey === service.key;

                return (
                  <StyledCard
                    key={service.key}
                    darkMode={darkMode}
                    $opening={isOpening}
                    $dimmed={!!openingKey && !isOpening}
                    aria-busy={isOpening || undefined}
                    onClick={() => openService(service)}
                  >
                    <CardHead>
                      <CardIcon darkMode={darkMode}>
                        <i className={service.icon} />
                      </CardIcon>

                      <CardTitle darkMode={darkMode}>{service.label}</CardTitle>

                      <FavoriteButton
                        type="button"
                        active={isFavorite}
                        darkMode={darkMode}
                        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(service.key);
                        }}
                      >
                        <i className={`pi ${isFavorite ? 'pi-star-fill' : 'pi-star'}`} />
                      </FavoriteButton>
                    </CardHead>

                    <CardDescription darkMode={darkMode}>
                      {detail.descriptionOverride ?? service.description}
                      {detail.descriptionSuffix ?? ''}
                    </CardDescription>

                    <CardFooter darkMode={darkMode}>
                      <StyledButton
                        darkMode={darkMode}
                        label={isOpening ? 'Abrindo…' : 'Acessar'}
                        icon={isOpening ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-right'}
                        className="p-button-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openService(service);
                        }}
                      />
                    </CardFooter>
                  </StyledCard>
                );
              })}
            </CardContainer>
          </Module>
        );
      })}
    </Container>
  );
}
