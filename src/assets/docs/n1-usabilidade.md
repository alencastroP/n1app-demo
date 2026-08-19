# Documentação do N1 App

> 🔒 **Conteúdo bloqueado nesta demonstração.**
> A documentação real do N1 App é de **uso interno exclusivo** e foi removida
> desta réplica. O que você vê aqui é um texto de exemplo, criado apenas para
> demonstrar o layout da tela de documentação: navegação lateral, índice
> automático, busca e renderização de markdown.

## Sobre esta tela

A tela de documentação renderiza arquivos markdown com sumário gerado a partir
dos títulos, navegação entre seções e busca no conteúdo. Na aplicação real ela
reúne o guia de uso da plataforma, a referência da API e o guia de campos
programáveis.

Nesta demonstração, os três documentos foram substituídos por textos de exemplo.

## Como o índice funciona

Cada título de segundo nível vira uma entrada no sumário à direita, e a rolagem
destaca a seção ativa. Títulos de terceiro nível aparecem recuados.

### Exemplo de subtítulo

Este parágrafo existe apenas para mostrar o espaçamento entre um subtítulo e o
corpo do texto, além do contraste de cores no tema claro e no escuro.

## Elementos suportados

O renderizador cobre os elementos usuais de markdown:

- listas com marcador
- **negrito**, _itálico_ e `código inline`
- links e citações

1. listas numeradas
2. também são suportadas
3. com a mesma tipografia

> Blocos de citação são usados nos documentos reais para destacar avisos
> importantes e pré-requisitos.

### Blocos de código

```js
// Blocos de código recebem realce e rolagem horizontal quando necessário.
const exemplo = { demo: true, dadosReais: false };
```

### Tabelas

| Elemento | Suportado | Observação |
| --- | --- | --- |
| Título | Sim | Vira entrada do índice |
| Tabela | Sim | Com rolagem horizontal |
| Imagem | Sim | Ajustada à largura |

## Sobre esta demonstração

Esta réplica não consulta nenhuma API oficial. Todos os dados exibidos nas
demais telas são fictícios e gerados localmente.
