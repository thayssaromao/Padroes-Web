# Revisão adicional de UI/UX e favoritos

Referências visuais: `../capturas_ajustes_ui_liceu_rodada_atual.pdf`,
`../wireframes.pdf` e padrões de `DESIGN.md`. A base anterior é `5f15729`.
As implementações anteriores foram preservadas.

| Correção | Resultado | Arquivos principais |
| --- | --- | --- |
| 1. Contexto do produto | Colunas iguais, divisor central, títulos e ações alinhados; avatar circular e técnica retangular de 128px; biografia longa rolável por teclado | `css/paginas/produto.css`, `js/paginas/produto.js` |
| 2. Dados pessoais obrigatórios | Nome e E-mail com indicação, validação de vazio/espaços/formato e alerta acessível; unicidade e credenciais mantidas pela camada de dados | `pages/painel-artesao/meu-perfil.html`, `js/paginas/painel-artesao.js` |
| 3. Seletores | Combobox reutilizável com menu próprio, grupos, rolagem, foco, teclado e posicionamento na viewport; fonte nativa preservada para formulários/eventos | `js/seletores.js`, `js/componentes.js`, `css/componentes.css` |
| 4. Cards | Sem divisória interna ou altura artificial de título; espaçamento e ações na base consistentes, preservando permissões | `css/paginas/painel-artesao.css` |
| 5. Rejeição/motivo | Ícones de 16px e alvo de motivo de 44px alinhado ao chip, com foco visível | `css/paginas/painel-artesao.css` |
| 6. Status das publicações | Grade reserva largura para valores completos; busca acima no tablet e controles empilhados no celular | `css/paginas/painel-artesao.css`, `pages/painel-artesao/status-publicacoes.html` |
| 7. Artesãos e filtros administrativos | Rótulos separados dos campos e seletores completos; mesmo componente em Artesãos, Publicações e Trabalhos Pendentes | `css/componentes.css`, `js/seletores.js` |
| 8. Saberes | Variante editorial com corpo e ações separados, espaçamento de 24px e botão legível no celular | `pages/saberes.html`, `css/componentes.css` |
| 9. Modais administrativos | Seletores compartilhados nos formulários, títulos e botões com quebra segura; variantes e rolagem existentes preservadas | `css/componentes.css`, `js/seletores.js` |
| 10. Favoritos | Chip Somente favoritos combina preferências reais com busca/filtros/ordenação e paginação, atualizando remoções e alterações entre abas | `pages/produtos.html`, `css/paginas/catalogo.css`, `js/produtos.js`, `js/paginas/publico.js` |

## Padrões e comportamento

Os padrões foram documentados e os componentes compartilhados registrados
primeiro em `feat/design-system`, depois integrados por merge à branch
funcional. Não foram alterados tokens, tipografia global, header ou footer.
Seleção múltipla conserva os checkboxes/chips existentes; os selects simples
ganham melhoria progressiva, mantendo os valores, eventos e validação nativos.
Escape fecha apenas o menu aberto; Enter/Espaço/Tab confirmam a opção.
Navegadores sem Popover API conservam o select nativo.

Favoritos continuam usando somente `liceu:favoritos`, sem criar entidades ou
alterar publicação/aprovação. Apenas Produtos possui esse modelo funcional;
não foram criados filtros fictícios em Artesãos, Saberes ou painéis. IDs são
normalizados sem duplicatas. Os favoritos persistem; ativar o filtro é um
estado da visita atual, como os demais filtros do catálogo. Limpar filtros
também desativa Somente favoritos. A remoção do último item de uma página
recalcula a paginação. Eventos de armazenamento sincronizam outras abas.

Nome e E-mail continuam preenchidos com os dados atuais. O salvamento inválido
não altera armazenamento; alteração válida de e-mail continua atualizando a
credencial pela função existente, sujeita à unicidade.

## Verificação

Executar as sete suítes existentes e `node tests/rodada-atual.cjs` com a
instalação existente do Playwright. A nova suíte cobre os casos desta rodada
em Chromium e Firefox, com viewports de 1280, 768 e 375px, incluindo menus
abertos, diálogos, foco, overflow, persistência e troca de e-mail/login.
As suítes de dados/estrutura verificam os contratos da base e das rotas.
O formulário de Contato usa respostas interceptadas nas suítes existentes,
sem mensagens reais.

Resultados da execução final em 18/11/2026:

| Suíte | Resultado |
| --- | --- |
| `dados.mjs` | 9 testes aprovados |
| `estrutura.mjs` | 19 rotas e 23 HTML válidos |
| `fluxos.cjs` | Chromium e Firefox aprovados |
| `regressoes.cjs` | Chromium e Firefox aprovados |
| `ui.cjs` | 57 telas/breakpoints por navegador e testes de sessão aprovados |
| `portal.cjs` | 30 capturas por navegador, teclado e contato simulado aprovados |
| `complemento.cjs` | Dois navegadores, três larguras aprovados |
| `rodada-atual.cjs` | Dois navegadores, três larguras aprovados |

`git diff --check` e a verificação sintática dos scripts alterados também
passaram. As seis entradas de stash permaneceram preservadas; nenhum push.

Artefatos locais: `/tmp/liceu-validacao-final/rodada-atual/`. A subpasta
`antes` registra a base `5f15729`; `depois` contém as telas corrigidas e
`report.json`. `comparativo.html` reúne os pares selecionáveis por navegador,
tela e largura; as exportações `comparativo-*.png` permitem revisão estática.
As capturas de menus e biografia extensa ficam também em `depois`.

Limitações: imagens provisórias existentes foram mantidas. Acessibilidade
foi verificada por semântica, foco e teclado nos dois navegadores; não houve
sessão manual com leitor de tela. Nenhuma dependência foi instalada.
