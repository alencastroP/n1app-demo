// src/components/apihub/ApiDocOverlay.jsx
import { useState, useMemo, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  apiDocContent,
  slugify,
  extractH2Headings,
  splitIntoSections,
} from './apiDocUtils';

function makeMarkdownComponents(slugifyFn) {
  return {
    h1: ({ children, ...props }) => {
      const id = slugifyFn(String(children));
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }) => {
      const id = slugifyFn(String(children));
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }) => {
      const id = slugifyFn(String(children));
      return <h3 id={id} {...props}>{children}</h3>;
    },
  };
}

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ── Styled components ─────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 280;

const Wrap = styled.div`
  position: fixed;
  top: 0;
  left: ${SIDEBAR_WIDTH}px;
  right: 0;
  bottom: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: ${({ $dark }) => ($dark ? '#120125' : '#ffffff')};
  animation: ${fadeIn} 0.22s ease;

  @media (max-width: 768px) {
    left: 0;
    z-index: 1060;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 1.5rem;
  height: 56px;
  flex-shrink: 0;
  border-bottom: 1px solid
    ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.15)')};
  background: ${({ $dark }) => ($dark ? '#1E0C45' : '#f5f2ff')};
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.9rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 7px;
  transition: background 0.15s;

  &:hover {
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.15)' : 'rgba(116,67,246,0.09)'};
  }
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: center;
  font-weight: 700;
  font-size: 0.97rem;
  color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#1a0f3a')};
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

// ── TOC panel ─────────────────────────────────────────────────────────────────

const TocPanel = styled.div`
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid
    ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.12)')};
  background: ${({ $dark }) =>
    $dark ? 'rgba(30,12,69,0.7)' : 'rgba(244,240,255,0.9)'};
  overflow-y: auto;
  padding: 1rem 0.75rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

const SearchWrapper = styled.div`
  margin-bottom: 1rem;
`;

const TocLabel = styled.p`
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${({ $dark }) => ($dark ? '#a78bfa' : '#7443f6')};
  margin: 0 0 0.5rem 0;
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
    $active
      ? $dark ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.09)'
      : 'transparent'};
  border-left: 2px solid ${({ $active }) => ($active ? '#7443f6' : 'transparent')};
  transition: all 0.14s;

  &:hover {
    color: #7443f6;
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.13)' : 'rgba(116,67,246,0.07)'};
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 1rem 0.5rem;
  font-size: 0.8rem;
  opacity: 0.55;
`;

// ── Content area ──────────────────────────────────────────────────────────────

const ContentScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem 2.5rem;

  @media (max-width: 900px) {
    padding: 1.25rem 1rem;
  }
`;

const ContentArea = styled.article`
  max-width: 860px;
  margin: 0 auto;
  font-size: 0.93rem;
  line-height: 1.75;
  color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#2d2446')};

  h1, h2, h3, h4 {
    color: ${({ $dark }) => ($dark ? '#f0ebff' : '#1a0f3a')};
    font-weight: 700;
    margin: 2rem 0 0.75rem 0;
    scroll-margin-top: 1.5rem;
  }
  h1 { font-size: 1.8rem; border-bottom: 2px solid rgba(116,67,246,0.3); padding-bottom: 0.5rem; }
  h2 { font-size: 1.35rem; border-bottom: 1px solid rgba(116,67,246,0.15); padding-bottom: 0.35rem; }
  h3 { font-size: 1.05rem; color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b3ec8')}; }

  p { margin: 0.6rem 0 1rem 0; }
  ul, ol { padding-left: 1.5rem; margin: 0.5rem 0 1rem 0; }
  li { margin-bottom: 0.35rem; }

  blockquote {
    margin: 1rem 0;
    padding: 0.75rem 1.1rem;
    border-left: 3px solid #7443f6;
    border-radius: 0 8px 8px 0;
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.07)'};
    color: ${({ $dark }) => ($dark ? '#d0c4ff' : '#4a35a0')};
    font-size: 0.92rem;
    p { margin: 0; }
  }

  code {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.84em;
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.08)'};
    color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b3ec8')};
    padding: 0.1em 0.4em;
    border-radius: 4px;
  }

  pre {
    background: ${({ $dark }) => ($dark ? '#120125cc' : '#f3f0ff')};
    border: 1px solid ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.3)' : 'rgba(116,67,246,0.2)'};
    border-radius: 10px;
    padding: 1rem 1.2rem;
    overflow-x: auto;
    margin: 1rem 0;
    code { background: none; color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#2d2446')}; padding: 0; }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0 1.5rem 0;
    font-size: 0.88rem;
  }
  th {
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.1)'};
    color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#2d2446')};
    padding: 0.55rem 0.9rem;
    text-align: left;
    font-weight: 700;
    border-bottom: 2px solid rgba(116,67,246,0.3);
  }
  td {
    padding: 0.5rem 0.9rem;
    border-bottom: 1px solid ${({ $dark }) =>
      $dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'};
  }
  tr:hover td {
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.07)' : 'rgba(116,67,246,0.04)'};
  }

  hr {
    border: none;
    border-top: 1px solid ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.15)'};
    margin: 2rem 0;
  }

  strong { color: ${({ $dark }) => ($dark ? '#e2d9ff' : '#1a0f3a')}; }
  a { color: #7443f6; text-decoration: none; &:hover { text-decoration: underline; } }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ApiDocOverlay({ darkMode, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHeading, setActiveHeading] = useState('');

  const allSections = useMemo(() => splitIntoSections(apiDocContent), []);
  const h2Headings = useMemo(() => extractH2Headings(apiDocContent), []);
  const components = useMemo(() => makeMarkdownComponents(slugify), []);

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

  const filteredHeadings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return h2Headings;
    return h2Headings.filter((h) => h.toLowerCase().includes(term));
  }, [searchTerm, h2Headings]);

  return (
    <Wrap $dark={darkMode}>
      {/* Header */}
      <Header $dark={darkMode}>
        <BackBtn $dark={darkMode} onClick={onClose}>
          <i className="pi pi-arrow-left" />
          Voltar à Central da API
        </BackBtn>
        <HeaderTitle $dark={darkMode}>
          <i className="pi pi-book" style={{ marginRight: 8, color: '#7443f6' }} />
          Documentação da API Ploomes
        </HeaderTitle>
        {/* spacer para centralizar o título */}
        <div style={{ width: 160, flexShrink: 0 }} />
      </Header>

      {/* Body */}
      <Body>
        {/* TOC + Search */}
        <TocPanel $dark={darkMode}>
          <SearchWrapper>
            <span className="p-input-icon-left" style={{ display: 'block' }}>
              <i className="pi pi-search" style={{ left: '0.65rem', fontSize: '0.8rem' }} />
              <InputText
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                style={{
                  width: '100%',
                  paddingLeft: '2rem',
                  fontSize: '0.8rem',
                  height: '32px',
                  background: darkMode ? '#1a0a2e' : '#f5f2ff',
                  border: `1px solid ${darkMode ? '#3b2a5e' : '#dbd4ff'}`,
                  color: darkMode ? '#e2d9ff' : '#1a0f3a',
                }}
              />
            </span>
          </SearchWrapper>

          <TocLabel $dark={darkMode}>Sumário</TocLabel>

          {filteredHeadings.length === 0 ? (
            <NoResults>Nenhuma seção encontrada.</NoResults>
          ) : (
            filteredHeadings.map((h) => (
              <TocItem
                key={h}
                $dark={darkMode}
                $active={activeHeading === slugify(h)}
                onClick={() => scrollToHeading(h)}
                title={h}
              >
                {h}
              </TocItem>
            ))
          )}
        </TocPanel>

        {/* Markdown content */}
        <ContentScroll>
          {filteredContent === null ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.55 }}>
              <i
                className="pi pi-search"
                style={{ fontSize: '2rem', display: 'block', marginBottom: 12, color: '#7443f6' }}
              />
              Nenhuma seção encontrada para "{searchTerm}".
              <br />
              <Button
                label="Limpar busca"
                text
                size="small"
                onClick={() => setSearchTerm('')}
                style={{ marginTop: 8 }}
              />
            </div>
          ) : (
            <ContentArea $dark={darkMode}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {filteredContent}
              </ReactMarkdown>
            </ContentArea>
          )}
        </ContentScroll>
      </Body>
    </Wrap>
  );
}
