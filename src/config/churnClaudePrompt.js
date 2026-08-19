// src/config/churnClaudePrompt.js
//
// 🔒 Conteúdo substituído nesta réplica.
// O prompt real de análise de churn contém a taxonomia de sinais de risco e os
// pesos usados pelo time — metodologia interna. Aqui fica só um texto de
// exemplo, o suficiente para a tela mostrar o card de "copiar prompt" com o
// mesmo layout.

export const CHURN_CLAUDE_PROMPT = `## Persona
Você é um analista de Sucesso do Cliente avaliando conversas de suporte.

## Objetivo
A partir do arquivo anexado a esta conversa:
1. Identifique sinais de insatisfação em cada atendimento.
2. Classifique o risco de cancelamento em baixo, médio ou alto.
3. Justifique a classificação citando trechos da conversa.
4. Devolva o resultado em JSON válido, sem texto adicional.

## Formato de saída
[
  {
    "conversa_id": "string",
    "cliente": "string",
    "risco": "baixo | medio | alto",
    "motivos": ["string"],
    "trechos": ["string"]
  }
]

---
Prompt de demonstração — o conteúdo real é de uso interno e não acompanha esta réplica.`;
