// src/components/sankhya/SankhyaCredentialsBar.jsx
// Barra de credenciais centralizada da Central de Ações Sankhya.
// Valida a User-Key + ambiente UMA única vez; as ações reaproveitam o resultado.
// A seção de credencial usa o CredencialCard unificado (input mascarado, conta
// ativa, Validar UK e chip da conta validada); aqui fica só o wiring com o hub.
import { useState } from 'react';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { validateUserKey } from '../../services/apiHubService';
import SankhyaEnvSelect from './SankhyaEnvSelect';
import CredencialCard from '../CredencialCard';

const Bar = styled.div`
  border-radius: 16px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.25rem;
  background: ${({ darkMode }) => (darkMode ? 'rgba(36,22,64,.72)' : '#ffffff')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(141,120,198,.28)' : '#e7e7ee')};
  box-shadow: ${({ darkMode }) => (darkMode ? '0 6px 18px rgba(0,0,0,.30)' : '0 6px 16px rgba(44,13,99,.08)')};
  display: flex;
  flex-direction: column;
  gap: .85rem;
`;

/**
 * Barra de credenciais. Controla env + userKey + conta validada e propaga para o hub.
 *
 * @param {Object} props
 * @param {string} props.env
 * @param {(env: string) => void} props.onEnvChange
 * @param {string} props.userKey
 * @param {(uk: string) => void} props.onUserKeyChange
 * @param {Object|null} props.account - conta validada { id, name, logo } ou null
 * @param {(account: Object|null) => void} props.onAccountChange
 * @param {(toast: { severity, summary, detail }) => void} props.notify - dispara toast do hub
 */
export default function SankhyaCredentialsBar({
  env,
  onEnvChange,
  userKey,
  onUserKeyChange,
  account,
  onAccountChange,
  notify,
}) {
  const { darkMode } = useDarkMode();
  const [validating, setValidating] = useState(false);

  function handleEnvChange(value) {
    if (!value || value === env) return;
    onEnvChange(value);
    // Trocar de ambiente invalida a validação anterior (UK pode não existir no outro env)
    onAccountChange(null);
  }

  // O hub espera { id, name, logo }; o CredencialCard trabalha com
  // { accountId, accountName, logoUrl } — adaptamos na fronteira.
  const cardAccount = account
    ? { accountId: account.id, accountName: account.name, logoUrl: account.logo }
    : null;

  function handleCardAccountChange(next) {
    onAccountChange(
      next
        ? {
            id: next.accountId ?? null,
            name: next.accountName ?? null,
            logo: next.logoUrl ?? null,
          }
        : null
    );
  }

  // Mesmo service de sempre; normaliza o retorno e lança Error em falha
  // (o CredencialCard exibe a mensagem e limpa a conta validada).
  async function handleValidate(uk) {
    setValidating(true);
    try {
      const { account: acc } = await validateUserKey(uk);
      if (!acc) throw new Error('UK válida, porém sem retorno de conta.');
      notify?.({ severity: 'success', summary: 'Sucesso', detail: 'User-Key validada com sucesso.' });
      return {
        accountId: acc.id ?? acc.Id ?? acc.accountId ?? null,
        accountName: acc.name ?? acc.Name ?? null,
        logoUrl: acc.logo ?? acc.LogoUrl ?? null,
      };
    } finally {
      setValidating(false);
    }
  }

  return (
    <Bar darkMode={darkMode}>
      <CredencialCard
        uk={userKey}
        onUkChange={onUserKeyChange}
        account={cardAccount}
        onAccountChange={handleCardAccountChange}
        onValidate={handleValidate}
        label="User-Key"
        placeholder="Cole a User-Key do usuário de integração"
        extra={<SankhyaEnvSelect value={env} onChange={handleEnvChange} disabled={validating} />}
      />
    </Bar>
  );
}
