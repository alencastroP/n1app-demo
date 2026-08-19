import { lazy, Suspense, useMemo } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../providers/useTheme';
import { LoadingState } from '../LoadingState/LoadingState';

// react-json-view-lite é carregado lazy para não pesar o bundle de quem não usa.
const JsonView = lazy(async () => {
  const mod = await import('react-json-view-lite');
  await import('react-json-view-lite/dist/index.css');
  return { default: mod.JsonView };
});

const Wrap = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  background: ${({ theme }) => theme.colors.bg.sunken};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  overflow: auto;
  max-height: ${({ $maxHeight }) => $maxHeight ?? '480px'};

  /* Estilos das classes geradas por react-json-view-lite (defaultStyles). */
  .ploo-json-container {
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  .ploo-json-key { color: ${({ theme }) => theme.colors.text.brand}; }
  .ploo-json-string-value { color: ${({ theme }) => theme.colors.success}; }
  .ploo-json-number-value { color: ${({ theme }) => theme.colors.info}; }
  .ploo-json-boolean-value { color: ${({ theme }) => theme.colors.warning}; }
  .ploo-json-null-value { color: ${({ theme }) => theme.colors.danger}; opacity: 0.85; }
  .ploo-json-undefined-value { color: ${({ theme }) => theme.colors.text.muted}; }
  .ploo-json-punctuation { color: ${({ theme }) => theme.colors.text.muted}; }
  .ploo-json-expander { color: ${({ theme }) => theme.colors.text.muted}; cursor: pointer; }
  .ploo-json-collapse-icon::after { content: '▾'; margin-right: 4px; }
  .ploo-json-expand-icon::after   { content: '▸'; margin-right: 4px; }
`;

const styleOverrides = {
  container: 'ploo-json-container',
  basicChildStyle: 'ploo-json-row',
  childFieldsContainer: 'ploo-json-children',
  label: 'ploo-json-key',
  nullValue: 'ploo-json-null-value',
  undefinedValue: 'ploo-json-undefined-value',
  numberValue: 'ploo-json-number-value',
  stringValue: 'ploo-json-string-value',
  booleanValue: 'ploo-json-boolean-value',
  otherValue: 'ploo-json-other-value',
  punctuation: 'ploo-json-punctuation',
  expander: 'ploo-json-expander',
  collapseIcon: 'ploo-json-collapse-icon',
  expandIcon: 'ploo-json-expand-icon',
  collapsedContent: 'ploo-json-collapsed',
};

/**
 * JsonViewer — exibe JSON formatado, colapsável e theme-aware.
 *
 *  Para ChangeLog do Ploomes (OldObject/NewObject), passe o objeto direto
 *  em `value`. Strings JSON são parseadas automaticamente.
 *
 *   <JsonViewer value={oldObject} initialExpandDepth={1} />
 */
export function JsonViewer({
  value,
  initialExpandDepth = 1,
  maxHeight,
  'data-testid': dataTestId,
  ...rest
}) {
  const data = useMemo(() => {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value; }
    }
    return value;
  }, [value]);

  // useTheme apenas para forçar re-render quando o modo muda (estilos são CSS-in-JS).
  useTheme();

  return (
    <Wrap $maxHeight={maxHeight} data-testid={dataTestId} {...rest}>
      <Suspense fallback={<LoadingState size="sm" message="Renderizando JSON..." />}>
        <JsonView
          data={data ?? null}
          shouldExpandNode={(level) => level < initialExpandDepth}
          style={styleOverrides}
        />
      </Suspense>
    </Wrap>
  );
}

export default JsonViewer;
