import styled from 'styled-components';

const Wrap = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.lg} 0`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Crumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  > * + *::before {
    content: '/';
    margin: 0 ${({ theme }) => theme.spacing.xs};
    color: ${({ theme }) => theme.colors.text.disabled};
  }
  a { color: inherit; text-decoration: none; }
  a:hover { color: ${({ theme }) => theme.colors.text.link}; text-decoration: underline; }
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes['3xl']};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  flex-wrap: wrap;
`;

/**
 * PageHeader — título, subtítulo, breadcrumb opcional e slot de ações.
 *
 *   <PageHeader
 *     title="Usuários" subtitle="Gerencie acessos do N1 App"
 *     breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Usuários' }]}
 *     actions={<><Button>Novo</Button></>}
 *   />
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Wrap data-testid={dataTestId} {...rest}>
      {breadcrumb?.length > 0 && (
        <Crumbs aria-label="Breadcrumb">
          {breadcrumb.map((b, i) =>
            b.href ? <a key={i} href={b.href}>{b.label}</a> : <span key={i}>{b.label}</span>
          )}
        </Crumbs>
      )}
      <Row>
        <TitleBlock>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </TitleBlock>
        {actions && <Actions>{actions}</Actions>}
      </Row>
    </Wrap>
  );
}

export default PageHeader;
