# Modelo de Dados do Portal

Este documento descreve as estruturas de dados do Portal do Artesão e a API do servidor que as guarda.

> ⚠️ **Todos os dados em `data/` são fictícios** e existem só para desenvolvimento e testes. Os nomes seguem o padrão `teste_<entidade>_<n>` (ex.: `teste_artesao_1`) para que nunca sejam confundidos com dados reais.

## Visão geral

- O banco de dados é um conjunto de arquivos `.json`, um por coleção, lido e gravado pelo servidor Node (`server/`).
- `data/` guarda os **dados iniciais** (semente), versionados no git. `db/` é o **banco em uso**: o servidor cria essa pasta copiando `data/` na primeira execução, e é nela que todas as alterações são gravadas. `db/` fica fora do git.
- Para voltar ao estado inicial, rode `npm run resetar` (apaga as alterações e copia `data/` de novo para `db/`). Faça isso também depois de mudar algo em `data/`.
- O navegador nunca lê os arquivos direto: usa as funções de `js/dados.js`, que fazem requisições para a API em `/api`.
- Só existem **dois perfis de conta**: `admin` (equipe do Liceu) e `artesao`. Visitantes não têm conta.

| Arquivo (semente)       | Coleção      | Conteúdo                                   |
| ----------------------- | ------------ | ------------------------------------------ |
| `data/usuarios.json`    | `usuarios`   | Contas de admin e artesão (com o perfil público do artesão) |
| `data/produtos.json`    | `produtos`   | Produtos/trabalhos cadastrados pelos artesãos |
| `data/tecnicas.json`    | `tecnicas`   | Técnicas pré-definidas                     |
| `data/nichos.json`      | `nichos`     | Nichos pré-definidos                       |
| `data/categorias.json`  | `categorias` | Categorias pré-definidas                   |

## Relacionamentos

```
categoria 1 ──── N técnica            (tecnica.categoriaId)

usuário (perfil "artesao")
   │  N ──── N nicho                  (usuario.nichoIds[])
   │  N ──── N técnica                (usuario.tecnicaIds[])
   │
   1
   │
   N
produto
      N ──── N categoria              (produto.categoriaIds[])
      N ──── N técnica                (produto.tecnicaIds[])
```

- Um **artesão** tem vários **produtos**. Cada produto pertence a exatamente um artesão (`produto.artesaoId` → `usuario.id`).
- Artesão e produto podem ter vários nichos, técnicas e categorias, sempre referenciados por `id`.
- Cada técnica pertence a uma categoria, o que permite filtrar técnicas por categoria na página Saberes.

## Entidades

### Usuário (`usuarios`)

Login e perfil público ficam no **mesmo objeto**. Os campos de perfil público só existem quando `perfil` é `"artesao"`.

| Campo         | Tipo                      | Obrigatório | Descrição |
| ------------- | ------------------------- | ----------- | --------- |
| `id`          | string                    | sim         | Identificador único. |
| `perfil`      | `"admin"` \| `"artesao"`  | sim         | Tipo de conta. |
| `nome`        | string                    | sim         | Nome da pessoa. |
| `email`       | string                    | sim         | E-mail de login. Nunca exibido na área pública. |
| `senhaHash`   | string                    | sim         | SHA-256 (hex) da senha. Veja [Senhas](#senhas). |
| `criadoEm`    | string (ISO 8601)         | sim         | Data de criação da conta. |
| `foto`        | string \| null            | artesão     | Caminho da imagem ou data URL. |
| `nomeNegocio` | string \| null            | artesão     | Nome do negócio ou @ profissional. |
| `nichoIds`    | string[]                  | artesão     | Ids de `nichos`. |
| `tecnicaIds`  | string[]                  | artesão     | Ids de `tecnicas`. |
| `historia`    | string \| null            | artesão     | Como começou no artesanato. |
| `redeSocial`  | string \| null            | artesão     | URL da rede social. |
| `whatsapp`    | string \| null            | artesão     | Só dígitos, com DDI e DDD (ex.: `5541999999999`), pronto para `https://wa.me/<numero>`. |

Um artesão recém-cadastrado (issue #24) tem os campos de perfil vazios (`null` ou `[]`) até completar o perfil (issue #27).

### Produto (`produtos`)

| Campo            | Tipo               | Obrigatório | Descrição |
| ---------------- | ------------------ | ----------- | --------- |
| `id`             | string             | sim         | Identificador único. |
| `artesaoId`      | string             | sim         | `id` do usuário artesão dono do produto. |
| `nome`           | string             | sim         | Nome do trabalho. |
| `descricao`      | string             | sim         | Descrição. |
| `imagem`         | string \| null     | ao enviar   | Caminho da imagem ou data URL (upload). |
| `categoriaIds`   | string[]           | ao enviar   | Ids de `categorias`. |
| `tecnicaIds`     | string[]           | ao enviar   | Ids de `tecnicas`. |
| `materiais`      | string[]           | não         | Materiais usados (texto livre). |
| `status`         | string             | sim         | Veja [Status das publicações](#status-das-publicações). |
| `motivoRejeicao` | string \| null     | não         | Preenchido pelo Liceu ao rejeitar. |
| `criadoEm`       | string (ISO 8601)  | sim         | Criação do produto. |
| `enviadoEm`      | string \| null     | não         | Último envio para análise. |
| `avaliadoEm`     | string \| null     | não         | Última aprovação ou rejeição. |

"Ao enviar" quer dizer que o campo pode ficar vazio no rascunho, mas deve ser validado antes do envio para análise.

### Técnica (`tecnicas`)

| Campo         | Tipo   | Descrição |
| ------------- | ------ | --------- |
| `id`          | string | Identificador (slug). |
| `nome`        | string | Nome exibido. |
| `descricao`   | string | Breve descrição (página Saberes). |
| `categoriaId` | string | Id da categoria à qual a técnica pertence. |

### Nicho (`nichos`) e Categoria (`categorias`)

| Campo  | Tipo   | Descrição |
| ------ | ------ | --------- |
| `id`   | string | Identificador (slug). |
| `nome` | string | Nome exibido. |

## Status das publicações

O produto guarda **apenas o estado atual** (sem histórico). Os valores e rótulos estão em `STATUS` e `ROTULOS_STATUS`, exportados por `js/dados.js`.

| Valor        | Rótulo                | Aparece na área pública? |
| ------------ | --------------------- | ------------------------ |
| `rascunho`   | Rascunho              | Não |
| `aguardando` | Aguardando aprovação  | Não |
| `publicado`  | Publicado             | **Sim** |
| `rejeitado`  | Rejeitado             | Não |

Fluxo previsto:

```
rascunho ──enviar──▶ aguardando ──aprovar──▶ publicado
                        │
                        └──rejeitar──▶ rejeitado ──corrigir e reenviar──▶ aguardando
```

- Ao enviar: `status = "aguardando"`, `enviadoEm = agora`.
- Ao aprovar: `status = "publicado"`, `avaliadoEm = agora`, `motivoRejeicao = null`.
- Ao rejeitar: `status = "rejeitado"`, `avaliadoEm = agora`, `motivoRejeicao = "<motivo>"`.

## Senhas

- O servidor guarda as senhas como SHA-256 em hexadecimal (`senhaHash`). O campo `senhaHash` **nunca** é devolvido pela API.
- Para criar um usuário ou trocar a senha, envie o campo `senha` em texto (mínimo de 6 caracteres). O servidor gera o hash e descarta a senha. Um `senhaHash` enviado pelo cliente é ignorado.
- O login é feito por `POST /api/login`, que compara o hash no servidor.
- **Senha de todas as contas fictícias: `teste123`.**

> ⚠️ **Limitações.** SHA-256 sem *salt* não é adequado para contas reais (o ideal seria `scrypt` ou `bcrypt`). A API também não exige autenticação: qualquer pessoa que acesse o servidor pode criar, alterar ou apagar dados. A guarda das áreas restritas continua sendo feita no cliente. Antes de usar com contas reais, é preciso adicionar sessão ou token nas rotas de escrita.

## API REST do servidor

Rode `npm start` e acesse `http://localhost:3000`. O servidor entrega o site e responde em `/api`. `<colecao>` é uma de `usuarios`, `produtos`, `tecnicas`, `nichos` ou `categorias`.

| Método   | Rota                    | Corpo           | Resposta |
| -------- | ----------------------- | --------------- | -------- |
| `GET`    | `/api/<colecao>`        | —               | `200` com a lista. Aceita filtros na query (veja abaixo). |
| `GET`    | `/api/<colecao>/<id>`   | —               | `200` com o item, ou `404`. |
| `POST`   | `/api/<colecao>`        | item sem `id`   | `201` com o item criado. O `id` é gerado pelo servidor. |
| `PUT`    | `/api/<colecao>/<id>`   | item completo   | `200` com o item. Substitui tudo (exceto `senhaHash`, que é mantido). |
| `PATCH`  | `/api/<colecao>/<id>`   | só os campos a mudar | `200` com o item atualizado. |
| `DELETE` | `/api/<colecao>/<id>`   | —               | `204`, ou `404`. |
| `POST`   | `/api/login`            | `{ email, senha }` | `200` com o usuário, ou `401`. |

- **Filtros:** cada parâmetro da query compara um campo por igualdade. Em campos de array, basta conter o valor. Ex.: `/api/produtos?status=publicado&tecnicaIds=teste_tecnica_1`.
- **Erros** vêm como `{ "erro": "mensagem" }`: `400` (JSON inválido, senha curta), `404`, `409` (e-mail já cadastrado), `413` (corpo acima de 10 MB).
- O `id` da URL sempre prevalece sobre um `id` enviado no corpo.
- Gravações na mesma coleção são feitas uma de cada vez, então requisições simultâneas não se sobrescrevem.

## API de `js/dados.js`

Todas as funções que acessam o servidor retornam `Promise` (use `await`). Quando a API responde com erro, elas lançam `ErroApi`, que tem `status` (código HTTP) e `message`.

| Função | Retorno | Uso |
| ------ | ------- | --- |
| `listar(colecao, filtros?)` | array | Itens de uma coleção. `filtros` é opcional, ex.: `{ status: 'publicado' }`. |
| `buscarPorId(colecao, id)` | objeto \| `null` | Um item pelo id. |
| `criar(colecao, item)` | objeto | Cria o item. O servidor gera o `id`. |
| `substituir(colecao, id, item)` | objeto | Troca o item inteiro. |
| `atualizar(colecao, id, campos)` | objeto | Altera só os campos enviados. |
| `remover(colecao, id)` | `null` | Apaga o item. |
| `salvar(colecao, item)` | objeto | Atalho: `criar` sem `id`, `substituir` com `id`. |
| `entrar(email, senha)` | objeto | Login. Lança `ErroApi` com status `401` se falhar. |
| `listarArtesaos()` | array | Artesãos **sem** `email`. |
| `buscarArtesao(id)` | objeto \| `null` | Um artesão, sem `email`. |
| `listarProdutosPublicados()` | array | Só produtos com status `publicado`. |
| `listarProdutosDoArtesao(artesaoId)` | array | Todos os produtos de um artesão (qualquer status). |
| `listarProdutosAguardando()` | array | Produtos aguardando aprovação (painel do Liceu). |

Exemplo de uso em um módulo dentro de `js/`:

```js
import { listar, listarArtesaos, atualizar, STATUS } from './dados.js';

const nichos = await listar('nichos');
const artesaos = await listarArtesaos();

// Aprovar um produto
await atualizar('produtos', 'teste_produto_2', {
  status: STATUS.PUBLICADO,
  avaliadoEm: new Date().toISOString(),
  motivoRejeicao: null,
});
```

## Dados fictícios incluídos

| Entidade   | Itens |
| ---------- | ----- |
| Usuários   | `teste_admin_1` (admin), `teste_artesao_1`, `teste_artesao_2`, `teste_artesao_3` (perfil vazio) |
| Produtos   | `teste_produto_1` (publicado), `teste_produto_2` (aguardando), `teste_produto_3` (rejeitado), `teste_produto_4` (rascunho) |
| Técnicas   | `teste_tecnica_1`, `teste_tecnica_2`, `teste_tecnica_3` |
| Nichos     | `teste_nicho_1`, `teste_nicho_2` |
| Categorias | `teste_categoria_1`, `teste_categoria_2` |

Imagens fictícias: `assets/placeholders/artesao.svg` e `assets/placeholders/produto.svg`.
