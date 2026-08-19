import styled, { css } from 'styled-components';
import { InputText } from 'primereact/inputtext';

const inputSize = {
  sm: css`
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
    min-height: 28px;
  `,
  md: css`
    font-size: ${({ theme }) => theme.typography.sizes.base};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
    min-height: 36px;
  `,
  lg: css`
    font-size: ${({ theme }) => theme.typography.sizes.lg};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    min-height: 44px;
  `,
};

export const FieldWrapper = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  width: 100%;
`;

export const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};

  ${({ $required }) =>
    $required &&
    css`
      &::after {
        content: ' *';
        color: ${({ theme }) => theme.colors.danger};
      }
    `}
`;

export const InputShell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.bg.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: ${({ theme }) => theme.transitions.presets.color},
              ${({ theme }) => theme.transitions.presets.shadow};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.strong};
  }
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }

  ${({ $invalid }) =>
    $invalid &&
    css`
      border-color: ${({ theme }) => theme.colors.danger};
      &:focus-within { box-shadow: ${({ theme }) => theme.shadows.focusDanger}; }
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.55;
      cursor: not-allowed;
      pointer-events: none;
    `}
`;

export const StyledInput = styled(InputText)`
  flex: 1;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  ${({ $size = 'md' }) => inputSize[$size] ?? inputSize.md}

  &::placeholder { color: ${({ theme }) => theme.colors.text.muted}; }
  &:focus { box-shadow: none; outline: none; border-color: transparent; }
`;

export const Affix = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  padding: 0 ${({ theme }) => theme.spacing.sm};
  user-select: none;
`;

export const HelperText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme, $error }) =>
    $error ? theme.colors.danger : theme.colors.text.muted};
`;
