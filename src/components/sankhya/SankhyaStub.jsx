// src/components/sankhya/SankhyaStub.jsx
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import ServiceHeader from '../ServiceHeader';

const Page = styled.div`
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1e0c45')};
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .95rem;
  opacity: .8;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  .sep {
    font-size: .8rem;
    opacity: .6;
  }
`;

const StubCard = styled.div`
  border-radius: 16px;
  padding: 3rem 2rem;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(141,120,198,.28)' : '#e7e7ee')};
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(180deg, rgba(46,36,78,.98) 0%, rgba(32,24,56,.98) 100%)'
      : 'linear-gradient(180deg, rgba(246,244,255,1) 0%, rgba(250,249,255,1) 100%)'};
  box-shadow: ${({ darkMode }) => (darkMode ? '0 6px 18px rgba(0,0,0,.35)' : '0 6px 18px rgba(0,0,0,.1)')};

  h2 {
    margin: 1rem 0 .5rem 0;
  }
  p {
    opacity: .75;
    margin-bottom: 1.5rem;
  }
`;

export default function SankhyaStub({ title }) {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <Page className="p-4" darkMode={darkMode}>
      <ServiceHeader
        platforms={['ploomes', 'sankhya']}
        title={title}
        subtitle="Ferramenta em desenvolvimento — em breve nesta central."
      />

      <Breadcrumb>
        <span>Integrações</span>
        <span className="sep">&gt;</span>
        <span
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => navigate('/sankhya')}
        >
          Sankhya
        </span>
        <span className="sep">&gt;</span>
        <span style={{ fontWeight: 600 }}>{title}</span>
      </Breadcrumb>

      <StubCard darkMode={darkMode}>
        <i className="pi pi-wrench" style={{ fontSize: '2.5rem', opacity: .6 }} />
        <p>Em desenvolvimento</p>
        <Button
          label="Voltar para o hub"
          icon="pi pi-arrow-left"
          onClick={() => navigate('/sankhya')}
          className="p-button-outlined"
          style={{
            borderColor: darkMode ? '#7c56e6' : '#7443f6',
            color: darkMode ? '#c9bdf5' : '#7443f6',
          }}
        />
      </StubCard>
    </Page>
  );
}