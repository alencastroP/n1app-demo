// components/SingleDatePicker.jsx
// Input de data única (DD/MM/AAAA) com calendário em portal — mesmo design do
// MiniCalendar usado no formulário de Extração de Changelog, mas sem time picker.

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import styled from 'styled-components';

// ─── Styled ──────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: stretch;
  max-width: ${({ $maxWidth }) => $maxWidth || 'none'};
`;

const DateInput = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 40px;
  border-radius: 0.6rem;
  border: 1px solid ${({ $dark, $invalid }) => $invalid ? '#f87171' : $dark ? '#3b2960' : '#d8caef'};
  background: ${({ $dark }) => ($dark ? '#291b45' : '#ffffff')};
  color: ${({ $dark }) => ($dark ? '#f5efff' : '#24134a')};
  padding: 0.5rem 0.75rem;
  font-size: 0.93rem;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.04em;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &::placeholder { color: ${({ $dark }) => ($dark ? '#a996cb' : '#9f8abd')}; font-family: inherit; letter-spacing: normal; }
  &:focus { outline: none; border-color: #8f6de0; box-shadow: 0 0 0 3px rgba(143,109,224,.18); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
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
  &:hover:not(:disabled) { filter: brightness(1.12); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

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

const RE_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function parseInput(str) {
  const m = String(str || '').trim().match(RE_DATE);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(date) {
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function applyMask(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) out += '/';
    out += digits[i];
  }
  return out;
}

function stripTime(d) {
  return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
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
  const [pending, setPending] = useState(value || null);
  const [pos, setPos] = useState(null);
  const pickerRef = useRef(null);

  useLayoutEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const W = 272;
    const H = 290;
    const gap = 6;
    let left = rect.left;
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (left < 8) left = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > H ? rect.bottom + gap : rect.top - H - gap;
    setPos({ top: Math.max(8, top), left });
  }, [anchorRef]);

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

  const isDisabled = (cell) => {
    const d = new Date(cell.year, cell.month, cell.day);
    if (minDate && d < stripTime(minDate)) return true;
    if (maxDate && d > stripTime(maxDate)) return true;
    return false;
  };

  const isToday = (cell) =>
    !cell.other &&
    cell.day === today.getDate() &&
    cell.month === today.getMonth() &&
    cell.year === today.getFullYear();

  const isSelected = (cell) =>
    !!pending && !cell.other &&
    cell.day === pending.getDate() &&
    cell.month === pending.getMonth() &&
    cell.year === pending.getFullYear();

  const selectDay = (cell) => {
    if (cell.other) return;
    if (isDisabled(cell)) return;
    setPending(new Date(cell.year, cell.month, cell.day));
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

      <CalFooterRow $dark={dark}>
        <CalFooterBtn $dark={dark} onClick={() => { setPending(null); onChange(null); onClose(); }}>
          Limpar
        </CalFooterBtn>
        <CalFooterBtn $dark={dark} onClick={() => {
          const n = new Date();
          setViewYear(n.getFullYear()); setViewMonth(n.getMonth());
          setPending(new Date(n.getFullYear(), n.getMonth(), n.getDate()));
        }}>Hoje</CalFooterBtn>
        <CalConfirmBtn $dark={dark} onClick={confirmAndClose} disabled={!pending}>
          <i className="pi pi-check" style={{ fontSize: '0.75rem' }} />
          OK
        </CalConfirmBtn>
      </CalFooterRow>
    </PickerPortal>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
/**
 * Date-only picker.
 * @param {Date|null} value
 * @param {(d: Date|null) => void} onChange
 */
export default function SingleDatePicker({
  value,
  onChange,
  darkMode = false,
  placeholder = 'DD/MM/AAAA',
  minDate,
  maxDate,
  disabled = false,
  maxWidth,
}) {
  const [raw, setRaw] = useState(value ? formatDate(value) : '');
  const [err, setErr] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const calBtnRef = useRef(null);

  useEffect(() => {
    setRaw(value ? formatDate(value) : '');
    setErr('');
  }, [value]);

  const validate = (d) => {
    if (!d) return 'Data inválida';
    const day = stripTime(d);
    if (minDate && day < stripTime(minDate)) return `Mínimo: ${formatDate(minDate)}`;
    if (maxDate && day > stripTime(maxDate)) return `Máximo: ${formatDate(maxDate)}`;
    return '';
  };

  const handleChange = (e) => {
    const masked = applyMask(e.target.value);
    setRaw(masked);
    setErr('');
    if (masked.length === 10) {
      const d = parseInput(masked);
      const v = validate(d);
      if (v) { setErr(v); return; }
      onChange(d);
    } else if (masked.length === 0) {
      onChange(null);
    }
  };

  const handlePick = (d) => {
    if (!d) { onChange(null); setRaw(''); setErr(''); return; }
    const v = validate(d);
    if (v) { setErr(v); return; }
    setErr('');
    setRaw(formatDate(d));
    onChange(d);
  };

  return (
    <>
      <Wrapper $maxWidth={maxWidth}>
        <DateInput
          $dark={darkMode}
          $invalid={!!err}
          value={raw}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={10}
          inputMode="numeric"
          disabled={disabled}
        />
        <CalBtn
          type="button"
          ref={calBtnRef}
          onClick={() => setShowPicker(v => !v)}
          disabled={disabled}
          title="Abrir calendário"
        >
          <i className="pi pi-calendar" style={{ fontSize: '0.95rem' }} />
        </CalBtn>
      </Wrapper>

      {err && (
        <p style={{ fontSize: '0.78rem', color: '#ef4444', margin: '0.3rem 0 0' }}>
          {err}
        </p>
      )}

      {showPicker && (
        <MiniCalendar
          dark={darkMode}
          value={value}
          onChange={handlePick}
          minDate={minDate}
          maxDate={maxDate}
          anchorRef={calBtnRef}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
