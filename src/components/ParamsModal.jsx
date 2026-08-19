// src/components/ParamsModal.jsx
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

export default function ParamsModal({ visible, onHide, params = [] }) {
  return (
    <Dialog
      header="Parâmetros OData — atalhos"
      visible={visible}
      style={{ width: '760px', maxWidth: '95vw' }}
      onHide={onHide}
      blockScroll
      draggable={false}
      resizable={false}
      modal
    >
      <p style={{ marginTop: 0, opacity: .85 }}>
        Clique em “Copiar” para adicionar no seu <strong>query</strong>.
      </p>

      <DataTable value={params} scrollable scrollHeight="400px" size="small">
        <Column field="key" header="Parâmetro" style={{ width: 140 }} />
        <Column field="description" header="Descrição" />
        <Column field="example" header="Exemplo" style={{ width: 260 }} body={(row) => (
          <code style={{ fontSize: 12 }}>{row.example}</code>
        )} />
        <Column header="" style={{ width: 110 }} body={(row) => (
          <Button
            size="small"
            label="Copiar"
            icon="pi pi-copy"
            onClick={() => {
              navigator.clipboard.writeText(row.example.replace('//', ''));
            }}
          />
        )} />
      </DataTable>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <Button label="Fechar" icon="pi pi-times" onClick={onHide} />
      </div>
    </Dialog>
  );
}
