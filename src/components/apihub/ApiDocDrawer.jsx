// src/components/apihub/ApiDocDrawer.jsx
import { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { Sidebar } from 'primereact/sidebar';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiDocContent from '../../assets/docs/ploomes_api_documentation_usuario_final.md?raw';

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractH2Headings(md) {
  return md
    .split('\n')
    .filter((l) => l.match(/^## /))
    .map((l) => l.replace(/^## /, '').trim());
}

function splitIntoSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current !== null) sections.push(current);
      current = { heading: line.replace(/^## /, '').trim(), content: line + '\n' };
    } else if (current === null) {
      if (sections.length === 0) sections.push({ heading: null, content: line + '\n' });
      else sections[0].content += line + '\n';
    } else {
      current.content += line + '\n';
    }
  }
  if (current !== null) sections.push(current);
  return sections;
}

// ── Styled components ─────────────────────────────────────────────────────────

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.15)')};
  background: ${({ $dark }) => ($dark ? '#1E0C45' : '#f5f2ff')};
  flex-shrink: 0;
`;

const DrawerTitle = styled.span`
  font-weight: 700;
  font-size: 0.95rem;
  flex: 1;
  color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#1a0f3a')};
`;

const SearchWrapper = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.15)' : 'rgba(116,67,246,0.1)')};
  flex-shrink: 0;
  background: ${({ $dark }) => ($dark ? '#120125' : '#ffffff')};
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const TocPanel = styled.nav`
  width: ${({ $open }) => ($open ? '190px' : '0')};
  min-width: ${({ $open }) => ($open ? '190px' : '0')};
  overflow: ${({ $open }) => ($open ? 'auto' : 'hidden')};
  transition: width 0.2s ease, min-width 0.2s ease;
  background: ${({ $dark }) => ($dark ? 'rgba(42,20,92,0.6)' : 'rgba(244,240,255,0.9)')};
  border-right: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.1)')};
  padding: ${({ $open }) => ($open ? '1rem 0.75rem' : '0')};
  flex-shrink: 0;
`;

const TocLabel = styled.p`
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${({ $dark }) => ($dark ? '#a78bfa' : '#7443f6')};
  margin: 0 0 0.6rem 0;
`;

const TocItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.78rem;
  line-height: 1.4;
  padding: 0.3rem 0.5rem;
  border-radius: 5px;
  margin-bottom: 2px;
  color: ${({ $dark, $active }) =>
    $active ? '#7443f6' : $dark ? 'rgba(220,210,255,0.75)' : '#555'};
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  background: ${({ $active, $dark }) =>
    $active ? ($dark ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.09)') : 'transparent'};
  border-left: 2px solid ${({ $active }) => ($active ? '#7443f6' : 'transparent')};
  transition: all 0.15s;

  &:hover {
    color: #7443f6;
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.13)' : 'rgba(116,67,246,0.07)'};
  }
`;

const ContentScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
`;

const ContentArea = styled.article`
  font-size: 0.9rem;
  line-height: 1.72;
  color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#2d2446')};

  h1, h2, h3, h4 {
    color: ${({ $dark }) => ($dark ? '#f0ebff' : '#1a0f3a')};
    font-weight: 700;
    margin: 1.6rem 0 0.6rem 0;
    scroll-margin-top: 1rem;
  }
  h1 { font-size: 1.5rem; border-bottom: 2px solid rgba(116,67,246,0.3); padding-bottom: 0.4rem; }
  h2 { font-size: 1.15rem; border-bottom: 1px solid rgba(116,67,246,0.15); padding-bottom: 0.3rem; }
  h3 { font-size: 0.98rem; color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b3ec8')}; }

  p { margin: 0.5rem 0 0.8rem 0; }
  ul, ol { padding-left: 1.4rem; margin: 0.4rem 0 0.8rem 0; }
  li { margin-bottom: 0.3rem; }

  blockquote {
    margin: 0.8rem 0;
    padding: 0.6rem 1rem;
    border-left: 3px solid #7443f6;
    border-radius: 0 7px 7px 0;
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.07)'};
    color: ${({ $dark }) => ($dark ? '#d0c4ff' : '#4a35a0')};
    font-size: 0.88rem;
    p { margin: 0; }
  }

  code {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.83em;
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.08)'};
    color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b3ec8')};
    padding: 0.1em 0.38em;
    border-radius: 4px;
  }

  pre {
    background: ${({ $dark }) => ($dark ? '#120125cc' : '#f3f0ff')};
    border: 1px solid ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.3)' : 'rgba(116,67,246,0.18)'};
    border-radius: 8px;
    padding: 0.85rem 1rem;
    overflow-x: auto;
    margin: 0.8rem 0;
    code { background: none; color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#2d2446')}; padding: 0; }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8rem 0 1.2rem 0;
    font-size: 0.85rem;
  }
  th {
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.1)'};
    color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#2d2446')};
    padding: 0.5rem 0.8rem;
    text-align: left;
    font-weight: 700;
    border-bottom: 2px solid rgba(116,67,246,0.3);
  }
  td {
    padding: 0.45rem 0.8rem;
    border-bottom: 1px solid ${({ $dark }) =>
      $dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'};
  }
  tr:hover td {
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.07)' : 'rgba(116,67,246,0.03)'};
  }

  hr {
    border: none;
    border-top: 1px solid ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.15)'};
    margin: 1.5rem 0;
  }

  strong { color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#1a0f3a')}; }
  a { color: #7443f6; text-decoration: none; &:hover { text-decoration: underline; } }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.6;
  font-size: 0.9rem;
`;

const TocToggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ $dark }) => ($dark ? '#a78bfa' : '#7443f6')};
  font-size: 1rem;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
  &:hover { background: ${({ $dark }) =>
    $dark ? 'rgba(116,67,246,0.15)' : 'rgba(116,67,246,0.09)'}; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ApiDocDrawer({ visible, onHide, darkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tocOpen, setTocOpen] = useState(true);
  const [activeHeading, setActiveHeading] = useState('');

  const allSections = useMemo(() => splitIntoSections(apiDocContent), []);
  const h2Headings = useMemo(() => extractH2Headings(apiDocContent), []);

  const filteredContent = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return apiDocContent;

    const preamble = allSections.find((s) => s.heading === null);
    const matching = allSections.filter(
      (s) => s.heading !== null && s.content.toLowerCase().includes(term)
    );

    if (matching.length === 0) return null;

    const parts = [];
    if (preamble) parts.push(preamble.content);
    matching.forEach((s) => parts.push(s.content));
    return parts.join('\n');
  }, [searchTerm, allSections]);

  const scrollToHeading = useCallback((heading) => {
    const id = slugify(heading);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveHeading(id);
  }, []);

  const components = useMemo(
    () => ({
      h1: ({ children, ...props }) => {
        const id = slugify(String(children));
        return <h1 id={id} {...props}>{children}</h1>;
      },
      h2: ({ children, ...props }) => {
        const id = slugify(String(children));
        return <h2 id={id} {...props}>{children}</h2>;
      },
      h3: ({ children, ...props }) => {
        const id = slugify(String(children));
        return <h3 id={id} {...props}>{children}</h3>;
      },
    }),
    []
  );

  const headerEl = (
    <DrawerHeader $dark={darkMode}>
      <i className="pi pi-book" style={{ color: '#7443f6', fontSize: '1rem' }} />
      <DrawerTitle $dark={darkMode}>Documentação da API Ploomes</DrawerTitle>
      <TocToggle
        $dark={darkMode}
        onClick={() => setTocOpen((v) => !v)}
        title={tocOpen ? 'Ocultar sumário' : 'Mostrar sumário'}
      >
        <i className={`pi ${tocOpen ? 'pi-list' : 'pi-align-justify'}`} />
      </TocToggle>
    </DrawerHeader>
  );

  return (
    <Sidebar
      visible={visible}
      onHide={() => { setSearchTerm(''); onHide(); }}
      position="right"
      style={{ width: '700px', maxWidth: '95vw', padding: 0, display: 'flex', flexDirection: 'column' }}
      header={headerEl}
      pt={{
        header: { style: { padding: 0 } },
        content: { style: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } },
        root: { style: { background: darkMode ? '#120125' : '#ffffff' } },
      }}
    >
      {/* Search */}
      <SearchWrapper $dark={darkMode}>
        <span className="p-input-icon-left" style={{ display: 'block' }}>
          <i className="pi pi-search" style={{ left: '0.75rem' }} />
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar na documentação..."
            style={{
              width: '100%',
              paddingLeft: '2.2rem',
              fontSize: '0.875rem',
              background: darkMode ? '#1a0a2e' : '#f5f2ff',
              border: `1px solid ${darkMode ? '#3b2a5e' : '#dbd4ff'}`,
              color: darkMode ? '#e2d9ff' : '#1a0f3a',
            }}
          />
        </span>
        {searchTerm.trim() && (
          <small style={{ opacity: 0.65, display: 'block', marginTop: 4 }}>
            {filteredContent === null
              ? 'Nenhuma seção encontrada.'
              : `Mostrando seções que contém "${searchTerm.trim()}"`}
          </small>
        )}
      </SearchWrapper>

      {/* Body */}
      <Body>
        {/* TOC */}
        <TocPanel $open={tocOpen} $dark={darkMode}>
          {tocOpen && (
            <>
              <TocLabel $dark={darkMode}>Sumário</TocLabel>
              {h2Headings.map((h) => (
                <TocItem
                  key={h}
                  $dark={darkMode}
                  $active={activeHeading === slugify(h)}
                  onClick={() => scrollToHeading(h)}
                  title={h}
                >
                  {h}
                </TocItem>
              ))}
            </>
          )}
        </TocPanel>

        {/* Content */}
        <ContentScroll>
          {filteredContent === null ? (
            <NoResults>
              <i className="pi pi-search" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', color: '#7443f6', opacity: 0.5 }} />
              Nenhuma seção encontrada para "{searchTerm}".
              <br />
              <Button
                label="Limpar busca"
                text
                size="small"
                onClick={() => setSearchTerm('')}
                style={{ marginTop: 8 }}
              />
            </NoResults>
          ) : (
            <ContentArea $dark={darkMode}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {filteredContent}
              </ReactMarkdown>
            </ContentArea>
          )}
        </ContentScroll>
      </Body>
    </Sidebar>
  );
}
