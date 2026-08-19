import { forwardRef } from 'react';
import { StyledButton } from './Button.styles';

/**
 * Button — wrapper sobre PrimeReact com identidade Ploomes.
 *
 * Variants : primary | secondary | ghost | danger | link
 * Sizes    : sm | md | lg
 * Estados  : loading, disabled, iconOnly, fullWidth
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    iconOnly = false,
    fullWidth = false,
    icon,
    iconPos = 'left',
    children,
    as,
    'data-testid': dataTestId,
    ...rest
  },
  ref
) {
  return (
    <StyledButton
      ref={ref}
      as={as}
      $variant={variant}
      $size={size}
      $iconOnly={iconOnly}
      $fullWidth={fullWidth}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      iconPos={iconPos}
      data-testid={dataTestId}
      label={iconOnly ? undefined : undefined}
      {...rest}
    >
      {!iconOnly && children}
    </StyledButton>
  );
});

export default Button;
