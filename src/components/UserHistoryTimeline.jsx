// src/components/UserHistoryTimeline.jsx
//
// Timeline de histórico de ações — agrupada por dia, com filtros (ação/service/busca).
// Compartilhada entre a página de Histórico (próprio usuário) e o modal de
// Gerenciar Usuários (histórico de outro usuário, admin/gestor).
//
// Recebe `items` já carregados + estados (loading/error/onReload). Não faz fetch:
// quem chama decide a fonte (getHistory / getHistoryOf).

import { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import styled from 'styled-components';

// ─── Config de ações ───────────────────────────────────────────────────────
const ACTION_CONFIG = {
  login: { label: 'Login', icon: 'pi pi-sign-in' },
  extracao: { label: 'Extração', icon: 'pi pi-download' },
  consulta: { label: 'Consulta', icon: 'pi pi-search' },
  execucao: { label: 'Execução', icon: 'pi pi-bolt' },
  criacao: { label: 'Criação', icon: 'pi pi-plus' },
};

const ACTION_OPTIONS = [
  { label: 'Todas', value: null },
  ...Object.entries(ACTION_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

// ─── Helpers de data ─────────────────────────────────────────────────────────
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(date) {
  const now = new Date();
  if (isSameDay(date, now)) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Ontem';
  const opts = { day: 'numeric', month: 'long' };
  if (date.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return new Intl.DateTimeFormat('pt-BR', opts).format(date);
}

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Styled ─────────────────────────────────────────────────────────────────
const FilterBar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 14px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.15rem;
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const FilterLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $dm }) => ($dm ? '#b8a8d8' : '#4f2e84')};
`;

const StateBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  text-align: center;
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px dashed ${({ $dm }) => ($dm ? '#3a2a6a' : '#d6ccf5')};
  border-radius: 14px;
  padding: 2.5rem 1.5rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.75)' : '#4f2e84')};
  font-size: 0.9rem;

  i { color: ${({ $dm }) => ($dm ? '#a78bfa' : '#7443f6')}; }
`;

const GroupHeader = styled.p`
  margin: 1.3rem 0 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.65)' : 'rgba(76,29,149,.7)')};

  &:first-child { margin-top: 0; }
`;

const Card = styled.section`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 14px;
  padding: 0.3rem 1rem;
  margin-bottom: 0.5rem;
  box-shadow: ${({ $dm }) => ($dm ? '0 4px 16px rgba(0,0,0,.35)' : '0 2px 8px rgba(100,60,180,.07)')};
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 0;
  border-bottom: ${({ $last, $dm }) =>
    $last ? 'none' : `1px solid ${$dm ? '#241a3d' : '#f0ecff'}`};
`;

const IconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 10px;
  background: ${({ $dm }) => ($dm ? 'rgba(167,139,250,.15)' : '#ebe5ff')};
  color: ${({ $dm }) => ($dm ? '#a78bfa' : '#7443f6')};
  flex-shrink: 0;

  i { font-size: 0.95rem; }
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const ItemMainLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ItemDesc = styled.span`
  font-size: 0.9rem;
  color: ${({ $dm }) => ($dm ? '#efeaff' : '#1E0C45')};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ServiceChip = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: ${({ $dm }) => ($dm ? 'rgba(167,139,250,.15)' : '#f0ecff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b21b6')};
  white-space: nowrap;
`;

const ItemMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.55)' : '#7c6a9c')};
`;

/**
 * Timeline reutilizável.
 * @param {object} p
 * @param {Array}  p.items    eventos { t, a, s, d, r, id }
 * @param {boolean} p.loading
 * @param {string} p.error
 * @param {function} p.onReload
 * @param {boolean} p.dm dark mode
 * @param {boolean} [p.showReload=true] mostra o botão de refresh na barra de filtros
 */
export default function UserHistoryTimeline({ items, loading, error, onReload, dm, showReload = true }) {
  const [filterAction, setFilterAction] = useState(null);
  const [filterService, setFilterService] = useState(null);
  const [search, setSearch] = useState('');

  const serviceOptions = useMemo(() => {
    const set = new Set(items.map((it) => it.s).filter(Boolean));
    return [
      { label: 'Todos', value: null },
      ...Array.from(set).sort().map((s) => ({ label: s, value: s })),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (filterAction && it.a !== filterAction) return false;
      if (filterService && it.s !== filterService) return false;
      if (q) {
        const hay = `${it.d || ''} ${it.s || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterAction, filterService, search]);

  const groups = useMemo(() => {
    const out = [];
    for (const it of filtered) {
      const date = new Date(it.t);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(it);
      else out.push({ key, label: dayLabel(date), items: [it] });
    }
    return out;
  }, [filtered]);

  return (
    <>
      <FilterBar $dm={dm}>
        <FilterField>
          <FilterLabel $dm={dm}>Tipo de ação</FilterLabel>
          <Dropdown
            value={filterAction}
            options={ACTION_OPTIONS}
            onChange={(e) => setFilterAction(e.value)}
            placeholder="Todas"
            style={{ width: 180 }}
          />
        </FilterField>
        <FilterField>
          <FilterLabel $dm={dm}>Service</FilterLabel>
          <Dropdown
            value={filterService}
            options={serviceOptions}
            onChange={(e) => setFilterService(e.value)}
            placeholder="Todos"
            style={{ width: 180 }}
          />
        </FilterField>
        <FilterField style={{ flex: 1, minWidth: 220 }}>
          <FilterLabel $dm={dm}>Busca</FilterLabel>
          <span className="p-input-icon-left" style={{ width: '100%' }}>
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição ou service"
              style={{ width: '100%' }}
            />
          </span>
        </FilterField>
        {showReload && (
          <Button
            icon="pi pi-refresh"
            outlined
            onClick={onReload}
            loading={loading}
            aria-label="Atualizar"
          />
        )}
      </FilterBar>

      {loading && (
        <StateBox $dm={dm}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.8rem' }} />
          <p>Carregando histórico…</p>
        </StateBox>
      )}

      {!loading && error && (
        <StateBox $dm={dm}>
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.8rem', color: '#ef4444' }} />
          <p>{error}</p>
          {onReload && <Button label="Tentar novamente" icon="pi pi-refresh" onClick={onReload} />}
        </StateBox>
      )}

      {!loading && !error && items.length === 0 && (
        <StateBox $dm={dm}>
          <i className="pi pi-inbox" style={{ fontSize: '1.8rem' }} />
          <p>Nenhuma ação registrada ainda.</p>
        </StateBox>
      )}

      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <StateBox $dm={dm}>
          <i className="pi pi-filter-slash" style={{ fontSize: '1.8rem' }} />
          <p>Nenhum resultado para os filtros aplicados.</p>
        </StateBox>
      )}

      {!loading && !error && groups.map((group) => (
        <div key={group.key}>
          <GroupHeader $dm={dm}>{group.label}</GroupHeader>
          <Card $dm={dm}>
            {group.items.map((it, idx) => {
              const cfg = ACTION_CONFIG[it.a] || { label: it.a, icon: 'pi pi-circle' };
              const date = new Date(it.t);
              const isError = it.r === 'erro';
              return (
                <ItemRow key={it.id || `${group.key}-${idx}`} $dm={dm} $last={idx === group.items.length - 1}>
                  <IconWrap $dm={dm}><i className={cfg.icon} /></IconWrap>
                  <ItemBody>
                    <ItemMainLine>
                      <ItemDesc $dm={dm}>{it.d || cfg.label}</ItemDesc>
                      {it.s && <ServiceChip $dm={dm}>{it.s}</ServiceChip>}
                    </ItemMainLine>
                    <ItemMeta $dm={dm}>{formatTime(date)}</ItemMeta>
                  </ItemBody>
                  <Tag severity={isError ? 'danger' : 'success'} value={isError ? 'erro' : 'ok'} />
                </ItemRow>
              );
            })}
          </Card>
        </div>
      ))}
    </>
  );
}
