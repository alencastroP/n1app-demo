import { forwardRef, useId } from 'react';
import { Checkbox as PrimeCheckbox } from 'primereact/checkbox';
import styled from 'styled-components';

const Row = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  user-select: none;

  ${({ $disabled }) => $disabled && `opacity: 0.55; cursor: not-allowed;`}
`;

const Helper = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.text.muted)};
`;

/** Checkbox — wrapper sobre PrimeReact com label inline e helper/erro. */
export const Checkbox = forwardRef(function Checkbox(
  { label, helperText, error, disabled = false, id, 'data-testid': dataTestId, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const message = error ?? helperText;
  const invalid = Boolean(error);

  return (
    <div>
      <Row $disabled={disabled} htmlFor={inputId}>
        <PrimeCheckbox
          ref={ref}
          inputId={inputId}
          disabled={disabled}
          data-testid={dataTestId}
          {...rest}
        />
        {label}
      </Row>
      {message && <Helper $error={invalid}>{message}</Helper>}
    </div>
  );
});

export default Checkbox;
