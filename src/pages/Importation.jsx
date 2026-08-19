import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import CredencialCard from '../components/CredencialCard';
import {
  postImportationData,
  getCreatorUser,
  getFieldsByKeys,
} from '../services/importationService';

const StyledContainer = styled(Card)`
  width: 100%;
  box-shadow: 0 2px 4px rgba(59, 59, 59, 0.3);
  border-radius: 6px;
  margin: auto auto 2rem auto;
  background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')};
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};

  .p-card .p-card-content {
    padding: 0px 0px;
  }
`;

const Title = styled.h2`
  text-align: start;
  color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#1e0c45')};
  margin: 0;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 0.5rem;
  max-width: 1600px;
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  .p-input-icon-left, 
  .p-input-icon-right { 
    vertical-align: middle;
    width: 100%; 
  }
`;

const RowTwoColumns = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 0.5rem;
  max-width: 1600px;
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  .p-input-icon-left, 
  .p-input-icon-right { 
    vertical-align: middle;
    width: 100%; 
  }
`;

const StyledInputWrapper = styled.span`
  width: 100%;
  position: relative;
  margin-top: 1rem;

  .p-inputtext {
    width: 100%;
    background-color: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#e0dde2')} !important;
    border-radius: 0.3rem;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#000')} !important;
    box-sizing: border-box;
    transition: border-color 0.3s, box-shadow 0.3s;
    padding-left: 2rem;
  }

  .p-inputtext::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#dfdfdfff' : '#999999')};
    opacity: 0.55;
  }

  .p-inputtext:focus {
    border-color: ${({ darkMode }) => (darkMode ? '#c4bfd1ff' : '#7443f6')};
    box-shadow: 0 0 0 0.2rem rgba(116, 67, 246, 0.25);
    outline: none;
  }

  i {
    display: flex;
    vertical-align: middle !important;
    top: 1.1rem;
    left: 0.5rem;
    color: ${({ darkMode }) => (darkMode ? '#8f3bd4ff' : '#666666')};
  }
`;

const StyledButton = styled(Button)`
  background: ${({ variant, darkMode }) => {
    if (variant === 'outlined') {
      return 'transparent';
    }
    return darkMode 
      ? 'linear-gradient(90deg, rgba(91, 20, 184, 1) 0%, rgba(110, 16, 165, 1) 100%)' 
      : 'linear-gradient(90deg, rgba(136, 45, 255, 1) 0%, rgba(153, 31, 224, 1) 100%)';
  }};
  
  border-color: ${({ darkMode }) => (darkMode ? '#7443f6' : '#7443f6')};
  color: ${({ variant, darkMode }) => {
    if (variant === 'outlined') {
      return darkMode ? '#7443f6' : '#7443f6';
    }
    return '#ffffff';
  }};
  
  &:hover:not(:disabled) {
    background-color: ${({ variant, darkMode }) => {
      if (variant === 'outlined') {
        return darkMode ? 'rgba(116, 67, 246, 0.1)' : 'rgba(116, 67, 246, 0.1)';
      }
      return darkMode ? '#5e2ecf' : '#5e2ecf';
    }};
    border-color: ${({ darkMode }) => (darkMode ? '#5e2ecf' : '#5e2ecf')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  width: 100%;
  margin-top: 1rem;
`;

const StyledInputText = styled(InputText)`
  width: 100%;
  max-width: 1250px;

  &:focus {
    outline: none;
    border-color: rgb(136, 10, 240) !important;
    box-shadow: 0 0 0 1px rgb(105, 0, 153) !important;
    background-color: white;
  }
`;

const Segmented = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a6a' : '#d4d4d4ff')};
  border-radius: 4px;
  overflow: hidden;
  background: ${({ darkMode }) => (darkMode ? '#120a25' : '#e6e6e6')};
  margin-top: 1rem;
  width: 100%;
`;

const SegBtn = styled.button`
    padding: 0.7rem 1rem;
    font-weight: 500;
    border: 0;
    cursor: pointer;

    // Cor da fonte: branco se ativo, cor violeta se inativo
    color: ${({ active }) => (active ? '#fff' : '#5f5f5fff')};

    // Lógica de background adaptada para o active e darkMode
    background: ${({ active, darkMode }) => {
        // Se não estiver ativo (equivalente ao 'outlined' no seu código)
        if (!active) {
            return 'transparent';
        }
        
        // Se estiver ativo, aplica o gradiente dinâmico baseado no modo escuro
        return darkMode 
            ? 'linear-gradient(90deg, rgba(91, 20, 184, 1) 0%, rgba(110, 16, 165, 1) 100%)' 
            : 'linear-gradient(90deg, rgba(136, 45, 255, 1) 0%, rgba(153, 31, 224, 1) 100%)';
    }};

    transition: background .12s ease, transform .06s ease;

    // Efeito de hover (mantendo a estrutura original)
    &:hover { 
        transform: translateY(-1px); 
    }
    
    // Separador visual (mantendo a estrutura original)
    &:not(:last-child){ 
        border-right: 1px solid rgba(0,0,0,.06); 
    }
`;
/** ——————— Estilos locais adicionais ——————— */

const Page = styled.div`
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#1E0C45')};
  max-width: 1460px;
  margin: 0 auto; 
`;

const Section = styled.div`
  background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e7e3ff')};
  border-radius: 14px;
  padding: 1rem;
  margin-bottom: 1rem;

  /* corrige Card branco dentro do Section em dark */
  .p-card, .p-card .p-card-content {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fff')} !important;
    color: ${({ darkMode }) => (darkMode ? '#f1f1f1ff' : '#120a2b')} !important;
    border: 0;
  }

  /* botões “secondary” no dark */
  .p-button.p-button-secondary {
    background: ${({ darkMode }) => (darkMode ? '#5b5570' : '#e6e6e6')} !important;
    border-color: transparent !important;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#333')} !important;
  }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  @media (min-width: 920px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SectionAccent = styled(Section)`
  background: ${({ darkMode }) =>
    darkMode
      ? 'linear-gradient(180deg, rgba(73,34,148,0.25) 0%, rgba(46,22,102,0.25) 100%)'
      : 'linear-gradient(180deg, rgba(116,67,246,0.10) 0%, rgba(94,46,207,0.10) 100%)'};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#7c56e6' : '#7443f6')};
  box-shadow: ${({ darkMode }) =>
    darkMode ? '0 6px 16px rgba(116,67,246,0.20)' : '0 6px 16px rgba(116,67,246,0.15)'};
`;

const LeftCol = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const RightCol = styled.div`
  display: grid;
  gap: 0.75rem;
  align-content: center;
  justify-items: stretch;
  @media (min-width: 920px) {
    justify-self: center;
    width: min(420px, 100%);
  }
`;

const HeaderShell = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  @media (min-width: 920px) {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
    align-items: center;
  }
`;

const FloatLabel = styled.div`
  position: relative;
  width: 100%;
  &.p-float-label { display: block; }
  input.p-inputtext {
    width: 100%;
    background: ${({ darkMode }) => (darkMode ? '#201335' : '#faf9ff')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#dbd4ff')} !important;
    border-radius: 10px;
    color: ${({ darkMode }) => (darkMode ? '#fff' : '#120a2b')} !important;
    padding: 0.9rem 0.85rem 0.7rem 0.85rem;
    font-size: 1rem;
  }
  label {
    position: absolute;
    top: 0.55rem; left: 0.85rem;
    font-size: 0.82rem;
    color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#6b5bb6')};
    pointer-events: none;
  }
`;

const Chips = styled.div`
  display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .5rem;
  .chip { display: inline-flex; gap: .4rem; align-items: center; padding: .25rem .55rem; border-radius: 999px; font-size: .85rem; font-weight: 700; border: 1px solid rgba(0,0,0,.06); }
  .ok{ color:#3a9c3a; background:rgba(58,156,58,.12); }
  .err{ color:#9c3a3a; background:rgba(156,58,58,.12); }
  .neutral{ color:#4b2bb7; background:rgba(116,67,246,.12); }
`;

/** Card "Planilhas" com centralização vertical dos botões */
const PlanilhasSection = styled(Section)`
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 260px;
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')};
`;

const DownloadsColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: .9rem;
  justify-items: center;
  align-content: center;

  .p-button {
    width: 100%;
    max-width: 520px;
    border-radius: 14px;
    font-weight: 900;
    padding: 1.05rem 1.2rem;
    font-size: 1.02rem;
    background-color: ${({ darkMode }) =>
    darkMode
           ?  'rgba(153, 31, 224, 1)'
            :  'rgba(132, 9, 247, 1)' 
  }
`;


/** ——————— Componente ——————— */

export default function Importation() {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  const [userKey, setUserKey] = useState('');
  const [importationId, setImportationId] = useState('');
  const [templateId, setTemplateId] = useState(1); // 1=Atualização, 2=Criação
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState(null);
  const [creator, setCreator] = useState(null); // {Name, AvatarUrl}
  const [fieldNames, setFieldNames] = useState({}); // { key: officialName }

  async function handleSubmit() {
    if (!userKey || !importationId) {
      toast.current.show({ severity: 'warn', summary: 'Atenção', detail: 'Preencha User-Key e ID da importação', life: 2500 });
      return;
    }
    setLoading(true);
    setData(null);
    setCreator(null);
    setFieldNames({});
    try {
      const res = await postImportationData(userKey, importationId, templateId);
      setData(res);

      if (res?.CreatorId) {
        getCreatorUser(userKey, res.CreatorId).then(setCreator).catch(() => {});
      }

      // chaves a buscar no /Fields
      const keys = Array.from(new Set((res?.MappedFields || []).map(m => m.FieldKey).filter(Boolean)));

      // DEBUG FRONT
      console.log('[FRONT] MappedFields keys =>', keys);

      if (keys.length) {
        getFieldsByKeys(userKey, keys)
          .then(arr => {
            console.log('[FRONT] /fields retorno =>', arr);
            const map = {};
            (arr || []).forEach(f => {
              map[f.Key] =
                f?.Languages?.ptBr?.Name ||
                f?.Name ||
                f?.PropertyName ||
                f?.UpdatePropertyName ||
                f?.Key;
            });
            setFieldNames(map);
          })
          .catch(err => {
            console.warn('[FRONT] Falha /fields:', err?.message);
          });
      }

      toast.current.show({ severity: 'success', summary: 'Consulta realizada', life: 1600 });
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Erro', detail: err?.message || 'Falha na consulta', life: 3800 });
    } finally {
      setLoading(false);
    }
  }

  const statusChipClass = useMemo(() => (data?.Failed ? 'chip err' : 'chip ok'), [data]);

  // Fallback para nome do campo diretamente do objeto Field (quando a API de /Fields não trouxe nada)
  function fieldNameFallback(row) {
    return (
      fieldNames[row?.FieldKey] ||
      row?.Field?.Languages?.ptBr?.Name ||
      row?.Field?.Name ||
      row?.Field?.PropertyName ||
      row?.Field?.UpdatePropertyName ||
      '-'
    );
  }

  return (
    <>
    <Page darkMode={darkMode}>
      <ServiceHeader
        platforms={['ploomes']}
        title="Consulta de Importação Ploomes"
        subtitle="Veja status, planilhas e mapeamento usado na importação"
      />
      <Toast ref={toast} />

      {/* Cabeçalho */}
      <StyledContainer darkMode={darkMode}>
        <Title darkMode={darkMode}>
          Informe a User-Key e ID da Importação
        </Title>
        
        {/* Primeira linha: User-Key e botões de seleção */}
        <Row>
          {/* Credencial unificada — sem onValidate: a UK é usada direto na consulta */}
          <CredencialCard
            uk={userKey}
            onUkChange={setUserKey}
            placeholder="Digite a User-Key"
            disabled={loading}
          />

          <Segmented darkMode={darkMode} role="tablist" aria-label="Tipo de importação">
            <SegBtn type="button" active={templateId === 2} onClick={() => setTemplateId(2)}>Criação</SegBtn>
            <SegBtn type="button" active={templateId === 1} onClick={() => setTemplateId(1)}>Atualização</SegBtn>
          </Segmented>
        </Row>

        {/* Segunda linha: ID da Importação e botão Consultar */}
        <RowTwoColumns>
          <StyledInputWrapper 
            darkMode={darkMode} 
            className="p-input-icon-left" 
          >
            <i style={{ fontSize: "20px" }} className="pi pi-hashtag" />
            <StyledInputText
              value={importationId}
              onChange={(e) => setImportationId(e.target.value)}
              placeholder="Digite o ID da Importação"
            />
          </StyledInputWrapper>

          <StyledButton
            darkMode={darkMode}
            label={loading ? 'Consultando...' : 'Consultar Importação'}
            icon="pi pi-search"
            disabled={!userKey || !importationId || loading}
            onClick={handleSubmit}
          />
        </RowTwoColumns>
      </StyledContainer>

      {/* Resultado */}
      {data && (
        <>
          <Grid2>
            {/* Resumo */}
            <Section darkMode={darkMode}>
              <h3 style={{ marginTop: 0 }}>Resumo</h3>
              <Chips>
                <span className={statusChipClass}>
                  {data?.Failed ? <i className="pi pi-times-circle" /> : <i className="pi pi-check-circle" />} {data?.Failed ? 'Falha' : 'Concluída'}
                </span>
                <span className="chip neutral" title={String(data?.CreatorId || '')}>
                  {creator?.AvatarUrl && (
                    <img src={creator.AvatarUrl} alt="avatar" style={{ width: 18, height: 18, borderRadius: 999 }} />
                  )}
                  Criado por: <b>{creator?.Name || '—'}</b>
                </span>
              </Chips>

              <Card style={{ borderRadius: 12 }}>
                <div className="p-3">
                  <p><b>ID:</b> {data.Id}</p>
                  <p><b>Data:</b> {new Date(data.CreateDate).toLocaleString()}</p>
                  <p><b><u>Id do usuário</u>:</b> {data.CreatorId}</p>
                  <p><b>Total de linhas:</b> {data.TotalRows}</p>
                  <p><b>Inseridos:</b> {data.InsertedEntities}</p>
                  <p><b>Atualizados:</b> {data.UpdatedEntities}</p>
                  <p><b>Com erro:</b> {data.ErrorRows}</p>
                </div>
              </Card>
            </Section>

            {/* Planilhas (centralizado) */}
            <PlanilhasSection darkMode={darkMode}>
              <h3 style={{ marginTop: 0 }}>Planilhas</h3>
              <DownloadsColumn>
                <Button
                  label="Planilha Original"
                  icon="pi pi-file-excel"
                  onClick={() => data?.SpreadsheetUrl && window.open(data.SpreadsheetUrl, '_blank')}
                  disabled={!data?.SpreadsheetUrl}
                />
                <Button
                  label="Planilha com Logs"
                  icon="pi pi-book"
                  onClick={() => data?.SpreadsheetWithLogsUrl && window.open(data.SpreadsheetWithLogsUrl, '_blank')}
                  disabled={!data?.SpreadsheetWithLogsUrl}
                  className="p-button-secondary"
                />
              </DownloadsColumn>
            </PlanilhasSection>
          </Grid2>

          {/* Campos mapeados */}
          <Section darkMode={darkMode} style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: 0 }}>Campos Mapeados</h3>
            <DataTable value={data.MappedFields || []} stripedRows paginator rows={10} rowsPerPageOptions={[10,20,50]}>
              <Column field="FieldKey" header="Chave (Key)" />
              <Column header="Campo" body={fieldNameFallback} />
              <Column header="Detecção de Duplicado" body={(row) => (row?.Unique ? '✅ Sim' : '❌ Não')} />
              <Column header="Entidade" body={(row) => row?.TemplateEntity?.Entity?.Name || row?.Field?.Entity?.Name || '-'} />
            </DataTable>
          </Section>
        </>
      )}
    </Page>
    </>
  );
}
