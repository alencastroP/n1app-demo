// src/pages/GerenciarUsuarios.jsx
//
// - Admin: lista completa + edição de perfil (nível) e equipe.
// - Gestor: lista apenas dos usuários da própria equipe, em modo somente leitura.

import { useEffect, useMemo, useState, useRef, Fragment } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import styled from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import {
  PROFILES,
  LEVELS,
  LEVEL_LABELS,
  getLevel,
} from '../config/permissionsConfig';
import { TEAMS, TEAM_LABELS, getSelectableTeams } from '../config/teamsConfig';
import {
  fetchPermissionsUsers,
  fetchTeams,
  updateUserProfile,
  updateUserTeam,
} from '../services/userPermissionsService';
import UserHistoryDialog from '../components/UserHistoryDialog';

const Container = styled.div`
  min-height: 100vh;
  padding: 1rem 1rem 1rem 3rem;
  width: 100%;
  color: ${({ darkMode }) => (darkMode ? '#eee' : '#333')};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  color: ${({ darkMode }) => (darkMode ? '#ffffffff' : '#380468ff')};
  padding: 1rem 1rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const HeaderIcon = styled.i`
  font-size: 1.8rem;
  color: inherit;
  margin-right: 10px;
`;

const HeaderTitle = styled.h2`
  font-size: 1.8rem;
  margin: 0;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const PermissionsPanel = styled.div`
  background: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#f8f7fc')};
  border-radius: 0.75rem;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.5rem;
  box-shadow: ${({ darkMode }) =>
    darkMode ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.08)'};
  overflow-x: auto;
`;

const PermissionsTitle = styled.h3`
  font-size: 1.1rem;
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#380468')};
  margin: 0 0 1.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PermTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.84rem;
  min-width: 860px;
`;

const ThLabel = styled.th`
  text-align: left;
  padding: 0.6rem 0.9rem;
  background: ${({ darkMode }) => (darkMode ? '#2d1a4a' : '#ede9fe')};
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#380468')};
  border-bottom: 2px solid ${({ darkMode }) => (darkMode ? '#4c1d95' : '#c4b5fd')};
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 2;
  white-space: nowrap;
  border-radius: 0.5rem 0 0 0;
`;

const ThLevel = styled.th`
  text-align: center;
  padding: 0.5rem 0.5rem;
  background: ${({ colBg }) => colBg};
  color: ${({ colColor }) => colColor};
  border-bottom: 2px solid ${({ colColor }) => colColor};
  font-weight: 700;
  font-size: 0.74rem;
  white-space: pre-line;
  min-width: 78px;
  line-height: 1.25;
  &:last-child { border-radius: 0 0.5rem 0 0; }
`;

const SectionRow = styled.tr`
  td {
    background: ${({ darkMode }) => (darkMode ? '#241338' : '#efe9fb')};
    color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b21b6')};
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.5rem 0.9rem;
    position: sticky;
    left: 0;
  }
`;

const DataRow = styled.tr`
  &:hover td { filter: brightness(${({ darkMode }) => (darkMode ? '1.12' : '0.97')}); }
`;

const TdLabel = styled.td`
  text-align: left;
  padding: 0.42rem 0.9rem;
  background: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#f8f7fc')};
  color: ${({ darkMode }) => (darkMode ? '#ddd6fe' : '#4c1d95')};
  white-space: nowrap;
  font-size: 0.83rem;
  position: sticky;
  left: 0;
  z-index: 1;
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? '#2d1a4a' : '#ede9fe')};
`;

const TdCell = styled.td`
  text-align: center;
  padding: 0.42rem 0.5rem;
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? '#2d1a4a' : '#ede9fe')};
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;

  ${({ type, darkMode }) => {
    switch (type) {
      case 'basico': // acesso a partir do nível Básico (qualquer perfil)
        return `background: ${darkMode ? '#14532d' : '#dcfce7'}; color: ${darkMode ? '#4ade80' : '#15803d'};`;
      case 'geral':  // a partir do nível Geral
        return `background: ${darkMode ? '#1e3a5f' : '#dbeafe'}; color: ${darkMode ? '#60a5fa' : '#1d4ed8'};`;
      case 'gestor': // a partir do nível Gestor
        return `background: ${darkMode ? '#422006' : '#fef3c7'}; color: ${darkMode ? '#fbbf24' : '#92400e'};`;
      case 'admin':  // somente Admin
        return `background: ${darkMode ? '#450a0a' : '#fee2e2'}; color: ${darkMode ? '#f87171' : '#b91c1c'};`;
      case 'no':     // sem acesso
      default:
        return `background: ${darkMode ? '#1e1e2a' : '#f1f5f9'}; color: ${darkMode ? '#475569' : '#94a3b8'};`;
    }
  }}
`;

const ReadOnlyText = styled.span`
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b21b6')};
  font-weight: 500;
`;

const FootNote = styled.p`
  font-size: 0.78rem;
  line-height: 1.5;
  color: ${({ darkMode }) => (darkMode ? '#a78bfa' : '#6b21a8')};
  margin: 0.6rem 0 0;
  &:last-child { margin-bottom: 0; }
`;

// Opções para os dropdowns de edição (admin)
const LEVEL_OPTIONS_NEW = [
  { label: LEVEL_LABELS[LEVELS.BASICO], value: PROFILES.BASICO },
  { label: LEVEL_LABELS[LEVELS.NORMAL], value: PROFILES.NORMAL },
  { label: LEVEL_LABELS[LEVELS.GESTOR], value: PROFILES.GESTOR },
  { label: LEVEL_LABELS[LEVELS.ADMIN],  value: PROFILES.ADMIN  },
];

// Opções para o gestor: apenas Básico ↔ Geral (não cria gestor/admin).
const LEVEL_OPTIONS_GESTOR = [
  { label: LEVEL_LABELS[LEVELS.BASICO], value: PROFILES.BASICO },
  { label: LEVEL_LABELS[LEVELS.NORMAL], value: PROFILES.NORMAL },
];

// Opções estáticas de fallback (usadas até as equipes vivas carregarem).
const TEAM_OPTIONS_STATIC = getSelectableTeams()
  .concat([{ id: TEAMS.ADMS, name: TEAM_LABELS[TEAMS.ADMS] }])
  .map((t) => ({ label: t.name, value: t.id }));

// ─── Matriz única: serviço/ação (linha) × grupo de equipes (coluna) ──────────
//
// Cada célula indica o NÍVEL MÍNIMO necessário naquela equipe:
//   'B'    → Básico+   (qualquer perfil da equipe)
//   'G'    → Geral+
//   'GE'   → Gestor+
//   'X'    → sem acesso
//   string → texto literal (ex.: limite de logs)
// Admin tem acesso universal (nota de rodapé).
//
// Colunas agrupam equipes com regra idêntica. Equipes equivalentes:
//   • OUTRAS = Vendas, Marketing, Talent e Outros.
const PERM_COLS = [
  { key: 'n1',     label: 'Suporte\nN1',      color: '#7c3aed', darkColor: '#a78bfa', bg: '#f5f3ff', darkBg: '#2e1065' },
  { key: 'n2prod', label: 'Suporte N2\nProduto', color: '#2563eb', darkColor: '#60a5fa', bg: '#eff6ff', darkBg: '#1e3a8a' },
  { key: 'cs',     label: 'Customer\nSucess',  color: '#0d9488', darkColor: '#2dd4bf', bg: '#f0fdfa', darkBg: '#134e4a' },
  { key: 'ops',    label: 'Operações\n+ Estr.', color: '#ca8a04', darkColor: '#facc15', bg: '#fefce8', darkBg: '#422006' },
  { key: 'parc',   label: 'Parcerias',        color: '#db2777', darkColor: '#f472b6', bg: '#fdf2f8', darkBg: '#500724' },
  { key: 'up',     label: 'Univ.\nPloomes',   color: '#0891b2', darkColor: '#22d3ee', bg: '#ecfeff', darkBg: '#164e63' },
  { key: 'outras', label: 'Demais\náreas¹',   color: '#64748b', darkColor: '#94a3b8', bg: '#f1f5f9', darkBg: '#1e293b' },
];

// Atalhos para montar as linhas na mesma ordem de PERM_COLS:
//        [ n1,   n2prod, cs,   ops,  parc, up,   outras ]
const PERM_SECTIONS = [
  {
    title: 'Disponível para todas as áreas',
    rows: [
      ['Power BI',                         ['B','B','B','B','B','B','B']],
      ['Consulta de Importação',           ['B','B','B','B','B','B','B']],
      ['JSON para Excel',                  ['B','B','B','B','B','B','B']],
      ['Explorador de Campos',             ['B','B','B','B','B','B','B']],
      ['Filas por Shard',                  ['B','B','B','B','B','B','B']],
      ['Automações Ploomes',               ['B','B','B','B','B','B','B']],
      ['Central da API — abrir / GET',     ['B','B','B','B','B','B','B']],
      ['Sankhya — consulta de itens / login', ['B','B','B','B','B','B','B']],
    ],
  },
  {
    title: 'Central da API — por método',
    rows: [
      ['POST / PATCH (simples)',           ['B','B','G','G','G','G','G']],
      ['DELETE (simples)',                 ['G','G','X','X','X','X','X']],
      ['Ações em massa prontas',           ['G','G','G','G','X','X','X']],
      ['Ações em massa configuráveis',     ['G','G','X','X','X','X','X']],
      ['  └ POST/PATCH em massa',          ['G','G','X','X','X','X','X']],
      ['  └ DELETE em massa',              ['GE','GE','X','X','X','X','X']],
    ],
  },
  {
    title: 'Sankhya',
    rows: [
      ['Itens corrompidos',                ['G','G','G','G','X','X','X']],
      ['Troca de token',                   ['G','G','G','G','X','X','X']],
    ],
  },
  {
    title: 'Integrações e ferramentas',
    rows: [
      ['Omie',                             ['G','G','X','G','G','X','X']],
      ['  └ Sincronização da conta²',      ['G','G','X','G','G','X','X']],
      ['Troca de e-mail',                  ['G','G','G','G','G','G','G']],
      ['Tags Intercom',                    ['G','X','G','X','X','G','X']],
      ['Implementação Express',            ['B','X','X','X','X','X','X']],
      ['Extração de chamados³',            ['G','G','G','G','G','G','G']],
      ['Mesclagem de Entidades',           ['X','X','X','X','X','X','X']], // admin-only
    ],
  },
  {
    title: 'Assistente e análises',
    rows: [
      ['Copilot',                          ['G','G','G','G','G','G','G']],
      ['  └ Documentar conta',             ['G','G','G','G','G','G','G']],
      ['Buscas Intercom (Churn)',          ['GE','X','GE','GE','X','X','X']],
    ],
  },
  {
    title: 'Administração',
    rows: [
      ['Gerenciar Usuários⁴',              ['X','X','X','X','X','X','X']], // admin (gestor: visão filtrada)
    ],
  },
  {
    title: 'Changelog — limite de logs por extração',
    rows: [
      ['Perfil Básico',                    ['3.000','3.000','X','X','X','X','X']],
      ['Perfil Geral',                     ['5.000','5.000','3.000','3.000','X','X','X']],
      ['Perfil Gestor',                    ['10.000','10.000','5.000','5.000','X','X','X']],
    ],
  },
];

const CELL_META = {
  B:  { type: 'basico', text: 'Básico+' },
  G:  { type: 'geral',  text: 'Geral+'  },
  GE: { type: 'gestor', text: 'Gestor+' },
  X:  { type: 'no',     text: '—'       },
};

function CellBadge({ value, darkMode }) {
  const meta = CELL_META[value];
  if (meta) return <Badge type={meta.type} darkMode={darkMode}>{meta.text}</Badge>;
  // Valor literal (ex.: limite de logs "5.000")
  return <Badge type="geral" darkMode={darkMode}>{value}</Badge>;
}

export default function GerenciarUsuarios() {
  const { darkMode } = useDarkMode();
  const { isAdmin, isGestor, teamId: myTeamId } = useUserProfile();
  const toast = useRef(null);

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]); // [{ Id, Name }] vindos da conta de permissões
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(null);
  const [updatingTeam, setUpdatingTeam] = useState(null);
  const [search, setSearch] = useState('');
  const [showPerms, setShowPerms] = useState(false);
  const [historyUser, setHistoryUser] = useState(null); // usuário cujo histórico está aberto no modal

  // Rótulo de equipe: mistura o mapa estático (garante nomes internos) com as
  // equipes vivas da conta — assim novas equipes aparecem sem redeploy e
  // usuários dessas equipes deixam de cair em "sem equipe".
  const teamLabelMap = useMemo(() => {
    const map = { ...TEAM_LABELS };
    for (const t of teams) {
      if (t?.Id != null && t?.Name) map[Number(t.Id)] = t.Name;
    }
    return map;
  }, [teams]);
  const teamLabelOf = (id) => (id != null ? teamLabelMap[Number(id)] ?? null : null);

  // Opções do dropdown de equipe (admin): equipes vivas, ou o fallback estático.
  const teamOptions = useMemo(() => {
    if (teams.length === 0) return TEAM_OPTIONS_STATIC;
    return teams
      .map((t) => ({ label: t.Name, value: Number(t.Id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [teams]);

  // Filtra usuários: admin vê todos; gestor vê só da própria equipe.
  const scopedUsers = useMemo(() => {
    if (isAdmin) return users;
    if (isGestor) return users.filter((u) => Number(u.TeamId) === Number(myTeamId));
    return [];
  }, [users, isAdmin, isGestor, myTeamId]);

  useEffect(() => {
    if (isAdmin || isGestor) loadUsers();
  }, [isAdmin, isGestor]);

  async function loadUsers() {
    setLoading(true);
    try {
      // Equipes em paralelo — falha aqui não impede a lista (cai no mapa estático).
      const [data, teamList] = await Promise.all([
        fetchPermissionsUsers(),
        fetchTeams().catch(() => []),
      ]);
      setTeams(teamList);
      setUsers(data.map((u) => ({
        ...u,
        ProfileId: Number(u.ProfileId),
        TeamId:    u.TeamId != null ? Number(u.TeamId) : null,
      })));
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: err.message, life: 5000 });
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileChange(userId, newProfileId) {
    setUpdatingProfile(userId);
    try {
      await updateUserProfile(userId, newProfileId);
      setUsers((prev) =>
        prev.map((u) => (u.Id === userId ? { ...u, ProfileId: newProfileId } : u))
      );
      toast.current?.show({
        severity: 'success',
        summary: 'Nível atualizado',
        detail: `Usuário #${userId} → ${LEVEL_LABELS[getLevel(newProfileId)]}`,
        life: 3000,
      });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Erro ao atualizar', detail: err.message, life: 5000 });
    } finally {
      setUpdatingProfile(null);
    }
  }

  async function handleTeamChange(userId, newTeamId) {
    setUpdatingTeam(userId);
    try {
      await updateUserTeam(userId, newTeamId);
      setUsers((prev) =>
        prev.map((u) => (u.Id === userId ? { ...u, TeamId: newTeamId } : u))
      );
      toast.current?.show({
        severity: 'success',
        summary: 'Equipe atualizada',
        detail: `Usuário #${userId} → ${teamLabelOf(newTeamId) ?? newTeamId}`,
        life: 3000,
      });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Erro ao atualizar', detail: err.message, life: 5000 });
    } finally {
      setUpdatingTeam(null);
    }
  }

  if (!isAdmin && !isGestor) {
    return (
      <Container darkMode={darkMode}>
        <Header darkMode={darkMode}>
          <HeaderIcon className="pi pi-lock" />
          <HeaderTitle>Acesso restrito</HeaderTitle>
        </Header>
      </Container>
    );
  }

  // Body templates
  const profileBodyTemplate = (rowData) => {
    if (isAdmin) {
      return (
        <Dropdown
          value={rowData.ProfileId}
          options={LEVEL_OPTIONS_NEW}
          onChange={(e) => handleProfileChange(rowData.Id, e.value)}
          disabled={updatingProfile === rowData.Id}
          style={{ width: '180px' }}
          placeholder="Selecionar nível"
        />
      );
    }

    // Gestor: edita apenas usuários da própria equipe que estão no nível
    // básico ou geral (não pode alterar outros gestores/admins). A troca é
    // limitada a Básico ↔ Geral.
    const rowLevel = getLevel(rowData.ProfileId);
    const gestorCanEdit = isGestor && rowLevel < LEVELS.GESTOR;

    if (gestorCanEdit) {
      // Garante que o valor exibido seja uma das opções permitidas (Básico/Geral).
      const dropdownValue = rowLevel >= LEVELS.NORMAL ? PROFILES.NORMAL : PROFILES.BASICO;
      return (
        <Dropdown
          value={dropdownValue}
          options={LEVEL_OPTIONS_GESTOR}
          onChange={(e) => handleProfileChange(rowData.Id, e.value)}
          disabled={updatingProfile === rowData.Id}
          style={{ width: '180px' }}
          placeholder="Selecionar nível"
        />
      );
    }

    return (
      <ReadOnlyText darkMode={darkMode}>
        {LEVEL_LABELS[rowLevel] ?? '—'}
      </ReadOnlyText>
    );
  };

  const teamBodyTemplate = (rowData) => {
    if (!isAdmin) {
      return (
        <ReadOnlyText darkMode={darkMode}>
          {rowData.TeamId ? teamLabelOf(rowData.TeamId) ?? '—' : '— sem equipe —'}
        </ReadOnlyText>
      );
    }
    return (
      <Dropdown
        value={rowData.TeamId}
        options={teamOptions}
        onChange={(e) => handleTeamChange(rowData.Id, e.value)}
        disabled={updatingTeam === rowData.Id}
        style={{ width: '210px' }}
        placeholder="Selecionar equipe"
        filter
      />
    );
  };

  // Botão para ver o histórico do usuário da linha. Admin vê de qualquer um;
  // gestor, dos usuários da própria equipe (a lista já vem filtrada). O backend
  // reaplica a autorização — este botão é só o atalho.
  const historyBodyTemplate = (rowData) => (
    <Button
      icon="pi pi-history"
      className="p-button-text p-button-rounded p-button-secondary"
      tooltip="Ver histórico"
      tooltipOptions={{ position: 'left' }}
      onClick={() => setHistoryUser(rowData)}
      aria-label={`Ver histórico de ${rowData.Name || rowData.Email || 'usuário'}`}
    />
  );

  const filteredUsers = scopedUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      String(u.Name  || '').toLowerCase().includes(q) ||
      String(u.Email || '').toLowerCase().includes(q)
    );
  });

  const pageTitle = isAdmin
    ? 'Gerenciar Usuários'
    : `Usuários da equipe ${teamLabelOf(myTeamId) ?? ''}`;

  return (
    <Container darkMode={darkMode}>
      <Toast ref={toast} />

      <Header darkMode={darkMode}>
        <HeaderIcon className="pi pi-users" />
        <HeaderTitle>{pageTitle}</HeaderTitle>
      </Header>

      <Toolbar>
        <span className="p-input-icon-left" style={{ flex: 1, maxWidth: '360px' }}>
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            style={{ width: '100%' }}
          />
        </span>
        <Button
          label={showPerms ? 'Ocultar permissões' : 'Ver tabela de permissões'}
          icon={showPerms ? 'pi pi-eye-slash' : 'pi pi-shield'}
          className="p-button-outlined p-button-secondary"
          onClick={() => setShowPerms((v) => !v)}
        />
      </Toolbar>

      {showPerms && (
        <PermissionsPanel darkMode={darkMode}>
          <PermissionsTitle darkMode={darkMode}>
            <i className="pi pi-shield" />
            Permissões
          </PermissionsTitle>
          <p style={{ fontSize: '0.85rem', marginTop: 0, color: darkMode ? '#a78bfa' : '#6b21a8' }}>
            Cada célula mostra o <strong>nível mínimo</strong> que a equipe precisa ter para usar a
            funcionalidade. <strong>Básico+</strong> = qualquer perfil; <strong>Geral+</strong> e{' '}
            <strong>Gestor+</strong> = a partir desse nível ou superior; <strong>—</strong> = sem acesso.
          </p>

          {/* Legenda */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0 1rem' }}>
            <Badge type="basico" darkMode={darkMode}>Básico+</Badge>
            <Badge type="geral"  darkMode={darkMode}>Geral+</Badge>
            <Badge type="gestor" darkMode={darkMode}>Gestor+</Badge>
            <Badge type="no"     darkMode={darkMode}>— sem acesso</Badge>
          </div>

          <PermTable>
            <thead>
              <tr>
                <ThLabel darkMode={darkMode}>Funcionalidade</ThLabel>
                {PERM_COLS.map((col) => (
                  <ThLevel
                    key={col.key}
                    colColor={darkMode ? col.darkColor : col.color}
                    colBg={darkMode ? col.darkBg : col.bg}
                  >
                    {col.label}
                  </ThLevel>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_SECTIONS.map((section) => (
                <Fragment key={section.title}>
                  <SectionRow darkMode={darkMode}>
                    <td colSpan={PERM_COLS.length + 1}>{section.title}</td>
                  </SectionRow>
                  {section.rows.map(([label, vals]) => (
                    <DataRow key={label} darkMode={darkMode}>
                      <TdLabel darkMode={darkMode}>{label}</TdLabel>
                      {vals.map((v, i) => (
                        <TdCell key={i} darkMode={darkMode}>
                          <CellBadge value={v} darkMode={darkMode} />
                        </TdCell>
                      ))}
                    </DataRow>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </PermTable>

          <FootNote darkMode={darkMode}>
            <strong>¹ Demais áreas:</strong> Vendas, Marketing, Talent e Outros.
          </FootNote>
          <FootNote darkMode={darkMode}>
            <strong>² Omie — sincronização da conta:</strong> permitida apenas após as 18h para todos
            os perfis. O FirstSync a qualquer horário é exclusivo do Administrador.
          </FootNote>
          <FootNote darkMode={darkMode}>
            <strong>³ Extração de chamados:</strong> antiga "Buscas Ploomes".
          </FootNote>
          <FootNote darkMode={darkMode}>
            <strong>⁴ Gerenciar Usuários:</strong> edição completa (nível e equipe) é exclusiva do
            Administrador. Gestores gerenciam os usuários da própria equipe, alternando o nível
            entre <strong>Básico</strong> e <strong>Geral</strong> — não alteram equipe nem promovem
            a Gestor/Administrador.
          </FootNote>
          <FootNote darkMode={darkMode}>
            <strong>Perfil Administrador:</strong> tem acesso a todos os serviços e ações, independente
            da equipe.
          </FootNote>
        </PermissionsPanel>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <ProgressSpinner />
        </div>
      ) : (
        <DataTable
          value={filteredUsers}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 50]}
          sortField="Name"
          sortOrder={1}
          emptyMessage="Nenhum usuário encontrado."
          style={{ borderRadius: '0.7rem', overflow: 'hidden' }}
        >
          <Column field="Id"    header="Id"    sortable style={{ width: '80px' }} />
          <Column field="Name"  header="Nome"  sortable />
          <Column field="Email" header="Email" sortable />
          <Column
            header="Equipe"
            body={teamBodyTemplate}
            style={{ width: '230px' }}
          />
          <Column
            header="Nível"
            body={profileBodyTemplate}
            style={{ width: '200px' }}
          />
          <Column
            header="Histórico"
            body={historyBodyTemplate}
            style={{ width: '90px', textAlign: 'center' }}
            bodyStyle={{ textAlign: 'center' }}
          />
        </DataTable>
      )}

      <UserHistoryDialog
        visible={!!historyUser}
        user={historyUser}
        dm={darkMode}
        onHide={() => setHistoryUser(null)}
      />
    </Container>
  );
}
