import { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import styled from 'styled-components';
import { getAccountId } from '../../services/sankhyaApi';
import { useDarkMode } from '../../DarkModeContext';

const Wrapper = styled.div`
  border-radius: 12px;
  padding: 1.25rem;
  background: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#f8f9ff')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e1e5eb')};
`;

const FieldLabel = styled.label`
  font-size: .9rem;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#38315e')};
  display: block;
  margin-bottom: .4rem;
`;

const InputWrapper = styled.div`
  position: relative;
  input {
    width: 100%;
    padding: .75rem 1rem;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#3a2f56' : '#d1d5db')};
    border-radius: .75rem;
    background: ${({ darkMode }) => (darkMode ? '#241a36' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#e9e7ff' : '#1a0f3a')};
    font-size: 1rem;
    transition: all 0.2s;
    &:focus {
      outline: none;
      border-color: #7443f6;
      box-shadow: 0 0 0 3px rgba(116,67,246,0.1);
    }
  }
`;

const StatusRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
`;

const StatusChip = styled.div`
  padding: .4rem .8rem;
  border-radius: 20px;
  font-size: .85rem;
  font-weight: 600;
  background: ${({ ok, darkMode }) => ok ? (darkMode ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.12)') : (darkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)')};
  color: ${({ ok }) => ok ? '#16a34a' : '#dc2626'};
  border: 1px solid ${({ ok }) => ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const InfoItem = styled.div`
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.1)' : 'rgba(116,67,246,0.05)')};
  padding: .75rem 1rem;
  border-radius: .75rem;
  border-left: 3px solid #7443f6;
`;

export default function SankhyaAccountInfoCard({ darkMode: propDarkMode, onLoaded }) {
  const { darkMode } = useDarkMode();
  const finalDarkMode = propDarkMode !== undefined ? propDarkMode : darkMode;
  const [userKey, setUserKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const toastRef = useRef(null);

  const validateUserKey = async () => {
    if (!userKey.trim()) {
      toastRef.current?.show({ severity: 'warn', summary: 'UserKey requerida', detail: 'Digite a User-Key.' });
      return;
    }
    setLoading(true);
    try {
      const accountId = await getAccountId(userKey);
      const versionRes = await fetch('https://sankhya-query-api.ploomes.com/rt/v4/vrs', {
        headers: { 'user-key': userKey }
      });
      const versionData = await versionRes.json();
      const version = versionData.version || 'N/A';
      const loadedData = { accountId, version, userKey };
      setData(loadedData);
      onLoaded?.(loadedData);
      toastRef.current?.show({ severity: 'success', summary: 'Validado', detail: `Account ${accountId}, Sankhya v${version}` });
    } catch (err) {
      setData(null);
      toastRef.current?.show({ severity: 'error', summary: 'Erro', detail: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper darkMode={finalDarkMode}>
      <Toast ref={toastRef} />
      <FieldLabel darkMode={finalDarkMode}>User-Key</FieldLabel>
      <InputWrapper darkMode={finalDarkMode}>
        <InputText 
          value={userKey} 
          onChange={(e) => setUserKey(e.target.value)} 
          placeholder="Cole sua User-Key Sankhya"
          disabled={loading}
        />
      </InputWrapper>
      <Button 
        label="Validar" 
        onClick={validateUserKey}
        loading={loading}
        className="p-button-primary w-full mt-3"
        style={{ borderRadius: '.75rem' }}
      />
      {data && (
        <>
          <StatusRow>
            <StatusChip ok>✅ Carregado</StatusChip>
          </StatusRow>
          <InfoGrid>
            <InfoItem darkMode={finalDarkMode}>
              <strong>Account ID:</strong> {data.accountId}
            </InfoItem>
            <InfoItem darkMode={finalDarkMode}>
              <strong>Sankhya Version:</strong> {data.version}
            </InfoItem>
          </InfoGrid>
        </>
      )}
    </Wrapper>
  );
}

