// src/pages/FunilTecnico/views/FilaTriagem.jsx
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { palette, fadeUp } from '../components/ui';
import { SORTERS } from '../data';
import CardTriagem from '../components/CardTriagem';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  animation: ${fadeUp} 0.3s ease;
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const Label = styled.span`
  font-size: 0.76rem;
  font-weight: 700;
  color: ${({ $dark }) => palette($dark).muted};
`;

const Pills = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.34rem 0.72rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: all .14s ease;
  border: 1.5px solid ${({ $active, $dark }) =>
    $active ? (($dark) ? '#a78bfa' : '#7c3aed') : 'rgba(128,128,128,.2)'};
  background: ${({ $active, $dark }) =>
    $active ? (($dark) ? 'rgba(139,92,246,.2)' : 'rgba(139,92,246,.1)') : 'transparent'};
  color: ${({ $active, $dark }) =>
    $active ? (($dark) ? '#c4b5fd' : '#6d28d9') : palette($dark).muted};

  i { font-size: 0.68rem; }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 0.3rem;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ $dark }) => palette($dark).textStrong};

  .dot { width: 8px; height: 8px; border-radius: 999px; background: ${({ $dark }) => ($dark ? '#34d399' : '#059669')}; }
  .count {
    font-size: 0.68rem; font-weight: 800; padding: 0.1rem 0.45rem; border-radius: 999px;
    color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#6d28d9')};
    background: ${({ $dark }) => palette($dark).accentBg};
  }
  .hint { font-size: 0.72rem; font-weight: 500; color: ${({ $dark }) => palette($dark).faint}; }
`;

const Empty = styled.div`
  padding: 2.5rem 1rem;
  text-align: center;
  color: ${({ $dark }) => palette($dark).faint};
  font-size: 0.82rem;

  i { display: block; font-size: 2rem; opacity: .4; margin-bottom: 0.5rem; }
`;

/* Banner de pré-triagem (mock): resume quantos casos já foram analisados pela IA. */
const TriageBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.95rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
  background: ${({ $dark }) => palette($dark).accentBg};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.22)' : 'rgba(139,92,246,.2)')};

  i { font-size: 0.95rem; color: ${({ $dark }) => palette($dark).accent}; }
  strong { font-weight: 800; }
  .sub { color: ${({ $dark }) => palette($dark).muted}; }
`;

const SORT_OPTIONS = [
  { key: 'severidade', label: 'Severidade', icon: 'pi-flag' },
  { key: 'parado', label: 'Tempo parado', icon: 'pi-clock' },
  { key: 'confianca', label: 'Confiança IA', icon: 'pi-bolt' },
];

/**
 * Fila de Triagem: casos em aberto priorizados. Separa os "resolvíveis por IA"
 * no topo e ordena o restante pelo critério escolhido.
 */
export default function FilaTriagem({ casos, dark, onResolver, onRevisar }) {
  const [sortBy, setSortBy] = useState('severidade');

  const abertos = useMemo(
    () => casos.filter((c) => c.statusId === 1),
    [casos],
  );

  const { resolviveis, revisar } = useMemo(() => {
    const sorter = SORTERS[sortBy] || SORTERS.severidade;
    const res = abertos.filter((c) => c.resolvivelIA).sort(sorter);
    const rev = abertos.filter((c) => !c.resolvivelIA).sort(sorter);
    return { resolviveis: res, revisar: rev };
  }, [abertos, sortBy]);

  const triados = useMemo(() => abertos.filter((c) => c.triagem).length, [abertos]);

  if (abertos.length === 0) {
    return (
      <Empty $dark={dark}>
        <i className="pi pi-check-circle" />
        Nenhum caso em aberto na fila.
      </Empty>
    );
  }

  return (
    <Wrap>
      {triados > 0 && (
        <TriageBanner $dark={dark}>
          <i className="pi pi-sparkles" />
          <span>
            <strong>Pré-triagem automática concluída</strong>{' '}
            <span className="sub">
              — {triados} de {abertos.length} casos em aberto analisados pela IA
            </span>
          </span>
        </TriageBanner>
      )}

      <Bar>
        <Label $dark={dark}>Ordenar por</Label>
        <Pills>
          {SORT_OPTIONS.map((o) => (
            <Pill
              key={o.key}
              $dark={dark}
              $active={sortBy === o.key}
              onClick={() => setSortBy(o.key)}
              type="button"
            >
              <i className={`pi ${o.icon}`} /> {o.label}
            </Pill>
          ))}
        </Pills>
      </Bar>

      {resolviveis.length > 0 && (
        <Section>
          <SectionHead $dark={dark}>
            <span className="dot" />
            Resolução automática disponível
            <span className="count">{resolviveis.length}</span>
            <span className="hint">correção mapeada · alta confiança</span>
          </SectionHead>
          {resolviveis.map((caso) => (
            <CardTriagem
              key={caso.id}
              caso={caso}
              dark={dark}
              onResolver={onResolver}
              onRevisar={onRevisar}
            />
          ))}
        </Section>
      )}

      {revisar.length > 0 && (
        <Section>
          {resolviveis.length > 0 && (
            <SectionHead $dark={dark}>
              Requer revisão
              <span className="count">{revisar.length}</span>
            </SectionHead>
          )}
          {revisar.map((caso) => (
            <CardTriagem
              key={caso.id}
              caso={caso}
              dark={dark}
              onResolver={onResolver}
              onRevisar={onRevisar}
            />
          ))}
        </Section>
      )}
    </Wrap>
  );
}
