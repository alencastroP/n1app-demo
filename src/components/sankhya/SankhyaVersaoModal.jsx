// src/components/sankhya/SankhyaVersaoModal.jsx
// Ação de diagnóstico: valida a versão (V2/V3) da integração Sankhya na conta
// e exibe o histórico de edições da integração retornado por LastIntegrations.
import { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import { getLastIntegrations, getClientSankhyaVersion } from '../../services/sankhyaApi';
import SankhyaModalHeader from './SankhyaModalHeader';

/* ── styled ─────────────────────────────────────────── */

const SectionShell = styled.div`
  background: ${({ darkMode }) => (darkMode ? '#201335' : '#f1f1f1')};
  border-top: 1px solid ${({ darkMode }) => (darkMode ? '#281546' : '#e6e6e6')};
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : 'inherit')};
`;

const VersionsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const VersionCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  background: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafa')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e1e5eb')};
`;

const LatestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: .6rem 1.2rem;
  font-size: .86rem;

  .label { opacity: .7; }
  .value { font-weight: 600; }
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  padding-top: .5rem;
  margin-top: auto;
`;

/* ── helpers ────────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR');
}

/* ── component ──────────────────────────────────────── */

export default function SankhyaVersaoModal({ visible, onHide, userKey, env, account }) {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);

  const [clientVersionLoading, setClientVersionLoading] = useState(false);
  const [clientVersion, setClientVersion] = useState(null);

  // `cancelled` evita que uma consulta antiga sobrescreva o estado de uma mais recente
  // (ex: conta/ambiente mudam enquanto a request anterior ainda está em voo).
  async function fetchVersion(isCancelled = () => false) {
    if (!account?.id || !userKey) return;
    try {
      setLoading(true);
      const { version: v, latest: l, history: h } = await getLastIntegrations({
        accountId: account.id,
        userKey,
        env,
      });
      if (isCancelled()) return;
      setVersion(v);
      setLatest(l);
      setHistory(Array.isArray(h) ? h : []);
    } catch (err) {
      if (isCancelled()) return;
      setVersion(null);
      setLatest(null);
      setHistory([]);
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: err?.message || 'Falha ao consultar a versão da integração.',
        life: 6000,
      });
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }

  // Versão do Sankhya (SK) instalado no cliente — usada para abrir chamados
  // com o suporte da Sankhya. Falha aqui não deve derrubar a versão da integração.
  async function fetchClientVersion(isCancelled = () => false) {
    if (!account?.id || !userKey) return;
    try {
      setClientVersionLoading(true);
      const { version: v } = await getClientSankhyaVersion({ userKey, env });
      if (isCancelled()) return;
      setClientVersion(v);
    } catch (err) {
      if (isCancelled()) return;
      setClientVersion(null);
      toast.current?.show({
        severity: 'warn',
        summary: 'Versão do Sankhya indisponível',
        detail: err?.message || 'Falha ao consultar a versão do Sankhya no cliente.',
        life: 6000,
      });
    } finally {
      if (!isCancelled()) setClientVersionLoading(false);
    }
  }

  function fetchAll(isCancelled = () => false) {
    fetchVersion(isCancelled);
    fetchClientVersion(isCancelled);
  }

  // Consulta automaticamente ao abrir
  useEffect(() => {
    if (!visible) {
      setVersion(null); setLatest(null); setHistory([]);
      setClientVersion(null);
      return undefined;
    }
    let cancelled = false;
    fetchAll(() => cancelled);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, account?.id, env]);

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={<SankhyaModalHeader icon="pi pi-sitemap" title="Versão da integração" env={env} account={account} />}
        visible={visible}
        onHide={onHide}
        modal
        style={{ width: 'min(880px, 95vw)' }}
        contentStyle={{ padding: 0 }}
      >
        <SectionShell darkMode={darkMode}>

          {/* Versão atual + última edição */}
          <VersionsRow>
            <VersionCard darkMode={darkMode}>
              <i className="pi pi-sitemap" style={{ fontSize: 28, opacity: .7 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>Versão da integração</span>
                  {loading ? (
                    <span style={{ opacity: .8 }}>
                      <i className="pi pi-spin pi-spinner" style={{ marginRight: 6 }} />verificando…
                    </span>
                  ) : version != null ? (
                    <Tag value={`V${version}`} severity={Number(version) >= 3 ? 'info' : 'warning'} />
                  ) : (
                    <span style={{ opacity: .7 }}>—</span>
                  )}
                </div>

                {latest && (
                  <LatestGrid>
                    <div><span className="label">Integração (Id): </span><span className="value">{latest.Id ?? '—'}</span></div>
                    <div><span className="label">Habilitada em: </span><span className="value">{fmtDate(latest.EnabledOn)}</span></div>
                    <div><span className="label">Ativada em: </span><span className="value">{fmtDate(latest.ActivatedOn)}</span></div>
                    <div><span className="label">Responsável (UserId): </span><span className="value">{latest.UserId ?? '—'}</span></div>
                  </LatestGrid>
                )}
              </div>
            </VersionCard>

            <VersionCard darkMode={darkMode}>
              <i className="pi pi-box" style={{ fontSize: 28, opacity: .7 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>Versão do Sankhya (cliente)</span>
                  {clientVersionLoading ? (
                    <span style={{ opacity: .8 }}>
                      <i className="pi pi-spin pi-spinner" style={{ marginRight: 6 }} />verificando…
                    </span>
                  ) : clientVersion ? (
                    <Tag value={clientVersion} severity="success" />
                  ) : (
                    <span style={{ opacity: .7 }}>—</span>
                  )}
                </div>
                <div style={{ fontSize: '.8rem', opacity: .7 }}>
                  Use este número ao abrir chamados com o suporte da Sankhya.
                </div>
              </div>
            </VersionCard>
          </VersionsRow>

          {/* Histórico de edições */}
          {history.length > 0 && (
            <div>
              <div style={{ fontSize: '.85rem', opacity: .8, marginBottom: 8 }}>
                Histórico de edições da integração ({history.length})
              </div>
              <DataTable
                value={history}
                responsiveLayout="scroll"
                scrollable
                scrollHeight="320px"
                size="small"
                stripedRows
                emptyMessage="Sem histórico"
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${darkMode ? '#2a1f3d' : '#dee2e6'}`,
                }}
              >
                <Column field="Id" header="Id" style={{ minWidth: 90 }} sortable />
                <Column field="Version" header="Versão" body={(r) => `V${r.Version}`} style={{ minWidth: 90 }} sortable />
                <Column field="UserId" header="UserId" style={{ minWidth: 120 }} sortable />
                <Column header="Habilitada em" body={(r) => fmtDate(r.EnabledOn)} style={{ minWidth: 170 }} sortable sortField="EnabledOn" />
                <Column header="Ativada em" body={(r) => fmtDate(r.ActivatedOn)} style={{ minWidth: 170 }} sortable sortField="ActivatedOn" />
                <Column header="Substituída em" body={(r) => fmtDate(r.ReplacedIn)} style={{ minWidth: 170 }} sortable sortField="ReplacedIn" />
              </DataTable>
            </div>
          )}

          <FooterBar>
            <Button
              label="Reconsultar"
              icon="pi pi-refresh"
              loading={loading || clientVersionLoading}
              disabled={loading || clientVersionLoading || !account?.id}
              onClick={() => fetchAll()}
              style={{
                background: 'linear-gradient(90deg, rgba(136,45,255,1) 0%, rgba(153,31,224,1) 100%)',
                border: 'none',
              }}
            />
          </FooterBar>

        </SectionShell>
      </Dialog>
    </>
  );
}
