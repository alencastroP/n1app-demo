import styled, { css } from 'styled-components';

const variantStyles = {
  neutral: css`
    background: ${({ theme }) => theme.colors.bg.sunken};
    color: ${({ theme }) => theme.colors.text.secondary};
    border-color: ${({ theme }) => theme.colors.border.default};
  `,
  primary: css`
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text.brand};
    border-color: transparent;
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successSoft};
    color: ${({ theme }) => theme.colors.success};
    border-color: transparent;
  `,
  warning: css`
    background: ${({ theme }) => theme.colors.warningSoft};
    color: ${({ theme }) => theme.colors.warning};
    border-color: transparent;
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerSoft};
    color: ${({ theme }) => theme.colors.danger};
    border-color: transparent;
  `,
  info: css`
    background: ${({ theme }) => theme.colors.infoSoft};
    color: ${({ theme }) => theme.colors.info};
    border-color: transparent;
  `,
};

const sizeStyles = {
  sm: css`
    font-size: ${({ theme }) => theme.typography.sizes.xs};
    padding: 2px ${({ theme }) => theme.spacing.sm};
    min-height: 18px;
  `,
  md: css`
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
    min-height: 22px;
  `,
};

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.full};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  line-height: 1;
  white-space: nowrap;

  ${({ $variant = 'neutral' }) => variantStyles[$variant] ?? variantStyles.neutral}
  ${({ $size = 'md' }) => sizeStyles[$size] ?? sizeStyles.md}
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
`;

/**
 * Badge — etiqueta de status/categoria.
 *   variant: neutral | primary | success | warning | danger | info
 *   size: sm | md
 *   dot: bool — adiciona um ponto colorido antes do texto
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon,
  children,
  as,
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Wrap as={as} $variant={variant} $size={size} data-testid={dataTestId} {...rest}>
      {dot && <Dot aria-hidden="true" />}
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
    </Wrap>
  );
}

export default Badge;
