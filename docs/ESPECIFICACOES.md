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
| `#/o-liceu`        | `pages/o-liceu.html`       | Sobre o Liceu (história, objetivos e atuação).                   | Público   |
| `#/sobre`          | `pages/sobre.html`         | Sobre o projeto.                                                 | Público   |
| `#/contato`        | `pages/contato.html`       | Contato.                                                         | Público   |
| `#/login`          | `pages/login.html`         | Modal unificado de acesso (Artesão / Liceu) — ver nota abaixo.   | Público   |
| `#/cadastro`       | `pages/cadastro.html`      | Registro inicial de novos artesãos (nome, e-mail e senha).       | Público   |
| `#/painel-artesao` | `pages/painel-artesao/inicio.html` | Área do artesão: gerenciar perfil e cadastrar trabalhos. | Restrito  |
| `#/painel-liceu`   | `pages/painel-liceu/inicio.html`   | Área do Liceu: aprovar/rejeitar os trabalhos submetidos. | Restrito  |

**Abas dos painéis (sub-rotas).** Cada item do menu lateral é uma rota própria, carregada dentro da casca compartilhada `pages/layouts/painel.html`:

- Área do Liceu: `#/painel-liceu/artesaos`, `/cadastrar-artesao`, `/trabalhos-pendentes`, `/publicacoes`, `/configuracoes`.
- Área do Artesão: `#/painel-artesao/meu-perfil`, `/meus-trabalhos`, `/novo-trabalho`, `/status-publicacoes`.

A tabela completa (com arquivo, ícone e função de cada aba) fica em `js/rotas.js`.

Rotas inexistentes recaem na parcial de fallback `pages/nao-encontrado.html`.

**Login como modal.** `#/login` não é uma rota de `js/rotas.js`: `pages/login.html` é um `<dialog>` carregado sob demanda por `js/paginas/login.js` e aberto sobre a página atual.
- Links para `#/login` (como o "Entrar" do cabeçalho) são interceptados no `router.js` e abrem o modal direto, sem alterar o hash nem criar entrada no histórico.
- Se o endereço `#/login` for acessado diretamente (ou pela guarda de rota), o `router.js` troca o hash de volta para a página anterior com `history.replaceState` e abre o modal; num primeiro acesso, a página por baixo é `#/inicio`.

**Controle de acesso por perfil.** Como ainda não há back-end, o controle é feito no cliente e serve só para o fluxo e a demonstração (não é segurança real). A sessão fica no `localStorage` (`liceu:sessao`) e o campo `perfil` tem o mesmo valor do `layout` das rotas:
- `painel-artesao`: acessa só `#/painel-artesao/*` (próprio perfil, seus trabalhos, cadastro e edição).
- `painel-liceu` (administrador): acessa só `#/painel-liceu/*` (trabalhos pendentes, análise, aprovação e rejeição).
- O `router.js` verifica o acesso antes de carregar a parcial: sem sessão, redireciona para `#/login` e, após entrar, volta à página pedida; com outro perfil, bloqueia, avisa e leva ao painel do próprio perfil. Quem já entrou e abre `#/login` vai ao seu painel.
- `js/dados.js` repete a verificação nas operações de escrita (`salvarTrabalho`, `atualizarStatusTrabalho`) e na leitura dos trabalhos de um artesão (`exigirPerfil`). O artesão só altera trabalhos próprios; só o administrador aprova ou rejeita, e a rejeição exige motivo.
- Trabalhos criados ou analisados ficam em `localStorage` (`liceu:trabalhos`) e se sobrepõem a `data/trabalhos.json`.

Contas de teste (`data/usuarios.json`, senhas em texto puro só para demonstração):

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@liceu.mock` | `admin123` |
| Artesão (Ana Martins) | `artesao@liceu.mock` | `artesao123` |

# Convenções
- Pull Requests (PRs): Todo merge para a main deve passar por revisão cruzada de pelo menos um colega da equipe
- Branch Principal: main (código estável correspondente às entregas oficiais).
- Branches de Trabalho: Nomes descritivos baseados na tarefa, ex: feat/modal-artesao, fix/responsividade-cards, refactor/fluxo-aprovacao.

# Fonte de Dados
Como o projeto acadêmico foca inicialmente na interface e na lógica de front-end com Padrões Web, os dados da aplicação (artesãos, produtos, status de aprovação e categorias) serão persistidos em um arquivo .json.

Para simular o comportamento de banco de dados e persistência entre telas sem back-end, utilizaremos o localStorage do navegador integrado às funções do JavaScript.

# Hospedagem

Necessário definir com o Liceu.