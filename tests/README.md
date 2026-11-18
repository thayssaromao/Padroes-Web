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
```

Se o módulo não estiver na resolução padrão, defina `PLAYWRIGHT_MODULE` como o caminho absoluto da instalação existente. `PLAYWRIGHT_BROWSERS_PATH` e `LD_LIBRARY_PATH` podem ser necessários conforme a instalação dos navegadores. `PORTAL_URL` aceita outra origem/porta, com `/` final. `RELATORIO_DIR` escolhe onde salvar relatórios e screenshots; o padrão é `liceu-fluxos` na pasta temporária do sistema.

Cada suíte abre contextos isolados, usa apenas dados fictícios e não limpa o armazenamento de uma sessão já aberta pelo usuário. A suíte central executa envio/aprovação/publicação, rejeição/motivo/reenvio e cadastro/login. A regressão verifica geometria da tabela, leitura do catálogo em lista, composição do produto, favoritos, topbar, logout entre abas, troca de conta na mesma rota, atualização da identidade em outra aba, fallback e navegação rápida.

Os testes locais de contratos HTML não substituem os validadores W3C. JSLint e validadores W3C não estão instalados neste repositório; a revisão registra separadamente os checks efetivamente executados.

A suíte `ui.cjs` audita ações, status, tooltips, controles de senha, filtros, tamanhos de ações de tabela, taxonomias, modais e overflow em 1280/768/375px. Capturas ficam por padrão em `/tmp/liceu-ui` (ou `RELATORIO_DIR`). A renderização dos SVGs exige conectividade com o CDN/API do Iconify já adotado. Ela também abre perfis temporários próprios para verificar fechamento/reabertura real dos navegadores com sessão lembrada; nenhum perfil pessoal é utilizado.
