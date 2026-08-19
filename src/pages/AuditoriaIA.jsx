import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS } from '../config/teamsConfig';
import DateRangeInputs from '../components/changelog/DateRangeInputs';
import { executeAuditoriaJob, marcarAuditado } from '../services/auditoriaIAService';
import { Button } from '../design-system/components/Button';
import { Switch } from '../design-system/components/Switch';
import { Tag } from '../design-system/components/Tag';
import { Input } from '../design-system/components/Input';
import ServiceHeader from '../components/ServiceHeader';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const Page = styled.div`
  min-height: 100vh;
  padding: 1.4rem 1.2rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

/* Faixa que alinha o botão Voltar à borda esquerda do Card (mesma largura máx.). */
const BackBar = styled.div`
  width: 100%;
  max-width: 1380px;
  margin-bottom: 0.9rem;
`;

/* Voltar à Central N1 — botão ghost/secundário, coerente com a paleta da página. */
const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(196,181,253,.18)' : 'rgba(116,67,246,.16)')};
  background: ${({ $dark }) => ($dark ? 'rgba(76,29,149,.18)' : 'rgba(139,92,246,.06)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#6d28d9')};
  transition: background .15s ease, border-color .15s ease, transform .15s ease;

  &:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(139,92,246,.3)' : 'rgba(139,92,246,.14)')};
    border-color: ${({ $dark }) => ($dark ? 'rgba(216,180,254,.35)' : 'rgba(109,40,217,.3)')};
    transform: translateX(-2px);
  }

  i { font-size: 0.8rem; }
`;

const Card = styled.div`
  width: 100%;
  max-width: 1380px;
  border-radius: 1.2rem;
  overflow: hidden;
  border: 1px solid ${({ $dark }) => ($dark ? '#2d2244' : '#e6def5')};
  background: ${({ $dark }) => ($dark ? '#170c2a' : '#ffffff')};
  box-shadow: ${({ $dark }) =>
    $dark ? '0 16px 34px rgba(0,0,0,0.45)' : '0 14px 32px rgba(87,62,145,0.14)'};
`;

const CardBody = styled.div`
  padding: 1.2rem 1.4rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------
const Section = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
  background: ${({ $dark }) => ($dark ? '#1c1033' : '#fcfaff')};
  border-radius: 1rem;
  padding: 1rem 1.1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
`;

const StepBadge = styled.div`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $done, $dark }) =>
    $done
      ? $dark ? '#22c55e' : '#16a34a'
      : $dark ? 'linear-gradient(135deg,#5b14b8,#6e10a5)' : 'linear-gradient(135deg,#8028ff,#991fe0)'};
  color: #fff;
  box-shadow: 0 2px 6px rgba(116,67,246,0.28);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${({ $dark }) => ($dark ? '#cab4f5' : '#6e4db2')};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#dacdf8' : '#4f2e84')};
`;

const FieldHint = styled.p`
  margin: 0.45rem 0 0;
  font-size: 0.79rem;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
  line-height: 1.55;
`;

// ---------------------------------------------------------------------------
// Banner (flash / info)
// ---------------------------------------------------------------------------
const Banner = styled.div`
  border-radius: 0.75rem;
  padding: 0.65rem 0.9rem;
  font-size: 0.84rem;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: ${({ $type, $dark }) => {
    if ($type === 'success') return $dark ? 'rgba(34,197,94,0.1)'  : '#f0fdf4';
    if ($type === 'warn')    return $dark ? 'rgba(245,158,11,0.1)' : '#fffbeb';
    if ($type === 'error')   return $dark ? 'rgba(239,68,68,0.1)'  : '#fef2f2';
    return $dark ? 'rgba(139,92,246,0.12)' : '#f5f3ff';
  }};
  border: 1px solid ${({ $type, $dark }) => {
    if ($type === 'success') return $dark ? '#22c55e' : '#86efac';
    if ($type === 'warn')    return $dark ? '#f59e0b' : '#fcd34d';
    if ($type === 'error')   return $dark ? '#ef4444' : '#fca5a5';
    return $dark ? '#7c3aed' : '#c4b5fd';
  }};
  color: ${({ $type, $dark }) => {
    if ($type === 'success') return $dark ? '#4ade80' : '#15803d';
    if ($type === 'warn')    return $dark ? '#fbbf24' : '#92400e';
    if ($type === 'error')   return $dark ? '#f87171' : '#dc2626';
    return $dark ? '#c4b5fd' : '#5b21b6';
  }};

  i { flex-shrink: 0; margin-top: 0.1rem; }
`;

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------
const CtaSection = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
  background: ${({ $dark }) => ($dark ? '#1c1033' : '#fcfaff')};
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CtaSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
  min-width: 0;
`;

const CtaHint = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${({ $dark }) => ($dark ? '#ad9bce' : '#7f69ab')};
`;

const ExecButton = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.88rem;
  font-weight: 700;
  transition: filter 0.15s, transform 0.1s;
  background: ${({ disabled }) =>
    disabled
      ? 'linear-gradient(90deg,#4b3a7a,#3d2d5c)'
      : 'linear-gradient(90deg,#7b3ff2,#9a37eb)'};
  color: ${({ disabled }) => (disabled ? 'rgba(255,255,255,0.35)' : '#fff')};
  box-shadow: ${({ disabled }) =>
    disabled ? 'none' : '0 4px 14px rgba(123,63,242,0.32)'};

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  i { font-size: 0.95rem; }
`;

// ---------------------------------------------------------------------------
// Progress panel
// ---------------------------------------------------------------------------
const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(123,63,242,0.45); }
  70%  { box-shadow: 0 0 0 14px rgba(123,63,242,0); }
  100% { box-shadow: 0 0 0 0 rgba(123,63,242,0); }
`;

const slide = keyframes`
  0%   { left: -42%; }
  100% { left: 100%; }
`;

const ProgressPanel = styled.div`
  border: 1px solid ${({ $dark }) => ($dark ? '#3a2a6a' : '#ddd6fe')};
  background: ${({ $dark }) =>
    $dark
      ? 'linear-gradient(135deg,#1d1140,#241149)'
      : 'linear-gradient(135deg,#faf7ff,#f1eaff)'};
  border-radius: 1rem;
  padding: 1.3rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ProgressTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
`;

const PulseIcon = styled.div`
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7b3ff2, #9a37eb);
  color: #fff;
  font-size: 1.2rem;
  animation: ${pulse} 1.8s infinite;
`;

const ProgressTitle = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#f2ebff' : '#3b2163')};
`;

const ProgressSub = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  color: ${({ $dark }) => ($dark ? '#b8a8d8' : '#6f58a1')};
`;

const ElapsedBadge = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  font-family: monospace;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 0.6rem;
  background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.2)' : 'rgba(123,63,242,0.1)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#7b3ff2')};
  border: 1px solid ${({ $dark }) => ($dark ? '#5b14b8' : '#c4b5fd')};
`;

const Track = styled.div`
  position: relative;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: ${({ $dark }) => ($dark ? '#2a1c47' : '#e9e0fb')};
`;

const Indeterminate = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 42%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(123,63,242,0.2), #9a37eb, rgba(123,63,242,0.2));
  animation: ${slide} 1.5s ease-in-out infinite;
`;

const ProgressNote = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${({ $dark }) => ($dark ? '#9ca3af' : '#7f69ab')};
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
`;

// ---------------------------------------------------------------------------
// Error panel
// ---------------------------------------------------------------------------
const ErrorPanel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  background: ${({ $dark }) => ($dark ? 'rgba(239,68,68,0.1)' : '#fef2f2')};
  border: 1px solid ${({ $dark }) => ($dark ? '#ef4444' : '#fca5a5')};

  > i {
    flex-shrink: 0;
    margin-top: 0.15rem;
    font-size: 1.1rem;
    color: ${({ $dark }) => ($dark ? '#f87171' : '#dc2626')};
  }

  strong {
    display: block;
    font-size: 0.9rem;
    color: ${({ $dark }) => ($dark ? '#fca5a5' : '#b91c1c')};
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.83rem;
    line-height: 1.5;
    color: ${({ $dark }) => ($dark ? '#f0a8a8' : '#dc2626')};
    word-break: break-word;
  }
`;

// ---------------------------------------------------------------------------
// LoadBtn (ações secundárias)
// ---------------------------------------------------------------------------
const LoadBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border-radius: 0.65rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  border: 1px solid ${({ $dark }) => ($dark ? '#5b14b8' : '#c4b5fd')};
  background: ${({ $dark }) =>
    $dark ? 'rgba(91,20,184,0.15)' : 'rgba(123,63,242,0.07)'};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#7b3ff2')};
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: ${({ $dark }) =>
      $dark ? 'rgba(91,20,184,0.25)' : 'rgba(123,63,242,0.13)'};
  }

  i { font-size: 0.82rem; }
`;

// ---------------------------------------------------------------------------
// Dropdown estilizado para dark mode
// ---------------------------------------------------------------------------
const PeriodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
`;

const PeriodOption = styled.button`
  padding: 0.6rem 0.85rem;
  border-radius: 0.65rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  border: 1px solid ${({ $active, $dark }) => $active ? '#7b3ff2' : $dark ? '#3b2960' : '#d8caef'};
  background: ${({ $active, $dark }) => $active ? ($dark ? 'rgba(123,63,242,0.22)' : 'rgba(123,63,242,0.10)') : ($dark ? '#1a0e2e' : '#fff')};
  color: ${({ $active, $dark }) => $active ? ($dark ? '#e0d5ff' : '#5b21b6') : ($dark ? '#c4b5fd' : '#5b21b6')};
  &:hover { border-color: #8f6de0; }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
`;

const StyledDropdown = styled(Dropdown)`
  && {
    width: 100%;
    border-radius: 0.65rem !important;
    border: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')} !important;
    background: ${({ $dark }) => ($dark ? '#291b45' : '#ffffff')} !important;
    color: ${({ $dark }) => ($dark ? '#f5efff' : '#24134a')} !important;
    min-height: 42px;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover { border-color: #8f6de0 !important; }
    &.p-focus { border-color: #8f6de0 !important; box-shadow: 0 0 0 3px rgba(143,109,224,.18) !important; }

    .p-dropdown-label {
      color: ${({ $dark }) => ($dark ? '#f5efff' : '#24134a')} !important;
      padding: 0.6rem 0.85rem !important;
      font-size: 0.9rem !important;
    }

    .p-dropdown-trigger {
      color: ${({ $dark }) => ($dark ? '#b8a8d8' : '#7f69ab')} !important;
    }
  }
`;

// ---------------------------------------------------------------------------
// Tabela de resultados
// ---------------------------------------------------------------------------
const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
  border-radius: 1rem;
  background: ${({ $dark }) => ($dark ? '#170c2a' : '#ffffff')};

  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${({ $dark }) => ($dark ? '#3b2960' : '#d8caef')};
    border-radius: 3px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
`;

const Thead = styled.thead``;

const Th = styled.th`
  padding: 0.65rem 0.85rem;
  text-align: left;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: ${({ $dark }) => ($dark ? '#1d1133' : '#f5f0ff')};
  color: ${({ $dark }) => ($dark ? '#cab4f5' : '#6e4db2')};
  border-bottom: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#e6d9fb')};
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  border-bottom: 1px solid ${({ $dark }) => ($dark ? '#1f1438' : '#f3eeff')};
  background: ${({ $auditado, $dark }) =>
    $auditado
      ? $dark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.06)'
      : 'transparent'};
  transition: background 0.12s;

  &:last-child { border-bottom: none; }

  &:hover {
    background: ${({ $auditado, $dark }) =>
      $auditado
        ? $dark ? 'rgba(34,197,94,0.14)' : 'rgba(34,197,94,0.10)'
        : $dark ? 'rgba(255,255,255,0.03)' : 'rgba(123,63,242,0.04)'};
  }
`;

const Td = styled.td`
  padding: 0.6rem 0.85rem;
  color: ${({ $dark }) => ($dark ? '#e0d6f8' : '#3b2163')};
  vertical-align: middle;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TdActions = styled.td`
  padding: 0.5rem 1rem;
  vertical-align: middle;
  white-space: nowrap;
`;

// Linha de ações com grupos separados por divisores verticais.
const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.1rem;
  flex-wrap: nowrap;
`;

const ActionDivider = styled.span`
  width: 1px;
  height: 24px;
  flex-shrink: 0;
  background: ${({ $dark }) => ($dark ? '#2f2150' : '#e6d9fb')};
`;

// Link do Intercom — ação secundária, ícone discreto com área de clique clara.
const IntercomLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  flex-shrink: 0;
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#7b3ff2')};
  border: 1px solid ${({ $dark }) => ($dark ? '#3b2960' : '#e0d5f5')};
  transition: background 0.15s, border-color 0.15s;
  &:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(123,63,242,0.18)' : 'rgba(123,63,242,0.08)')};
    border-color: #8f6de0;
  }
  i { font-size: 0.9rem; }
`;

// CSAT — estrelas 1 a 5 (preenchidas conforme a nota do Intercom).
const Stars = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 1px;
  white-space: nowrap;
  i { font-size: 0.82rem; }
  i.on  { color: #f59e0b; }
  i.off { color: ${({ $dark }) => ($dark ? '#3b2960' : '#dcd2ef')}; }
`;

const EmptyList = styled.div`
  padding: 2rem;
  text-align: center;
  font-size: 0.83rem;
  color: ${({ $dark }) => ($dark ? '#6b5890' : '#a78bca')};
`;

// Painel expansível de detalhes da linha
const ExpandPanel = styled.td`
  padding: 0;
  border-top: none;
  background: ${({ $dark }) => ($dark ? '#160b29' : '#faf7ff')};
  border-bottom: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
`;

const ExpandPanelInner = styled.div`
  padding: 0.9rem 1.1rem;
  border-top: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#e6d9fb')};
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.65rem 1.1rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const DetailLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ $dark }) => ($dark ? '#8a7bb5' : '#a78bca')};
`;

const DetailValue = styled.span`
  font-size: 0.84rem;
  color: ${({ $dark }) => ($dark ? '#e0d6f8' : '#3b2163')};
  word-break: break-word;
`;

const DetailValuePre = styled.pre`
  margin: 0;
  font-size: 0.78rem;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  max-height: 240px;
  overflow: auto;
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem;
  background: ${({ $dark }) => ($dark ? '#0e0720' : '#f0eaff')};
  color: ${({ $dark }) => ($dark ? '#d4c8f0' : '#3b2163')};
  border: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#ddd6fe')};
`;

// Paginação
const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${({ $dark }) => ($dark ? '#2f2150' : '#eee4fb')};
`;

const PaginationBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  border: 1px solid ${({ $dark }) => ($dark ? '#5b14b8' : '#c4b5fd')};
  background: ${({ $dark }) =>
    $dark ? 'rgba(91,20,184,0.15)' : 'rgba(123,63,242,0.07)'};
  color: ${({ disabled, $dark }) =>
    disabled
      ? $dark ? '#4a3770' : '#c4b5fd'
      : $dark ? '#c4b5fd' : '#7b3ff2'};
  transition: background 0.15s;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    background: ${({ $dark }) =>
      $dark ? 'rgba(91,20,184,0.25)' : 'rgba(123,63,242,0.13)'};
  }
`;

const PaginationInfo = styled.span`
  font-size: 0.83rem;
  font-weight: 600;
  color: ${({ $dark }) => ($dark ? '#b8a8d8' : '#6f58a1')};
  white-space: nowrap;
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
`;

const ResultCount = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b21b6')};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

// ThSortable — header de coluna clicável para sorting client-side
const ThSortable = styled(Th)`
  cursor: pointer;
  user-select: none;
  &:hover { color: ${({ $dark }) => ($dark ? '#e0d5ff' : '#5b21b6')}; }
  i { margin-left: 0.35rem; font-size: 0.7rem; opacity: 0.75; }
`;

// AdvToggle — header colapsável de busca avançada
const AdvToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#b8a8d8' : '#7b3ff2')};
  letter-spacing: 0.02em;
  &:hover { color: ${({ $dark }) => ($dark ? '#e0d5ff' : '#5b21b6')}; }
  i { font-size: 0.8rem; }
`;

const AdvBody = styled.div`
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AdvGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem;
`;

// ---------------------------------------------------------------------------
// Dropdown options
// ---------------------------------------------------------------------------
const ESTADO_OPTIONS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Encerrado pela IA', value: 'encerrado_ia' },
  { label: 'Transferido p/ humano', value: 'transferido_humano' },
];

const PERIOD_OPTIONS = [
  { value: 'today',  label: 'Hoje' },
  { value: '7d',     label: 'Últimos 7 dias' },
  { value: '30d',    label: 'Último mês' },
  { value: '90d',    label: 'Últimos 3 meses' },
  { value: '6m',     label: 'Últimos 6 meses' },
  { value: 'custom', label: 'Data personalizada' },
];

// ---------------------------------------------------------------------------
// Colunas fixas da tabela (subset exibido — dados completos ficam no JSON)
// ---------------------------------------------------------------------------
const FIXED_COLUMNS = [
  { key: 'Data',           label: 'Data',     sortable: true,  format: 'date' },
  { key: 'Nome do cliente', label: 'Contato', sortable: true  },
  { key: 'Nome da empresa', label: 'Empresa', sortable: true  },
  { key: 'Escalado',       label: 'Escalado', sortable: false },
  { key: 'Rating',         label: 'CSAT',     sortable: true,  format: 'csat' },
];

// Itens por página na tabela de resultados
const PAGE_SIZE = 15;

// Lê o rating cru (número 1-5) ou null quando não avaliado ("Sem avaliação"/vazio).
function parseCsat(val) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Formata uma data ISO para "dd/mm/aaaa hh:mm". Retorna o valor cru se não parsear.
function formatDateBR(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
}

function renderCellValue(val, format) {
  if (format === 'date') return formatDateBR(val);
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  if (typeof val === 'object') {
    const str = JSON.stringify(val);
    return str.length > 60 ? str.slice(0, 57) + '…' : str;
  }
  return String(val);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AuditoriaIA() {
  const { darkMode: $dark } = useDarkMode();
  const { canService } = useUserProfile();
  const navigate = useNavigate();

  // Filtros
  const [periodo, setPeriodo] = useState('30d');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [estado, setEstado] = useState('todos');

  // Busca avançada
  const [conversationId, setConversationId] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [advOpen, setAdvOpen] = useState(false);

  // Sorting client-side
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Estado da máquina
  const [phase, setPhase] = useState('form'); // 'form' | 'searching' | 'done' | 'error'

  // Resultados
  const [resultados, setResultados] = useState([]);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [auditados, setAuditados] = useState(() => new Set());
  const [lastSearchHash, setLastSearchHash] = useState('');

  const toastRef = useRef(null);

  // Cronômetro (roda enquanto searching)
  useEffect(() => {
    if (phase !== 'searching') return undefined;
    setElapsed(0);
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Helper: resolve preset → { inicio, fim } como objetos Date
  const resolvePeriodo = () => {
    const fim = new Date();
    if (periodo === 'custom') return { inicio: startDate, fim: endDate };
    const inicio = new Date();
    if (periodo === 'today') inicio.setHours(0, 0, 0, 0); // do início do dia até agora
    if (periodo === '7d')  inicio.setDate(inicio.getDate() - 7);
    if (periodo === '30d') inicio.setMonth(inicio.getMonth() - 1);
    if (periodo === '90d') inicio.setMonth(inicio.getMonth() - 3);
    if (periodo === '6m')  inicio.setMonth(inicio.getMonth() - 6);
    return { inicio, fim };
  };

  // Hash dos filtros atuais (sorting client-side não entra — não requer nova busca)
  const currentHash = useMemo(
    () =>
      JSON.stringify({
        periodo,
        s: periodo === 'custom' ? startDate?.toISOString() : null,
        e: periodo === 'custom' ? endDate?.toISOString() : null,
        estado,
        conversationId: conversationId.trim(),
        clienteNome: clienteNome.trim(),
        clienteId: clienteId.trim(),
      }),
    [periodo, startDate, endDate, estado, conversationId, clienteNome, clienteId]
  );

  // Dados ordenados (sorting client-side; não muta resultados original).
  // Declarado antes do guard de acesso para não violar as regras de Hooks.
  const sortedResultados = useMemo(() => {
    if (!sortField || resultados.length === 0) return resultados;
    const copy = [...resultados];
    const dir = sortDir === 'asc' ? 1 : -1;
    const isCsat = sortField === 'Rating';
    copy.sort((a, b) => {
      // CSAT ordena pela nota numérica (não-avaliados contam como vazios).
      const av = isCsat ? parseCsat(a[sortField]) : a[sortField];
      const bv = isCsat ? parseCsat(b[sortField]) : b[sortField];
      // Vazios sempre por último, independente da direção.
      const aEmpty = av === null || av === undefined || av === '';
      const bEmpty = bv === null || bv === undefined || bv === '';
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv), 'pt-BR');
      }
      return cmp * dir;
    });
    return copy;
  }, [resultados, sortField, sortDir]);

  // Paginação client-side — todos declarados antes do guard de acesso.
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedResultados.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedResultados.slice(start, start + PAGE_SIZE);
  }, [sortedResultados, page]);

  // Resetar para página 1 quando o sort muda
  useEffect(() => {
    setPage(1);
  }, [sortField, sortDir]);

  // Clamp: se a página atual exceder o total (ex.: nova busca com menos resultados)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Linhas expandidas (set de convId)
  const [expanded, setExpanded] = useState(() => new Set());

  const toggleExpand = (convId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) {
        next.delete(convId);
      } else {
        next.add(convId);
      }
      return next;
    });
  };

  // Acesso restrito
  if (!canService(SERVICE_KEYS.AUDITORIA_IA)) {
    return (
      <Page>
        <Card $dark={$dark} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <i
            className="pi pi-lock"
            style={{
              fontSize: '2.5rem',
              color: $dark ? '#f87171' : '#dc2626',
              display: 'block',
              marginBottom: '1rem',
            }}
          />
          <h3 style={{ margin: '0 0 0.5rem', color: $dark ? '#efeaff' : '#1E0C45' }}>
            Acesso restrito
          </h3>
          <p style={{ margin: 0, color: $dark ? '#9ca3af' : '#6b7280', fontSize: '0.9rem' }}>
            Você não tem permissão para acessar este módulo.
          </p>
        </Card>
      </Page>
    );
  }

  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const temFiltroEspecifico = !!(conversationId.trim() || clienteNome.trim() || clienteId.trim());
  const periodoValido = temFiltroEspecifico || periodo !== 'custom' || (!!startDate && !!endDate);
  const canSearch = periodoValido && phase !== 'searching' && currentHash !== lastSearchHash;

  // Handler de sorting client-side
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ── Ação de busca ─────────────────────────────────────────────────────────
  const handleBuscar = async () => {
    setPhase('searching');
    setResultados([]);
    setTotal(0);
    setErrorMsg('');
    setSortField(null);
    setSortDir('asc');

    const cid   = conversationId.trim();
    const cnome = clienteNome.trim();
    const cliid = clienteId.trim();

    const payload = { estado };
    if (cid)   payload.conversationId = cid;
    if (cnome) payload.clienteNome    = cnome;
    if (cliid) payload.clienteId      = cliid;
    // Período: na busca direta por ID de conversa, ignoramos datas (traz aquele
    // chat). Para cliente (nome/id) o período ainda é enviado de propósito —
    // permite combinar "conversas do cliente X no período Y". O backend trata
    // datas como opcionais quando há qualquer filtro específico.
    if (!cid) {
      const { inicio, fim } = resolvePeriodo();
      if (inicio && fim) {
        payload.dataInicio = inicio.toISOString();
        payload.dataFim    = fim.toISOString();
      }
    }

    try {
      const completed = await executeAuditoriaJob(payload, { onProgress: () => {} });
      setResultados(completed.resultados ?? []);
      setTotal(completed.total ?? (completed.resultados?.length ?? 0));
      setLastSearchHash(currentHash);
      setAuditados(new Set());
      setExpanded(new Set());
      setPage(1);
      setPhase('done');
    } catch (err) {
      setErrorMsg(err.message);
      // Não fixa o hash: assim "Tentar novamente" reabilita a busca mesmo sem
      // mudança de filtro (a busca anterior falhou).
      setLastSearchHash('');
      setPhase('error');
    }
  };

  // ── Marcar como auditado ──────────────────────────────────────────────────
  const handleAuditar = async (convId) => {
    if (!convId) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Sem ID',
        detail: 'Item sem "Id da conversa".',
      });
      return;
    }
    try {
      await marcarAuditado(convId);
      setAuditados((prev) => {
        const n = new Set(prev);
        n.add(convId);
        return n;
      });
      toastRef.current?.show({
        severity: 'success',
        summary: 'Auditado',
        detail: `Conversa ${convId} marcada no Intercom.`,
      });
    } catch (err) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Falha ao auditar',
        detail: err.message,
      });
    }
  };

  // ── Download individual ───────────────────────────────────────────────────
  const handleDownload = (item, idx) => {
    const id = item['Id da conversa'] ?? item.id ?? idx;
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Page>
      <Toast ref={toastRef} />

      <BackBar>
        <BackBtn
          $dark={$dark}
          onClick={() => navigate('/central-n1')}
          title="Voltar à Central N1"
        >
          <i className="pi pi-arrow-left" />
          Voltar à Central N1
        </BackBtn>
      </BackBar>

      <Card $dark={$dark}>
        {/* ── Header ── */}
        <ServiceHeader
          variant="band"
          platforms={['cloudhuman', 'intercom']}
          title="Auditoria de IA (CloudHuman)"
          subtitle="Audite as conversas geradas por IA e marque as revisadas no Intercom."
        />

        <CardBody>
          {/* ── Seção: Filtros ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge
                $done={periodoValido}
                $dark={$dark}
              >
                {periodoValido ? (
                  <i className="pi pi-check" style={{ fontSize: '0.68rem' }} />
                ) : (
                  '1'
                )}
              </StepBadge>
              <SectionTitle $dark={$dark}>Período da Auditoria</SectionTitle>
            </SectionHeader>

            <Field>
              <Label $dark={$dark}>Selecione o período *</Label>
              <PeriodGrid>
                {PERIOD_OPTIONS.map((opt) => (
                  <PeriodOption
                    key={opt.value}
                    type="button"
                    $active={periodo === opt.value}
                    $dark={$dark}
                    onClick={() => setPeriodo(opt.value)}
                  >
                    {opt.label}
                  </PeriodOption>
                ))}
              </PeriodGrid>

              {periodo === 'custom' && (
                <DateRangeInputs
                  darkMode={$dark}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                />
              )}

              <FieldHint $dark={$dark}>
                {periodo === 'custom'
                  ? 'Informe as datas de início e fim para filtrar as conversas da IA.'
                  : 'O período selecionado será calculado a partir de hoje no momento da busca.'}
              </FieldHint>
            </Field>
          </Section>

          {/* ── Seção: Filtros ── */}
          <Section $dark={$dark}>
            <SectionHeader>
              <StepBadge $done $dark={$dark}>
                <i className="pi pi-check" style={{ fontSize: '0.68rem' }} />
              </StepBadge>
              <SectionTitle $dark={$dark}>Filtros</SectionTitle>
            </SectionHeader>

            <FiltersGrid>
              <Field>
                <Label $dark={$dark}>Estado da conversa</Label>
                <StyledDropdown
                  $dark={$dark}
                  value={estado}
                  options={ESTADO_OPTIONS}
                  onChange={(e) => setEstado(e.value)}
                  placeholder="Selecione…"
                  panelClassName={$dark ? 'auditoria-dd-panel-dark' : ''}
                />
              </Field>
            </FiltersGrid>

            <FieldHint $dark={$dark} style={{ marginTop: '0.5rem' }}>
              Filtro aplicado no servidor. Ordenação está disponível clicando nos cabeçalhos da tabela de resultados.
            </FieldHint>

            {/* Busca avançada colapsável */}
            <div style={{ marginTop: '0.9rem', borderTop: `1px solid ${$dark ? '#2f2150' : '#eee4fb'}`, paddingTop: '0.8rem' }}>
              <AdvToggleBtn
                type="button"
                $dark={$dark}
                onClick={() => setAdvOpen((v) => !v)}
                aria-expanded={advOpen}
              >
                <i className={advOpen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'} />
                Busca avançada (opcional)
              </AdvToggleBtn>

              {advOpen && (
                <AdvBody>
                  <FieldHint $dark={$dark}>
                    Preencha para uma busca direta. Com ID da conversa, o período é ignorado.
                  </FieldHint>
                  <AdvGrid>
                    <Input
                      label="ID da conversa (Intercom)"
                      placeholder="Ex: 12345678"
                      value={conversationId}
                      onChange={(e) => setConversationId(e.target.value)}
                    />
                    <Input
                      label="Nome do cliente"
                      placeholder="Ex: João Silva"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                    />
                    <Input
                      label="ID do cliente (Partners)"
                      placeholder="Ex: 987654"
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                    />
                  </AdvGrid>
                </AdvBody>
              )}
            </div>
          </Section>

          {/* ── Processando ── */}
          {phase === 'searching' && (
            <ProgressPanel $dark={$dark}>
              <ProgressTop>
                <PulseIcon>
                  <i className="pi pi-verified" />
                </PulseIcon>
                <div style={{ minWidth: 0 }}>
                  <ProgressTitle $dark={$dark}>Processando a auditoria…</ProgressTitle>
                  <ProgressSub $dark={$dark}>
                    Coletando e classificando as conversas do CloudHuman.
                  </ProgressSub>
                </div>
                <ElapsedBadge $dark={$dark}>{elapsedLabel}</ElapsedBadge>
              </ProgressTop>

              <Track $dark={$dark}>
                <Indeterminate />
              </Track>

              <ProgressNote $dark={$dark}>
                <i className="pi pi-info-circle" style={{ marginTop: '0.1rem' }} />
                <span>
                  Mantenha esta aba aberta. O processamento ocorre no servidor e retorna automaticamente — não é preciso atualizar a página.
                </span>
              </ProgressNote>
            </ProgressPanel>
          )}

          {/* ── Erro ── */}
          {phase === 'error' && (
            <ErrorPanel $dark={$dark}>
              <i className="pi pi-exclamation-triangle" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>Não foi possível concluir a auditoria</strong>
                <p>{errorMsg}</p>
              </div>
              <LoadBtn
                $dark={$dark}
                type="button"
                onClick={handleBuscar}
                style={{ flexShrink: 0, alignSelf: 'center' }}
              >
                <i className="pi pi-refresh" /> Tentar novamente
              </LoadBtn>
            </ErrorPanel>
          )}

          {/* ── CTA de busca (visível em 'form' e 'done') ── */}
          {(phase === 'form' || phase === 'done') && (
            <CtaSection $dark={$dark}>
              <CtaSummary>
                <CtaHint $dark={$dark}>
                  {!periodoValido
                    ? 'Informe as datas de início e fim para habilitar a busca.'
                    : !canSearch
                    ? 'Resultados atuais. Altere algum filtro para nova busca.'
                    : 'Pronto para buscar as conversas da IA no período selecionado.'}
                </CtaHint>
              </CtaSummary>

              <ExecButton
                disabled={!canSearch}
                onClick={canSearch ? handleBuscar : undefined}
                type="button"
              >
                <i className="pi pi-search" /> Buscar
              </ExecButton>
            </CtaSection>
          )}

          {/* ── Resultados ── */}
          {phase === 'done' && (
            <div>
              <ResultHeader>
                <ResultCount $dark={$dark}>
                  <i className="pi pi-list" style={{ color: $dark ? '#7b3ff2' : '#7b3ff2' }} />
                  {total} {total === 1 ? 'conversa auditável' : 'conversas auditáveis'}
                </ResultCount>
                {auditados.size > 0 && (
                  <Banner $type="success" $dark={$dark} style={{ flex: '0 0 auto' }}>
                    <i className="pi pi-check-circle" />
                    <span>{auditados.size} marcada{auditados.size !== 1 ? 's' : ''} como auditada{auditados.size !== 1 ? 's' : ''} nesta sessão</span>
                  </Banner>
                )}
              </ResultHeader>

              <TableWrap $dark={$dark}>
                {sortedResultados.length === 0 ? (
                  <EmptyList $dark={$dark}>
                    <i className="pi pi-inbox" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }} />
                    Nenhuma conversa encontrada para os filtros selecionados.
                  </EmptyList>
                ) : (
                  <>
                    <Table>
                      <Thead>
                        <tr>
                          <Th $dark={$dark} style={{ width: '1%' }} />
                          <Th $dark={$dark} style={{ textAlign: 'right', width: '1%' }}>
                            #
                          </Th>
                          {FIXED_COLUMNS.map((col) =>
                            col.sortable ? (
                              <ThSortable
                                key={col.key}
                                $dark={$dark}
                                onClick={() => handleSort(col.key)}
                                title={`Ordenar por ${col.label}`}
                              >
                                {col.label}
                                <i
                                  className={
                                    sortField === col.key
                                      ? sortDir === 'asc'
                                        ? 'pi pi-sort-amount-up-alt'
                                        : 'pi pi-sort-amount-down'
                                      : 'pi pi-sort-alt'
                                  }
                                />
                              </ThSortable>
                            ) : (
                              <Th key={col.key} $dark={$dark}>
                                {col.label}
                              </Th>
                            )
                          )}
                          <Th $dark={$dark} style={{ textAlign: 'center' }}>
                            Ações
                          </Th>
                        </tr>
                      </Thead>
                      <Tbody>
                        {pageItems.map((item, idx) => {
                          const globalIdx = (page - 1) * PAGE_SIZE + idx + 1;
                          const convId = item['Id da conversa'] ?? item.id;
                          const isAuditado = auditados.has(convId);
                          const isExpanded = expanded.has(convId);
                          const intercomUrl = item['URL Intercom'] ?? item['URL'];

                          // Campos do painel expansível (só os presentes no item)
                          const expandFields = [
                            { key: 'Título da conversa (IA)', label: 'Título (IA)', type: 'text' },
                            { key: 'Tópicos',                 label: 'Tópicos',     type: 'topics' },
                            { key: 'Teve ticket',             label: 'Teve ticket', type: 'text' },
                            { key: 'Rating Remark',           label: 'Comentário do CSAT', type: 'text' },
                            { key: 'Resumo IA',               label: 'Resumo IA',   type: 'text' },
                            { key: 'Conversa limpa',          label: 'Conversa limpa', type: 'pre' },
                            { key: 'Nome do cliente',         label: 'Nome do cliente', type: 'text' },
                            { key: 'Email do cliente',        label: 'Email',        type: 'text' },
                            { key: 'ID da empresa',           label: 'ID da empresa', type: 'text' },
                            { key: 'Id da conversa',          label: 'ID da conversa', type: 'text' },
                            { key: 'URL Intercom',            label: 'URL Intercom', type: 'text' },
                          ].filter((f) => item[f.key] !== undefined && item[f.key] !== null && item[f.key] !== '');

                          // colSpan = chevron + # + FIXED_COLUMNS + Ações
                          const colSpan = FIXED_COLUMNS.length + 3;

                          return (
                            <React.Fragment key={`${convId ?? ''}-${idx}`}>
                              <Tr
                                $auditado={isAuditado}
                                $dark={$dark}
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleExpand(convId)}
                              >
                                <Td $dark={$dark} style={{ width: '1%', textAlign: 'center', color: $dark ? '#8a7bb5' : '#a78bca', padding: '0.6rem 0.5rem 0.6rem 0.85rem' }}>
                                  <i className={isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'} style={{ fontSize: '0.72rem' }} />
                                </Td>
                                <Td $dark={$dark} style={{ textAlign: 'right', color: $dark ? '#8a7bb5' : '#a78bca', fontVariantNumeric: 'tabular-nums' }}>
                                  {globalIdx}
                                </Td>
                                {FIXED_COLUMNS.map((col) => {
                                  if (col.format === 'csat') {
                                    const csat = parseCsat(item[col.key]);
                                    return (
                                      <Td key={col.key} $dark={$dark} title={csat ? `${csat} de 5` : 'Sem avaliação'}>
                                        {csat ? (
                                          <Stars $dark={$dark}>
                                            {[1, 2, 3, 4, 5].map((n) => (
                                              <i key={n} className={`pi pi-star-fill ${n <= csat ? 'on' : 'off'}`} />
                                            ))}
                                          </Stars>
                                        ) : (
                                          '—'
                                        )}
                                      </Td>
                                    );
                                  }
                                  return (
                                    <Td key={col.key} $dark={$dark} title={String(item[col.key] ?? '')}>
                                      {renderCellValue(item[col.key], col.format)}
                                    </Td>
                                  );
                                })}
                                <TdActions onClick={(e) => e.stopPropagation()}>
                                  <ActionRow>
                                    {intercomUrl && (
                                      <>
                                        <IntercomLink
                                          $dark={$dark}
                                          href={intercomUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Abrir no Intercom"
                                        >
                                          <i className="pi pi-external-link" />
                                        </IntercomLink>
                                        <ActionDivider $dark={$dark} />
                                      </>
                                    )}

                                    <Button
                                      variant="primary"
                                      size="sm"
                                      icon="pi pi-download"
                                      onClick={() => handleDownload(item, idx)}
                                      title="Baixar JSON desta conversa"
                                    >
                                      Baixar JSON
                                    </Button>

                                    <ActionDivider $dark={$dark} />

                                    {isAuditado ? (
                                      <Tag variant="success" icon="pi pi-check">
                                        Auditado
                                      </Tag>
                                    ) : (
                                      <Switch
                                        label="Auditado?"
                                        checked={false}
                                        onChange={() => handleAuditar(convId)}
                                      />
                                    )}
                                  </ActionRow>
                                </TdActions>
                              </Tr>
                              {isExpanded && (
                                <tr key={`${convId ?? ''}-${idx}-expand`}>
                                  <ExpandPanel $dark={$dark} colSpan={colSpan}>
                                    <ExpandPanelInner $dark={$dark}>
                                      {expandFields.length === 0 ? (
                                        <span style={{ fontSize: '0.82rem', color: $dark ? '#6b5890' : '#a78bca' }}>
                                          Nenhum detalhe adicional disponível.
                                        </span>
                                      ) : (
                                        <DetailGrid>
                                          {expandFields.map((f) => {
                                            const val = item[f.key];
                                            return (
                                              <DetailItem key={f.key}>
                                                <DetailLabel $dark={$dark}>{f.label}</DetailLabel>
                                                {f.type === 'pre' ? (
                                                  <DetailValuePre $dark={$dark}>{String(val)}</DetailValuePre>
                                                ) : f.type === 'topics' ? (
                                                  <DetailValue $dark={$dark}>
                                                    {Array.isArray(val) ? val.join(', ') : renderCellValue(val)}
                                                  </DetailValue>
                                                ) : (
                                                  <DetailValue $dark={$dark}>{renderCellValue(val)}</DetailValue>
                                                )}
                                              </DetailItem>
                                            );
                                          })}
                                        </DetailGrid>
                                      )}
                                    </ExpandPanelInner>
                                  </ExpandPanel>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </Tbody>
                    </Table>
                    {sortedResultados.length > PAGE_SIZE && (
                      <Pagination $dark={$dark}>
                        <PaginationBtn
                          $dark={$dark}
                          disabled={page === 1}
                          onClick={() => setPage((p) => p - 1)}
                          type="button"
                        >
                          <i className="pi pi-chevron-left" /> Anterior
                        </PaginationBtn>
                        <PaginationInfo $dark={$dark}>
                          Página {page} de {totalPages} &nbsp;·&nbsp; {sortedResultados.length} resultado{sortedResultados.length !== 1 ? 's' : ''}
                        </PaginationInfo>
                        <PaginationBtn
                          $dark={$dark}
                          disabled={page === totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          type="button"
                        >
                          Próxima <i className="pi pi-chevron-right" />
                        </PaginationBtn>
                      </Pagination>
                    )}
                  </>
                )}
              </TableWrap>
            </div>
          )}
        </CardBody>
      </Card>
    </Page>
  );
}
