# Modernização Equilibrada — implementação e validação

Data: 23/11/2026. Branch: `feat/modernizacao-equilibrada`.
Antes: `37922e3`. Design system: `cb4b8c1`, incorporado por merge `185ce29`.

A direção aprovada foi aplicada ao portal, à Área do Artesão e à Área do Liceu.
A implementação altera apresentação e variantes visuais existentes, mantendo
estrutura, navegação, dados, autenticação local e regras do MVP.

## Melhorias implementadas

- Fundo comum branco quente `#FBFAF7`, superfícies brancas e alternância verde
  suave `#EDF3EF`. Planos editoriais amarelo/rosa ficaram mais contidos.
- Ações em turquesa `#146F67`, hover/links `#0A514D`, header `#104C49` e base
  institucional `#173D3A`. Seleção amarela `#F5CD58` e foco/favorito `#A62255`.
- Cards e formulários com contorno completo suave `#B8D0C8`, raio de 16px e
  sombra discreta. Campos com raio de 8px; botões e itens de menu com 10px.
- Seis cores por assunto preservadas nos chips, com bordas menos intensas nos
  não selecionados. Badges e métricas mantêm cores e ícones semânticos.
- Inter preservada. Corpo público de 16px; painéis mantêm 14px para densidade.
  Títulos principais em 700, nomes públicos de artesãos em 16px e metadados
  de empreendimento/local em 13px.
- Na Home, “Explorar produtos” usa o primário e “Conhecer o Liceu”, o secundário.
  Removidos os grafismos de canto e o sublinhado decorativo repetido das seções.
- Limites de campos, tabelas, menus, modais e feedback usam os tokens comuns.
  Regras redundantes de borda e sombra foram removidas dos componentes.

Logo original, faixa institucional tricolor, chips coloridos, categorias,
status, alvos, foco, pausa de carrossel e recuperação de falhas foram preservados.
Nenhum arquivo de JavaScript ou dado inicial foi alterado nesta implementação.

## Arquivos modificados

| Arquivo | Responsabilidade |
|---|---|
| `css/global.css` | Paleta vigente, tokens de contorno/raio/sombra, tipografia e escopo público. |
| `css/componentes.css` | Chips, blocos de formulário, títulos de seção, tabelas e feedback; consolidação de estilos repetidos. |
| `css/layout.css` | Itens de menu e títulos dos painéis usando tokens compartilhados. |
| `css/paginas/artesaos.css` | Hierarquia tipográfica dos nomes, empreendimento e local. |
| `css/paginas/inicio.css` | Superfícies editoriais da Home, mantendo o layout funcional. |
| `pages/inicio.html` | Consumo das variantes existentes de botão primário e secundário. |
| `docs/DESIGN.md` | Paleta aprovada e contratos visuais vigentes. |
| `docs/MODERNIZACAO_EQUILIBRADA_EVIDENCIAS.json` | Matriz de páginas, acessibilidade, contraste e testes. |
| Este relatório | Comparação e resumo da entrega. |

As escolhas de estilo foram registradas primeiro em `feat/design-system`.
O merge preservou a grade funcional da Home, que não está implementada na
parcial de demonstração daquele worktree. Não houve substituição pela base,
force-push ou publicação remota.

## Comparação visual

A galeria compara seis telas em 375 e 1440px: Início, Artesãos, Produtos,
painel do Liceu, cadastro do Liceu e perfil do artesão. São 24 capturas reais,
com a mesma origem de dados, resolução e preferência por movimento reduzido.
A versão anterior foi servida a partir de um arquivo do commit `37922e3` em
servidor temporário separado; não foi simulada com filtros sobre a imagem.

Uma segunda galeria reuniu as 42 capturas das 20 rotas e do login em
320 e 1440px. Foi inspecionado o conjunto renderizado, com conferência ampliada
de telas representativas públicas e internas. As galerias completas não são
versionadas, para manter o repositório leve; a seleção representativa está em
[COMPARACAO_VISUAL.md](COMPARACAO_VISUAL.md).

## Testes executados

| Verificação | Resultado |
|---|---|
| `node tests/dados.mjs` | 12/12 passaram. |
| `node tests/estrutura.mjs` | Contratos de 20 rotas e 26 arquivos HTML válidos. |
| `node tests/fluxos.cjs` | Chromium e Firefox passaram. |
| `node tests/regressoes.cjs` | Chromium e Firefox passaram. |
| `node tests/acessibilidade.cjs` | Chromium e Firefox passaram. |
| Matriz responsiva | 147 combinações: 20 páginas + login em sete larguras, sem overflow do documento. |
| Axe-core 4.10.3 | 42 execuções em 320 e 1440px, sem violações detectadas. |
| Console e requisições locais da matriz | Sem erros de JavaScript ou respostas HTTP locais de erro no uso normal. |
| Sintaxe | Todos os arquivos de `js/` passaram em `node --check`. Não há compilação obrigatória nesta stack. |
| Integridade do diff | `git diff --check` sem erros. |
| Comparador | Troca de tela, tamanho e visualização exercitada sem erro de JavaScript ou overflow móvel. |

Larguras da matriz: **320, 375, 430, 768, 1024, 1440 e 1920px**. A matriz e
as capturas usaram Chromium; Firefox foi exercitado pelas três suítes de
navegador. As suítes cobrem cadastro público/administrativo, perfil, sessão,
guardas, aprovação, rejeição, reenvio, favoritos, catálogo, tabelas, navegação
rápida, teclado, pausa, nomes acessíveis, alvos e recuperação de falhas.

[Evidências resumidas](MODERNIZACAO_EQUILIBRADA_EVIDENCIAS.json).

### Contraste e integridade da identidade

Os 16 pares principais calculados mantiveram contraste de texto acima de
4,5:1. Exemplos: primário/branco **6,00:1**, texto/fundo **11,24:1**,
header/branco **9,76:1**. A borda de controle `#75877D` sobre branco tem
**3,81:1**; os contornos suaves de cards são decorativos.

O logo permanece byte a byte idêntico:
`9953c3ab9ee8c16d660c20d4a287cc68fe96668c5179639d3543aaf2c5b0dabc` (SHA-256).
Não foi editado, convertido, recortado ou substituído.

## Limites e pendências preservadas

Zero violações detectadas pelo axe não certifica conformidade WCAG integral.
Fundos compostos, referências de popover e iframe têm verificações automáticas
inconclusivas; os pares de tokens foram conferidos separadamente. Testes com
leitores de tela reais e hardware móvel continuam fora desta rodada.

Fotos e vídeo definitivos dependem da equipe/Liceu. Dados e autenticação
continuam locais, conforme o MVP. Não houve envio externo real de contato.
Não foi feita alteração estrutural, migração de stack ou mudança de regra de
negócio. Arquivos locais preexistentes e os estudos visuais foram preservados.
