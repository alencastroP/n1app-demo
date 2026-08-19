import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../DarkModeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { getChangelogLimit, LEVEL_LABELS } from '../config/permissionsConfig';
import { SERVICE_KEYS } from '../config/teamsConfig';
import DateRangeInputs from '../components/changelog/DateRangeInputs';
import CredencialCard from '../components/CredencialCard';
import ContaAtivaHint from '../components/ContaAtivaHint';
import ServiceHeader from '../components/ServiceHeader';
import {
  Container,
  ChangelogCard,
  Body,
  ErrorMessage,
  FormGrid,
  Section,
  SectionTitle,
  Grid2,
  Field,
  Label,
  CredencialSlot,
  SelectInput,
  MultiSelectInput,
  TogglePanelButton,
  SelectionPanel,
  SelectionTable,
  ActionsRow,
  Hint,
  SubmitButton,
  GlobalConfirmDialogStyle,
  GlobalChangelogLogFieldsPanelStyle,
} from '../styles/changelogStyles';

// Prime React
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Column } from 'primereact/column';

// Busca a conta dona da UK; lança Error em falha (contrato do CredencialCard).
const fetchAccount = async (uk) => {
  const r = await fetch('https://api2.ploomes.com/Account?$select=Id,Name', {
    headers: { 'User-Key': uk, 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error('Falha ao obter conta');
  const j = await r.json();
  const acc = j?.value?.[0];
  if (!acc) throw new Error('Conta não encontrada para esta User-Key');
  return acc;
};

export default function Changelog() {
  const navigate = useNavigate();
  const toast = useRef(null);

  const { darkMode } = useDarkMode();
  const [userKey, setUserKey] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [entity, setEntity] = useState(null);
  const [action, setAction] = useState(null);
  const [userId, setUserId] = useState([]);
  const [selectedFieldKeys, setSelectedFieldKeys] = useState([]);
  const [logFields, setLogFields] = useState([]);
  const [apiFields, setApiFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [apiUsers, setApiUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userPanelCollapsed, setUserPanelCollapsed] = useState(true);
  const [fieldsPanelCollapsed, setFieldsPanelCollapsed] = useState(true);
  const [accountInfo, setAccountInfo] = useState(null);
  const { profileId, teamId, level, canService } = useUserProfile();
  const maxLogs = getChangelogLimit(profileId, teamId);
  const profileLabel = LEVEL_LABELS[level] || 'seu perfil atual';

  if (!canService(SERVICE_KEYS.CHANGELOG)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#dc2626' }}>
        <i className="pi pi-lock" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem' }}>Acesso restrito</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  const resumoUsuarios = userId?.length
    ? `${userId.length} selecionado(s): ${userId.slice(0, 2).map((u) => u.Name).join(', ')}${userId.length > 2 ? '…' : ''}`
    : 'Selecionar usuário (opcional)';

  const resumoCampos = selectedFieldKeys?.length
    ? `${selectedFieldKeys.length} campo(s) selecionado(s)`
    : 'Selecionar campos por entidade (opcional)';

  // Exibida em ordem alfabética (label).
  const entityOptions = [
    { label: 'Automações', value: 103 },
    { label: 'Campo de formulário', value: 77 },
    { label: 'Cargos', value: 38 },
    { label: 'Cidade', value: 25 },
    { label: 'Clientes', value: 1 },
    { label: 'Documentos', value: 66 },
    { label: 'Estágio', value: 31 },
    { label: 'Funil', value: 44 },
    { label: 'Grupo do Produto', value: 11 },
    { label: 'Moeda', value: 17 },
    { label: 'Negócios', value: 2 },
    { label: 'Opções pré-cadastradas', value: 87 },
    { label: 'Produto', value: 10 },
    { label: 'Produto de cliente', value: 75 },
    { label: 'Propostas', value: 7 },
    { label: 'Registro de Interação', value: 36 },
    { label: 'Sua Empresa', value: 15 },
    { label: 'Tarefas', value: 12 },
    { label: 'Usuários', value: 24 },
    { label: 'Vendas', value: 4 },
    { label: 'Vínculo de produtos', value: 41 },
  ];

  const actionOptions = [
    { label: 'Criação', value: 1 },
    { label: 'Atualização', value: 2 },
    { label: 'Deleção', value: 3 },
    { label: 'Ganhar', value: 4 },
    { label: 'Perder', value: 5 },
    { label: 'Reabrir', value: 6 },
  ];

  const tzOffset = () => {
    const m = -new Date().getTimezoneOffset();
    const sign = m >= 0 ? '+' : '-';
    const hh = String(Math.floor(Math.abs(m) / 60)).padStart(2, '0');
    const mm = String(Math.abs(m) % 60).padStart(2, '0');
    return `${sign}${hh}:${mm}`;
  };

  const fetchAllUsers = async () => {
    if (!userKey?.trim()) return;

    setUsersLoading(true);
    try {
      const response = await fetch(`https://api2.ploomes.com/Users?$select=Id,Name,Email`, {
        method: 'GET',
        headers: {
          'User-Key': userKey,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);

      const data = await response.json();
      setApiUsers(data.value || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Validação silenciosa do debounce (mantém o comportamento antigo).
  const validateAccount = async (uk) => {
    try {
      if (!uk?.trim()) {
        setAccountInfo(null);
        return;
      }
      setAccountInfo(await fetchAccount(uk));
    } catch {
      setAccountInfo(null);
    }
  };

  // Validação manual via CredencialCard — normaliza para o shape do chip.
  const handleValidateUk = async (uk) => {
    const acc = await fetchAccount(uk);
    return { accountId: acc.Id, accountName: acc.Name, logoUrl: null };
  };

  const fetchAllFields = async () => {
    if (!userKey?.trim()) return;

    setFieldsLoading(true);
    try {
      let filterQuery = '';
      if (entity) filterQuery = `&$filter=Entity/Id eq ${entity}`;

      const response = await fetch(
        `https://api2.ploomes.com/Fields?$select=Id,Key,Name,Entity,UpdatePropertyName,Dynamic&$expand=Entity${filterQuery}`,
        {
          method: 'GET',
          headers: {
            'User-Key': userKey,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);

      const data = await response.json();
      setApiFields(data.value || []);
    } catch (err) {
      console.error('Erro ao buscar campos:', err);
      setError('Falha ao carregar campos. Verifique a User Key.');
    } finally {
      setFieldsLoading(false);
    }
  };

  useEffect(() => {
    if (userKey?.trim()) {
      fetchAllUsers();
      fetchAllFields();
    } else {
      setApiUsers([]);
      setApiFields([]);
    }
  }, [userKey]);

  useEffect(() => {
    const id = setTimeout(() => validateAccount(userKey), 2200);
    return () => clearTimeout(id);
  }, [userKey]);

  useEffect(() => {
    if (userKey?.trim()) fetchAllFields();
  }, [entity]);

  const formIsValid = () => {
    if (!userKey?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'User Key', detail: 'Informe a User Key.' });
      return false;
    }
    if (!startDate || !endDate) {
      toast.current?.show({ severity: 'warn', summary: 'Período', detail: 'Selecione as datas de início e término.' });
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Período inválido',
        detail: 'A data de término deve ser maior que a de início.',
      });
      return false;
    }
    if (!logFields.length) {
      toast.current?.show({ severity: 'warn', summary: 'Campos do Log', detail: 'Selecione ao menos um campo do log.' });
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const formatDateTime = (dateObj) => {
      const d = new Date(dateObj);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const HH = String(d.getHours()).padStart(2, '0');
      const MM = String(d.getMinutes()).padStart(2, '0');
      const SS = String(d.getSeconds()).padStart(2, '0');
      const MS = String(d.getMilliseconds()).padStart(3, '0');
      return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}.${MS}${tzOffset()}`;
    };

    const parts = [
      `DateTime: { $gte: new Date('${formatDateTime(startDate)}'), $lte: new Date('${formatDateTime(endDate)}') }`,
    ];
    if (entity) parts.push(`EntityId: ${entity}`);
    if (action) parts.push(`ActionId: ${action}`);

    if (Array.isArray(userId) && userId.length > 0) {
      const userIds = userId.map((u) => u.Id);
      if (userIds.length === 1) parts.push(`UserId: ${userIds[0]}`);
      else parts.push(`UserId: { $in: [${userIds.join(',')}] }`);
    }

    const filtroString = `{ ${parts.join(', ')} }`;
    const selectedKeys = selectedFieldKeys.map((f) => f.Key);

    const raiz = [];
    const dinamico = [];

    selectedKeys.forEach((key) => {
      const field = apiFields.find((f) => f.Key === key);
      if (!field) return;
      if (field.Dynamic) dinamico.push(field.Key);
      else raiz.push(field.UpdatePropertyName || field.Key);
    });

    const logFieldKeys = logFields.map((f) => (typeof f === 'object' ? f.key : f));

    const payload = {
      userKey,
      filtro: filtroString,
      camposRaiz: Array.from(new Set(raiz)),
      camposDinamico: Array.from(new Set(dinamico)),
      camposLog: logFieldKeys,
    };

    localStorage.setItem(
      'extracaoPayload',
      JSON.stringify({
        ...payload,
        startDate,
        endDate,
        entity,
        action,
        fieldKeys: selectedKeys,
      })
    );

    return payload;
  };

  const contarLogs = async (filtroStr) => {
    const r = await fetch('https://logs-api.ploomes.com/api/ChangeLog/Count', {
      method: 'POST',
      headers: { 'User-Key': userKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ Filter: filtroStr }),
    });
    if (!r.ok) throw new Error('Falha ao contar logs');
    return await r.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formIsValid()) return;

    try {
      const payload = buildPayload();
      const qtd = await contarLogs(payload.filtro);

      if (qtd === 0) {
        confirmDialog({
          header: 'Confirmar extração',
          icon: 'pi pi-info-circle',
          message: (
            <span>
              Não encontramos logs no período selecionado. <strong>A extração não será iniciada.</strong>
            </span>
          ),
          footer: (options) => (
            <div className="p-dialog-footer">
              <Button label="Voltar" icon="pi pi-arrow-left" className="p-button-text" onClick={options.reject} autoFocus />
            </div>
          ),
        });
        return;
      }

      if (qtd > maxLogs) {
        confirmDialog({
          header: 'Limite do perfil atingido',
          icon: 'pi pi-exclamation-triangle',
          message: (
            <span>
              Foram encontrados <strong style={{ color: '#d32f2f' }}>{qtd.toLocaleString()}</strong> logs no período selecionado.
              <br />
              <br />
              Seu perfil <strong>{profileLabel}</strong> restringe a extração a no máximo{' '}
              <strong>{maxLogs.toLocaleString()}</strong> logs por requisição.
              <br />
              <br />
              Ajuste os filtros (período, entidade, ação, usuário) para ficar abaixo do limite, ou solicite a um administrador uma elevação de perfil.
            </span>
          ),
          footer: (options) => (
            <div className="p-dialog-footer">
              <Button label="Voltar" icon="pi pi-arrow-left" className="p-button-text" onClick={options.reject} autoFocus />
            </div>
          ),
        });
        return;
      }

      confirmDialog({
        header: 'Confirmar extração',
        icon: 'pi pi-info-circle',
        message: (
          <>
            <span>
              Serão extraídos <strong style={{ color: '#1976d2' }}>{qtd.toLocaleString()}</strong> logs. Deseja seguir?
            </span>
            <ContaAtivaHint uk={userKey} />
          </>
        ),
        acceptLabel: 'Seguir',
        rejectLabel: 'Cancelar',
        accept: () => {
          const old = JSON.parse(localStorage.getItem('extracaoPayload') || '{}');
          localStorage.setItem(
            'extracaoPayload',
            JSON.stringify({
              ...old,
              logsCount: qtd,
              accountInfo: accountInfo || null,
            })
          );
          setIsLoading(true);
          navigate('/carregando', { replace: true });
          toast.current?.show({
            severity: 'info',
            summary: 'Extração iniciada',
            detail: 'Aguarde a geração do arquivo…',
            life: 2500,
          });
        },
      });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Contagem', detail: 'Não foi possível obter a contagem' });
    }
  };

  return (
    <Container darkMode={darkMode}>
      <Toast ref={toast} />
      <GlobalConfirmDialogStyle />
      <GlobalChangelogLogFieldsPanelStyle />
      <ConfirmDialog />

      <ChangelogCard darkMode={darkMode}>
        <ServiceHeader
          variant="band"
          platforms={['ploomes']}
          title="Extração de Changelog"
          subtitle="Extraia o histórico de alterações de uma conta Ploomes por período, entidade e ação."
        />

        <Body>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <FormGrid onSubmit={handleSubmit}>
            <Section darkMode={darkMode}>
              <SectionTitle darkMode={darkMode}>Credencial</SectionTitle>
              <Field>
                {/* CredencialSlot dá ao input da credencial a mesma superfície
                    dos demais campos sem mexer no CredencialCard, que é
                    compartilhado por outras 13 telas. */}
                <CredencialSlot darkMode={darkMode}>
                  <CredencialCard
                    uk={userKey}
                    onUkChange={setUserKey}
                    account={accountInfo ? { accountId: accountInfo.Id, accountName: accountInfo.Name, logoUrl: null } : null}
                    onAccountChange={(acc) => setAccountInfo(acc ? { Id: acc.accountId, Name: acc.accountName } : null)}
                    onValidate={handleValidateUk}
                    label="User Key"
                    placeholder="Insira a UK do usuário de integração"
                  />
                </CredencialSlot>
              </Field>
            </Section>

            <Section darkMode={darkMode}>
              <SectionTitle darkMode={darkMode}>Filtros</SectionTitle>
              <Field>
                <Label darkMode={darkMode}>Período</Label>
                <DateRangeInputs
                  darkMode={darkMode}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  toast={toast}
                />
              </Field>

              <Grid2 style={{ marginTop: '0.7rem' }}>
                <Field>
                  <Label darkMode={darkMode}>Entidade</Label>
                  <SelectInput
                    darkMode={darkMode}
                    value={entity}
                    onChange={(e) => setEntity(e.value)}
                    options={entityOptions}
                    placeholder="Selecionar entidade (opcional)"
                  />
                </Field>
                <Field>
                  <Label darkMode={darkMode}>Ação</Label>
                  <SelectInput
                    darkMode={darkMode}
                    value={action}
                    onChange={(e) => setAction(e.value)}
                    options={actionOptions}
                    placeholder="Selecionar ação (opcional)"
                  />
                </Field>
              </Grid2>
            </Section>

            <Section darkMode={darkMode}>
              <SectionTitle darkMode={darkMode}>Seleções avançadas</SectionTitle>

              <Field>
                <Label darkMode={darkMode}>Usuários</Label>
                <TogglePanelButton darkMode={darkMode} type="button" onClick={() => setUserPanelCollapsed((v) => !v)}>
                  {resumoUsuarios}
                </TogglePanelButton>
                {!userPanelCollapsed && (
                  <SelectionPanel darkMode={darkMode} className="no-header">
                    <SelectionTable
                      darkMode={darkMode}
                      value={apiUsers}
                      paginator
                      rows={10}
                      loading={usersLoading}
                      selection={userId}
                      onSelectionChange={(e) => setUserId(e.value)}
                      dataKey="Id"
                      filterDisplay="row"
                      globalFilterFields={['Name', 'Email']}
                      responsiveLayout="stack"
                      scrollable
                      scrollHeight="360px"
                      emptyMessage="Nenhum usuário encontrado"
                    >
                      <Column selectionMode="multiple" style={{ width: '3em' }} />
                      <Column field="Name" header="Nome" filter filterPlaceholder="Buscar nome" filterMatchMode="contains" showFilterMenu={false} />
                      <Column field="Email" header="Email" filter filterPlaceholder="Buscar email" filterMatchMode="contains" showFilterMenu={false} />
                    </SelectionTable>
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <Button className="p-button-text" label="Fechar" icon="pi pi-times" onClick={() => setUserPanelCollapsed(true)} />
                    </div>
                  </SelectionPanel>
                )}
              </Field>

              <Field style={{ marginTop: '0.7rem' }}>
                <Label darkMode={darkMode}>Campos da entidade (dados do item afetado)</Label>
                <Hint darkMode={darkMode} style={{ marginBottom: '0.35rem', display: 'block' }}>
                  Valores do registro que sofreu a ação — ex.: se um negócio foi criado, são os campos do próprio negócio (título, valor, etapa etc.).
                </Hint>
                <TogglePanelButton darkMode={darkMode} type="button" onClick={() => setFieldsPanelCollapsed((v) => !v)}>
                  {resumoCampos}
                </TogglePanelButton>
                {!fieldsPanelCollapsed && (
                  <SelectionPanel darkMode={darkMode} className="no-header">
                    <SelectionTable
                      darkMode={darkMode}
                      value={apiFields}
                      paginator
                      rows={10}
                      loading={fieldsLoading}
                      selection={selectedFieldKeys}
                      onSelectionChange={(e) => setSelectedFieldKeys(e.value)}
                      dataKey="Key"
                      filterDisplay="row"
                      globalFilterFields={['Name', 'Entity.DataSetName']}
                      responsiveLayout="stack"
                      scrollable
                      scrollHeight="360px"
                      emptyMessage="Nenhum campo encontrado"
                    >
                      <Column selectionMode="multiple" style={{ width: '3em' }} />
                      <Column field="Name" header="Nome" filter filterPlaceholder="Buscar campo" filterMatchMode="contains" showFilterMenu={false} />
                      <Column field="Entity.DataSetName" header="Entidade" filter filterPlaceholder="Buscar entidade" filterMatchMode="contains" showFilterMenu={false} />
                    </SelectionTable>
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <Button className="p-button-text" label="Fechar" icon="pi pi-times" onClick={() => setFieldsPanelCollapsed(true)} />
                    </div>
                  </SelectionPanel>
                )}
              </Field>

              <Field style={{ marginTop: '0.7rem' }}>
                <Label darkMode={darkMode}>Campos do log (metadados da ação)</Label>
                <Hint darkMode={darkMode} style={{ marginBottom: '0.35rem', display: 'block' }}>
                  Dados do próprio registro de log — quem fez, quando, qual ação, em qual item. Não são os valores do item, são os metadados da ação registrada.
                </Hint>
                <MultiSelectInput
                  value={logFields}
                  darkMode={darkMode}
                  onChange={(e) => setLogFields(e.value)}
                  options={[
                    { label: 'ItemId — ID do item afetado', value: 'ItemId' },
                    { label: 'EntityId — tipo da entidade', value: 'EntityId' },
                    { label: 'ActionId — tipo da ação', value: 'ActionId' },
                    { label: 'UserId — usuário que realizou', value: 'UserId' },
                    { label: 'DateTime — data e hora da ação', value: 'DateTime' },
                  ]}
                  placeholder="Selecione os campos do log"
                  panelClassName="changelog-log-fields-panel"
                  required
                />
              </Field>
            </Section>

            <ActionsRow>
              <Hint darkMode={darkMode}>
                Perfil <strong>{profileLabel}</strong> · limite de extração: <strong>{maxLogs.toLocaleString()}</strong> logs por requisição
              </Hint>
              <SubmitButton
                type="submit"
                label={isLoading ? 'Carregando...' : 'Iniciar Extração'}
                icon="pi pi-download"
                disabled={isLoading}
              />
            </ActionsRow>
          </FormGrid>
        </Body>
      </ChangelogCard>
    </Container>
  );
}
