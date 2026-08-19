// demo/src/mock/DemoBadge.jsx
//
// Aviso de que a tela é uma réplica visual offline. Nasce aberto (a informação
// importa mais que a discrição) e pode ser recolhido para um chip pequeno.
// Usa a paleta roxa do design system, no mesmo tom dos botões do app.
//
// Fica fora da árvore do <App /> (montado ao lado dele no main.jsx) para não
// interferir em nenhum layout — é o único elemento que a demo acrescenta à UI.

import { useEffect, useState } from 'react';
import styled from 'styled-components';

const BRAND = '#7443f6';
const BRAND_SOFT = 'rgba(116, 67, 246, 0.10)';

const Wrapper = styled.div`
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  font-family: inherit;
`;

// Chip recolhido — mesma pegada dos botões secundários do app.
const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 8px;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(171,130,255,0.32)' : 'rgba(116,67,246,0.28)')};
  background: ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.16)' : BRAND_SOFT)};
  color: ${({ $dark }) => ($dark ? '#c9b3ff' : BRAND)};
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;

  &:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.26)' : 'rgba(116,67,246,0.18)')};
    border-color: ${BRAND};
  }

  i {
    font-size: 0.8rem;
  }
`;

const Painel = styled.div`
  width: min(320px, calc(100vw - 32px));
  padding: 14px 16px 15px;
  border-radius: 10px;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(171,130,255,0.28)' : 'rgba(116,67,246,0.22)')};
  background: ${({ $dark }) => ($dark ? '#170a2b' : '#ffffff')};
  color: ${({ $dark }) => ($dark ? '#d9cfee' : '#3b3450')};
  box-shadow: ${({ $dark }) => ($dark
    ? '0 10px 30px rgba(0,0,0,0.45)'
    : '0 10px 30px rgba(60,20,120,0.13)')};
  font-size: 0.78rem;
  line-height: 1.5;
`;

const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;

  strong {
    flex: 1;
    font-size: 0.82rem;
    font-weight: 600;
    color: ${({ $dark }) => ($dark ? '#c9b3ff' : BRAND)};
  }

  i.pi-eye {
    font-size: 0.85rem;
    color: ${({ $dark }) => ($dark ? '#c9b3ff' : BRAND)};
  }
`;

const Fechar = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${({ $dark }) => ($dark ? '#8d7fb0' : '#9a93ab')};
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')};
    color: ${({ $dark }) => ($dark ? '#d9cfee' : '#3b3450')};
  }

  i {
    font-size: 0.72rem;
  }
`;

const Lista = styled.ul`
  margin: 10px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    padding: 3px 0;
  }

  li i {
    margin-top: 3px;
    font-size: 0.62rem;
    color: ${({ $dark }) => ($dark ? '#9a7ce8' : BRAND)};
  }
`;

const Texto = styled.p`
  margin: 0;
  opacity: 0.9;
`;

/**
 * Lê o tema pelo atributo `data-theme` que o ThemeProvider do DS escreve no
 * <html>. O selo é montado fora da árvore do <App />, então não pode usar
 * `useDarkMode()` — observar o DOM mantém o acoplamento em zero.
 */
function useTemaDoDocumento() {
  const ler = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const [dark, setDark] = useState(ler);

  useEffect(() => {
    const observer = new MutationObserver(() => setDark(ler()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    setDark(ler());
    return () => observer.disconnect();
  }, []);

  return dark;
}

export default function DemoBadge() {
  // Nasce aberto: quem abre a demo precisa saber que os dados são fictícios.
  const [aberto, setAberto] = useState(true);
  const darkMode = useTemaDoDocumento();

  // Esc recolhe o painel.
  useEffect(() => {
    if (!aberto) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setAberto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto]);

  return (
    <Wrapper>
      {aberto && (
        <Painel $dark={darkMode} role="status" aria-label="Sobre esta demonstração">
          <Cabecalho $dark={darkMode}>
            <i className="pi pi-eye" />
            <strong>Demonstração</strong>
            <Fechar
              $dark={darkMode}
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Recolher aviso de demonstração"
            >
              <i className="pi pi-times" />
            </Fechar>
          </Cabecalho>

          <Texto>
            Réplica visual do N1 App. Toda a camada de rede está interceptada —
            nenhuma API oficial é consultada.
          </Texto>

          <Lista $dark={darkMode}>
            <li><i className="pi pi-circle-fill" />Login aceita qualquer e-mail e senha.</li>
            <li><i className="pi pi-circle-fill" />Qualquer texto serve como User-Key.</li>
            <li><i className="pi pi-circle-fill" />Os dados são fictícios e fixos.</li>
          </Lista>
        </Painel>
      )}

      {!aberto && (
        <Chip $dark={darkMode} type="button" onClick={() => setAberto(true)}>
          <i className="pi pi-eye" />
          Demonstração
        </Chip>
      )}
    </Wrapper>
  );
}
