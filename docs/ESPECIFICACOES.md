# Descrição do Projeto
O Portal do Artesão do Liceu de Ofícios é uma plataforma digital de divulgação e catálogo voltada à valorização do artesanato local, dos saberes tradicionais e dos profissionais vinculados ao Liceu em Curitiba.

**Propósito Principal:** Servir como vitrine digital centralizada para que artesãos apresentem suas histórias, técnicas e produtos, superando barreiras tecnológicas na transição para o ambiente digital.

### Escopo Funcional (Ciclo 1 / MVP):

- Listagem pública de artesãos com cards interativos e modais de detalhes.

- Login para artesãos e equipe administrativa do Liceu; cadastro pelo administrador com senha provisória e autocadastro público com conclusão do perfil.

- Cadastro de produtos/trabalhos pelos artesãos com fluxo de moderação (necessidade de aprovação prévia pelo Liceu antes de irem ao ar).

- Filtros por categorias, nichos e técnicas com opções pré-definidas.

# Stack Tecnológica

- Linguagens Base: HTML5 semântico, CSS3 e JavaScript puro.
- Arquitetura: Sem utilização de frameworks de front-end (como React, Vue ou Angular) e sem etapas de build obrigatórias (o código roda nativamente direto no navegador).
- Estilização e Identidade Visual: Interpretação digital proposta a partir do símbolo do Liceu de Ofícios de Curitiba (utilizando variáveis de cores e tipografia padronizadas via CSS).

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
| `#/produto?id=<id>` | `pages/produto.html` | Detalhe de um trabalho publicado de artesão ativo. | Público |
| `#/artesaos`       | `pages/artesaos.html`      | Listagem de artesãos com cards e modais de detalhes.             | Público   |
| `#/saberes`        | `pages/saberes.html`       | Saberes e técnicas tradicionais.                                 | Público   |
| `#/o-liceu`        | `pages/o-liceu.html`       | Sobre o Liceu (história, objetivos e atuação).                   | Público   |
| `#/sobre`          | `pages/sobre.html`         | Sobre o projeto.                                                 | Público   |
| `#/contato`        | `pages/contato.html`       | Contato.                                                         | Público   |
| `#/login`          | `pages/login.html`         | Modal unificado de acesso (Artesão / Liceu) — ver nota abaixo.   | Público   |
| `#/cadastro` | `pages/cadastro.html` | Cadastro público com nome, e-mail, senha e confirmação. | Público |
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

**Proteção de rotas restritas:**
Como ainda não há back-end, as áreas restritas (`#/painel-artesao` e `#/painel-liceu`) são protegidas no cliente por uma guarda de rota no `router.js`: antes de carregar a parcial, verifica-se a sessão persistida no `localStorage` e, na ausência de sessão válida (ou de permissão compatível com o painel), o usuário é redirecionado para `#/login`, que abre o modal de login sobre a última página permitida.

A guarda está ativa (`GUARDA_ATIVA = true`). O modal autentica as contas mock e as senhas provisórias criadas pelo Liceu. Sem sessão válida, o painel não é montado e o login abre sobre o portal; uma tentativa de acessar outro papel abre o login sobre a página anteriormente permitida. Sair exige confirmação e remove a sessão.

A opção “Lembrar de mim” utiliza `localStorage` e mantém a sessão em novas abas e após reabrir o navegador quando esse armazenamento for preservado; desmarcada, utiliza `sessionStorage` (mantém reload, encerra ao fechar a aba). A desativação de um artesão impede login e invalida sua sessão local. Trata-se de autenticação simulada no navegador, sem proteção de servidor; use somente credenciais fictícias. Contas de demonstração e detalhes dos fluxos em [FLUXOS.md](FLUXOS.md).

Parâmetros após `?` no hash não alteram o reconhecimento da rota. O detalhe recebe `id`; a edição do artesão reutiliza `#/painel-artesao/novo-trabalho?id=<id>`. `#/artesaos?id=<id>` abre o perfil público correspondente, `#/produtos?categoria=<valor>&tecnica=<valor>` filtra o catálogo e `#/saberes?tecnica=<valor>` seleciona a técnica.

# Convenções
- Pull Requests (PRs): Todo merge para a main deve passar por revisão cruzada de pelo menos um colega da equipe
- Branch Principal: main (código estável correspondente às entregas oficiais).
- Branches de Trabalho: Nomes descritivos baseados na tarefa, ex: feat/modal-artesao, fix/responsividade-cards, refactor/fluxo-aprovacao.

# Fonte de Dados

O arquivo `data/banco.json` é a base inicial única, somente para leitura. A camada `js/dados.js` combina esses registros com alterações persistidas em `localStorage` (`liceu:base:v1`), compartilhadas entre os painéis e o portal na mesma origem/navegador. O arquivo JSON não é reescrito pelo navegador. O registro local guarda artesãos, trabalhos, exclusões lógicas e credenciais mock; uma única escrita confirma perfil e credencial provisória juntos. Senhas provisórias são derivadas por PBKDF2-SHA-256 com salt aleatório individual; não são persistidas em texto puro nem incluídas na sessão. Registros legados em texto puro são migrados automaticamente na leitura, preservando contas e trabalhos. A derivação utiliza Web Crypto nativa, disponível em HTTPS ou localhost.

Categorias/nichos e técnicas são opções predefinidas de `data/banco.json`, na coleção `categorias`, carregadas por todas as telas equivalentes. Não há gestão dinâmica dessas listas no MVP.

O trabalho segue `rascunho → em-analise → publicado` ou `em-analise → rejeitado (com motivo) → reenviado → publicado/rejeitado`. Reenviados pertencem à mesma fila de análise. Trabalhos em análise não podem ser editados pelo artesão; alterações em publicados/ocultos exigem nova análise. O Liceu pode ocultar e republicar trabalhos aprovados, ou excluir uma publicação com confirmação. Artesãos só excluem os próprios rascunhos/rejeitados. O portal mostra exclusivamente publicados de artesãos ativos.

Fotos JPEG/PNG são lidas no navegador, reduzidas e persistidas como data URLs, até oito por trabalho; sem imagem, usa-se o placeholder existente. Falhas de espaço no armazenamento mantêm o formulário aberto e mostram erro. Os dados não sincronizam entre dispositivos; favoritos também são locais. Limpar o armazenamento remove alterações locais e restaura a base JSON.

O contato preserva a integração Web3Forms existente. O envio real depende desse serviço e de conectividade. Recuperação de acesso orienta contato com o Liceu, que pode redefinir a senha provisória; não há recuperação automática por e-mail.

Configurações institucionais, gestão de categorias/técnicas, troca da senha administrativa e gestão de permissões são representação de evolução futura. Os controles estão desabilitados com explicação no painel.

# Hospedagem

Necessário definir com o Liceu.
## Classificações múltiplas dos trabalhos

Novo/Editar trabalho e edição administrativa permitem várias categorias e
técnicas predefinidas. Pelo menos uma de cada é necessária ao enviar/publicar;
rascunhos podem ter grupos vazios. Os arrays `categorias` e `tecnicas` são o
formato persistido, sem duplicatas. O formato singular anterior continua
legível sem perda de registros ou sessão. Portal, detalhes, saberes, filtros
e painéis consideram todos os valores, mantendo a moderação existente.
