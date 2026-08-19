import { forwardRef, useCallback, useId, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { Button } from '../Button/Button';
import { CopyButton } from '../CopyButton/CopyButton';

/** Aceita 32 caracteres hexadecimais (padrão UserKey Ploomes). */
const USER_KEY_REGEX = /^[A-Fa-f0-9]{32}$/;

export function isValidUserKey(value = '') {
  return USER_KEY_REGEX.test(String(value).trim());
}

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

const Shell = styled.div`
  display: flex;
  align-items: stretch;
  background: ${({ theme }) => theme.colors.bg.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: ${({ theme }) => theme.transitions.presets.color},
              ${({ theme }) => theme.transitions.presets.shadow};

  &:hover { border-color: ${({ theme }) => theme.colors.border.strong}; }
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }

  ${({ $invalid }) =>
    $invalid && css`
      border-color: ${({ theme }) => theme.colors.danger};
      &:focus-within { box-shadow: ${({ theme }) => theme.shadows.focusDanger}; }
    `}
`;

const StyledInput = styled(InputText)`
  flex: 1;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  letter-spacing: 0.02em;

  &::placeholder { color: ${({ theme }) => theme.colors.text.muted}; }
  &:focus { outline: none; box-shadow: none; border-color: transparent; }
`;

const Actions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding-right: ${({ theme }) => theme.spacing.xs};
`;

const HelperText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.text.muted)};
`;

function maskValue(value) {
  if (!value) return value;
  const len = value.length;
  if (len <= 8) return '•'.repeat(len);
  return value.slice(0, 4) + '•'.repeat(len - 8) + value.slice(-4);
}

/**
 * UserKeyInput — input para UserKey do Ploomes.
 *
 *  - mascara o valor (ocultando o miolo) por padrão
 *  - botão olho para mostrar/ocultar
 *  - botão de copiar embutido
 *  - validação opcional do formato hex de 32 caracteres
 *
 *   <UserKeyInput value={key} onChange={setKey} validate />
 */
export const UserKeyInput = forwardRef(function UserKeyInput(
  {
    label = 'User Key',
    value = '',
    onChange,
    placeholder = '00000000000000000000000000000000',
    validate = false,
    required = false,
    helperText,
    error,
    showCopy = true,
    initialVisible = false,
    id,
    'data-testid': dataTestId,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(initialVisible);

  const handleChange = useCallback((e) => {
    onChange?.(e.target.value);
  }, [onChange]);

  const validationError = useMemo(() => {
    if (!validate) return null;
    if (!value) return required ? 'User Key obrigatória' : null;
    if (!isValidUserKey(value)) return 'Formato inválido (32 caracteres hex)';
    return null;
  }, [validate, value, required]);

  const finalError = error ?? validationError;
  const invalid = Boolean(finalError);
  const message = finalError ?? helperText;
  const displayValue = visible ? value : maskValue(value);

  return (
    <FieldWrapper htmlFor={inputId}>
      {label && <FieldLabel $required={required}>{label}</FieldLabel>}
      <Shell $invalid={invalid}>
        <StyledInput
          ref={ref}
          id={inputId}
          value={displayValue}
          onChange={visible ? handleChange : undefined}
          readOnly={!visible}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? `${inputId}-msg` : undefined}
          data-testid={dataTestId}
          spellCheck={false}
          autoComplete="off"
          {...rest}
        />
        <Actions>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={visible ? 'pi pi-eye-slash' : 'pi pi-eye'}
            onClick={(e) => { e.preventDefault(); setVisible((v) => !v); }}
            aria-label={visible ? 'Ocultar' : 'Mostrar'}
            type="button"
          />
          {showCopy && value && (
            <CopyButton value={value} iconOnly variant="ghost" size="sm" />
          )}
        </Actions>
      </Shell>
      {message && (
        <HelperText id={`${inputId}-msg`} $error={invalid}>{message}</HelperText>
      )}
    </FieldWrapper>
  );
});

export default UserKeyInput;
