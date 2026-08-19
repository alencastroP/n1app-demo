import { ProgressSpinner } from 'primereact/progressspinner';
import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  color: ${({ theme }) => theme.colors.text.muted};

  .p-progress-spinner {
    width: ${({ $size }) => ($size === 'sm' ? '24px' : $size === 'lg' ? '64px' : '40px')};
    height: ${({ $size }) => ($size === 'sm' ? '24px' : $size === 'lg' ? '64px' : '40px')};
  }
  .p-progress-spinner-circle { stroke: ${({ theme }) => theme.colors.primary}; }
`;

const Message = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

/** LoadingState — spinner + mensagem. */
export function LoadingState({
  message = 'Carregando...',
  size = 'md',
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Wrap $size={size} data-testid={dataTestId} role="status" aria-live="polite" {...rest}>
      <ProgressSpinner strokeWidth="3" />
      {message && <Message>{message}</Message>}
    </Wrap>
  );
}

export default LoadingState;
