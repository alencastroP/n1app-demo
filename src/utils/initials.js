// src/utils/initials.js
// Iniciais para avatares (usuário logado, conta ativa) — no máximo 2 letras.

export default function getInitials(name, fallback = '??') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
