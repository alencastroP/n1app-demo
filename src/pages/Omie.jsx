// src/pages/Omie.jsx
import OmieService from '../components/omie/OmieService';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS } from '../config/teamsConfig';
import { useDarkMode } from '../DarkModeContext';

export default function Omie() {
  const { canService } = useUserProfile();
  const { darkMode } = useDarkMode();

  if (!canService(SERVICE_KEYS.OMIE)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: darkMode ? '#f87171' : '#dc2626' }}>
        <i className="pi pi-lock" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem' }}>Acesso restrito</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return <OmieService />;
}
