// src/pages/FunilTecnico/components/PassoDynatrace.jsx
import { useRef } from 'react';
import styled from 'styled-components';
import { InputTextarea } from 'primereact/inputtextarea';
import { palette, GhostBtn } from './ui';

const Box = styled.div`
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
  background: ${({ $dark }) => ($dark ? 'rgba(217,119,6,.08)' : 'rgba(217,119,6,.06)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(251,191,36,.28)' : 'rgba(217,119,6,.22)')};
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#fbbf24' : '#b45309')};
  margin-bottom: 0.5rem;

  i { font-size: 0.85rem; }
`;

const Hint = styled.p`
  margin: 0 0 0.6rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: ${({ $dark }) => palette($dark).muted};
`;

const Query = styled.pre`
  margin: 0 0 0.6rem;
  padding: 0.6rem 0.7rem;
  border-radius: 9px;
  overflow-x: auto;
  max-width: 100%;
  box-sizing: border-box;
  font-size: 0.76rem;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  color: ${({ $dark }) => ($dark ? '#fcd34d' : '#92400e')};
  background: ${({ $dark }) => ($dark ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.7)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(251,191,36,.2)' : 'rgba(217,119,6,.18)')};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
`;

const Area = styled.div`
  max-width: 100%;

  .p-inputtextarea {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    font-size: 0.78rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    border-radius: 9px;
  }
`;

/**
 * Passo manual do Dynatrace: mostra a query sugerida, permite copiar e colar os
 * logs obtidos. Os logs colados sobem via onChange para alimentar a IA depois.
 *
 * @param {string} query   query sugerida (texto)
 * @param {string} logs    valor controlado do textarea (logs colados)
 * @param {(v:string)=>void} onChange
 * @param {(msg:string)=>void} [onCopied] feedback ao copiar
 */
export default function PassoDynatrace({ query, logs, onChange, dark, onCopied }) {
  const areaRef = useRef(null);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(query || '');
      onCopied?.('Query copiada.');
    } catch {
      // Fallback: seleciona o texto para cópia manual quando clipboard é bloqueado.
      onCopied?.('Copie a query manualmente (clipboard indisponível).');
    }
  };

  return (
    <Box $dark={dark}>
      <Head $dark={dark}>
        <i className="pi pi-search" /> Coletar logs no Dynatrace (execução manual)
      </Head>
      <Hint $dark={dark}>
        A IA não acessa o Dynatrace. Rode a query abaixo, cole os logs obtidos e anexe —
        eles alimentam a análise profunda quando ela for liberada.
      </Hint>

      {query && <Query $dark={dark}>{query}</Query>}

      <Actions>
        <GhostBtn $dark={dark} onClick={copiar} type="button">
          <i className="pi pi-copy" /> Copiar query
        </GhostBtn>
      </Actions>

      <Area>
        <InputTextarea
          ref={areaRef}
          value={logs || ''}
          onChange={(e) => onChange?.(e.target.value)}
          rows={5}
          autoResize
          placeholder="Cole aqui os logs obtidos no Dynatrace…"
        />
      </Area>
    </Box>
  );
}
