# Correção final de UI/UX — 18/11/2026

Implementação das onze solicitações, usando os screenshots enviados e o
wireframe de produto em `../wireframes.pdf`. Branch funcional:
`feat/completar-fluxos`; padrões registrados em `feat/design-system` e
incorporados por merge. Sem push, instalação de dependências ou remoção de stashes.

## Problema → correção → arquivos

| # | Problema | Correção | Arquivos |
|---|---|---|---|
| 01 | Linha escura acima do footer dos painéis | Removido o contorno do foco programático do main que desenhava essa linha; foco dos controles internos e footer público preservados. Footer dos painéis permanece sem borda. | `css/layout.css` |
| 02 | Cards desalinhados e espaço vazio em análise | Faixas comuns para título, metadados, status e ações. Rascunho mantém Enviar, Editar e menu; rejeitado mantém motivo; análise informa edição indisponível e mantém menu. | `css/paginas/painel-artesao.css`, `js/paginas/painel-artesao.js` |
| 03 | Menu de três ações quebrava no desktop | Botões proporcionais na mesma linha a partir de 1024px; duas colunas no tablet e uma no smartphone. Rascunhos preservam as quatro ações. | `css/componentes.css` |
| 04 | Cabeçalho e filtros de Meus trabalhos dispersos | Cadastro junto ao título, busca em linha própria, grupos de filtros uniformes, contador/modo antes dos cards. Rótulo de busca corrigido para trabalhos. | `pages/painel-artesao/meus-trabalhos.html`, `css/paginas/painel-artesao.css` |
| 05 | Ações da tabela de status muito largas | Ícones de 44px com aria-label/title; todas as ações anteriores preservadas e espera continua desabilitada. | `js/paginas/painel-artesao.js` |
| 06 | Produto sem hierarquia e atributos sem ícones | Galeria e resumo alinhados ao topo, miniaturas 16:9 com seleção visual e aria-pressed, atributos com layers/hammer/ruler, descrição separada, produtor com foto/texto. Preço numérico destacado; consulta em texto de apoio. | `pages/produto.html`, `css/paginas/produto.css`, `js/paginas/produto.js` |
| 07 | Análise excessivamente vertical | Foto limitada, duas colunas proporcionais e metadados em grade dentro do modal grande; empilhamento no celular. | `css/paginas/painel-liceu.css`, `js/paginas/painel-liceu.js` |
| 08 | Rejeição sem cancelamento | Cancelar retorna à análise, limpa o motivo apenas no formulário e devolve o foco. Armazenamento permanece idêntico. | `js/paginas/painel-liceu.js` |
| 09 | Aprovação imediata | Primeira ação exibe a pergunta solicitada com Cancelar e Confirmar aprovação. Só a confirmação persiste/publica. Ações bloqueadas durante a gravação. | `js/paginas/painel-liceu.js` |
| 10 | Aviso do MVP encostado nos cards | Distância de 24px pelo token espaco-5. | `css/paginas/painel-liceu.css`, `js/paginas/painel-liceu.js` |
| 11 | Seletores múltiplos com aparência bruta | Fieldset/legend, checkboxes nativos, seleção destacada e resumo anunciado; select original sincronizado preserva selectedOptions e persistência. Todos os selects múltiplos de diálogos usam o helper. Formulários já baseados em select/chips permanecem consistentes. | `js/componentes.js`, `css/componentes.css` |

`docs/DESIGN.md` documenta os padrões antes da implementação nas páginas.
Não foram adicionados CSS legado de cards/paginação nem novas imagens.

## Validação

Instalação existente de Playwright; Chromium e Firefox em 1280px, 768px e
375px. Relatórios e capturas em `/tmp/liceu-validacao-final/`, incluindo:

- `*-trabalhos-*.png`, `*-menu-publicado-*.png`, `*-menu-*.png`.
- `*-analise-*.png`, `*-analise-rejeicao-*.png`, `*-aprovar-confirmacao-*.png`.
- `*-editar-artesao-*.png`, `*-status-compacto-*.png`, `*-configuracoes-*.png`.
- `portal/` com as dez telas públicas e os perfis longos.

| Suíte | Resultado |
|---|---|
| `node tests/dados.mjs` | 9 testes aprovados |
| `node tests/estrutura.mjs` | 19 rotas e 23 arquivos HTML válidos nos contratos locais |
| `node tests/fluxos.cjs` | Aprovação confirmada, cancelamentos sem mutação, rejeição/reenvio, cadastro/login e sessões aprovados nos dois navegadores |
| `node tests/regressoes.cjs` | Aprovada nos dois navegadores |
| `node tests/ui.cjs` | 57 combinações de tela/tamanho por navegador aprovadas, com novas asserções de menus, cards, rodapé, configuração, seleção múltipla e cancelamentos |
| `node tests/portal.cjs` | 30 combinações públicas por navegador aprovadas; galeria de duas imagens com setas/teclado, atributos e contato simulado |
| `git diff --check` e `node --check` dos JS alterados | Sem erros |

Os testes de edição verificam teclado, cancelamento com igualdade do
armazenamento, salvamento e reabertura com os valores selecionados. Os testes
de análise verificam que a pergunta de aprovação e ambos os cancelamentos não
modificam a base. A suíte de fluxos confirma a publicação somente depois do
segundo passo. A suíte pública intercepta Web3Forms; nenhuma mensagem real é enviada.

A primeira execução de UI encontrou uma asserção com seletor instável:
`input:not(:checked)` passava a apontar para o próximo controle depois do
Space. O teste agora mantém o índice do controle, e as repetições passaram.
Uma execução agregada terminou com código 143 após a aprovação de UI; portal
e regressões foram repetidos separadamente para concluir a validação.

Validação local não equivale a certificação W3C/JSLint; essas ferramentas não
foram executadas. Fotos e conteúdos provisórios continuam com as pendências
registradas em `VALIDACAO-FINAL-PORTAL.md`.

## Preservação e consolidação

As alterações anteriores foram preservadas no commit `7f1dd67`, incluindo
catálogo, perfil público, relatório e testes. Os CSS de catálogo/perfil público
não receberam mudanças nesta revisão. Os seis stashes permanecem intactos.

Commits do design system: `9c926df` (padrões/componentes), `dac00ac` (rótulo
nativo) e `1bad8f7` (hierarquia da mensagem de consulta), incorporados por merge.
Os commits funcionais e de testes são identificados no histórico final e na entrega.
