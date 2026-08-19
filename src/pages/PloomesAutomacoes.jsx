import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { useDarkMode } from '../DarkModeContext';
import CredencialCard from '../components/CredencialCard';
import ServiceHeader from '../components/ServiceHeader';
import { getAutomations, exportAutomations, exportAutomationsEditingEntity } from '../services/ploomesAutomacoesApi';
import { fetchFieldsByEntity } from '../services/fieldsExplorerService';
import { validateUserKey } from '../services/apiHubService';

/* ── Constantes ─────────────────────────────────────────────────────── */

// Exibida em ordem alfabética (label).
const ENTITY_OPTIONS = [
  { label: 'Clientes',               value: 1  },
  { label: 'Documentos (CPQ)',       value: 66 },
  { label: 'Negócios',               value: 2  },
  { label: 'Produto da Proposta',    value: 14 },
  { label: 'Produto da Venda',       value: 20 },
  { label: 'Produto de cliente',     value: 75 },
  { label: 'Produtos',               value: 10 },
  { label: 'Propostas (CPQ)',         value: 7  },
  { label: 'Registros de interação', value: 36 },
  { label: 'Sua Empresa',            value: 15 },
  { label: 'Tarefas',                value: 12 },
  { label: 'Vendas (CPQ)',            value: 4  },
];

const ENTITY_LABEL = Object.fromEntries(ENTITY_OPTIONS.map(e => [e.value, e.label]));

const TRIGGER_OPTIONS = [
  { id: 1,  name: 'Negócio entrou neste estágio',                          restrictedEntityId: 2   },
  { id: 2,  name: 'Negócio ganho neste estágio',                           restrictedEntityId: 2   },
  { id: 3,  name: 'Negócio perdido neste estágio',                         restrictedEntityId: 2   },
  { id: 4,  name: 'Negócio reaberto neste estágio',                        restrictedEntityId: 2   },
  { id: 5,  name: 'Quando o item for criado',                              restrictedEntityId: null },
  { id: 6,  name: 'Quando o item for editado',                             restrictedEntityId: null },
  { id: 7,  name: 'Quando o item for excluído',                            restrictedEntityId: null },
  { id: 8,  name: 'Quando o negócio for ganho',                            restrictedEntityId: 2   },
  { id: 9,  name: 'Quando o negócio for perdido',                          restrictedEntityId: 2   },
  { id: 10, name: 'Quando o negócio for reaberto',                         restrictedEntityId: 2   },
  { id: 11, name: 'Quando a tarefa for finalizada',                        restrictedEntityId: 12  },
  { id: 12, name: 'Quando a tarefa for reaberta',                          restrictedEntityId: 12  },
  { id: 13, name: 'Quando a proposta for revisada',                        restrictedEntityId: 7   },
  { id: 14, name: 'Quando a proposta for aprovada ou reprovada',           restrictedEntityId: 7   },
  { id: 17, name: 'Periodicamente',                                        restrictedEntityId: null },
  { id: 18, name: 'Quando o lead for convertido',                          restrictedEntityId: 3   },
  { id: 19, name: 'Quando o lead for descartado',                          restrictedEntityId: 3   },
  { id: 20, name: 'Quando o documento for aprovado ou reprovado',          restrictedEntityId: 66  },
  { id: 21, name: 'Quando a venda for aprovada ou reprovada',              restrictedEntityId: 4   },
  { id: 22, name: 'Quando a venda for aprovada ou reprovada (online)',     restrictedEntityId: 4   },
  { id: 23, name: 'Quando a proposta for aprovada ou reprovada (online)',  restrictedEntityId: 7   },
  { id: 24, name: 'Quando o documento for aprovado ou reprovado (online)', restrictedEntityId: 66  },
  { id: 25, name: 'Negócio editado nesse estágio',                         restrictedEntityId: 2   },
];

const ACTION_OPTIONS = [
  { id: 1,  name: 'Editar dados' },
  { id: 2,  name: 'Alterar estágio do negócio' },
  { id: 3,  name: 'Duplicar negócio em novo estágio' },
  { id: 4,  name: 'Enviar e-mail' },
  { id: 5,  name: 'Criar tarefa' },
  { id: 7,  name: 'Criar negócio' },
  { id: 8,  name: 'Criar registro de interação' },
  { id: 10, name: 'Perder negócio' },
  { id: 11, name: 'Ganhar negócio' },
  { id: 12, name: 'Enviar mensagem de WhatsApp via Neppo' },
  { id: 13, name: 'Finalizar tarefas com observações' },
  { id: 14, name: 'Finalizar tarefas' },
  { id: 15, name: 'Enviar Lead para Meetime' },
  { id: 16, name: 'Criar produto de cliente' },
];

const TYPE_LABELS = {
  1: 'Texto simples', 2: 'Multilinha', 4: 'Inteiro', 5: 'Moeda',
  6: 'Decimal', 7: 'Opções', 8: 'Data', 9: 'Horário',
  10: 'Checkbox', 11: 'CPF', 12: 'CNPJ', 13: '%',
  17: 'Endereço', 18: 'Imagem', 19: 'Anexo', 22: 'Dev',
};

/* ── Animations ─────────────────────────────────────────────────────── */

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.45); }
  50%       { box-shadow: 0 0 0 4px rgba(34,197,94,.0); }
`;

/* ── Estilo dos painéis portados do PrimeReact (Dropdown / MultiSelect) ─ */

const PanelStyles = createGlobalStyle`
  .autom-panel.p-dropdown-panel,
  .autom-panel.p-multiselect-panel {
    background: ${({ $dark }) => ($dark ? '#160a2c' : '#ffffff')};
    border: 1px solid ${({ $dark }) => ($dark ? '#2e1f4a' : '#e4deff')};
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(40,10,80,.28);
    overflow: hidden;
  }
  .autom-panel .p-dropdown-items,
  .autom-panel .p-multiselect-items { padding: 4px; }
  .autom-panel .p-dropdown-item,
  .autom-panel .p-multiselect-item {
    font-size: 0.84rem;
    padding: 0.5rem 0.7rem;
    border-radius: 7px;
    gap: 8px;
    color: ${({ $dark }) => ($dark ? '#e0d6ff' : '#1b103a')};
  }
  .autom-panel .p-dropdown-item:hover,
  .autom-panel .p-multiselect-item:not(.p-highlight):hover {
    background: ${({ $dark }) => ($dark ? 'rgba(116,67,246,.18)' : 'rgba(116,67,246,.08)')};
  }
  .autom-panel .p-dropdown-item.p-highlight,
  .autom-panel .p-multiselect-item.p-highlight {
    background: ${({ $dark }) => ($dark ? 'rgba(116,67,246,.32)' : 'rgba(116,67,246,.14)')};
    color: ${({ $dark }) => ($dark ? '#ffffff' : '#4c1d95')};
  }
  .autom-panel .p-multiselect-header,
  .autom-panel .p-dropdown-header {
    background: ${({ $dark }) => ($dark ? '#120723' : '#faf9ff')};
    border-bottom: 1px solid ${({ $dark }) => ($dark ? '#2e1f4a' : '#ece8ff')};
    padding: 0.55rem 0.6rem;
  }
  .autom-panel .p-multiselect-filter,
  .autom-panel .p-dropdown-filter {
    background: ${({ $dark }) => ($dark ? '#1a0d32' : '#f3f0ff')};
    border: 1px solid ${({ $dark }) => ($dark ? '#2e1f4a' : '#dbd4ff')};
    color: ${({ $dark }) => ($dark ? '#eae1ff' : '#1b103a')};
    border-radius: 7px;
    font-size: 0.84rem;
  }
  .autom-panel .p-checkbox-box {
    border-color: ${({ $dark }) => ($dark ? '#3a2660' : '#cdbcff')};
    background: ${({ $dark }) => ($dark ? '#1a0d32' : '#ffffff')};
  }
  .autom-panel .p-checkbox-box.p-highlight,
  .autom-panel .p-checkbox-box.p-highlight:hover {
    background: #7443f6;
    border-color: #7443f6;
  }
  .autom-panel .p-multiselect-close { color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#7443f6')}; }
  .autom-panel .p-multiselect-empty-message,
  .autom-panel .p-dropdown-empty-message {
    color: ${({ $dark }) => ($dark ? 'rgba(171,130,255,.6)' : 'rgba(116,67,246,.6)')};
    padding: 0.8rem;
    font-size: 0.83rem;
  }
`;

/* ── Page ───────────────────────────────────────────────────────────── */

const Page = styled.div`
  padding: 1.25rem 1rem 2.5rem 0;
  max-width: 1460px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/* ── Header Card ────────────────────────────────────────────────────── */

const HeaderCard = styled(Card)`
  margin: 0 !important;
  border-radius: 16px !important;
  border: 1px dashed ${({ $dark }) => ($dark ? '#4a30a0' : '#c4aeff')} !important;
  background: ${({ $dark }) => ($dark ? 'rgba(240,231,255,0.06)' : '#f9f7ff')} !important;
  color: ${({ $dark }) => ($dark ? '#eae1ff' : '#2a115f')};
  box-shadow: ${({ $dark }) =>
    $dark
      ? '0 2px 12px rgba(0,0,0,0.28)'
      : '0 2px 8px rgba(100,60,180,0.06)'} !important;

  .p-card-body { padding: 1.1rem 1.25rem !important; }
`;

/* ── Body Card ──────────────────────────────────────────────────────── */

const BodyCard = styled(Card)`
  margin: 0 !important;
  border-radius: 16px !important;
  background: ${({ $dark }) => ($dark ? '#100820' : '#ffffff')} !important;
  border: 1px solid ${({ $dark }) => ($dark ? '#221540' : 'rgba(116,67,246,0.1)')} !important;
  box-shadow: ${({ $dark }) =>
    $dark
      ? '0 4px 18px rgba(0,0,0,0.35)'
      : '0 2px 12px rgba(100,60,180,0.07)'} !important;

  .p-card-body { padding: 1.25rem !important; }
`;

const Section = styled.div`
  padding: 1.25rem;
  border-radius: 16px;
  background: ${({ $dark }) => ($dark ? '#100820' : '#ffffff')};
  border: 1px solid ${({ $dark }) => ($dark ? '#221540' : 'rgba(116,67,246,0.1)')};
  box-shadow: ${({ $dark }) =>
    $dark
      ? '0 4px 18px rgba(0,0,0,0.35)'
      : '0 2px 12px rgba(100,60,180,0.07)'};
`;

/* ── Controles do header ────────────────────────────────────────────── */

const StyledButton = styled(Button)`
  background-color: #7443f6 !important;
  border-color: #7443f6 !important;
  color: #ffffff !important;
  height: 42px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(116,67,246,.3);
  background-image: none;
  padding: 0 18px;
  border-radius: 8px !important;
  transition: filter .15s, box-shadow .15s;
  &:hover:not(:disabled) {
    filter: brightness(1.08);
    box-shadow: 0 4px 14px rgba(116,67,246,.4);
    background-color: #7443f6 !important;
    border-color: #7443f6 !important;
  }
  &:disabled { opacity: 0.55; cursor: not-allowed; filter: none; box-shadow: none; }
`;

const ExportIconBtn = styled(Button)`
  &&.p-button {
    height: 1.5rem;
    width: 1.85rem;
    min-width: unset;
    padding: 0;
    border-radius: 6px;
    font-size: 0.72rem;
    background-color: #7443f6;
    border-color: #7443f6;
    color: #ffffff;
    background-image: none;
    box-shadow: none;
    transition: filter .15s;
    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.55; filter: none; }
    .p-button-icon, .p-button-loading-icon { font-size: 0.72rem; }
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $dark }) => ($dark ? '#eae1ff' : '#1b103a')};
  margin-bottom: 4px;

  .pi {
    font-size: 0.95rem;
    color: #7443f6;
    flex-shrink: 0;
  }
`;

/* ── Toolbar de filtros ─────────────────────────────────────────────── */

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  align-items: end;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const Control = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const ControlLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b21b6')};

  .pi { font-size: 0.72rem; color: #7443f6; }
`;

/* Dropdown / MultiSelect — trigger */

const StyledDropdown = styled(Dropdown)`
  &&.p-dropdown {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background: ${({ $dark }) => ($dark ? '#1a0d32' : '#f3f0ff')};
    border: 1px solid ${({ $dark }) => ($dark ? '#2e1f4a' : '#dbd4ff')};
    transition: border-color .15s, box-shadow .15s;
  }
  &&.p-dropdown:not(.p-disabled).p-focus {
    border-color: #7443f6;
    box-shadow: 0 0 0 3px rgba(116,67,246,.18);
  }
  &&.p-dropdown.p-disabled { opacity: 0.5; }
  .p-dropdown-label {
    display: flex;
    align-items: center;
    font-size: 0.86rem;
    padding: 0 0 0 12px;
    color: ${({ $dark }) => ($dark ? '#eae1ff' : '#1b103a')};
  }
  .p-dropdown-label.p-placeholder {
    color: ${({ $dark }) => ($dark ? 'rgba(234,225,255,.4)' : 'rgba(27,16,58,.4)')};
  }
  .p-dropdown-trigger { width: 34px; color: #7443f6; }
  .p-dropdown-clear-icon { color: ${({ $dark }) => ($dark ? '#9b7fd4' : '#7443f6')}; right: 36px; }
`;

const StyledMultiSelect = styled(MultiSelect)`
  &.p-multiselect {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background: ${({ $dark }) => ($dark ? '#1a0d32' : '#f3f0ff')};
    border: 1px solid ${({ $dark }) => ($dark ? '#2e1f4a' : '#dbd4ff')};
    transition: border-color .15s, box-shadow .15s;
  }
  &.p-multiselect:not(.p-disabled).p-focus {
    border-color: #7443f6;
    box-shadow: 0 0 0 3px rgba(116,67,246,.18);
  }
  &.p-multiselect.p-disabled { opacity: 0.5; }
  .p-multiselect-label {
    display: flex;
    align-items: center;
    font-size: 0.86rem;
    padding: 0 12px;
    color: ${({ $dark }) => ($dark ? '#eae1ff' : '#1b103a')};
  }
  .p-multiselect-label.p-placeholder {
    color: ${({ $dark }) => ($dark ? 'rgba(234,225,255,.4)' : 'rgba(27,16,58,.4)')};
  }
  .p-multiselect-trigger { width: 34px; color: #7443f6; }
`;

/* Segmented (presença do filtro) */

const Segmented = styled.div`
  display: inline-flex;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ $dark }) => ($dark ? '#2e1f4a' : '#dbd4ff')};
  background: ${({ $dark }) => ($dark ? '#1a0d32' : '#f3f0ff')};
`;

const SegBtn = styled.button`
  flex: 1;
  border: none;
  padding: 0 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .12s, color .12s;
  background: ${({ $active }) => ($active ? '#7443f6' : 'transparent')};
  color: ${({ $active, $dark }) => ($active ? '#fff' : ($dark ? '#c4b5fd' : '#5b21b6'))};
  & + & { border-left: 1px solid ${({ $dark }) => ($dark ? '#2e1f4a' : '#dbd4ff')}; }
  &:hover { background: ${({ $active }) => ($active ? '#7443f6' : 'rgba(116,67,246,.14)')}; }
`;

/* ── Item template dos campos (no painel do MultiSelect) ────────────── */

const FieldName = styled.span`
  flex: 1;
  font-size: 0.83rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FieldKeyCode = styled.code`
  font-size: 0.72rem;
  font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
  color: ${({ $dark }) => ($dark ? 'rgba(171,130,255,.6)' : 'rgba(116,67,246,.55)')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
`;

const SmallTag = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.12rem 0.4rem;
  border-radius: 5px;
  flex-shrink: 0;
  background: ${({ $custom, $dark }) =>
    $custom
      ? $dark ? 'rgba(251,191,36,.13)' : 'rgba(251,191,36,.1)'
      : $dark ? 'rgba(34,197,94,.12)'  : 'rgba(34,197,94,.09)'};
  color: ${({ $custom }) => ($custom ? '#d97706' : '#16a34a')};
  border: 1px solid ${({ $custom }) =>
    $custom ? 'rgba(251,191,36,.28)' : 'rgba(34,197,94,.25)'};
`;

const TypeTag = styled.span`
  font-size: 0.65rem;
  font-weight: 500;
  padding: 0.12rem 0.4rem;
  border-radius: 5px;
  flex-shrink: 0;
  background: ${({ $dark }) => ($dark ? 'rgba(116,67,246,.18)' : 'rgba(116,67,246,.08)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b21b6')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,.26)' : 'rgba(116,67,246,.16)')};
`;

/* ── Chips de campos selecionados ───────────────────────────────────── */

const ChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.3rem 0.45rem 0.3rem 0.7rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,.4)' : 'rgba(116,67,246,.22)')};
  background: ${({ $dark }) => ($dark ? 'rgba(88,28,135,.55)' : 'rgba(116,67,246,.08)')};
  color: ${({ $dark }) => ($dark ? '#e9d5ff' : '#4c1d95')};
`;

const ChipMeta = styled.code`
  font-size: 0.68rem;
  opacity: 0.45;
  font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
`;

const ChipDel = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  opacity: 0.45;
  font-size: 0.85rem;
  line-height: 1;
  border-radius: 50%;
  transition: opacity .1s, background .1s;
  &:hover { opacity: 1; background: rgba(116,67,246,.18); }
`;

/* ── Rodapé de ação ─────────────────────────────────────────────────── */

const FilterFooter = styled.div`
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid ${({ $dark }) => ($dark ? '#221540' : '#ece8ff')};
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .summary {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.8rem;
    color: ${({ $dark }) => ($dark ? 'rgba(171,130,255,.7)' : 'rgba(116,67,246,.65)')};
    .pi { font-size: 0.8rem; }
  }
  .actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

/* ── Resultados ─────────────────────────────────────────────────────── */

const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;

  h3 { margin: 0; font-size: 1rem; font-weight: 700; }

  .badges {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }
`;

const AutomCard = styled.div`
  border-radius: 12px;
  margin-bottom: 8px;
  border: 1px solid ${({ $dark }) => ($dark ? '#1e1438' : '#edeaff')};
  background: ${({ $dark }) => ($dark ? '#0f0620' : '#fdfdff')};
  overflow: hidden;
  transition: border-color .16s, box-shadow .16s;
  &:hover {
    border-color: ${({ $dark }) => ($dark ? '#7443f6' : '#c4b5fd')};
    box-shadow: ${({ $dark }) =>
      $dark ? '0 2px 10px rgba(116,67,246,.18)' : '0 2px 10px rgba(116,67,246,.1)'};
  }
`;

const AutomToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.8rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
`;

const StatusDot = styled.span`
  width: 9px; height: 9px;
  border-radius: 50%; flex-shrink: 0;
  background: ${({ $on, $err }) => ($err ? '#ef4444' : $on ? '#22c55e' : '#6b7280')};
  box-shadow: 0 0 0 2px ${({ $on, $err }) =>
    $err ? 'rgba(239,68,68,.2)' : $on ? 'rgba(34,197,94,.2)' : 'rgba(107,114,128,.15)'};
  animation: ${({ $on, $err }) => ($on && !$err ? pulse : 'none')} 2.2s ease-in-out infinite;
`;

const AutomName = styled.span`
  flex: 1;
  font-weight: 600;
  font-size: 1rem;
  color: ${({ $dark }) => ($dark ? '#eae1ff' : '#1b103a')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaPill = styled.span`
  font-size: 0.72rem;
  font-weight: 500;
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,.28)' : 'rgba(116,67,246,.16)')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b21b6')};
  background: ${({ $dark }) => ($dark ? 'rgba(88,28,135,.38)' : 'rgba(116,67,246,.07)')};
  white-space: nowrap;
  flex-shrink: 0;
`;

const Chevron = styled.i`
  font-size: 0.78rem;
  color: ${({ $dark }) => ($dark ? 'rgba(171,130,255,.5)' : 'rgba(116,67,246,.45)')};
  transition: transform .18s;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'none')};
  flex-shrink: 0;
`;

const Detail = styled.div`
  padding: 0 1rem 1rem;
  background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,.015)' : 'rgba(116,67,246,.018)')};
  border-top: 1px solid ${({ $dark }) => ($dark ? 'rgba(255,255,255,.04)' : 'rgba(116,67,246,.08)')};
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
  margin-top: 12px;
`;

const DetailBlock = styled.div`
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  background: ${({ $dark }) => ($dark ? '#0c0119' : '#faf9ff')};
  border: 1px solid ${({ $dark }) => ($dark ? '#1e1438' : '#ece8ff')};
`;

const DTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dark }) => ($dark ? '#ab82ff' : '#7443f6')};
  margin-bottom: 8px;
`;

const FCRow = styled.div`display: flex; flex-wrap: wrap; gap: 5px;`;

const FC = styled.code`
  font-size: 0.72rem;
  border-radius: 5px;
  padding: 0.18rem 0.42rem;
  font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
  border: 1px solid ${({ $dark, $hi }) =>
    $hi ? ($dark ? '#f59e0b' : '#d97706') : ($dark ? 'rgba(116,67,246,.22)' : 'rgba(116,67,246,.14)')};
  color: ${({ $dark, $hi }) =>
    $hi ? ($dark ? '#fcd34d' : '#92400e') : ($dark ? '#c4b5fd' : '#5b21b6')};
  background: ${({ $dark, $hi }) =>
    $hi
      ? ($dark ? 'rgba(245,158,11,.13)' : 'rgba(245,158,11,.07)')
      : ($dark ? 'rgba(88,28,135,.3)' : 'rgba(116,67,246,.05)')};
`;

const FilterUrl = styled.div`
  font-size: 0.69rem;
  font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  word-break: break-all;
  line-height: 1.55;
  background: ${({ $dark }) => ($dark ? '#0a0117' : '#f4f1ff')};
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#3730a3')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,.14)' : 'rgba(116,67,246,.12)')};
  margin-bottom: 8px;
`;

const ActTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.77rem;

  th {
    text-align: left;
    padding: 0.3rem 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ $dark }) => ($dark ? 'rgba(171,130,255,.55)' : 'rgba(116,67,246,.55)')};
    border-bottom: 1px solid ${({ $dark }) => ($dark ? 'rgba(255,255,255,.06)' : 'rgba(116,67,246,.1)')};
  }
  td {
    padding: 0.3rem 0.5rem;
    vertical-align: middle;
    border-bottom: 1px solid ${({ $dark }) => ($dark ? 'rgba(255,255,255,.025)' : 'rgba(116,67,246,.045)')};
  }
  tr:nth-child(even) td {
    background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,.015)' : 'rgba(116,67,246,.022)')};
  }
  tr:last-child td { border-bottom: none; }

  col.col-field  { width: 38%; }
  col.col-value  { width: 42%; }
  col.col-path   { width: 20%; }
`;

const Empty = styled.div`
  font-size: 0.83rem;
  color: ${({ $dark }) => ($dark ? 'rgba(171,130,255,.45)' : 'rgba(116,67,246,.4)')};
  font-style: italic;
`;

/* ── Helpers ────────────────────────────────────────────────────────── */

function buildTerms(fields) {
  const s = new Set();
  fields.forEach(f => { if (f.key) s.add(f.key); if (f.propertyName) s.add(f.propertyName); });
  return [...s];
}

function hiMatch(val, terms) {
  return terms.length > 0 && !!val && terms.some(t => val.toLowerCase().includes(t.toLowerCase()));
}

/* ── Componente principal ───────────────────────────────────────────── */

export default function PloomesAutomacoes() {
  const { darkMode } = useDarkMode();
  const $d = darkMode;
  const toast = useRef(null);

  const [userKey, setUserKey]               = useState('');
  const [accountPreview, setAccountPreview] = useState(null);
  const [entityId, setEntityId]             = useState(null);
  const [fieldList, setFieldList]           = useState([]);
  const [loadingFields, setLoadingFields]   = useState(false);
  const [selected, setSelected]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [exporting, setExporting]           = useState(false);
  const [editsEntityId, setEditsEntityId]   = useState(null);
  const [exportingEntity, setExportingEntity] = useState(false);
  const [result,  setResult]                = useState(null);
  const [expanded, setExpanded]             = useState(new Set());
  const [advTriggerIds, setAdvTriggerIds]   = useState(new Set());
  const [advHasFilter,  setAdvHasFilter]    = useState(null);
  const [advActionIds,  setAdvActionIds]    = useState(new Set());
  const [advFilterFields, setAdvFilterFields] = useState(new Set());

  useEffect(() => {
    if (!entityId || !userKey.trim()) return;
    setFieldList([]); setLoadingFields(true);
    fetchFieldsByEntity({ userKey: userKey.trim(), entityId, pageSize: 500 })
      .then(r => setFieldList(r?.data ?? []))
      .catch(e => toast.current?.show({ severity: 'error', summary: 'Erro ao carregar campos', detail: e.message }))
      .finally(() => setLoadingFields(false));
  }, [entityId, userKey]);

  const search = useCallback(async () => {
    if (!userKey.trim()) {
      toast.current?.show({ severity: 'warn', detail: 'Informe a User-Key.' });
      return;
    }
    setLoading(true); setResult(null); setExpanded(new Set());
    try {
      const terms = selected.length ? buildTerms(selected) : null;
      const data  = await getAutomations({ userKey: userKey.trim(), terms, editsEntityId });
      setResult(data);
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.message });
    } finally {
      setLoading(false);
    }
  }, [userKey, selected, editsEntityId]);

  const doExport = useCallback(async () => {
    if (!userKey.trim()) return;
    setExporting(true);
    try {
      await exportAutomations({ userKey: userKey.trim() });
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Erro ao exportar', detail: e.message });
    } finally {
      setExporting(false);
    }
  }, [userKey]);

  const doExportEntityEdits = useCallback(async () => {
    if (!userKey.trim() || editsEntityId == null) return;
    setExportingEntity(true);
    try {
      await exportAutomationsEditingEntity({ userKey: userKey.trim(), entityId: editsEntityId });
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Erro ao exportar', detail: e.message });
    } finally {
      setExportingEntity(false);
    }
  }, [userKey, editsEntityId]);

  const toggleExpand = useCallback((id) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  // Valida a UK no service da página e normaliza p/ o CredencialCard.
  const validateUK = useCallback(async (uk) => {
    const { account } = await validateUserKey(uk);
    if (!account) throw new Error('UK válida, porém sem retorno de conta.');
    toast.current?.show({ severity: 'success', detail: 'User-Key validada.' });
    return {
      accountId: account.id ?? account.Id ?? null,
      accountName: account.name ?? account.Name ?? null,
      logoUrl: account.logo ?? account.LogoUrl ?? null,
    };
  }, []);

  const activeTerms = useMemo(
    () => (result && selected.length ? buildTerms(selected) : []),
    [result, selected]
  );

  const availableTriggers = useMemo(
    () => entityId
      ? TRIGGER_OPTIONS.filter(t => t.restrictedEntityId === null || t.restrictedEntityId === entityId)
      : TRIGGER_OPTIONS,
    [entityId]
  );

  const availableFilterFields = useMemo(() => {
    if (!result) return [];
    const s = new Set();
    result.automations.forEach(a => (a.triggerFilter?.fields ?? []).forEach(f => s.add(f)));
    return [...s].sort();
  }, [result]);

  const displayedAutomations = useMemo(() => {
    if (!result) return [];
    return result.automations.filter(a => {
      if (advTriggerIds.size > 0 && (!a.trigger || !advTriggerIds.has(a.trigger.id))) return false;
      if (advHasFilter !== null && Boolean(a.triggerFilter) !== advHasFilter) return false;
      if (advActionIds.size > 0) {
        const actIds = new Set(a.actions.map(act => act.actionId));
        if (![...advActionIds].some(id => actIds.has(id))) return false;
      }
      if (advFilterFields.size > 0) {
        const ff = new Set(a.triggerFilter?.fields ?? []);
        if (![...advFilterFields].some(f => ff.has(f))) return false;
      }
      return true;
    });
  }, [result, advTriggerIds, advHasFilter, advActionIds, advFilterFields]);

  const advActiveCount =
    (advTriggerIds.size > 0 ? 1 : 0) +
    (advHasFilter !== null ? 1 : 0) +
    (advActionIds.size > 0 ? 1 : 0) +
    (advFilterFields.size > 0 ? 1 : 0);

  // Total de filtros ativos (escopo + refino) — alimenta o resumo do rodapé
  const totalActiveFilters = advActiveCount + (entityId ? 1 : 0) + (selected.length > 0 ? 1 : 0) + (editsEntityId ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setEntityId(null);
    setSelected([]);
    setAdvTriggerIds(new Set());
    setAdvActionIds(new Set());
    setAdvFilterFields(new Set());
    setAdvHasFilter(null);
    setEditsEntityId(null);
  }, []);

  const fieldItemTemplate = useCallback((f) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <FieldName title={f.name}>{f.name}</FieldName>
      <FieldKeyCode $dark={$d} title={f.key}>{f.key}</FieldKeyCode>
      <SmallTag $custom={f.dynamic} $dark={$d}>{f.dynamic ? 'Custom' : 'Nativo'}</SmallTag>
      {f.typeId && <TypeTag $dark={$d}>{TYPE_LABELS[f.typeId] ?? f.typeId}</TypeTag>}
    </div>
  ), [$d]);

  const presenceOptions = [
    { label: 'Todos', value: null  },
    { label: 'Com',   value: true  },
    { label: 'Sem',   value: false },
  ];

  return (
    <Page>
      <Toast ref={toast} />
      <PanelStyles $dark={$d} />

      {/* ── Header Card ── */}
      <HeaderCard $dark={$d}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Esquerda: header padronizado (logo + título + descrição) */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <ServiceHeader
              variant="standalone"
              platforms={['ploomes']}
              title="Consulta de Automações"
              subtitle="Liste, filtre e exporte as automações configuradas em uma conta Ploomes."
            />
          </div>

          {/* Divisor vertical */}
          <div style={{ width: 1, alignSelf: 'stretch', background: $d ? 'rgba(116,67,246,.18)' : 'rgba(116,67,246,.1)', flexShrink: 0 }} />

          {/* Direita: user-key (seção unificada) */}
          <div style={{ minWidth: 280, maxWidth: 380, flex: 1 }}>
            <CredencialCard
              uk={userKey}
              onUkChange={setUserKey}
              account={accountPreview}
              onAccountChange={setAccountPreview}
              onValidate={validateUK}
              label="User-Key"
              placeholder="Cole a User-Key da conta"
            />
            {!accountPreview && (
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: $d ? 'rgba(171,130,255,.5)' : 'rgba(116,67,246,.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="pi pi-info-circle" style={{ fontSize: 11 }} />
                Configurações → Integrações → User-Key
              </div>
            )}
          </div>
        </div>
      </HeaderCard>

      {/* ── Filtros (toolbar) ── */}
      <BodyCard $dark={$d}>
        <SectionTitle $dark={$d}>
          <i className="pi pi-sliders-h" />
          Filtros da consulta
          <Tag value="opcional" severity="secondary" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }} />
        </SectionTitle>
        <Divider style={{ margin: '10px 0 16px' }} />

        {/* Linha 1 — controles principais */}
        <Toolbar>
          <Control>
            <ControlLabel $dark={$d}><i className="pi pi-th-large" />Entidade</ControlLabel>
            <StyledDropdown
              $dark={$d}
              panelClassName="autom-panel"
              value={entityId}
              options={ENTITY_OPTIONS}
              onChange={e => setEntityId(e.value)}
              placeholder="Selecione…"
              showClear
              disabled={!userKey.trim()}
            />
          </Control>

          <Control>
            <ControlLabel $dark={$d}><i className="pi pi-bolt" />Gatilho</ControlLabel>
            <StyledMultiSelect
              $dark={$d}
              panelClassName="autom-panel"
              value={[...advTriggerIds]}
              options={availableTriggers}
              optionLabel="name"
              optionValue="id"
              onChange={e => setAdvTriggerIds(new Set(e.value))}
              placeholder="Todos"
              filter
              maxSelectedLabels={1}
              selectedItemsLabel="{0} gatilhos"
            />
          </Control>

          <Control>
            <ControlLabel $dark={$d}><i className="pi pi-cog" />Ação</ControlLabel>
            <StyledMultiSelect
              $dark={$d}
              panelClassName="autom-panel"
              value={[...advActionIds]}
              options={ACTION_OPTIONS}
              optionLabel="name"
              optionValue="id"
              onChange={e => setAdvActionIds(new Set(e.value))}
              placeholder="Todas"
              filter
              maxSelectedLabels={1}
              selectedItemsLabel="{0} ações"
            />
          </Control>

          <Control>
            <ControlLabel $dark={$d}><i className="pi pi-filter-fill" />Filtro do gatilho</ControlLabel>
            <Segmented $dark={$d}>
              {presenceOptions.map(opt => (
                <SegBtn
                  key={String(opt.value)}
                  type="button"
                  $dark={$d}
                  $active={advHasFilter === opt.value}
                  onClick={() => setAdvHasFilter(opt.value)}
                >
                  {opt.label}
                </SegBtn>
              ))}
            </Segmented>
          </Control>

          <Control>
            <ControlLabel $dark={$d}><i className="pi pi-pencil" />Ações que editam entidade</ControlLabel>
            <StyledDropdown
              $dark={$d}
              panelClassName="autom-panel"
              value={editsEntityId}
              options={ENTITY_OPTIONS}
              onChange={e => setEditsEntityId(e.value)}
              placeholder="Qualquer entidade"
              showClear
              disabled={!userKey.trim()}
            />
          </Control>
        </Toolbar>

        {/* Linha 2 — campos (terms) + campo no OData */}
        <TwoCol>
          <Control>
            <ControlLabel $dark={$d}><i className="pi pi-list" />Campos referenciados</ControlLabel>
            <StyledMultiSelect
              $dark={$d}
              panelClassName="autom-panel"
              value={selected}
              options={fieldList}
              optionLabel="name"
              dataKey="key"
              onChange={e => setSelected(e.value)}
              placeholder={entityId ? 'Qualquer campo' : 'Selecione a entidade primeiro'}
              disabled={!entityId || loadingFields}
              filter
              filterBy="name,key"
              maxSelectedLabels={1}
              selectedItemsLabel="{0} campos"
              itemTemplate={fieldItemTemplate}
              emptyMessage={loadingFields ? 'Carregando campos…' : 'Nenhum campo'}
              emptyFilterMessage="Nenhum campo encontrado"
            />
          </Control>

          <Control>
            <ControlLabel $dark={$d}><i className="pi pi-filter" />Campo no filtro OData</ControlLabel>
            <StyledMultiSelect
              $dark={$d}
              panelClassName="autom-panel"
              value={[...advFilterFields]}
              options={availableFilterFields}
              onChange={e => setAdvFilterFields(new Set(e.value))}
              placeholder={
                !result
                  ? 'Busque automações primeiro'
                  : availableFilterFields.length === 0
                    ? 'Nenhum filtro nas automações'
                    : 'Qualquer campo'
              }
              disabled={!result || availableFilterFields.length === 0}
              filter
              maxSelectedLabels={1}
              selectedItemsLabel="{0} campos"
            />
          </Control>
        </TwoCol>

        {/* Chips dos campos selecionados */}
        {selected.length > 0 && (
          <ChipsRow>
            {selected.map(f => (
              <Chip key={f.key} $dark={$d} title={`propertyName: ${f.propertyName ?? '—'}`}>
                <span>{f.name}</span>
                <ChipMeta>· {f.key}</ChipMeta>
                <ChipDel onClick={() => setSelected(p => p.filter(x => x.key !== f.key))}>×</ChipDel>
              </Chip>
            ))}
          </ChipsRow>
        )}

        {/* Rodapé: resumo + buscar */}
        <FilterFooter $dark={$d}>
          <div className="summary">
            {totalActiveFilters > 0 ? (
              <>
                <i className="pi pi-filter-fill" />
                {totalActiveFilters} filtro{totalActiveFilters !== 1 ? 's' : ''} ativo{totalActiveFilters !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                <i className="pi pi-filter-slash" />
                Nenhum filtro aplicado — busca todas as automações da conta
              </>
            )}
          </div>
          <div className="actions">
            {totalActiveFilters > 0 && (
              <Button
                label="Limpar tudo"
                icon="pi pi-times"
                size="small"
                text
                severity="secondary"
                onClick={clearAllFilters}
              />
            )}
            <StyledButton
              label={loading ? 'Buscando…' : 'Buscar automações'}
              icon={loading ? undefined : 'pi pi-search'}
              loading={loading}
              onClick={search}
              disabled={loading || !userKey.trim()}
            />
          </div>
        </FilterFooter>
      </BodyCard>

      {/* ── Resultados ── */}
      {result && (
        <Section $dark={$d}>
          <ResultsBar>
            <h3>Automações encontradas</h3>
            <div className="badges">
              <Tag
                value={advActiveCount > 0 ? `${displayedAutomations.length} de ${result.total}` : String(result.total)}
                severity="info"
              />
              {selected.length > 0 && (
                <Tag value={`${selected.length} campo${selected.length !== 1 ? 's' : ''} filtrado${selected.length !== 1 ? 's' : ''}`} severity="secondary" />
              )}
              {advActiveCount > 0 && (
                <Tag
                  value={`${advActiveCount} filtro${advActiveCount !== 1 ? 's' : ''} avançado${advActiveCount !== 1 ? 's' : ''}`}
                  severity="warning"
                />
              )}
              {editsEntityId != null && (
                <Tag value={`Editam ${ENTITY_LABEL[editsEntityId] ?? editsEntityId}`} severity="warning" />
              )}
              {editsEntityId != null && (
                <ExportIconBtn
                  icon={exportingEntity ? undefined : 'pi pi-file-excel'}
                  loading={exportingEntity}
                  disabled={exportingEntity}
                  onClick={doExportEntityEdits}
                  tooltip={`Exportar planilha — ações que editam ${ENTITY_LABEL[editsEntityId] ?? editsEntityId}`}
                  tooltipOptions={{ position: 'top' }}
                />
              )}
              <ExportIconBtn
                icon={exporting ? undefined : 'pi pi-download'}
                loading={exporting}
                disabled={exporting}
                onClick={doExport}
                tooltip="Exportar para Excel"
                tooltipOptions={{ position: 'top' }}
              />
            </div>
          </ResultsBar>
          <Divider style={{ margin: '0 0 12px' }} />

          {displayedAutomations.map(autom => {
            const isOpen       = expanded.has(autom.id);
            const filterFields = autom.triggerFilter?.fields ?? [];
            const actionKeys   = [...new Set(autom.actions.map(a => a.fieldKey).filter(Boolean))];
            const fieldCount   = new Set([...filterFields, ...actionKeys, ...autom.triggerFields]).size;

            return (
              <AutomCard key={autom.id} $dark={$d}>
                <AutomToggle onClick={() => toggleExpand(autom.id)}>
                  <StatusDot
                    $on={autom.enabled}
                    $err={autom.disabledDueToError}
                    title={autom.disabledDueToError ? 'Erro' : autom.enabled ? 'Ativa' : 'Inativa'}
                  />
                  <AutomName $dark={$d}>{autom.name}</AutomName>
                  {autom.entity  && <MetaPill $dark={$d}>{autom.entity.name}</MetaPill>}
                  {autom.trigger && <MetaPill $dark={$d}>{autom.trigger.name}</MetaPill>}
                  {fieldCount > 0 && (
                    <MetaPill $dark={$d}>{fieldCount} campo{fieldCount !== 1 ? 's' : ''}</MetaPill>
                  )}
                  <Chevron className="pi pi-chevron-down" $open={isOpen} $dark={$d} />
                </AutomToggle>

                {isOpen && (
                  <Detail $dark={$d}>
                    <DetailGrid>
                      {/* Filtro do gatilho */}
                      <DetailBlock $dark={$d}>
                        <DTitle $dark={$d}>
                          Filtro do gatilho{autom.triggerFilter ? ` — ${autom.triggerFilter.name}` : ''}
                        </DTitle>
                        {autom.triggerFilter ? (
                          <>
                            <FilterUrl $dark={$d}>
                              {decodeURIComponent(autom.triggerFilter.url.replace(/\+/g, ' '))}
                            </FilterUrl>
                            <FCRow>
                              {filterFields.map(f => (
                                <FC key={f} $dark={$d} $hi={hiMatch(f, activeTerms)}>{f}</FC>
                              ))}
                            </FCRow>
                          </>
                        ) : <Empty>Sem filtro configurado</Empty>}
                      </DetailBlock>

                      {/* Ações */}
                      <DetailBlock $dark={$d}>
                        <DTitle $dark={$d}>Ações ({autom.actions.length})</DTitle>
                        {autom.actions.length === 0 ? (
                          <Empty>Sem ações configuradas</Empty>
                        ) : (
                          <ActTable $dark={$d}>
                            <colgroup>
                              <col className="col-field" />
                              <col className="col-value" />
                              <col className="col-path" />
                            </colgroup>
                            <thead>
                              <tr><th>Campo</th><th>Valor</th><th>PathId</th></tr>
                            </thead>
                            <tbody>
                              {autom.actions.map(act => (
                                <tr key={act.id}>
                                  <td><FC $dark={$d} $hi={hiMatch(act.fieldKey, activeTerms)}>{act.fieldKey || '—'}</FC></td>
                                  <td style={{ fontSize: '0.77rem', color: $d ? '#e0d6ff' : '#1b103a' }}>
                                    {act.valueLabel ?? (act.value != null ? String(act.value) : '—')}
                                  </td>
                                  <td style={{ fontSize: '0.72rem', color: $d ? 'rgba(171,130,255,.45)' : 'rgba(116,67,246,.4)' }}>{act.fieldPathId ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </ActTable>
                        )}
                      </DetailBlock>

                      {/* Campos do gatilho */}
                      {autom.triggerFields.length > 0 && (
                        <DetailBlock $dark={$d}>
                          <DTitle $dark={$d}>Campos do gatilho</DTitle>
                          <FCRow>
                            {autom.triggerFields.map(f => (
                              <FC key={f} $dark={$d} $hi={hiMatch(f, activeTerms)}>{f}</FC>
                            ))}
                          </FCRow>
                        </DetailBlock>
                      )}
                    </DetailGrid>
                  </Detail>
                )}
              </AutomCard>
            );
          })}
        </Section>
      )}
    </Page>
  );
}
