# Revisão complementar de UI/UX — 18/11/2026

Revisão iniciada com as duas árvores limpas, branch funcional em `4e09b03` e
design system em `1bad8f7`. Referências remotas atualizadas; o design system
já estava incorporado à funcional. Os seis stashes e as onze correções
anteriores foram preservados.

Referências visuais inspecionadas: páginas 11–21 do PDF
`../liceu_capturas_correcoes_ui_ux.pdf` e Produto Individual de
`../wireframes.pdf`. O primeiro contém capturas anteriores e a referência
do Figma; os textos do projeto e os dados dinâmicos foram preservados.

## Correções por tela

| Tela | Correção | Arquivos |
|---|---|---|
| Publicações, Pendentes e Artesãos | Busca integral na primeira linha e controles proporcionais na segunda, com mesmos labels, campos, gaps e bordas. Removida a caixa cinza exclusiva de Publicações. Status/Categoria/Artesão preservados. | `css/paginas/painel-liceu.css`, três parciais em `pages/painel-liceu/` |
| Publicações | Botão Filtrar redundante removido após confirmar que input/change já aplicavam todos os filtros. Submit por Enter continua funcionando; regras e paginação não foram reescritas. | `pages/painel-liceu/publicacoes.html` |
| Catálogo | Limpar filtros usa inline-flex, alinhamento central nos dois eixos, gap de token e ícone de ação proporcional. Hover e foco existentes preservados; sem offsets. | `css/produtos.css` |
| Produto | Título na escala de seção, três atributos com ícones/valores alinhados e divisórias responsivas. Descrição separada; galeria, favorito e seleção das miniaturas preservados. | `css/paginas/produto.css` |
| Produtor e técnica | Foto/texto em composição horizontal no desktop; botões com largura natural; título explícito da técnica e imagem com um terço da coluna. Faixa com divisão vertical no desktop e horizontal nas telas menores. | `pages/produto.html`, `js/paginas/produto.js`, `css/paginas/produto.css` |
| Relacionados | Cabeçalho com Ver todos alinhado, grade 1/2/4; com três registros, cards centralizados sem aumentar a largura. Testado com Escultura em Madeira, produto real da base. | `pages/produto.html`, `js/paginas/produto.js`, `css/paginas/produto.css` |
| Minha conta | Modal médio e grade de ações compartilhada: três botões proporcionais no desktop, duas colunas no tablet, empilhamento no smartphone. Mesma implementação nos dois perfis. | `js/layout.js` |
| Footer dos painéis | Ajuda mantida com destino Contato para artesãos; item removido na montagem administrativa antes da casca ser exibida, sem duplicação de footer ou ocultação exclusiva por CSS. Sobre e copyright preservados. | `pages/layouts/painel.html`, `js/layout.js` |

Não foram alterados header/footer públicos, tipografia global, tokens,
autenticação, dados JSON ou regras de publicação. Os padrões foram registrados
primeiro em `feat/design-system` (`f575bd9`) e integrados pelo merge `71f9924`.

## Capturas e comparação visual

Artefatos em `/tmp/liceu-validacao-final/complemento/`:

- `antes/`: capturas reais do commit inicial `4e09b03`, nos dois navegadores
  e três tamanhos, antes de alterar a implementação funcional.
- `depois/`: telas corrigidas e `report.json`; inclui os dois perfis, o modal
  da conta, os footers e o produto com três relacionados.
- [Comparativo navegável com 36 pares antes/depois](/tmp/liceu-validacao-final/complemento/comparativo.html).
- [Produto — comparação desktop](/tmp/liceu-validacao-final/complemento/comparativo-chromium-produto-1280.png).
- [Publicações — comparação desktop](/tmp/liceu-validacao-final/complemento/comparativo-chromium-publicacoes-1280.png).
- [Minha conta — comparação desktop](/tmp/liceu-validacao-final/complemento/comparativo-chromium-conta-1280.png).
- [Produto no celular](/tmp/liceu-validacao-final/complemento/depois/chromium-produto-375.png).
- [Footer do artesão](/tmp/liceu-validacao-final/complemento/depois/chromium-footer-artesao-1280.png).
- [Footer administrativo](/tmp/liceu-validacao-final/complemento/depois/chromium-footer-admin-1280.png).

O HTML comparativo é independente do servidor, com imagens incorporadas,
seletor de tela/navegador/tamanho e visualização lado a lado. Os PNGs são
exportações dessa visualização. As capturas anteriores podem conter o toast
temporário de login; as finais esperam seu desaparecimento.

A comparação cobre hierarquia, proporções e distribuição; não afirma igualdade
pixel a pixel com o Figma, que contém textos e imagens ilustrativos. As fotos
continuam provisórias conforme o inventário existente.

## Testes efetivamente executados

Playwright existente, Chromium e Firefox, tamanhos 1280px, 768px e 375px.

| Suíte | Resultado |
|---|---|
| `node tests/dados.mjs` | 9 testes aprovados |
| `node tests/estrutura.mjs` | 19 rotas e 23 HTML com contratos locais válidos |
| `node tests/fluxos.cjs` | Aprovada em Chromium e Firefox |
| `node tests/regressoes.cjs` | Aprovada em Chromium e Firefox |
| `node tests/ui.cjs` | 57 combinações por navegador aprovadas; sessões persistentes/temporárias também aprovadas |
| `node tests/portal.cjs` | 30 combinações públicas por navegador aprovadas |
| `node tests/complemento.cjs` | Filtros, limpeza, produto, conta e Ajuda por perfil aprovados nos dois navegadores e três tamanhos |
| `git diff --check` e `node --check` dos JS alterados | Sem erros |

A suíte complementar verifica composição e dimensões, ausência de overflow,
três ações proporcionais na conta, cancelamento do logout, ausência de item
vazio no footer e navegação de Ajuda até Contato. Também combina os filtros
reais de Publicações e valida aplicação por input/change e Enter. A galeria,
favoritos, teclado, paginação e fluxos anteriores permanecem cobertos pelas
suítes existentes. Nenhuma mensagem real foi enviada pelo formulário de contato.

Uma asserção inicial da suíte complementar exigia visibilidade do título da
gaveta fechada no mobile; foi corrigida para verificar a existência do painel
e a sessão preservada. A repetição final passou. Não houve mudança de código
para mascarar essa condição. Validadores externos W3C/JSLint não foram executados.

## Entrega

Implementação e testes consolidados em commits locais; sem push. As capturas
são artefatos em `/tmp`, sem adicionar imagens de teste ao repositório.
Os commits finais e o estado das duas branches são informados na entrega.
