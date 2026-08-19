import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled, { keyframes } from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import coverImg from '../assets/capa documentacao.png';
import docContent from '../assets/docs/n1-usabilidade.md?raw';
import apiDocContent from '../assets/docs/ploomes_api_documentation_usuario_final.md?raw';
import campoDevContent from '../assets/docs/campo-dev-documentacao.md?raw';

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Page root ────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  width: 100%;
  animation: ${fadeIn} 0.3s ease;
`;

// ─── Cover Header ─────────────────────────────────────────────────────────────

const CoverWrapper = styled.div`
  position: relative;
  height: 260px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 1.75rem;
  box-shadow: 0 8px 32px rgba(116, 67, 246, 0.28);
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
`;

const CoverOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    140deg,
    rgba(16, 6, 40, 0.9) 0%,
    rgba(30, 12, 69, 0.6) 40%,
    transparent 70%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 2rem 2.5rem;
`;

const CoverTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.3rem 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
`;

const CoverSubtitle = styled.p`
  font-size: 0.875rem;
  color: rgba(220, 210, 255, 0.9);
  margin: 0;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
`;

// ─── Section tabs ─────────────────────────────────────────────────────────────

const TabBar = styled.div`
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1.75rem;
  background: ${({ darkMode }) =>
    darkMode ? 'rgba(30, 15, 60, 0.7)' : 'rgba(244, 240, 255, 0.95)'};
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(116, 67, 246, 0.22)' : 'rgba(116, 67, 246, 0.18)'};
  border-radius: 12px;
  padding: 0.3rem;
`;

const Tab = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  background: ${({ $active }) =>
    $active ? 'linear-gradient(135deg, #7443f6 0%, #5b21b6 100%)' : 'transparent'};
  color: ${({ $active, darkMode }) =>
    $active ? '#fff' : darkMode ? 'rgba(210, 195, 255, 0.65)' : '#6b4fbb'};
  box-shadow: ${({ $active }) =>
    $active ? '0 2px 10px rgba(116, 67, 246, 0.38)' : 'none'};

  i { font-size: 0.82rem; }

  &:hover {
    background: ${({ $active, darkMode }) =>
      $active
        ? 'linear-gradient(135deg, #7443f6 0%, #5b21b6 100%)'
        : darkMode
        ? 'rgba(116, 67, 246, 0.15)'
        : 'rgba(116, 67, 246, 0.08)'};
    color: ${({ $active, darkMode }) =>
      $active ? '#fff' : darkMode ? '#e2d9ff' : '#5b21b6'};
  }
`;

// ─── Body grid ────────────────────────────────────────────────────────────────

const BodyGrid = styled.div`
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

// ─── Sidebar TOC ──────────────────────────────────────────────────────────────

const TocWrapper = styled.nav`
  position: sticky;
  top: 1rem;
  background: ${({ darkMode }) =>
    darkMode ? 'rgba(28, 12, 65, 0.75)' : 'rgba(248, 245, 255, 0.95)'};
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(116, 67, 246, 0.22)' : 'rgba(116, 67, 246, 0.15)'};
  border-radius: 14px;
  padding: 1.1rem 0.9rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;

  scrollbar-width: thin;
  scrollbar-color: rgba(116, 67, 246, 0.3) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(116, 67, 246, 0.3);
    border-radius: 4px;
  }

  @media (max-width: 900px) { display: none; }
`;

const TocHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(116, 67, 246, 0.2)' : 'rgba(116, 67, 246, 0.12)'};

  i {
    font-size: 0.7rem;
    color: ${({ darkMode }) => (darkMode ? '#a78bfa' : '#7443f6')};
  }
`;

const TocTitle = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ darkMode }) => (darkMode ? '#a78bfa' : '#7443f6')};
`;

const TocItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1.45;
  padding: 0.28rem 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.12rem;
  color: ${({ darkMode, active }) =>
    active
      ? '#7443f6'
      : darkMode
      ? 'rgba(220, 210, 255, 0.7)'
      : '#666'};
  font-weight: ${({ active }) => (active ? 700 : 400)};
  background: ${({ active, darkMode }) =>
    active
      ? darkMode
        ? 'rgba(116, 67, 246, 0.18)'
        : 'rgba(116, 67, 246, 0.09)'
      : 'transparent'};
  border-left: 2px solid ${({ active }) => (active ? '#7443f6' : 'transparent')};
  transition: all 0.15s ease;

  &:hover {
    color: #7443f6;
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.06)'};
  }
`;

// ─── Markdown content area ────────────────────────────────────────────────────

const ContentArea = styled.article`
  font-size: 0.97rem;
  line-height: 1.8;
  color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#2d2446')};
  min-width: 0;

  h1, h2, h3, h4 {
    color: ${({ darkMode }) => (darkMode ? '#f0ebff' : '#1a0f3a')};
    font-weight: 700;
    margin: 2rem 0 0.75rem 0;
    scroll-margin-top: 1.5rem;
  }
  h1 {
    font-size: 1.75rem;
    border-bottom: 2px solid rgba(116,67,246,0.28);
    padding-bottom: 0.5rem;
  }
  h2 {
    font-size: 1.35rem;
    border-bottom: 1px solid rgba(116,67,246,0.14);
    padding-bottom: 0.35rem;
  }
  h3 {
    font-size: 1.08rem;
    color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b3ec8')};
  }

  p { margin: 0.6rem 0 1rem 0; }
  ul, ol {
    padding-left: 1.5rem;
    margin: 0.5rem 0 1rem 0;
  }
  li { margin-bottom: 0.35rem; }

  blockquote {
    margin: 1rem 0;
    padding: 0.75rem 1.1rem;
    border-left: 3px solid #7443f6;
    border-radius: 0 8px 8px 0;
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(116, 67, 246, 0.12)' : 'rgba(116, 67, 246, 0.07)'};
    color: ${({ darkMode }) => (darkMode ? '#d0c4ff' : '#4a35a0')};
    font-size: 0.92rem;
    p { margin: 0; }
  }

  code {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.85em;
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(116, 67, 246, 0.2)' : 'rgba(116, 67, 246, 0.08)'};
    color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b3ec8')};
    padding: 0.1em 0.4em;
    border-radius: 4px;
  }

  pre {
    background: ${({ darkMode }) => (darkMode ? '#120125cc' : '#f3f0ff')};
    border: 1px solid ${({ darkMode }) =>
      darkMode ? 'rgba(116,67,246,0.3)' : 'rgba(116,67,246,0.2)'};
    border-radius: 10px;
    padding: 1rem 1.2rem;
    overflow-x: auto;
    margin: 1rem 0;

    code {
      background: none;
      color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#2d2446')};
      padding: 0;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0 1.5rem 0;
    font-size: 0.9rem;
  }
  th {
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(116, 67, 246, 0.25)' : 'rgba(116, 67, 246, 0.1)'};
    color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#2d2446')};
    padding: 0.55rem 0.9rem;
    text-align: left;
    font-weight: 700;
    border-bottom: 2px solid rgba(116,67,246,0.3);
  }
  td {
    padding: 0.5rem 0.9rem;
    border-bottom: 1px solid ${({ darkMode }) =>
      darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'};
  }
  tr:hover td {
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(116,67,246,0.07)' : 'rgba(116,67,246,0.04)'};
  }

  hr {
    border: none;
    border-top: 1px solid ${({ darkMode }) =>
      darkMode ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.15)'};
    margin: 2rem 0;
  }

  strong { color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#1a0f3a')}; }

  a {
    color: #7443f6;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

// ─── Back-to-top button ───────────────────────────────────────────────────────

const BackToTop = styled.button`
  position: fixed;
  bottom: 5.5rem;
  right: 1.75rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7443f6, #9b67ff);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 4px 14px rgba(116, 67, 246, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  pointer-events: ${({ visible }) => (visible ? 'auto' : 'none')};
  transform: ${({ visible }) => (visible ? 'translateY(0)' : 'translateY(10px)')};
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 500;

  &:hover { box-shadow: 0 6px 20px rgba(116, 67, 246, 0.6); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Gera IDs únicos e estáveis por seção. Como ambas as docs têm headings
// repetidos (Descrição, Objetivo, Erros Comuns...), precisamos prefixar com a
// seção e desambiguar ocorrências repetidas com um índice — caso contrário os
// IDs colidem e o TOC/scroll-spy de uma doc passa a apontar para a outra.
function buildHeadingId(prefix, slug, seen) {
  const base = `${prefix}-${slug}`;
  const count = seen.get(base) || 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function extractHeadings(md, prefix) {
  const seen = new Map();
  return md.split('\n').reduce((acc, line) => {
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      const slug = slugify(text);
      const id = buildHeadingId(prefix, slug, seen);
      acc.push({ level, text, slug, id });
    }
    return acc;
  }, []);
}

// ─── Sections config ──────────────────────────────────────────────────────────

const SECTIONS = {
  n1app: {
    content: docContent,
    title: 'Documentação N1 App',
    subtitle: 'Guia de uso e boas práticas',
    icon: 'pi pi-book',
    label: 'N1 App',
  },
  api: {
    content: apiDocContent,
    title: 'API Ploomes',
    subtitle: 'Referência de endpoints, autenticação e exemplos',
    icon: 'pi pi-code',
    label: 'API Ploomes',
  },
  campodev: {
    content: campoDevContent,
    title: 'Campo Dev',
    subtitle: 'Guia completo: editor, PloomesServer, gatilhos e exemplos',
    icon: 'pi pi-th-large',
    label: 'Campo Dev',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentationPage() {
  const { darkMode } = useDarkMode();
  const { section: routeSection } = useParams();
  const navigate = useNavigate();

  // A seção ativa vem da rota (/ajuda/:section). Fallback para n1app quando
  // a rota não traz uma seção válida.
  const section = SECTIONS[routeSection] ? routeSection : 'n1app';

  const [activeId, setActiveId] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef(null);

  const currentSection = SECTIONS[section];
  // Recalculado por seção. Os IDs são prefixados e desambiguados, então nunca
  // colidem entre as duas docs.
  const headings = useMemo(
    () => extractHeadings(currentSection.content, section),
    [currentSection.content, section]
  );

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);

      if (!contentRef.current) return;
      const headingEls = contentRef.current.querySelectorAll('h1, h2, h3');
      let current = '';
      headingEls.forEach((el) => {
        if (el.getBoundingClientRect().top <= 120) current = el.id;
      });
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ao trocar de seção via rota, reseta o item ativo e volta ao topo.
  useEffect(() => {
    setActiveId('');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [section]);

  const handleSectionChange = (key) => {
    if (key === section) return;
    navigate(`/ajuda/${key}`);
  };

  const scrollToHeading = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Os headings renderizados pelo markdown recebem os MESMOS IDs (em ordem) que
  // os itens do TOC. Um cursor por nível avança a cada heading renderizado e é
  // resetado imediatamente antes de cada render do markdown (ver renderCursors),
  // de modo que o n-ésimo heading de um nível recebe o n-ésimo ID da lista.
  const renderCursors = useRef({ 1: 0, 2: 0, 3: 0 });
  const idsByLevel = useMemo(() => {
    const map = { 1: [], 2: [], 3: [] };
    headings.forEach((h) => map[h.level].push(h.id));
    return map;
  }, [headings]);

  const makeHeading = (level, Tag) => ({ children, ...props }) => {
    const i = renderCursors.current[level]++;
    const id = idsByLevel[level][i] || `${section}-${slugify(String(children))}`;
    return <Tag id={id} {...props}>{children}</Tag>;
  };
  const components = {
    h1: makeHeading(1, 'h1'),
    h2: makeHeading(2, 'h2'),
    h3: makeHeading(3, 'h3'),
  };
  // reset síncrono antes do markdown renderizar abaixo
  renderCursors.current = { 1: 0, 2: 0, 3: 0 };

  return (
    <PageWrapper>
      {/* Cover */}
      <CoverWrapper>
        <CoverImage src={coverImg} alt={currentSection.title} />
        <CoverOverlay>
          <CoverTitle>{currentSection.title}</CoverTitle>
          <CoverSubtitle>{currentSection.subtitle}</CoverSubtitle>
        </CoverOverlay>
      </CoverWrapper>

      {/* Section tabs */}
      <TabBar darkMode={darkMode}>
        {Object.entries(SECTIONS).map(([key, s]) => (
          <Tab
            key={key}
            $active={section === key}
            darkMode={darkMode}
            onClick={() => handleSectionChange(key)}
            type="button"
          >
            <i className={s.icon} />
            {s.label}
          </Tab>
        ))}
      </TabBar>

      <BodyGrid>
        {/* TOC Sidebar */}
        <TocWrapper darkMode={darkMode}>
          <TocHeader darkMode={darkMode}>
            <i className="pi pi-list" />
            <TocTitle darkMode={darkMode}>Nesta página</TocTitle>
          </TocHeader>
          {headings.map((h) => (
            <TocItem
              key={h.id}
              darkMode={darkMode}
              active={activeId === h.id}
              style={{
                paddingLeft:
                  h.level === 1 ? '0.5rem' : h.level === 2 ? '1rem' : '1.75rem',
              }}
              onClick={() => scrollToHeading(h.id)}
            >
              {h.text}
            </TocItem>
          ))}
        </TocWrapper>

        {/* Markdown content */}
        <ContentArea darkMode={darkMode} ref={contentRef}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {currentSection.content}
          </ReactMarkdown>
        </ContentArea>
      </BodyGrid>

      {/* Back to top */}
      <BackToTop
        visible={showBackToTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Voltar ao topo"
      >
        <i className="pi pi-arrow-up" />
      </BackToTop>
    </PageWrapper>
  );
}
