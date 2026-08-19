// src/components/apihub/apiDocUtils.js
// Utilitários compartilhados entre ApiDocDrawer e ApiDocOverlay
import apiDocContent from '../../assets/docs/ploomes_api_documentation_usuario_final.md?raw';

export { apiDocContent };

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function extractH2Headings(md) {
  return md
    .split('\n')
    .filter((l) => l.match(/^## /))
    .map((l) => l.replace(/^## /, '').trim());
}

export function splitIntoSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current !== null) sections.push(current);
      current = { heading: line.replace(/^## /, '').trim(), content: line + '\n' };
    } else if (current === null) {
      if (sections.length === 0) sections.push({ heading: null, content: line + '\n' });
      else sections[0].content += line + '\n';
    } else {
      current.content += line + '\n';
    }
  }
  if (current !== null) sections.push(current);
  return sections;
}

