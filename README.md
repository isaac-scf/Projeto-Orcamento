# Projeto-Orçamento

API REST para gerenciamento de orçamentos comerciais, desenvolvida com Node.js, TypeScript, Express, Prisma e PostgreSQL.

## Funcionalidades

- Autenticação de usuários com JWT.
- Controle de acesso por cargo: `VENDEDOR`, `SUPERVISOR` e `GERENTE`.
- Importação e busca de produtos.
- Criação de orçamentos com itens e quantidades.
- Cálculo de descontos e margem bruta.
- Validação da margem mínima de 15% sobre o custo.
- Validação da alçada de desconto por cargo.
- Aprovação de orçamentos pendentes.
- Listagem de orçamentos aguardando aprovação.

## Tecnologias

- Node.js e TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT
- Zod
- Vitest

## Pré-requisitos

- Node.js e npm instalados.
- PostgreSQL disponível.
- Arquivo `.env` configurado.

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz:

   ```env
   DATABASE_URL="URL_DE_CONEXAO_DO_POSTGRESQL"
   JWT_SECRET="SUA_CHAVE_SECRETA"
   ```

   Substitua os valores pelos dados do seu ambiente. Nunca publique esse arquivo.

3. Aplique as migrações:

   ```bash
   npx prisma migrate deploy
   ```

## Executar a API

```bash
npm run dev
```

O servidor utiliza a porta `3000`.

## Autenticação

### POST `/login`

Autentica um usuário e retorna um token JWT válido por 2 horas.

Corpo da requisição:

```json
{
  "email": "usuario@exemplo.com",
  "senha": "sua_senha"
}
```

Resposta de sucesso (`200`):

```json
{
  "token": "TOKEN_JWT",
  "usuario": {
    "id": 1,
    "nome": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "cargo": "VENDEDOR"
  }
}
```

Possíveis erros:
- `400`: e-mail ou senha ausentes ou inválidos.
- `401`: credenciais incorretas.
- `500`: erro interno durante o login.
## Rotas da API

| Método | Rota | Finalidade | Acesso |
|---|---|---|---|
| GET | `/` | Verificar funcionamento da API | Público |
| POST | `/login` | Autenticar usuário | Público |
| POST | `/produtos/importar` | Importar produtos de arquivo | Público |
| GET | `/produtos/busca` | Buscar produtos | Público |
| POST | `/orcamentos` | Criar orçamento | Autenticado |
| GET | `/orcamentos/pendentes` | Listar orçamentos pendentes | Supervisor ou gerente |
| POST | `/orcamentos/:id/aprovar` | Aprovar orçamento pendente | Supervisor ou gerente |

Os níveis de acesso acima refletem as regras implementadas no projeto. As rotas de produtos não exigem autenticação atualmente.

### POST `/orcamentos`

Cria um orçamento com cliente, itens e desconto opcional.

Exemplo de corpo JSON:

```json
{
  "cliente": "Cliente Teste",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 2
    }
  ],
  "descontoPercentual": 5
}
```

Regras de validação:

- `cliente`: texto não vazio.
- `itens`: lista com pelo menos um item.
- `produtoId`: número inteiro positivo.
- `quantidade`: número inteiro positivo.
- `descontoPercentual`: número entre 0 e 100; se omitido, assume `0`.

O vendedor é identificado pelo token de autenticação, não pelo corpo da requisição.

A API calcula os valores do orçamento. Se o preço final ficar abaixo do custo acrescido de 15%, a operação é bloqueada com erro HTTP 400. Se o desconto ultrapassar a alçada do cargo, o orçamento fica pendente de aprovação.

### GET `/orcamentos/pendentes`

Lista os orçamentos que aguardam aprovação.

Requer token JWT de supervisor ou gerente.

### POST `/orcamentos/:id/aprovar`

Aprova um orçamento pendente.

- `id`: identificador do orçamento na URL.
- Requer token JWT de supervisor ou gerente.
- O orçamento precisa estar em um estado que permita a aprovação.

### POST `/produtos/importar`

Importa produtos de um arquivo enviado por `multipart/form-data`, no campo `arquivo`.

Formatos aceitos: `.csv`, `.xlsx` e `.xls`.

O arquivo precisa conter as colunas:

| Coluna | Descrição |
|---|---|
| `codigo` | Código do produto |
| `descricao` | Descrição do produto |
| `custoUnitario` | Custo unitário numérico |
| `precoTabela` | Preço de tabela numérico |
| `categoria` | Categoria do produto |

Exemplo de CSV:

```csv
codigo,descricao,custoUnitario,precoTabela,categoria
P001,Cabo elétrico,10,15,Elétrica
P002,Disjuntor,20,30,Proteção
```

A importação atualiza produtos existentes com o mesmo código e cria os novos.

A resposta informa `totalLinhas`, `importados` e `invalidos`. O campo `invalidos` contém os números das linhas rejeitadas.

### GET `/produtos/busca`

Busca produtos por código ou descrição, sem diferenciar maiúsculas de minúsculas.

Exemplo:

```http
GET /produtos/busca?termo=cabo
```

O parâmetro `termo` é obrigatório.

Possíveis respostas:
- `200`: lista de produtos encontrados.
- `400`: parâmetro `termo` ausente ou inválido.
- `500`: erro interno durante a busca.

### Códigos HTTP

- `200`: operação realizada com sucesso.
- `201`: orçamento criado.
- `400`: dados inválidos ou regra de negócio violada.
- `401`: autenticação ausente ou inválida.
- `403`: usuário sem permissão para a operação.
- `404`: recurso não encontrado.
- `500`: erro interno do servidor.

## Regras de negócio

- Vendedor: desconto de até 5% dentro da própria alçada.
- Supervisor: desconto de até 10% dentro da própria alçada.
- Gerente: sem limite de alçada de desconto.
- A margem mínima de 15% sobre o custo é obrigatória para todos os cargos.
- Orçamentos fora da alçada ficam pendentes de aprovação.
- Somente supervisor e gerente podem aprovar orçamentos pendentes.

## Testes e verificação

Executar os testes:

```bash
npm test
```

Verificar a cobertura:

```bash
npx vitest run --coverage
```

Verificar os tipos TypeScript:

```bash
npx tsc --noEmit
```

## Segurança

- Não versione o arquivo `.env`.
- Não publique tokens JWT, senhas ou credenciais do banco.
- Utilize segredos próprios para cada ambiente.
