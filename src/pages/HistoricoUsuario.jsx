// src/pages/HistoricoUsuario.jsx
// Histórico de ações do usuário logado — timeline agrupada por dia.
//
// Fonte primária: /api/user-history (via userHistoryService.getHistory()).
// A timeline em si vive em components/UserHistoryTimeline (compartilhada com o
// modal de Gerenciar Usuários). Aqui ficam o fetch do próprio histórico e a
// seção extra de registros legados em localStorage ('historicoExtracoes'),
// com o botão "Baixar novamente" preservando o comportamento original.

import { useState, useRef, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import styled from 'styled-components';
import { getHistory } from '../services/userHistoryService';
import { apiFetchRaw } from '../services/http';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import UserHistoryTimeline from '../components/UserHistoryTimeline';
import { FormShell } from '../design-system';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatLegacyDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return String(str);
  return d.toLocaleString('pt-BR');
}

function readLegacyHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem('historicoExtracoes') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// ─── Styled (só o que é exclusivo desta página: seção legado) ─────────────────
const LegacySection = styled.section`
  margin-top: 1.8rem;
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 14px;
  padding: 1.1rem 1.3rem;
`;

const LegacyHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 1rem;

  i { color: #f59e0b; font-size: 1.1rem; margin-top: 0.1rem; }
`;

const LegacyTitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#efeaff' : '#1E0C45')};
`;

const LegacyHint = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.6)' : '#7c6a9c')};
`;

const LegacyItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid ${({ $dm }) => ($dm ? '#241a3d' : '#f0ecff')};

  &:last-child { border-bottom: none; }
`;

const LegacyItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  font-size: 0.85rem;

  span { font-size: 0.75rem; opacity: 0.7; }
`;

const LegacyItemBody = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  font-size: 0.8rem;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.75)' : '#4f2e84')};
`;

// ─── Componente ──────────────────────────────────────────────────────────────
export default function HistoricoUsuario() {
  const { darkMode: dm } = useDarkMode();
  const toast = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [legacyItems, setLegacyItems] = useState([]);

  useEffect(() => {
    setLegacyItems(readLegacyHistory());
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getHistory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleLegacyRedownload(item) {
    confirmDialog({
      message: 'Deseja realmente reexecutar esta extração?',
      header: 'Confirmar reextração',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sim',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const resp = await apiFetchRaw('/api/changelog/extract', {
            method: 'POST',
            body: JSON.stringify(item.payloadCompleto),
          });
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'changelog_reextracao.xlsx';
          a.click();
          URL.revokeObjectURL(url);
          toast.current?.show({
            severity: 'success',
            summary: 'Reextração concluída',
            detail: 'Arquivo baixado com sucesso.',
            life: 3000,
          });
        } catch (err) {
          toast.current?.show({
            severity: 'error',
            summary: 'Erro ao rebaixar',
            detail: err?.message || 'Não foi possível concluir a operação.',
            life: 3000,
          });
        }
      },
    });
  }

  return (
    <FormShell
      width="narrow"
      header={(
        <ServiceHeader
          icon="pi pi-history"
          title="Histórico"
          subtitle="Suas ações recentes no N1 App"
        />
      )}
    >
      <Toast ref={toast} />
      <ConfirmDialog />

      <UserHistoryTimeline
        items={items}
        loading={loading}
        error={error}
        onReload={load}
        dm={dm}
      />

      {legacyItems.length > 0 && (
        <LegacySection $dm={dm}>
          <LegacyHeader>
            <i className="pi pi-exclamation-circle" />
            <div>
              <LegacyTitle $dm={dm}>Registros locais (legado)</LegacyTitle>
              <LegacyHint $dm={dm}>
                Esses registros ficam salvos apenas neste navegador — não fazem parte do
                histórico do servidor e não são sincronizados entre dispositivos.
              </LegacyHint>
            </div>
          </LegacyHeader>

          {legacyItems.map((item) => (
            <LegacyItem key={item.id} $dm={dm}>
              <LegacyItemHeader $dm={dm}>
                <strong>{item.accountInfo?.Name || 'Conta desconhecida'}</strong>
                <span>{formatLegacyDate(item.data)}</span>
              </LegacyItemHeader>
              <LegacyItemBody $dm={dm}>
                <span>{item.entidade} · {item.acao}</span>
                <span>Período: {item.periodo || '—'}</span>
                <span>{item.logsCount != null ? `${item.logsCount.toLocaleString?.() ?? item.logsCount} logs` : '—'}</span>
              </LegacyItemBody>
              <div>
                <Button
                  label="Baixar novamente"
                  icon="pi pi-download"
                  className="p-button-sm"
                  onClick={() => handleLegacyRedownload(item)}
                />
              </div>
            </LegacyItem>
          ))}
        </LegacySection>
      )}
    </FormShell>
  );
}
