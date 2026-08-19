import { forwardRef } from 'react';
import { Dialog as PrimeDialog } from 'primereact/dialog';
import styled from 'styled-components';

const StyledDialog = styled(PrimeDialog)`
  background: ${({ theme }) => theme.colors.bg.elevated};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows[5]};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  overflow: hidden;

  .p-dialog-header {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  }
  .p-dialog-title {
    font-size: ${({ theme }) => theme.typography.sizes.xl};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
  .p-dialog-content {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    padding: ${({ theme }) => theme.spacing.lg};
  }
  .p-dialog-footer {
    background: ${({ theme }) => theme.colors.bg.elevated};
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    display: flex;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

/**
 * Dialog — wrapper sobre PrimeReact Dialog.
 *
 * Props:
 *   visible, onHide, title, footer (node), width (px|%), children
 */
export const Dialog = forwardRef(function Dialog(
  { title, header, width = '480px', children, footer,
    'data-testid': dataTestId, ...rest },
  ref
) {
  return (
    <StyledDialog
      ref={ref}
      header={header ?? title}
      footer={footer}
      style={{ width }}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </StyledDialog>
  );
});

export default Dialog;
