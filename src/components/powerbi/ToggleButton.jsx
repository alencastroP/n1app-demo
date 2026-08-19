import React from 'react';
import { Button } from 'primereact/button';
import styled, { css } from 'styled-components';

const Icon = styled.span`
  display: inline-block;
  transition: transform 0.3s ease;
  ${({ expanded }) =>
    expanded &&
    css`
      transform: rotate(180deg);
    `}
`;


export default function ToggleButton({ expanded, darkMode, label, onClick, ...props }) {
  return (
    <Button
      {...props}
      onClick={onClick}
      className="p-button-outlined"
      style={{
        cursor: 'pointer',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        borderColor: darkMode ? '#7443f6' : '#7443f6',
        color: darkMode ? '#7443f6' : '#7443f6',
        backgroundColor: 'transparent',
      }}
      type="button"
      aria-expanded={expanded}
      aria-pressed={expanded}
    >
      {label}
      <Icon expanded={expanded ? 1 : 0} className="pi pi-chevron-down" />
    </Button>
  );
}