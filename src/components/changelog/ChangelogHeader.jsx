// components/changelog/ChangelogHeader.jsx
import styled from 'styled-components';

const HeaderContainer = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#4d0779')};
`;

const AccountInfo = styled.p`
  display: block;
  margin-bottom: 10px;
  text-align: center;
  color: ${({ darkMode }) => (darkMode ? '#cfc7ff' : '#4d0779')};
  
  b {
    font-weight: 600;
  }
`;

export default function ChangelogHeader({ darkMode, accountInfo }) {
  return (
    <HeaderContainer>
      <Title darkMode={darkMode}>Configurar Extração de Changelog</Title>
      
      {accountInfo && (
        <AccountInfo darkMode={darkMode}>
          Conta: <b>{accountInfo.Name}</b> • AccountId: <b>{accountInfo.Id}</b>
        </AccountInfo>
      )}
    </HeaderContainer>
  );
}