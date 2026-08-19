# N1 App — réplica visual (demo offline)

Cópia navegável do front do N1 App, feita para **demonstrar o design e o fluxo
de uso** sem depender de backend, sem credenciais e sem tocar em nenhuma API
oficial (Ploomes, Intercom, Omie, Sankhya, n8n ou o backend do próprio app).

Esta pasta é ignorada pelo Git (`/demo/` no `.gitignore` da raiz).

---

## Como rodar

```bash
cd demo
npm install
npm run dev          # http://localhost:5273
```

Na tela de login, **qualquer e-mail e senha entram**. Dentro do app, **qualquer
texto serve como User-Key**.

Outros comandos: `npm run build` (gera `dist/`) e `npm run preview`.

---

## Como funciona

O código do app é o mesmo do `frontend/` — páginas, componentes, design system,
rotas, matriz de permissões e estilos foram copiados sem alteração de layout.
A diferença está numa única camada, em `src/mock/`:

```
src/mock/
├── boot.js         primeiro import do main.jsx — instala o interceptor
├── install.js      substitui window.fetch e roteia as chamadas
├── http.js         helpers de Response (json, blob, SSE, latência)
├── seed.js         gerador determinístico + nomes fictícios
├── fixtures.js     os dados da demo (contas, campos, casos, relatórios…)
├── jobs.js         jobs assíncronos simulados (progresso por tempo)
├── xlsx.js         gera planilhas .xlsx reais para os downloads
├── demoSession.js  usuário da demo + "JWT" local
├── DemoBadge.jsx   selo de aviso no canto da tela
└── routes/
    ├── backend.js  rotas /api/* do backend do N1 App
    └── ploomes.js  api2.ploomes.com, logs-api, sankhya-query-api, n8n
```

`boot.js` é o **primeiro import** de `main.jsx`. Como módulos ES são avaliados
na ordem em que aparecem, `window.fetch` já está substituído antes de qualquer
módulo do app carregar. Por isso nenhum service precisou ser modificado: eles
continuam chamando `fetch` normalmente — só que a resposta vem de `src/mock/`.

Se alguma rota não estiver mapeada, o interceptor devolve um payload vazio
plausível e loga um aviso no console. **Ele nunca deixa a requisição sair para
a rede.**

### O que está simulado

- **Login e sessão** — token local, perfil Administrador, equipe Técnicos N1
  (para que todos os serviços apareçam na Store).
- **Streaming real** — as telas com SSE (dashboard do Intercom, ações em massa,
  documentador, auditoria de IA, churn) recebem eventos em etapas, com pausa
  entre eles: as barras de progresso andam de verdade.
- **Jobs assíncronos** — mesclagem, extração de chamados e auditoria de usuários
  têm progresso derivado do tempo decorrido, com polling normal da tela.
- **Downloads** — os botões de exportar geram `.xlsx`, `.csv`, `.md` e `.json`
  de verdade, com conteúdo de exemplo.

### Dados

Todos fictícios e **determinísticos**: o gerador usa semente fixa, então cada
reload mostra exatamente os mesmos números — bom para print, gravação e
apresentação. Empresas e pessoas são inventadas e os e-mails usam domínios
`.invalid`, que nunca resolvem.

---

## Sanitização — o que foi removido

Esta réplica é feita para ser compartilhada, então o conteúdo interno foi
retirado da cópia. **Nada disso afeta o `frontend/` original.**

| Item | O que era | O que virou |
| --- | --- | --- |
| `assets/docs/*.md` | 3 documentos marcados "uso interno exclusivo — confidencial" (~2.750 linhas) | Textos genéricos com aviso de bloqueio, mantendo a estrutura de títulos para o índice e o drawer da Central da API continuarem funcionando |
| Host do backend | Endereço real de produção (Azure), em 9 arquivos | `backend.demo.invalid` |
| Webhook de automação | URL real do n8n, com o caminho do fluxo | `n8n.demo.invalid/webhook/daily-demo` |
| Hosts admin do Sankhya | Dois domínios internos de produção/homologação | `sankhya-admin.demo.invalid` / `sankhya-homolog.demo.invalid` |
| Outros hosts | Monitor de filas e host de shard público | `monitor.demo.invalid` / `api.demo.invalid` |
| `config/churnClaudePrompt.js` | Taxonomia de sinais de churn com os pesos usados pelo time | Prompt curto e genérico |
| `config/ploomesTicketsPrompts.js` | Prompts de análise citando ferramentas internas | Prompts genéricos, mesmos ids/títulos/ícones |
| IDs de equipe e perfil | Identificadores reais da conta de permissões | Números fictícios (`9000101`+), usados só simbolicamente |

Verificação: `dist/` foi reconstruído e varrido — nenhum dos termos acima
aparece no build, e nenhum é visível na UI (checado nas 32 rotas).

### Risco residual conhecido

Coisas que **permanecem** na réplica por serem parte do design que ela precisa
demonstrar. Nenhuma é credencial ou dado de cliente, mas vale saber antes de
divulgar mais amplamente:

- **Matriz de permissões** (`config/teamsConfig.js`) — nomes das equipes e quais
  serviços cada uma acessa. Os nomes aparecem na tela de Gerenciar Usuários.
- **Playbooks do Funil do Técnico** (`config/funilTecnicoPlaybooks.js`,
  `caseTaxonomy.js`) — o processo de triagem por categoria e a menção ao
  Dynatrace como ferramenta de logs. Remover isso esvaziaria a tela de
  Workspace do Caso.
- **Catálogo de serviços** — nomes e descrições de todos os serviços internos.
- **`api2.ploomes.com`** — API pública e documentada; mantida por ser o
  endereço que os exemplos de tela exibem.

Se a demo for para público externo, o caminho mais rápido para tratar os dois
primeiros é trocar os rótulos em `config/teamsConfig.js` e `caseTaxonomy.js` por
nomes genéricos — a lógica não depende do texto.

---

## Diferenças em relação ao app real

Fora a camada `src/mock/`, só três arquivos divergem do `frontend/`:

| Arquivo | Diferença |
| --- | --- |
| `src/main.jsx` | importa `./mock/boot` e monta o `<DemoBadge />` |
| `src/config/version.js` | rótulo fixo `demo` no lugar da versão do package.json |
| `src/components/Layout.jsx`, `src/pages/Login.jsx` | badge de versão sem o prefixo `v` |
| `src/assets/docs/*.md`, `src/config/*Prompt*.js`, `teamsConfig.js`, `permissionsConfig.js`, hosts nos services | sanitizados — ver a seção acima |

Também foram removidos os arquivos `*.stories.jsx` (Storybook) e as dependências
de teste, que não fazem sentido numa demo.

> **Nota:** as fontes (Manrope/Montserrat) continuam vindo do Google Fonts, como
> no app real. É o único acesso externo — se a máquina estiver sem internet, a
> demo funciona igual, só cai para a fonte padrão do sistema.

---

## Estender a demo

Para enriquecer uma tela, adicione ou ajuste o handler correspondente:

1. Abra o console do navegador e navegue até a tela — rotas não mapeadas
   aparecem como `[demo] Rota não mapeada: /api/...`.
2. Adicione a rota em `src/mock/routes/backend.js` (ou `ploomes.js`).
3. Coloque os dados em `src/mock/fixtures.js` para reaproveitar entre telas.

O formato do retorno precisa bater com o que a página consome — o jeito mais
rápido de descobrir é ler o service correspondente em `src/services/`.
