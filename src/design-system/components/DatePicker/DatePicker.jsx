import { forwardRef, useId } from 'react';
import { Calendar } from 'primereact/calendar';
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

const StyledCalendar = styled(Calendar)`
  width: 100%;

  .p-inputtext {
    background: ${({ theme }) => theme.colors.bg.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md} 0 0 ${({ theme }) => theme.radius.md};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
    font-size: ${({ theme }) => theme.typography.sizes.base};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.border.focus};
      box-shadow: ${({ theme }) => theme.shadows.focus};
    }
  }
  .p-datepicker-trigger {
    background: ${({ theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    border-radius: 0 ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0;
    transition: ${({ theme }) => theme.transitions.presets.color};
  }
  .p-datepicker-trigger:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
    border-color: ${({ theme }) => theme.colors.primaryHover};
  }

  ${({ $invalid }) =>
    $invalid && css`
      .p-inputtext {
        border-color: ${({ theme }) => theme.colors.danger};
        &:focus { box-shadow: ${({ theme }) => theme.shadows.focusDanger}; }
      }
    `}
`;

const HelperText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.text.muted)};
`;

/** DatePicker — wrapper sobre PrimeReact Calendar com identidade Ploomes. */
export const DatePicker = forwardRef(function DatePicker(
  { label, helperText, error, required = false, dateFormat = 'dd/mm/yy',
    showIcon = true, id, 'data-testid': dataTestId, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const invalid = Boolean(error);
  const message = error ?? helperText;

  return (
    <FieldWrapper htmlFor={inputId}>
      {label && <FieldLabel $required={required}>{label}</FieldLabel>}
      <StyledCalendar
        ref={ref}
        inputId={inputId}
        dateFormat={dateFormat}
        showIcon={showIcon}
        $invalid={invalid}
        data-testid={dataTestId}
        {...rest}
      />
      {message && <HelperText $error={invalid}>{message}</HelperText>}
    </FieldWrapper>
  );
});

export default DatePicker;
