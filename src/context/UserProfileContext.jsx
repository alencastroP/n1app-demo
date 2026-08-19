// src/context/UserProfileContext.jsx
// Estado global do usuário logado: perfil (nível hierárquico) + team (área).

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { resolveUserProfile } from '../services/userPermissionsService';
import { isTokenValid } from '../services/auth';
import { PROFILES, LEVELS, hasLevel, getLevel } from '../config/permissionsConfig';
import { TEAMS, canAccessService, canFeature } from '../config/teamsConfig';

const UserProfileContext = createContext(null);

function readStoredNumber(key) {
  const stored = localStorage.getItem(key);
  if (stored === null || stored === '') return null;
  const n = Number(stored);
  return Number.isFinite(n) ? n : null;
}

export function UserProfileProvider({ children }) {
  const [profileId, setProfileId] = useState(() => readStoredNumber('userProfileId'));
  const [userId,    setUserId]    = useState(() => readStoredNumber('userPermId'));
  const [teamId,    setTeamId]    = useState(() => readStoredNumber('userTeamId'));

  // Quando há token válido no mount, vamos refazer o GET no Ploomes para
  // garantir que profileId/teamId estejam atualizados (ex.: após reload do
  // TeamSelectionModal, ou caso o admin/gestor tenha alterado o perfil).
  // Durante essa resolução, seguramos o modal de seleção de team para não
  // mostrá-lo com base em dados stale do localStorage.
  const [isResolvingProfile, setIsResolvingProfile] = useState(() => isTokenValid());

  const loadUserProfile = useCallback(async (loginEmail, userName) => {
    try {
      const result = await resolveUserProfile(loginEmail, userName);
      setProfileId(result.profileId);
      setUserId(result.id);
      setTeamId(result.teamId ?? null);
      localStorage.setItem('userProfileId', String(result.profileId));
      localStorage.setItem('userPermId',    String(result.id));
      if (result.teamId) {
        localStorage.setItem('userTeamId', String(result.teamId));
      } else {
        localStorage.removeItem('userTeamId');
      }
      return result;
    } catch (err) {
      console.error('[UserProfile] Falha ao resolver perfil:', err.message);
      return null;
    }
  }, []);

  const clearUserProfile = useCallback(() => {
    setProfileId(null);
    setUserId(null);
    setTeamId(null);
    localStorage.removeItem('userProfileId');
    localStorage.removeItem('userPermId');
    localStorage.removeItem('userTeamId');
  }, []);

  // Refresh do perfil no boot quando há sessão ativa.
  useEffect(() => {
    if (!isTokenValid()) {
      setIsResolvingProfile(false);
      return;
    }
    const email = localStorage.getItem('userEmail');
    const name  = localStorage.getItem('userName');
    if (!email) {
      setIsResolvingProfile(false);
      return;
    }
    loadUserProfile(email, name).finally(() => setIsResolvingProfile(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Checa se o usuário tem pelo menos o nível mínimo informado. */
  const can = useCallback(
    (minLevel) => profileId !== null && hasLevel(profileId, minLevel),
    [profileId]
  );

  /**
   * Checa se o usuário tem acesso ao serviço informado.
   * Considera regras especiais (ex.: Copilot) antes do mapeamento padrão de team.
   */
  const canService = useCallback(
    (serviceKey) => canAccessService(serviceKey, teamId, profileId),
    [teamId, profileId]
  );

  /**
   * Checa acesso a uma sub-funcionalidade (feature) de um serviço.
   * Ex.: canDo(SERVICE_KEYS.APIHUB, FEATURE_KEYS.API_METHOD_DELETE)
   */
  const canDo = useCallback(
    (serviceKey, featureKey) => canFeature(serviceKey, featureKey, teamId, profileId),
    [teamId, profileId]
  );

  const level    = profileId !== null ? getLevel(profileId) : null;
  const isAdmin  = profileId === PROFILES.ADMIN;
  const isGestor = level !== null && level >= LEVELS.GESTOR;
  const isAdminTeam = teamId === TEAMS.ADMS;

  // O modal só aparece quando NÃO estamos no meio de uma resolução de perfil:
  // assim evitamos flicker no boot/reload, quando o teamId real ainda não chegou.
  const needsTeamSelection =
    !isResolvingProfile && profileId !== null && teamId === null && !isAdmin;

  return (
    <UserProfileContext.Provider
      value={{
        profileId,
        userId,
        teamId,
        level,
        isAdmin,
        isGestor,
        isAdminTeam,
        isResolvingProfile,
        needsTeamSelection,
        loadUserProfile,
        clearUserProfile,
        can,
        canService,
        canDo,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used inside UserProfileProvider');
  return ctx;
}
