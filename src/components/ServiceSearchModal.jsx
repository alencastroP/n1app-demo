import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const SearchWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.i`
  position: absolute;
  left: 0.85rem;
  font-size: 1rem;
  color: #7443f6;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  font-size: 1rem;
  padding: 0.75rem 5rem 0.75rem 2.5rem;
  border-radius: 8px;
  background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.05)' : '#f8f5ff')};
  border: 1.5px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.4)' : 'rgba(116,67,246,0.3)')};
  color: ${({ $dark }) => ($dark ? '#eee' : '#222')};
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)')};
  }

  &:focus {
    border-color: #7443f6;
    box-shadow: 0 0 0 3px rgba(116,67,246,0.15);
  }
`;

const EscBadge = styled.span`
  position: absolute;
  right: 2.5rem;
  font-size: 0.65rem;
  font-family: monospace;
  color: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)')};
  border-radius: 4px;
  padding: 1px 5px;
  pointer-events: none;
`;

const CloseButton = styled.button`
  position: absolute;
  right: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)')};
  transition: background 0.15s ease, color 0.15s ease;

  i {
    font-size: 0.85rem;
  }

  &:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')};
    color: #7443f6;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(116,67,246,0.3);
  }
`;

const ResultsList = styled.div`
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')};
    border-radius: 4px;
  }
`;

const ResultItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: none;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  background: ${({ $highlighted, $dark }) =>
    $highlighted
      ? $dark
        ? 'rgba(116,67,246,0.25)'
        : 'rgba(116,67,246,0.1)'
      : 'transparent'};
  color: ${({ $dark }) => ($dark ? '#eee' : '#333')};
  transition: background 0.12s ease;

  &:hover {
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.08)'};
  }

  i {
    font-size: 1rem;
    color: ${({ $highlighted }) => ($highlighted ? '#7443f6' : 'inherit')};
    opacity: ${({ $highlighted }) => ($highlighted ? 1 : 0.55)};
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }
`;

const ServiceLabel = styled.span`
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
`;

const ServiceSection = styled.span`
  font-size: 0.75rem;
  opacity: 0.45;
  font-weight: 500;
  flex-shrink: 0;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: ${({ $dark }) => ($dark ? '#777' : '#aaa')};
  font-size: 0.9rem;
`;

const Hint = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')};
  font-size: 0.72rem;
  color: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')};

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  kbd {
    font-family: monospace;
    border: 1px solid ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)')};
    border-radius: 3px;
    padding: 0 4px;
    font-size: 0.7rem;
  }
`;

export default function ServiceSearchModal({ visible, onHide, darkMode, services }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);

  const filtered = services.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.label.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (visible) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [visible]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  const selectService = useCallback(
    (service) => {
      navigate(service.url);
      onHide();
    },
    [navigate, onHide],
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (filtered[highlighted]) selectService(filtered[highlighted]);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      showHeader={false}
      modal
      draggable={false}
      resizable={false}
      blockScroll
      style={{ width: '540px', maxWidth: '95vw', borderRadius: '14px', overflow: 'hidden', padding: 0 }}
      contentStyle={{
        background: darkMode ? '#160d2e' : '#ffffff',
        padding: '1.25rem',
        borderRadius: '14px',
        border: `1px solid ${darkMode ? 'rgba(116,67,246,0.3)' : '#ece8ff'}`,
        boxShadow: darkMode
          ? '0 24px 64px rgba(0,0,0,0.65)'
          : '0 16px 48px rgba(116,67,246,0.18)',
      }}
      maskStyle={{ backdropFilter: 'blur(4px)' }}
    >
      <SearchWrapper onKeyDown={handleKeyDown}>
        <InputWrapper>
          <SearchIcon className="pi pi-search" />
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar serviço..."
            $dark={darkMode}
            autoComplete="off"
          />
          <EscBadge $dark={darkMode}>ESC</EscBadge>
          <CloseButton
            type="button"
            onClick={onHide}
            $dark={darkMode}
            aria-label="Fechar busca"
            title="Fechar"
            tabIndex={-1}
          >
            <i className="pi pi-times" />
          </CloseButton>
        </InputWrapper>

        <ResultsList $dark={darkMode}>
          {filtered.length === 0 ? (
            <NoResults $dark={darkMode}>Nenhum serviço encontrado.</NoResults>
          ) : (
            filtered.map((service, index) => (
              <ResultItem
                key={service.key}
                $highlighted={index === highlighted}
                $dark={darkMode}
                onClick={() => selectService(service)}
                onMouseEnter={() => setHighlighted(index)}
                tabIndex={-1}
              >
                <i className={service.icon} />
                <ServiceLabel>{service.label}</ServiceLabel>
                <ServiceSection>{service.section}</ServiceSection>
              </ResultItem>
            ))
          )}
        </ResultsList>

        {filtered.length > 0 && (
          <Hint $dark={darkMode}>
            <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
            <span><kbd>Enter</kbd> selecionar</span>
            <span><kbd>Esc</kbd> fechar</span>
          </Hint>
        )}
      </SearchWrapper>
    </Dialog>
  );
}
