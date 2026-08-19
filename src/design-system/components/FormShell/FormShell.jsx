import styled from 'styled-components';

const Shell = styled.div`
  width: 100%;
  max-width: ${({ theme, $width }) =>
    $width === 'wide' ? theme.containers.formWide : theme.containers.formNarrow};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.lg} ${theme.spacing['3xl']}`};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
`;

const Surface = styled.div`
  background: ${({ theme }) => theme.colors.bg.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
`;

/**
 * FormShell — container padrão de página-formulário.
 *
 * Centraliza o conteúdo numa das duas larguras-token (`containers.formNarrow`
 * / `containers.formWide`) e oferece um slot de header (pensado para o
 * `<ServiceHeader />`) acima do conteúdo.
 *
 *   <FormShell
 *     width="narrow"                          // 'narrow' (720px) | 'wide' (960px)
 *     header={<ServiceHeader title="…" />}    // slot opcional
 *     surface                                  // opcional: embrulha o conteúdo num card de tokens
 *   >
 *     …cards e campos da página (inalterados)…
 *   </FormShell>
 */
export function FormShell({
  width = 'narrow',
  header,
  surface = false,
  children,
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Shell $width={width} data-testid={dataTestId} {...rest}>
      {header}
      {surface ? <Surface>{children}</Surface> : children}
    </Shell>
  );
}

export default FormShell;
