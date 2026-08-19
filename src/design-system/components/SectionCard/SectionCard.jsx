import styled, { css } from 'styled-components';

const Wrap = styled.section`
  background: ${({ theme }) => theme.colors.bg.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows[1]};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  overflow: hidden;

  ${({ $elevated, theme }) =>
    $elevated && css`box-shadow: ${theme.shadows[3]};`}

  ${({ $compact, theme }) =>
    $compact && css`
      & > [data-slot="header"] { padding: ${theme.spacing.sm} ${theme.spacing.md}; }
      & > [data-slot="body"]   { padding: ${theme.spacing.md}; }
      & > [data-slot="footer"] { padding: ${theme.spacing.sm} ${theme.spacing.md}; }
    `}
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  background: ${({ theme }) => theme.colors.bg.surface};
`;

const Titles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const Title = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;
const Subtitle = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  background: ${({ theme }) => theme.colors.bg.sunken};
`;

/**
 * SectionCard — card com header opcional, padding consistente, e footer opcional.
 *
 *   <SectionCard title="Configurações" subtitle="Padrões do projeto"
 *                actions={<Button>Editar</Button>}
 *                footer={<><Button variant="ghost">Cancelar</Button><Button>Salvar</Button></>}>
 *     conteúdo
 *   </SectionCard>
 */
export function SectionCard({
  title,
  subtitle,
  actions,
  footer,
  elevated = false,
  compact = false,
  children,
  as,
  'data-testid': dataTestId,
  ...rest
}) {
  const hasHeader = title || subtitle || actions;
  return (
    <Wrap as={as} $elevated={elevated} $compact={compact} data-testid={dataTestId} {...rest}>
      {hasHeader && (
        <Header data-slot="header">
          <Titles>
            {title && <Title>{title}</Title>}
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </Titles>
          {actions}
        </Header>
      )}
      <Body data-slot="body">{children}</Body>
      {footer && <Footer data-slot="footer">{footer}</Footer>}
    </Wrap>
  );
}

export default SectionCard;
