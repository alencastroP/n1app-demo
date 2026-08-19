/**
 * @file PrimeReactOverrides.js
 * @description Overrides agressivos de componentes PrimeReact (`.p-button`,
 *  `.p-inputtext`, `.p-dialog`, etc.) com identidade Ploomes.
 *
 *  ⚠️ ESCOPO
 *
 *  Este arquivo aplica regras `.p-button`, `.p-inputtext`, `.p-dialog`,
 *  etc. GLOBALMENTE. Se montado em `App.jsx`, ele muda a aparência de
 *  QUALQUER componente PrimeReact da aplicação — inclusive em páginas
 *  legadas ainda não migradas, que podem depender da aparência default
 *  do tema `bootstrap4-light-purple`.
 *
 *  Por isso, durante a migração, ele é montado APENAS no preview do
 *  Storybook (onde só vivem componentes do DS) — e NÃO no `App.jsx`.
 *
 *  Para o App rodante, monte `<CssVarsBridge />` no lugar — ele só
 *  injeta vars no `:root`, sem mexer em nenhum seletor, e preserva a
 *  aparência das telas legadas. Quando todas as telas forem migradas,
 *  troque para `<PrimeReactOverrides />` no App.jsx.
 *
 *  Importante: este arquivo não usa `!important` em lugar nenhum.
 */

import { createGlobalStyle, css } from 'styled-components';

const buttonStyles = css`
  .p-button {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    font-family: ${({ theme }) => theme.typography.fonts.sans};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    font-size: ${({ theme }) => theme.typography.sizes.base};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
    border-radius: ${({ theme }) => theme.radius.md};
    transition: ${({ theme }) => theme.transitions.presets.base};
    box-shadow: none;
  }
  .p-button:enabled:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
    border-color: ${({ theme }) => theme.colors.primaryHover};
  }
  .p-button:enabled:active {
    background: ${({ theme }) => theme.colors.primaryActive};
    border-color: ${({ theme }) => theme.colors.primaryActive};
  }
  .p-button:focus-visible,
  .p-button:enabled:focus {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }

  .p-button.p-button-text {
    background: transparent;
    border-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
  }
  .p-button.p-button-text:enabled:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primaryHover};
    border-color: transparent;
  }

  .p-button.p-button-outlined {
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
  .p-button.p-button-outlined:enabled:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primaryHover};
  }

  .p-button.p-button-secondary {
    background: ${({ theme }) => theme.colors.secondary};
    border-color: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.onSecondary};
  }
  .p-button.p-button-secondary:enabled:hover {
    background: ${({ theme }) => theme.colors.secondaryHover};
    border-color: ${({ theme }) => theme.colors.secondaryHover};
  }

  .p-button.p-button-danger {
    background: ${({ theme }) => theme.colors.danger};
    border-color: ${({ theme }) => theme.colors.danger};
  }
  .p-button.p-button-success {
    background: ${({ theme }) => theme.colors.success};
    border-color: ${({ theme }) => theme.colors.success};
  }
  .p-button.p-button-warning {
    background: ${({ theme }) => theme.colors.warning};
    border-color: ${({ theme }) => theme.colors.warning};
    color: ${({ theme }) => theme.colors.text.brand};
  }
  .p-button.p-button-info {
    background: ${({ theme }) => theme.colors.info};
    border-color: ${({ theme }) => theme.colors.info};
  }

  .p-button.p-button-sm {
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  }
  .p-button.p-button-lg {
    font-size: ${({ theme }) => theme.typography.sizes.lg};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  }

  .p-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const inputStyles = css`
  .p-inputtext,
  .p-inputtextarea {
    background: ${({ theme }) => theme.colors.bg.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
    font-family: ${({ theme }) => theme.typography.fonts.sans};
    font-size: ${({ theme }) => theme.typography.sizes.base};
    transition: ${({ theme }) => theme.transitions.presets.color},
                ${({ theme }) => theme.transitions.presets.shadow};
  }
  .p-inputtext::placeholder,
  .p-inputtextarea::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
  .p-inputtext:enabled:hover,
  .p-inputtextarea:enabled:hover {
    border-color: ${({ theme }) => theme.colors.border.strong};
  }
  .p-inputtext:enabled:focus,
  .p-inputtextarea:enabled:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }
  .p-inputtext.p-invalid,
  .p-inputtextarea.p-invalid {
    border-color: ${({ theme }) => theme.colors.danger};
  }
  .p-inputtext.p-invalid:focus,
  .p-inputtextarea.p-invalid:focus {
    box-shadow: ${({ theme }) => theme.shadows.focusDanger};
  }
`;

const dropdownStyles = css`
  .p-dropdown,
  .p-multiselect {
    background: ${({ theme }) => theme.colors.bg.surface};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    transition: ${({ theme }) => theme.transitions.presets.color};
  }
  .p-dropdown:not(.p-disabled):hover,
  .p-multiselect:not(.p-disabled):hover {
    border-color: ${({ theme }) => theme.colors.border.strong};
  }
  .p-dropdown:not(.p-disabled).p-focus,
  .p-multiselect:not(.p-disabled).p-focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }
  .p-dropdown .p-dropdown-label,
  .p-multiselect .p-multiselect-label {
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: ${({ theme }) => theme.typography.sizes.base};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  }
  .p-dropdown .p-dropdown-label.p-placeholder,
  .p-multiselect .p-multiselect-label.p-placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  .p-dropdown-panel,
  .p-multiselect-panel,
  .p-autocomplete-panel {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadows[3]};
  }
  .p-dropdown-items .p-dropdown-item,
  .p-multiselect-items .p-multiselect-item {
    color: ${({ theme }) => theme.colors.text.primary};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
    font-size: ${({ theme }) => theme.typography.sizes.base};
  }
  .p-dropdown-items .p-dropdown-item:hover,
  .p-multiselect-items .p-multiselect-item:hover {
    background: ${({ theme }) => theme.colors.bg.sunken};
  }
  .p-dropdown-items .p-dropdown-item.p-highlight,
  .p-multiselect-items .p-multiselect-item.p-highlight {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text.brand};
  }
`;

const datatableStyles = css`
  .p-datatable {
    font-family: ${({ theme }) => theme.typography.fonts.sans};
    color: ${({ theme }) => theme.colors.text.primary};
    background: transparent;
  }
  .p-datatable .p-datatable-header {
    background: ${({ theme }) => theme.colors.bg.sunken};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-bottom: none;
    border-radius: ${({ theme }) => `${theme.radius.md} ${theme.radius.md} 0 0`};
    padding: ${({ theme }) => theme.spacing.md};
  }
  .p-datatable .p-datatable-thead > tr > th {
    background: ${({ theme }) => theme.colors.bg.sunken};
    color: ${({ theme }) => theme.colors.text.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  }
  .p-datatable .p-datatable-tbody > tr {
    background: ${({ theme }) => theme.colors.bg.surface};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  .p-datatable .p-datatable-tbody > tr > td {
    border: 1px solid ${({ theme }) => theme.colors.border.subtle};
    font-size: ${({ theme }) => theme.typography.sizes.base};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  }
  .p-datatable .p-datatable-tbody > tr:nth-child(even) {
    background: ${({ theme }) => theme.colors.bg.sunken};
  }
  .p-datatable .p-datatable-tbody > tr:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
  }
  .p-datatable .p-datatable-tbody > tr.p-highlight {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text.brand};
  }
`;

const paginatorStyles = css`
  .p-paginator {
    background: transparent;
    color: ${({ theme }) => theme.colors.text.secondary};
    border: none;
    padding: ${({ theme }) => theme.spacing.sm} 0;
  }
  .p-paginator .p-paginator-page,
  .p-paginator .p-paginator-first,
  .p-paginator .p-paginator-prev,
  .p-paginator .p-paginator-next,
  .p-paginator .p-paginator-last {
    background: ${({ theme }) => theme.colors.bg.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.full};
    min-width: 2rem;
    height: 2rem;
    margin: 0 2px;
    transition: ${({ theme }) => theme.transitions.presets.color};
  }
  .p-paginator .p-paginator-page:not(.p-disabled):hover {
    background: ${({ theme }) => theme.colors.primarySoft};
    border-color: ${({ theme }) => theme.colors.border.focus};
  }
  .p-paginator .p-paginator-page.p-highlight {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const dialogStyles = css`
  .p-dialog,
  .p-confirm-dialog {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadows[5]};
    overflow: hidden;
  }
  .p-dialog .p-dialog-header,
  .p-confirm-dialog .p-dialog-header {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
  .p-dialog .p-dialog-content,
  .p-confirm-dialog .p-dialog-content {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    padding: ${({ theme }) => theme.spacing.lg};
  }
  .p-dialog .p-dialog-footer,
  .p-confirm-dialog .p-dialog-footer {
    background: ${({ theme }) => theme.colors.bg.elevated};
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  }
  .p-dialog-mask.p-component-overlay,
  .p-confirm-dialog-mask.p-component-overlay {
    background: ${({ theme }) => theme.colors.bg.overlay};
  }
`;

const progressBarStyles = css`
  .p-progressbar {
    background: ${({ theme }) => theme.colors.bg.sunken};
    border-radius: ${({ theme }) => theme.radius.full};
    border: none;
    overflow: hidden;
  }
  .p-progressbar .p-progressbar-value {
    background: ${({ theme }) => theme.colors.primary};
  }
  .p-progressbar .p-progressbar-label {
    color: ${({ theme }) => theme.colors.onPrimary};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
`;

const toastStyles = css`
  .p-toast {
    z-index: ${({ theme }) => theme.zIndex.toast};
  }
  .p-toast .p-toast-message {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadows[4]};
    backdrop-filter: blur(8px);
  }
  .p-toast .p-toast-message.p-toast-message-success {
    border-left: 4px solid ${({ theme }) => theme.colors.success};
  }
  .p-toast .p-toast-message.p-toast-message-error {
    border-left: 4px solid ${({ theme }) => theme.colors.danger};
  }
  .p-toast .p-toast-message.p-toast-message-warn {
    border-left: 4px solid ${({ theme }) => theme.colors.warning};
  }
  .p-toast .p-toast-message.p-toast-message-info {
    border-left: 4px solid ${({ theme }) => theme.colors.info};
  }
`;

const cardStyles = css`
  .p-card {
    background: ${({ theme }) => theme.colors.bg.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadows[2]};
  }
  .p-card .p-card-body { padding: ${({ theme }) => theme.spacing.lg}; }
  .p-card .p-card-title {
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: ${({ theme }) => theme.typography.sizes.xl};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
  .p-card .p-card-subtitle {
    color: ${({ theme }) => theme.colors.text.muted};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
  }
`;

const tagAndTooltipStyles = css`
  .p-tag {
    border-radius: ${({ theme }) => theme.radius.full};
    font-size: ${({ theme }) => theme.typography.sizes.xs};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  }

  .p-tooltip {
    z-index: ${({ theme }) => theme.zIndex.tooltip};
  }
  .p-tooltip .p-tooltip-text {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadows[2]};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  }
`;

const datepickerStyles = css`
  .p-datepicker {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadows[3]};
  }
  .p-datepicker .p-datepicker-header {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  }
  .p-datepicker table td > span {
    color: ${({ theme }) => theme.colors.text.primary};
  }
  .p-datepicker table td > span.p-highlight {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
  }
  .p-datepicker table td > span:focus { box-shadow: ${({ theme }) => theme.shadows.focus}; }
`;

const checkboxRadioStyles = css`
  .p-checkbox .p-checkbox-box,
  .p-radiobutton .p-radiobutton-box {
    background: ${({ theme }) => theme.colors.bg.surface};
    border: 1px solid ${({ theme }) => theme.colors.border.strong};
    border-radius: ${({ theme }) => theme.radius.sm};
  }
  .p-checkbox .p-checkbox-box.p-highlight,
  .p-radiobutton .p-radiobutton-box.p-highlight {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
  .p-checkbox:not(.p-disabled) .p-checkbox-box:focus-within,
  .p-radiobutton:not(.p-disabled) .p-radiobutton-box:focus-within {
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }
`;

export const PrimeReactOverrides = createGlobalStyle`
  ${buttonStyles}
  ${inputStyles}
  ${dropdownStyles}
  ${datatableStyles}
  ${paginatorStyles}
  ${dialogStyles}
  ${progressBarStyles}
  ${toastStyles}
  ${cardStyles}
  ${tagAndTooltipStyles}
  ${datepickerStyles}
  ${checkboxRadioStyles}
`;

export default PrimeReactOverrides;
