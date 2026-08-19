// src/components/sankhya/SankhyaModalHeader.jsx
// Cabeçalho padronizado dos modais da Central de Ações Sankhya.
// Mostra o título da ação + um chip read-only do ambiente/conta já validados no hub.
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { ENV_LABELS, SANKHYA_ENV } from '../../services/sankhyaEnvironment';
import sankhyaLogo from '../../assets/sankhya png.png';

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  font-weight: 700;
  font-size: 1.05rem;
`;

const EnvChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .35rem .7rem;
  border-radius: 999px;
  font-size: .82rem;
  font-weight: 600;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#7c56e6' : 'rgba(116,67,246,.3)')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,.14)' : 'rgba(116,67,246,.07)')};
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#7443f6')};

  img { height: 16px; }
  small { opacity: .8; font-weight: 500; }
`;

export default function SankhyaModalHeader({ icon, title, env, account }) {
  const { darkMode } = useDarkMode();

  return (
    <Head>
      <Title>
        <i className={icon} style={{ fontSize: '1.1rem' }} />
        {title}
      </Title>

      <EnvChip darkMode={darkMode}>
        <img
          src={sankhyaLogo}
          alt=""
          style={env === SANKHYA_ENV.HOMOLOG ? { filter: 'grayscale(100%)' } : undefined}
        />
        {ENV_LABELS[env]}
        {account?.name && <small>• {account.name}</small>}
      </EnvChip>
    </Head>
  );
}
