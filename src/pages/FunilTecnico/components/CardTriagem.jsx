// src/pages/FunilTecnico/components/CardTriagem.jsx
import styled from 'styled-components';
import { palette, Chip, PrimaryBtn, GhostBtn } from './ui';
import SeveridadeTag from './SeveridadeTag';
import ConfiancaBar from './ConfiancaBar';

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px auto;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 13px;
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};
  border-left: 3px solid ${({ $accent }) => $accent};
  transition: transform .14s ease, box-shadow .14s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ $dark }) =>
      $dark ? '0 6px 18px rgba(109,40,217,.24)' : '0 4px 14px rgba(100,60,200,.12)'};
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
`;

const Main = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Tags = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const Title = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.3;
  color: ${({ $dark }) => palette($dark).textStrong};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
  font-size: 0.74rem;
  color: ${({ $dark }) => palette($dark).muted};

  span { display: inline-flex; align-items: center; gap: 0.3rem; }
  i { font-size: 0.7rem; }
`;

const Parado = styled.span`
  font-weight: 700;
  color: ${({ $alert, $dark }) =>
    $alert ? (($dark) ? '#fb7185' : '#e11d48') : palette($dark).muted};
`;

const ConfWrap = styled.div`
  min-width: 0;
  @media (max-width: 760px) { max-width: 220px; }
`;

const Cta = styled.div`
  display: flex;
  justify-content: flex-end;
  @media (max-width: 760px) { justify-content: flex-start; }
`;

/**
 * Linha priorizada da Fila de Triagem.
 * @param {object} caso  — objeto derivado no orquestrador (deriveCaso)
 * @param {number} slaLimit — dias para considerar SLA estourado (destaque vermelho)
 * @param {(caso)=>void} onResolver  — "Resolver com IA" (abre Copiloto)
 * @param {(caso)=>void} onRevisar   — "Revisar diagnóstico" (abre Workspace)
 */
export default function CardTriagem({ caso, dark, slaLimit = 7, onResolver, onRevisar }) {
  const p = palette(dark);
  const accent = caso.severidadeColor || p.accent;
  const podeResolverIA = caso.resolvivelIA;

  return (
    <Row $dark={dark} $accent={accent}>
      <Main>
        <Tags>
          {caso.categoria && (
            <Chip $color={p.accentStrong}>
              <i className="pi pi-tag" /> {caso.categoria}
            </Chip>
          )}
          <SeveridadeTag severidade={caso.severidade} dark={dark} />
          {caso.recorrente && (
            <Chip $color={dark ? '#34d399' : '#059669'}>
              <i className="pi pi-replay" /> Recorrente mapeado
            </Chip>
          )}
        </Tags>

        <Title $dark={dark} title={caso.title}>{caso.title}</Title>

        <Meta $dark={dark}>
          {/* contactName é null no funil (Contact não é expandido em /Deals); só
              aparece se um dia a listagem trouxer o nome. Só resolvido em /deal/:id. */}
          {caso.contactName && (
            <span><i className="pi pi-building" /> {caso.contactName}</span>
          )}
          {caso.ownerName && (
            <span><i className="pi pi-user" /> {caso.ownerName}</span>
          )}
          <Parado $dark={dark} $alert={caso.diasParado >= slaLimit}>
            <i className="pi pi-clock" /> {caso.diasParado} d parado
          </Parado>
        </Meta>
      </Main>

      <ConfWrap>
        <ConfiancaBar confianca={caso.confianca} dark={dark} showLabel />
      </ConfWrap>

      <Cta>
        {podeResolverIA ? (
          <PrimaryBtn onClick={() => onResolver?.(caso)}>
            <i className="pi pi-bolt" /> Resolver com IA
          </PrimaryBtn>
        ) : (
          <GhostBtn $dark={dark} onClick={() => onRevisar?.(caso)}>
            <i className="pi pi-search" /> Revisar diagnóstico
          </GhostBtn>
        )}
      </Cta>
    </Row>
  );
}
