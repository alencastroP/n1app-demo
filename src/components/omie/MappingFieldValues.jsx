import { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import styled from 'styled-components';
import { useDarkMode } from '../../DarkModeContext';

const Panel = styled.div`
  background: ${({ darkMode }) => (darkMode ? '#271742ff' : '#fafafaff')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#e1e5eb')};
  border-radius: 12px;
  padding: 0.85rem 1rem;
`;

const Head = styled.div`
  font-weight: 700;
  color: ${({ darkMode, $active }) =>
    $active ? (darkMode ? '#efeaff' : '#1E0C45') : (darkMode ? '#fcfcfcff' : '#1E0C45')};
  margin-bottom: .35rem;
`;

const Hint = styled.div`
  font-size: .85rem;
  color: ${({ darkMode, $active }) =>
    $active ? (darkMode ? '#d8ccff' : '#5a46b8') : (darkMode ? '#b8b8b8' : '#6b7280')};
  margin-bottom: .35rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: .5rem;
`;

const StyledInputText = styled(InputText)`
  &.p-inputtext {
    background: ${({ darkMode }) => (darkMode ? '#2b2047ff' : '#fff')} !important;
    border: 1px solid ${({ darkMode }) => (darkMode ? '#2a1f3d' : '#dee2e6')} !important;
    color: ${({ darkMode }) => (darkMode ? '#fcfcfcff' : '#212529')} !important;
  }

  &:focus {
    outline: none;
    border-color: rgb(136, 10, 240) !important;
    box-shadow: 0 0 0 1px rgb(105, 0, 153) !important;
    background-color: white;
    color: #0051ffff;
  }

  &.p-inputtext::placeholder {
    color: ${({ darkMode }) => (darkMode ? '#888888' : '#6c757d')} !important;
  }
`;

const StyledInputSwitch = styled(InputSwitch)`
  /* trilho OFF (cinza) */
  &&&& .p-inputswitch-slider {
    background: ${({ darkMode }) => (darkMode ? '#a1a1a1' : '#dee2e6')} !important;
    border-radius: 1rem !important;
    transition: background .2s ease, box-shadow .2s ease;
  }

  /* trilho ON (azul clara) – cobre PR v9/v10: p-highlight e p-inputswitch-checked */
  &&&&.p-inputswitch.p-highlight .p-inputswitch-slider,
  &&&&.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
    background: #1A94FF !important;
  }

  /* hover OFF */
  &&&&:not(.p-disabled):hover .p-inputswitch-slider {
    background: ${({ darkMode }) => (darkMode ? '#8f8f8f' : '#c6c8ca')} !important;
  }

  /* hover ON */
  &&&&.p-inputswitch.p-highlight:not(.p-disabled):hover .p-inputswitch-slider,
  &&&&.p-inputswitch.p-inputswitch-checked:not(.p-disabled):hover .p-inputswitch-slider {
    background: #1A94FF !important;
  }

  /* focus ring (opcional) */
  &&&&.p-inputswitch.p-focus .p-inputswitch-slider {
    box-shadow: 0 0 0 0.2rem rgba(21, 108, 189, 1) !important;
  }

  /* handle (bolinha) */
  &&&& .p-inputswitch-slider::before {
    background: #ffffff !important;
    border-radius: 50% !important;
    box-shadow: 0 2px 4px rgba(0,0,0,.2) !important;
  }
`;

const FIELDS = [
  { id: 76,  type: 'string', label: 'app_key (Omie)', tip: 'FieldId 76 — "app_key"' },
  { id: 77,  type: 'string', label: 'app_secret (Omie)', tip: 'FieldId 77 — "app_secret"' },
  { id: 78,  type: 'string', label: 'Conta corrente padrão (vendas)', tip: 'FieldId 78 — "ContaCorrentePadraoVendas"' },
  { id: 79,  type: 'string', label: 'Categoria padrão (vendas)', tip: 'FieldId 79 — "CACHEContaCorrentePadraoVendas" (vem do 80)' },
  { id: 94,  type: 'bool',   label: 'Trazer vendas do Omie para o Ploomes na primeira sincronização?', tip: 'FieldId 94' },
  { id: 95,  type: 'bool',   label: 'Enviar vendas do Ploomes para o Omie na primeira sincronização?', tip: 'FieldId 95' },
  { id: 125, type: 'bool',   label: 'As vendas feitas no Ploomes não serão sincronizadas com o Omie', tip: 'FieldId 125' },
  { id: 185, type: 'bool',   label: 'As vendas feitas no Omie não serão sincronizadas com o Ploomes', tip: 'FieldId 185' },
  { id: 188, type: 'bool',   label: 'Não preencher cidade de prestação de serviço na criação de OS', tip: 'FieldId 188' },
  { id: 195, type: 'bool',   label: 'Vendas integradas deletadas no Ploomes serão canceladas no Omie', tip: 'FieldId 195' },
  { id: 196, type: 'bool',   label: 'Pedidos/OS cancelados no Omie terão status atualizado no Ploomes', tip: 'FieldId 196' },
];

export default function MappingFieldValues({ values = {}, onChange }) {
  const [local, setLocal] = useState(values);
  const { darkMode } = useDarkMode();

  useEffect(() => setLocal(values), [values]);
  useEffect(() => { onChange?.(local); }, [local]); // eslint-disable-line

  return (
    <div className="flex flex-column gap-3">
      {FIELDS.map((f) => {
        const active = f.type === 'bool' ? !!local[f.id] : false;

        return (
          <Panel key={f.id} darkMode={darkMode} $active={active}>
            <Head darkMode={darkMode} $active={active}>
              {f.id} — {f.label}
            </Head>
            <Hint darkMode={darkMode} $active={active}>{f.tip}</Hint>

            <Row>
              {f.type === 'bool' ? (
                <div className="flex align-items-center gap-2">
                  <StyledInputSwitch
                    darkMode={darkMode}
                    checked={!!local[f.id]}
                    onChange={(e) => setLocal(prev => ({ ...prev, [f.id]: e.value }))}
                    aria-label={`Alternar ${f.label}`}
                  />
                </div>
              ) : (
                <StyledInputText
                  darkMode={darkMode}
                  className="w-full"
                  value={local[f.id] ?? ''}
                  onChange={(e) => setLocal(prev => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder="Digite o valor…"
                />
              )}
            </Row>
          </Panel>
        );
      })}
    </div>
  );
}
