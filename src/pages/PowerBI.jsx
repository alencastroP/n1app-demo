// pages/PowerBI.jsx
import { useMemo, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { Toast } from 'primereact/toast';

import { useDarkMode } from '../DarkModeContext';
import {
  getExportedTabs,
  readPowerBILink,
  getPloomesUser,
  getPloomesAccount,
} from '../services/powerbiService.js';

import ServiceHeader from '../components/ServiceHeader';
import PowerBIInputForm from '../components/powerbi/PowerBIInputForm';
import PowerBITabsSection from '../components/powerbi/PowerBITabsSection';
import PowerBITableSection from '../components/powerbi/PowerBITableSection';

import { parsePbiInput, buildPbiUrl, ENTITY_LABEL, formatDate } from '../utils/powerbiUtils';

const Container = styled.div`
  width: 100%;
  padding: 1.5rem;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1e0c45')};
  max-width: 1561px;
  box-sizing: border-box;
  overflow-x: hidden;
`;

// Remove caracteres inválidos para nome de sheet do Excel
const sanitizeSheetName = (name) =>
  String(name ?? 'aba').replace(/[:\\/?*[\]]/g, '_').slice(0, 31);

export default function PowerBI() {
  const toast = useRef(null);
  const [entry, setEntry] = useState('');
  const parsed = useMemo(() => parsePbiInput(entry), [entry]);
  const [tabs, setTabs] = useState([]);
  const [loadingTabs, setLoadingTabs] = useState(false);
  const [error, setError] = useState('');
  const { darkMode } = useDarkMode();
  const [table, setTable] = useState(null);
  const [loadingRead, setLoadingRead] = useState(false);
  const [currentAccountKey, setCurrentAccountKey] = useState('');
  const [currentTabName, setCurrentTabName] = useState('');
  const [expandedTabs, setExpandedTabs] = useState({});

  // Modo detalhado
  const [detailedMode, setDetailedMode] = useState(false);
  const [userKey, setUserKey] = useState('');
  // Conta validada normalizada: { accountId, accountName, logoUrl } | null
  const [account, setAccount] = useState(null);
  const [usersCache, setUsersCache] = useState({}); // { [userId]: { Id, Name, AvatarUrl } }
  const [sharingList, setSharingList] = useState(false);

  const handleToggleDetailedMode = () => {
    setDetailedMode((prev) => !prev);
    if (detailedMode) {
      // desligando — limpa estado detalhado
      setAccount(null);
    }
  };

  // Validador do CredencialCard: lança Error em falha, retorna conta normalizada.
  const handleValidateUserKey = async (uk) => {
    const acc = await getPloomesAccount(uk);
    if (!acc) throw new Error('Chave inválida');
    // Se já há abas carregadas, buscar usuários
    if (tabs.length > 0) {
      await fetchUsersForTabs(tabs, uk);
    }
    return {
      accountId: acc.Id ?? acc.id ?? null,
      accountName: acc.Name ?? acc.name ?? null,
      logoUrl: acc.LogoUrl ?? acc.logoUrl ?? acc.logo ?? null,
    };
  };

  const fetchUsersForTabs = useCallback(async (tabList, key) => {
    const uniqueIds = [...new Set(tabList.map((t) => t?.userId).filter(Boolean))];
    const result = {};
    await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const user = await getPloomesUser(id, key);
          if (user) result[id] = user;
        } catch {
          // ignora erros individuais
        }
      })
    );
    setUsersCache((prev) => ({ ...prev, ...result }));
  }, []);

  const handleConsult = async () => {
    setError('');
    setTabs([]);
    setTable(null);
    setUsersCache({});
    const ak = parsed.accountKey;
    if (!ak) return;

    setLoadingTabs(true);
    try {
      const data = await getExportedTabs(ak);
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setTabs(list);
      setCurrentAccountKey(ak);

      // Se modo detalhado com chave válida, busca usuários
      if (detailedMode && account && userKey) {
        await fetchUsersForTabs(list, userKey);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingTabs(false);
    }
  };

  const doReadLink = async (url, tabName = '') => {
    setError('');
    setTable(null);
    setCurrentTabName(tabName);
    setLoadingRead(true);
    try {
      const result = await readPowerBILink(url);
      setTable(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingRead(false);
    }
  };

  const handleReadFromInput = async () => {
    if (!parsed.isLink || !parsed.url) return;
    await doReadLink(parsed.url);
  };

  const handleCardRead = async (tab) => {
    const ak = parsed.accountKey || currentAccountKey;
    if (!ak || !tab?.escapedHash) {
      setError('Não foi possível montar o link desta aba (accountKey ou hash ausentes).');
      return;
    }
    const url = buildPbiUrl(ak, tab.escapedHash);
    setEntry(url);
    await doReadLink(url, tab.tableName ?? '');
  };

  const handleCardDownload = async (tab) => {
    const ak = parsed.accountKey || currentAccountKey;
    if (!ak || !tab?.escapedHash) {
      toast.current.show({ severity: 'error', summary: 'Erro', detail: 'Não foi possível montar o link desta aba (accountKey ou hash ausentes).', life: 5000 });
      return;
    }
    const url = buildPbiUrl(ak, tab.escapedHash);
    try {
      const result = await readPowerBILink(url);
      if (!result?.columns || !result?.rows) {
        toast.current.show({ severity: 'warn', summary: 'Aviso', detail: 'Não foi possível obter os dados desta aba para exportação.', life: 5000 });
        return;
      }
      exportToExcel(result.columns, result.rows, tab.tableName ?? 'aba');
      toast.current.show({ severity: 'success', summary: 'Excel gerado', detail: `"${tab.tableName}" baixado com sucesso.`, life: 4000 });
    } catch (e) {
      toast.current.show({ severity: 'error', summary: 'Erro', detail: e.message, life: 6000 });
    }
  };

  const exportToExcel = (columns, rows, sheetName) => {
    const data = [columns, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName));
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  };

  const handleShareList = async () => {
    setSharingList(true);
    try {
      const ak = parsed.accountKey || currentAccountKey;
      const validTabs = tabs.filter(t => t && t.tableName && t.tableName.trim() !== '');

      const rows = validTabs.map((tab) => {
        const user = usersCache[tab?.userId];
        return {
          'Nome da aba': tab.tableName ?? '—',
          'Entidade': ENTITY_LABEL[tab.tableEntityId] ?? `Entidade ${tab.tableEntityId ?? '—'}`,
          'Link Power BI': (ak && tab.escapedHash) ? buildPbiUrl(ak, tab.escapedHash) : '—',
          'Última atualização': formatDate(tab.lastExportationDate),
          'Usuário': user?.Name ?? (tab.userId ? `ID ${tab.userId}` : '—'),
          'UserId': tab.userId ?? '—',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      // Ajustar largura das colunas
      ws['!cols'] = [
        { wch: 30 },  // Nome da aba
        { wch: 20 },  // Entidade
        { wch: 80 },  // Link
        { wch: 22 },  // Última atualização
        { wch: 22 },  // Usuário
        { wch: 12 },  // UserId
      ];
      const wb = XLSX.utils.book_new();
      const accountName = account?.accountName ?? ak ?? 'conta';
      XLSX.utils.book_append_sheet(wb, ws, 'Abas PowerBI');
      XLSX.writeFile(wb, `PowerBI - ${accountName}.xlsx`);
      toast.current.show({ severity: 'success', summary: 'Lista exportada', detail: `Arquivo "PowerBI - ${accountName}.xlsx" gerado.`, life: 4000 });
    } catch (e) {
      toast.current.show({ severity: 'error', summary: 'Erro', detail: e.message, life: 6000 });
    } finally {
      setSharingList(false);
    }
  };

  const toggleTabDetails = (idx) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <Container darkMode={darkMode}>
      <Toast ref={toast} position="bottom-right" />
      <ServiceHeader
        platforms={['powerbi']}
        title="Power BI"
        subtitle="Consulte os vínculos e dados das integrações Power BI de uma conta Ploomes."
      />

      <PowerBIInputForm
        darkMode={darkMode}
        entry={entry}
        setEntry={setEntry}
        parsed={parsed}
        loadingTabs={loadingTabs}
        loadingRead={loadingRead}
        onConsult={handleConsult}
        onReadLink={handleReadFromInput}
        detailedMode={detailedMode}
        onToggleDetailedMode={handleToggleDetailedMode}
        userKey={userKey}
        setUserKey={setUserKey}
        account={account}
        onAccountChange={setAccount}
        onValidateUserKey={handleValidateUserKey}
      />

      <PowerBITabsSection
        darkMode={darkMode}
        tabs={tabs}
        error={error}
        expandedTabs={expandedTabs}
        onToggleDetails={toggleTabDetails}
        onReadTab={handleCardRead}
        onDownloadTab={handleCardDownload}
        accountKey={parsed.accountKey || currentAccountKey}
        detailedMode={detailedMode && !!account}
        accountInfo={account ? { Name: account.accountName, Id: account.accountId } : null}
        usersCache={usersCache}
        onShareList={handleShareList}
        sharingList={sharingList}
      />

      <PowerBITableSection
        darkMode={darkMode}
        table={table}
        tabName={currentTabName}
      />
    </Container>
  );
}
