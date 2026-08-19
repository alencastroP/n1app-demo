import { forwardRef, useId } from 'react';
import { InputSwitch } from 'primereact/inputswitch';
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

  .p-inputswitch .p-inputswitch-slider {
    background: ${({ theme }) => theme.colors.border.strong};
    border-radius: ${({ theme }) => theme.radius.full};
  }
  .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
    background: ${({ theme }) => theme.colors.primary};
  }
  .p-inputswitch:focus-within { box-shadow: ${({ theme }) => theme.shadows.focus}; border-radius: ${({ theme }) => theme.radius.full}; }
`;

/** Switch — wrapper sobre PrimeReact InputSwitch. */
export const Switch = forwardRef(function Switch(
  { label, disabled = false, id, 'data-testid': dataTestId, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Row $disabled={disabled} htmlFor={inputId}>
      <InputSwitch ref={ref} inputId={inputId} disabled={disabled} data-testid={dataTestId} {...rest} />
      {label}
    </Row>
  );
});

export default Switch;
