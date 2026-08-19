import { forwardRef, useCallback, useRef } from 'react';
import { Toast as PrimeToast } from 'primereact/toast';
import styled from 'styled-components';

const StyledToast = styled(PrimeToast)`
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  .p-toast-message {
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadows[4]};
    backdrop-filter: blur(8px);
  }
  .p-toast-message.p-toast-message-success { border-left: 4px solid ${({ theme }) => theme.colors.success}; }
  .p-toast-message.p-toast-message-error   { border-left: 4px solid ${({ theme }) => theme.colors.danger}; }
  .p-toast-message.p-toast-message-warn    { border-left: 4px solid ${({ theme }) => theme.colors.warning}; }
  .p-toast-message.p-toast-message-info    { border-left: 4px solid ${({ theme }) => theme.colors.info}; }
  .p-toast-summary { font-weight: ${({ theme }) => theme.typography.weights.semibold}; }
  .p-toast-detail  { font-size: ${({ theme }) => theme.typography.sizes.sm}; color: ${({ theme }) => theme.colors.text.secondary}; }
`;

/**
 * Toast — host de notificações + hook helper `useToast()`.
 *
 *   const { toastRef, success, error, warning, info } = useToast();
 *   <Toast ref={toastRef} />
 */
export const Toast = forwardRef(function Toast(props, ref) {
  return <StyledToast ref={ref} {...props} />;
});

/** Hook helper: retorna ref + atalhos de notificação. */
export function useToast() {
  const toastRef = useRef(null);

  const show = useCallback((severity, summary, detail, life = 4000) => {
    toastRef.current?.show({ severity, summary, detail, life });
  }, []);

  const success = useCallback((summary, detail, life) => show('success', summary, detail, life), [show]);
  const error   = useCallback((summary, detail, life) => show('error',   summary, detail, life), [show]);
  const warning = useCallback((summary, detail, life) => show('warn',    summary, detail, life), [show]);
  const info    = useCallback((summary, detail, life) => show('info',    summary, detail, life), [show]);
  const clear   = useCallback(() => toastRef.current?.clear(), []);

  return { toastRef, show, success, error, warning, info, clear };
}

export default Toast;
