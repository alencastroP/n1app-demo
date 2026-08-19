import { useState, useRef } from 'react';
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { Divider } from 'primereact/divider';
import { useDarkMode } from '../../DarkModeContext';
import {
  getAccountId,
  checkLogin,
  consultarParceiro,
  getCamposParceiro,
} from '../../services/sankhyaApi';

const Container = styled.div`
  min-height: 100vh;
  padding: 1rem 1rem 1rem 3rem;
  width: 100%;
  background-color: ${({ darkMode }) => (darkMode ? 'none' : 'none')};
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};

  h1 {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    margin-bottom: 0.5rem;
  }

  h2 {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  /* InputText */
  .p-inputtext {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')} !important;
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')} !important;
    border-radius: 4px;
  }

  .p-inputtext:focus {
    border-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#6e38c5ff')} !important;
    box-shadow: 0 0 0 0.2rem ${({ darkMode }) => (darkMode ? 'rgba(110, 56, 197, 0.25)' : 'rgba(110, 56, 197, 0.25)')} !important;
  }

  .p-inputtext::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#888888' : '#6c757d')} !important;
  }

  /* Buttons */
  .p-button {
    background-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')};
    border-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')};
    color: #fff;
  }

  .p-button:hover {
    background-color: ${({ darkMode }) => (darkMode ? '#7e4dd1' : '#5e49a6')};
    border-color: ${({ darkMode }) => (darkMode ? '#7e4dd1' : '#5e49a6')};
  }

  .p-button:disabled {
    background-color: ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e9ecef')};
    border-color: ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')};
    color: ${({ darkMode }) => (darkMode ? '#888888' : '#6c757d')};
  }

  /* Card */
  .p-card {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    box-shadow: ${({ darkMode }) => (darkMode ? '1.5px 1.5px 1.5px 1px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)')};
    border-radius: 1rem;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e1e5eb')};
  }

  .p-card .p-card-title {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  }

  /* DataTable */
  .p-datatable {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    border-radius: 1rem;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')};
  }

  .p-datatable-thead > tr > th {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0935ff' : '#f5f5f5ff')};
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};
    font-weight: bold;
    border-color: ${({ darkMode }) => (darkMode ? '#31293aff' : '#c5c5c5ff')};
  }

  .p-datatable-tbody > tr > td {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    border-bottom: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a6a' : '#dee2e6')};
  }

  .p-datatable-tbody > tr:hover > td {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f5f5f5')};
  }

  /* TabView */
  .p-tabview-nav {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    border-bottom: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')};
  }

  .p-tabview-nav-link {
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#495057')} !important;
  }

  .p-tabview-nav-link:hover {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f5f5f5')} !important;
  }

  .p-tabview-selected .p-tabview-nav-link {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#7443f6')} !important;
    border-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#7443f6')} !important;
  }

  .p-tabview-panels {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  }

  /* MultiSelect */
  .p-multiselect {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')} !important;
    color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#495057')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')} !important;
  }

  .p-multiselect-panel {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')} !important;
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')} !important;
  }

  .p-multiselect-item {
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')} !important;
  }

  .p-multiselect-item:hover {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f5f5f5')} !important;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
`;

const InfoText = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${({ darkMode }) => (darkMode ? '#a0a0a0' : '#6c757d')};
`;

const ResultCard = styled(Card)`
  margin-top: 1.5rem;
`;

const HeaderCard = styled(Card)`
  margin-bottom: 1.5rem;
  border-radius: 14px !important;
  border: 1px dashed ${({ darkMode }) => (darkMode ? '#5b3cc4' : '#a88bff')};
  background: ${({ darkMode }) => (darkMode ? '#f0e7ff1a' : '#f5f2ff')};
  color: ${({ darkMode }) => (darkMode ? '#eae1ff' : '#2a115f')};
`;

const HeaderLayout = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const InfoSection = styled.div`
  flex: 1;
  min-width: 280px;
`;

const UKSection = styled.div`
  min-width: 320px;
  max-width: 450px;
  flex: 1;
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  .p-inputtext {
    padding-right: 3rem;
  }

  .toggle-visibility {
    position: absolute;
    right: 10px;
    cursor: pointer;
    color: ${({ darkMode }) => (darkMode ? '#a0a0a0' : '#6c757d')};
    transition: color 0.2s;

    &:hover {
      color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
    }
  }
`;

const StyledButton = styled(Button)`
  background-color: var(--accent) !important;
  border-color: var(--accent) !important;
  color: #ffffff;
  height: 42px;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    filter: brightness(1.03);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const AccountCard = styled(Card)`
  margin-top: 0.75rem;
  border-radius: 12px !important;
`;

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;

    .label {
      font-weight: 600;
      opacity: 0.8;
    }

    .value {
      font-weight: 500;
    }
  }
`;

export default function SankhyaService() {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  // Estados gerais
  const [userKey, setUserKey] = useState('');
  const [showUserKey, setShowUserKey] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [sankhyaVersion, setSankhyaVersion] = useState('');
  const [validatingUK, setValidatingUK] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para Check Login
  const [loginResult, setLoginResult] = useState(null);

  // Estados para Consultar Parceiro
  const [codigoParceiro, setCodigoParceiro] = useState('');
  const [camposDisponiveis, setCamposDisponiveis] = useState([]);
  const [camposSelecionados, setCamposSelecionados] = useState([]);
  const [parceiroResult, setParceiroResult] = useState(null);

  // Validar User-Key e buscar dados da conta
  const handleValidateUserKey = async () => {
    if (!userKey) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'User-Key é obrigatória',
      });
      return;
    }

    setValidatingUK(true);
    try {
      const accountId = await getAccountId(userKey);

      // Buscar versão do Sankhya
      const versionResponse = await fetch('https://sankhya-query-api.ploomes.com/rt/v4/vrs', {
        method: 'GET',
        headers: {
          'user-key': userKey,
        },
      });

      const versionData = await versionResponse.json();

      setAccountData({ accountId });
      setSankhyaVersion(versionData.version || '');

      toast.current?.show({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'User-Key validada com sucesso',
      });
    } catch (error) {
      setAccountData(null);
      setSankhyaVersion('');
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: error.message,
      });
    } finally {
      setValidatingUK(false);
    }
  };

  // Check Login
  const handleCheckLogin = async () => {
    if (!accountData?.accountId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Valide a User-Key primeiro',
      });
      return;
    }

    setLoading(true);
    setLoginResult(null);
    try {
      const result = await checkLogin(accountData.accountId, userKey);
      setLoginResult(result);

      if (result.error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Erro no Login',
          detail: result.error,
        });
      } else {
        toast.current?.show({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Login verificado com sucesso',
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar campos disponíveis
  const handleLoadCampos = async () => {
    try {
      const campos = await getCamposParceiro();
      setCamposDisponiveis(campos);
      toast.current?.show({
        severity: 'success',
        summary: 'Sucesso',
        detail: `${campos.length} campos carregados`,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: error.message,
      });
    }
  };

  // Consultar Parceiro
  const handleConsultarParceiro = async () => {
    if (!accountData?.accountId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Valide a User-Key primeiro',
      });
      return;
    }

    if (!codigoParceiro) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Código do Parceiro é obrigatório',
      });
      return;
    }

    setLoading(true);
    setParceiroResult(null);
    try {
      const campos = camposSelecionados.length > 0
        ? camposSelecionados.map((c) => c.value)
        : undefined;

      const result = await consultarParceiro({
        accountId: Number(accountData.accountId),
        codigoParceiro,
        campos,
        userKey,
      });

      setParceiroResult(result);
      toast.current?.show({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Consulta realizada com sucesso',
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatar dados do parceiro para tabela
  const formatParceiroData = () => {
    if (!parceiroResult?.responseBody?.entities?.entity) return [];

    const entity = parceiroResult.responseBody.entities.entity;
    const metadata = parceiroResult.responseBody.entities.metadata?.fields?.field || [];

    const data = [];
    metadata.forEach((field, index) => {
      const key = `f${index}`;
      data.push({
        campo: field.name,
        valor: entity[key]?.$ || '-',
      });
    });

    return data;
  };

  return (
    <Container darkMode={darkMode}>
      <Toast ref={toast} />

      {/* Cabeçalho */}
      <HeaderCard darkMode={darkMode}>
        <HeaderLayout>
          <InfoSection>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Consultas Sankhya</h3>
            <p style={{ margin: 0, opacity: 0.85 }}>
              Realize consultas na integração Sankhya e visualize as informações formatadas.
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.75 }}>
              Insira sua User-Key ao lado para validar e começar a usar os serviços.
            </p>
          </InfoSection>

          <UKSection>
            <Label darkMode={darkMode}>
              <strong>User-Key</strong>
            </Label>
            <PasswordInputWrapper darkMode={darkMode}>
              <InputText
                type={showUserKey ? 'text' : 'password'}
                value={userKey}
                onChange={(e) => setUserKey(e.target.value)}
                placeholder="Cole sua User-Key"
                style={{ width: '100%' }}
              />
              <i
                className={`pi ${showUserKey ? 'pi-eye-slash' : 'pi-eye'} toggle-visibility`}
                onClick={() => setShowUserKey(!showUserKey)}
              />
            </PasswordInputWrapper>
            <div style={{ marginTop: '0.5rem' }}>
              <StyledButton
                label="Validar User-Key"
                icon="pi pi-check"
                onClick={handleValidateUserKey}
                loading={validatingUK}
                disabled={!userKey}
                style={{ width: '100%' }}
              />
            </div>

            {accountData && (
              <AccountCard>
                <AccountInfo>
                  <div className="info-row">
                    <span className="label">Account ID:</span>
                    <span className="value">{accountData.accountId}</span>
                  </div>
                  {sankhyaVersion && (
                    <div className="info-row">
                      <span className="label">Versão Sankhya:</span>
                      <span className="value">{sankhyaVersion}</span>
                    </div>
                  )}
                </AccountInfo>
              </AccountCard>
            )}
          </UKSection>
        </HeaderLayout>
      </HeaderCard>

      {/* Tabs de Consultas */}
      <TabView>
        {/* Tab 1: Check Login */}
        <TabPanel header="Check Login Rápido">
          <FormGroup>
            <p>Verifica o login e retorna o Bearer Token para autenticação no Sankhya.</p>
          </FormGroup>

          <Button
            label="Verificar Login"
            icon="pi pi-check-circle"
            onClick={handleCheckLogin}
            loading={loading}
            disabled={!accountData?.accountId}
          />

          {loginResult && (
            <ResultCard title="Resultado do Login">
              {loginResult.error ? (
                <p style={{ color: '#e74c3c' }}>Erro: {loginResult.error}</p>
              ) : (
                <>
                  <p><strong>Bearer Token:</strong></p>
                  <InputText
                    value={loginResult.bearerToken || ''}
                    readOnly
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  />
                </>
              )}
            </ResultCard>
          )}
        </TabPanel>

        {/* Tab 2: Consultar Parceiro */}
        <TabPanel header="Consultar Parceiro (TGFPAR)">
          <FormGroup>
            <Label darkMode={darkMode}>Código do Parceiro</Label>
            <InputText
              value={codigoParceiro}
              onChange={(e) => setCodigoParceiro(e.target.value)}
              placeholder="Digite o código do parceiro ou * para todos"
              style={{ width: '100%' }}
            />
            <InfoText darkMode={darkMode}>
              Use * para trazer todos os parceiros
            </InfoText>
          </FormGroup>

          <FormGroup>
            <Label darkMode={darkMode}>Campos a Retornar</Label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Button
                label="Carregar Campos Disponíveis"
                icon="pi pi-download"
                onClick={handleLoadCampos}
                size="small"
              />
            </div>
            <MultiSelect
              value={camposSelecionados}
              onChange={(e) => setCamposSelecionados(e.value)}
              options={camposDisponiveis}
              optionLabel="label"
              placeholder="Selecione os campos (vazio = campos padrão)"
              style={{ width: '100%' }}
              display="chip"
            />
            <InfoText darkMode={darkMode}>
              Deixe vazio para usar campos padrão: CODPARC, NOMEPARC, FORNECEDOR, CLIENTE, DTALTER
            </InfoText>
          </FormGroup>

          <Button
            label="Consultar Parceiro"
            icon="pi pi-search"
            onClick={handleConsultarParceiro}
            loading={loading}
            disabled={!accountData?.accountId || !codigoParceiro}
          />

          {parceiroResult && (
            <ResultCard title="Resultado da Consulta">
              {parceiroResult.status === '1' ? (
                <>
                  <p>
                    <strong>Total de registros:</strong>{' '}
                    {parceiroResult.responseBody?.entities?.total || 0}
                  </p>
                  <Divider />
                  <DataTable
                    value={formatParceiroData()}
                    responsiveLayout="scroll"
                    emptyMessage="Nenhum dado encontrado"
                  >
                    <Column field="campo" header="Campo" />
                    <Column field="valor" header="Valor" />
                  </DataTable>
                </>
              ) : (
                <p style={{ color: '#e74c3c' }}>
                  Erro na consulta. Status: {parceiroResult.status}
                </p>
              )}
            </ResultCard>
          )}
        </TabPanel>
      </TabView>
    </Container>
  );
}