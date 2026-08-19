import { ProgressBar as PrimeProgressBar } from 'primereact/progressbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import styled, { css } from 'styled-components';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StyledLinear = styled(PrimeProgressBar)`
  background: ${({ theme }) => theme.colors.bg.sunken};
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  height: ${({ $size }) => ($size === 'sm' ? '6px' : $size === 'lg' ? '14px' : '10px')};
  overflow: hidden;

  .p-progressbar-value {
    background: ${({ theme }) => theme.colors.primary};
    transition: ${({ theme }) => theme.transitions.presets.base};
  }
  .p-progressbar-label {
    color: ${({ theme }) => theme.colors.onPrimary};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    font-size: ${({ theme }) => theme.typography.sizes.xs};
  }
`;

const CircularWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  ${({ $size }) =>
    $size === 'sm' && css`.p-progress-spinner { width: 20px; height: 20px; }`}
  ${({ $size }) =>
    $size === 'lg' && css`.p-progress-spinner { width: 64px; height: 64px; }`}

  .p-progress-spinner-circle {
    stroke: ${({ theme }) => theme.colors.primary};
  }
`;

/**
 * ProgressBar — linear ou circular.
 *   variant : 'linear' (default) | 'circular'
 *   value   : 0..100 (apenas linear)
 *   label   : texto opcional acima
 *   size    : sm | md | lg
 */
export function ProgressBar({
  variant = 'linear',
  value,
  label,
  size = 'md',
  'data-testid': dataTestId,
  ...rest
}) {
  if (variant === 'circular') {
    return (
      <CircularWrap $size={size} data-testid={dataTestId}>
        <ProgressSpinner {...rest} />
        {label && <Label>{label}</Label>}
      </CircularWrap>
    );
  }

  return (
    <Wrap data-testid={dataTestId}>
      {label && <Label>{label}</Label>}
      <StyledLinear value={value} $size={size} {...rest} />
    </Wrap>
  );
}

export default ProgressBar;
