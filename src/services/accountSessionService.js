// services/accountSessionService.js
// Chamadas diretas à API do Ploomes para a sessão global de "conta ativa".
// Padrão de service Ploomes-direto: uk sempre 1º argumento, fetch nativo,
// throw Error em falha. A UK nunca é logada nem incluída em mensagens de erro.

const PLOOMES = 'https://api2.ploomes.com';

function h(uk) {
  return { 'Content-Type': 'application/json', 'User-Key': uk };
}

async function ploomesGet(uk, path) {
  const resp = await fetch(`${PLOOMES}${path}`, { headers: h(uk) });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = `HTTP ${resp.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch { /* mantém msg padrão */ }
    throw new Error(msg);
  }
  return resp.json();
}

// ── Validação ──────────────────────────────────────────────────────────────────

/**
 * Valida a User-Key buscando os dados da própria conta.
 * Mesmo shape já usado em powerbiService.getPloomesAccount / changelogUtils.validateAccount.
 * @param {string} uk User-Key da conta
 * @returns {Promise<{ accountId: number, accountName: string, logoUrl: string|null }>}
 */
export async function validateAccount(uk) {
  const data = await ploomesGet(uk, '/Account?$select=Id,Name,LogoUrl');
  const account = data?.value?.[0];
  if (!account?.Id) throw new Error('Conta não encontrada para esta User-Key.');
  return {
    accountId: account.Id,
    accountName: account.Name ?? `Conta ${account.Id}`,
    logoUrl: account.LogoUrl ?? null,
  };
}
