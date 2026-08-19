// src/services/userPermissionsService.js
// Gerencia lookup/criação/atualização de usuários na conta de permissões do Ploomes.
//
// A comunicação com a conta de permissões acontece SEMPRE via backend
// (rotas /api/profile/*), que detém a PERMS_KEY server-side. O browser nunca
// recebe a chave nem fala com o Ploomes diretamente.

import { apiFetch } from './http';

/**
 * Resolve perfil completo: o backend encontra ou cria o usuário.
 * `userName` é usado apenas como nome de exibição ao criar um usuário novo.
 * Retorna { id, profileId, teamId }.
 */
export async function resolveUserProfile(_loginEmail, userName) {
  const qs = userName ? `?name=${encodeURIComponent(userName)}` : '';
  return apiFetch(`/api/profile/me${qs}`);
}

/**
 * Lista todos os usuários da conta de permissões (uso pelo painel admin/gestor).
 * Retorna [{ Id, Name, Email, ProfileId, TeamId }].
 */
export async function fetchPermissionsUsers() {
  const data = await apiFetch('/api/profile/users');
  return data?.users ?? [];
}

/**
 * Lista as equipes cadastradas na conta de permissões (Id + Name).
 * Usado para resolver os rótulos de equipe dinamicamente, sem depender do mapa
 * estático — assim novas equipes criadas no Ploomes aparecem sem redeploy.
 * Retorna [{ Id, Name }].
 */
export async function fetchTeams() {
  const data = await apiFetch('/api/profile/teams');
  return data?.teams ?? [];
}

/**
 * Atualiza o ProfileId (nível hierárquico) de um usuário.
 */
export async function updateUserProfile(userId, profileId) {
  await apiFetch(`/api/profile/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ profileId }),
  });
}

/**
 * Atualiza a Team (área) de um usuário.
 */
export async function updateUserTeam(userId, teamId) {
  await apiFetch(`/api/profile/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ teamId }),
  });
}
