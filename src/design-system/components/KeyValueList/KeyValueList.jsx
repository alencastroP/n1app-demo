import styled, { css } from 'styled-components';

const List = styled.dl`
  display: grid;
  grid-template-columns: ${({ $layout }) =>
    $layout === 'horizontal' ? 'max-content 1fr' : '1fr'};
  gap: ${({ theme, $layout }) =>
    $layout === 'horizontal' ? `${theme.spacing.xs} ${theme.spacing.lg}` : theme.spacing.md};
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  ${({ $bordered, theme }) =>
    $bordered && css`
      & > div {
        padding: ${theme.spacing.sm} 0;
        border-bottom: 1px solid ${theme.colors.border.subtle};
      }
      & > div:last-child { border-bottom: none; }
    `}
`;

const Row = styled.div`
  display: contents;
`;

const Key = styled.dt`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacings.wider};
  margin: 0;
`;

const Value = styled.dd`
  font-size: ${({ theme }) => theme.typography.sizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  word-break: break-word;
`;

/**
 * KeyValueList — lista de pares chave/valor, ideal para mostrar metadados
 * de logs, deals, contatos, etc.
 *
 *   layout='vertical' (default) — chave em cima, valor embaixo (compacto)
 *   layout='horizontal'         — chave na esquerda, valor na direita (denso)
 *
 *   <KeyValueList items={[{ key: 'ID', value: 42 }, ...]} bordered />
 *   <KeyValueList>{items.map(...)}</KeyValueList>
 */
export function KeyValueList({
  items,
  layout = 'horizontal',
  bordered = false,
  children,
  as,
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <List as={as} $layout={layout} $bordered={bordered} data-testid={dataTestId} {...rest}>
      {children ??
        items?.map((it, i) => (
          <Row key={it.key ?? i}>
            <Key>{it.key}</Key>
            <Value>{it.value ?? '—'}</Value>
          </Row>
        ))}
    </List>
  );
}

export default KeyValueList;
