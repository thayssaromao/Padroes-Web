# Validação final do Portal do Artesão

Auditoria em 18/11/2026, na branch `feat/completar-fluxos`, a partir de
`ecacb62`. Referências remotas atualizadas por `git fetch --all --prune`.
O design system local em `66046cb` já era ancestral da branch funcional;
não havia commits remotos adicionais a incorporar. Os seis stashes e o
worktree separado foram preservados.

## Referências e escopo

Os dez wireframes foram encontrados em `../wireframes.pdf` e inspecionados
visualmente. As imagens PNG na pasta `../wireframes/` são capturas de
trabalhos anteriores nos painéis; o PDF é a referência das telas públicas.
As capturas do portal foram comparadas com as páginas correspondentes do PDF.
A comparação verifica composição e hierarquia, sem afirmar igualdade pixel
a pixel com imagens reduzidas, textos ilustrativos e dados diferentes.

| Tela | Página do PDF | Resultado da auditoria |
|---|---|---|
| Login | 1 | Formulário, logo, campos, opções e ação existentes preservados; modal cabe nos três tamanhos. Senha, sessão lembrada e login cobertos pelas suítes existentes. |
| Início | 2 | Hero, carrossel, quatro atalhos e destaques presentes; navegação do carrossel por teclado verificada. Vídeo existente preservado. |
| Catálogo | 3 | Corrigida a grade que exibia três colunas em 1280px: agora quatro, duas em 768px e uma em 375px. Filtros, ordenação, cards, lista, favoritos e paginação preservados. |
| Produto | 4 | Breadcrumb, galeria, miniaturas, dados, descrição, produtor, técnica e relacionados presentes; composição existente preservada. Favoritos e modo lista seguem cobertos pelas regressões. |
| Artesãos | 5 | Hero, carrossel, busca, filtros, grade e paginação presentes. Sem alteração nos dados ou filtros. |
| Perfil | 6 | Corrigido overflow interno com nome, empreendimento, cidade, bio e contato longos. Foto mantém espaço e proporção quadrada. Escape e retorno do foco verificados. |
| Saberes | 7 | Hero, carrossel, busca, filtros, cards e modo lista presentes. Modal de detalhe, estado vazio e carrossel por teclado verificados. A base atual tem oito técnicas, por isso não há páginas adicionais. |
| O Liceu | 8 | Hero, faixa histórica e três objetivos presentes. Linha do tempo e textos integrais preservados em lugar do texto ilustrativo do PDF. Foto institucional pendente. |
| Contato | 9 | Hero, formulário, canais e navegação adicional presentes. Validação, envio em andamento, sucesso, falha HTTP e erro de rede testados com interceptação. Imagem institucional pendente. |
| Sobre | 10 | Hero claro, equipe em fundo alternado e cinco integrantes preservados. Avatares e imagem institucional seguem provisórios. |

Header, footer, tipografia, paleta e componentes já aprovados foram
preservados conforme a tarefa. O footer atual tem apenas o link Sobre o
Projeto; não se acrescentaram os links ilustrados no PDF ao componente
aprovado. O vídeo da Home e o conteúdo histórico ampliam as páginas em relação
às referências, conforme os requisitos existentes.

## Correções

- `css/paginas/catalogo.css`: escala explícita de colunas usando os breakpoints
  aprovados e `--espaco-4`; modo lista continua com uma coluna.
- `css/paginas/artesaos.css`: quebra de palavras longas no perfil, coluna de
  informação flexível, foto sem compressão pelo texto e contatos/chips que
  respeitam a largura disponível. Não se ocultou conteúdo para mascarar overflow.
- `tests/portal.cjs`: auditoria adicional dos casos corrigidos e das telas
  públicas, com capturas, teclado e formulário inteiramente simulado.
- `tests/README.md`: instruções da nova suíte.
- `docs/DESIGN.md`: padrões registrados primeiro no worktree do design system
  e incorporados por merge após os testes.

## Verificação executada

Origem: `http://127.0.0.1:8091/`. Playwright e navegadores existentes, sem
dependências adicionadas. Contextos próprios de teste; nenhuma sessão pessoal
ou base do usuário foi alterada. Web3Forms foi interceptado na suíte adicional;
nenhuma mensagem real foi enviada.

| Comando | Resultado |
|---|---|
| `node tests/dados.mjs` | 9 testes aprovados |
| `node tests/estrutura.mjs` | 19 rotas e 23 arquivos HTML com contratos válidos |
| `node tests/fluxos.cjs` | Chromium e Firefox aprovados; sem erros JS/HTTP locais |
| `node tests/regressoes.cjs` | Chromium e Firefox aprovados, incluindo lista, produto, favoritos, tabela, sessões e navegação |
| `node tests/ui.cjs` | 57 verificações de telas/breakpoints por navegador aprovadas; sessões lembradas e temporárias aprovadas |
| `node tests/portal.cjs` | 30 combinações de tela/tamanho por navegador, incluindo perfil longo, grade, teclado e contato simulado |
| `git diff --check`, `node --check tests/portal.cjs` | Sem erros |

Artefatos: `/tmp/liceu-validacao-final/`, com relatórios `core-report.json`,
`ui-report.json`, capturas das regressões e subpasta `portal/` com capturas
das telas públicas e `report.json`. As capturas adicionais do perfil normal e
com textos longos permitem revisar a largura interna além do overflow da página.
Tamanhos verificados: 1280px, 768px e 375px em Chromium e Firefox.

Validadores W3C, JSLint e uma auditoria automatizada completa de contraste
não foram executados; os contratos locais não substituem essas ferramentas.
Paleta e estados de foco existentes foram preservados. O vídeo externo não
teve sua reprodução certificada; o iframe e sua configuração foram preservados.

## Pendências de conteúdo

O inventário `assets/img/LEIAME.md` identifica as imagens disponíveis como
placeholders. A inspeção das telas confirma os arquivos com nomes desenhados.
Não foram encontradas fotos institucionais ou fotos autorizadas dos integrantes
no repositório. Permanecem pendentes:

- Fotos institucionais para os heroes de O Liceu, Sobre e Contato.
- Fotos de Ana Carolina, Gabriela Rosso, Julia Oliveira, Lucas Tanaka e
  Thayssa Romão.
- Substituição futura dos placeholders de carrosséis, artesãos e trabalhos
  por imagens correspondentes e autorizadas, conforme o inventário existente.

Não foram adicionadas imagens externas nem utilizados retratos fictícios para
representar integrantes reais.

## Estado final do Git

- Branch funcional: `feat/completar-fluxos`, HEAD `56fe1cb`.
- Documentação no design system: commit `89dd6ed`, integrado pelo merge
  `56fe1cb`, sem conflitos. O worktree `feat/design-system` está limpo.
- Alterações de implementação deixadas sem commit para revisão:
  `css/paginas/artesaos.css`, `css/paginas/catalogo.css`, `tests/README.md`.
- Arquivos novos: `tests/portal.cjs` e este relatório.
- Seis stashes preservados. Nenhum push executado.
- O merge final altera somente documentação; o código validado nos navegadores
  é o mesmo da entrega. O servidor iniciado para a última rodada foi encerrado
  ao terminar; os testes podem ser repetidos com o comando do README.
