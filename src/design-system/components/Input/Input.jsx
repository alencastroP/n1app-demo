import { forwardRef, useId } from 'react';
import {
  FieldWrapper,
  FieldLabel,
  InputShell,
  StyledInput,
  Affix,
  HelperText,
} from './Input.styles';

/**
 * Input — wrapper sobre PrimeReact InputText com label, helper e error.
 *
 *  Props extra:
 *    label, helperText, error (string), required,
 *    prefix (node), suffix (node), size (sm|md|lg)
 */
export const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    required = false,
    prefix,
    suffix,
    size = 'md',
    disabled = false,
    id,
    'data-testid': dataTestId,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const invalid = Boolean(error);
  const message = error ?? helperText;

  return (
    <FieldWrapper htmlFor={inputId}>
      {label && <FieldLabel $required={required}>{label}</FieldLabel>}
      <InputShell $invalid={invalid} $disabled={disabled}>
        {prefix && <Affix>{prefix}</Affix>}
        <StyledInput
          ref={ref}
          id={inputId}
          $size={size}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? `${inputId}-msg` : undefined}
          data-testid={dataTestId}
          {...rest}
        />
        {suffix && <Affix>{suffix}</Affix>}
      </InputShell>
      {message && (
        <HelperText id={`${inputId}-msg`} $error={invalid}>
          {message}
        </HelperText>
      )}
    </FieldWrapper>
  );
});

export default Input;
