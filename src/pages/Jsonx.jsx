// src/pages/Jsonx.jsx
import { useState, useRef } from 'react';
import styled from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import { convertJson, downloadBlob } from '../services/jsonxService';
import ServiceHeader from '../components/ServiceHeader';

// PrimeReact
import { Card } from 'primereact/card';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

// ---------- Estilo ----------
const Page = styled.div`
  min-height: 100%;
  max-width: 1460px;
  width: 100%;
  align-items: center;

  margin: auto;
  
  overflow-x: hidden; /* ALTERADO: evita scroll lateral da página */
`;
const Shell = styled(Card)`
  background: ${({darkMode})=>darkMode?'#1a0e2e':'#fff'};
  box-shadow: 0 2px 4px rgba(59, 59, 59, 0.3);
  border-radius: 6px;
  padding-top: 0.2rem;

    .p-dropdown .p-dropdown-trigger {
      background: ${({darkMode})=>darkMode?'#1e1236ff':'rgba(132, 9, 247, 1)'};
    color: ${({ dark }) => (dark ? '#AB82FF' : '#ffffffff')};
  }
`;
const InputsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;
const FieldBlock = styled.div`display:flex;flex-direction:column;gap:.5rem;`;
const Label = styled.label`font-weight:600;`;
const Hint = styled.small`opacity:.85;`;

const TAWrapper = styled.div`
  width: 100%;
  /* sem max-height para permitir crescer; mantemos um mínimo confortável */
  min-height: 260px;
  border: 1px solid ${({darkMode})=>darkMode?'#2A2A3D':'#e0dde2'};
  border-radius: 10px;
  background: ${({darkMode})=>darkMode?'#160d28':'#fafafa'};
  padding: .5rem;
`;

const StyledTextArea = styled(InputTextarea)`
  width: 100% !important;
  min-height: 260px;             /* ALTERADO: o próprio textarea controla a altura */
  resize: vertical !important;   /* permite expandir livremente */
  overflow: auto !important;
  background: transparent !important; border: 0 !important;
  color: ${({darkMode})=>darkMode?'#e7e2ff':'#0a0025'} !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
  white-space: pre !important;
  word-break: normal !important;
`;

const UploadBox = styled.div`
  display:flex;flex-direction:column;gap:.5rem;padding:1rem;
  border:2px dashed ${({darkMode})=>darkMode?'#7c56e6':'#7443f6'};
  border-radius:12px;
  background:${({darkMode})=>darkMode
    ?'linear-gradient(180deg, rgba(73,34,148,.12) 0%, rgba(46,22,102,.10) 100%)'
    :'linear-gradient(180deg, rgba(116,67,246,.06) 0%, rgba(94,46,207,.05) 100%)'};
`;

const Or = styled.div`
  display:flex; align-items:center; justify-content:center;
  font-weight:700;
  color:${({darkMode})=>darkMode?'#c9bdf5':'#5a38c8'};
  margin: .25rem 0;
`;

const ActionsRow = styled.div`
  display:flex;
  flex-wrap:wrap;
  gap:.6rem;
`;

const StyledButton = styled(Button)`
  background-color: ${({ darkMode }) =>
    darkMode
      ? 'rgba(153, 31, 224, 1)'
      : 'rgba(132, 9, 247, 1)'};
  border-color: ${({ darkMode }) =>
    darkMode
      ? 'rgba(153, 31, 224, 1)'
      : 'rgba(132, 9, 247, 1)'};
  color: #ffffff;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  
  &:hover:not(:disabled) {
    background-color: ${({ darkMode }) =>
      darkMode
        ? 'rgba(130, 25, 200, 1)'
        : 'rgba(110, 7, 220, 1)'};
    border-color: ${({ darkMode }) =>
      darkMode
        ? 'rgba(130, 25, 200, 1)'
        : 'rgba(110, 7, 220, 1)'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PreviewShell = styled(Shell)`margin-top:1rem;`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;         /* habilita scroll horizontal só dentro da tabela */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;      /* espaço pro scroll bar */

  /* PrimeReact: força a tabela a medir pelo conteúdo, sem alargar a página */
  .p-datatable-table {
    width: max-content;     /* chave para não estourar a largura da página */
  }
`;

const Badge = styled.span`
  display:inline-flex;align-items:center;gap:.4rem;padding:.25rem .55rem;border-radius:999px;
  font-size:.85rem;font-weight:600;
  background:${({$ok})=>$ok?'rgba(15,123,15,.12)':'rgba(161,0,0,.12)'};
  color:${({$ok})=>$ok?'#0f7b0f':'#8a1010'};
  border:1px solid rgba(0,0,0,.06);
`;

function formatCell(value) {
  if (value == null) return '';
  if (Array.isArray(value))
    return value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ---------- Utils p/ preview ----------
const isObject = (v)=>v && typeof v==='object' && !Array.isArray(v);
function normalizeDate(v){
  if (typeof v!=='string') return v;
  const m=v.match(/^\/Date\((\d+)\)\/$/);
  return m?new Date(Number(m[1])).toISOString():v;
}
function flattenOne(obj,prefix='',out={}) {
  if (!isObject(obj)) return out;
  for (const [k,v] of Object.entries(obj)) {
    const key = prefix?`${prefix}.${k}`:k;
    if (isObject(v)) flattenOne(v,key,out);
    else if (Array.isArray(v)) {
      if (v.length && isObject(v[0])) out[key]=v; else out[key]=v.join('; ');
    } else out[key]=normalizeDate(v);
  }
  return out;
}
function cartesianProduct(arrs){return arrs.reduce((a,c)=>{const r=[];for(const x of a)for(const y of c)r.push({...x,...y});return r},[{}]);}
function flattenPreview(input, limit=2000){
  try{
    const root=Array.isArray(input)?input:[input];
    const flattened=root.slice(0,limit).map(i=>flattenOne(i));
    const arrayObjectKeys=new Set();
    for(const row of flattened){
      for(const [k,v] of Object.entries(row)){
        if(Array.isArray(v) && v.length && isObject(v[0])) arrayObjectKeys.add(k);
      }
    }
    const explodedRows=[];
    for(const row of flattened){
      const base={...row}; const lists=[];
      for(const key of arrayObjectKeys){
        if(Array.isArray(base[key]) && base[key].length){
          const options=base[key].map(o=>flattenOne(o,`${key}`));
          lists.push(options); delete base[key];
        } else { delete base[key]; }
      }
      if(!lists.length) explodedRows.push(base);
      else for(const combo of cartesianProduct(lists)) explodedRows.push({...base,...combo});
    }
    const headers=Array.from(explodedRows.reduce((s,r)=>{Object.keys(r).forEach(k=>s.add(k));return s;},new Set()));
    return { rows: explodedRows, headers };
  }catch{ return { rows:[], headers:[] }; }
}

// ---------- Página ----------
export default function Jsonx(){
  const { darkMode } = useDarkMode();
  const toast = useRef(null);

  const [jsonText, setJsonText] = useState('');
  const [file, setFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validated, setValidated] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);

  const [format, setFormat] = useState('xlsx');
  const [loading, setLoading] = useState(false);
  const [validMsg, setValidMsg] = useState('');

  const formatOptions = [
    { label: 'Excel (.xlsx)', value: 'xlsx' },
    { label: 'CSV (.csv)', value: 'csv' },
  ];

  const show = (msg, severity='info', life=4000) =>
    toast.current?.show({ severity, summary: severity==='error'?'Erro':'Info', detail: String(msg), life });

  async function handleValidateFromText(){
    try{
      const raw = String(jsonText || '').trim();
      if(!raw){
        setValidated(false); setParsed(null); setPreviewRows([]); setPreviewHeaders([]); setValidMsg('Vazio.');
        return;
      }
      const obj = JSON.parse(raw);
      const pretty = JSON.stringify(obj, null, 2);
      setJsonText(pretty);
      setFile(null);
      const { rows, headers } = flattenPreview(obj);
      setParsed(obj); setPreviewRows(rows.slice(0,50)); setPreviewHeaders(headers);
      setValidated(true);
      setValidMsg(`OK — ${rows.length ?? 0} linhas (preview exibindo até 50).`);
      show('JSON válido e formatado.', 'success', 2500);
    }catch(e){
      setValidated(false); setParsed(null); setPreviewRows([]); setPreviewHeaders([]);
      setValidMsg(`Inválido: ${e?.message || e}`); show('JSON inválido.', 'error');
    }
  }

  async function handleValidateFromFile(){
    try{
      if(!file){ show('Selecione um arquivo .json', 'warn'); return; }
      const text = file._textCache || await file.text();
      file._textCache = text;
      const obj = JSON.parse(text);
      const pretty = JSON.stringify(obj, null, 2);
      setJsonText(pretty);
      setFile(null);
      const { rows, headers } = flattenPreview(obj);
      setParsed(obj); setPreviewRows(rows.slice(0,50)); setPreviewHeaders(headers);
      setValidated(true);
      setValidMsg(`OK — ${rows.length} linhas (preview até 50).`);
      show('Arquivo validado e formatado.', 'success', 2500);
    }catch(e){
      setValidated(false); setParsed(null); setPreviewRows([]); setPreviewHeaders([]);
      setValidMsg(`Inválido: ${e?.message || e}`); show('Arquivo JSON inválido.', 'error');
    }
  }

  function handleFileChange(e){
    const f = e.target.files?.[0];
    if(!f) return;
    setFile(f);
    setValidated(false); setParsed(null);
    setPreviewRows([]); setPreviewHeaders([]);
    setValidMsg(`Arquivo selecionado: ${f.name}. Clique em “Validar arquivo”.`);
  }

  function handleClear(){
    setJsonText(''); setFile(null);
    setValidated(false); setParsed(null);
    setPreviewRows([]); setPreviewHeaders([]);
    setValidMsg('');
  }

  async function handleDownload(){
    if(!validated || !parsed){
      show('Valide o JSON antes de converter.', 'warn'); return;
    }
    try{
      setLoading(true);
      const { blob, filename } = await convertJson({ text: JSON.stringify(parsed), format });
      downloadBlob(blob, filename);
      toast.current?.show({ severity:'success', summary:'Pronto!', detail:`Arquivo ${filename} baixado.`, life:3500 });
    }catch(e){
      show(e?.message || String(e), 'error', 6000);
    }finally{ setLoading(false); }
  }

  return (
    <Page>
      <Toast ref={toast} />
      <ServiceHeader
        platforms={[]}
        icon="pi pi-file-excel"
        title="Conversor JSON para Excel"
        subtitle="Converta objetos JSON para planilhas com poucos cliques"
      />


      <Shell darkMode={darkMode} title="Entrada de dados">
        <div className="mb-3">
          <Label>Formato de saída</Label>
          <div style={{ maxWidth: 360 }}>
            <Dropdown value={format} options={formatOptions} onChange={(e)=>setFormat(e.value)} placeholder="Selecione" className="w-full" />
          </div>
          <Hint>Para abrir no Excel PT-BR, o CSV usa “;” como separador.</Hint>
        </div>

        {/* ALTERADO: blocos empilhados */}
        <InputsStack>
          {/* JSON colado */}
          <FieldBlock>
            <Label>JSON colado (texto)</Label>
            <TAWrapper darkMode={darkMode}>
              <StyledTextArea
                darkMode={darkMode}
                autoResize={false}
                value={jsonText}
                onChange={(e)=>{ setJsonText(e.target.value); setValidated(false); setValidMsg(''); }}
                rows={12}
                placeholder="Cole aqui o JSON (retornos do Ploomes com expands são suportados)"
              />
            </TAWrapper>

            <ActionsRow style={{ marginTop: '.5rem' }}>
              <StyledButton label="Validar/Formatar JSON" icon="pi pi-check" onClick={handleValidateFromText} />
              <Button label="Limpar" icon="pi pi-times" severity="secondary" text onClick={handleClear} />
              {!!validMsg && <Badge $ok={validated}>{validMsg}</Badge>}
            </ActionsRow>
          </FieldBlock>

          {/* OU */}
          <Or darkMode={darkMode}>OU</Or>

          {/* Upload de arquivo */}
          <FieldBlock>
            <Label>Selecionar arquivo .json</Label>
            <UploadBox darkMode={darkMode}>
              <input type="file" accept=".json,application/json" onChange={handleFileChange} />
              <Hint>O upload não gera prévia automática — clique em “Validar arquivo”.</Hint>
              <div style={{ display:'flex', gap:8, marginTop:6 }}>
                <Button label="Validar arquivo" icon="pi pi-file-check" outlined onClick={handleValidateFromFile} disabled={!file} />
              </div>
            </UploadBox>
          </FieldBlock>
        </InputsStack>

        <ActionsRow className="mt-3">
          <StyledButton
            label={loading ? 'Convertendo…' : `Converter e baixar (${format.toUpperCase()})`}
            icon="pi pi-download"
            onClick={handleDownload}
            disabled={loading || !validated}
          />
          {!validated && <Hint>Valide o JSON para habilitar o download.</Hint>}
        </ActionsRow>

        <details className="mt-3">
          <summary>Ver exemplo de entrada (Contacts + People)</summary>
          <pre style={{ marginTop: 8, background: darkMode ? '#0f0a1a' : '#f7f6ff', padding: 12, borderRadius: 8, overflow: 'auto' }}>
{`{
  "@odata.context": "https://api.demo.invalid/$metadata#Contacts",
  "value": [
    { "Id": 405713647, "TypeId": 2, "Name": "Ana Silva", "LegalName": "Ana Silva", "Register": "12345678909",
      "People": [ { "Id": 1, "Name": "Fulano", "Email": "fulano@acme.com" } ] }
  ]
}`}
          </pre>
        </details>
      </Shell>

      {/* PREVIEW */}
        <PreviewShell darkMode={darkMode} title="Pré-visualização (primeiras 50 linhas)">
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                <StyledButton
                label="Ver pré-visualização"
                icon="pi pi-table"
                onClick={() => setPreviewOpen(true)}
                disabled={!validated || !previewRows.length}
                />
                <Hint>Mostra as primeiras 50 linhas em um modal com rolagem.</Hint>
            </div>
        </PreviewShell>
        <Dialog
            header="Pré-visualização (primeiras 50 linhas)"
            visible={previewOpen}
            modal
            maximizable
            style={{ width: '95vw' }}
            onHide={() => setPreviewOpen(false)}
            >
            <div style={{ maxWidth: '100%', overflow: 'auto' }}>
                <DataTable
                value={previewRows}
                scrollable
                scrollHeight="60vh"
                tableStyle={{ width: 'max-content' }}   // tabela mede pelo conteúdo
                paginator rows={10} rowsPerPageOptions={[5,10,20,50]}
                className="p-datatable-sm"
                >
                {previewHeaders.map((h) => (
                    <Column
                    key={h}
                    field={h}
                    header={h}
                    body={(rowData) => formatCell(rowData[h])}
                    style={{ minWidth: 220 }}
                    />
                ))}
                </DataTable>
            </div>
        </Dialog>

    </Page>
  );
}
