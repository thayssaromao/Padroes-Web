# Validação da entrega — 24/11/2026

Verificação local da branch de integração, com servidor HTTP, Node.js 22,
Playwright, Chromium e Firefox. Os testes usam armazenamento isolado e dados
fictícios; não dependem de contas reais nem confirmam um backend de produção.

| Verificação | Resultado |
|---|---|
| `node tests/dados.mjs` | 17 testes aprovados |
| `node tests/estrutura.mjs` | 20 rotas e 26 HTML com contratos válidos |
| `tests/fluxos.cjs` | Cadastro, envio, aprovação, rejeição/reenvio e sessões aprovados nos dois navegadores |
| `tests/regressoes.cjs` | Catálogo, favoritos, produto, paginação e navegação aprovados nos dois navegadores |
| `tests/perfil-multisselecao.cjs` | Perfil e trabalhos: seleção, prévia, descarte, valores salvos, obrigatoriedade e teclado aprovados nos dois navegadores |
| `tests/acessibilidade.cjs` | Teclado, nomes, upload, alvos de interação e recuperação de falhas aprovados nos dois navegadores |
| Revisão responsiva | 147 combinações de páginas e larguras sem transbordamentos, erros JavaScript ou falhas HTTP locais |
| Axe | 42 combinações de página/largura sem violações detectadas |
| Trabalhos com várias classificações | Edição administrativa, filtros por valores secundários, detalhes e links de técnicas confirmados; mais 6 combinações com axe e sem transbordamentos |

A revisão responsiva usou 320, 375, 430, 768, 1024, 1440 e 1920px. A auditoria
axe foi feita temporariamente, sem adicionar dependência ao portal. As capturas
compartilhadas estão em [COMPARACAO_VISUAL.md](COMPARACAO_VISUAL.md).

As verificações automáticas não substituem avaliação humana com tecnologias
assistivas. Validação formal completa por W3C/JSLint e homologação do conteúdo
institucional não são declaradas como concluídas por este relatório. Contato
externo e serviços de produção não foram exercitados com envios reais.

Veja [tests/README.md](../tests/README.md) para reproduzir as seis suítes. Os
relatórios anteriores em `AUDITORIA_UI_UX*`, `MODERNIZACAO_EQUILIBRADA*` e
`REFINAMENTOS_PAINEIS*` documentam etapas históricas da evolução visual.

## Preservação dos arquivos de revisão

As galerias de `comparacoes/` e `propostas-visuais/` foram incluídas no
repositório e identificadas como material histórico. Foram conferidos os
JSONs, 99 referências locais, 60 combinações de capturas e o carregamento
das cinco galerias no navegador. Os 17 testes de dados e os contratos de
20 rotas/26 HTML foram repetidos na preparação desta publicação.

O estado vigente da marca é transparente, com identificação Portal do Artesão
e espaçamento original restaurado. A referência de estilo é `DESIGN.md`,
não os protótipos ou as capturas históricas.
