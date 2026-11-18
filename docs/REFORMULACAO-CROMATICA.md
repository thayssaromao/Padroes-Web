# Reformulação cromática do Portal do Artesão

Data: 18/11/2026. Base anterior: `dea0af6`.

## Referências e decisões

A implementação é uma interpretação digital da paleta proposta no projeto,
inspirada no símbolo existente e na fotografia institucional da fachada
publicada pela [Prefeitura de Curitiba](https://www.curitiba.pr.gov.br/noticias/liceu-de-oficios-criativos-comemora-5-anos-de-apoio-aos-artesaos-de-curitiba/74867).
O Instagram institucional não carregou no ambiente. Não foi validado manual
oficial de cores; os hexadecimais não são apresentados como códigos oficiais.
O logotipo e todas as fotografias/placeholders foram preservados.

| Cor | Hex | Aplicação |
|---|---|---|
| Turquesa | `#20A8A6` | Grafismo tricolor e acento das estatísticas |
| Turquesa profundo | `#0C7774` | Ações principais, seleção, paginação e alternadores |
| Turquesa escuro | `#095E5C` | Header, links e hover das ações principais |
| Amarelo | `#FFC928` | Sidebar ativa, ações editoriais e indicadores |
| Rosa | `#E73571` | Grafismos, detalhes editoriais e acentos decorativos |
| Rosa escuro | `#AD1B50` | Favoritos, foco e ícones de destaque |
| Petróleo | `#183E45` | Texto, sidebar, footer e cabeçalho de tabela |
| Off-white | `#F8F7F3` | Fundo principal das páginas |
| Amarelo suave | `#FFF0BD` | Hero, cabeçalho do catálogo, avisos e análise |
| Rosa suave | `#FCE7EF` | Faixas de pessoas, contexto do produto e rejeição |

O amarelo aparece em áreas editoriais e indicações de análise; o rosa conecta
pessoas, criação e preferências pessoais. Ações destrutivas usam o token de
erro, não o rosa decorativo. Texto e ícones continuam explicando os estados. As cores das estatísticas
seguem o ícone semântico existente, preservando a associação mesmo quando
a ordem dos cards muda entre as páginas.
Branco permanece em campos, cards e superfícies elevadas para leitura.

## Tokens e componentes

`css/global.css` centraliza as cores literais e organiza identidade,
superfícies, navegação, interação, bordas e estados. Foram introduzidos pares
de texto/fundo para sucesso, alerta, erro, informação e rascunho; tokens de
campo/card/menu/modal; superfícies editoriais; foco, favorito, desabilitados,
divisores de navegação e grafismo tricolor. O inventário completo e os usos
estão em `DESIGN.md` e nas declarações de `:root`.

| Arquivos | Alterações |
|---|---|
| `css/global.css` | Tokens semânticos e foco; fundo quente; cores de links e sombras |
| `css/layout.css` | Header turquesa, sidebar/footer petróleo, item ativo amarelo, links/foco claros e faixa tricolor |
| `css/componentes.css` | Botões, cards, chips, status, formulários, menus, tabelas, modais, avisos, favoritos e paginação |
| `css/paginas/inicio.css` | Hero amarelo, grafismos discretos e faixa de pessoas rosa |
| `css/paginas/artesaos.css` | Hero rosa e ações de perfil com contraste apropriado |
| `css/paginas/o-liceu.css` | Anos em rosa escuro e acentos dos objetivos |
| `css/paginas/produto.css` | Contexto rosa e ícones técnicos turquesa |
| `css/paginas/painel-artesao.css` | Resumo com superfície editorial amarela |
| `css/paginas/catalogo.css` | Cabeçalho editorial, filtro de favoritos rosa e alternador ativo |
| `css/produtos.css` | Migração das cores fixas do catálogo para os tokens e foco da busca |
| `pages/produtos.html` | SVGs usam `currentColor`, mantendo a estrutura |
| `tests/identidade.cjs`, `tests/README.md` | Auditoria cromática e instruções de execução |

Não houve alteração de JavaScript funcional, medidas, espaçamentos,
breakpoints, estrutura HTML, fontes, autenticação, filtros ou persistência.
As mudanças visuais foram documentadas e registradas primeiro na branch de
design, depois integradas por merges. Os conflitos entre parciais de design
e páginas funcionais foram resolvidos preservando os layouts existentes.
O catálogo legado, presente apenas na branch funcional, passou a consumir
os mesmos padrões.

## Validação e artefatos

As oito suítes existentes foram executadas: `dados.mjs`, `estrutura.mjs`,
`fluxos.cjs`, `regressoes.cjs`, `ui.cjs`, `portal.cjs`, `complemento.cjs` e
`rodada-atual.cjs`. A nova `identidade.cjs` complementa a revisão com 24 pares
cromáticos e mais de 3.300 amostras de texto por navegador. Chromium e
Firefox são verificados em 1280, 768 e 375px.

Os pares de texto atingiram no mínimo 4,93:1; os pares de borda/foco medidos
atingiram no mínimo 4,05:1. A auditoria também detectou e permitiu corrigir
um problema real de texto escuro no cabeçalho escuro de tabela. As medidas
aguardam a pintura e o término das transições para avaliar o estado final.

| Suíte | Resultado |
|---|---|
| `dados.mjs` | 9 testes aprovados |
| `estrutura.mjs` | 19 rotas e 23 HTML com contratos válidos |
| `fluxos.cjs` | Chromium e Firefox aprovados |
| `regressoes.cjs` | Chromium e Firefox aprovados |
| `ui.cjs` | 57 telas/breakpoints por navegador; sessões aprovadas |
| `portal.cjs` | 30 capturas por navegador; teclado e Contato simulado aprovados |
| `complemento.cjs` | Dois navegadores e três larguras aprovados |
| `rodada-atual.cjs` | Dois navegadores e três larguras aprovados |
| `identidade.cjs` | Pares cromáticos, texto renderizado, semântica das estatísticas e overflow aprovados |

Na repetição final, `rodada-atual.cjs` e `identidade.cjs` foram inicialmente
interrompidas por `ERR_CONNECTION_REFUSED`, após o encerramento de um servidor
temporário de capturas. Um servidor independente foi mantido na porta 8091
e ambas as suítes foram repetidas. Isso não exigiu alteração da aplicação.

Capturas antes/depois ficam em `/tmp/liceu-validacao-final/identidade/`:

- `antes/`: base anterior nos dois navegadores e três larguras.
- `depois/`: páginas públicas, produto, modais, formulários e os dois painéis.
- `comparativo.html`: seletor de pares por navegador/tela/largura.
- `comparativo-*.png`: exportações de início, catálogo, dashboard, cards e modal.
- `contraste.json`: pares medidos, quantidade de amostras e falhas.

Nenhuma mensagem real foi enviada pelo Contato. Nenhuma dependência foi
instalada. Os seis stashes foram preservados; não houve push.

## Commits e preservação

Design system: `ec4781c`, `387a274`, `ff675f5`, `8b6c5d9`, `b1f4a9f`,
`a60e029` e `f7cb549`. Cada atualização foi incorporada por merge à branch
funcional, preservando o histórico. Adaptação do catálogo legado: `0a1e70a`.
O commit de testes e entrega registra esta documentação e a nova suíte.

## Limitações

Contraste de imagens/iframes externos não é inferido dos tokens. Não houve
sessão manual com leitor de tela, nem certificação WCAG integral. Os testes
W3C/JSLint externos não foram executados; os contratos locais, sintaxe dos
testes e `git diff --check` são verificados separadamente. A identidade
continua sendo uma proposta sujeita à avaliação visual da instituição.
