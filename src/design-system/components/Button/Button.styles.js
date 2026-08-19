import styled, { css } from 'styled-components';
import { Button as PrimeButton } from 'primereact/button';

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};

    &:enabled:hover {
      background: ${({ theme }) => theme.colors.primaryHover};
      border-color: ${({ theme }) => theme.colors.primaryHover};
    }
    &:enabled:active {
      background: ${({ theme }) => theme.colors.primaryActive};
      border-color: ${({ theme }) => theme.colors.primaryActive};
    }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.secondary};
    border-color: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.onSecondary};

    &:enabled:hover {
      background: ${({ theme }) => theme.colors.secondaryHover};
      border-color: ${({ theme }) => theme.colors.secondaryHover};
    }
  `,
  ghost: css`
    background: transparent;
    border-color: transparent;
    color: ${({ theme }) => theme.colors.text.primary};

    &:enabled:hover {
      background: ${({ theme }) => theme.colors.primarySoft};
      border-color: transparent;
      color: ${({ theme }) => theme.colors.text.brand};
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.danger};
    border-color: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.onStatus.danger};

    &:enabled:hover { filter: brightness(0.92); }
  `,
  link: css`
    background: transparent;
    border-color: transparent;
    color: ${({ theme }) => theme.colors.text.link};
    padding-left: 0;
    padding-right: 0;
    text-decoration: underline;
    text-underline-offset: 3px;

    &:enabled:hover {
      background: transparent;
      color: ${({ theme }) => theme.colors.primaryHover};
    }
  `,
};

const sizeStyles = {
  sm: css`
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
    min-height: 28px;
    .p-button-icon { font-size: ${({ theme }) => theme.typography.sizes.sm}; }
  `,
  md: css`
    font-size: ${({ theme }) => theme.typography.sizes.base};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
    min-height: 36px;
  `,
  lg: css`
    font-size: ${({ theme }) => theme.typography.sizes.lg};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
    min-height: 44px;
  `,
};

export const StyledButton = styled(PrimeButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.md};
  transition: ${({ theme }) => theme.transitions.presets.base};
  cursor: pointer;
  white-space: nowrap;

  &:focus-visible,
  &:enabled:focus {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }
  &:disabled { opacity: 0.55; cursor: not-allowed; }

  ${({ $variant = 'primary' }) => variantStyles[$variant] ?? variantStyles.primary}
  ${({ $size = 'md' }) => sizeStyles[$size] ?? sizeStyles.md}

  ${({ $fullWidth }) =>
    $fullWidth && css`
      width: 100%;
    `}

  ${({ $iconOnly, $size = 'md' }) =>
    $iconOnly && css`
      padding: 0;
      width: ${$size === 'sm' ? '28px' : $size === 'lg' ? '44px' : '36px'};
      height: ${$size === 'sm' ? '28px' : $size === 'lg' ? '44px' : '36px'};
    `}
`;
