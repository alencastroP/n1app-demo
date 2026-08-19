// src/pages/FunilTecnico/components/FontesRag.jsx
import styled from 'styled-components';
import { palette } from './ui';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.6rem;
`;

const Head = styled.div`
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dark }) => ($dark ? 'rgba(196,181,253,.6)' : 'rgba(109,40,217,.5)')};
`;

const Item = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 9px;
  text-decoration: none;
  font-size: 0.78rem;
  color: ${({ $dark }) => palette($dark).text};
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};
  transition: border-color .14s ease, background .14s ease;
  cursor: ${({ $link }) => ($link ? 'pointer' : 'default')};

  &:hover {
    border-color: ${({ $dark, $link }) =>
      $link ? (($dark) ? 'rgba(216,180,254,.4)' : 'rgba(109,40,217,.3)') : undefined};
  }

  i { font-size: 0.72rem; color: ${({ $dark }) => palette($dark).accent}; flex-shrink: 0; }
  .titulo { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .modulo {
    flex-shrink: 0;
    font-size: 0.64rem;
    font-weight: 700;
    color: ${({ $dark }) => palette($dark).faint};
  }
`;

// Selo para fonte que ainda não passou por revisão técnica humana
// (confianca 'interno-nao-revisado' — ver docs/corpus-casos/PENDENTES_DE_REVISAO.md).
const SeloNaoRevisado = styled.span`
  flex-shrink: 0;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.35rem;
  border-radius: 5px;
  white-space: nowrap;
  color: ${({ $dark }) => ($dark ? '#fde68a' : '#92400e')};
  background: ${({ $dark }) => ($dark ? 'rgba(245,158,11,.16)' : 'rgba(245,158,11,.14)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(245,158,11,.35)' : 'rgba(245,158,11,.4)')};
`;

/**
 * Lista de fontes do RAG (base interna).
 * `fontes`: [{ titulo, url_central, modulo, score, revisado }].
 * Fontes sem url_central renderizam como item não-clicável. `revisado: false`
 * marca rascunho minerado que entrou no RAG sem revisão — o analista precisa
 * ver isso antes de agir sobre a resposta.
 */
export default function FontesRag({ fontes, dark }) {
  if (!Array.isArray(fontes) || fontes.length === 0) return null;
  return (
    <List>
      <Head $dark={dark}>Fontes ({fontes.length})</Head>
      {fontes.map((f, i) => {
        const hasLink = !!f.url_central;
        const props = hasLink
          ? { href: f.url_central, target: '_blank', rel: 'noopener noreferrer' }
          : {};
        return (
          <Item key={f.url_central || `${f.titulo}-${i}`} as={hasLink ? 'a' : 'div'} $dark={dark} $link={hasLink} {...props}>
            <i className={hasLink ? 'pi pi-external-link' : 'pi pi-file'} />
            <span className="titulo">{f.titulo || 'Fonte sem título'}</span>
            {f.revisado === false && (
              <SeloNaoRevisado $dark={dark} title="Rascunho minerado, ainda sem revisão técnica — confirme antes de aplicar.">
                não revisado
              </SeloNaoRevisado>
            )}
            {f.modulo && <span className="modulo">{f.modulo}</span>}
          </Item>
        );
      })}
    </List>
  );
}
