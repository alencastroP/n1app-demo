import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { useDarkMode } from '../DarkModeContext.jsx';
import ploomesIco from '../assets/ploomes_ico.png';
import 'primeicons/primeicons.css';
import Ploo from '../components/PlooButton';
import ContaAtivaWidget from '../components/ContaAtivaWidget';
import {
  AccountControlSlotProvider,
  useAccountControlSlot,
} from '../context/AccountControlSlotContext';
import useLogout from '../hooks/useLogout';
import getInitials from '../utils/initials';
import ServiceSearchModal from '../components/ServiceSearchModal';
import RequestDemandDialog from '../components/RequestDemandDialog';
import { APP_VERSION } from '../config/version';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS, getTeamLabel } from '../config/teamsConfig';
import { LEVEL_LABELS } from '../config/permissionsConfig';
import { useApiDoc } from '../context/ApiDocContext';
import ApiDocOverlay from './apihub/ApiDocOverlay';
import {
  getVisibleServices,
  readFavoriteServiceKeys,
  FAVORITE_SERVICES_STORAGE_KEY,
} from '../config/servicesCatalog';

// Persistência do collapse manual da sidenav (apenas telas grandes).
const SIDENAV_COLLAPSED_KEY = 'n1app.sidenavCollapsed';

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${({ darkMode }) => (darkMode ? '#1E1E2F' : '#c7bdbdff')};
    color: ${({ darkMode }) => (darkMode ? '#EEE' : '#222')};
    transition: background-color 0.3s ease, color 0.3s ease;
  }
`;

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ darkMode }) => (darkMode ? '#120125ff' : '#e7e6e6ff')};
  color: ${({ darkMode }) => (darkMode ? '#eee' : '#222')};
  transition: background 0.3s ease, color 0.3s ease;
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-15px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const SidebarStyled = styled.div`
  width: ${({ $collapsed }) => ($collapsed ? '76px' : '280px')};
  background: ${({ darkMode }) => (darkMode ? '#0e011fff' : '#f5f5f5ff')};
  box-shadow: ${({ darkMode }) => (darkMode ? '0 0 10px #13042488' : '0 0 10px #ddd')};
  border-radius: 0 15px 15px 0;
  display: flex;
  flex-direction: column;
  padding: ${({ $collapsed }) => ($collapsed ? '1.5rem 0.5rem 0 0.5rem' : '1.5rem 1rem 0 1rem')};
  transition: background 0.3s ease, width 0.25s ease, padding 0.25s ease;
  position: fixed;
  height: 100vh;
  /* No modo rail o popover do usuário abre para fora da sidenav. */
  overflow: ${({ $collapsed }) => ($collapsed ? 'visible' : 'hidden')};

  @media (max-width: 768px) {
    position: fixed;
    width: 280px;
    padding: 1.5rem 1rem 0 1rem;
    overflow: hidden;
    left: ${({ visible }) => (visible ? '0' : '-280px')};
    transition: left 0.3s ease;
    z-index: 1050;
  }
`;

const LogoTitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  gap: 12px;
  margin-bottom: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '2rem')};
  flex-shrink: 0;
`;

// Botão de collapse manual da sidenav (apenas telas grandes).
const CollapseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  margin-left: ${({ $rail }) => ($rail ? '0' : '0.25rem')};
  background: transparent;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)')};
  border-radius: 8px;
  cursor: pointer;
  color: ${({ darkMode }) => (darkMode ? '#aaa' : '#888')};
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  i { font-size: 0.85rem; }

  &:hover {
    background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.15)' : 'rgba(116,67,246,0.07)')};
    border-color: rgba(116, 67, 246, 0.4);
    color: #7443f6;
  }
`;

const RailCollapseRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
`;

const Logo = styled.img`
  width: 40px;
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ darkMode }) => (darkMode ? '#ddd' : '#444')};
`;

const VersionBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: ${({ darkMode }) => (darkMode ? 'rgba(200,200,200,0.6)' : 'rgba(100,100,100,0.7)')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')};
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  margin-left: auto;
`;

/* ---- Scrollable nav area ---- */
const NavScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px; /* avoid scrollbar clipping */
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  gap: ${({ $collapsed }) => ($collapsed ? '0' : '15px')};
  font-size: 1.2rem;
  color: ${({ darkMode }) => (darkMode ? '#ddd' : '#444')};
  padding: ${({ $collapsed }) => ($collapsed ? '0.75rem 0.5rem' : '0.75rem 1.2rem')};
  margin-bottom: 0.8rem;
  border-radius: 10px;
  text-decoration: none;
  opacity: 0.95;
  animation: ${slideIn} 0.25s ease forwards;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;

  i {
    font-size: 1.2rem;
    width: 25px;
    text-align: center;
    color: ${({ darkMode }) => (darkMode ? '#aaa' : '#888')};
    transition: color 0.3s ease;
  }

  &.active {
    background: ${({ darkMode }) =>
      darkMode
        ? 'linear-gradient(90deg, rgba(91,20,184,1) 0%, rgba(110,16,165,1) 100%)'
        : 'linear-gradient(90deg, rgba(136,45,255,1) 0%, rgba(153,31,224,1) 100%)'};
    color: white;
    i { color: white; }
  }

  &:hover:not(.active) {
    background-color: ${({ darkMode }) => (darkMode ? '#5820cf7e' : '#ede9ff')};
    color: ${({ darkMode }) => (darkMode ? '#f0e9ff' : '#5a4d8a')};
    transform: ${({ $collapsed }) => ($collapsed ? 'none' : 'translateX(8px)')};
    i { color: ${({ darkMode }) => (darkMode ? '#eee' : '#6e56b1')}; }
  }
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  font-size: 1.2rem;
  color: ${({ darkMode }) => (darkMode ? '#ddd' : '#444')};
  background-color: transparent;
  border: none;
  padding: 0.75rem 1.2rem;
  margin-bottom: 0.8rem;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.3s ease, color 0.3s ease;

  .pi-main-icon {
    font-size: 1.2rem;
    width: 25px;
    text-align: center;
    color: ${({ darkMode }) => (darkMode ? '#aaa' : '#888')};
    transition: color 0.3s ease;
  }

  .dropdown-text { flex-grow: 1; }
  .chevron       { margin-left: auto; }

  &.active {
    background: ${({ darkMode }) =>
      darkMode
        ? 'linear-gradient(90deg, rgba(91,20,184,1) 0%, rgba(110,16,165,1) 100%)'
        : 'linear-gradient(90deg, rgba(136,45,255,1) 0%, rgba(153,31,224,1) 100%)'};
    color: white;
    .pi-main-icon { color: white; }
  }

  &:hover:not(.active) {
    background-color: ${({ darkMode }) => (darkMode ? '#5820cf7e' : '#ede9ff')};
    color: ${({ darkMode }) => (darkMode ? '#f0e9ff' : '#5a4d8a')};
    .pi-main-icon { color: ${({ darkMode }) => (darkMode ? '#eee' : '#6e56b1')}; }
  }
`;

/* ---- Favoritos: cabeçalho de seção + itens compactos ---- */
// O grupo de favoritos deixa de competir com os itens de navegação (Central N1,
// Store): vira um cabeçalho de seção discreto com contagem, e cada favorito é
// uma linha compacta com tile de ícone + nome + categoria de origem.
const FavoritesHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  gap: 0.5rem;
  width: 100%;
  padding: ${({ $collapsed }) => ($collapsed ? '0.5rem 0' : '0.4rem 0.35rem')};
  margin-bottom: 0.4rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: ${({ darkMode }) => (darkMode ? 'rgba(236,233,246,0.55)' : 'rgba(60,40,110,0.62)')};
  transition: color 0.2s ease;

  .fav-star   { font-size: 0.8rem; color: ${({ darkMode }) => (darkMode ? '#a78bfa' : '#7443f6')}; }
  .fav-title  { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; }
  .fav-count  { margin-left: auto; font-size: 0.7rem; font-weight: 600; opacity: 0.8; }
  .fav-chevron{ font-size: 0.6rem; opacity: 0.8; }

  &:hover { color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#4a2fa0')}; }
`;

// Os favoritos são itens de navegação como Central N1 e Store — usam o mesmo
// NavLink, então altura, padding, tamanho de ícone e fonte são exatamente os
// mesmos. Estender (em vez de recriar) impede que os dois voltem a divergir.
const FavoriteItem = styled(NavLink)`
  .fav-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/* services group wrapper: indent + animate */
const SubmenuWrapper = styled.div`
  overflow: hidden;
  padding-left: 0;
  padding-bottom: ${({ isOpen }) => (isOpen ? '0.5rem' : '0')};
  max-height: ${({ isOpen }) => (isOpen ? '600px' : '0')};
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  transition: max-height 0.4s ease-in-out, opacity 0.3s ease;
`;

/* ---- Footer area ---- */
const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
`;


const FooterDivider = styled.div`
  height: 1px;
  background: ${({ darkMode }) => (darkMode ? '#38363fff' : '#e6e5e5ff')};
  margin: 0.75rem 0 0.5rem 0;
`;

const FooterActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0 0 1rem 0;
`;

const HistoricoLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  gap: ${({ $collapsed }) => ($collapsed ? '0' : '12px')};
  font-size: 1rem;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#bbb' : '#555')};
  padding: 0.45rem 0.2rem;
  text-decoration: none;
  border-radius: 8px;
  transition: color 0.2s ease;

  i {
    font-size: 1rem;
    color: ${({ darkMode }) => (darkMode ? '#888' : '#999')};
  }

  &:hover, &.active {
    color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#4a2fa0')};
    i { color: #7443f6; }
  }
`;

// Mesma aparência do HistoricoLink, mas como <button> (ação, não navegação)
const HistoricoButton = styled(HistoricoLink).attrs({ as: 'button', type: 'button' })`
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
`;

const ApiDocNavBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ darkMode, $active }) =>
    $active ? '#7443f6' : darkMode ? '#bbb' : '#555'};
  background: ${({ $active, darkMode }) =>
    $active
      ? darkMode ? 'rgba(116,67,246,0.15)' : 'rgba(116,67,246,0.08)'
      : 'transparent'};
  border: none;
  border-left: 2px solid ${({ $active }) => ($active ? '#7443f6' : 'transparent')};
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.2rem 0.45rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
  margin-bottom: 0.3rem;

  i {
    font-size: 1rem;
    color: ${({ $active }) => ($active ? '#7443f6' : 'inherit')};
    opacity: ${({ $active }) => ($active ? 1 : 0.7)};
  }

  &:hover {
    color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#4a2fa0')};
    i { color: #7443f6; opacity: 1; }
  }
`;

/* ---- Tema: segmented control (rotula o ESTADO, não a ação) ---- */
// "Light Mode" + switch ligado era ambíguo (não dizia qual tema está ativo).
// Duas opções mutuamente exclusivas resolvem: a marcada é o tema corrente.
const ThemeGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const ThemeGroupLabel = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0 0.2rem;
  color: ${({ darkMode }) => (darkMode ? 'rgba(236,233,246,0.45)' : 'rgba(60,40,110,0.5)')};
`;

const ThemeSeg = styled.div`
  display: flex;
  gap: 3px;
  padding: 3px;
  border-radius: 10px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.10)' : 'rgba(116,67,246,0.07)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(167,139,250,0.22)' : 'rgba(139,92,246,0.20)')};
`;

const ThemeSegOption = styled.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;

  background: ${({ $active, darkMode }) => {
    if (!$active) return 'transparent';
    return darkMode
      ? 'linear-gradient(135deg, rgba(109,40,217,1) 0%, rgba(147,51,234,1) 100%)'
      : 'linear-gradient(135deg, rgba(124,58,237,1) 0%, rgba(153,31,224,1) 100%)';
  }};
  color: ${({ $active, darkMode }) => {
    if ($active) return '#fff';
    return darkMode ? 'rgba(236,233,246,0.6)' : 'rgba(60,40,110,0.65)';
  }};
  box-shadow: ${({ $active }) => ($active ? '0 4px 12px rgba(109,40,217,0.28)' : 'none')};

  i { font-size: 0.8rem; }

  &:hover:not(:disabled) {
    color: ${({ $active, darkMode }) => {
      if ($active) return '#fff';
      return darkMode ? '#e2d9ff' : '#4a2fa0';
    }};
  }
`;

const UserInfoLogoutWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'space-between')};
  flex-direction: ${({ $collapsed }) => ($collapsed ? 'column' : 'row')};
  gap: ${({ $collapsed }) => ($collapsed ? '0.35rem' : '1rem')};
`;

// Linha de identidade do usuário no rodapé da sidebar. É apenas INFORMATIVA:
// o menu do usuário (perfil, histórico, usuários, sair) vive no controle de
// sessão do topo direito — uma superfície elevada só para identidade/sessão.
const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  flex: 1;
  color: ${({ darkMode }) => (darkMode ? '#ddd' : '#333')};
  font-weight: 600;
  font-size: 1rem;
`;

const UserAvatar = styled.span`
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #7443f6, #ab82ff);
`;

const UserMeta = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;

  .user-role {
    font-size: 0.7rem;
    font-weight: 600;
    color: ${({ darkMode }) => (darkMode ? 'rgba(236,233,246,0.45)' : 'rgba(60,40,110,0.5)')};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  width: 38px;
  height: 38px;
  color: #e01010ff;
  font-size: 1.25rem;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover { background-color: #e74c3c; color: white; }
  &:focus  { outline: none; box-shadow: 0 0 0 3px #e74c3caa; }
`;

const UserName = styled.span`
  user-select: none;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  gap: ${({ $collapsed }) => ($collapsed ? '0' : '10px')};
  width: 100%;
  padding: ${({ $collapsed }) => ($collapsed ? '0.5rem 0.4rem' : '0.5rem 0.9rem')};
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')};
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.38)')};
  font-size: 0.875rem;
  cursor: pointer;
  text-align: left;
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  i { font-size: 0.875rem; flex-shrink: 0; }

  &:hover {
    background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.15)' : 'rgba(116,67,246,0.07)')};
    border-color: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.4)' : 'rgba(116,67,246,0.3)')};
    color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)')};
  }
`;

const SearchShortcut = styled.span`
  margin-left: auto;
  font-size: 0.65rem;
  font-family: monospace;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)')};
  border-radius: 4px;
  padding: 1px 5px;
  flex-shrink: 0;
`;

const HamburgerButton = styled(Button)`
  @media (min-width: 769px) { display: none !important; }
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1100;
`;

const Overlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${({ visible }) => (visible ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 1040;
  }
`;

const Main = styled.main`
  flex-grow: 1;
  min-width: 0;
  overflow-x: hidden;
  padding: 2rem;
  margin-left: ${({ $collapsed }) => ($collapsed ? '76px' : '280px')};
  transition: margin-left 0.25s ease;
  @media (max-width: 768px) { margin-left: 0; }
`;

// Renderiza o controle de sessão dentro do cabeçalho da página quando ela
// oferece um slot; sem slot, no canto superior direito do conteúdo. É sempre a
// MESMA instância — o portal só muda onde ela é pintada, então a sessão não se
// perde ao navegar entre telas com e sem cabeçalho.
function AccountControlHost() {
  const { slotEl } = useAccountControlSlot();
  const control = <ContaAtivaWidget inline={!!slotEl} />;
  return slotEl ? createPortal(control, slotEl) : control;
}

export default function Layout() {
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { darkMode, setDarkMode } = useDarkMode();

  // Collapse manual da sidenav (persistido por usuário; só vale em telas grandes —
  // o drawer mobile via hambúrguer permanece com o comportamento atual).
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDENAV_COLLAPSED_KEY) === '1'; } catch { return false; }
  });
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 769px)').matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)');
    const onChange = (e) => setIsDesktop(e.matches);
    // Fallback legado (Safari antigo) — mesmo padrão do ThemeProvider do DS.
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  const railMode = collapsed && isDesktop;
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDENAV_COLLAPSED_KEY, next ? '1' : '0'); } catch { /* storage indisponível */ }
      return next;
    });
  };

  const { canService, teamId, profileId, level } = useUserProfile();

  // Dados do popover de perfil — tudo já disponível no contexto/localStorage.
  const teamLabel = getTeamLabel(teamId);
  const levelLabel = level != null ? LEVEL_LABELS[level] : null;
  const { apiDocOpen, setApiDocOpen } = useApiDoc();
  const [favoriteKeys, setFavoriteKeys] = useState(() => readFavoriteServiceKeys());

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);

  const handleLogout = useLogout();

  const closeSidebar = () => {
    if (window.innerWidth <= 768) setSidebarVisible(false);
  };

  useEffect(() => {
    const onFavoriteUpdate = (event) => {
      if (Array.isArray(event?.detail?.keys)) {
        setFavoriteKeys(event.detail.keys);
        return;
      }
      setFavoriteKeys(readFavoriteServiceKeys());
    };

    const onStorage = (event) => {
      if (event.key === FAVORITE_SERVICES_STORAGE_KEY) {
        setFavoriteKeys(readFavoriteServiceKeys());
      }
    };

    window.addEventListener('favorite-services-updated', onFavoriteUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('favorite-services-updated', onFavoriteUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // canAccessService (via getVisibleServices) já trata Copilot, admin e níveis.
  const allVisibleServices = useMemo(
    () => getVisibleServices(teamId, profileId),
    [teamId, profileId]
  );

  const favoriteServices = allVisibleServices.filter((service) =>
    favoriteKeys.includes(service.key)
  );

  return (
    <>
      <GlobalStyle darkMode={darkMode} />
      {railMode && <Tooltip target=".sn-tip" position="right" showDelay={150} />}
      <HamburgerButton
        icon="pi pi-bars"
        style={{ zIndex: 1200 }}
        onClick={() => setSidebarVisible(true)}
        aria-label="Abrir menu"
      />
      <Overlay visible={sidebarVisible} onClick={() => setSidebarVisible(false)} />

      <Container darkMode={darkMode}>
        <SidebarStyled visible={sidebarVisible} darkMode={darkMode} $collapsed={railMode}>

          {/* Logo */}
          <LogoTitleContainer $collapsed={railMode}>
            <Logo src={ploomesIco} alt="Logo" />
            {!railMode && <Title darkMode={darkMode}>N1 App</Title>}
            {!railMode && <VersionBadge darkMode={darkMode}>{APP_VERSION}</VersionBadge>}
            {!railMode && isDesktop && (
              <CollapseBtn
                darkMode={darkMode}
                onClick={toggleCollapsed}
                aria-label="Recolher menu"
                title="Recolher menu"
              >
                <i className="pi pi-angle-double-left" />
              </CollapseBtn>
            )}
          </LogoTitleContainer>
          {railMode && (
            <RailCollapseRow>
              <CollapseBtn
                darkMode={darkMode}
                onClick={toggleCollapsed}
                aria-label="Expandir menu"
                className="sn-tip"
                data-pr-tooltip="Expandir menu"
              >
                <i className="pi pi-angle-double-right" />
              </CollapseBtn>
            </RailCollapseRow>
          )}

          {/* Search */}
          <SearchButton
            darkMode={darkMode}
            $collapsed={railMode}
            onClick={() => setSearchOpen(true)}
            aria-label="Pesquisar serviço"
            className={railMode ? 'sn-tip' : undefined}
            data-pr-tooltip="Pesquisar serviço (Ctrl K)"
          >
            <i className="pi pi-search" />
            {!railMode && <>Pesquisar serviço...</>}
            {!railMode && <SearchShortcut darkMode={darkMode}>Ctrl K</SearchShortcut>}
          </SearchButton>

          {/* Scrollable nav */}
          <NavScroll>
            {/* Central N1 (exclusiva da equipe Suporte N1) — item de navegação
                comum: só se destaca quando é a rota ativa, igual à Store. */}
            {canService(SERVICE_KEYS.CENTRAL_N1) && (
              <NavLink
                to="/central-n1"
                darkMode={darkMode}
                $collapsed={railMode}
                className={`${location.pathname.startsWith('/central-n1') ? 'active' : ''}${railMode ? ' sn-tip' : ''}`}
                data-pr-tooltip="Central N1"
                onClick={closeSidebar}
              >
                <i className="pi pi-compass" />
                {!railMode && 'Central N1'}
              </NavLink>
            )}

            {/* Store */}
            <NavLink
              to="/services"
              darkMode={darkMode}
              $collapsed={railMode}
              className={`${location.pathname === '/services' ? 'active' : ''}${railMode ? ' sn-tip' : ''}`}
              data-pr-tooltip="Store"
              onClick={closeSidebar}
            >
              <i className="pi pi-shop" />
              {!railMode && 'Store'}
            </NavLink>


            {/* 3. Services (favoritos) */}
            {favoriteServices.length > 0 && (
              <>
                <FavoritesHeader
                  type="button"
                  darkMode={darkMode}
                  $collapsed={railMode}
                  onClick={() => setFavoritesOpen(open => !open)}
                  aria-expanded={favoritesOpen}
                  className={railMode ? 'sn-tip' : undefined}
                  data-pr-tooltip={`Favoritos (${favoriteServices.length})`}
                >
                  <i className="pi pi-star-fill fav-star" />
                  {!railMode && (
                    <>
                      <span className="fav-title">Favoritos</span>
                      <span className="fav-count">{favoriteServices.length}</span>
                      <i className={`pi pi-chevron-${favoritesOpen ? 'up' : 'down'} fav-chevron`} />
                    </>
                  )}
                </FavoritesHeader>

                <SubmenuWrapper isOpen={favoritesOpen}>
                  {favoriteServices.map((service) => (
                    <FavoriteItem
                      key={service.key}
                      to={service.url}
                      darkMode={darkMode}
                      $collapsed={railMode}
                      onClick={closeSidebar}
                      className={`${
                        (location.pathname === service.url || location.pathname.startsWith(service.url + '/'))
                          ? 'active'
                          : ''
                      }${railMode ? ' sn-tip' : ''}`}
                      data-pr-tooltip={service.shortLabel || service.label}
                      /* A categoria saiu para o title: como segunda linha ela
                         deixava o favorito mais alto que Central N1 / Store. */
                      title={`${service.shortLabel || service.label} · ${service.section}`}
                    >
                      <i className={service.icon} />
                      {!railMode && (
                        <span className="fav-name">{service.shortLabel || service.label}</span>
                      )}
                    </FavoriteItem>
                  ))}
                </SubmenuWrapper>
              </>
            )}

          </NavScroll>

          {/* Footer */}
          <Footer>
            <FooterDivider darkMode={darkMode} />

            <FooterActions>
              {/* Dark mode */}
              {railMode ? (
                <HistoricoButton
                  darkMode={darkMode}
                  $collapsed
                  className="sn-tip"
                  data-pr-tooltip={darkMode ? 'Tema escuro · mudar para claro' : 'Tema claro · mudar para escuro'}
                  aria-label={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                  onClick={() => setDarkMode(!darkMode)}
                >
                  <i className={darkMode ? 'pi pi-sun' : 'pi pi-moon'} />
                </HistoricoButton>
              ) : (
                <ThemeGroup>
                  <ThemeGroupLabel darkMode={darkMode}>Tema</ThemeGroupLabel>
                  <ThemeSeg darkMode={darkMode} role="group" aria-label="Tema da interface">
                    <ThemeSegOption
                      type="button"
                      darkMode={darkMode}
                      $active={!darkMode}
                      aria-pressed={!darkMode}
                      onClick={() => setDarkMode(false)}
                    >
                      <i className="pi pi-sun" />
                      Claro
                    </ThemeSegOption>
                    <ThemeSegOption
                      type="button"
                      darkMode={darkMode}
                      $active={darkMode}
                      aria-pressed={darkMode}
                      onClick={() => setDarkMode(true)}
                    >
                      <i className="pi pi-moon" />
                      Escuro
                    </ThemeSegOption>
                  </ThemeSeg>
                </ThemeGroup>
              )}

              {/* Ajuda */}
              <HistoricoLink
                to="/ajuda"
                darkMode={darkMode}
                $collapsed={railMode}
                className={`${location.pathname.startsWith('/ajuda') ? 'active' : ''}${railMode ? ' sn-tip' : ''}`}
                data-pr-tooltip="Documentação"
                onClick={closeSidebar}
              >
                <i className="pi pi-book" />
                {!railMode && 'Documentação'}
              </HistoricoLink>

              {/* Novo serviço */}
              <HistoricoButton
                darkMode={darkMode}
                $collapsed={railMode}
                className={railMode ? 'sn-tip' : undefined}
                data-pr-tooltip="Novo serviço"
                onClick={() => {
                  setDemandOpen(true);
                  closeSidebar();
                }}
              >
                <i className="pi pi-plus-circle" />
                {!railMode && 'Novo serviço'}
              </HistoricoButton>

              {/* Usuário — identidade apenas. Perfil, histórico, usuários e
                  logout vivem no controle de sessão do topo (ContaAtivaWidget). */}
              <UserInfoLogoutWrapper $collapsed={railMode}>
                <UserInfo
                  darkMode={darkMode}
                  className={railMode ? 'sn-tip' : undefined}
                  data-pr-tooltip={userName || 'Perfil'}
                  title={!railMode ? 'Perfil e sessão ficam no controle do topo direito' : undefined}
                >
                  <UserAvatar aria-hidden="true">{getInitials(userName || 'Perfil')}</UserAvatar>
                  {!railMode && (
                    <UserMeta darkMode={darkMode}>
                      <UserName>{userName || 'Perfil'}</UserName>
                      {(levelLabel || teamLabel) && (
                        <span className="user-role">{levelLabel ?? teamLabel}</span>
                      )}
                    </UserMeta>
                  )}
                </UserInfo>
                <LogoutButton
                  darkMode={darkMode}
                  aria-label="Sair do N1 App"
                  title="Sair do N1 App"
                  onClick={handleLogout}
                >
                  <i className="pi pi-sign-out" style={{ pointerEvents: 'none' }} />
                </LogoutButton>
              </UserInfoLogoutWrapper>
            </FooterActions>
          </Footer>

        </SidebarStyled>

        <Main $collapsed={railMode}>
          <AccountControlSlotProvider>
            <AccountControlHost />
            <Outlet />
          </AccountControlSlotProvider>
          {canService(SERVICE_KEYS.COPILOT) && location.pathname !== '/copilot' && <Ploo />}
          {apiDocOpen && (
            <ApiDocOverlay
              darkMode={darkMode}
              onClose={() => setApiDocOpen(false)}
            />
          )}
        </Main>
      </Container>

      <ServiceSearchModal
        visible={searchOpen}
        onHide={() => setSearchOpen(false)}
        darkMode={darkMode}
        services={allVisibleServices}
      />

      <RequestDemandDialog
        visible={demandOpen}
        onHide={() => setDemandOpen(false)}
        darkMode={darkMode}
      />
    </>
  );
}
