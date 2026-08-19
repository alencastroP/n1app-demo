import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { isTokenValid } from '../services/auth'
import { clearContaAtivaStorage } from '../services/accountSessionStorage'

export default function RotaProtegida({ children }) {
  const valid = isTokenValid();

  // Limpeza em efeito (não durante o render): clearContaAtivaStorage dispara
  // evento ouvido pelo AccountSessionProvider (setState de um ancestral).
  useEffect(() => {
    if (!valid) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      clearContaAtivaStorage();
    }
  }, [valid]);

  // Login vive em "/" (não existe rota /login) — mesmo destino dos guards
  // inline de App.jsx (RotaProtegidaServico/Admin/GerenciaUsuarios).
  if (!valid) return <Navigate to="/" replace />
  return children
}
