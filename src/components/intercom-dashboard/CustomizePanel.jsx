// src/components/intercom-dashboard/CustomizePanel.jsx
//
// Painel "Personalizar relatório": toggles de widgets (métricas + blocos),
// ordenação simples dos blocos (mover ↑/↓) e presets nomeados (localStorage).
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';

import {
  METRIC_WIDGETS, BLOCK_WIDGETS, DEFAULT_CONFIG, RECOMMENDED_CONFIG, normalizeConfig,
} from './dashboardWidgets';

const Panel = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a0e2e' : '#f9f7ff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2a1f3d' : '#e5e0f5')};
  border-radius: 14px;
  margin-bottom: 1.25rem;
  box-shadow: ${({ $dm }) =>
    $dm ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(100,60,180,0.07)'};
  overflow: hidden;
`;

const HeaderBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1.4rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? 'rgba(226,232,240,.7)' : 'rgba(76,29,149,.75)')};

  i.chev { margin-left: auto; transition: transform 0.2s; }
  i.chev.open { transform: rotate(180deg); }
`;

const Body = styled.div`
  padding: 0 1.4rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
`;

const Section = styled.div``;

const SectionTitle = styled.p`
  margin: 0 0 0.65rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: ${({ $dm }) => ($dm ? '#b8a8d8' : '#4f2e84')};
`;

const ToggleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.6rem 1.1rem;
`;

const ToggleItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.84rem;
  color: ${({ $dm }) => ($dm ? '#d6ccec' : '#3b2163')};
  cursor: pointer;

  i { color: ${({ $dm }) => ($dm ? '#9a7fd6' : '#7443F6')}; width: 1rem; }
`;

const OrderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  background: ${({ $dm }) => ($dm ? 'rgba(0,0,0,0.18)' : 'rgba(116,67,246,0.04)')};
  margin-bottom: 0.4rem;
  opacity: ${({ $off }) => ($off ? 0.5 : 1)};

  span.name { font-size: 0.84rem; color: ${({ $dm }) => ($dm ? '#d6ccec' : '#3b2163')}; }
  .spacer { margin-left: auto; }
`;

const PresetRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PresetChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.3rem 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: ${({ $dm }) => ($dm ? 'rgba(116,67,246,0.18)' : 'rgba(116,67,246,0.1)')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#6d28d9')};
  border: 1px solid ${({ $dm }) => ($dm ? '#5b14b8' : '#c4b5fd')};

  button {
    background: none; border: none; cursor: pointer; padding: 0.1rem 0.2rem;
    color: inherit; opacity: 0.75; font-size: 0.75rem;
  }
  button.apply { font-weight: 700; }
  button:hover { opacity: 1; }
`;

export default function CustomizePanel({
  config, onChange, presets, onSavePreset, onApplyPreset, onDeletePreset, dm,
}) {
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const cfg = normalizeConfig(config);

  const toggle = (id) => onChange({ ...cfg, enabled: { ...cfg.enabled, [id]: !cfg.enabled[id] } });

  const move = (id, dir) => {
    const order = [...cfg.order];
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    onChange({ ...cfg, order });
  };

  const blockLabel = (id) => BLOCK_WIDGETS.find((b) => b.id === id)?.label ?? id;

  const handleSave = () => {
    const name = presetName.trim();
    if (!name) return;
    onSavePreset(name);
    setPresetName('');
  };

  return (
    <Panel $dm={dm}>
      <HeaderBtn type="button" $dm={dm} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <i className="pi pi-sliders-h" />
        Personalizar relatório
        <i className={`pi pi-chevron-down chev${open ? ' open' : ''}`} />
      </HeaderBtn>

      {open && (
        <Body>
          {/* Métricas (cards) */}
          <Section>
            <SectionTitle $dm={dm}>Cards de métrica</SectionTitle>
            <ToggleGrid>
              {METRIC_WIDGETS.map((w) => (
                <ToggleItem key={w.id} $dm={dm}>
                  <InputSwitch checked={!!cfg.enabled[w.id]} onChange={() => toggle(w.id)} />
                  <i className={`pi ${w.icon}`} />
                  {w.label}
                </ToggleItem>
              ))}
            </ToggleGrid>
          </Section>

          {/* Blocos (com ordenação) */}
          <Section>
            <SectionTitle $dm={dm}>Blocos (arraste a ordem com ↑ ↓)</SectionTitle>
            {cfg.order.map((id, idx) => (
              <OrderRow key={id} $dm={dm} $off={!cfg.enabled[id]}>
                <InputSwitch checked={!!cfg.enabled[id]} onChange={() => toggle(id)} aria-label={blockLabel(id)} />
                <span className="name">{blockLabel(id)}</span>
                <span className="spacer" />
                <Button
                  icon="pi pi-arrow-up" text rounded size="small"
                  disabled={idx === 0}
                  onClick={() => move(id, -1)}
                  aria-label={`Mover ${blockLabel(id)} para cima`}
                  style={{ color: dm ? '#c4b5fd' : '#7443F6', width: 30, height: 30 }}
                />
                <Button
                  icon="pi pi-arrow-down" text rounded size="small"
                  disabled={idx === cfg.order.length - 1}
                  onClick={() => move(id, 1)}
                  aria-label={`Mover ${blockLabel(id)} para baixo`}
                  style={{ color: dm ? '#c4b5fd' : '#7443F6', width: 30, height: 30 }}
                />
              </OrderRow>
            ))}
          </Section>

          {/* Atalhos de configuração */}
          <Section>
            <PresetRow>
              <Button label="Kit recomendado" icon="pi pi-sparkles" size="small" outlined
                onClick={() => onChange(RECOMMENDED_CONFIG)}
                style={{ borderColor: dm ? '#5b14b8' : '#c4b5fd', color: dm ? '#c4b5fd' : '#6d28d9' }} />
              <Button label="Layout padrão" icon="pi pi-refresh" size="small" text
                onClick={() => onChange(DEFAULT_CONFIG)}
                style={{ color: dm ? '#c4b5fd' : '#7443F6' }} />
            </PresetRow>
          </Section>

          {/* Presets nomeados */}
          <Section>
            <SectionTitle $dm={dm}>Presets salvos (neste navegador)</SectionTitle>
            <PresetRow style={{ marginBottom: presets.length ? '0.7rem' : 0 }}>
              <InputText
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                placeholder="Nome do preset (widgets + filtros atuais)"
                style={{ flex: 1, minWidth: 220, fontSize: '0.84rem' }}
              />
              <Button label="Salvar" icon="pi pi-save" size="small" disabled={!presetName.trim()}
                onClick={handleSave}
                style={{ background: presetName.trim() ? 'linear-gradient(90deg,#7b3ff2,#9a37eb)' : undefined, border: 'none' }} />
            </PresetRow>
            <PresetRow>
              {presets.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: dm ? '#9ca3af' : '#7f69ab' }}>
                  Nenhum preset salvo ainda.
                </span>
              )}
              {presets.map((p) => (
                <PresetChip key={p.name} $dm={dm}>
                  <button type="button" className="apply" onClick={() => onApplyPreset(p)} title="Aplicar preset">
                    {p.name}
                  </button>
                  <button type="button" onClick={() => onDeletePreset(p.name)} title="Excluir preset" aria-label={`Excluir ${p.name}`}>
                    <i className="pi pi-times" />
                  </button>
                </PresetChip>
              ))}
            </PresetRow>
          </Section>
        </Body>
      )}
    </Panel>
  );
}
