# Descrição do Projeto
O Portal do Artesão do Liceu de Ofícios é uma plataforma digital de divulgação e catálogo voltada à valorização do artesanato local, dos saberes tradicionais e dos profissionais vinculados ao Liceu em Curitiba.

**Propósito Principal:** Servir como vitrine digital centralizada para que artesãos apresentem suas histórias, técnicas e produtos, superando barreiras tecnológicas na transição para o ambiente digital.

### Escopo Funcional (Ciclo 1 / MVP):

- Listagem pública de artesãos com cards interativos e modais de detalhes.

- Área de cadastro e login para artesãos e para a equipe administrativa do Liceu.

- Cadastro de produtos/trabalhos pelos artesãos com fluxo de moderação (necessidade de aprovação prévia pelo Liceu antes de irem ao ar).

- Filtros por categorias, nichos e técnicas com opções pré-definidas.

# Stack Tecnológica

- Linguagens Base: HTML5 semântico, CSS3 e JavaScript puro.
- Arquitetura: Sem utilização de frameworks de front-end (como React, Vue ou Angular) e sem etapas de build obrigatórias (o código roda nativamente direto no navegador).
- Estilização e Identidade Visual: Adesão estrita à identidade visual oficial do Liceu de Ofícios de Curitiba (utilizando variáveis de cores e tipografia padronizadas via CSS).

# Estratégia de Navegação
A aplicação funcionará como uma Single Page Application (SPA) com **roteamento por hash** (`index.html#/rota`).

Existe um único arquivo HTML real (`index.html`), que contém o cabeçalho, o rodapé e um contêiner principal (`#conteudo`). O roteador em `js/router.js` escuta o evento `hashchange`, identifica a rota atual pelo fragmento da URL e injeta no contêiner a **parcial HTML** correspondente, carregada da pasta `pages/` via `fetch`.

Optou-se pelo hash routing (em vez da History API ou de páginas HTML separadas) porque funciona em qualquer hospedagem estática sem configuração de servidor, preserva o funcionamento de recarregamento (F5) e de links diretos (deep-link), e não exige etapa de build — alinhado à stack de JS puro do projeto.

**Convenção de rotas:**
Cada rota corresponde a uma parcial em `pages/` (um fragmento HTML, não um documento completo) registrada no array `rotas` do `router.js`.

| Rota (hash)        | Parcial                    | Descrição                                                        | Acesso    |
| ------------------ | -------------------------- | ---------------------------------------------------------------- | --------- |
| `#/inicio`         | `pages/inicio.html`        | Home / Vitrine principal.                                        | Público   |
| `#/produtos`       | `pages/produtos.html`      | Catálogo de produtos/trabalhos.                                  | Público   |
| `#/artesaos`       | `pages/artesaos.html`      | Listagem de artesãos com cards e modais de detalhes.             | Público   |
| `#/saberes`        | `pages/saberes.html`       | Saberes e técnicas tradicionais.                                 | Público   |
| `#/sobre`          | `pages/sobre.html`         | Sobre o projeto.                                                 | Público   |
| `#/contato`        | `pages/contato.html`       | Contato.                                                         | Público   |
| `#/login`          | `pages/login.html`         | Tela unificada de acesso (Artesão / Liceu).                      | Público   |
| `#/cadastro`       | `pages/cadastro.html`      | Registro inicial de novos artesãos (nome, e-mail e senha).       | Público   |
| `#/painel-artesao` | `pages/painel-artesao.html`| Área do artesão: gerenciar perfil e cadastrar trabalhos.         | Restrito  |
| `#/painel-liceu`   | `pages/painel-liceu.html`  | Área do Liceu: aprovar/rejeitar os trabalhos submetidos.         | Restrito  |

Rotas inexistentes recaem na parcial de fallback `pages/nao-encontrado.html`.

**Proteção de rotas restritas:**
Como não há back-end, as áreas restritas (`#/painel-artesao` e `#/painel-liceu`) são protegidas no cliente por uma guarda de rota no `router.js`: antes de carregar a parcial, verifica-se a sessão persistida no `localStorage` e, na ausência de sessão válida (ou de permissão compatível com o painel), o usuário é redirecionado para `#/login`.

# Convenções
- Pull Requests (PRs): Todo merge para a main deve passar por revisão cruzada de pelo menos um colega da equipe
- Branch Principal: main (código estável correspondente às entregas oficiais).
- Branches de Trabalho: Nomes descritivos baseados na tarefa, ex: feat/modal-artesao, fix/responsividade-cards, refactor/fluxo-aprovacao.

# Fonte de Dados
Como o projeto acadêmico foca inicialmente na interface e na lógica de front-end com Padrões Web, os dados da aplicação (artesãos, produtos, status de aprovação e categorias) serão persistidos em um arquivo .json.

Para simular o comportamento de banco de dados e persistência entre telas sem back-end, utilizaremos o localStorage do navegador integrado às funções do JavaScript.

# Hospedagem

Necessário definir com o Liceu.