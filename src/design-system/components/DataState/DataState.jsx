import { LoadingState } from '../LoadingState/LoadingState';
import { EmptyState } from '../EmptyState/EmptyState';
import { ErrorState } from '../ErrorState/ErrorState';

/**
 * DataState — componente coringa de renderização condicional.
 *
 *   Precedência: error > loading > empty > children
 *
 *   <DataState
 *     loading={loading} error={error} empty={!data.length}
 *     onRetry={refetch}
 *     emptyTitle="Sem registros"
 *   >
 *     {data.map(...)}
 *   </DataState>
 */
export function DataState({
  loading = false,
  error = null,
  empty = false,
  children,
  // LoadingState
  loadingMessage,
  loadingSize,
  // EmptyState
  emptyIcon, emptyTitle, emptyDescription, emptyAction,
  // ErrorState
  errorTitle, errorDescription, onRetry, retryLabel,
  'data-testid': dataTestId,
}) {
  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription ?? (typeof error === 'string' ? error : error?.message)}
        onRetry={onRetry}
        retryLabel={retryLabel}
        data-testid={dataTestId}
      />
    );
  }
  if (loading) {
    return <LoadingState message={loadingMessage} size={loadingSize} data-testid={dataTestId} />;
  }
  if (empty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        data-testid={dataTestId}
      />
    );
  }
  return children ?? null;
}

export default DataState;
