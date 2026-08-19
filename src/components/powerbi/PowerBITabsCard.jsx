// components/powerbi/PowerBITabCard.jsx
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import ToggleButton from './ToggleButton';
import { ENTITY_LABEL, formatDate, statusFrom, buildPbiUrl, formatInterval, formatScheduledTime } from '../../utils/powerbiUtils';

const StyledCard = styled(Card)`
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(180deg, rgba(47, 38, 80, 0.98) 0%, rgba(36, 29, 56, 0.98) 100%)'
      : '#ffffff'
  };

  color: ${({ darkMode }) => (darkMode ? '#ece6ff' : '#4f3fa3')};

  box-shadow: ${({ darkMode }) =>
    darkMode
      ? '0 6px 18px rgba(0,0,0,.45)'
      : '0 2px 10px rgba(100, 60, 180, 0.1)'
  };

  border-radius: 16px;
  border: 1px solid ${({ darkMode }) =>
    darkMode ? 'rgba(73, 61, 109, 0.4)' : 'rgba(116,67,246,0.15)'
  };
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: ${({ darkMode }) =>
      darkMode
        ? '0 8px 24px rgba(116,67,246,0.25)'
        : '0 4px 18px rgba(100, 60, 180, 0.18)'};
    transform: translateY(-2px);
  }

  .p-card-title {
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#2a0a50')};
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.15rem;
  }

  .p-card-subtitle {
    color: ${({ darkMode }) => (darkMode ? '#d3c7fb' : '#7443f6')};
    font-size: 0.8rem;
    font-weight: 500;
  }

  .p-card-content {
    padding-top: 0.5rem;
    padding-bottom: 0.25rem;
  }

  .p-card-footer {
    padding-top: 0.5rem;
  }
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ ok, darkMode }) =>
    ok
      ? darkMode ? '#69e58a' : '#2e7d32'
      : darkMode ? '#ff6b6b' : '#c62828'};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  margin-top: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.07)' : 'rgba(116,67,246,0.04)')};
  font-size: 0.8rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
`;

const InfoLabel = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
  font-weight: 600;
`;

const InfoValue = styled.span`
  font-weight: 500;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#2a1760')};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.12)')};
  margin: 0.75rem 0;
`;

const DetailsWrapper = styled.div`
  max-height: ${({ expanded }) => (expanded ? '1200px' : '0')};
  opacity: ${({ expanded }) => (expanded ? 1 : 0)};
  overflow: hidden;
  transition: max-height 0.4s ease, opacity 0.3s ease;
  margin-top: ${({ expanded }) => (expanded ? '0.5rem' : '0')};
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#4f3fa3')};
`;

const DetailRow = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: baseline;

  b {
    white-space: nowrap;
    min-width: 120px;
    color: ${({ darkMode }) => (darkMode ? '#c4b8ff' : '#5a3d9e')};
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  span {
    word-break: break-all;
  }
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.65rem;
  border-radius: 10px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.1)' : 'rgba(116,67,246,0.06)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.25)' : 'rgba(116,67,246,0.15)')};
  margin-bottom: 0.6rem;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ darkMode }) => (darkMode ? '#7443f6' : '#c4a8ff')};
  flex-shrink: 0;
`;

const AvatarFallback = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.3)' : '#e0d4ff')};
  border: 2px solid ${({ darkMode }) => (darkMode ? '#7443f6' : '#c4a8ff')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ darkMode }) => (darkMode ? '#c4a8ff' : '#7443f6')};
  font-size: 0.85rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const UserName = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#331150')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserId = styled.span`
  font-size: 0.72rem;
  opacity: 0.6;
  color: ${({ darkMode }) => (darkMode ? '#c4b8ff' : '#7443f6')};
`;

const CopyRow = styled.div`
  margin-top: 0.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;

  input {
    width: 100%;
    padding: 0.4rem 0.65rem;
    border-radius: 8px;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#493d6d' : '#d9d9e3')};
    background: ${({ darkMode }) => (darkMode ? '#241d38' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1e0c45')};
    font-size: 0.8rem;
  }
`;

const CardButton = styled(Button)`
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(90deg, rgba(91, 20, 184, 1) 0%, rgba(110, 16, 165, 1) 100%)'
      : 'linear-gradient(90deg, rgba(136, 45, 255, 1) 0%, rgba(153, 31, 224, 1) 100%)'
  };
  border-color: ${({ darkMode }) => (darkMode ? '#7443f6' : '#7443f6')};
  color: #ffffff;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;

  &:hover:not(:disabled) {
    background-color: ${({ darkMode }) => (darkMode ? '#5e2ecf' : '#5e2ecf')} !important;
    border-color: ${({ darkMode }) => (darkMode ? '#5e2ecf' : '#5e2ecf')} !important;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const DownloadButton = styled(Button)`
  background: linear-gradient(90deg, #1a7a4a 0%, #1e8f55 100%);
  border-color: #1a7a4a;
  color: #fff;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;

  &:hover:not(:disabled) {
    background: #145e38 !important;
    border-color: #145e38 !important;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

export default function PowerBITabCard({
  darkMode,
  tab,
  isExpanded,
  onToggleDetails,
  onReadTab,
  onDownloadTab,
  accountKey,
  detailedMode,
  userInfo,
}) {
  const fullLink = (accountKey && tab?.escapedHash)
    ? buildPbiUrl(accountKey, tab.escapedHash)
    : '';

  const isOk = !tab?.lastRefreshErrorName;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fullLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <StyledCard
      darkMode={darkMode}
      title={tab?.tableName ?? 'Aba exportada'}
      subTitle={ENTITY_LABEL[tab?.tableEntityId] ?? `Entidade ${tab?.tableEntityId ?? ''}`}
      footer={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <CardButton
            darkMode={darkMode}
            label="Ver tabela"
            icon="pi pi-table"
            onClick={onReadTab}
            disabled={!tab?.escapedHash || !accountKey}
          />
          <DownloadButton
            label="Baixar Excel"
            icon="pi pi-file-excel"
            onClick={onDownloadTab}
            disabled={!tab?.escapedHash || !accountKey}
          />
          <ToggleButton
            darkMode={darkMode}
            expanded={isExpanded}
            label={isExpanded ? 'Menos infos' : 'Mais infos'}
            onClick={onToggleDetails}
          />
        </div>
      }
    >
      {/* Status + última atualização sempre visíveis */}
      <StatusRow ok={isOk} darkMode={darkMode}>
        <i className={`pi pi-${isOk ? 'check-circle' : 'exclamation-circle'}`} style={{ fontSize: '0.85rem' }} />
        {statusFrom(tab?.lastRefreshErrorName)}
        {tab?.isTableDeleted && (
          <span style={{ color: '#e74c3c', marginLeft: '0.4rem' }}>· Aba deletada</span>
        )}
      </StatusRow>

      <InfoGrid>
        <InfoItem>
          <InfoLabel>Última atualização</InfoLabel>
          <InfoValue darkMode={darkMode}>{formatDate(tab?.lastExportationDate)}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Intervalo</InfoLabel>
          <InfoValue darkMode={darkMode}>{formatInterval(tab?.exportationIntervalUnit, tab?.exportationIntervalValue)}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Horário</InfoLabel>
          <InfoValue darkMode={darkMode}>{formatScheduledTime(tab?.exportationIntervalInitialDayHour, tab?.exportationIntervalInitialDayMinutes)}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Expiração</InfoLabel>
          <InfoValue darkMode={darkMode}>{tab?.expirationDate ? formatDate(tab.expirationDate) : 'Sem expiração'}</InfoValue>
        </InfoItem>
      </InfoGrid>

      {/* Detalhes expansíveis */}
      <DetailsWrapper expanded={isExpanded} aria-hidden={!isExpanded}>
        <Divider darkMode={darkMode} />

        {/* Usuário — apenas modo detalhado */}
        {detailedMode && (
          <UserRow darkMode={darkMode}>
            {userInfo?.AvatarUrl ? (
              <UserAvatar
                darkMode={darkMode}
                src={userInfo.AvatarUrl}
                alt={userInfo.Name}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <AvatarFallback darkMode={darkMode}>
                <i className="pi pi-user" />
              </AvatarFallback>
            )}
            <UserInfo>
              <UserName darkMode={darkMode}>{userInfo?.Name ?? `Usuário ${tab?.userId}`}</UserName>
              <UserId darkMode={darkMode}>ID {tab?.userId ?? '—'}</UserId>
            </UserInfo>
          </UserRow>
        )}

        <DetailsList darkMode={darkMode}>
          {!detailedMode && (
            <DetailRow darkMode={darkMode}>
              <b>UserId</b>
              <span>{tab?.userId ?? '—'}</span>
            </DetailRow>
          )}
          <DetailRow darkMode={darkMode}>
            <b>Primeira export.</b>
            <span>{formatDate(tab?.firstExportationStartDate)}</span>
          </DetailRow>
          <DetailRow darkMode={darkMode}>
            <b>1ª export. concluída</b>
            <span>{tab?.firstExportationFinished ? 'Sim' : 'Não'}</span>
          </DetailRow>
          <DetailRow darkMode={darkMode}>
            <b>Timezone</b>
            <span>{tab?.lastTimezone ?? '—'}</span>
          </DetailRow>
          <DetailRow darkMode={darkMode}>
            <b>TableId</b>
            <span>{tab?.tableId ?? '—'}</span>
          </DetailRow>
          <DetailRow darkMode={darkMode}>
            <b>ExportationId</b>
            <span style={{ fontSize: '0.75rem' }}>{tab?.lastExportationId ?? '—'}</span>
          </DetailRow>
          <DetailRow darkMode={darkMode}>
            <b>Hash</b>
            <span style={{ fontSize: '0.72rem' }}>{tab?.escapedHash ?? '—'}</span>
          </DetailRow>
        </DetailsList>

        {fullLink && (
          <CopyRow darkMode={darkMode}>
            <input
              readOnly
              value={fullLink}
              onFocus={(e) => e.target.select()}
              aria-label="Link único do Power BI para esta aba"
            />
            <Button
              type="button"
              label="Copiar"
              icon="pi pi-copy"
              onClick={copyToClipboard}
              className="p-button-outlined"
              style={{ borderColor: '#7443f6', color: '#7443f6', backgroundColor: 'transparent', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
            />
          </CopyRow>
        )}
      </DetailsWrapper>
    </StyledCard>
  );
}
