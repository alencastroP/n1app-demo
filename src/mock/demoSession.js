// demo/src/mock/demoSession.js
//
// Identidade do usuário da demo. Nenhuma credencial real é usada: qualquer
// e-mail/senha na tela de Login entra, e o "JWT" é montado aqui no browser
// só para satisfazer `isTokenValid()` (services/auth.js).

import { PROFILES } from '../config/permissionsConfig';
import { TEAMS } from '../config/teamsConfig';

export const DEMO_USER = {
  id: 900001,
  nome: 'Demonstração',
  email: 'demo@n1app.local',
  // Admin + team ADMS: a demo mostra o app com TODOS os serviços visíveis.
  profileId: PROFILES.ADMIN,
  teamId: TEAMS.ADMS,
};

function b64url(obj) {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** JWT de mentira, não assinado — válido por 12h, só para o guard de rota. */
export function criarTokenDemo(email = DEMO_USER.email) {
  const agora = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'none', typ: 'JWT' });
  const payload = b64url({
    sub: String(DEMO_USER.id),
    email,
    demo: true,
    iat: agora,
    exp: agora + 60 * 60 * 12,
  });
  return `${header}.${payload}.demo-signature-not-verified`;
}
