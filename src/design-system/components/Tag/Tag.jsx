import styled from 'styled-components';
import { Badge } from '../Badge/Badge';

const RemoveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: currentColor;
  opacity: 0.7;
  padding: 0;
  width: 14px;
  height: 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  transition: ${({ theme }) => theme.transitions.presets.fast};

  &:hover { opacity: 1; }
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }

  i { font-size: 10px; }
`;

/**
 * Tag — badge com botão "X" de remoção.
 *
 *   <Tag variant="primary" onRemove={() => removeTag(id)}>Suporte</Tag>
 */
export function Tag({
  variant = 'primary',
  size = 'md',
  onRemove,
  removeLabel = 'Remover',
  children,
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Badge variant={variant} size={size} data-testid={dataTestId} {...rest}>
      {children}
      {onRemove && (
        <RemoveBtn type="button" onClick={onRemove} aria-label={removeLabel}>
          <i className="pi pi-times" aria-hidden="true" />
        </RemoveBtn>
      )}
    </Badge>
  );
}

export default Tag;
