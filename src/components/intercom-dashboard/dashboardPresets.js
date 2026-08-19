// src/components/intercom-dashboard/dashboardPresets.js
//
// Presets nomeados (widgets + filtros padrão) do Dashboard Intercom em
// localStorage — por usuário/navegador, sem backend de preferências.
// Tolerante a JSON corrompido/ausente: nunca lança para o caller.

import { normalizeConfig } from './dashboardWidgets';

const KEY = 'n1app.intercomDashboard.presets';
const CONFIG_KEY = 'n1app.intercomDashboard.config';

/** Config de trabalho (última usada), para sobreviver a reload. */
export function loadWorkingConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveWorkingConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(normalizeConfig(config)));
  } catch {
    /* storage indisponível — ignora */
  }
}

/** @returns {Array<{ name:string, config:object, filters?:object }>} */
export function loadPresets() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.name === 'string' && p.name.trim())
      .map((p) => ({ name: p.name, config: normalizeConfig(p.config), filters: p.filters ?? null }));
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // quota cheia / storage indisponível — caller decide o aviso
  }
}

/**
 * Cria/atualiza um preset por nome (case-insensitive). Retorna a lista nova.
 * @param {string} name
 * @param {{ config:object, filters?:object }} data
 */
export function savePreset(name, { config, filters } = {}) {
  const clean = String(name || '').trim();
  if (!clean) return loadPresets();
  const list = loadPresets().filter((p) => p.name.toLowerCase() !== clean.toLowerCase());
  list.push({ name: clean, config: normalizeConfig(config), filters: filters ?? null });
  list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  persist(list);
  return list;
}

/** Remove um preset por nome. Retorna a lista nova. */
export function deletePreset(name) {
  const clean = String(name || '').trim().toLowerCase();
  const list = loadPresets().filter((p) => p.name.toLowerCase() !== clean);
  persist(list);
  return list;
}
