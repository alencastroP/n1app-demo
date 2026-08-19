// src/components/sankhya/SankhyaEnvSelect.jsx
// Seletor de ambiente (Produção / Homologação) compartilhado por todas as ações Sankhya.
// Reaproveita o design do dropdown (EnvButton + Menu popup) e corrige o fundo branco
// do popup no dark mode, padronizando o visual em toda a Central de Ações.
import { useRef } from 'react';
import { Menu } from 'primereact/menu';
import styled, { createGlobalStyle } from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { SANKHYA_ENV, ENV_LABELS } from '../../services/sankhyaEnvironment';
import sankhyaLogo from '../../assets/sankhya png.png';

const EnvButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .45rem .85rem;
  border-radius: 10px;
  font-size: .9rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#7c56e6' : '#7443f6')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,.12)' : 'rgba(116,67,246,.06)')};
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#7443f6')};
  transition: background .15s ease;

  &:hover {
    background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,.22)' : 'rgba(116,67,246,.14)')};
  }
  &:disabled {
    opacity: .55;
    cursor: not-allowed;
  }
  img { height: 18px; }
`;

/* Corrige o fundo branco do popup do PrimeReact Menu no dark mode. */
const EnvMenuStyle = createGlobalStyle`
  .sankhya-env-menu.p-menu.p-menu-overlay {
    background: ${({ $dark }) => ($dark ? '#241640' : '#ffffff')};
    border: 1px solid ${({ $dark }) => ($dark ? '#3a2a6a' : '#e6e6e6')};
    box-shadow: ${({ $dark }) => ($dark ? '0 8px 24px rgba(0,0,0,.45)' : '0 8px 22px rgba(44,13,99,.12)')};
  }
  .sankhya-env-menu.p-menu .p-menuitem-link:hover,
  .sankhya-env-menu.p-menu .p-menuitem-content:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(116,67,246,.20)' : 'rgba(116,67,246,.08)')} !important;
  }
`;

/**
 * @param {Object} props
 * @param {string} props.value - SANKHYA_ENV.PROD | SANKHYA_ENV.HOMOLOG
 * @param {(env: string) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export default function SankhyaEnvSelect({ value, onChange, disabled = false }) {
  const { darkMode } = useDarkMode();
  const menu = useRef(null);

  const renderItem = (envKey, label) => () => (
    <button
      className="p-menuitem-link"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '.6rem 1rem', width: '100%',
        background: value === envKey
          ? (darkMode ? 'rgba(116,67,246,.18)' : 'rgba(116,67,246,.08)')
          : 'transparent',
        border: 'none', cursor: 'pointer',
        color: darkMode ? '#efeaff' : '#1e0c45',
      }}
      onClick={() => { onChange(envKey); menu.current?.hide(); }}
    >
      <img
        src={sankhyaLogo}
        alt={label}
        style={{ height: 20, ...(envKey === SANKHYA_ENV.HOMOLOG ? { filter: 'grayscale(100%)' } : {}) }}
      />
      <span style={{ fontWeight: value === envKey ? 700 : 400 }}>{label}</span>
    </button>
  );

  const items = [
    { template: renderItem(SANKHYA_ENV.PROD, ENV_LABELS[SANKHYA_ENV.PROD]) },
    { template: renderItem(SANKHYA_ENV.HOMOLOG, ENV_LABELS[SANKHYA_ENV.HOMOLOG]) },
  ];

  return (
    <>
      <EnvMenuStyle $dark={darkMode} />
      <EnvButton
        type="button"
        darkMode={darkMode}
        disabled={disabled}
        onClick={(e) => menu.current?.toggle(e)}
      >
        <img
          src={sankhyaLogo}
          alt=""
          style={value === SANKHYA_ENV.HOMOLOG ? { filter: 'grayscale(100%)' } : undefined}
        />
        {ENV_LABELS[value]}
        <i className="pi pi-chevron-down" style={{ fontSize: '.75rem' }} />
      </EnvButton>
      <Menu model={items} popup ref={menu} className="sankhya-env-menu" />
    </>
  );
}
