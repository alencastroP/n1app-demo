import { Badge } from '../Badge/Badge';
import { getFieldType, CATEGORY_VARIANT } from './fieldTypes';

/**
 * FieldTypeBadge — exibe o tipo de campo do Ploomes (Fields@Types) com ícone + nome.
 *
 *   <FieldTypeBadge typeId={5} />          // → "Moeda" (primary)
 *   <FieldTypeBadge typeId={9} size="sm" /> // → "Email" (info)
 *   <FieldTypeBadge typeId={5} showName={false} /> // só ícone
 */
export function FieldTypeBadge({
  typeId,
  size = 'sm',
  showIcon = true,
  showName = true,
  variantOverride,
  'data-testid': dataTestId,
  ...rest
}) {
  const { name, icon, category } = getFieldType(typeId);
  const variant = variantOverride ?? CATEGORY_VARIANT[category] ?? 'neutral';

  return (
    <Badge
      variant={variant}
      size={size}
      icon={showIcon ? icon : undefined}
      data-testid={dataTestId}
      title={`#${typeId} · ${name}`}
      {...rest}
    >
      {showName ? name : null}
    </Badge>
  );
}

export { FIELD_TYPES, getFieldType } from './fieldTypes';
export default FieldTypeBadge;
