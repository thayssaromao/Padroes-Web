# Verificações locais

Sem instalação de dependências para a camada de dados e contratos de rotas:

```bash
node tests/dados.mjs
node tests/estrutura.mjs
```

Os testes de navegador usam Playwright, Chromium e Firefox **já disponíveis no ambiente de verificação**, sem dependência adicionada ao projeto e sem alterar a stack da aplicação. Inicie o servidor estático na raiz:

```bash
python3 -m http.server 8091 --bind 127.0.0.1
```

Em outro terminal, com a instalação existente de Playwright acessível:

```bash
node tests/fluxos.cjs
node tests/regressoes.cjs
node tests/ui.cjs
node tests/portal.cjs
node tests/complemento.cjs
```

Se o módulo não estiver na resolução padrão, defina `PLAYWRIGHT_MODULE` como o caminho absoluto da instalação existente. `PLAYWRIGHT_BROWSERS_PATH` e `LD_LIBRARY_PATH` podem ser necessários conforme a instalação dos navegadores. `PORTAL_URL` aceita outra origem/porta, com `/` final. `RELATORIO_DIR` escolhe onde salvar relatórios e screenshots; o padrão é `liceu-fluxos` na pasta temporária do sistema.

Cada suíte abre contextos isolados, usa apenas dados fictícios e não limpa o armazenamento de uma sessão já aberta pelo usuário. A suíte central executa envio/aprovação/publicação, rejeição/motivo/reenvio e cadastro/login. A regressão verifica geometria da tabela, leitura do catálogo em lista, composição do produto, favoritos, topbar, logout entre abas, troca de conta na mesma rota, atualização da identidade em outra aba, fallback e navegação rápida.

Os testes locais de contratos HTML não substituem os validadores W3C. JSLint e validadores W3C não estão instalados neste repositório; a revisão registra separadamente os checks efetivamente executados.

A suíte `ui.cjs` audita ações, status, tooltips, controles de senha, filtros, tamanhos de ações de tabela, taxonomias, modais e overflow em 1280/768/375px. Capturas ficam por padrão em `/tmp/liceu-ui` (ou `RELATORIO_DIR`). A renderização dos SVGs exige conectividade com o CDN/API do Iconify já adotado. Ela também abre perfis temporários próprios para verificar fechamento/reabertura real dos navegadores com sessão lembrada; nenhum perfil pessoal é utilizado.

A suíte `portal.cjs` complementa a auditoria das dez telas públicas nos dois
navegadores e nos três tamanhos. Verifica a grade de 1/2/4 colunas, perfil com
textos longos (incluindo largura interna, proporção da foto e retorno do foco),
carrosséis por teclado, detalhes/estado vazio de Saberes e formulário de contato.
Todas as chamadas ao Web3Forms são interceptadas: sucesso, falha do servidor e
erro de rede usam respostas simuladas, sem enviar mensagens reais. As capturas
e `report.json` ficam na subpasta `portal` de `RELATORIO_DIR` (padrão:
`/tmp/liceu-validacao-final`). Os dados longos também são respostas simuladas,
sem alterar os JSON do projeto ou o armazenamento do usuário.

A revisão final dos painéis também é coberta por `ui.cjs`: rodapé sem contorno
do main, ações dentro dos cards, menus com três/quatro ações, configuração com
espaçamento, seletores múltiplos por teclado com cancelamento e persistência,
e cancelamentos de aprovação/rejeição sem alterações no armazenamento.
`fluxos.cjs` exige a confirmação explícita antes de aprovar. `portal.cjs`
verifica ícones dos atributos e seleção das miniaturas por setas e teclado em
uma galeria com duas imagens de teste.

`complemento.cjs` verifica as três barras administrativas (incluindo aplicação
automática dos filtros de Status/Categoria/Artesão em Publicações), limpeza do
catálogo, distribuição do produto e relacionados, ações de Minha conta e Ajuda
por perfil. Executa Chromium/Firefox em 1280/768/375px, com capturas e relatório
em `RELATORIO_DIR/complemento/depois`. O caso de três relacionados utiliza
o produto existente Escultura em Madeira, sem alterar dados persistidos.
