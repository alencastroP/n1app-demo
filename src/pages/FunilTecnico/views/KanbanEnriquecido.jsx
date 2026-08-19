// src/pages/FunilTecnico/views/KanbanEnriquecido.jsx
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { palette, Chip, STATUS, fadeUp } from '../components/ui';
import { deriveCaso } from '../data';
import ConfiancaBar from '../components/ConfiancaBar';
import SeveridadeTag from '../components/SeveridadeTag';

/* ── toolbar ─────────────────────────────────────────────────────────────── */
const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const SearchWrap = styled.span`
  position: relative;
  flex: 1;
  min-width: 200px;

  i.pi-search {
    position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%);
    font-size: 0.8rem; z-index: 1; pointer-events: none;
    color: ${({ $dark }) => palette($dark).accent};
  }
  .p-inputtext { width: 100%; padding-left: 2rem; font-size: 0.84rem; border-radius: 9px; }
`;

const Toggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
  border: 1.5px solid ${({ $active, $dark }) =>
    $active ? (($dark) ? '#a78bfa' : '#7c3aed') : 'rgba(128,128,128,.2)'};
  background: ${({ $active, $dark }) =>
    $active ? (($dark) ? 'rgba(139,92,246,.22)' : 'rgba(139,92,246,.12)') : 'transparent'};
  color: ${({ $active, $dark }) =>
    $active ? (($dark) ? '#c4b5fd' : '#6d28d9') : palette($dark).muted};

  i { font-size: 0.72rem; }
`;

/* ── board ───────────────────────────────────────────────────────────────── */
const Board = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  animation: ${fadeUp} 0.32s ease;

  &::-webkit-scrollbar { height: 7px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ $dark }) => ($dark ? 'rgba(139,92,246,.38)' : 'rgba(139,92,246,.22)')};
    border-radius: 999px;
  }
`;

/* Coluna com altura natural: o scroll vertical é o da própria página (um só,
   sem "tabela com scroll próprio"); o board rola apenas na horizontal.
   Cabeçalho fixo de coluna foi descartado: o Board é um scroll-container
   (overflow-x), o que impede position:sticky de acompanhar o scroll da página. */
const Col = styled.div`
  flex: 0 0 288px;
  display: flex;
  flex-direction: column;
  border-radius: 15px;
  overflow: hidden;
  background: ${({ $dark }) => ($dark ? '#110828' : '#f5f3ff')};
  border: 1px solid ${({ $dark }) => palette($dark).border};
`;

const ColAccent = styled.div`
  height: 3px; flex-shrink: 0;
  background: linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%);
`;

const ColHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.8rem 0.9rem;
  background: ${({ $dark }) => ($dark ? '#1a0e2e' : '#fff')};
  border-bottom: 1px solid ${({ $dark }) => palette($dark).border};
  flex-shrink: 0;

  .name {
    font-size: 0.86rem; font-weight: 700; color: ${({ $dark }) => palette($dark).textStrong};
    min-width: 0; overflow-wrap: break-word;
  }
  .count {
    flex-shrink: 0;
    font-size: 0.68rem; font-weight: 800; padding: 0.14rem 0.48rem; border-radius: 999px;
    color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#6d28d9')};
    background: ${({ $dark }) => palette($dark).accentBg};
  }
`;

const CardList = styled.div`
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Card = styled.div`
  background: ${({ $dark }) => ($dark ? '#1e1148' : '#fff')};
  border: 1px solid ${({ $dark }) => palette($dark).borderSoft};
  border-left: 3px solid ${({ $accent }) => $accent};
  border-radius: 10px;
  padding: 0.68rem 0.72rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: transform .14s ease, box-shadow .14s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $dark }) =>
      $dark ? '0 5px 18px rgba(109,40,217,.26)' : '0 4px 14px rgba(100,60,200,.12)'};
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const IaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.14rem 0.44rem;
  border-radius: 999px;
  color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
  background: ${({ $dark }) =>
    $dark ? 'linear-gradient(135deg,rgba(139,92,246,.4),rgba(79,70,229,.35))' : 'rgba(139,92,246,.14)'};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(216,180,254,.3)' : 'rgba(116,67,246,.2)')};

  i { font-size: 0.58rem; }
`;

const CardTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.3;
  color: ${({ $dark }) => palette($dark).textStrong};
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  font-size: 0.7rem;
  color: ${({ $dark }) => palette($dark).muted};

  span { display: inline-flex; align-items: center; gap: 0.28rem; }
  i { font-size: 0.64rem; }
  .parado { color: ${({ $alert, $dark }) => ($alert ? (($dark) ? '#fb7185' : '#e11d48') : 'inherit')};
    font-weight: ${({ $alert }) => ($alert ? 700 : 400)}; }
`;

const ColEmpty = styled.div`
  padding: 1.6rem 1rem;
  text-align: center;
  color: ${({ $dark }) => palette($dark).faint};
  font-size: 0.74rem;
`;

/* Botão "Abrir" do card (mock): mesma ação do clique no card, mas explícita. */
const OpenBtn = styled.button`
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.26rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.22)' : 'rgba(116,67,246,.18)')};
  background: transparent;
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#6d28d9')};
  transition: background .14s ease;

  &:hover { background: ${({ $dark }) => ($dark ? 'rgba(76,29,149,.24)' : 'rgba(139,92,246,.08)')}; }
  i { font-size: 0.6rem; }
`;

/**
 * Kanban enriquecido: colunas do funil com badges de IA por card e ordenação
 * opcional por confiança. Cards sem triagem renderizam normalmente, sem badges.
 */
export default function KanbanEnriquecido({ board, dark, onOpenCaso }) {
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(true);
  const [byConfianca, setByConfianca] = useState(false);

  const columns = useMemo(() => {
    if (!board?.columns) return [];
    const q = search.trim().toLowerCase();

    return board.columns.map((col) => {
      // O board é o espelho fiel do funil: SEM whitelist de owners (a
      // whitelist FUNIL_ALLOWED_OWNERS segue valendo só na Fila/métricas).
      // Era ela que "esvaziava" colunas como Migração CPQ, cujos cards
      // pertencem a owners fora da lista.
      let casos = (col.deals || []).map((d) => deriveCaso(d, col.stage, dark));

      if (openOnly) casos = casos.filter((c) => c.statusId === 1);
      if (q) {
        casos = casos.filter(
          (c) =>
            c.title?.toLowerCase().includes(q) ||
            c.ownerName?.toLowerCase().includes(q),
        );
      }
      if (byConfianca) {
        casos = [...casos].sort((a, b) => (b.confianca ?? -1) - (a.confianca ?? -1));
      }
      return { stage: col.stage, casos };
    });
  }, [board, search, openOnly, byConfianca, dark]);

  return (
    <div>
      <Toolbar>
        <SearchWrap $dark={dark}>
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negociação ou responsável…"
          />
        </SearchWrap>
        <Toggle $dark={dark} $active={openOnly} onClick={() => setOpenOnly((v) => !v)} type="button">
          <i className="pi pi-circle-fill" /> Em aberto
        </Toggle>
        <Toggle $dark={dark} $active={byConfianca} onClick={() => setByConfianca((v) => !v)} type="button">
          <i className="pi pi-bolt" /> Ordenar por confiança IA
        </Toggle>
      </Toolbar>

      <Board $dark={dark}>
        {columns.map((col) => (
          <Col key={col.stage.id} $dark={dark}>
            <ColAccent />
            <ColHeader $dark={dark}>
              <span className="name">{col.stage.name}</span>
              <span className="count">{col.casos.length}</span>
            </ColHeader>
            <CardList $dark={dark}>
              {col.casos.length === 0 ? (
                <ColEmpty $dark={dark}>Sem negociações</ColEmpty>
              ) : (
                col.casos.map((caso) => {
                  const st = STATUS[caso.statusId] || STATUS[1];
                  const accent = caso.severidadeColor || (dark ? st.dark : st.light);
                  return (
                    <Card
                      key={caso.id}
                      $dark={dark}
                      $accent={accent}
                      onClick={() => onOpenCaso?.(caso)}
                    >
                      <CardTop>
                        {caso.categoria && (
                          <Chip $color={dark ? '#c4b5fd' : '#6d28d9'}>
                            <i className="pi pi-tag" /> {caso.categoria}
                          </Chip>
                        )}
                        <SeveridadeTag severidade={caso.severidade} dark={dark} />
                        {caso.triagem && (
                          <IaBadge $dark={dark}>
                            <i className="pi pi-sparkles" /> IA
                          </IaBadge>
                        )}
                      </CardTop>

                      <CardTitle $dark={dark}>{caso.title}</CardTitle>

                      <CardMeta $dark={dark} $alert={caso.diasParado >= 7}>
                        {caso.ownerName && (
                          <span><i className="pi pi-user" /> {caso.ownerName.split(' - ')[0]}</span>
                        )}
                        <span className="parado">
                          <i className="pi pi-clock" /> {caso.diasParado} d
                        </span>
                      </CardMeta>

                      {caso.confianca != null && (
                        <ConfiancaBar confianca={caso.confianca} dark={dark} />
                      )}

                      <OpenBtn
                        $dark={dark}
                        type="button"
                        title="Abrir o caso no Workspace"
                        onClick={(e) => { e.stopPropagation(); onOpenCaso?.(caso); }}
                      >
                        <i className="pi pi-arrow-up-right" /> Abrir
                      </OpenBtn>
                    </Card>
                  );
                })
              )}
            </CardList>
          </Col>
        ))}
      </Board>
    </div>
  );
}
