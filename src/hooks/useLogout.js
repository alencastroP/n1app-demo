// src/hooks/useLogout.js
// Logout único do N1 App.
//
// Existe uma implementação só porque há mais de uma saída na UI (o botão da
// sidebar e o "Sair" do controle de sessão no topo): qualquer uma que esquecesse
// de limpar um dos storages deixaria resíduo de sessão. Limpa, nesta ordem:
// perfil (contexto + localStorage), conta ativa (sessionStorage, via evento) e
// as credenciais do usuário.

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../context/UserProfileContext';
import { clearContaAtivaStorage } from '../services/accountSessionStorage';

export default function useLogout() {
  const navigate = useNavigate();
  const { clearUserProfile } = useUserProfile();

  return useCallback(() => {
    clearUserProfile();
    clearContaAtivaStorage();
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    localStorage.removeItem('partnersUK');
    localStorage.removeItem('userEmail');
    navigate('/');
  }, [clearUserProfile, navigate]);
}
