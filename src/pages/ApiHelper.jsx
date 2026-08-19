// src/pages/ApiHelper.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS, FEATURE_KEYS } from '../config/teamsConfig';

import ServiceHeader from '../components/ServiceHeader';
import ParamsModal from '../components/ParamsModal';
import ReadyActionsModal from '../components/apihub/ReadyActionsModal';
import BulkRequestStepper from '../components/apihub/BulkRequestStepper';
import CredencialCard from '../components/CredencialCard';
import {
  cancelBulkRequest,
  getApiHubCatalog,
  getReadyRequests,
  sendBulkRequestWithProgress,
  sendSingleRequest,
  validateUserKey,
} from '../services/apiHubService';

const Page = styled.div`
  padding: 1rem 1rem 2rem 0rem;
  max-width: 1460px;
  margin: auto;
`;

const FIELD_MIN_H = 72;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: ${FIELD_MIN_H}px;

  & > label {
    margin-bottom: 6px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-self: end;
  min-height: ${FIELD_MIN_H}px;
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(150px, 220px) 1fr;
  gap: 12px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
    & > .spacer {
      display: none;
    }
  }
`;

const Support = styled.small`
  display: block;
  height: 18px;
  line-height: 18px;
  opacity: 0.8;
  margin-top: 4px;
`;

const HeaderCard = styled(Card)`
  margin: 0 0 12px 0;
  border-radius: 14px !important;
  border: 1px dashed ${({ dark }) => (dark ? '#5b3cc4' : '#a88bff')};
  background: ${({ dark }) => (dark ? '#f0e7ff1a' : '#f5f2ff')};
  color: ${({ dark }) => (dark ? '#eae1ff' : '#2a115f')};
  box-shadow: ${({ dark }) =>
    dark
      ? '0 4px 16px rgba(0,0,0,0.35)'
      : '0 2px 8px rgba(100, 60, 180, 0.07)'} !important;
`;

const StyledLink = styled.a`
  text-decoration: underline;
  color: ${({ dark }) => (dark ? '#AB82FF' : '#610FC7')};

  &:hover {
    opacity: 0.9;
  }
`;

const UrlCard = styled(Card)`
  margin: 0.75rem 0 1rem 0;
  border-radius: 14px !important;
  border: 1px solid ${({ dark }) => (dark ? '#2a1f3d' : 'rgba(116,67,246,0.12)')} !important;
  box-shadow: ${({ dark }) =>
    dark
      ? '0 4px 16px rgba(0,0,0,0.4)'
      : '0 2px 10px rgba(100, 60, 180, 0.07)'} !important;

  .p-card-title {
    font-size: 1rem;
    opacity: 0.8;
  }
`;

const UrlPreview = styled.div`
  font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 1.05rem;
  word-break: break-all;
  padding: 0.75rem 1rem;
  background: ${({ dark }) => (dark ? '#120125' : '#f2efff')};
  border: 1.5px solid ${({ $methodColor, dark }) =>
    $methodColor ? `${$methodColor}66` : dark ? '#3b2a5e' : '#c9bbff'};
  border-radius: 12px;
  transition: border-color 0.2s ease;
`;

/* Botão roxo principal (Executar / Validar UK / Requisições prontas) */
const StyledButton = styled(Button)`
  background-color: var(--accent) !important;
  border-color: var(--accent) !important;
  color: #ffffff;
  height: 42px;
  font-size: 0.9rem;
  box-shadow: none;
  background-image: none;
  padding: 0 16px;

  &:hover:not(:disabled) {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
    filter: brightness(1.03);
  }

  &:focus {
    box-shadow: 0 0 0 1px var(--accent-soft);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: none;
  }
`;

/* Botão roxo claro (Requisição única / Parâmetros) */
const SoftPurpleButton = styled(Button)`
  background-color: var(--accent-soft-strong) !important;
  border-color: var(--accent-soft-strong) !important;
  color: var(--accent) !important;
  height: 42px;
  font-size: 0.85rem;
  box-shadow: none;
  background-image: none;
  padding: 0 14px;

  &:hover:not(:disabled) {
    filter: brightness(1.03);
  }

  &:disabled {
    opacity: 0.6;
    filter: none;
  }
`;

/* Card de conteúdo (single/bulk) */
const Section = styled.div`
  padding: 1rem;
  border-radius: 12px;
  background: ${({ dark }) => (dark ? '#14012b' : '#ffffff')};
  border: 1px solid ${({ dark }) => (dark ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};
  box-shadow: ${({ dark }) =>
    dark
      ? '0 4px 16px rgba(0,0,0,0.4)'
      : '0 2px 8px rgba(100, 60, 180, 0.06)'};

  .p-tag {
    background-color: ${({ dark }) =>
      dark ? 'rgba(153, 31, 224, 1)' : 'rgba(132, 9, 247, 1)'};
  }
`;

const TwoCols = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr auto;
  align-items: center;
`;

const Subtle = styled.small`
  opacity: 0.8;
`;

/* Dropdown estilizado – mesmo padrão visual em todo app */
const StyledDropdown = styled(Dropdown)`
  &.p-dropdown {
    background: ${({ $darkMode }) => ($darkMode ? '#201335' : '#ecececff')};
    border: 1px solid ${({ $darkMode }) => ($darkMode ? '#2A2A3D' : '#d4d4d8')};
    height: 42px;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }

  .p-dropdown-label {
    background: transparent !important;
    color: ${({ $darkMode }) => ($darkMode ? '#ffffff' : '#111827')};
    border: none !important;
    box-shadow: none !important;
    padding: 0 10px;
    font-size: 0.9rem;
  }

  .p-dropdown-trigger {
    background: transparent !important;
    border-left: none !important;
    width: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .p-dropdown-trigger-icon {
    color: ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')};
  }

  .p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
    background: ${({ $darkMode }) =>
      $darkMode ? '#38215e' : '#ede9ff'} !important;
    color: ${({ $darkMode }) =>
      $darkMode ? '#f9fafb' : '#111827'} !important;
  }

  &.p-dropdown.p-focus {
    border-color: ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')};
    box-shadow: 0 0 0 1px
      ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')}55;
  }
`;

/* Input de Query com mesmo visual do dropdown */
const StyledQueryInput = styled(InputText)`
  background: ${({ $darkMode }) => ($darkMode ? '#201335' : '#ecececff')};
  border: 1px solid ${({ $darkMode }) => ($darkMode ? '#2A2A3D' : '#d4d4d8')};
  color: ${({ $darkMode }) => ($darkMode ? '#ffffff' : '#111827')};
  height: 42px;
  padding: 0 10px;
  font-size: 0.9rem;

  &:focus {
    border-color: ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')};
    box-shadow: 0 0 0 1px
      ${({ $darkMode }) => ($darkMode ? '#a855f7' : '#8b5cf6')}55;
  }
`;

const QueryHelpers = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(116,67,246,0.3)' : 'rgba(116,67,246,0.25)')};
  background: transparent;
  color: ${({ $dark }) => ($dark ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.12)' : 'rgba(116,67,246,0.07)'};
    border-color: #7443f6;
  }
  &:disabled { opacity: 0.45; cursor: default; }
`;

const ExecSection = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: ${({ $dark }) => ($dark ? '#14012b' : '#ffffff')};
  border: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};
  box-shadow: ${({ $dark }) =>
    $dark
      ? '0 4px 16px rgba(0,0,0,0.4)'
      : '0 2px 8px rgba(100,60,180,0.06)'};
  margin-bottom: 24px;

  .p-tag { background-color: ${({ $dark }) =>
    $dark ? 'rgba(153,31,224,1)' : 'rgba(132,9,247,1)'}; }
`;

const ModeTabsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const ModeTab = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 2px solid
    ${({ $active, $dark }) =>
      $active ? '#7443f6' : $dark ? '#2a1f3d' : '#e5e7eb'};
  background: ${({ $active, $dark }) =>
    $active
      ? $dark ? 'rgba(116,67,246,0.14)' : 'rgba(116,67,246,0.07)'
      : $dark ? '#0e0020' : '#fafafa'};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
  transition: border-color 0.18s, background 0.18s;
  user-select: none;

  &:hover:not([data-disabled='true']) {
    border-color: ${({ $active }) => ($active ? '#7443f6' : '#a78bfa')};
    background: ${({ $dark }) =>
      $dark ? 'rgba(116,67,246,0.1)' : 'rgba(116,67,246,0.05)'};
  }
`;

const ReadyActionsSection = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: ${({ $dark }) => ($dark ? '#14012b' : '#ffffff')};
  border: 1px solid ${({ $dark }) => ($dark ? '#2a1f3d' : 'rgba(116,67,246,0.12)')};
  box-shadow: ${({ $dark }) =>
    $dark
      ? '0 4px 16px rgba(0,0,0,0.4)'
      : '0 2px 8px rgba(100,60,180,0.06)'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const MethodBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: ${({ $color }) => `${$color}22`};
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => `${$color}44`};
  margin-right: 8px;
  flex-shrink: 0;
`;

const METHOD_COLORS = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PATCH: '#f59e0b',
  DELETE: '#ef4444',
};

const API_BASE = 'https://api2.ploomes.com/';

const Info = ({ text, pos = 'top' }) => (
  <i
    className="pi pi-info-circle info-tip"
    data-pr-tooltip={text}
    data-pr-position={pos}
    style={{ opacity: 0.8, cursor: 'help' }}
  />
);

const TAG_SEVERITY_MAP = {
  Contacts: 'info',
  Deals: 'success',
  Fields: 'secondary',
  Tasks: 'warning',
  Products: null,
  Users: 'info',
  Automations: null,
  Forms: 'secondary',
};

/** Modal de Requisições Prontas (com busca + filtro por tag) */
function ReadyRequestsModal({ visible, onHide, onUse }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [tagFilter, setTagFilter] = useState('Todos');

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getReadyRequests();
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        console.error('Falha ao carregar requisições prontas', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  const allTags = ['Todos', ...Array.from(new Set(items.map((i) => i.tag).filter(Boolean)))];

  const filtered = items.filter((it) => {
    const matchQ = !q?.trim() || it.title.toLowerCase().includes(q.trim().toLowerCase()) ||
      (it.description || '').toLowerCase().includes(q.trim().toLowerCase());
    const matchTag = tagFilter === 'Todos' || it.tag === tagFilter;
    return matchQ && matchTag;
  });

  return (
    <Dialog
      header="Modelos de requisição"
      visible={visible}
      onHide={onHide}
      style={{ width: 960, maxWidth: '95vw' }}
      modal
      draggable={false}
    >
      {/* Search + close */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <span className="p-input-icon-left" style={{ flex: 1 }}>
          <i className="pi pi-search" />
          <InputText
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            style={{ width: '100%' }}
          />
        </span>
        <Button label="Fechar" icon="pi pi-times" onClick={onHide} text />
      </div>

      {/* Tag filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tag)}
            style={{
              padding: '3px 12px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: tagFilter === tag ? '#7443f6' : 'rgba(116,67,246,0.3)',
              background: tagFilter === tag ? '#7443f6' : 'transparent',
              color: tagFilter === tag ? '#fff' : '#7443f6',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: tagFilter === tag ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div
        style={{
          maxHeight: 420,
          overflow: 'auto',
          border: '1px solid var(--surface-border)',
          borderRadius: 10,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--surface-card)',
                zIndex: 1,
              }}
            >
              <th style={{ textAlign: 'left', padding: '10px' }}>Título</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Descrição</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Endpoint</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Método</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Tag</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: 'center', opacity: 0.7 }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: 8 }} />
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && filtered.map((it) => (
              <tr
                key={it.id}
                style={{ borderTop: '1px solid var(--surface-border)' }}
              >
                <td style={{ padding: '10px', fontWeight: 600 }}>{it.title}</td>
                <td style={{ padding: '10px', fontSize: '0.85rem', opacity: 0.85 }}>{it.description}</td>
                <td style={{ padding: '10px' }}>
                  <code>{it.endpoint}</code>
                </td>
                <td style={{ padding: '10px' }}>
                  <Tag value={it.method} />
                </td>
                <td style={{ padding: '10px' }}>
                  {it.tag && (
                    <Tag value={it.tag} severity={TAG_SEVERITY_MAP[it.tag] ?? null} />
                  )}
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  <Button
                    label="Usar"
                    icon="pi pi-check"
                    size="small"
                    onClick={() => { onUse(it); onHide(); }}
                  />
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 14, opacity: 0.8 }}>
                  Nenhum resultado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
}

export default function ApiHelper() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const { canDo } = useUserProfile();
  const toast = useRef(null);

  // permissions derivadas da matriz (team + nível) — ver teamsConfig.js
  const canPostPatch    = canDo(SERVICE_KEYS.APIHUB, FEATURE_KEYS.API_METHOD_WRITE); // POST/PATCH simples
  const canBulk         = canDo(SERVICE_KEYS.APIHUB, FEATURE_KEYS.API_BULK_CONFIG);  // ações em massa configuráveis
  const canReadyActions = canDo(SERVICE_KEYS.APIHUB, FEATURE_KEYS.API_READY_ACTIONS);// ações em massa prontas

  // cat / perms
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState({
    endpoints: [],
    odataParams: [],
    bulkAllowed: [],
  });

  // UK preview — conta validada no shape do CredencialCard
  const [userKey, setUserKey] = useState('');
  const [accountPreview, setAccountPreview] = useState(null);

  // request builder
  const [endpoint, setEndpoint] = useState(null);
  const [method, setMethod] = useState('GET');
  const [query, setQuery] = useState('');
  const [body, setBody] = useState('{ }');
  const [paramsVisible, setParamsVisible] = useState(false);
  const [readyVisible, setReadyVisible] = useState(false);
  const [readyActionsVisible, setReadyActionsVisible] = useState(false);

  // single: delete / patch id in path
  const [deleteId, setDeleteId] = useState('');
  const [patchUseId, setPatchUseId] = useState(false);
  const [patchId, setPatchId] = useState('');

  // bulk
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItemsRaw, setBulkItemsRaw] = useState('1,2,3');
  const [queryTemplate, setQueryTemplate] = useState('$filter=Id eq {{id}}');
  const [bodyTemplate, setBodyTemplate] = useState('{ "Id": {{id}} }');
  const [bulkPatchUseId, setBulkPatchUseId] = useState(true);

  // result modal
  const [resultOpen, setResultOpen] = useState(false);
  const [resultPayload, setResultPayload] = useState(null);
  const [resultTitle, setResultTitle] = useState('');

  // bulk loading modal
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkJobId, setBulkJobId] = useState(null);
  const [bulkCancelling, setBulkCancelling] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    current: 0,
    total: 0,
    logs: [],
    success: 0,
    failed: 0
  });
  const logsEndRef = useRef(null);

  function showSuccess(msg) {
    toast.current?.show({
      severity: 'success',
      summary: 'Sucesso',
      detail: msg,
      life: 3500,
    });
  }

  function showError(msg) {
    toast.current?.show({
      severity: 'error',
      summary: 'Erro',
      detail: msg,
      life: 6000,
    });
  }

  // load catalog and session
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getApiHubCatalog();
        if (!alive) return;
        setCatalog(
          data || { endpoints: [], odataParams: [], bulkAllowed: [] }
        );
        const first = data?.endpoints?.[0];
        if (first) {
          setEndpoint(first.name);
          setMethod(first.methods?.[0] || 'GET');
        }
      } catch (e) {
        showError(`Falha ao carregar catálogo: ${e?.message || e}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const endpointMeta = useMemo(
    () => catalog.endpoints?.find((e) => e.name === endpoint) || null,
    [catalog, endpoint]
  );

  const canBulkWrite    = canDo(SERVICE_KEYS.APIHUB, FEATURE_KEYS.API_BULK_WRITE);   // POST/PATCH em massa
  const canBulkDelete   = canDo(SERVICE_KEYS.APIHUB, FEATURE_KEYS.API_BULK_DELETE);  // DELETE em massa (gestor+)
  const canDeleteSingle = canDo(SERVICE_KEYS.APIHUB, FEATURE_KEYS.API_METHOD_DELETE);// DELETE simples

  const methodOptions = useMemo(() => {
    if (!endpointMeta) return [];
    const base = (endpointMeta.methods || [])
      .filter((m) => {
        if (m === 'POST' || m === 'PATCH') {
          if (bulkMode) return canBulkWrite;  // em massa
          return canPostPatch;                 // simples
        }
        return true; // GET sempre disponível
      })
      .map((m) => ({ label: m, value: m }));
    // DELETE simples e DELETE em massa seguem suas próprias features.
    if (endpointMeta.deleteAllowed && (bulkMode ? canBulkDelete : canDeleteSingle))
      base.push({ label: 'DELETE (restrito)', value: 'DELETE' });
    return base;
  }, [endpointMeta, canPostPatch, canBulkWrite, canBulkDelete, canDeleteSingle, bulkMode]);

  const bulkAllowedForEndpoint = useMemo(
    () => !!endpoint && catalog.bulkAllowed?.includes(endpoint),
    [catalog, endpoint]
  );

  function parseBulkItems(s) {
    const raw = String(s || '').trim();
    if (!raw) return [];
    const parts = raw
      .split(/[\s,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    return parts.map((p) => (isNaN(Number(p)) ? { id: p } : { id: Number(p) }));
  }

  function safeJson(s) {
    try {
      return JSON.parse(String(s || '{}'));
    } catch {
      return null;
    }
  }

  // Valida a UK no serviço do módulo e normaliza para o CredencialCard.
  async function onValidateUK(uk) {
    const { account } = await validateUserKey(uk);
    if (!account) throw new Error('UK válida, porém sem retorno de conta.');
    showSuccess('User-Key validada com sucesso.');
    return {
      accountId: account.id ?? account.Id ?? account.accountId ?? null,
      accountName: account.name ?? account.Name ?? null,
      logoUrl: account.logo ?? account.LogoUrl ?? null,
    };
  }

  // basePath para PREVIEW (usa meta.path quando existir)
  const previewBasePath = useMemo(
    () => endpointMeta?.path || endpoint || '<endpoint>',
    [endpointMeta, endpoint]
  );

  // preview path/query
  const previewPath = useMemo(() => {
    const m = String(method).toUpperCase();
    if (m === 'DELETE' && !bulkMode) {
      return previewBasePath
        ? `${previewBasePath}${deleteId ? `(${deleteId})` : '(ID)'}`
        : '<endpoint>';
    }
    if (m === 'PATCH' && !bulkMode && patchUseId) {
      return previewBasePath
        ? `${previewBasePath}${patchId ? `(${patchId})` : '(ID)'}`
        : '<endpoint>';
    }
    return previewBasePath || '<endpoint>';
  }, [method, deleteId, patchId, patchUseId, bulkMode, previewBasePath]);

  const previewQuery = useMemo(() => {
    const m = String(method).toUpperCase();
    if (m === 'DELETE' && !bulkMode) return '';
    const q = String(query || '');
    if (!q) return '';
    return q.trim().startsWith('?') ? q : `?${q}`;
  }, [method, query, bulkMode]);

  // Aplicar um template pronto
  function applyReadyRequest(t) {
    setReadyVisible(false);
    setEndpoint(t.endpoint);
    setMethod(t.method);

    if (t.bulk) {
      setBulkMode(true);
      setQueryTemplate(t.queryTemplate || '');
      setBodyTemplate(
        typeof t.bodyTemplate === 'string'
          ? t.bodyTemplate
          : JSON.stringify(t.bodyTemplate || {}, null, 2)
      );
      setBulkItemsRaw(t.itemsExample || '1,2,3');
      setPatchUseId(false);
      setBulkPatchUseId(!!t.pathWithId);
    } else {
      setBulkMode(false);
      setQuery(t.query || '');
      setBody(JSON.stringify(t.body ?? {}, null, 2));
      setDeleteId('');
      setPatchId('');
      setPatchUseId(false);
    }

    showSuccess('Requisição pronta aplicada.');
  }

  async function onCancelBulk() {
    if (!bulkJobId) return;
    try {
      setBulkCancelling(true);
      await cancelBulkRequest(bulkJobId);
      showSuccess('Cancelamento solicitado. Aguarde o item atual finalizar...');
    } catch (err) {
      showError(err?.message || 'Falha ao cancelar bulk.');
      setBulkCancelling(false);
    }
  }

  async function onRun() {
    try {
      if (!endpoint) return showError('Selecione um endpoint');
      if (!method) return showError('Selecione um método');

      const m = String(method).toUpperCase();

      // 1) BULK
      if (bulkMode) {
        if (!bulkAllowedForEndpoint)
          return showError('Ações em massa não permitidas para este endpoint.');
        const items = parseBulkItems(bulkItemsRaw);
        if (!items.length)
          return showError('Informe ao menos 1 item para a ação em massa.');

        const bodyObj = ['POST', 'PATCH', 'DELETE'].includes(m)
          ? safeJson(bodyTemplate)
          : undefined;

        // Mostrar modal de loading
        setBulkLoading(true);
        setBulkJobId(null);
        setBulkCancelling(false);
        setBulkProgress({
          current: 0,
          total: items.length,
          logs: [],
          success: 0,
          failed: 0
        });

        try {
          const resp = await sendBulkRequestWithProgress({
            endpoint,
            method: m,
            items,
            queryTemplate,
            bodyTemplate: bodyObj,
            userKeyOverride: userKey || undefined,
            pathWithId: m === 'DELETE' ? true : m === 'PATCH' && bulkPatchUseId,
            onProgress: (data) => {
              // Capturar jobId do evento start para permitir cancelamento
              if (data.jobId) setBulkJobId(data.jobId);

              // Atualizar progresso em tempo real
              setBulkProgress(prev => {
                const newState = {
                  current: data.current || prev.current,
                  total: data.total || prev.total,
                  logs: data.log ? [...prev.logs, data.log] : prev.logs,
                  success: data.success !== undefined ? data.success : prev.success,
                  failed: data.failed !== undefined ? data.failed : prev.failed
                };

                // Auto-scroll para o final dos logs
                setTimeout(() => {
                  logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);

                return newState;
              });
            }
          });

          setBulkLoading(false);
          setBulkJobId(null);
          const cancelledLabel = resp.cancelled ? ' (cancelado)' : '';
          setResultTitle(`Bulk ${m} — ${resp.success}/${resp.total} ok${cancelledLabel}`);
          setResultPayload(resp);
          setResultOpen(true);
          showSuccess(
            resp.cancelled
              ? `Bulk cancelado. Processados: ${resp.processed}/${resp.total} — Sucesso: ${resp.success}`
              : `Bulk finalizado. Sucesso: ${resp.success}/${resp.total}`
          );
        } catch (bulkErr) {
          setBulkLoading(false);
          setBulkJobId(null);
          throw bulkErr;
        }
        return;
      }

      // 2) REQUISIÇÃO ÚNICA
      let bodyObj = undefined;
      if (['POST', 'PATCH'].includes(m)) {
        bodyObj = safeJson(body);
        if (!bodyObj) return showError('Body inválido (JSON).');
      }

      let pathId = undefined;
      if (m === 'DELETE') {
        if (!deleteId?.trim())
          return showError('Informe o ID do item a ser deletado.');
        pathId = deleteId.trim();
      }
      if (m === 'PATCH' && patchUseId) {
        if (!patchId?.trim())
          return showError('Informe o ID do item a ser atualizado.');
        pathId = patchId.trim();
      }

      const r = await sendSingleRequest({
        endpoint,
        method: m,
        query,
        body: bodyObj,
        userKeyOverride: userKey || undefined,
        pathId,
      });

      setResultTitle(`${m} — ${r.status} (${r.durationMs}ms)`);
      setResultPayload(r.data ?? r);
      setResultOpen(true);
      showSuccess(`${m} OK — ${r.status} (${r.durationMs}ms)`);
    } catch (e) {
      setResultTitle('Erro');
      setResultPayload({
        erro: e?.message,
        status: e?.status,
        data: e?.data,
      });
      setResultOpen(true);
      showError(e?.message || 'Falha na requisição');
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <Page>
      <Tooltip
        target=".qt-tip"
        position="left"
        appendTo={document.body}
        showDelay={200}
      />
      <Tooltip
        target=".info-tip"
        position="top"
        appendTo={document.body}
        showDelay={200}
      />

      <Toast ref={toast} />

      {/* Cabeçalho + UK */}
      <HeaderCard dark={darkMode}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Lado esquerdo: header padronizado + links + dicas */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <ServiceHeader
              variant="standalone"
              platforms={['ploomes']}
              title="Central da API"
              subtitle="Monte, execute e acompanhe chamadas à API do Ploomes, uma a uma ou em massa."
              actions={<Info text="Monte e dispare requisições à API do Ploomes." />}
            />

            <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem' }}>
              Consulte{' '}
              <StyledLink
                dark={darkMode}
                href="https://suporte.ploomes.com/pt-BR/collections/9641138-api-webhooks"
                target="_blank"
                rel="noreferrer"
              >
                artigos de suporte
              </StyledLink>
              {' · '}
              <StyledLink
                dark={darkMode}
                href="https://developers.ploomes.com/"
                target="_blank"
                rel="noreferrer"
              >
                docs oficiais
              </StyledLink>
              .
            </p>

            <Button
              label="Documentação da API"
              icon="pi pi-book"
              className="p-button-sm"
              onClick={() => navigate('/ajuda/api')}
              style={{ marginBottom: 10 }}
            />

            <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
              <strong>Dicas:</strong>
              <ul style={{ margin: '4px 0 0 16px' }}>
                <li>Use <code>$select</code>, <code>$filter</code>, <code>$orderby</code>.</li>
                <li>Paginação: <code>$top</code> e <code>$skip</code>.</li>
                <li>Relacionais: <code>$expand</code> com <code>$select</code>/<code>$filter</code> internos.</li>
              </ul>
            </div>
          </div>

          {/* Lado direito: User-Key + account preview (CredencialCard unificado) */}
          <div style={{ minWidth: 280, maxWidth: 400, flex: 1 }}>
            <label style={{ fontSize: '0.9rem', display: 'block', marginBottom: 6 }}>
              <strong>User-Key</strong>{' '}
              <Info text="Usada nas chamadas deste módulo. Opcional — quando omitida, usa a UK da sessão." />
            </label>
            <CredencialCard
              compact
              uk={userKey}
              onUkChange={setUserKey}
              account={accountPreview}
              onAccountChange={setAccountPreview}
              onValidate={onValidateUK}
              label="User-Key"
              placeholder="cole sua User-Key"
            />
          </div>
        </div>
      </HeaderCard>

      {/* Pré-visualização + Query */}
      <UrlCard title="Pré-visualização da URL">
        <Toolbar>
          {/* ENDPOINT */}
          <Field>
            <label>
              <strong>Endpoint</strong>
            </label>
            <StyledDropdown
              $darkMode={darkMode}
              value={endpoint}
              options={(catalog.endpoints || []).map((e) => ({
                label: e.name,
                value: e.name,
              }))}
              onChange={(e) => {
                setEndpoint(e.value);
                // Sempre começa em GET (disponível para todos os perfis)
                setMethod('GET');
                setDeleteId('');
                setPatchId('');
              }}
              placeholder="Endpoint"
              style={{ width: '100%' }}
              disabled={loading}
            />
            <Support>
              {endpointMeta?.path ? (
                <>
                  Caminho real: <code>{endpointMeta.path}</code>
                </>
              ) : (
                '\u00A0'
              )}
            </Support>
          </Field>

          {/* MÉTODO */}
          <Field>
            <label>
              <strong>Método</strong>
            </label>
            <StyledDropdown
              $darkMode={darkMode}
              value={method}
              options={methodOptions}
              onChange={(e) => {
                setMethod(e.value);
              }}
              placeholder="Método"
              style={{ width: '100%' }}
              disabled={loading || !endpoint}
            />
            <Support>&nbsp;</Support>
          </Field>

          <div className="spacer" />
        </Toolbar>

        {/* URL Preview com badge de método e borda colorida */}
        <UrlPreview
          dark={darkMode}
          $methodColor={method ? METHOD_COLORS[String(method).toUpperCase()] : undefined}
          data-pr-tooltip="URL completa (somente leitura)"
          style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 12 }}
        >
          {method && (
            <MethodBadge $color={METHOD_COLORS[String(method).toUpperCase()] || '#888'}>
              {String(method).toUpperCase()}
            </MethodBadge>
          )}
          <span style={{ wordBreak: 'break-all' }}>
            <strong>{API_BASE}</strong>
            {previewPath}
            {previewQuery}
          </span>
        </UrlPreview>

        {/* Query OData */}
        <div style={{ marginTop: 12 }}>
          <label htmlFor="query" style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.9rem' }}>
            Query (OData)
          </label>
          <StyledQueryInput
            $darkMode={darkMode}
            id="query"
            className="p-inputtext-sm"
            placeholder="$select=Id,Name&$top=10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%' }}
            disabled={
              loading ||
              bulkMode ||
              (String(method).toUpperCase() === 'DELETE' && !bulkMode)
            }
          />
          <small style={{ opacity: 0.7, display: 'block', marginBottom: 4 }}>
            {bulkMode
              ? 'Modo em massa ativo — use o Query Template no stepper abaixo.'
              : 'Dica: use $select, $filter, $orderby, $top/$skip, $expand.'}
          </small>

          {/* GRUPO A — Auxiliares da query */}
          <QueryHelpers>
            <GhostBtn
              $dark={darkMode}
              onClick={() => setParamsVisible(true)}
              disabled={loading}
              title="Ver parâmetros OData disponíveis"
            >
              <i className="pi pi-search" style={{ fontSize: '0.75rem' }} />
              Parâmetros OData
            </GhostBtn>
            <GhostBtn
              $dark={darkMode}
              onClick={() => setReadyVisible(true)}
              disabled={loading}
              title="Carregar modelo de requisição pronto"
            >
              <i className="pi pi-list" style={{ fontSize: '0.75rem' }} />
              Modelos de requisição
            </GhostBtn>
          </QueryHelpers>
        </div>
      </UrlCard>

      {/* GRUPO B — Executar requisição */}
      <ExecSection $dark={darkMode}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Executar requisição</h3>
          {bulkMode && <Tag value="~75 req/min" severity="warning" />}
        </div>

        {/* Seleção de modo */}
        <ModeTabsRow>
          <ModeTab
            $active={!bulkMode}
            $dark={darkMode}
            onClick={() => setBulkMode(false)}
          >
            <i
              className="pi pi-play"
              style={{
                fontSize: '1.2rem',
                color: !bulkMode ? '#7443f6' : darkMode ? '#888' : '#aaa',
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Requisição única</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.65, marginTop: 2 }}>
                Uma chamada por vez
              </div>
            </div>
          </ModeTab>

          <ModeTab
            $active={bulkMode}
            $dark={darkMode}
            $disabled={!canBulk}
            data-disabled={!canBulk ? 'true' : undefined}
            onClick={() => {
              if (!canBulk) {
                showError('Ação em massa não disponível para o seu perfil de usuário. Contate seu gestor');
                return;
              }
              if ((method === 'POST' || method === 'PATCH') && !canBulkWrite) setMethod('GET');
              if (method === 'DELETE' && !canBulkDelete) setMethod('GET');
              setBulkMode(true);
            }}
            title={!canBulk ? 'Requer perfil com permissão superior' : undefined}
          >
            <i
              className="pi pi-bolt"
              style={{
                fontSize: '1.2rem',
                color: bulkMode ? '#7443f6' : darkMode ? '#888' : '#aaa',
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Modo em massa</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.65, marginTop: 2 }}>
                Múltiplas IDs com template
              </div>
            </div>
          </ModeTab>
        </ModeTabsRow>

        {!bulkMode ? (
          <>
            {String(method).toUpperCase() === 'DELETE' ? (
              <>
                <label htmlFor="delid">
                  <strong>ID para deletar</strong>
                </label>
                <InputText
                  id="delid"
                  value={deleteId}
                  onChange={(e) => setDeleteId(e.target.value)}
                  placeholder="Ex.: 414229357"
                  style={{ width: '100%', marginTop: 4 }}
                />
                <small style={{ opacity: 0.8, display: 'block', marginTop: 4 }}>
                  A requisição será enviada como{' '}
                  <code>{(endpointMeta?.path || endpoint) || '<endpoint>'}({deleteId || 'ID'})</code>.
                </small>
              </>
            ) : (
              <>
                {String(method).toUpperCase() === 'PATCH' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Checkbox
                      inputId="patchid"
                      onChange={(e) => setPatchUseId(e.checked)}
                      checked={patchUseId}
                    />
                    <label htmlFor="patchid">
                      <strong>Usar ID na URL (Endpoint(ID))</strong>
                    </label>
                    {patchUseId && (
                      <InputText
                        value={patchId}
                        onChange={(e) => setPatchId(e.target.value)}
                        placeholder="ID do registro"
                        style={{ marginLeft: 12, width: 220 }}
                      />
                    )}
                  </div>
                )}
                {['POST', 'PATCH'].includes(String(method).toUpperCase()) && (
                  <>
                    <label htmlFor="body" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Body (JSON)
                    </label>
                    <InputTextarea
                      id="body"
                      rows={10}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      style={{ width: '100%' }}
                      placeholder='{"Name":"Exemplo"}'
                    />
                  </>
                )}
              </>
            )}

            <div style={{ marginTop: 16 }}>
              <StyledButton
                label="Executar"
                icon="pi pi-play"
                onClick={onRun}
                disabled={loading || !endpoint || !method}
              />
            </div>
          </>
        ) : (
          <BulkRequestStepper
            darkMode={darkMode}
            userKey={userKey}
            endpoint={endpoint}
            setEndpoint={setEndpoint}
            method={method}
            setMethod={setMethod}
            methodOptions={methodOptions}
            catalog={catalog}
            loading={loading}
            endpointMeta={endpointMeta}
            bulkItemsRaw={bulkItemsRaw}
            setBulkItemsRaw={setBulkItemsRaw}
            queryTemplate={queryTemplate}
            setQueryTemplate={setQueryTemplate}
            bodyTemplate={bodyTemplate}
            setBodyTemplate={setBodyTemplate}
            bulkPatchUseId={bulkPatchUseId}
            setBulkPatchUseId={setBulkPatchUseId}
            onRun={onRun}
            bulkAllowedForEndpoint={bulkAllowedForEndpoint}
          />
        )}
      </ExecSection>

      {/* GRUPO C — Ações prontas */}
      {canReadyActions && (
        <>
          <Divider />
          <ReadyActionsSection $dark={darkMode}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>Ações prontas</h3>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '0.88rem' }}>
                Execute ações pré-configuradas sem montar a requisição manualmente.
              </p>
            </div>
            <StyledButton
              icon="pi pi-bolt"
              label="Abrir ações prontas"
              onClick={() => setReadyActionsVisible(true)}
            />
          </ReadyActionsSection>
        </>
      )}

      {/* Modal de carregamento - Bulk */}
      <Dialog
        header={`Processando ${method} em Massa`}
        visible={bulkLoading}
        onHide={() => {}}
        style={{ width: '600px', maxWidth: '95vw' }}
        modal
        blockScroll
        draggable={false}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '16px',
              opacity: 0.8,
              color: 'var(--accent)',
            }}
          >
            <i className="pi pi-spin pi-spinner" />
          </div>

          <h3 style={{ margin: '0 0 8px 0' }}>
            Processando requisições em massa...
          </h3>

          <p style={{ opacity: 0.8, margin: '0 0 16px 0', fontSize: '1rem' }}>
            Aguarde enquanto as requisições são processadas.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
              padding: '12px',
              background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)',
              borderRadius: '8px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>
                Processados
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                {bulkProgress.current}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                de {bulkProgress.total}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>
                Sucesso
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
                {bulkProgress.success}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                {bulkProgress.total > 0
                  ? `${Math.round((bulkProgress.success / bulkProgress.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>
                Falhas
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                {bulkProgress.failed}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                {bulkProgress.total > 0
                  ? `${Math.round((bulkProgress.failed / bulkProgress.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ fontWeight: 600 }}>Progresso geral:</span>
            <span style={{ opacity: 0.9 }}>
              {bulkProgress.total > 0
                ? `${Math.round((bulkProgress.current / bulkProgress.total) * 100)}%`
                : '0%'}
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: 'var(--surface-border)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--accent)',
                width: `${
                  bulkProgress.total > 0
                    ? (bulkProgress.current / bulkProgress.total) * 100
                    : 0
                }%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <small style={{ opacity: 0.6, display: 'block', marginBottom: '10px' }}>
            Isso pode levar alguns minutos dependendo da quantidade de itens
          </small>

          <Button
            label={bulkCancelling ? 'Cancelando...' : 'Cancelar'}
            icon={bulkCancelling ? 'pi pi-spin pi-spinner' : 'pi pi-times'}
            severity="danger"
            onClick={onCancelBulk}
            disabled={!bulkJobId || bulkCancelling}
            style={{ marginBottom: '10px' }}
          />

          {bulkProgress.logs.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                border: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  background: darkMode ? '#1a0a2e' : '#f9f9f9',
                  borderBottom: `1px solid ${darkMode ? '#3b2a5e' : '#e0e0e0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <strong style={{ fontSize: '0.9rem' }}>
                  Logs de Execução ({bulkProgress.logs.length})
                </strong>
                <small style={{ opacity: 0.7 }}>Últimos 10 registros</small>
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  background: darkMode ? '#120125' : '#fafafa',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  textAlign: 'left',
                }}
              >
                {bulkProgress.logs.slice(-10).map((log, idx) => {
                  const isSuccess = log.includes('✓');
                  const isError = log.includes('✗');

                  return (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        background: isSuccess
                          ? darkMode
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(34, 197, 94, 0.05)'
                          : isError
                          ? darkMode
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(239, 68, 68, 0.05)'
                          : 'transparent',
                        color: isSuccess
                          ? '#22c55e'
                          : isError
                          ? '#ef4444'
                          : 'inherit',
                        borderLeft: `3px solid ${
                          isSuccess ? '#22c55e' : isError ? '#ef4444' : 'transparent'
                        }`,
                        paddingLeft: '10px',
                      }}
                    >
                      {log}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Modal de resultado */}
      <Dialog
        header={resultTitle || 'Resultado'}
        visible={resultOpen}
        onHide={() => setResultOpen(false)}
        style={{ width: '900px', maxWidth: '95vw' }}
        modal
        blockScroll
        draggable={false}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(resultPayload, null, 2)}
        </pre>
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <Button
            label="Copiar JSON"
            icon="pi pi-copy"
            onClick={() =>
              navigator.clipboard.writeText(
                JSON.stringify(resultPayload ?? {}, null, 2)
              )
            }
            text
          />
          <Button
            label="Fechar"
            icon="pi pi-times"
            onClick={() => setResultOpen(false)}
          />
        </div>
      </Dialog>

      {/* Modais auxiliares */}
      <ParamsModal
        visible={paramsVisible}
        onHide={() => setParamsVisible(false)}
        params={catalog.odataParams || []}
      />
      <ReadyRequestsModal
        visible={readyVisible}
        onHide={() => setReadyVisible(false)}
        onUse={applyReadyRequest}
      />

      {canReadyActions && (
        <ReadyActionsModal
          visible={readyActionsVisible}
          onHide={() => setReadyActionsVisible(false)}
          userKey={userKey}
          darkMode={darkMode}
          toast={toast}
        />
      )}

    </Page>
  );
}
