import { forwardRef, useId } from 'react';
import { Dropdown } from 'primereact/dropdown';
import styled, { css } from 'styled-components';

const FieldWrapper = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  width: 100%;
`;

const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};

  ${({ $required }) =>
    $required && css`&::after { content: ' *'; color: ${({ theme }) => theme.colors.danger}; }`}
`;

const StyledDropdown = styled(Dropdown)`
  width: 100%;
  background: ${({ theme }) => theme.colors.bg.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: ${({ theme }) => theme.transitions.presets.color};

  &:not(.p-disabled):hover { border-color: ${({ theme }) => theme.colors.border.strong}; }
  &:not(.p-disabled).p-focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }

  .p-dropdown-label {
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: ${({ theme, $size }) =>
      $size === 'sm' ? theme.typography.sizes.sm :
      $size === 'lg' ? theme.typography.sizes.lg :
      theme.typography.sizes.base};
    padding: ${({ theme, $size }) =>
      $size === 'sm' ? `${theme.spacing.xs} ${theme.spacing.sm}` :
      $size === 'lg' ? `${theme.spacing.md} ${theme.spacing.lg}` :
      `${theme.spacing.sm} ${theme.spacing.md}`};
  }
  .p-dropdown-label.p-placeholder { color: ${({ theme }) => theme.colors.text.muted}; }

  ${({ $invalid }) =>
    $invalid && css`
      border-color: ${({ theme }) => theme.colors.danger};
      &.p-focus { box-shadow: ${({ theme }) => theme.shadows.focusDanger}; }
    `}
`;

const HelperText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.text.muted)};
`;

/** Select — wrapper sobre PrimeReact Dropdown com label, helper e error. */
export const Select = forwardRef(function Select(
  {
    label, helperText, error, required = false, size = 'md',
    options = [], id, 'data-testid': dataTestId, ...rest
  },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const invalid = Boolean(error);
  const message = error ?? helperText;

  return (
    <FieldWrapper htmlFor={fieldId}>
      {label && <FieldLabel $required={required}>{label}</FieldLabel>}
      <StyledDropdown
        ref={ref}
        inputId={fieldId}
        options={options}
        $size={size}
        $invalid={invalid}
        aria-invalid={invalid || undefined}
        data-testid={dataTestId}
        {...rest}
      />
      {message && <HelperText $error={invalid}>{message}</HelperText>}
    </FieldWrapper>
  );
});

export default Select;
