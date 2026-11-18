# Testes de regressão

A main mantém quatro suítes voltadas às funcionalidades do portal.

## Dados e estrutura

Sem dependências adicionais:

```bash
node tests/dados.mjs
node tests/estrutura.mjs
```

`dados.mjs` verifica persistência, permissões, moderação, cadastro público e
administrativo, credenciais, unicidade de e-mail e compatibilidade dos dados
locais anteriores. `estrutura.mjs` verifica rotas, parciais e contratos HTML.

## Fluxos no navegador

Com o servidor estático ativo e uma instalação existente de Playwright com
Chromium e Firefox disponíveis:

```bash
export PORTAL_URL="http://127.0.0.1:8091/"
# Se o módulo não estiver na resolução padrão, informe a instalação existente:
# export PLAYWRIGHT_MODULE="/caminho/para/node_modules/playwright"
# export PLAYWRIGHT_BROWSERS_PATH="/caminho/para/navegadores"
node tests/fluxos.cjs
node tests/regressoes.cjs
```

`fluxos.cjs` cobre envio, aprovação, rejeição e reenvio, cadastro administrativo,
autocadastro, conclusão do perfil, login, sessão e guardas de acesso.
`regressoes.cjs` cobre catálogo, favoritos, produto, tabela administrativa,
ações compartilhadas, identidade/logout entre abas e navegação rápida.

As suítes usam contextos isolados e dados fictícios. Evidências geradas ficam
por padrão no diretório temporário do sistema; `RELATORIO_DIR` permite escolher
outro destino. Não utilizar perfis pessoais de navegador nos testes.
