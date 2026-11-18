# Revisão transversal de UI/UX

Revisão de 17/11/2026 sobre `feat/completar-fluxos`, a partir do estado funcional `348897c`. Sem push, frameworks ou dependências adicionadas. Capturas fornecidas foram tratadas como evidências dos problemas; os wireframes e `DESIGN.md` orientaram a composição e os componentes.

## Componentes revisados

| Componente | Refinamento reutilizável | Aplicação |
|---|---|---|
| Registro de ações | `conteudoAcao` e `prepararAcoes` centralizam ícone/verbo, ordem, normalização e títulos acessíveis | Portal, painéis, formulários, cards, tabelas e diálogos |
| Status | Badges estáticos com ícone e texto; rascunho não é um botão | Cards, tabelas, status e modais |
| Botões com ícone | Ícones de 18px, espaçamento compartilhado e texto explícito | Salvar, cancelar, enviar, editar, duplicar, aprovar/rejeitar e excluir |
| Botões compactos | Alvo 44×44px, tamanho fixo, foco, `aria-label` e `title` | Ações de Publicações e menus de trabalhos; não crescem quando são a única ação |
| Senhas | Mesmo helper para estado, ícone, tooltip e nome acessível | Login, senha provisória, confirmação e redefinição |
| Filtros | Labels curtos, selects de largura natural, grupos horizontais quando couberem | Listagens públicas e dos dois painéis |
| Detalhes de trabalho | Imagem principal/galeria, identidade, status, chips, descrição e `dl` de metadados | Visualizar publicação e Analisar trabalho |
| Diálogos | Anatomia/padding/fechamento comuns, confirmações pequenas e menu em grade responsiva | Envio, motivo, exclusão, edição, acesso e menus |
| Taxonomias | Duas subseções com títulos e chips dentro do corpo do card | Configurações do Liceu |
| Cabeçalhos de configurações | Wrapper de seção já existente; alturas alinhadas no desktop | Quatro cards do grid de configurações |

As alterações visuais foram registradas primeiro em `feat/design-system` e incorporadas por merge. O CSS já existente da área do artesão foi preservado ao incorporá-lo ao design system, removendo a regra que escondia os ícones dos estados compactos no desktop. A expansão de botões passou a se aplicar apenas às ações com texto.

A preparação de ações evita mover custom elements já corretamente posicionados. Foi reproduzido e corrigido um caso em que reconectar um Iconify já renderizado deixava seu SVG vazio, especialmente no Firefox. Espaços em branco antes do ícone não justificam reconstruir o controle.

## Iconografia e classificação das ações

A interface usa a coleção **Lucide**, através da biblioteca Iconify já adotada. Identificadores antigos de outras coleções são normalizados. O símbolo de marca do WhatsApp é a exceção preservada, sem introduzir biblioteca nova.

| Ação/status | Ícone |
|---|---|
| Editar/corrigir | `pencil` |
| Visualizar/ver perfil | `eye` |
| Ocultar | `eye-off` |
| Excluir | `trash-2` |
| Duplicar | `copy` |
| Enviar/reenviar | `send` |
| Aprovar/republicar/publicado | `circle-check` |
| Rejeitar/confirmar rejeição/rejeitado | `circle-x` |
| Salvar | `check` |
| Cancelar/descartar | `x` |
| Voltar | `arrow-left` |
| Analisar | `file-search` |
| Rascunho | `file-text` |
| Em análise | `clock` |
| Reenviado | `refresh-cw` |

Ícone + texto foi aplicado às ações operacionais importantes. Somente ícone continua reservado a ações compactas e controles reconhecíveis, com nome acessível e tooltip. Navegação editorial, nomes dos produtos, opções de categoria, números da paginação e links claros mantêm texto quando outro ícone seria decorativo. Status não executam ação. Remover chip/miniatura mantém o × convencional.

## Login e credenciais

- Marcado: identidade mock em `localStorage`; mantém reload, nova aba e reinício do navegador quando o armazenamento é preservado.
- Desmarcado: identidade em `sessionStorage`; mantém reload e encerra ao fechar a aba. Uma nova aba independente não recebe a sessão temporária.
- Logout limpa os dois mecanismos. Somente nome, foto, papel e ID do artesão podem integrar a sessão; senha não é persistida nela.
- Senhas provisórias de novos cadastros/redefinições usam PBKDF2-SHA-256, 120 mil iterações e salt aleatório individual. Registros legados em texto puro são migrados automaticamente sem apagar contas ou trabalhos.
- A derivação usa Web Crypto nativa (HTTPS ou localhost). O projeto continua sendo um mock local, sem autenticação segura de servidor.
- Oculta: `password`, `eye-off`, “Mostrar senha”. Visível: `text`, `eye`, “Ocultar senha”. `aria-label`, `title`, `aria-pressed` e `aria-controls` acompanham o estado. Reset e fechamento do login restauram a apresentação oculta.

## Filtros

Meus Trabalhos, Status das Publicações, Artesãos administrativos, Trabalhos Pendentes e Publicações mantiveram os grupos compactos em uma linha em 1280px. Em 768px os grupos permanecem lado a lado quando cabem; em 375px reorganizam-se sem overflow. Não houve redução de fonte para forçar encaixe.

Produtos preserva sua busca principal, sidebar de filtros e chips, com controles de ordenação/visualização no agrupamento atual. Artesãos públicos e Saberes preservam busca destacada, chips e filtros em diálogo. O catálogo não foi convertido artificialmente para a estrutura dos painéis.

## Configurações

O texto corrido foi substituído por “Categorias cadastradas” e “Técnicas cadastradas”, com os 14 chips da fonte central. Ambos os grupos ficam dentro do padding do card e quebram linha naturalmente. Cabeçalhos usam o mesmo wrapper de ícone/texto, alinhado entre cards vizinhos no desktop. Gestão futura permanece desabilitada; esta revisão não amplia o escopo administrativo.

## Modais

- **Visualizar publicação e Analisar:** mesmo componente de detalhes, imagem maior, identidade/status/chips agrupados, descrição própria e materiais/dimensões/preço em lista semântica.
- **Rejeição:** motivo aparece em campo separado; confirmar rejeição conserva `circle-x`, sem sinal de aprovação.
- **Enviar para análise:** confirmação pequena, cancelar e enviar com ícones.
- **Menu do trabalho:** editar, duplicar, enviar e excluir com ícones e grade responsiva; exclusão mantém distinção e confirmação.
- **Motivo, edição/perfil, acesso, exclusão e saída:** espaçamento, ações e fechamento compartilhados; não foram criadas folhas CSS por modal.
- **Perfil público e Login:** composição existente preservada; ações/controles usam a iconografia e os estados comuns.

## Testes e regressões

| Verificação | Chromium | Firefox |
|---|---|---|
| 19 rotas em 1280/768/375px (57 combinações por navegador) | Passou | Passou |
| Ações/status/ícones, nomes acessíveis e tooltips nos controles visíveis | Passou | Passou |
| Rascunho e Enviar com ícones visíveis no desktop; menus compactos | Passou | Passou |
| Modais, hierarquia, SVGs renderizados e overflow | Passou | Passou |
| Filtros em linha no desktop e reorganização responsiva | Passou | Passou |
| Ações de Publicações com 44×44px | Passou | Passou |
| Login: toggle, lembrar, reload, nova aba e reinício real do navegador | Passou | Passou |
| Logout e encerramento da sessão temporária | Passou | Passou |
| Criar/enviar → aprovar → portal | Passou | Passou |
| Rejeitar + motivo → corrigir → reenviar → fila | Passou | Passou |
| Cadastro administrativo → listagem → login | Passou | Passou |
| Geometria da tabela, paginação, filtros, histórico e sessão entre abas | Passou | Passou |

A suíte administrativa complementar também confirmou edição de artesão/publicação, busca/paginação, ativar/desativar, redefinir senha com login efetivo e ocultar/republicar em ambos os navegadores.

Os testes de persistência utilizam perfis temporários próprios dos navegadores e os removem ao terminar; nenhum perfil pessoal é acessado. O relatório de UI contém os resultados por rota/largura e exceções JavaScript capturadas. A verificação de SVGs considera controles realmente visíveis, excluindo a sidebar recolhida fora da tela e conteúdo inerte atrás de um diálogo.

Também passaram nove testes da camada de dados, incluindo salts distintos, ausência de senha na sessão e migração de credenciais antigas; contratos de 19 rotas/23 HTMLs; sintaxe JavaScript e `git diff --check`. JSLint e validadores W3C não estão instalados; os checks locais não são equivalentes a essas certificações.

Suítes: `tests/ui.cjs`, `tests/fluxos.cjs`, `tests/regressoes.cjs`, `tests/dados.mjs`, `tests/estrutura.mjs`. Instruções em [tests/README.md](../tests/README.md). Capturas e relatório desta sessão em `/tmp/liceu-ui/`; cenários funcionais em `/tmp/liceu-fluxos/`.

## Preservação

Cores, tipografia, estrutura de navegação, headers/footers, grids gerais, dados e fluxos foram preservados. Nenhuma rota foi criada. Não foram reintroduzidas divisórias verticais decorativas. O `colgroup`, proporções, cabeçalho, wrappers e mecanismo de paginação da tabela de artesãos permaneceram intactos. Nenhum push foi realizado.

## Arquivos alterados
- `css/componentes.css`
- `css/global.css`
- `css/paginas/painel-artesao.css`
- `css/paginas/painel-liceu.css`
- `docs/DESIGN.md`
- `docs/ESPECIFICACOES.md`
- `docs/FLUXOS.md`
- `docs/REVISAO-UI.md`
- `js/componentes.js`
- `js/dados.js`
- `js/layout.js`
- `js/paginas/artesaos.js`
- `js/paginas/login.js`
- `js/paginas/painel-artesao.js`
- `js/paginas/painel-liceu.js`
- `js/paginas/saberes.js`
- `js/produtos.js`
- `js/router.js`
- `pages/artesaos.html`
- `pages/painel-artesao/meus-trabalhos.html`
- `pages/painel-artesao/status-publicacoes.html`
- `pages/painel-liceu/artesaos.html`
- `pages/painel-liceu/configuracoes.html`
- `pages/painel-liceu/trabalhos-pendentes.html`
- `pages/produtos.html`
- `pages/saberes.html`
- `tests/README.md`
- `tests/dados.mjs`
- `tests/fluxos.cjs`
- `tests/ui.cjs`
