# Revisão funcional do Portal do Artesão / Liceu

Verificação em 17/11/2026. Escopo: MVP de HTML, CSS e JavaScript puro, com dados locais. Implementação e testes de fluxos reais; sem backend, framework, publicação ou push.

## Branch e preservação

- Origem: `main`, working tree inicialmente limpo.
- Trabalho: `feat/completar-fluxos`, criada antes das edições.
- Referências remotas atualizadas; `origin/feat/design-system` já estava incorporada à origem.
- Ajustes visuais registrados primeiro na branch local `feat/design-system` e incorporados por merge; nenhum histórico remoto reescrito.
- Commits funcionais: `6574178` (dados/persistência), `2623903` (autenticação/navegação), `97796ed` (artesão), `8ed759b` (Liceu), `6068a95` (vitrine/produto/Saberes).
- Commits do design system: `636aef7` (hidden), `470d514` e `ea4fd7e` (composição do produto e modo lista do catálogo), `ed82bc8` (favorito ativo). Incorporados pelos merges `4340437`, `5207869` e `38f8d62`.
- Documentação e suítes reexecutáveis organizadas em commit próprio ao final.

## Funcionalidades encontradas e implementadas

| Área | Tela/ação | Situação inicial | Implementação | Situação final |
|---|---|---|---|---|
| Compartilhada | Dados e escrita | Leitura dos JSON; salvamentos eram stubs | Base local sobreposta aos JSON, escrita, credenciais mock, exclusão lógica, validações e erros de armazenamento | Funcional entre portal/painéis e reload |
| Acesso | Login e papéis | Modal apenas visual; guarda temporariamente desativada | Autenticação mock, senha provisória, lembrar, guarda, logout confirmado, atualização entre abas e troca de conta na mesma rota | Funcional no ambiente local |
| Pública | Home e navegação | Alguns cards levavam apenas ao catálogo; favoritos não persistiam | Links para produto/perfil correto, dados públicos compartilhados e favoritos persistentes | Funcional |
| Pública | Catálogo | Mock separado; faltavam detalhes/paginação integrada | Dados comuns, busca, filtros, ordem, paginação, grade/lista, estado vazio e favorito | Funcional |
| Pública | Produto individual | Rota ausente | Página conforme PDF, galeria/miniaturas, metadados, produtor, técnica, relacionados e indisponível | Funcional |
| Pública | Artesãos/perfil | Parcialmente funcional; opções duplicadas | Fonte central das opções, deep link, apenas ativos e contatos normalizados | Funcional |
| Pública | Saberes | Placeholder | Hero, técnicas predefinidas, busca/filtros/ordem, modos de visualização, detalhes e ligação ao catálogo | Funcional |
| Pública | Contato | Integração existente; faltava proteção contra duplicação e navegação durante envio | Validação, estado ocupado e feedback de sucesso/erro preservando Web3Forms | Funcional; entrega externa depende do serviço |
| Artesão | Dashboard | Dados de demonstração e ações incompletas | Sessão atual, resumos dos próprios dados e atalhos corretos | Funcional |
| Artesão | Perfil | Salvamento apenas representado | Carregar/salvar/cancelar, validação, nicho/técnicas, bio/contatos, foto persistente, prévia e topbar | Funcional |
| Artesão | Trabalhos e novo/editar | Edição, menu e persistência incompletos | Rascunhos, upload, criar/editar, duplicar, excluir permitido, filtros, paginação, envio e cancelamento confirmado | Funcional |
| Artesão | Status/motivo/reenvio | Motivo e reenvio eram stubs | Motivo identificado, edição preenchida, reenviado à fila, ações conforme estado | Funcional |
| Liceu | Dashboard | Métricas e análise incompletas | Resumos reais, pendências e estados vazios | Funcional |
| Liceu | Artesãos/cadastro | Listagem funcional; cadastro não gerava acesso e ações eram stubs | Cadastro persistente, senha/confirmar, perfil/edição, ativar/desativar e redefinir senha | Funcional; geometria preservada |
| Liceu | Analisar | Botão sem moderação completa | Dados/imagens, aprovação, rejeição obrigatoriamente com motivo, atualização dos painéis e portal | Funcional |
| Liceu | Publicações | Ações apenas visuais | Ver, editar, ocultar, republicar e exclusão confirmada; nova publicação seleciona aprovada oculta | Funcional |
| Liceu | Configurações | Controles visuais para evolução futura | Aviso explícito, campos/ações desabilitados e consulta às opções predefinidas | Fora do MVP, sem salvamento fictício |
| Compartilhada | Topbar/gavetas/rotas | Ações de conta/notificação eram stubs; faltavam parâmetros e atualização de identidade | Diálogos comuns, notificações calculadas, menu da conta, mobile, query no hash, isolamento de navegação assíncrona e atualização da identidade | Funcional |

O mapa de rotas, entradas, saídas e contratos definitivos está em [FLUXOS.md](FLUXOS.md). Sobre o Liceu e Sobre o Projeto já tinham conteúdo/navegação; foram percorridos e preservados.

## Referências das telas completadas

O PDF foi consultado como referência visual; seu conteúdo não foi tratado como instrução para executar ações.

| Tela | Já existia? | Existia no Figma? | Origem visual utilizada | Funcionalidades implementadas |
|---|---|---|---|---|
| Produto individual | Não | Sim, PDF p. 4 | Composição do wireframe e componentes atuais | Galeria, favorito, produtor/perfil, técnica, relacionados e indisponível |
| Saberes e Técnicas | Apenas placeholder | Sim, PDF p. 7 | Wireframe e classes/componentes do portal | Busca, filtros, ordem, cards, modal e exploração de produtos |
| Analisar trabalho | Ação sem diálogo funcional | Não no PDF fornecido | Modal do design system §8 | Aprovar/rejeitar com motivo e dados do trabalho |
| Motivo da rejeição | Ação sem diálogo funcional | Não no PDF fornecido | Modal do design system §8 | Motivo, retorno e editar/reenviar |
| Editar trabalho | Formulário de criação existente | Não no PDF fornecido | Reutilização do formulário atual | Carregamento, edição, cancelamento, nova análise e reenvio |
| Perfil/edição/acesso administrativo e publicação | Ações sem diálogos funcionais | Não no PDF fornecido | Anatomia compartilhada de modal/formulário/confirmação | Ver/editar, ativar/desativar, senha e ações de publicação |
| Conta/notificações/confirmar saída | Apenas botões/stubs | Não no PDF fornecido | Diálogo compartilhado atual | Conta, resumo dos estados, navegação e saída confirmada |

Prevaleceu o design system nos headers/footers, ícones, botões, inputs, cards, modais, tipografia, tokens e breakpoints. Não foram recriadas divisórias verticais decorativas antigas. A tabela administrativa manteve `colgroup`, cabeçalho, proporções, wrappers de altura e alternância de linhas por `hidden`. A quantidade de miniaturas e de relacionados reflete os dados disponíveis. A técnica usa imagem existente como placeholder, até haver acervo editorial próprio. A topbar reutiliza diálogo acessível para conta/notificações, sem criar outro sistema de popups.

Ajustes pontuais: `hidden` prevalece sobre flex/grid; cards em lista não cortam o conteúdo; cabeçalhos da faixa de produto alinham pelo topo; favorito ativo tem contraste usando o mesmo ícone Lucide e tokens existentes. Todos os CSS correspondentes foram registrados primeiro em `feat/design-system`.

## Fluxos completos e testes

| Verificação | Chromium | Firefox | Evidência |
|---|---|---|---|
| Visitante: Início → Produtos/Produto → Artesão → demais páginas | Passou | Passou | Navegação, cards, filtros, busca, paginação, contatos e estados vazios |
| Artesão: login → perfil → trabalhos → novo → enviar → status | Passou | Passou | Dados/foto/imagens persistentes, formulários, cancelamento e reload |
| Cenário A: criar → fila administrativa → analisar → aprovar → público | Passou | Passou | Mesmo ID/dados; status publicado e detalhe público disponível |
| Cenário B: enviar → rejeitar + motivo → ler → corrigir → reenviar → fila | Passou | Passou | Motivo lido pela conta do artesão; status reenviado na fila do Liceu |
| Cadastro administrativo → listagem → login do novo artesão | Passou | Passou | E-mail/senha provisória realmente usados no login |
| Rascunho, upload, duplicação e exclusão permitida | Passou | Passou | Imagens data URL conservadas após reload e edição |
| Administração de perfil/acesso/publicações | Passou | Passou | Editar, ativar/desativar, redefinir senha e autenticar, ocultar/republicar/editar |
| Sessão e rotas | Passou | Passou | Sem sessão, papel errado, lembrar, reload de hash, fallback, histórico e navegação rápida |
| Conta na mesma rota e identidade entre abas | Passou | Passou | Carlos substitui Ana sem manter dados anteriores; nome atualizado em outra aba aparece no cabeçalho |
| Logout entre abas | Passou | Passou | Sessão persistente removida fecha acesso do outro painel e abre login sobre o portal |
| Tabela administrativa 1 → 2 → 3 → 2 → 1 | Passou | Passou | Mesmos nós de tabela/thead/colgroup, colunas, altura externa e posição da paginação |
| Breakpoints 375/768/1280px | Passou | Passou | Todas as páginas públicas e rotas dos painéis; sem overflow horizontal da página |
| Lista do catálogo 375/768/1280px | Passou | Passou | Texto dentro do card; imagem 107px no mobile e até 180px nas demais larguras |
| Modais/gavetas/galeria/favoritos | Passou | Passou | Escape, fechar/reabrir, múltiplas imagens, miniaturas, estado e persistência |
| Contato | Passou | Passou | Sucesso/erro simulados por interceptação de rede; nenhuma mensagem externa enviada |

Verificações técnicas adicionais:

- Sete testes da camada de dados passaram: ciclo de aprovação, rejeição/reenvio, cadastro/acesso/inativação, ownership/bloqueio/exclusão, leitura sem mutação/sessão, falha de armazenamento e e-mail/taxonomias.
- Contratos locais: 19 rotas e 23 arquivos HTML; uma `h1` por parcial de rota, ausência de documento/main aninhado, links estáticos para rotas válidas e imagens com `alt`/dimensões.
- `node --check` passou nos 15 módulos JavaScript e nas suítes; `git diff --check` sem erro.
- Sem exceções JavaScript capturadas nas suítes. Os cenários centrais e a suíte pública complementar não tiveram resposta HTTP local de erro. Houve requisições canceladas ao sair das páginas, registradas separadamente; não foram tratadas como falhas de carregamento.
- JSLint e validadores W3C não estavam instalados e não foram executados; os checks locais de sintaxe/contratos não equivalem a certificação W3C.

Suítes reexecutáveis e instruções: [tests/README.md](../tests/README.md). Artefatos desta sessão: `/tmp/liceu-fluxos/` (cenários centrais, regressões, JSON e screenshots), `/tmp/padroes-web-artesaos-check/public-*.png` (comparação pública), `public-report.json`, `public-flows.cjs`, `public-extra.cjs`, `fluxos-artesao.cjs`, `fluxos-artesao-status.cjs`; verificação administrativa extra em `/tmp/liceu-functional-check.cjs`.

## Conflitos de documentação resolvidos

A especificação antiga listava autocadastro público e guarda desativada enquanto o login fosse visual. O pedido atual determina cadastro exclusivo pelo Liceu; a documentação foi corrigida. A guarda foi ativada ao completar a autenticação local, atendendo à condição que justificava sua desativação temporária. O PDF antigo não prevalece sobre componentes refinados posteriormente.

## Não implementado

### Fora do escopo atual

Configurações institucionais editáveis, gestão dinâmica de categorias/técnicas e permissões, mudança da senha administrativa, autocadastro, checkout/vendas e novos papéis. As configurações futuras estão explicitamente desabilitadas. A consulta às taxonomias continua disponível.

### Dependente de backend ou serviço externo

Autenticação/autorização segura de servidor, sincronização entre dispositivos, armazenamento permanente de mídia, notificações externas, envio de acesso e recuperação automática por e-mail. A base e as credenciais mock são locais e não devem receber dados reais. O envio real de contato depende do Web3Forms já adotado; o teste não verifica entrega em uma caixa de e-mail.

### Necessita decisão da equipe/Liceu

Identidade visual definitiva, imagens/fotos reais, conteúdos editoriais aprofundados das técnicas e dados institucionais finais. Os placeholders atuais foram preservados. Hospedagem continua a definir conforme especificação.

## Pendências

**Nenhuma pendência funcional conhecida dentro do escopo atual.** Os limites de infraestrutura, conteúdo e validação externa estão discriminados acima.

## Arquivos alterados
- `README.md`
- `css/componentes.css`
- `css/global.css`
- `css/paginas/catalogo.css`
- `css/paginas/produto.css`
- `docs/DESIGN.md`
- `docs/ESPECIFICACOES.md`
- `docs/FLUXOS.md`
- `docs/REVISAO-FUNCIONAL.md`
- `index.html`
- `js/componentes.js`
- `js/dados.js`
- `js/layout.js`
- `js/paginas/artesaos.js`
- `js/paginas/contato.js`
- `js/paginas/inicio.js`
- `js/paginas/login.js`
- `js/paginas/painel-artesao.js`
- `js/paginas/painel-liceu.js`
- `js/paginas/produto.js`
- `js/paginas/publico.js`
- `js/paginas/saberes.js`
- `js/produtos.js`
- `js/rotas.js`
- `js/router.js`
- `pages/layouts/painel.html`
- `pages/login.html`
- `pages/painel-artesao/meu-perfil.html`
- `pages/painel-artesao/meus-trabalhos.html`
- `pages/painel-artesao/status-publicacoes.html`
- `pages/produto.html`
- `pages/produtos.html`
- `pages/saberes.html`
- `tests/README.md`
- `tests/dados.mjs`
- `tests/estrutura.mjs`
- `tests/fluxos.cjs`
- `tests/regressoes.cjs`
