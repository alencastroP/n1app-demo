// components/powerbi/PowerBITableSection.jsx
import styled from 'styled-components';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import * as XLSX from 'xlsx';

const StyledTableContainer = styled(Card)`
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(59, 59, 59, 0.2);
  border-radius: 6px;
  margin: auto;
  max-width: 1460px;
  background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#fafafaff')};
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#0a0025')};
  overflow: hidden;
`;

const SectionTitle = styled.h3`
  text-align: start;
  color: ${({ darkMode }) => (darkMode ? '#d6d5da' : '#1e0c45')};
  margin: 0;
  font-weight: bold;
  font-size: 1.4rem;
`;

const StyledMessage = styled(Message)`
  margin: 0;
  
  &.p-message-error {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.1)')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#f44336' : '#f44336')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#d32f2f')};
  }

  &.p-message-success {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#4caf50' : '#4caf50')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#2e7d32')};
  }

  &.p-message-warn {
    background-color: ${({ darkMode }) => (darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.1)')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#ff9800' : '#ff9800')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#f57c00')};
  }
`;

const StyledDataTable = styled(DataTable)`
  margin-top: 1rem;
  width: 100%;

  .p-datatable-wrapper {
    overflow-x: auto;
  }

  .p-datatable-header {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f8f9fa')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#212529')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#5e49a6' : '#dee2e6')};
  }

  .p-datatable-thead > tr > th {
    background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f8f9fa')};
    color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#212529')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#5e49a6' : '#dee2e6')};
    padding: 0.75rem;
  }

  .p-datatable-tbody > tr > td {
    background-color: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#ffffff')};
    color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#212529')};
    border: 1px solid ${({ darkMode }) => (darkMode ? '#5e49a6' : '#dee2e6')};
    padding: 0.75rem;
  }

  .p-datatable-tbody > tr:nth-child(even) > td {
    background-color: ${({ darkMode }) => (darkMode ? '#241739' : '#f8f9fa')};
  }

  .p-datatable-tbody > tr:hover > td {
    background-color: ${({ darkMode }) => (darkMode ? '#2d1f4a' : '#e9ecef')};
  }

  .p-datatable-scrollable-body {
    scrollbar-width: thin;
    scrollbar-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff #1a0e2e' : '#dee2e6 #f8f9fa')};
  }

  .p-datatable-scrollable-body::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .p-datatable-scrollable-body::-webkit-scrollbar-track {
    background: ${({ darkMode }) => (darkMode ? '#1a0e2e' : '#f8f9fa')};
    border-radius: 4px;
  }

  .p-datatable-scrollable-body::-webkit-scrollbar-thumb {
    background-color: ${({ darkMode }) => (darkMode ? '#6e38c5ff' : '#dee2e6')};
    border-radius: 4px;
  }

  .p-datatable-scrollable-body::-webkit-scrollbar-thumb:hover {
    background-color: ${({ darkMode }) => (darkMode ? '#7e4dd1' : '#adb5bd')};
  }
`;

const PreBlock = styled.pre`
  white-space: pre-wrap;
  background-color: ${({ darkMode }) => (darkMode ? '#2b1f49' : '#f4f4f4')};
  color: ${({ darkMode }) => (darkMode ? '#efeaff' : '#212529')};
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#5e49a6' : '#dee2e6')};
  overflow-x: auto;
  margin-top: 0.5rem;
`;

export default function PowerBITableSection({ darkMode, table, tabName }) {
  if (!table) return null;

  const sanitizeSheetName = (name) =>
    String(name ?? 'tabela').replace(/[:\\/?*[\]]/g, '_').slice(0, 31);

  const handleDownload = () => {
    if (!table?.columns || !table?.rows) return;
    const data = [table.columns, ...table.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(tabName));
    XLSX.writeFile(wb, `${tabName ?? 'tabela'}.xlsx`);
  };

  // Tabela estruturada
  if (table?.columns && table?.rows) {
    return (
      <StyledTableContainer darkMode={darkMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <SectionTitle darkMode={darkMode}>
            Tabela lida do link
          </SectionTitle>
          <Button
            icon="pi pi-file-excel"
            label="Baixar Excel"
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(90deg, #1a7a4a 0%, #1e8f55 100%)',
              borderColor: '#1a7a4a',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div style={{ margin: '0.5rem 0' }}>
          <StyledMessage
            darkMode={darkMode}
            severity="success"
            text={`Formato: ${table.format ?? 'desconhecido'} • Registros: ${table.rawCount ?? table.rows.length}`}
          />
        </div>

        <StyledDataTable
          darkMode={darkMode}
          value={table.rows}
          scrollable
          scrollHeight="400px"
          scrollDirection="both" // Permite scroll horizontal e vertical
          showGridlines
        >
          {table.columns.map((col, i) => (
            <Column 
              key={i} 
              field={String(i)} 
              header={col} 
              body={(row) => row[i]} 
            />
          ))}
        </StyledDataTable>
      </StyledTableContainer>
    );
  }

  // Dados não estruturados - fallback
  return (
    <StyledTableContainer darkMode={darkMode}>
      <div style={{ marginTop: 8 }}>
        <StyledMessage
          darkMode={darkMode}
          severity="warn"
          text={`Não foi possível normalizar em tabela. Conteúdo: ${table.format ?? 'desconhecido'} (${table.contentType ?? 'sem content-type'})`}
        />
        
        {table.sample && (
          <PreBlock darkMode={darkMode}>
            {String(table.sample).slice(0, 4000)}
          </PreBlock>
        )}
        
        {table.raw && (
          <PreBlock darkMode={darkMode}>
            {JSON.stringify(table.raw, null, 2)}
          </PreBlock>
        )}
      </div>
    </StyledTableContainer>
  );
}
