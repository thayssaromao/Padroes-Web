# Testes de regressão

O projeto mantém seis suítes voltadas às funcionalidades e à acessibilidade do portal.

## Dados e estrutura

Sem dependências adicionais:

```bash
node tests/dados.mjs
node tests/estrutura.mjs
```

`dados.mjs` verifica persistência, permissões, moderação, cadastro público e
administrativo, credenciais, unicidade de e-mail e compatibilidade dos dados
locais anteriores. Também verifica a base JSON única, requisições concorrentes,
isolamento das coleções e recuperação após falha de leitura. `estrutura.mjs` verifica rotas, parciais e contratos HTML.

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
node tests/perfil-multisselecao.cjs
```

`fluxos.cjs` cobre envio, aprovação, rejeição e reenvio, cadastro administrativo,
autocadastro, conclusão do perfil, login, sessão e guardas de acesso.
`regressoes.cjs` cobre catálogo, favoritos, produto, tabela administrativa,
ações compartilhadas, identidade/logout entre abas e navegação rápida.

`perfil-multisselecao.cjs` cobre categorias e técnicas por checkbox, prévia,
descarte, persistência de múltiplos valores, teclado e responsividade. Também
confere as opções visíveis de Novo/Editar trabalho, seleção múltipla, valores
salvos e obrigatoriedade com foco no controle visível.

As suítes usam contextos isolados e dados fictícios. Evidências geradas ficam
por padrão no diretório temporário do sistema; `RELATORIO_DIR` permite escolher
outro destino. Não utilizar perfis pessoais de navegador nos testes.

## Acessibilidade, teclado e falhas de carregamento

Com o mesmo servidor e a instalação de Playwright descritos acima:

```bash
node tests/acessibilidade.cjs
```

A suíte verifica, em Chromium e Firefox, o atalho ao conteúdo sem alteração da
rota, menu móvel por teclado, pausa persistente do carrossel, movimento reduzido,
acordeões nativos, nomes acessíveis no painel móvel, rótulo de upload, alvos de
interação e recuperação após falhas de parcial e de layout. Os relógios de 6s
do carrossel são acelerados somente no contexto de teste. Nenhum perfil pessoal
ou serviço de mensagens externo é utilizado.

A auditoria de 23/11/2026 e sua metodologia estão em
[`docs/AUDITORIA_UI_UX.md`](../docs/AUDITORIA_UI_UX.md), com evidências resumidas
no JSON associado. Axe foi usado temporariamente para a auditoria, sem nova
dependência de execução do portal; a suíte acima usa apenas Playwright.
