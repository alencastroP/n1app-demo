import { useCallback, useState } from 'react';
import { Button } from '../Button/Button';

/**
 * CopyButton — botão que copia conteúdo para o clipboard com feedback visual.
 *
 *   <CopyButton value={token} />
 *   <CopyButton value={token} variant="ghost" iconOnly />
 */
export function CopyButton({
  value,
  label = 'Copiar',
  copiedLabel = 'Copiado!',
  duration = 1500,
  variant = 'ghost',
  size = 'sm',
  iconOnly = false,
  onCopy,
  'data-testid': dataTestId,
  ...rest
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(value ?? ''));
      setCopied(true);
      onCopy?.(value);
      setTimeout(() => setCopied(false), duration);
    } catch (err) {
      console.error('[CopyButton] clipboard.writeText failed:', err);
    }
  }, [value, duration, onCopy]);

  return (
    <Button
      variant={copied ? 'secondary' : variant}
      size={size}
      iconOnly={iconOnly}
      icon={copied ? 'pi pi-check' : 'pi pi-copy'}
      onClick={handleClick}
      aria-label={iconOnly ? (copied ? copiedLabel : label) : undefined}
      data-testid={dataTestId}
      {...rest}
    >
      {!iconOnly && (copied ? copiedLabel : label)}
    </Button>
  );
}

export default CopyButton;
