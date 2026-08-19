// src/components/UserHistoryDialog.jsx
//
// Modal (Dialog) que mostra o histórico de OUTRO usuário — usado na tela de
// Gerenciar Usuários por Admin (qualquer usuário) e Gestor (só da própria equipe).
// Reusa UserHistoryTimeline; o fetch é getHistoryOf(email) (o backend autoriza).

import { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { getHistoryOf } from '../services/userHistoryService';
import UserHistoryTimeline from './UserHistoryTimeline';

export default function UserHistoryDialog({ visible, onHide, user, dm }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = user?.Email || '';

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const data = await getHistoryOf(email);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Carrega ao abrir; limpa ao fechar para não vazar o histórico de um usuário
  // ao abrir o de outro.
  useEffect(() => {
    if (visible && email) {
      load();
    } else if (!visible) {
      setItems([]);
      setError('');
    }
  }, [visible, email, load]);

  const headerNode = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <i className="pi pi-history" style={{ color: dm ? '#a78bfa' : '#7443f6' }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '1rem', fontWeight: 700 }}>
          Histórico — {user?.Name || 'Usuário'}
        </span>
        {email && (
          <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.7 }}>{email}</span>
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      header={headerNode}
      visible={visible}
      onHide={onHide}
      dismissableMask
      style={{ width: 'min(680px, 95vw)' }}
      contentStyle={{ paddingTop: '1rem' }}
    >
      <UserHistoryTimeline
        items={items}
        loading={loading}
        error={error}
        onReload={load}
        dm={dm}
      />
    </Dialog>
  );
}
