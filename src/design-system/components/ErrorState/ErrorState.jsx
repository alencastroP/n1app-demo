import styled from 'styled-components';
import { Button } from '../Button/Button';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
`;

const IconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Desc = styled.p`
  margin: 0;
  max-width: 44ch;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

/** ErrorState — mensagem de erro + botão de retry opcional. */
export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não conseguimos carregar os dados. Tente novamente em instantes.',
  onRetry,
  retryLabel = 'Tentar de novo',
  icon = 'pi pi-exclamation-triangle',
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Wrap data-testid={dataTestId} role="alert" {...rest}>
      <IconWrap aria-hidden="true"><i className={icon} /></IconWrap>
      <Title>{title}</Title>
      {description && <Desc>{description}</Desc>}
      {onRetry && (
        <Button variant="primary" icon="pi pi-refresh" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Wrap>
  );
}

export default ErrorState;
