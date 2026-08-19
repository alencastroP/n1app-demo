// components/powerbi/PowerBITabsSection.jsx
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import PowerBITabCard from './PowerBITabsCard';

const StyledExportContainer = styled(Card)`
  width: 100%;
  box-shadow: ${({ darkMode }) =>
    darkMode
      ? '0 4px 16px rgba(0,0,0,0.5)'
      : '0 2px 10px rgba(100, 60, 180, 0.08)'};
  border-radius: 12px;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};
  margin: auto auto 2rem auto;
  max-width: 1460px;
  background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#ffffff')};
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};
  padding: 5px 5px 15px 5px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const SectionTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const SectionTitle = styled.h3`
  text-align: start;
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#1e0c45')};
  margin: 0;
  font-weight: bold;
  font-size: 1.4rem;
`;

const AccountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: ${({ darkMode }) => (darkMode ? '#b0a8d4' : '#7443f6')};
  font-weight: 500;
`;

const ExportButton = styled(Button)`
  background: linear-gradient(90deg, #1a7a4a 0%, #1e8f55 100%);
  border-color: #1a7a4a;
  color: #fff;
  font-size: 0.875rem;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #145e38 !important;
    border-color: #145e38 !important;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const Cards = styled.div`
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  margin-top: 1.25rem;
`;

const StyledMessage = styled(Message)`
  margin: 0;

  &.p-message-error {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.1)')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#f44336' : '#f44336')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#d32f2f')};
  }

  &.p-message-success {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#4caf50' : '#4caf50')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#2e7d32')};
  }

  &.p-message-warn {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.1)')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#ff9800' : '#ff9800')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#f57c00')};
  }
`;

export default function PowerBITabsSection({
  darkMode,
  tabs,
  error,
  expandedTabs,
  onToggleDetails,
  onReadTab,
  onDownloadTab,
  accountKey,
  detailedMode,
  accountInfo,
  usersCache,
  onShareList,
  sharingList,
}) {
  if (tabs.length === 0 && !error) return null;

  const validTabs = tabs.filter(tab => tab && tab.tableName && tab.tableName.trim() !== '');

  return (
    <StyledExportContainer darkMode={darkMode}>
      {error && (
        <StyledMessage
          darkMode={darkMode}
          severity="error"
          text={error}
        />
      )}

      {validTabs.length > 0 && (
        <SectionHeader>
          <SectionTitleGroup>
            <SectionTitle darkMode={darkMode}>
              Abas exportadas
              <span style={{ fontSize: '1rem', fontWeight: 400, marginLeft: '0.5rem', opacity: 0.7 }}>
                ({validTabs.length})
              </span>
            </SectionTitle>
            {detailedMode && accountInfo && (
              <AccountBadge darkMode={darkMode}>
                <i className="pi pi-building" style={{ fontSize: '0.8rem' }} />
                {accountInfo.Name}
                <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>· ID {accountInfo.Id}</span>
              </AccountBadge>
            )}
          </SectionTitleGroup>

          {detailedMode && (
            <ExportButton
              icon="pi pi-share-alt"
              label={sharingList ? 'Gerando...' : 'Compartilhar lista de abas'}
              onClick={onShareList}
              disabled={sharingList || validTabs.length === 0}
            />
          )}
        </SectionHeader>
      )}

      <Cards>
        {validTabs.map((tab, idx) => (
          <PowerBITabCard
            key={idx}
            darkMode={darkMode}
            tab={tab}
            isExpanded={!!expandedTabs[idx]}
            onToggleDetails={() => onToggleDetails(idx)}
            onReadTab={() => onReadTab(tab)}
            onDownloadTab={() => onDownloadTab(tab)}
            accountKey={accountKey}
            detailedMode={detailedMode}
            userInfo={usersCache?.[tab?.userId] ?? null}
          />
        ))}
      </Cards>
    </StyledExportContainer>
  );
}
