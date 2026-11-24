# Portal do Artesão — Liceu de Ofícios de Curitiba

Catálogo de artesãos, trabalhos e técnicas desenvolvido para a disciplina de Padrões Web da UTFPR. O MVP reúne uma área pública e painéis de gestão para o artesão e a equipe do Liceu.

## Executar localmente

O projeto usa HTML, CSS e JavaScript puro com ES Modules, sem frameworks ou etapa de build. Abra a raiz em um servidor HTTP; abrir `index.html` por `file://` não funciona.

Com Node.js:

```bash
npx http-server -p 8080 -c-1
```

Com Python 3:

```bash
python3 -m http.server 8080
```

Acesse [localhost:8080](http://localhost:8080). Mantenha o terminal do servidor aberto. Se aparecer “Não foi possível conectar”, inicie o servidor novamente. Ao trocar de branch ou atualizar arquivos, recarregue com `Ctrl+Shift+R`; a opção `-c-1` do `http-server` desativa o cache durante o desenvolvimento. O Live Server do VS Code também pode servir a raiz do projeto.

## Acessos de demonstração

O login e a persistência são simulados no navegador. Utilize dados fictícios.

| Papel | E-mail | Senha |
|---|---|---|
| Liceu | `liceu@exemplo.com` | `liceu123` |
| Artesã Ana | `ana@exemplo.com` | `artesao123` |

Os demais artesãos ativos usam o e-mail da coleção `artesaos` de `data/banco.json` e a senha inicial `artesao123`, até uma redefinição pelo Liceu. As contas legadas `admin@liceu.mock` / `admin123` e `artesao@liceu.mock` / `artesao123` continuam disponíveis.

O administrador pode cadastrar artesãos com senha provisória. O cadastro público também permite criar uma conta e completar o perfil; a apresentação pública depende de categoria, técnica e estado ativo.

## Fluxos disponíveis

- **Público:** início, catálogo com busca e filtros, favoritos locais, detalhes do produto, artesãos e perfis, saberes, conteúdo institucional e contato.
- **Artesão:** editar perfil e foto, escolher várias categorias e técnicas, cadastrar e editar trabalhos, salvar rascunhos, enviar para análise, acompanhar o status e corrigir trabalhos rejeitados.
- **Liceu:** cadastrar e administrar artesãos, analisar trabalhos, aprovar ou rejeitar com motivo, editar publicações e controlar sua visibilidade.

Cada trabalho aceita várias categorias e técnicas predefinidas. O envio exige pelo menos uma opção em cada grupo; rascunhos podem ficar incompletos. Cards, detalhes, filtros, saberes e edição administrativa consideram todas as escolhas.

O ciclo é **rascunho → análise → publicação ou rejeição → correção e reenvio**. Apenas trabalhos publicados de artesãos ativos aparecem no catálogo público. Trabalhos em análise têm edição bloqueada; alterações em trabalhos publicados voltam à análise.

Configurações institucionais, permissões configuráveis e gestão dinâmica de categorias/técnicas permanecem fora do MVP. Os controles dessas funcionalidades futuras estão identificados e desabilitados.

## Dados e persistência

`data/banco.json` centraliza a base inicial:

| Campo | Conteúdo |
|---|---|
| `artesaos` | Perfis e contatos |
| `trabalhos` | Produtos, imagens, status e listas `categorias`/`tecnicas` |
| `categorias` | Opções predefinidas de categorias e técnicas |
| `tecnicas` | Registros institucionais dos ofícios |
| `usuarios` | Contas fictícias de demonstração |
| `sessoesDemonstracao`, `autenticacao`, `versao` | Configuração e formato da simulação |

`js/dados.js` valida e carrega o JSON uma vez por documento, compartilha requisições concorrentes e fornece cópias aos consumidores. Para alterar a base inicial, edite a coleção correspondente nesse arquivo.

As alterações feitas pelos formulários ficam em `localStorage` (`liceu:base:v1`); o navegador não reescreve o JSON do servidor. “Lembrar de mim” mantém a sessão em `localStorage`; sem essa opção, ela fica em `sessionStorage`. Cadastro, trabalhos e favoritos não sincronizam entre dispositivos ou origens. Limpar o armazenamento apaga as alterações locais.

Trabalhos antigos com `categoria` e `tecnica` singulares são lidos como listas sem apagar registros ou sessões. Novas gravações usam `categorias` e `tecnicas`, sem duplicatas. Credenciais provisórias usam PBKDF2 com salt individual, mas a autenticação permanece uma simulação local. Um backend com persistência remota é uma evolução futura.

## Organização e padrões

- `pages/`: páginas e layouts carregados pelo roteador de hash.
- `js/`: roteamento, dados, componentes e controladores de páginas.
- `css/`: tokens, componentes, layouts e estilos de páginas.
- `assets/`: logotipo (`logo.png`) e imagens; várias fotos ainda são placeholders.
- `data/banco.json`: base inicial única.
- `tests/`: seis suítes de dados, estrutura e navegador.
- `docs/`: especificações, design system, fluxos e evidências.

O padrão visual está em [docs/DESIGN.md](docs/DESIGN.md). Alterações compartilhadas de estilo entram primeiro em `feat/design-system` e depois são incorporadas à branch funcional, preservando o histórico. O push publica a branch de trabalho; a integração à `main` ocorre por pull request.

A única biblioteca de interface é **Iconify (`iconify-icon` 2.3.0)**, carregada por CDN. Ela fornece os ícones de linha sem framework ou build. Veja a justificativa e os padrões em [DESIGN.md](docs/DESIGN.md) e as instruções das imagens em [assets/img/LEIAME.md](assets/img/LEIAME.md).

## Testes e documentação

Os testes sem dependências adicionais foram executados com Node.js 22:

```bash
node tests/dados.mjs
node tests/estrutura.mjs
```

Para os testes de navegador, mantenha o servidor ativo e use uma instalação de Playwright com Chromium e Firefox:

```bash
export PORTAL_URL="http://127.0.0.1:8080/"
# Se necessário: export PLAYWRIGHT_MODULE="/caminho/para/node_modules/playwright"
node tests/fluxos.cjs
node tests/regressoes.cjs
node tests/perfil-multisselecao.cjs
node tests/acessibilidade.cjs
```

Os testes usam contextos isolados e dados fictícios. Instalação, cobertura e evidências estão em [tests/README.md](tests/README.md).

- [Especificações e limites do MVP](docs/ESPECIFICACOES.md)
- [Rotas e contratos funcionais](docs/FLUXOS.md)
- [Design system e paleta vigente](docs/DESIGN.md)
- [Validação da entrega atual](docs/VALIDACAO_MVP.md)
- [Comparação visual](docs/COMPARACAO_VISUAL.md)

## Histórico visual

As [comparações](comparacoes/README.md) e os [estudos visuais](propostas-visuais/README.md)
foram preservados como arquivo de revisão. Não representam necessariamente o
estado atual e não integram a navegação do portal. A referência vigente é o
[design system](docs/DESIGN.md): logo transparente, identificação **Portal do
Artesão** e espaçamento restaurado após a revisão visual.
