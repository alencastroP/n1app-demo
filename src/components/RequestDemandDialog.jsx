import { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import styled from 'styled-components';
import { PLOOMES_DEMAND_FORM_URL } from '../config/forms';
import ploomesLogo from '../assets/vertical_colorido.png';

const ContentWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const BrandingPanel = styled.div`
  width: 300px;
  min-width: 300px;
  background: linear-gradient(160deg, #7b2ff7 0%, #9b3ff7 40%, #a855f7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  color: white;
  text-align: center;
  gap: 1.25rem;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: -40px;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 50%;
  }

  @media (max-width: 768px) {
    width: 100%;
    min-width: unset;
    padding: 1.25rem 1rem;
    gap: 0.5rem;
    flex-shrink: 0;
  }
`;

const BrandLogo = styled.img`
  width: 120px;
  filter: brightness(0) invert(1);
  opacity: 0.95;

  @media (max-width: 768px) {
    width: 70px;
  }
`;

const BrandTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    font-size: 1.05rem;
  }
`;

const BrandDescription = styled.p`
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  opacity: 0.92;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.8rem;
    line-height: 1.3;
  }
`;

const BrandList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const BrandListItem = styled.li`
  font-size: 0.85rem;
  opacity: 0.88;
  display: flex;
  align-items: center;
  gap: 0.6rem;

  i {
    font-size: 0.75rem;
    opacity: 0.8;
  }
`;

const BrandBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.6;
  margin-top: auto;

  @media (max-width: 768px) {
    display: none;
  }
`;

const IframePanel = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  background: ${({ $darkMode }) => ($darkMode ? '#1e1e2f' : '#ffffff')};

  @media (max-width: 768px) {
    flex: 1;
    min-height: 0;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: ${({ $darkMode }) => ($darkMode ? '#1e1e2f' : '#fafafa')};
  z-index: 1;
`;

const LoadingText = styled.span`
  font-size: 0.85rem;
  color: ${({ $darkMode }) => ($darkMode ? '#aaa' : '#888')};
`;

export default function RequestDemandDialog({ visible, onHide, darkMode }) {
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const handleShow = () => {
    setLoading(true);
    // Fallback: hide spinner after 5s even if onLoad doesn't fire
    timerRef.current = setTimeout(() => setLoading(false), 5000);
  };

  const handleIframeLoad = () => {
    clearTimeout(timerRef.current);
    setLoading(false);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleOpenNewTab = () => {
    window.open(PLOOMES_DEMAND_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  const footerContent = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button
        label="Abrir em nova aba"
        icon="pi pi-external-link"
        className="p-button-text"
        onClick={handleOpenNewTab}
      />
      <Button
        label="Fechar"
        icon="pi pi-times"
        className="p-button-outlined"
        onClick={onHide}
      />
    </div>
  );

  return (
    <Dialog
      header="N1 App — Novo serviço"
      visible={visible}
      onHide={onHide}
      onShow={handleShow}
      footer={footerContent}
      dismissableMask
      modal
      draggable={false}
      maximizable
      style={{ width: '75vw', height: '85vh' }}
      breakpoints={{ '768px': '100vw' }}
      contentStyle={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flex: 1,
        height: 0,
      }}
      headerStyle={{
        background: darkMode ? '#1a1a2e' : undefined,
        color: darkMode ? '#eee' : undefined,
        borderBottom: darkMode ? '1px solid #2a2a4a' : undefined,
      }}
      className={darkMode ? 'demand-dialog-dark' : ''}
    >
      <ContentWrapper>
        <BrandingPanel>
          <BrandLogo src={ploomesLogo} alt="Ploomes" />
          <BrandTitle>N1 App — Nova demanda/serviço</BrandTitle>
          <BrandDescription>
            Utilize este formulário para registrar novas funcionalidades, ajustes, correções ou melhorias.
            As demandas serão organizadas em funil para priorização e acompanhamento pelo time técnico.
          </BrandDescription>
          <BrandList>
            <BrandListItem>
              <i className="pi pi-star" /> Solicitar uma nova feature
            </BrandListItem>
            <BrandListItem>
              <i className="pi pi-wrench" /> Pedir um ajuste/correção
            </BrandListItem>
            <BrandListItem>
              <i className="pi pi-cog" /> Manutenção do App
            </BrandListItem>
            <BrandListItem>
              <i className="pi pi-lightbulb" /> Sugerir melhorias
            </BrandListItem>
          </BrandList>
          <BrandBadge>Uso interno</BrandBadge>
        </BrandingPanel>

        <IframePanel $darkMode={darkMode}>
          {loading && (
            <LoadingOverlay $darkMode={darkMode}>
              <ProgressSpinner
                style={{ width: '50px', height: '50px' }}
                strokeWidth="4"
              />
              <LoadingText $darkMode={darkMode}>Carregando formulário...</LoadingText>
            </LoadingOverlay>
          )}

          <iframe
            src={PLOOMES_DEMAND_FORM_URL}
            title="Formulário de nova demanda"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
            allow="clipboard-read; clipboard-write"
            onLoad={handleIframeLoad}
            onError={handleIframeLoad}
            style={{
              width: '100%',
              height: '100%',
              flex: 1,
              border: 'none',
              display: 'block',
            }}
          />
        </IframePanel>
      </ContentWrapper>
    </Dialog>
  );
}
