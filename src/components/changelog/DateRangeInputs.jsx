// components/changelog/DateRangeInputs.jsx
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
// Mesma superfície dos demais campos do Changelog (referência: "Usuários").
import { fieldShell, FIELD } from '../../styles/changelogStyles';

// ─── Styled ──────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const SummaryButton = styled.button`
  ${fieldShell}
  &&& {
    text-align: left;
    padding: ${FIELD.padding};
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const DurationBadge = styled.span`
  margin-left: auto;
  font-size: 0.78rem;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.22)' : '#f0eaff')};
  color: ${({ $dark }) => ($dark ? '#caaeff' : '#6030b2')};
  white-space: nowrap;
  flex-shrink: 0;
`;

const Panel = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#dccff2')};
  background: ${({ $dark }) => ($dark ? '#21133a' : '#faf7ff')};
  border-radius: 0.9rem;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  @media (max-width: 620px) { grid-template-columns: 1fr; }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const FieldLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#dacdf8' : '#4f2e84')};
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: stretch;
`;

const DateInput = styled.input`
  ${fieldShell}
  &&& {
    flex: 1;
    min-width: 0;
    padding: ${FIELD.padding};
    font-family: 'Courier New', Courier, monospace;
    letter-spacing: 0.04em;
  }

  &&&::placeholder { font-family: inherit; letter-spacing: normal; }

  /* Data inválida: vem DEPOIS do shell, mesma especificidade (0,3,0). */
  ${({ $invalid }) => $invalid && css`&&& { border-color: #f87171 !important; }`}
`;

const CalBtn = styled.button`
  flex-shrink: 0;
  width: 40px;
  min-height: 40px;
  border-radius: 0.6rem;
  border: none;
  background: linear-gradient(90deg, #7b3ff2 0%, #9a37eb 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.2s;
  &:hover { filter: brightness(1.12); }
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const HintText = styled.p`
  font-size: 0.76rem;
  color: ${({ $dark }) => ($dark ? '#ad9bce' : '#7f69ab')};
  margin: 0;
`;

const ApplyButton = styled.button`
  flex-shrink: 0;
  height: 34px;
  padding: 0 1rem;
  border-radius: 0.6rem;
  border: none;
  background: linear-gradient(90deg, #7b3ff2 0%, #9a37eb 100%);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: filter 0.2s;
  &:hover { filter: brightness(1.1); }
  &:disabled { opacity: 0.45; cursor: not-allowed; filter: none; }
`;

const ErrorText = styled.p`
  font-size: 0.78rem;
  color: #ef4444;
  margin: 0;
`;

// ─── Mini Calendar Picker (portal via fixed positioning) ──────────────────────

const PickerPortal = styled.div`
  position: fixed;
  z-index: 9999;
  width: 272px;
  background: ${({ $dark }) => ($dark ? '#1d1133' : '#ffffff')};
  border: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')};
  border-radius: 0.9rem;
  box-shadow: 0 8px 28px rgba(0,0,0,0.32);
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  user-select: none;
`;

const CalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.2rem;
`;

const CalNavBtn = styled.button`
  background: none;
  border: none;
  color: ${({ $dark }) => ($dark ? '#caaeff' : '#7b3ff2')};
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  &:hover { background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.22)' : '#ede5ff')}; }
`;

const CalMonthLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#e8dcff' : '#3d216f')};
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
`;

const CalDayHeader = styled.div`
  text-align: center;
  font-size: 0.7rem;
  color: ${({ $dark }) => ($dark ? '#ad9bce' : '#7f69ab')};
  padding: 0.15rem 0;
`;

const CalDay = styled.button`
  all: unset;
  text-align: center;
  font-size: 0.78rem;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  cursor: ${({ $empty, $disabled }) => ($empty || $disabled ? 'default' : 'pointer')};
  color: ${({ $dark, $today, $selected, $other, $disabled }) =>
    $selected ? '#fff'
    : $disabled ? ($dark ? '#4a3a6a' : '#ccc')
    : $other ? ($dark ? '#5a4778' : '#b9a8d8')
    : $dark ? '#f2ebff' : '#24134a'};
  background: ${({ $selected }) =>
    $selected ? 'linear-gradient(90deg,#7b3ff2,#9a37eb)' : 'transparent'};
  outline: ${({ $today, $selected, $dark }) =>
    !$selected && $today ? `1px solid ${$dark ? '#7b3ff2' : '#9a37eb'}` : 'none'};
  &:hover {
    background: ${({ $selected, $empty, $disabled }) =>
      $selected || $empty || $disabled ? undefined : 'rgba(123,63,242,0.22)'};
  }
`;

const TimePicker = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border-top: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#e0d5f5')};
  padding-top: 0.5rem;
`;

const TimeCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
`;

const TimeVal = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#f2ebff' : '#24134a')};
  width: 2rem;
  text-align: center;
`;

const TimeBtn = styled.button`
  background: none;
  border: none;
  color: ${({ $dark }) => ($dark ? '#caaeff' : '#7b3ff2')};
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 0.3rem;
  &:hover { background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.22)' : '#ede5ff')}; }
`;

const TimeSep = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#f2ebff' : '#24134a')};
`;

const CalFooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  border-top: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#e0d5f5')};
  padding-top: 0.4rem;
`;

const CalFooterBtn = styled.button`
  background: none;
  border: none;
  font-size: 0.78rem;
  color: ${({ $dark }) => ($dark ? '#caaeff' : '#7b3ff2')};
  cursor: pointer;
  padding: 0.15rem 0.4rem;
  border-radius: 0.3rem;
  &:hover { background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.18)' : '#ede5ff')}; }
`;

const CalConfirmBtn = styled.button`
  background: linear-gradient(90deg, #7b3ff2 0%, #9a37eb 100%);
  border: none;
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  padding: 0.3rem 0.7rem;
  border-radius: 0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: filter 0.2s;
  &:hover { filter: brightness(1.1); }
  &:disabled { opacity: 0.45; cursor: not-allowed; filter: none; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const RE_FULL = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/;

function parseInput(str) {
  const m = String(str || '').trim().match(RE_FULL);
  if (!m) return null;
  const [, dd, mm, yyyy, HH, MM] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(HH), Number(MM), 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(date) {
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const HH = String(date.getHours()).padStart(2, '0');
  const MM = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
}

function applyMask(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) out += '/';
    else if (i === 8) out += ' ';
    else if (i === 10) out += ':';
    out += digits[i];
  }
  return out;
}

function calcDuration(start, end) {
  if (!start || !end || end <= start) return null;
  const ms = end - start;
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts = [];
  if (days) parts.push(`${days} dia${days !== 1 ? 's' : ''}`);
  if (hours) parts.push(`${hours}h`);
  if (mins || !parts.length) parts.push(`${mins}min`);
  return parts.join(' ');
}

function validateDate(d, refStart, which) {
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  if (d > today) return 'Data não pode ser futura';
  if (d < sixMonthsAgo) return 'Data além dos 6 meses permitidos';
  if (which === 'end' && refStart && d <= refStart) return 'Deve ser após a data de início';
  return '';
}

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, month: month - 1, year: month === 0 ? year - 1 : year, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month, year, other: false });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, other: true });
  return cells;
}

// ─── MiniCalendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ dark, value, onChange, minDate, maxDate, anchorRef, onClose }) {
  const initial = value || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [hour, setHour] = useState(value ? value.getHours() : new Date().getHours());
  const [minute, setMinute] = useState(value ? value.getMinutes() : 0);
  const [pending, setPending] = useState(value || null);
  const [pos, setPos] = useState(null);
  const pickerRef = useRef(null);

  // useLayoutEffect: posiciona antes do paint para evitar flash no canto superior esquerdo
  useLayoutEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const W = 272;
    const gap = 6;
    let left = rect.left;
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (left < 8) left = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > 320 ? rect.bottom + gap : rect.top - 320 - gap;
    setPos({ top: Math.max(8, top), left });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  const today = new Date();
  const cells = buildCalendarDays(viewYear, viewMonth);

  const selectDay = (cell) => {
    if (cell.other) return;
    const d = new Date(cell.year, cell.month, cell.day, hour, minute, 0, 0);
    if (minDate && d < minDate) return;
    if (maxDate && d > maxDate) return;
    setPending(d);
  };

  const changeHour = (delta) => {
    const h = (hour + delta + 24) % 24;
    setHour(h);
    if (pending) {
      setPending(new Date(pending.getFullYear(), pending.getMonth(), pending.getDate(), h, minute, 0, 0));
    }
  };

  const changeMinute = (delta) => {
    const m = (minute + delta + 60) % 60;
    setMinute(m);
    if (pending) {
      setPending(new Date(pending.getFullYear(), pending.getMonth(), pending.getDate(), hour, m, 0, 0));
    }
  };

  const isDisabled = (cell) => {
    const d = new Date(cell.year, cell.month, cell.day, 23, 59);
    const dStart = new Date(cell.year, cell.month, cell.day, 0, 0);
    if (minDate && d < minDate) return true;
    if (maxDate && dStart > maxDate) return true;
    return false;
  };

  const isToday = (cell) => {
    return !cell.other &&
      cell.day === today.getDate() &&
      cell.month === today.getMonth() &&
      cell.year === today.getFullYear();
  };

  const isSelected = (cell) => {
    if (!pending || cell.other) return false;
    return cell.day === pending.getDate() &&
      cell.month === pending.getMonth() &&
      cell.year === pending.getFullYear();
  };

  const confirmAndClose = () => {
    if (!pending) return;
    onChange(pending);
    onClose();
  };

  return (
    <PickerPortal
      ref={pickerRef}
      $dark={dark}
      style={pos
        ? { top: pos.top, left: pos.left }
        : { top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <CalHeader>
        <CalNavBtn $dark={dark} onClick={() => { const d = new Date(viewYear, viewMonth - 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}>
          <i className="pi pi-chevron-left" />
        </CalNavBtn>
        <CalMonthLabel $dark={dark}>{MONTHS[viewMonth]} {viewYear}</CalMonthLabel>
        <CalNavBtn $dark={dark} onClick={() => { const d = new Date(viewYear, viewMonth + 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}>
          <i className="pi pi-chevron-right" />
        </CalNavBtn>
      </CalHeader>

      <CalGrid>
        {DAYS.map(d => <CalDayHeader key={d} $dark={dark}>{d}</CalDayHeader>)}
        {cells.map((cell, i) => (
          <CalDay
            key={i}
            $dark={dark}
            $today={isToday(cell)}
            $selected={isSelected(cell)}
            $other={cell.other}
            $disabled={!cell.other && isDisabled(cell)}
            $empty={cell.other}
            onClick={() => selectDay(cell)}
          >
            {cell.day}
          </CalDay>
        ))}
      </CalGrid>

      <TimePicker $dark={dark}>
        <TimeCol>
          <TimeBtn $dark={dark} onClick={() => changeHour(1)}>▲</TimeBtn>
          <TimeVal $dark={dark}>{String(hour).padStart(2, '0')}</TimeVal>
          <TimeBtn $dark={dark} onClick={() => changeHour(-1)}>▼</TimeBtn>
        </TimeCol>
        <TimeSep $dark={dark}>:</TimeSep>
        <TimeCol>
          <TimeBtn $dark={dark} onClick={() => changeMinute(5)}>▲</TimeBtn>
          <TimeVal $dark={dark}>{String(minute).padStart(2, '0')}</TimeVal>
          <TimeBtn $dark={dark} onClick={() => changeMinute(-5)}>▼</TimeBtn>
        </TimeCol>
      </TimePicker>

      <CalFooterRow $dark={dark}>
        <CalFooterBtn $dark={dark} onClick={() => { setPending(null); onChange(null); onClose(); }}>
          Limpar
        </CalFooterBtn>
        <CalFooterBtn $dark={dark} onClick={() => {
          const n = new Date();
          setViewYear(n.getFullYear()); setViewMonth(n.getMonth());
          setHour(n.getHours()); setMinute(n.getMinutes());
          setPending(new Date(n.getFullYear(), n.getMonth(), n.getDate(), n.getHours(), n.getMinutes()));
        }}>Hoje</CalFooterBtn>
        <CalConfirmBtn $dark={dark} onClick={confirmAndClose} disabled={!pending} title="Confirmar data selecionada">
          <i className="pi pi-check" style={{ fontSize: '0.75rem' }} />
          OK
        </CalConfirmBtn>
      </CalFooterRow>
    </PickerPortal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DateRangeInputs({ darkMode, startDate, setStartDate, endDate, setEndDate }) {
  const [open, setOpen] = useState(false);
  const [startRaw, setStartRaw] = useState(startDate ? formatDate(startDate) : '');
  const [endRaw, setEndRaw] = useState(endDate ? formatDate(endDate) : '');
  const [startErr, setStartErr] = useState('');
  const [endErr, setEndErr] = useState('');
  const [draftStart, setDraftStart] = useState(startDate || null);
  const [draftEnd, setDraftEnd] = useState(endDate || null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startBtnRef = useRef(null);
  const endBtnRef = useRef(null);

  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  useEffect(() => { if (!startDate) { setStartRaw(''); setDraftStart(null); } }, [startDate]);
  useEffect(() => { if (!endDate) { setEndRaw(''); setDraftEnd(null); } }, [endDate]);

  const canApply = draftStart && draftEnd && !startErr && !endErr;

  const handleApply = () => {
    if (!canApply) return;
    setStartDate(draftStart);
    setEndDate(draftEnd);
    setOpen(false);
  };

  const handleStartChange = (e) => {
    const masked = applyMask(e.target.value);
    setStartRaw(masked);
    setStartErr('');
    if (masked.length === 16) {
      const d = parseInput(masked);
      if (!d) { setStartErr('Data inválida'); setDraftStart(null); return; }
      const err = validateDate(d, null, 'start');
      if (err) { setStartErr(err); setDraftStart(null); return; }
      setDraftStart(d);
      if (draftEnd && d > draftEnd) { setDraftEnd(null); setEndRaw(''); }
    } else {
      setDraftStart(null);
    }
  };

  const handleEndChange = (e) => {
    const masked = applyMask(e.target.value);
    setEndRaw(masked);
    setEndErr('');
    if (masked.length === 16) {
      const d = parseInput(masked);
      if (!d) { setEndErr('Data inválida'); setDraftEnd(null); return; }
      const err = validateDate(d, draftStart, 'end');
      if (err) { setEndErr(err); setDraftEnd(null); return; }
      setDraftEnd(d);
    } else {
      setDraftEnd(null);
    }
  };

  const handlePickStart = useCallback((val) => {
    if (!val) { setDraftStart(null); setStartRaw(''); setStartErr(''); return; }
    const err = validateDate(val, null, 'start');
    if (err) { setStartErr(err); return; }
    setStartErr('');
    setStartRaw(formatDate(val));
    setDraftStart(val);
    if (draftEnd && val > draftEnd) { setDraftEnd(null); setEndRaw(''); }
  }, [draftEnd]);

  const handlePickEnd = useCallback((val) => {
    if (!val) { setDraftEnd(null); setEndRaw(''); setEndErr(''); return; }
    const err = validateDate(val, draftStart, 'end');
    if (err) { setEndErr(err); return; }
    setEndErr('');
    setEndRaw(formatDate(val));
    setDraftEnd(val);
  }, [draftStart]);

  const duration = calcDuration(startDate, endDate);
  const summaryText = startDate && endDate
    ? `De ${formatDate(startDate)}  até  ${formatDate(endDate)}`
    : 'Selecionar período';

  return (
    <Wrapper>
      <SummaryButton
        type="button"
        $dark={darkMode}
        $empty={!startDate || !endDate}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <i className={`pi pi-${open ? 'chevron-up' : 'calendar'}`} style={{ fontSize: '0.9rem', opacity: 0.7 }} />
        {summaryText}
        {duration && <DurationBadge $dark={darkMode}>{duration}</DurationBadge>}
      </SummaryButton>

      {open && (
        <Panel $dark={darkMode}>
          <Row>
            {/* ── Início ── */}
            <FieldGroup>
              <FieldLabel $dark={darkMode}>Início</FieldLabel>
              <InputRow>
                <DateInput
                  $dark={darkMode}
                  $invalid={!!startErr}
                  value={startRaw}
                  onChange={handleStartChange}
                  placeholder="DD/MM/AAAA HH:MM"
                  maxLength={16}
                  inputMode="numeric"
                  autoFocus
                />
                <CalBtn
                  type="button"
                  ref={startBtnRef}
                  onClick={() => { setShowEndPicker(false); setShowStartPicker(v => !v); }}
                  title="Abrir calendário"
                >
                  <i className="pi pi-calendar" style={{ fontSize: '0.95rem' }} />
                </CalBtn>
              </InputRow>
              {startErr && <ErrorText>{startErr}</ErrorText>}
            </FieldGroup>

            {/* ── Fim ── */}
            <FieldGroup>
              <FieldLabel $dark={darkMode}>Fim</FieldLabel>
              <InputRow>
                <DateInput
                  $dark={darkMode}
                  $invalid={!!endErr}
                  value={endRaw}
                  onChange={handleEndChange}
                  placeholder="DD/MM/AAAA HH:MM"
                  maxLength={16}
                  inputMode="numeric"
                />
                <CalBtn
                  type="button"
                  ref={endBtnRef}
                  onClick={() => { setShowStartPicker(false); setShowEndPicker(v => !v); }}
                  title="Abrir calendário"
                >
                  <i className="pi pi-calendar" style={{ fontSize: '0.95rem' }} />
                </CalBtn>
              </InputRow>
              {endErr && <ErrorText>{endErr}</ErrorText>}
            </FieldGroup>
          </Row>

          <FooterRow>
            <HintText $dark={darkMode}>
              Digite a data ou selecione no calendário e confirme em OK · máximo 6 meses atrás
            </HintText>
            <ApplyButton type="button" onClick={handleApply} disabled={!canApply}>
              <i className="pi pi-check" style={{ fontSize: '0.8rem' }} />
              Aplicar
            </ApplyButton>
          </FooterRow>
        </Panel>
      )}

      {/* Pickers renderizados fora do fluxo, posicionados via fixed */}
      {showStartPicker && (
        <MiniCalendar
          dark={darkMode}
          value={draftStart}
          onChange={handlePickStart}
          minDate={sixMonthsAgo}
          maxDate={today}
          anchorRef={startBtnRef}
          onClose={() => setShowStartPicker(false)}
        />
      )}
      {showEndPicker && (
        <MiniCalendar
          dark={darkMode}
          value={draftEnd}
          onChange={handlePickEnd}
          minDate={draftStart || sixMonthsAgo}
          maxDate={today}
          anchorRef={endBtnRef}
          onClose={() => setShowEndPicker(false)}
        />
      )}
    </Wrapper>
  );
}
