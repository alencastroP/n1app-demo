// src/components/sankhya/SankhyaCorruptedItemModal.jsx
import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';
import {
  ENTITIES,
  buildScanPayload,
  getScanField,
  parseSankhyaLoadRecordsResponse,
  detectSuspiciousFields,
  callLoadRecords,
} from '../../services/sankhyaLoadRecords';
import SankhyaModalHeader from './SankhyaModalHeader';

/* ── styled ─────────────────────────────────────────── */

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

const SuspectCard = styled.div`
  background: ${({ darkMode }) => (darkMode ? 'rgba(255, 80, 80, .12)' : 'rgba(255, 80, 80, .08)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255, 80, 80, .35)' : 'rgba(255, 80, 80, .25)')};
  border-radius: 10px;
  padding: 1rem;
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

export default function SankhyaCorruptedItemModal({ visible, onHide, userKey, env, account }) {
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  // query state
  const [selectedEntity, setSelectedEntity] = useState(
    ENTITIES.find((e) => e.id === 'produto') || null,
  );
  const [code, setCode] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);

  // result state
  const [resultColumns, setResultColumns] = useState([]);
  const [resultRows, setResultRows] = useState([]);
  const [suspects, setSuspects] = useState([]);
  const [rawJson, setRawJson] = useState(null);

  // suspectRows index set for row highlighting
  const suspectRowIndexes = new Set(suspects.map((s) => s.rowIndex));

  // search corrupted
  async function onBuscar() {
    if (!account?.id || !selectedEntity || !code.trim()) return;

    setLoading(true);
    setResultColumns([]);
    setResultRows([]);
    setSuspects([]);
    setRawJson(null);

    try {
      const payload = buildScanPayload(selectedEntity, code.trim(), selectedFields);

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

      // detect suspicious dates
      const found = detectSuspiciousFields(columns, rows);
      setSuspects(found);

      if (rows.length === 0) {
        toast.current?.show({ severity: 'info', summary: 'Resultado', detail: 'Nenhum registro retornado.' });
      } else if (found.length === 0) {
        toast.current?.show({
          severity: 'info',
          summary: 'Sem inconsistências',
          detail: 'Nenhuma inconsistência óbvia encontrada no lote retornado.',
          life: 5000,
        });
      } else {
        toast.current?.show({
          severity: 'warn',
          summary: 'Itens suspeitos!',
          detail: `${new Set(found.map((f) => f.rowIndex)).size} item(ns) com data(s) suspeita(s).`,
          life: 6000,
        });
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
    setSelectedEntity(ENTITIES.find((e) => e.id === 'produto') || null);
    setCode('');
    setSelectedFields([]);
    setResultColumns([]);
    setResultRows([]);
    setSuspects([]);
    setRawJson(null);
    setLoading(false);
    onHide();
  }

  // field options (já no formato { value, label })
  const fieldOptions = selectedEntity ? selectedEntity.availableFields : [];

  // campo de varredura (operador >) da entidade selecionada
  const scanField = selectedEntity ? getScanField(selectedEntity) : null;

  const canQuery = !!account?.id && !!selectedEntity && !!code.trim();

  // row class for suspect highlighting
  const rowClassName = (data) => {
    const idx = resultRows.indexOf(data);
    return suspectRowIndexes.has(idx) ? { 'bg-red-50': !darkMode, 'bg-red-900': darkMode } : {};
  };

  // group suspects by row for the summary card
  const suspectsByRow = suspects.reduce((acc, s) => {
    if (!acc[s.rowIndex]) acc[s.rowIndex] = [];
    acc[s.rowIndex].push(s);
    return acc;
  }, {});

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={<SankhyaModalHeader icon="pi pi-exclamation-triangle" title="Buscar item corrompido" env={env} account={account} />}
        visible={visible}
        onHide={handleHide}
        modal
        style={{ width: 'min(960px, 95vw)' }}
        contentStyle={{ padding: 0 }}
      >
        <SectionShell darkMode={darkMode}>
          {/* ── Query params ── */}
          <Field>
            <FieldLabel darkMode={darkMode}>Entidade</FieldLabel>
            <Dropdown
              value={selectedEntity}
              onChange={(e) => { setSelectedEntity(e.value); setSelectedFields([]); setCode(''); }}
              options={ENTITIES}
              optionLabel="label"
              placeholder="Selecione a entidade"
              style={inputStyle(darkMode)}
            />
          </Field>

          {selectedEntity && (
            <>
              <Field>
                <FieldLabel darkMode={darkMode}>
                  Código a partir do qual buscar ({scanField} &gt;)
                </FieldLabel>
                <InputText
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`Ex: 997 (buscará ${scanField} > 997)`}
                  style={inputStyle(darkMode)}
                />
                <small style={{ opacity: .7, fontSize: '.8rem' }}>
                  Retorna os próximos ~50 itens a partir desse código.
                </small>
              </Field>

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
              label="Buscar"
              icon="pi pi-search"
              loading={loading}
              disabled={!canQuery || loading}
              onClick={onBuscar}
              style={canQuery ? btnGradient : { border: 'none' }}
            />
          </FooterBar>

          {/* ── Suspect summary ── */}
          {suspects.length > 0 && (
            <SuspectCard darkMode={darkMode}>
              <div style={{ fontWeight: 700, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="pi pi-exclamation-triangle" style={{ color: '#ff5050' }} />
                Itens com datas suspeitas ({Object.keys(suspectsByRow).length} item(ns))
              </div>
              {Object.entries(suspectsByRow).map(([rowIdx, fields]) => {
                const row = resultRows[Number(rowIdx)];
                const codeVal = scanField ? row[scanField] || `Linha ${Number(rowIdx) + 1}` : `Linha ${Number(rowIdx) + 1}`;
                return (
                  <div key={rowIdx} style={{ marginBottom: '.5rem', paddingLeft: '.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '.9rem' }}>
                      {scanField}: {codeVal}
                    </div>
                    {fields.map((f, i) => (
                      <div key={i} style={{ fontSize: '.85rem', opacity: .9, paddingLeft: '.5rem' }}>
                        <Tag severity="danger" value={f.field} style={{ marginRight: 6 }} />
                        {f.value}
                      </div>
                    ))}
                  </div>
                );
              })}
            </SuspectCard>
          )}

          {/* ── Results table ── */}
          {resultColumns.length > 0 && (
            <ResultSection>
              <div style={{ fontSize: '.85rem', opacity: .8 }}>
                {resultRows.length} registro(s) &bull; {resultColumns.length} coluna(s)
                {suspects.length > 0 && (
                  <span style={{ marginLeft: 8, color: '#ff5050', fontWeight: 600 }}>
                    &bull; {Object.keys(suspectsByRow).length} suspeito(s)
                  </span>
                )}
              </div>
              <DataTable
                value={resultRows}
                responsiveLayout="scroll"
                scrollable
                scrollHeight="360px"
                emptyMessage="Nenhum registro encontrado"
                size="small"
                stripedRows
                rowClassName={rowClassName}
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${darkMode ? '#2a1f3d' : '#dee2e6'}`,
                }}
              >
                <Column
                  header="Suspeito"
                  body={(data) => {
                    const idx = resultRows.indexOf(data);
                    return suspectRowIndexes.has(idx)
                      ? <Tag severity="danger" value="Sim" />
                      : <Tag severity="success" value="Não" />;
                  }}
                  style={{ minWidth: 90, textAlign: 'center' }}
                />
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
