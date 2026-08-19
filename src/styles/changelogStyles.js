import styled, { createGlobalStyle, css } from 'styled-components';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Panel } from 'primereact/panel';
import { DataTable } from 'primereact/datatable';

// Estilo global do ConfirmDialog. NÃO recebe prop darkMode — usa o atributo
// data-theme="dark" que o DarkModeProvider aplica em <html> e <body>.
// Isso evita re-injetar a <style> a cada toggle (causa do flicker no toggle).
export const GlobalConfirmDialogStyle = createGlobalStyle`
  .p-confirm-dialog {
    background-color: #ffffff !important;
    color: #1E0C45 !important;
    border: 1px solid #e6def5 !important;
    border-radius: 1rem !important;
    box-shadow: 0 12px 26px rgba(78, 46, 143, 0.16) !important;
  }
  .p-confirm-dialog .p-dialog-header {
    background-color: #f8f5ff !important;
    color: #1E0C45 !important;
    border-bottom: 1px solid #ebe3f8 !important;
    border-radius: 1rem 1rem 0 0 !important;
  }
  .p-confirm-dialog .p-dialog-content {
    background-color: #ffffff !important;
    color: #1E0C45 !important;
    padding: 1.2rem 1.4rem !important;
  }
  .p-confirm-dialog .p-dialog-footer {
    background-color: #f8f5ff !important;
    border-top: 1px solid #ebe3f8 !important;
    border-radius: 0 0 1rem 1rem !important;
  }
  .p-confirm-dialog .p-button:not(.p-button-text) {
    background: linear-gradient(90deg, #7b3ff2 0%, #9a37eb 100%) !important;
    border-color: #7b3ff2 !important;
    color: #fff !important;
  }
  .p-confirm-dialog .p-button.p-button-text {
    color: #6f41db !important;
  }

  [data-theme="dark"] .p-confirm-dialog {
    background-color: #1a0e2e !important;
    color: #efeaff !important;
    border-color: #2d2244 !important;
    box-shadow: 0 16px 32px rgba(0,0,0,0.45) !important;
  }
  [data-theme="dark"] .p-confirm-dialog .p-dialog-header {
    background-color: #21123a !important;
    color: #efeaff !important;
    border-bottom-color: #332356 !important;
  }
  [data-theme="dark"] .p-confirm-dialog .p-dialog-content {
    background-color: #1a0e2e !important;
    color: #efeaff !important;
  }
  [data-theme="dark"] .p-confirm-dialog .p-dialog-footer {
    background-color: #21123a !important;
    border-top-color: #332356 !important;
  }
  [data-theme="dark"] .p-confirm-dialog .p-button.p-button-text {
    color: #caa8ff !important;
  }
`;

// Estilo global escopado ao MultiSelect dos "Campos do log" via panelClassName.
// Sem prop darkMode: reage ao atributo data-theme="dark" do <html>/<body>.
export const GlobalChangelogLogFieldsPanelStyle = createGlobalStyle`
  .changelog-log-fields-panel.p-multiselect-panel {
    background: #ffffff !important;
    border: 1px solid #dccff2 !important;
    box-shadow: 0 10px 24px rgba(87, 62, 145, 0.16) !important;
  }
  .changelog-log-fields-panel .p-multiselect-header {
    background: #f8f5ff !important;
    border-bottom: 1px solid #ebe3f8 !important;
    color: #24134a !important;
  }
  .changelog-log-fields-panel .p-multiselect-filter-container .p-inputtext {
    background: #ffffff !important;
    border: 1px solid #d8caef !important;
    color: #24134a !important;
  }
  .changelog-log-fields-panel .p-multiselect-close {
    color: #7b3ff2 !important;
  }
  .changelog-log-fields-panel .p-multiselect-items-wrapper {
    background: #ffffff !important;
  }
  .changelog-log-fields-panel .p-multiselect-item {
    background: transparent !important;
    color: #24134a !important;
  }
  .changelog-log-fields-panel .p-multiselect-item:hover {
    background: #ede5ff !important;
  }
  .changelog-log-fields-panel .p-multiselect-item.p-highlight {
    background: #f0eaff !important;
    color: #3d216f !important;
  }
  .changelog-log-fields-panel .p-checkbox .p-checkbox-box {
    background: #ffffff !important;
    border: 1px solid #c8b5ea !important;
  }
  .changelog-log-fields-panel .p-checkbox .p-checkbox-box.p-highlight {
    background: linear-gradient(90deg, #7b3ff2 0%, #9a37eb 100%) !important;
    border-color: #7b3ff2 !important;
  }
  .changelog-log-fields-panel .p-multiselect-empty-message {
    color: #7f69ab !important;
  }

  [data-theme="dark"] .changelog-log-fields-panel.p-multiselect-panel {
    background: #1d1133 !important;
    border-color: #3b2960 !important;
    box-shadow: 0 12px 28px rgba(0,0,0,0.5) !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-header {
    background: #21133a !important;
    border-bottom-color: #3b2960 !important;
    color: #f2ebff !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-filter-container .p-inputtext {
    background: #291b45 !important;
    border-color: #3b2960 !important;
    color: #f5efff !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-close {
    color: #caaeff !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-items-wrapper {
    background: #1d1133 !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-item {
    color: #f2ebff !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-item:hover {
    background: rgba(123,63,242,0.22) !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-item.p-highlight {
    background: rgba(123,63,242,0.32) !important;
    color: #fff !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-checkbox .p-checkbox-box {
    background: #291b45 !important;
    border-color: #594287 !important;
  }
  [data-theme="dark"] .changelog-log-fields-panel .p-multiselect-empty-message {
    color: #ad9bce !important;
  }
`;

export const Container = styled.div`
  min-height: 100vh;
  padding: 1.2rem;
  background: none;
`;

export const ChangelogCard = styled(Card)`
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  border-radius: 1.2rem;
  overflow: hidden;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2d2244' : '#e6def5')};
  background: ${({ darkMode }) => (darkMode ? '#170c2a' : '#ffffff')};
  box-shadow: ${({ darkMode }) =>
    darkMode
      ? '0 16px 34px rgba(0,0,0,0.45)'
      : '0 14px 32px rgba(87, 62, 145, 0.14)'};

  .p-card-body {
    padding: 0 !important;
  }

  .p-card-content {
    padding: 0 !important;
  }
`;

export const Body = styled.div`
  padding: 1.2rem 1.4rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const InfoBand = styled.div`
  border: 1px solid ${({ darkMode }) => (darkMode ? '#3e2a6a' : '#d9c9ff')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(96,55,176,0.18)' : '#f4eefe')};
  color: ${({ darkMode }) => (darkMode ? '#efe6ff' : '#4c267d')};
  border-radius: 0.8rem;
  padding: 0.75rem 0.9rem;
  font-size: 0.9rem;
`;

export const ErrorMessage = styled.div`
  color: #b42318;
  border: 1px solid #fca5a5;
  background: #fff1f2;
  border-radius: 0.8rem;
  padding: 0.7rem 0.85rem;
  font-size: 0.9rem;
`;

export const FormGrid = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Section = styled.section`
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2f2150' : '#eee4fb')};
  background: ${({ darkMode }) => (darkMode ? '#1c1033' : '#fcfaff')};
  border-radius: 1rem;
  padding: 0.95rem;
`;

export const SectionTitle = styled.h3`
  margin: 0 0 0.8rem;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ darkMode }) => (darkMode ? '#cab4f5' : '#6e4db2')};
`;

export const Grid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 0.8rem;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const Label = styled.label`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#dacdf8' : '#4f2e84')};
`;

// ─── Superfície única dos campos do formulário ───────────────────────────────
//
// REFERÊNCIA: o botão de "Usuários" (TogglePanelButton). Todo campo do form usa
// o mesmo fundo, a mesma cor de texto e o mesmo tamanho de fonte; a borda é a
// única coisa que muda em relação à referência (sólida no lugar de tracejada).
//
// Por que `&&&` + `!important`: o index.css tem regras globais
// `[data-theme="dark"] .p-inputtext | .p-dropdown | .p-multiselect` com
// !important e especificidade (0,2,0). O styled-components emite UMA classe,
// (0,1,0) — e entre duas declarações !important quem decide é a especificidade,
// então as globais ganhavam. Era por isso que "Entidade" e "Campos do log"
// apareciam em #1a0e2e mesmo com `background: #291b45 !important` escrito aqui
// (medido no browser). `&&&` repete a classe → (0,3,0) e vence de forma estável.
export const FIELD = {
  bg:     { dark: '#26183f', light: '#faf7ff' },
  text:   { dark: '#eadfff', light: '#3d216f' },
  border: { dark: '#594287', light: '#c8b5ea' },
  // A referência não declarava font-size — 13.33px era o default do <button> do
  // browser, não uma escolha de design. Fixamos um valor explícito para todos.
  fontSize: '0.93rem',
  radius: '0.7rem',
  minHeight: '44px',
  padding: '0.6rem 0.75rem',
  focusBorder: '#8f6de0',
  focusRing: '0 0 0 3px rgba(143,109,224,.18)',
};

// Aceita as duas convenções de prop em uso no módulo (`darkMode` e `$dark`).
const tone = (token) => ({ darkMode, $dark }) =>
  FIELD[token][(darkMode ?? $dark) ? 'dark' : 'light'];

// `sel` permite aplicar a mesma superfície ao próprio elemento (`&&&`) ou a um
// input aninhado (`&&& input`), como no invólucro do CredencialCard.
const shellRules = (sel) => css`
  ${sel} {
    width: 100%;
    min-height: ${FIELD.minHeight};
    border-radius: ${FIELD.radius};
    border: 1px solid ${tone('border')} !important;
    background: ${tone('bg')} !important;
    background-color: ${tone('bg')} !important;
    color: ${tone('text')} !important;
    font-size: ${FIELD.fontSize} !important;
    box-sizing: border-box;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  /* Texto interno dos widgets do PrimeReact: herda tudo do invólucro. */
  ${sel} .p-inputtext,
  ${sel} .p-dropdown-label,
  ${sel} .p-multiselect-label {
    background: transparent !important;
    border: none !important;
    color: ${tone('text')} !important;
    font-size: ${FIELD.fontSize} !important;
    padding: ${FIELD.padding};
  }

  /* Placeholder na MESMA cor do texto: a referência mostra
     "Selecionar usuário (opcional)" em contraste cheio. */
  ${sel}::placeholder,
  ${sel} .p-inputtext::placeholder,
  ${sel} .p-dropdown-label.p-placeholder,
  ${sel} .p-multiselect-label.p-placeholder {
    color: ${tone('text')} !important;
    opacity: 1;
  }

  ${sel}:hover { border-color: ${FIELD.focusBorder} !important; }

  /* Foco muda borda e anel — nunca o fundo. */
  ${sel}:focus,
  ${sel}:focus-within {
    outline: none;
    border-color: ${FIELD.focusBorder} !important;
    box-shadow: ${FIELD.focusRing};
    background: ${tone('bg')} !important;
    background-color: ${tone('bg')} !important;
    color: ${tone('text')} !important;
  }
`;

export const fieldShell = shellRules('&&&');
export const fieldShellOnInput = shellRules('&&& input');

// CredencialCard é compartilhado por 14 telas — mudar a paleta dele afetaria
// todas. Este invólucro aplica a superfície do Changelog só aqui dentro.
export const CredencialSlot = styled.div`
  ${fieldShellOnInput}
`;

export const TextInput = styled(InputText)`
  ${fieldShell}
  &&& { padding: ${FIELD.padding}; }
`;

export const CalendarInput = styled(Calendar)`
  ${fieldShell}

  &&& .p-inputtext {
    min-height: ${FIELD.minHeight};
    border-radius: ${FIELD.radius} 0 0 ${FIELD.radius};
  }

  &&& .p-datepicker-trigger {
    background: linear-gradient(90deg, #7b3ff2 0%, #9a37eb 100%) !important;
    border-color: #7b3ff2 !important;
    border-radius: 0 ${FIELD.radius} ${FIELD.radius} 0 !important;
  }
`;

export const SelectInput = styled(Dropdown)`
  ${fieldShell}
`;

export const MultiSelectInput = styled(MultiSelect)`
  ${fieldShell}
`;

export const TogglePanelButton = styled.button`
  ${fieldShell}
  &&& {
    text-align: left;
    padding: ${FIELD.padding};
    cursor: pointer;
  }
`;

export const SelectionPanel = styled(Panel)`
  margin-top: 0.6rem;
  border-radius: 0.8rem;
  overflow: hidden;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#3b2960' : '#dccff2')};
  background: ${({ darkMode }) => (darkMode ? '#21133a' : '#ffffff')};

  .p-panel-header {
    display: none;
  }

  .p-panel-content {
    background: transparent;
    border: none;
    padding: 0;
  }
`;

export const SelectionTable = styled(DataTable)`
  border-radius: 0.75rem;
  overflow: hidden;
  border: none !important;

  &.p-datatable,
  .p-datatable-table,
  .p-datatable-thead,
  .p-datatable-thead > tr,
  .p-datatable-tbody > tr,
  .p-datatable-wrapper {
    border: none !important;
    box-shadow: none !important;
  }

  .p-datatable-thead > tr > th {
    background: ${({ darkMode }) => (darkMode ? '#2b1b4c' : '#f7f3ff')} !important;
    color: ${({ darkMode }) => (darkMode ? '#ddcff9' : '#55358e')} !important;
    border: 0 !important;
    outline: 0 !important;
    box-shadow: none !important;
    font-size: 0.86rem;
    padding: 0.5rem 0.65rem;
  }

  .p-datatable-tbody > tr > td {
    background: ${({ darkMode }) => (darkMode ? '#21133a' : '#ffffff')} !important;
    color: ${({ darkMode }) => (darkMode ? '#f2ebff' : '#24134a')} !important;
    border: 0 !important;
    outline: 0 !important;
    box-shadow: none !important;
    padding: 0.48rem 0.65rem;
  }

  .p-column-header-content,
  .p-sortable-column,
  .p-selection-column,
  .p-checkbox .p-checkbox-box {
    border: 0 !important;
    box-shadow: none !important;
  }

  .p-paginator {
    border: none !important;
    border-top: 1px solid ${({ darkMode }) => (darkMode ? '#3b2960' : '#e7def7')} !important;
    border-radius: 0;
  }
`;

export const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

export const Hint = styled.span`
  font-size: 0.82rem;
  color: ${({ darkMode }) => (darkMode ? '#ad9bce' : '#7f69ab')};
`;

export const SubmitButton = styled(Button)`
  min-width: 220px !important;
  border-radius: 0.75rem !important;
  background: linear-gradient(90deg, #7b3ff2 0%, #9a37eb 100%) !important;
  border-color: #7b3ff2 !important;
  color: #fff !important;

  &:enabled:hover {
    filter: brightness(1.06);
  }

  &:enabled:focus {
    box-shadow: 0 0 0 3px rgba(143,109,224,.22) !important;
  }
`;
