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
`;

const IconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};
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
  max-width: 36ch;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

/**
 * EmptyState — ícone + título + descrição + ação opcional.
 *
 *   <EmptyState
 *     icon="pi pi-inbox"
 *     title="Sem registros"
 *     description="Os registros aparecerão aqui."
 *     action={<Button>Adicionar</Button>}
 *   />
 */
export function EmptyState({
  icon = 'pi pi-inbox',
  title = 'Nada por aqui ainda',
  description,
  action,
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Wrap data-testid={dataTestId} {...rest}>
      <IconWrap aria-hidden="true">
        {typeof icon === 'string' ? <i className={icon} /> : icon}
      </IconWrap>
      <Title>{title}</Title>
      {description && <Desc>{description}</Desc>}
      {action}
    </Wrap>
  );
}

export default EmptyState;
