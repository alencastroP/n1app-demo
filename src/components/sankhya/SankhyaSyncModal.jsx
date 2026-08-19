import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import styled from 'styled-components';
import { consultarParceiro, getCamposParceiro } from '../../services/sankhyaApi';
import SankhyaAccountInfoCard from './SankhyaAccountInfoCard';
import ploomesLight from '../../assets/horizontal_colorido.png';
import ploomesDark from '../../assets/ploomes_logo.png';
import sankhyaLogo from '../../assets/sankhya png.png';
import { useDarkMode } from '../../DarkModeContext';

const ModalHead = styled.div`
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 1rem;
`;

const LogosRow = styled.div`
  display: inline-flex; 
  align-items: center; 
  gap: .35rem; 
  opacity: .85;
  img { height: 18px; }
  .swap { font-size: .9rem; opacity: .7; }
`;

const ModalTitle = styled.div`
  display: flex; 
  align-items: center; 
  gap: .75rem; 
  font-weight: 700; 
  font-size: 1.05rem;
`;

const SectionShell = styled.div`
  margin: 0;
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  min-height: calc(90vh - 64px);
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: ${({ darkMode }) => (darkMode ? '#201335' : '#f1f1f1')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#281546' : '#e6e6e6')};
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : 'inherit')};
`;

const SectionAccent = styled.div`
  background: ${({ darkMode }) => (darkMode ? 'linear-gradient(180deg, rgba(73,34,148,0.30) 0%, rgba(46,22,102,0.30) 100%)' : 'linear-gradient(180deg, rgba(116,67,246,0.10) 0%, rgba(94,46,207,0.10) 100%)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#7c56e6' : '#7443f6')};
  box-shadow: 0 6px 16px ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.20)')};
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: .4rem;
  margin-bottom: .75rem;
`;

const FieldLabel = styled.label`
  font-size: .85rem;
  font-weight: 600;
  letter-spacing: .02em;
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#38315e')};
`;

const StickyAction = styled.div`
  display: flex; 
  justify-content: flex-start; 
  gap: .5rem;
  margin-top: .75rem; 
  padding-top: .5rem;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }
`;

export default function SankhyaSyncModal({ visible, onHide, darkMode: propDarkMode }) {
  const { darkMode } = useDarkMode();
  const finalDarkMode = propDarkMode !== undefined ? propDarkMode : darkMode;
  const [accData, setAccData] = useState(null);
  const [codigoParceiro, setCodigoParceiro] = useState('');
  const [loading, setLoading] = useState(false);
  const toastRef = useRef(null);
  const ploomesLogo = finalDarkMode ? ploomesDark : ploomesLight;

  const SyncHeaderContent = (
    <ModalHead>
      <LogosRow>
        <img src={ploomesLogo} alt="Ploomes" />
        <span className="swap">⇄</span>
        <img src={sankhyaLogo} alt="Sankhya" />
      </LogosRow>
      <ModalTitle>
        <i className="pi pi-search" style={{ opacity: 0.8 }} />
        Consultas de Itens
      </ModalTitle>
    </ModalHead>
  );

  const loadCampos = async () => {
    try {
      const campos = await getCamposParceiro();
      toastRef.current?.show({ severity: 'success', detail: `${campos.length} campos carregados` });
    } catch (err) {
      toastRef.current?.show({ severity: 'error', detail: err.message });
    }
  };

  const doConsultar = async () => {
    if (!accData?.accountId) return toastRef.current?.show({ severity: 'warn', detail: 'Valide User-Key primeiro.' });
    if (!codigoParceiro) return toastRef.current?.show({ severity: 'warn', detail: 'Código Parceiro requerido.' });
    setLoading(true);
    try {
      const result = await consultarParceiro({
        accountId: accData.accountId,
        codigoParceiro,
        userKey: accData.userKey
      });
      toastRef.current?.show({ severity: 'success', summary: 'OK', detail: `Registros: ${result.responseBody?.entities?.total || 0}` });
    } catch (err) {
      toastRef.current?.show({ severity: 'error', detail: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      header={SyncHeaderContent} 
      visible={visible} 
      onHide={onHide} 
      modal 
      style={{ width: 'min(1100px, 96vw)' }} 
      contentStyle={{ padding: 0 }}
    >
      <Toast ref={toastRef} />
      <SectionShell darkMode={finalDarkMode}>
        <SankhyaAccountInfoCard darkMode={finalDarkMode} onLoaded={setAccData} />
        
        <SectionAccent darkMode={finalDarkMode}>
          <h3 style={{ margin: '0 0 .5rem 0' }}>Consultar Parceiro</h3>
          <p style={{ margin: '0 0 1rem' }}>Código ou * para todos (padrão: CODPARC,NOMEPARC,...).</p>
          
          <Grid2>
            <Field>
              <FieldLabel darkMode={finalDarkMode}>Código Parceiro</FieldLabel>
              <InputText 
                value={codigoParceiro} 
                onChange={e => setCodigoParceiro(e.target.value)} 
                placeholder="123 or *"
              />
            </Field>
            <Field>
              <Button label="LoadRecords Genérico" onClick={loadCampos} size="small" className="mb-2" />
            </Field>
          </Grid2>

          <StickyAction>
            <Button 
              label="Executar" 
              onClick={doConsultar} 
              loading={loading} 
              disabled={!accData?.accountId || loading} 
              className="p-button-primary" 
            />
          </StickyAction>
        </SectionAccent>
      </SectionShell>
    </Dialog>
  );
}

