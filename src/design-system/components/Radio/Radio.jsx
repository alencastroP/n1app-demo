import { forwardRef, useId } from 'react';
import { RadioButton } from 'primereact/radiobutton';
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

const Group = styled.div`
  display: flex;
  flex-direction: ${({ $orientation }) => ($orientation === 'horizontal' ? 'row' : 'column')};
  gap: ${({ theme, $orientation }) =>
    $orientation === 'horizontal' ? theme.spacing.lg : theme.spacing.sm};
`;

/**
 * Radio.Group — controlado por `value` / `onChange`.
 * Radio       — checkbox individual (uso isolado).
 */
export const Radio = forwardRef(function Radio(
  { label, disabled = false, id, 'data-testid': dataTestId, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Row $disabled={disabled} htmlFor={inputId}>
      <RadioButton ref={ref} inputId={inputId} disabled={disabled} data-testid={dataTestId} {...rest} />
      {label}
    </Row>
  );
});

export function RadioGroup({ name, value, onChange, options = [], orientation = 'vertical', disabled }) {
  return (
    <Group $orientation={orientation} role="radiogroup">
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          checked={value === opt.value}
          onChange={(e) => onChange?.(e.value)}
          label={opt.label}
          disabled={disabled || opt.disabled}
        />
      ))}
    </Group>
  );
}

Radio.Group = RadioGroup;

export default Radio;
