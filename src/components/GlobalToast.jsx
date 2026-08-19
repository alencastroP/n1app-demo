// src/components/GlobalToast.jsx
//
// Monta um Toast do PrimeReact e o expõe via evento global,
// permitindo que qualquer parte do app (incluindo código fora de React,
// como http.js) dispare notificações.

import { useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { GLOBAL_TOAST_EVENT } from '../services/globalToast';

export default function GlobalToast() {
  const toast = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      const { severity, summary, detail, life } = event.detail || {};
      toast.current?.show({ severity, summary, detail, life });
    };
    window.addEventListener(GLOBAL_TOAST_EVENT, handler);
    return () => window.removeEventListener(GLOBAL_TOAST_EVENT, handler);
  }, []);

  return <Toast ref={toast} position="top-right" />;
}
