// src/components/intercom-dashboard/FiltersBar.jsx
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputSwitch } from 'primereact/inputswitch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const RELATIVE_OPTIONS = [
  { label: '1 mês', value: 1 },
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
];

// Canais buscáveis (source.type do Intercom) com rótulo amigável.
const CHANNEL_OPTIONS = [
  { label: 'Todos os canais', value: null },
  { label: 'Chat / Messenger', value: 'conversation' },
  { label: 'E-mail', value: 'email' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Telefone', value: 'phone_call' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'SMS', value: 'sms' },
];

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------
const Bar = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a0e2e' : '#f9f7ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2a1f3d' : '#e5e0f5')};
  border-radius: 14px;
  padding: 1.1rem 1.4rem;
  margin-bottom: 1.25rem;
  box-shadow: ${({ $dm }) =>
    $dm ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.07)'};
`;

const BarTitle = styled.p`
  margin: 0 0 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.65)' : 'rgba(76,29,149,.7)')};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ $dm }) => ($dm ? '#b8a8d8' : '#4f2e84')};
`;

const ToggleRow = styled.div`
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a6a' : '#ddd6fe')};
`;

const ToggleBtn = styled.button`
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: ${({ $active, $dm }) =>
    $active
      ? $dm
        ? 'linear-gradient(90deg,#5b14b8,#6e10a5)'
        : 'linear-gradient(90deg,#7b3ff2,#9a37eb)'
      : $dm
        ? '#1a0e2e'
        : '#f5f3ff'};
  color: ${({ $active, $dm }) =>
    $active ? '#fff' : $dm ? '#c4b5fd' : '#5b21b6'};

  &:hover:not([disabled]) {
    background: ${({ $active, $dm }) =>
      $active
        ? undefined
        : $dm
          ? '#2b1f49'
          : '#ede8ff'};
  }
`;

const ValidationMsg = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: ${({ $error }) => ($error ? '#ef4444' : 'transparent')};
  min-height: 1em;
`;

const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const SwitchLabel = styled.span`
  font-size: 0.82rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b21b6')};
`;

const ActionsRow = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * Props:
 *   options    { teams:[{id,name}], agents:[{id,name}] }
 *   value      { teamIds, agentIds, periodStart, periodEnd, excludeChamadosFup }
 *   onChange   (patch) => void
 *   onGenerate () => void
 *   loading    boolean
 *   dm         boolean (dark mode)
 */
export default function FiltersBar({ options, value, onChange, onGenerate, loading, periodSyncKey, dm }) {
  const [periodMode, setPeriodMode] = useState('relative'); // 'relative' | 'fixed'
  const [relativeMonths, setRelativeMonths] = useState(3);
  const [calRange, setCalRange] = useState(null); // [Date, Date] | null
  const [rangeError, setRangeError] = useState('');

  // Sincroniza valor de período quando muda modo ou relativo
  useEffect(() => {
    if (periodMode === 'relative') {
      const end = endOfDay(new Date());
      const start = startOfDay(addMonths(end, -relativeMonths));
      onChange({ periodStart: Math.floor(start.getTime() / 1000), periodEnd: Math.floor(end.getTime() / 1000) });
      setRangeError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodMode, relativeMonths]);

  // Ao aplicar um preset (periodSyncKey muda), reflete o período carregado no
  // seletor: entra em modo "Fixo" com o intervalo já preenchido, evitando que a
  // UI (ex.: "Relativo 3 meses") diga uma coisa e o payload use outra.
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) { firstSync.current = false; return; }
    if (value?.periodStart && value?.periodEnd) {
      setCalRange([new Date(value.periodStart * 1000), new Date(value.periodEnd * 1000)]);
      setPeriodMode('fixed');
      setRangeError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodSyncKey]);

  const handleCalChange = (e) => {
    const range = e.value; // [Date, Date] ou [Date, null]
    setCalRange(range);
    if (!range || !range[0] || !range[1]) {
      setRangeError('');
      return;
    }
    const [s, en] = range;
    const diffMs = en.getTime() - s.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths > 6.2) {
      setRangeError('O período máximo permitido é 6 meses.');
      return;
    }
    setRangeError('');
    onChange({
      periodStart: Math.floor(startOfDay(s).getTime() / 1000),
      periodEnd: Math.floor(endOfDay(en).getTime() / 1000),
    });
  };

  const teamOptions = (options?.teams ?? []).map((t) => ({ label: t.name, value: t.id }));
  const agentOptions = (options?.agents ?? []).map((a) => ({ label: a.name, value: a.id }));
  const tagOptions = (options?.tags ?? []).map((t) => ({ label: t.name, value: t.id }));

  // No modo fixo, value.periodStart/End ainda guardam o período do modo
  // relativo anterior até o Calendar ser preenchido — sem este guard o
  // relatório sairia com um período diferente do exibido na tela.
  const fixedRangeIncomplete =
    periodMode === 'fixed' && (!calRange || !calRange[0] || !calRange[1]);

  const canGenerate =
    !loading &&
    (value?.teamIds?.length ?? 0) > 0 &&
    value?.periodStart &&
    value?.periodEnd &&
    !rangeError &&
    !fixedRangeIncomplete;

  return (
    <Bar $dm={dm}>
      <BarTitle $dm={dm}>Filtros do Relatório</BarTitle>

      <Grid>
        {/* Período */}
        <Field style={{ gridColumn: 'span 2' }}>
          <Label $dm={dm}>Período</Label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <Label $dm={dm} style={{ display: 'block', marginBottom: '0.35rem' }}>Modo</Label>
              <ToggleRow $dm={dm}>
                <ToggleBtn
                  type="button"
                  aria-pressed={periodMode === 'relative'}
                  $active={periodMode === 'relative'}
                  $dm={dm}
                  onClick={() => setPeriodMode('relative')}
                >
                  Relativo
                </ToggleBtn>
                <ToggleBtn
                  type="button"
                  aria-pressed={periodMode === 'fixed'}
                  $active={periodMode === 'fixed'}
                  $dm={dm}
                  onClick={() => setPeriodMode('fixed')}
                >
                  Fixo
                </ToggleBtn>
              </ToggleRow>
            </div>

            {periodMode === 'relative' ? (
              <div>
                <Label $dm={dm} style={{ display: 'block', marginBottom: '0.35rem' }}>Últimos</Label>
                <ToggleRow $dm={dm}>
                  {RELATIVE_OPTIONS.map((opt) => (
                    <ToggleBtn
                      key={opt.value}
                      type="button"
                      aria-pressed={relativeMonths === opt.value}
                      $active={relativeMonths === opt.value}
                      $dm={dm}
                      onClick={() => setRelativeMonths(opt.value)}
                    >
                      {opt.label}
                    </ToggleBtn>
                  ))}
                </ToggleRow>
              </div>
            ) : (
              <div>
                <Label $dm={dm} style={{ display: 'block', marginBottom: '0.35rem' }}>
                  Intervalo (máx. 6 meses)
                </Label>
                <Calendar
                  value={calRange}
                  onChange={handleCalChange}
                  selectionMode="range"
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Selecione o período"
                  style={{ minWidth: 260 }}
                  readOnlyInput
                  locale="pt-BR"
                  maxDate={new Date()}
                />
                <ValidationMsg $error={!!rangeError}>{rangeError || ' '}</ValidationMsg>
              </div>
            )}
          </div>
        </Field>

        {/* Equipes */}
        <Field>
          <Label $dm={dm}>Equipes *</Label>
          <MultiSelect
            value={value?.teamIds ?? []}
            options={teamOptions}
            onChange={(e) => onChange({ teamIds: e.value })}
            placeholder="Selecione equipes"
            display="chip"
            filter
            emptyFilterMessage="Nenhuma equipe encontrada"
            style={{ width: '100%' }}
            disabled={loading}
          />
        </Field>

        {/* Agentes */}
        <Field>
          <Label $dm={dm}>Agentes (opcional)</Label>
          <MultiSelect
            value={value?.agentIds ?? []}
            options={agentOptions}
            onChange={(e) => onChange({ agentIds: e.value })}
            placeholder="Todos os agentes"
            display="chip"
            filter
            emptyFilterMessage="Nenhum agente encontrado"
            style={{ width: '100%' }}
            disabled={loading}
          />
        </Field>

        {/* Canal */}
        <Field>
          <Label $dm={dm}>Canal (opcional)</Label>
          <Dropdown
            value={value?.channel ?? null}
            options={CHANNEL_OPTIONS}
            onChange={(e) => onChange({ channel: e.value })}
            placeholder="Todos os canais"
            style={{ width: '100%' }}
            disabled={loading}
          />
        </Field>

        {/* Tags */}
        {tagOptions.length > 0 && (
          <Field>
            <Label $dm={dm}>Tags (opcional)</Label>
            <MultiSelect
              value={value?.tagIds ?? []}
              options={tagOptions}
              onChange={(e) => onChange({ tagIds: e.value })}
              placeholder="Todas as tags"
              display="chip"
              filter
              emptyFilterMessage="Nenhuma tag encontrada"
              style={{ width: '100%' }}
              disabled={loading}
            />
          </Field>
        )}

        {/* Toggle FUP */}
        <Field>
          <Label $dm={dm}>Opções</Label>
          <SwitchRow>
            <InputSwitch
              checked={value?.excludeChamadosFup ?? true}
              onChange={(e) => onChange({ excludeChamadosFup: e.value })}
              disabled={loading}
            />
            <SwitchLabel $dm={dm}>Excluir chamados/FUP do CT</SwitchLabel>
          </SwitchRow>
        </Field>
      </Grid>

      <ActionsRow>
        <Button
          label={loading ? 'Gerando…' : 'Gerar relatório'}
          icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-chart-bar'}
          onClick={onGenerate}
          disabled={!canGenerate}
          style={{
            background: canGenerate ? 'linear-gradient(90deg,#7b3ff2,#9a37eb)' : undefined,
            border: 'none',
            fontWeight: 700,
          }}
        />
        {(value?.teamIds?.length ?? 0) === 0 && (
          <span style={{ fontSize: '0.78rem', color: dm ? '#9ca3af' : '#7f69ab' }}>
            Selecione ao menos uma equipe para gerar o relatório.
          </span>
        )}
        {(value?.teamIds?.length ?? 0) > 0 && fixedRangeIncomplete && (
          <span style={{ fontSize: '0.78rem', color: dm ? '#9ca3af' : '#7f69ab' }}>
            Selecione o intervalo de datas para gerar o relatório.
          </span>
        )}
      </ActionsRow>
    </Bar>
  );
}
