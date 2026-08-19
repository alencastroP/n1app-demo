import { forwardRef, useId } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
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
    $required &&
    css`
      &::after { content: ' *'; color: ${({ theme }) => theme.colors.danger}; }
    `}
`;

const StyledTextarea = styled(InputTextarea)`
  width: 100%;
  background: ${({ theme }) => theme.colors.bg.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.base};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  resize: vertical;
  transition: ${({ theme }) => theme.transitions.presets.color},
              ${({ theme }) => theme.transitions.presets.shadow};

  &::placeholder { color: ${({ theme }) => theme.colors.text.muted}; }
  &:hover { border-color: ${({ theme }) => theme.colors.border.strong}; }
  &:focus-visible, &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }

  ${({ $invalid }) =>
    $invalid &&
    css`
      border-color: ${({ theme }) => theme.colors.danger};
      &:focus { box-shadow: ${({ theme }) => theme.shadows.focusDanger}; }
    `}
`;

const HelperText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.text.muted)};
`;

/** Textarea — wrapper sobre PrimeReact InputTextarea. */
export const Textarea = forwardRef(function Textarea(
  { label, helperText, error, required = false, rows = 4, id, 'data-testid': dataTestId, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const invalid = Boolean(error);
  const message = error ?? helperText;

  return (
    <FieldWrapper htmlFor={inputId}>
      {label && <FieldLabel $required={required}>{label}</FieldLabel>}
      <StyledTextarea
        ref={ref}
        id={inputId}
        rows={rows}
        $invalid={invalid}
        aria-invalid={invalid || undefined}
        aria-describedby={message ? `${inputId}-msg` : undefined}
        data-testid={dataTestId}
        {...rest}
      />
      {message && (
        <HelperText id={`${inputId}-msg`} $error={invalid}>{message}</HelperText>
      )}
    </FieldWrapper>
  );
});

export default Textarea;
