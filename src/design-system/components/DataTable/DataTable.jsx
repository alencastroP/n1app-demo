import { forwardRef } from 'react';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import styled from 'styled-components';
import { EmptyState } from '../EmptyState/EmptyState';
import { LoadingState } from '../LoadingState/LoadingState';

const Wrap = styled.div`
  background: ${({ theme }) => theme.colors.bg.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
`;

const Styled = styled(PrimeDataTable)`
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};

  .p-datatable-header {
    background: ${({ theme }) => theme.colors.bg.sunken};
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  }
  .p-datatable-thead > tr > th {
    background: ${({ theme }) => theme.colors.bg.sunken};
    color: ${({ theme }) => theme.colors.text.secondary};
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  }
  .p-datatable-tbody > tr > td {
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
    font-size: ${({ theme }) => theme.typography.sizes.base};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  }
  .p-datatable-tbody > tr:hover > td {
    background: ${({ theme }) => theme.colors.primarySoft};
  }
  .p-datatable-tbody > tr.p-highlight > td {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text.brand};
  }
`;

/**
 * DataTable — wrapper sobre PrimeReact com densidade compacta padrão,
 * empty state, loading state e paginação Ploomes.
 *
 * Props extra:
 *   columns: [{ field, header, body, style, sortable, ... }]
 *   loading, empty (boolean — se true, renderiza EmptyState)
 *   emptyMessage / emptyAction / emptyIcon
 *   loadingMessage
 */
export const DataTable = forwardRef(function DataTable(
  {
    columns = [],
    value = [],
    loading = false,
    empty,
    emptyMessage = 'Nenhum registro encontrado.',
    emptyIcon,
    emptyAction,
    loadingMessage = 'Carregando...',
    paginator = true,
    rows = 10,
    rowsPerPageOptions = [10, 25, 50, 100],
    size = 'small',
    children,
    'data-testid': dataTestId,
    ...rest
  },
  ref
) {
  const showEmpty = empty ?? (!loading && (!value || value.length === 0));

  if (loading) {
    return (
      <Wrap data-testid={dataTestId}>
        <LoadingState message={loadingMessage} />
      </Wrap>
    );
  }

  if (showEmpty) {
    return (
      <Wrap data-testid={dataTestId}>
        <EmptyState
          icon={emptyIcon ?? 'pi pi-inbox'}
          title={emptyMessage}
          action={emptyAction}
        />
      </Wrap>
    );
  }

  return (
    <Wrap data-testid={dataTestId}>
      <Styled
        ref={ref}
        value={value}
        size={size}
        paginator={paginator}
        rows={rows}
        rowsPerPageOptions={rowsPerPageOptions}
        emptyMessage={emptyMessage}
        {...rest}
      >
        {children ??
          columns.map((c) => (
            <Column key={c.field ?? c.header} {...c} />
          ))}
      </Styled>
    </Wrap>
  );
});

export { Column };
export default DataTable;
