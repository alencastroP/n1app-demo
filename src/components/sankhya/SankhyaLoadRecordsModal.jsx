// src/components/sankhya/SankhyaLoadRecordsModal.jsx
import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import {
  ENTITIES,
  buildLoadRecordsPayload,
  parseSankhyaLoadRecordsResponse,
  callLoadRecords,
} from '../../services/sankhyaLoadRecords';
import SankhyaModalHeader from './SankhyaModalHeader';

/* ── styled (reutiliza padrão do QuickLoginModal) ───── */

const Section = styled.div`
  background: ${({ darkMode }) => (darkMode ? '#201335' : '#f1f1f1')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#281546' : '#e6e6e6')};
  border-radius: 12px;
  padding: 1.25rem;
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : 'inherit')};
`;

const SectionShell = styled(Section)`
  margin-top: 0;
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
`;

const FieldLabel = styled.label`
  font-size: .85rem;
  font-weight: 600;
  letter-spacing: .02em;
  color: ${({ darkMode }) => (darkMode ? '#c9bdf5' : '#38315e')};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: .4rem;
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  padding-top: .75rem;
  margin-top: auto;
`;

const ResultSection = styled.div`
  margin-top: .5rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
`;

const inputStyle = (darkMode) => ({
  background: darkMode ? '#1a0e2e' : '#fafafa',
  border: `1px solid ${darkMode ? '#2A2A3D' : '#e0dde2'}`,
  color: darkMode ? '#d6d5da' : '#0a0025',
  borderRadius: 8,
  width: '100%',
});

const btnGradient = {
  background: 'linear-gradient(90deg, rgba(136,45,255,1) 0%, rgba(153,31,224,1) 100%)',
  border: 'none',
  whiteSpace: 'nowrap',
};

/* ── component ──────────────────────────────────────── */

export default function SankhyaLoadRecordsModal({ visible, onHide, userKey, env, account }) {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  // query state
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);

  // result state
  const [resultColumns, setResultColumns] = useState([]);
  const [resultRows, setResultRows] = useState([]);
  const [rawJson, setRawJson] = useState(null);

  // todos os filtros da entidade selecionada estão preenchidos?
  const filtersFilled =
    !!selectedEntity &&
    selectedEntity.filters.every((f) => String(filterValues[f.field] ?? '').trim() !== '');

  // query
  async function onConsultar() {
    if (!account?.id || !selectedEntity || !filtersFilled) return;

    setLoading(true);
    setResultColumns([]);
    setResultRows([]);
    setRawJson(null);

    try {
      const payload = buildLoadRecordsPayload(selectedEntity, filterValues, selectedFields);

      const data = await callLoadRecords({
        accountId: account.id,
        env,
        userKey,
        payload,
      });

      if (data?.error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Erro Sankhya',
          detail: typeof data.error === 'string' ? data.error : JSON.stringify(data.error).slice(0, 400),
          life: 8000,
        });
        return;
      }

      setRawJson(data);
      const { columns, rows } = parseSankhyaLoadRecordsResponse(data);
      setResultColumns(columns);
      setResultRows(rows);

      if (rows.length === 0) {
        toast.current?.show({ severity: 'info', summary: 'Resultado', detail: 'Nenhum registro retornado.' });
      } else {
        toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: `${rows.length} registro(s) retornado(s).` });
      }
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Falha na requisição',
        detail: err?.message || 'Erro desconhecido.',
        life: 8000,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyJson() {
    if (!rawJson) return;
    navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2));
    toast.current?.show({ severity: 'info', summary: 'Copiado', detail: 'JSON copiado para a área de transferência.' });
  }

  // reset
  function handleHide() {
    setSelectedEntity(null);
    setFilterValues({});
    setSelectedFields([]);
    setResultColumns([]);
    setResultRows([]);
    setRawJson(null);
    setLoading(false);
    onHide();
  }

  // field options for the current entity (já no formato { value, label })
  const fieldOptions = selectedEntity ? selectedEntity.availableFields : [];

  const canQuery = !!account?.id && filtersFilled;

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={<SankhyaModalHeader icon="pi pi-search" title="Consultas de itens" env={env} account={account} />}
        visible={visible}
        onHide={handleHide}
        modal
        style={{ width: 'min(920px, 95vw)' }}
        contentStyle={{ padding: 0 }}
      >
        <SectionShell darkMode={darkMode}>
          {/* ── Query params ── */}
          <Field>
            <FieldLabel darkMode={darkMode}>Entidade</FieldLabel>
            <Dropdown
              value={selectedEntity}
              onChange={(e) => { setSelectedEntity(e.value); setSelectedFields([]); setFilterValues({}); }}
              options={ENTITIES}
              optionLabel="label"
              placeholder="Selecione a entidade"
              style={inputStyle(darkMode)}
            />
          </Field>

          {selectedEntity && (
            <>
              {selectedEntity.filters.map((f) => (
                <Field key={f.field}>
                  <FieldLabel darkMode={darkMode}>{f.label}</FieldLabel>
                  <InputText
                    value={filterValues[f.field] ?? ''}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, [f.field]: e.target.value }))}
                    placeholder={`Ex: 12345`}
                    style={inputStyle(darkMode)}
                  />
                </Field>
              ))}

              <Field>
                <FieldLabel darkMode={darkMode}>
                  Campos (vazio = todos &quot;*&quot;)
                </FieldLabel>
                <MultiSelect
                  value={selectedFields}
                  onChange={(e) => setSelectedFields(e.value)}
                  options={fieldOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecione campos ou deixe vazio para *"
                  display="chip"
                  style={{ ...inputStyle(darkMode), minHeight: 42 }}
                  panelClassName="sankhya-fields-panel"
                  filter
                  showSelectAll
                  selectAllLabel="Selecionar tudo"
                />
              </Field>
            </>
          )}

          {/* ── Footer ── */}
          <FooterBar>
            {rawJson && (
              <Button
                label="Copiar JSON"
                icon="pi pi-copy"
                className="p-button-outlined"
                onClick={handleCopyJson}
                style={{
                  borderColor: darkMode ? '#7c56e6' : '#7443f6',
                  color: darkMode ? '#c9bdf5' : '#7443f6',
                }}
              />
            )}
            <Button
              label="Consultar"
              icon="pi pi-search"
              loading={loading}
              disabled={!canQuery || loading}
              onClick={onConsultar}
              style={canQuery ? btnGradient : { border: 'none' }}
            />
          </FooterBar>

          {/* ── Results ── */}
          {resultColumns.length > 0 && (
            <ResultSection>
              <div style={{ fontSize: '.85rem', opacity: .8 }}>
                {resultRows.length} registro(s) &bull; {resultColumns.length} coluna(s)
              </div>
              <DataTable
                value={resultRows}
                responsiveLayout="scroll"
                scrollable
                scrollHeight="360px"
                emptyMessage="Nenhum registro encontrado"
                size="small"
                stripedRows
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${darkMode ? '#2a1f3d' : '#dee2e6'}`,
                }}
              >
                {resultColumns.map((col) => (
                  <Column key={col} field={col} header={col} sortable style={{ minWidth: 120 }} />
                ))}
              </DataTable>
            </ResultSection>
          )}
        </SectionShell>
      </Dialog>
    </>
  );
}