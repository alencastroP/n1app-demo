# Referência da API — exemplo de demonstração

> 🔒 **Conteúdo bloqueado nesta demonstração.**
> A referência real da API foi removida desta réplica. O texto abaixo é um
> exemplo genérico, escrito só para demonstrar o layout: o índice lateral, a
> busca por seção e o drawer de consulta rápida dentro da Central da API.

## Visão geral

Esta seção existe para mostrar como um documento longo é apresentado: título,
parágrafo introdutório e navegação por seções.

Na aplicação real, aqui ficaria a explicação sobre o funcionamento geral da API,
seus formatos de resposta e as convenções adotadas.

## Autenticação

A autenticação é feita por uma chave enviada em cabeçalho HTTP. Nesta
demonstração nenhuma chave é usada nem validada — qualquer texto é aceito nos
campos de credencial, e nenhuma requisição sai da máquina.

```http
GET /Recurso HTTP/1.1
Host: api.exemplo.invalid
Chave: SUA_CHAVE_AQUI
```

## Consultando registros

Exemplo de leitura com parâmetros de consulta:

```http
GET /Recurso?$select=Id,Nome&$top=50 HTTP/1.1
Host: api.exemplo.invalid
```

Resposta:

```json
{
  "value": [
    { "Id": 1, "Nome": "Registro de exemplo" },
    { "Id": 2, "Nome": "Outro registro" }
  ]
}
```

## Parâmetros de consulta

| Parâmetro | Para que serve | Exemplo |
| --- | --- | --- |
| `$select` | Escolhe as colunas retornadas | `$select=Id,Nome` |
| `$filter` | Filtra registros por condição | `$filter=Ativo eq true` |
| `$expand` | Traz entidades relacionadas | `$expand=Responsavel` |
| `$orderby` | Ordena o resultado | `$orderby=Data desc` |
| `$top` | Limita a quantidade | `$top=50` |
| `$skip` | Pula registros (paginação) | `$skip=100` |

## Criando registros

```http
POST /Recurso HTTP/1.1
Content-Type: application/json

{ "Nome": "Registro criado no exemplo" }
```

## Atualizando registros

```http
PATCH /Recurso(1) HTTP/1.1
Content-Type: application/json

{ "Nome": "Nome atualizado" }
```

## Removendo registros

```http
DELETE /Recurso(1) HTTP/1.1
```

## Códigos de resposta

| Código | Significado | O que fazer |
| --- | --- | --- |
| `200` | Requisição bem-sucedida | Seguir com o processamento |
| `201` | Registro criado | Guardar o identificador retornado |
| `400` | Requisição inválida | Revisar corpo e parâmetros |
| `401` | Não autenticado | Conferir o cabeçalho de autenticação |
| `404` | Não encontrado | Conferir o identificador informado |
| `429` | Limite de requisições atingido | Reduzir o volume e repetir depois |

## Boas práticas

- Peça apenas os campos necessários com `$select`.
- Pagine resultados grandes em vez de buscar tudo de uma vez.
- Trate `429` com nova tentativa espaçada.
- Nunca exponha credenciais em código versionado ou em prints.

## Sobre esta demonstração

Todos os exemplos acima são fictícios e apontam para domínios `.invalid`, que
nunca resolvem. Nenhuma chamada real é feita por esta réplica.
