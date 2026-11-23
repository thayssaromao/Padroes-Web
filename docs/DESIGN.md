# Design System — Portal do Artesão

Guia visual e técnico do projeto. Vale para **quem escreve código** e para **quem desenha as telas que ainda faltam** (popups de ação, páginas novas). Derivado dos wireframes do Figma (`Tela Principal`, `Tela Perfil do Artesão`, `Tela Adm *`, `Tela do Artesão *`).

> A identidade cromática é uma **interpretação digital proposta**, inspirada no símbolo do Liceu. A paleta cinza era provisória. Tokens semânticos ficam em `css/global.css`; a aplicação nos componentes e nas páginas segue os papéis descritos em § Identidade cromática aplicada, ao final deste guia. Os hexadecimais não constituem um manual oficial da instituição.

---

## 1. Regras da disciplina (não negociáveis)

| Regra | Como cumprimos |
|---|---|
| HTML validado pelo W3C | Toda página/parcial deve passar no [Nu HTML Checker](https://validator.w3.org/nu/) sem **erros**. Parciais são validadas embrulhadas no `index.html` (ver §11). |
| CSS validado pelo W3C | Todo `.css` passa no [CSS Validator](https://jigsaw.w3.org/css-validator/) sem erros. Evitar propriedades experimentais sem fallback. |
| JS avaliado no JSLint | Todo `.js` passa no [JSLint](https://www.jslint.com/) com a diretiva `/*jslint browser */`. Ver §10.3. |
| Sem frameworks | HTML + CSS + JS puro (ES Modules). Nada de Bootstrap, Tailwind, React etc. |
| Responsivo (3 telas) | Smartphone, tablet e desktop — breakpoints em §3. |
| HTML semântico | `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `figure`, `dialog`, `table`, `form`, `fieldset`… sempre que existir o elemento certo. |
| JS pode estar incompleto | Funções futuras ficam declaradas com JSDoc + `// A IMPLEMENTAR:` (o JSLint rejeita a palavra TODO) e corpo vazio/retorno fixo. |
| Bibliotecas JS justificadas | Única biblioteca: **Iconify** (§6). Justificativa no README. |
| Multimídia | Imagens, animações CSS (§9), vídeo do YouTube na Home. Mídia > 2 MB fica fora do repositório. |

---

## 2. Tokens

Definidos em `:root` no [`css/global.css`](../css/global.css). **Use sempre `var(--token)`.**

### 2.1 Cores

| Grupo | Tokens principais | Aplicação |
|---|---|---|
| Marca | `--marca-turquesa`, `--marca-amarelo`, `--marca-rosa`, `--marca-petroleo` | Símbolo e grafismos, sem presumir códigos oficiais |
| Texto | `--cor-texto`, `--cor-texto-suave`, `--cor-texto-apagado`, `--cor-texto-invertido` | Petróleo/verde legível sobre superfícies claras; branco sobre fundos escuros |
| Superfície | `--cor-fundo`, `--cor-superficie-card`, `--cor-superficie-menu`, `--cor-superficie-modal`, `--cor-campo` | Off-white no plano principal, branco nas áreas elevadas e campos |
| Editorial | `--cor-editorial`, `--cor-editorial-alternada`, `--cor-destaque`, `--cor-acento` | Amarelo suave, rosa suave, amarelo e rosa saturados em acentos |
| Navegação | `--cor-barra`, `--cor-rodape`, `--cor-lateral`, `--cor-lateral-ativo`, `--cor-nav-texto`, `--cor-nav-hover` | Header turquesa profundo, footer/sidebar petróleo, item ativo amarelo |
| Interação | `--cor-primaria`, `--cor-primaria-hover`, `--cor-secundaria`, `--cor-link`, `--cor-foco`, `--cor-favorito` | Ação turquesa, secundário branco, links turquesa, foco e favoritos rosa escuro |
| Estados | `--cor-sucesso`, `--cor-alerta`, `--cor-erro`, `--cor-informacao`, `--cor-rascunho` e respectivos `-fundo` | Pares AA; rótulos e ícones mantêm significado sem depender da cor |
| Bordas | `--cor-borda`, `--cor-borda-controle`, `--cor-borda-forte` | Bordas decorativas suaves; controles/foco com contraste próprio |

Os valores e aliases completos estão em `css/global.css`.

### 2.2 Tipografia

Fonte: **Inter** (Google Fonts, pesos 400/500/600/700/800), fallback `Arial, Helvetica, sans-serif`.

| Token | Valor (mobile → desktop) | Uso |
|---|---|---|
| `--fonte-display` | `clamp(2rem, 5vw, 3.25rem)` / peso 800 | Título do hero ("Portal do Artesão") |
| `--fonte-h1` | `clamp(1.75rem, 3.5vw, 2.5rem)` / 800 | Título de página do painel ("Painel Administrativo") |
| `--fonte-h2` | `clamp(1.375rem, 2.5vw, 1.875rem)` / 700 | Título de seção ("Produtos em destaque") |
| `--fonte-h3` | `1rem` / 700 | Título de card / bloco de formulário |
| `--fonte-corpo` | `0.875rem` / 400 | Texto padrão |
| `--fonte-grande` | `1.125rem` / 400 | Texto de apoio do hero |
| `--fonte-pequena` | `0.8125rem` | Metadados, labels |
| `--fonte-mini` | `0.75rem` | Chips, sobretítulos, legenda |

Sobretítulo (`.sobretitulo`): `--fonte-pequena`, maiúsculas, `letter-spacing: .04em`, cor `--cor-texto-apagado`.

### 2.2.1 Hierarquia tipografica de navegacao

A navegacao utiliza tamanhos proprios, independentes dos
titulos das paginas e dos textos de conteudo.

| Elemento | Tamanho | Regra |
|---|---|---|
| Links do header publico | `15px` | Navegacao principal |
| Links do footer publico | `13px` | Menor que o header |
| Copyright e textos auxiliares do footer | `12px` | Escala discreta |
| Botoes e campos | `13px` a `14px` | Preservar legibilidade |
| Areas clicaveis | minimo `44px` | Nao reduzir com a fonte |

A reducao tipografica nao altera automaticamente a altura
do header, footer, logotipos ou icones.

Os layouts autenticados preservam suas variantes existentes.

No portal publico, o cabecalho utiliza `64px` de altura, links de `15px` e marca de `16px`. O rodape utiliza links de `13px`, marca de `14px` e espacamento vertical de `16px`. Os paineis mantem sua altura independente.

### 2.3 Espaçamento, raio, sombra, movimento

| Token | Valor |
|---|---|
| `--espaco-1` … `--espaco-8` | `4px 8px 12px 16px 24px 32px 48px 64px` |
| `--raio-pequeno` | `6px` (chips, badges, inputs) |
| `--raio-medio` | `10px` (botões, cards, tabelas) |
| `--raio-grande` | `24px` (modal, item ativo do menu lateral) |
| `--raio-pilula` | `999px` (badges de status, avatar) |
| `--sombra-card` | `0 1px 2px rgb(0 0 0 / 6%)` |
| `--sombra-elevada` | `0 12px 32px rgb(0 0 0 / 18%)` (modal, dropdown) |
| `--transicao` | `200ms ease` |
| `--largura-conteudo` | `1180px` (container do portal) |
| `--largura-lateral` | `280px` (menu lateral do painel) |
| `--altura-barra` | `64px` (cabeçalho) |

---

## 3. Breakpoints e grid

CSS **mobile-first**: estilos base = smartphone; `min-width` acrescenta.

| Nome | Faixa | Media query |
|---|---|---|
| Smartphone | < 600px | (base, sem query) |
| Tablet | 600px – 1023px | `@media (min-width: 600px)` |
| Desktop | ≥ 1024px | `@media (min-width: 1024px)` |

Grades de cards (`.grade-cards`): **1 coluna** no smartphone, **2** no tablet, **4** no desktop. Formulários de duas colunas viram uma coluna abaixo de 600px. Tabelas viram **lista de cards empilhados** abaixo de 1024px (§5.10).

Container do portal: `.container` → `width: min(100% - 2*var(--espaco-4), var(--largura-conteudo)); margin-inline: auto`.

---

## 4. Layouts

O site é uma SPA com roteamento por hash (ver [`ESPECIFICACOES.md`](ESPECIFICACOES.md)). Cada rota declara um **layout** em [`js/rotas.js`](../js/rotas.js).

### 4.1 Layout `portal` (páginas públicas)

```
┌ header.cabecalho ─────────────────────────────────────────────┐
│ [logo] LOGO      Início Produtos Artesãos Saberes O Liceu Contato │ [👤 Entrar] │
├ main#conteudo ───────────────────────────────────────────────┤
│ <section> hero / <section> faixas …                           │
├ footer.rodape ───────────────────────────────────────────────┤
│ [logo] LOGO   links de rota (underline ativo)   [IG] [WA]     │
└───────────────────────────────────────────────────────────────┘
```

- Cabeçalho: fundo `--cor-barra`, altura `--altura-barra`. O link ativo recebe `aria-current="page"` e uma barra de 3px `--cor-borda-forte`. No hover e foco por teclado, a linha expande do centro com `scaleX` em 200ms, usando `--cor-indicador-hover` nos links inativos. Não há mudança de peso da fonte.
- Links do cabeçalho e rodapé clareiam para `--cor-link-barra-hover` (`#333333`) no hover e foco. A ação Entrar mantém sua divisória e usa apenas a transição de cor. Os ícones sociais têm desenho de 24px dentro de alvos de 44px.
- Abaixo de 1280px, o menu vira **gaveta** aberta por botão hambúrguer (`button.cabecalho__menu`, `aria-expanded`, `aria-controls="nav"`). Fecha ao selecionar qualquer link, clicar fora, sair com o foco ou pressionar Escape. Escape devolve o foco ao botão. Os painéis mantêm o breakpoint de 1024px.
- No desktop, os links do rodapé ocupam a altura do componente e ancoram a linha diretamente no topo, sem deslocamentos negativos. Em telas menores, os links podem quebrar em linhas e o indicador fica no topo de cada item.
- Seções alternam fundo `--cor-fundo` / `--cor-fundo-alternado`, padding vertical `--espaco-7` (desktop) / `--espaco-6` (mobile).

### 4.2 Layout `painel` (Área do Liceu e Área do Artesão)

Os dois painéis usam **a mesma casca** ([`pages/layouts/painel.html`](../pages/layouts/painel.html)); muda só o título do menu, os itens e o usuário.

```
┌ header.painel__topo ──────────────────────────────────────────┐
│ [☰] [logo] LOGO                         [🔔] │ (●) Nome ⌄       │
├ nav.painel__lateral ─┬ main#conteudo.painel__principal ────────┤
│ Área do Liceu        │ SOBRETÍTULO                              │
│ ▣ Início  (ativo)    │ Título da página (h1)                    │
│ ○ Artesãos           │ Descrição                                │
│ …                    │ [ações]                                  │
│ ──────────           │ conteúdo da aba…                         │
│ ↗ Voltar ao Portal   │                                          │
│ ⇥ Sair               │                                          │
├ footer.painel__rodape ┴───────────────────────────────────────┤
│ [logo] LOGO                    Ajuda │ Sobre o projeto │ © 2026 │
└───────────────────────────────────────────────────────────────┘
```

- Menu lateral: fundo `--cor-lateral`, largura `--largura-lateral`; item ativo com fundo `--cor-lateral-ativo`, `--raio-grande`, peso 700 e `aria-current="page"`.
- Escala compacta dos painéis, isolada em `.layout-painel`: lateral de 240px, topo de 64px, corpo/menu de 14px, título principal de 24–30px e títulos de seção de 18–22px. Links do menu mantêm altura mínima de 44px e ícones de 20px; indicadores usam ícones e números de 28px. O portal público mantém sua escala própria.
- Tabelas largas rolam horizontalmente dentro de `.tabela-container`, preservando todas as colunas sem ampliar a largura da página. A apresentação em cards nas telas menores é mantida.
- A listagem administrativa de artesãos usa `.tabela--artesaos`: `table-layout: fixed`, largura de 100% e mínima de 1120px no desktop. Um único `colgroup` define, via classes CSS dos elementos `col`, as proporções de 18% / 15% / 15% / 21% / 9% / 22% (identificação, empreendimento, categorias, contato, status e ações), preservando a distribuição da página 1. Não atribuir larguras independentes a `th` ou `td`. Células têm altura mínima de 84px, acomodando duas fileiras de etiquetas. Na paginação, `colgroup` e `thead` permanecem intactos, e as linhas do `tbody` alternam `hidden`; ícones recebem `noobserver` para serem preparados mesmo fora da página visível. Tabela e paginação reservam as dimensões dos ícones antes da renderização. Abaixo de 1024px, o `colgroup` não interfere na apresentação existente em cards.
- **Abas = sub-rotas.** Cada item do menu é uma rota (`#/painel-liceu/artesaos`). A casca fica montada; só o `main` troca.
- A região externa `.liceu-listagem-artesaos` reserva no desktop cinco linhas de 84px, 48px de cabeçalho, 32px de intervalo e 40px de paginação. O contêiner com borda da tabela tem altura natural e termina na última linha real; o espaço reservado fica fora dele, e a paginação é alinhada à base da região. A última página mantém a posição do contador, paginação e rodapé, sem registros fictícios. Avatares permanecem em 40px, botões de ação não encolhem e chips longos usam reticências dentro da coluna. Nomes e contatos usam `.tabela__texto`; textos longos são truncados visualmente, mantendo o conteúdo completo no DOM e em `title`. No celular, permanece a apresentação adaptável em cards.
- Desktop: lateral fixa à esquerda. Tablet/smartphone: lateral vira **gaveta** sobre o conteúdo, aberta pelo `☰` do topo.
- Cabeçalho de página do painel (`.painel-cabecalho`): sobretítulo + `h1` + parágrafo + linha de botões. Pode ter imagem à direita no desktop (banner).

Menus definidos (decisão de unificação — as telas `Publicações` e `Config` foram adaptadas a este padrão):

| Área do Liceu (`#/painel-liceu…`) | Área do Artesão (`#/painel-artesao…`) |
|---|---|
| Início | Início |
| Artesãos | Meu perfil |
| Cadastrar Artesão | Meus trabalhos |
| Trabalhos Pendentes | Novo trabalho |
| Publicações | Status das publicações |
| Configurações (inclui categorias e técnicas) | |

---

## 5. Componentes

Classes ficam em [`css/componentes.css`](../css/componentes.css). Nomenclatura: bloco em português + modificador com `--` + elemento com `__` (ex.: `.card-produto__titulo`, `.btn--primario`).

### 5.1 Botões — `.btn`

| Variante | Classe | Aparência | Uso |
|---|---|---|---|
| Primário | `.btn.btn--primario` | fundo `--cor-primaria`, texto branco | Ação principal da tela (1 por área): "Cadastrar novo artesão", "Enviar para análise" |
| Secundário | `.btn.btn--secundario` | fundo branco, borda `--cor-borda-forte` | "Ver trabalhos pendentes", "Analisar", "Ver perfil" |
| Suave | `.btn.btn--suave` | fundo `--cor-superficie-forte`, borda `--cor-borda` | Botões do hero do portal e "Editar" |
| Link | `.btn.btn--link` | sem fundo, sublinhado | "Cancelar", "Ver motivo" |
| Ícone | `.btn.btn--icone` | quadrado 44×44, só ícone + `aria-label` e `title` | "⋯", olho, lápis, lixeira, setas do carrossel |
| Bloco | `+ .btn--bloco` | `width: 100%` | "Ver perfil →" nos cards |

Altura 44px (mínimo de toque), raio `--raio-medio`, padding `0 var(--espaco-5)`, peso 600, gap 8px entre ícone e texto.
Estados: `:hover` escurece (primário → `--cor-primaria-hover`; outros → fundo `--cor-superficie-forte`) com `transform: translateY(-1px)`; `:focus-visible` → `outline: 3px solid var(--cor-borda-forte); outline-offset: 2px`; `:disabled`/`[aria-disabled="true"]` → opacidade .5, sem hover ("Aguardando análise").
Link que parece botão: usar `<a class="btn …">`. Ação na mesma tela: `<button type="button">`.

### 5.1.1 Consistencia dimensional dos controles

A escala tipografica global aprovada deve ser preservada.
A revisao de componentes nao implica reduzir novamente
a fonte principal ou a navegacao publica.

**Botoes e interatividade**

- Botoes principais seguem a altura minima de 44px.
- Botoes somente com icone possuem descricao acessivel.
- Controles compactos podem ter superficie visual menor,
  desde que a area interativa efetiva seja adequada.
- Acoes de senha, favoritos, visualizacao e paginacao
  precisam ser verificadas individualmente.
- Nao aumentar dimensoes indiscriminadamente quando
  isso comprometer o alinhamento aprovado.

**Campos e filtros**

- Campos principais preservam altura minima de 44px.
- Labels e valores seguem os tokens tipograficos.
- Filtros de Produtos, Artesaos e Saberes preservam os
  alinhamentos horizontais e espacamentos aprovados.
- Variantes compactas devem ser documentadas e manter
  navegacao por teclado e foco visivel.

**Cards e estilos especificos**

- Componentes equivalentes devem compartilhar tokens
  de borda, raio, cor, tipografia e estados interativos.
- Evitar redefinicoes conflitantes da mesma classe em
  arquivos diferentes.
- Preservar as variacoes intencionais de imagem, grade
  e conteudo entre paginas.
- Antes de migrar estilos legados de Produtos, verificar
  o HTML gerado, a ordem de carregamento dos CSS e as
  dependencias JavaScript.

**Controles especificos do catalogo de Produtos**

- `.opcao` e `.btn-view` preservam suas dimensoes
  compactas e o alinhamento ja aprovado.
- Cores, bordas e raios devem reutilizar os tokens
  globais do design system.
- Estados de hover e selecao permanecem perceptiveis.
- A padronizacao nao deve alterar a distribuicao dos
  chips nem a posicao dos controles de ordenacao.
- `.card-produto` deve reutilizar a implementacao
  compartilhada; regras legadas conflitantes serao
  revisadas separadamente apos verificar seu uso.
- Acessibilidade dos controles compactos sera
  validada antes de alterar suas dimensoes.

**Ordem de implementacao**

1. Documentar o comportamento e suas excecoes.
2. Ajustar componentes compartilhados no design system.
3. Adaptar estilos especificos na branch funcional.
4. Validar responsividade, acessibilidade e aparencia.

### 5.2 Campos de formulário

- Estrutura: `<div class="campo"><label for="x" class="campo__rotulo">Nome *</label><input id="x" class="campo__entrada" …></div>`.
- Entrada: altura 44px, borda 1px `--cor-borda`, raio `--raio-pequeno`, fundo branco; `:focus-visible` borda `--cor-borda-forte` + outline.
- **Com ícone** (e-mail, WhatsApp, Instagram, busca): `.campo__grupo` com `iconify-icon` posicionado à esquerda; a entrada recebe `padding-left: 40px`.
- **Senha**: o controle compartilhado usa `eye-off` quando `type="password"` (ação “Mostrar senha”) e `eye` quando `type="text"` (ação “Ocultar senha”). `aria-label`, `title`, `aria-pressed` e `aria-controls` acompanham o estado; `prepararCamposSenha` inicializa login, provisória, confirmação e redefinição, sem duplicar eventos. O campo reserva espaço à direita para o alvo de 44px.
- `select` nativo estilizado (seta própria via `background-image` SVG inline). `textarea` com `resize: vertical`.
- Obrigatório: `*` no rótulo + atributo `required`. Agrupar blocos com `<fieldset class="bloco-form">` + `<legend>`.
- **Bloco de formulário** (`.bloco-form`): card com contorno `--borda-card`, raio `--raio-card`, padding `--espaco-5`; cabeçalho com ícone + título (h2 visual de `--fonte-h3`) + descrição.
- **Cabeçalho de seção**: `.bloco-form__cabecalho.bloco-form__cabecalho--secao` usa flex com alinhamento central e gap de 16px. Contém `.bloco-form__icone` (caixa de 40px, token `--tamanho-caixa-icone-secao`, com ícone de 28px pelo token `--tamanho-icone-secao`) e `.bloco-form__texto` (título e descrição em coluna, gap de 4px e margens zeradas). O ícone é centralizado no conjunto título + descrição, nunca deslocado individualmente. Título usa line-height de 1.25 e descrição usa `--altura-linha`. Nos fieldsets do cadastro, o cabeçalho permanece em `legend`, com 16px até os campos. A variante é reutilizável em cadastro/edição, sem mudar outros cabeçalhos legados que não a utilizam.
- Seletor de técnicas: `select` + lista de **chips removíveis** (§5.3).
- Toggle (Configurações): `<input type="checkbox" role="switch" class="interruptor">`.
- Radio (Preço): nativo com `accent-color: var(--cor-primaria)`.

Cabeçalhos legados de cards, métricas e avisos não usam bordas verticais entre ícone e conteúdo. O espaçamento incorpora a antiga área da divisória para preservar posições e dimensões. A variante de cabeçalho de seção mantém seu wrapper e seus tokens próprios. Barras de filtro não incluem elementos separadores decorativos; `.barra-filtros--grupos` separa os grupos apenas com gap. Bordas externas, separadores horizontais e divisórias do header permanecem preservados.

### 5.3 Chips e etiquetas

- `.chip` — etiqueta estática (categoria/técnica): `data-cor` e pares `--cor-chip-…`, raio `--raio-pequeno`, `--fonte-mini`. `criarChips` e `prepararChips` mantêm a cor por assunto.
- `.chip--removivel` — chip + `button.chip__remover` (×, `aria-label="Remover Cerâmica"`, alvo mínimo de 44px).
- `.filtro-chip` — botão de filtro ("Todos", "Decoração"…) com `aria-pressed`; ativo usa fundo escuro da própria cor e texto branco. Grades de categorias se adaptam ao espaço disponível. Favoritos conservam a variante rosa própria.

### 5.4 Badges de status — `.status`

Pílula com ícone + texto. **Nunca só cor** — o texto sempre aparece.

| Status (`data-status`) | Texto | Ícone Iconify |
|---|---|---|
| `publicado` | Publicado | `lucide:circle-check` |
| `em-analise` | Em análise | `lucide:clock` |
| `rascunho` | Rascunho | `lucide:file-text` |
| `rejeitado` | Rejeitado | `lucide:circle-x` |
| `reenviado` | Reenviado | `lucide:refresh-cw` |
| `ativo` | Ativo | `lucide:circle-check` |
| `inativo` | Inativo | `lucide:circle-x` |
| `oculto` | Oculto pelo Liceu | `lucide:eye-off` |

Gerado por `criarStatus(status)` em [`js/componentes.js`](../js/componentes.js).

**Integracao dos cards no catalogo de Produtos**

- O catalogo renderiza os produtos com `criarCardPublico()`,
  reutilizando `criarCardProduto()` e `.card-produto`.
- Borda, raio, sombra e hover pertencem ao componente
  compartilhado em `css/componentes.css`.
- `css/produtos.css` nao deve redefinir globalmente
  `.card-produto` ou `.card-produto:hover`.
- As regras de grade e modo lista permanecem especificas
  do catalogo.
- Os ajustes de `.card-produto__imagem` e
  `.card-produto__corpo` no modo lista sao preservados.
- A remocao de CSS legado nao modifica HTML, JavaScript,
  favoritos, filtros, paginacao ou ordenacao.

**Limpeza de estilos legados dos cards**

A renderizacao atual utiliza as classes compartilhadas
`.card-produto__imagem`, `.card-produto__corpo` e
`.card-produto__favorito`.

As classes antigas `.card-imagem`, `.card-info` e
`.btn-favorito` nao possuem referencias identificadas
na implementacao atual.

Seus estilos legados podem ser removidos de
`css/produtos.css`, preservando:

- O componente compartilhado `.card-produto`.
- Os estilos de grade e modo lista.
- O favorito `.card-produto__favorito`.
- Os dados de titulo, tecnica, categoria e preco.
- A estrutura responsiva e os alinhamentos aprovados.

A remocao deve ser validada visualmente antes
de ser considerada concluida.

**Composicao das paginas institucionais**

- As paginas institucionais utilizam os tokens existentes
  de espaco, cores, tipografia e bordas.
- A pagina Sobre o Projeto apresenta um hero claro
  e uma secao alternada para os integrantes.
- As imagens dos heroes podem ter proporcoes
  diferentes no desktop, conforme o wireframe.
- Em telas menores, a composicao permanece
  responsiva e empilhada.
- A linha do tempo do Liceu e os dados reais
  existentes devem ser preservados.
- Ajustes especificos ficam nos CSS das paginas,
  sem redefinir componentes compartilhados.

**Perfil responsivo do artesao**

- O modal utiliza o componente compartilhado `.modal`.
- Em telas pequenas, foto e informacoes ficam empilhadas.
- Em telas maiores, a foto respeita o espaco disponivel.
- Textos e contatos nao devem produzir overflow.
- Os ajustes especificos ficam em `css/paginas/artesaos.css`.
- O JavaScript e os dados do perfil sao preservados.

### 5.5 Cards

| Card | Classe | Conteúdo | Onde |
|---|---|---|---|
| Atalho | `.card-atalho` | ícone · título + descrição · `chevron-right`; card inteiro é `<a>` | Home "Como você quer explorar?" |
| Produto | `.card-produto` | `figure` com imagem 4:3 + botão favorito (círculo, canto sup. dir.) · nome · categoria · (opcional) status + ações | Home, Área do Artesão |
| Artesão (mini) | `.card-artesao-mini` | avatar redondo 96px · nome · técnica principal | Home "Conheça quem produz" |
| Artesão | `.card-artesao` | Na listagem pública: foto circular 64px · nome · empreendimento ou @ · local (`map-pin`) · chips abaixo da identificação, usando toda a largura · botão bloco "Ver perfil →" na base, com intervalo mínimo de 12px após os chips. Na grade desktop, fileiras de mesma altura, determinada pelo conteúdo, sem reserva de linhas vazias para chips; celular e lista têm altura adaptável. | Página Artesãos |
| Estatística | `.card-estatistica` | ícone · espaçamento · número grande (800) · rótulo, sem divisória vertical | Resumos dos painéis |
| Trabalho (painel) | `.card-trabalho` | imagem · título · artesão (`user`) · categorias (`tag`) · status · botão | Painel Liceu "aguardando análise" |

Todos: superfície branca, contorno completo de 1px `--borda-card` e raio `--raio-card`. Estatísticas preservam fundo e contorno semânticos. Hover/foco reforçam `--sombra-elevada`, sem deslocamento. Cards de lista são `<article>` com título `h3`.

### Padrao estrutural dos cards de trabalho do Artesao

Os cards equivalentes do painel do Artesao devem seguir:

1. Imagem do trabalho.
2. Titulo.
3. Metadados de categoria e tecnica.
4. Divisoria horizontal.
5. Status e acoes contextuais.
6. Acoes principais.

A divisoria aparece sempre antes dos chips de status.

Estados padronizados:

- Rascunho: status Rascunho e acao Enviar para analise,
  ambos visiveis diretamente no card.
- Em analise: status correspondente.
- Publicado: status correspondente.
- Rejeitado: status Rejeitado e acao Ver motivo.

As acoes devem respeitar as permissoes e regras de negocio
de cada estado.

Os cards reutilizam a mesma estrutura visual e preservam
os icones Lucide e os alvos de interacao.

### 5.6 Cabeçalho de seção — `.secao-cabecalho`

Título `h2` à esquerda + link "Ver catálogo completo →" à direita (`.link-seta`, `--fonte-pequena`, peso 700). Empilha no smartphone.

### 5.7 Carrossel — `.carrossel`

`<section class="carrossel" aria-roledescription="carrossel" aria-label="…">` contendo `ul.carrossel__trilho` > `li.carrossel__slide` (`aria-roledescription="slide"`, `aria-label="1 de 4"`), botões anterior/próximo (`.btn--icone` circulares sobre a imagem) e `div.carrossel__indicadores` com botões-ponto (`aria-label="Ir para slide 2"`, ativo com `aria-current="true"`).
Animação: o trilho desliza com `transform: translateX(-n*100%)` + `transition: transform 500ms ease`. Avanço automático a cada 6s, com pausa temporária em hover/foco e controle Pausar/Retomar rotação. `prefers-reduced-motion` inicia em pausa persistente; retomada exige ação explícita. Controlado por `iniciarCarrossel(elemento)`.
Proporção 16:7 no desktop, 4:3 no smartphone; raio `--raio-medio`.

### 5.8 Busca e barra de filtros

- `.busca`: input largo com ícone `lucide:search`, fundo `--cor-superficie`, dentro de `<search>`/`<form role="search">`.
- `.barra-filtros`: linha com busca + rótulos/selects ("Filtrar por categoria/técnica", "Ordenar por") agrupados com gap, sem divisórias verticais; quebra em coluna no smartphone.
- `.alternar-visualizacao`: dois `.btn--icone` (`lucide:layout-grid` / `lucide:list`) com `aria-pressed`; ativo = fundo `--cor-primaria` e ícone branco.
- `.resultado-contagem`: "Exibindo 1 - 12 de 64 artesãos" (`--fonte-pequena`), com `aria-live="polite"`.

### Regras consolidadas de alinhamento dos filtros

Em desktop, os chips de um mesmo grupo devem utilizar toda
a largura horizontal disponivel, sem quebra prematura.

- Artesaos e Saberes: alinhar os chips as bordas do grupo
  de busca e filtro.
- Produtos: alinhar os chips as bordas da grade de produtos,
  respeitando a sidebar.
- Os chips devem distribuir a largura proporcionalmente,
  preservando os nomes completos.
- A linha seguinte apresenta o contador a esquerda e
  o conjunto completo de ordenacao a direita.
- O conjunto de ordenacao inclui label, select e botoes
  de visualizacao em grade e lista.
- Manter espacamento vertical compacto entre chips,
  controles e cards.
- Em mobile, permitir reorganizacao sem overflow.
- Preservar as funcionalidades e a responsividade.

**Paginacao compartilhada no catalogo de Produtos**

- O catalogo utiliza `criarPaginacao()` de `js/componentes.js`.
- Os botoes gerados utilizam `.paginacao__botao` e
  `.paginacao__botao--seta`.
- As classes legadas `.btn-pagina` e suas variantes
  nao integram a renderizacao atual.
- O catalogo utiliza `.paginacao--centro` para centralizar
  a lista, preservando os controles compartilhados.
- Dimensoes, cores, raios e espacamentos dos botoes
  pertencem ao design system.
- A remocao nao altera o calculo de paginas,
  a navegacao ou os estados de desabilitado.

### 5.9 Paginação — `.paginacao`

`<nav aria-label="Paginação">` > lista de botões 40×40: setas (`chevron-left/right`) com fundo `--cor-superficie-forte`, números sem borda (painéis: com borda), atual = fundo `--cor-primaria` + texto branco + `aria-current="page"`. Reticências `…` como `<span>`. Gerada por `criarPaginacao(atual, total)`.

### 5.10 Tabela — `.tabela`

`<div class="tabela-container">` (borda + raio + `overflow: hidden`) > `<table class="tabela">` com `<caption class="visualmente-oculto">`, `<thead>` fundo `--cor-superficie-forte`, linhas separadas por borda. Primeira coluna com miniatura/avatar + texto em negrito. Coluna "Ações" com botões `.btn--secundario` pequenos ou `.btn--icone`.
**Abaixo de 1024px**: `thead` oculto visualmente; cada `tr` vira um card; cada `td` mostra seu rótulo via `td::before { content: attr(data-rotulo) }`. Por isso **todo `td` precisa de `data-rotulo`**.

### 5.11 Aviso / dica — `.aviso`

Caixa `--cor-superficie-forte`, raio `--raio-medio`, ícone `lucide:info` grande · divisória · título em negrito + texto. Pode ter um botão à direita ("Gerenciar cadastros →"). Usar `<aside class="aviso">` quando for conteúdo complementar.

### 5.12 Upload de imagens — `.upload`

Área tracejada (`border: 2px dashed var(--cor-borda)`) com ícone `lucide:image-plus`, título, instrução e chip "Até 8 fotos • JPG, PNG • Máx. 10 MB". É um `<label>` envolvendo `<input type="file" multiple accept="image/png, image/jpeg" class="visualmente-oculto">`. Miniaturas 1:1 abaixo, com botão × no canto e selo "★ Capa" na primeira. Hover/arrastar sobre: borda forte + fundo `--cor-superficie`.

### 5.13 Pré-visualização do perfil — `.previa-perfil`

Card de superfície turquesa suave com cabeçalho (olho + "Pré-visualização do perfil público"), contendo uma miniatura do card público (avatar, nome, chip, técnicas, bio, botão "Saber mais"). Atualiza em tempo real enquanto o artesão digita (função `atualizarPrevia`). Some abaixo de 1024px (vai para o fim do formulário).

---

## 6. Ícones — Iconify

**Biblioteca:** [`iconify-icon` 2.3.0](https://iconify.design/docs/iconify-icon/) via CDN jsDelivr, carregada no `index.html`.
**Justificativa:** os wireframes usam ~50 ícones de linha. O Iconify fornece um *web component* leve (~10 KB) que baixa sob demanda só os ícones usados, sem build e sem framework, mantendo o HTML válido (elemento customizado). Alternativa (SVGs copiados à mão) aumentaria o HTML e dificultaria trocar o estilo depois.

Uso: `<iconify-icon icon="lucide:house" aria-hidden="true"></iconify-icon>`. Ícone decorativo → `aria-hidden="true"`; botão só-ícone → `aria-label` no **botão**. Tamanho **só via `font-size`** no CSS (o SVG interno mede `1em`; `width`/`height` no elemento não escalam o ícone). Coleção padrão: **Lucide** (traço 2px, igual ao Figma). Exceção: WhatsApp → `mdi:whatsapp`.

| Conceito | Ícone | | Conceito | Ícone |
|---|---|---|---|---|
| Início | `lucide:house` | | Notificações | `lucide:bell` |
| Usuário / Entrar / Artesão | `lucide:user` | | Sair | `lucide:log-out` |
| Artesãos / grupos / pessoas | `lucide:user` | | Voltar ao portal | `lucide:external-link` |
| Cadastrar artesão | `lucide:user` | | Novo / adicionar | `lucide:square-plus` / `lucide:plus` |
| Trabalhos pendentes | `lucide:file-text` | | Meus trabalhos | `lucide:layers` |
| Publicações / Status | `lucide:chart-no-axes-column` | | Configurações | `lucide:settings` |
| Produtos | `lucide:shopping-bag` | | Ideias / Saberes | `lucide:lightbulb` |
| O Liceu | `lucide:landmark` | | Local | `lucide:map-pin` |
| Filtrar | `lucide:sliders-horizontal` | | Busca | `lucide:search` |
| Grade / Lista | `lucide:layout-grid` / `lucide:list` | | Setas | `lucide:chevron-left/right/down`, `lucide:arrow-right` |
| Ver | `lucide:eye` | | Ocultar | `lucide:eye-off` |
| Editar | `lucide:pencil` | | Excluir | `lucide:trash-2` |
| Mais ações | `lucide:ellipsis` | | Abrir / analisar | `lucide:external-link` |
| Aguardando | `lucide:hourglass` | | Data | `lucide:calendar` |
| Tags / categoria | `lucide:tag` | | Info | `lucide:info` |
| Cadeado | `lucide:lock` | | Telefone | `lucide:phone` |
| E-mail | `lucide:mail` | | Instagram | `lucide:instagram` |
| WhatsApp | `mdi:whatsapp` | | Câmera | `lucide:camera` |
| Imagem + | `lucide:image-plus` | | Enviar | `lucide:send` |
| Destaque | `lucide:star` | | Chave | `lucide:key-round` |
| Ordenar | `lucide:arrow-up-down` | | Fechar | `lucide:circle-x` (modal), `lucide:x` (chip) |
| Menu (hambúrguer) | `lucide:menu` | | Rascunho | `lucide:file` |
| Empreendimento | `lucide:store` | | | |

As referências legadas desses conceitos são normalizadas em `js/componentes.js`: `icone()` cobre conteúdo gerado por JavaScript e `padronizarIcones()` é chamada pelo roteador para as parciais HTML. Novos usos devem empregar diretamente os identificadores aprovados acima.

---

## 7. Imagens e placeholders

Todas as imagens ficam em `assets/img/` com **nomes fixos**. Os arquivos atuais são placeholders cinza com o nome desenhado. **Para trocar, basta salvar a foto real com o mesmo nome e extensão** — nada no código muda. Lista completa e tamanhos recomendados em [`assets/img/LEIAME.md`](../assets/img/LEIAME.md).

- Formato `.jpg` (fotos). Logo continua `assets/logo.png`.
- Todo `<img>` tem `alt` descritivo, `width`/`height` (evita salto de layout) e `loading="lazy"` (exceto o primeiro slide).
- Fundo `--cor-placeholder` em `img` para não "piscar" branco enquanto carrega.
- Imagens de dados (artesãos, trabalhos) vêm dos JSON em `data/` — o caminho está no próprio registro.

---

## 8. Popups e menus de ação (guia para as próximas telas)

Todos os popups usam o elemento nativo **`<dialog>`** aberto com `showModal()` (foco preso, `Esc` fecha, `::backdrop` escurece). Funções `abrirModal(id)` / `fecharModal(id)` em [`js/componentes.js`](../js/componentes.js). Clique no backdrop também fecha.

### 8.1 Anatomia — `.modal`

```
┌ dialog.modal (raio 24px, padding 48px desktop / 24px mobile) ───┐
│                                                       (ⓧ)      │ ← button.modal__fechar, lucide:circle-x 32px, aria-label="Fechar"
│ h2.modal__titulo                                               │
│ p.modal__descricao (opcional)                                  │
│ ── conteúdo (.modal__corpo) ───────────────────────────────── │
│                                                                │
│ ── .modal__acoes (alinhado à direita) ──── [Cancelar] [Primária]│
└────────────────────────────────────────────────────────────────┘
```

- `aria-labelledby` aponta para o `h2`. Larguras: `.modal--pequeno` 440px (confirmação), `.modal--medio` 640px (formulário), `.modal--grande` 880px (detalhes/perfil). No smartphone: `width: 100%`, colado embaixo (*bottom sheet*), raio só no topo.
- Entrada: fade + `translateY(16px → 0)` em 200ms; backdrop com fade.
- Divisória interna: `hr` 1px `--cor-borda-forte` (como no popup do artesão).

### 8.2 Tipos

| Tipo | Quando | Ações |
|---|---|---|
| **Detalhe** (`.modal--grande`) | Mostrar informação (perfil do artesão, ver trabalho, ver publicação) | Só fechar; links de contato |
| **Formulário** (`.modal--medio`) | Criar/editar algo pequeno (adicionar categoria, alterar senha, editar artesão rápido) | `Cancelar` (link) + primário ("Salvar") |
| **Confirmação** (`.modal--pequeno`) | Antes de ação irreversível ou relevante | `Cancelar` + primário. Se destrutiva: título em pergunta ("Excluir publicação?"), texto dizendo a consequência, botão `.btn--perigo` com o verbo ("Excluir") |
| **Menu de ações** (popover `.menu-acoes`) | Botão `⋯` das tabelas/cards | Lista de `button` em `ul`, `role="menu"` não é necessário; fecha com `Esc`/clique fora. Itens destrutivos por último, separados por `hr` |
| **Dropdown** do topo | Sino (notificações) e avatar (menu do usuário) | Popover alinhado à direita, largura 320px |

### 8.3 Popups a desenhar (inventário a partir das telas)

| Origem | Popup | Tipo |
|---|---|---|
| Portal › Artesãos › "Ver perfil" | Perfil do artesão | Detalhe — **já desenhado e implementado** |
| Portal › Artesãos › "Filtrar" | Painel de filtros (categorias, técnicas, cidade) | Formulário (gaveta lateral no mobile) |
| Portal › Home › card de produto | Detalhe do produto | Detalhe |
| Liceu › "Analisar" | Analisar trabalho: imagens, dados, `Aprovar` / `Rejeitar` (rejeitar pede motivo) | Detalhe + formulário |
| Liceu › Artesãos › "Ver perfil" / "Editar" / `⋯` | Perfil, edição rápida, menu (Ativar/Desativar, Redefinir senha, Excluir) | Detalhe / Formulário / Menu |
| Liceu › Publicações › olho / lápis / olho-cortado / lixeira | Ver, editar, ocultar (confirmação), excluir (confirmação destrutiva) | vários |
| Liceu › Publicações › "Nova publicação" | Escolher trabalho aprovado para destacar | Formulário |
| Liceu › Configurações › categorias/técnicas | Adicionar categoria, adicionar técnica, gerenciar listas | Formulário |
| Liceu › Configurações › segurança | Alterar senha, gerenciar permissões | Formulário |
| Artesão › Meus trabalhos › `⋯` | Menu: Ver no portal, Duplicar, Enviar para análise, Excluir | Menu |
| Artesão › "Ver motivo" | Motivo da rejeição + botão "Editar e reenviar" | Detalhe |
| Artesão › Novo trabalho › "Enviar para análise" | Confirmação de envio | Confirmação |
| Ambos › "Cancelar" em formulário alterado | "Descartar alterações?" | Confirmação |
| Ambos › "Sair" | "Deseja sair do painel?" | Confirmação |
| Ambos › sino / avatar | Notificações / menu do usuário | Dropdown |

### 8.4 Feedback

Após salvar/aprovar/excluir: **toast** (`.aviso-flutuante`, `role="status"`) no canto inferior direito por 4s. Função `mostrarAviso(mensagem)` (stub).

---

## 9. Animações (multimídia)

| Elemento | Animação |
|---|---|
| Indicadores da navegação | expansão do centro (`scaleX`, 200ms) no hover/foco; linha escura persistente na página ativa |
| Carrossel | slide horizontal 500ms + autoplay |
| Cards clicáveis | eleva 3px + sombra no hover |
| Botões | eleva 1px no hover; ícone de seta anda 3px para a direita em `.link-seta:hover` |
| Troca de página | `#conteudo` entra com fade + `translateY(8px)` (classe `.entrando`, 250ms) |
| Modal | fade + subida 16px |
| Gaveta (menu mobile) | `transform: translateX(-100%) → 0`, 250ms |

Sempre respeitar `@media (prefers-reduced-motion: reduce)` (desliga transições e autoplay).

Vídeo: seção "O Liceu em vídeo" na Home com `<iframe>` do YouTube (`youtube-nocookie.com`, `loading="lazy"`, `title` descritivo) em proporção 16:9. Trocar o ID em `pages/inicio.html`.

---

## 10. Arquitetura de código

### 10.1 Arquivos

```
index.html                    casca: <head>, cabeçalho/rodapé do portal, #raiz
css/global.css                tokens, reset, tipografia, utilitários
css/componentes.css           tudo da §5 e §8
css/layout.css                cabeçalho/rodapé do portal, casca do painel, gavetas
                              (ordem de carga: global → componentes → layout → paginas)
css/paginas/<pagina>.css      estilos exclusivos de uma página (dono: branch da página)
js/router.js                  ponto de entrada; roteia, monta layout, chama a página
js/rotas.js                   tabela de rotas (caminho, arquivo, layout, menu, ícone, módulo)
js/layout.js                  menu do portal, casca do painel, gavetas mobile
js/componentes.js             carrossel, modal, status, paginação, cards reutilizáveis
js/dados.js                   leitura dos JSON + sessão em localStorage
js/paginas/<pagina>.js        export function iniciar…(raiz) de cada tela
pages/<rota>.html             parciais do portal
pages/painel-liceu/*.html     abas da Área do Liceu
pages/painel-artesao/*.html   abas da Área do Artesão
pages/layouts/painel.html     casca dos painéis
data/*.json                   dados simulados
assets/img/                   imagens (placeholders trocáveis)
```

### 10.2 Contrato de página

1. A parcial em `pages/` é um **fragmento** (sem `<html>`, `<head>`, `<body>`, `<main>`), começando por `<section>`/`<header>`. O `<main id="conteudo">` é da casca.
2. Exatamente **um `h1`** por parcial.
3. Se a página precisa de JS, exporta `iniciar<Nome>(raiz)` em `js/paginas/<pagina>.js`, já ligado em `js/rotas.js` pela branch de base. A função recebe o elemento `main` e só busca elementos dentro dele.
4. Conteúdo dinâmico (listas de cards, linhas de tabela) é gerado a partir de `data/*.json` via `js/dados.js`. A parcial traz o **contêiner vazio** com um comentário dizendo o que é preenchido.
5. Funções ainda não implementadas: declaradas, com JSDoc e `// A IMPLEMENTAR:` — o JSLint rejeita a palavra "TODO" (permitido pela disciplina).
6. **Navegação rápida:** a função `iniciar` captura um elemento da parcial ANTES do primeiro `await` (ex.: `const marco = raiz.firstElementChild;`) e, depois de cada `await` e antes de mostrar erro, aborta se `!marco.isConnected` (o usuário já trocou de página).

### 10.3 Regras do JSLint (as que mais pegam)

- Primeira linha: `/*jslint browser */`.
- **Aspas duplas** sempre; template string só quando houver interpolação.
- Indentação de **4 espaços**; linhas com no máximo **80 caracteres**.
- Chaves de objetos literais em **ordem alfabética** (`{arquivo, caminho, layout}`).
- `const`/`let` (nunca `var`); sem `++`/`--` (use `+= 1`); sem `for` (use `forEach`/`map`/`filter`/`reduce`); sem `this`.
- Parâmetro não usado se chama `ignore`; `catch (ignore)`.
- Expressão em várias linhas (concatenação, ternário) fica **entre parênteses**, com o operador no início da linha:

  ```js
  return (
      "<p class=\"meta\">"
      + escaparHtml(texto)
      + "</p>"
  );
  const rotulo = (
      ativo
      ? "Ativo"
      : "Inativo"
  );
  ```
- Chaves de objeto com aspas são ordenadas pelo texto bruto (`"&"` vem antes de `"\""`).
- Nomes exportados também em ordem alfabética (`export {PAINEIS, ROTAS, ROTA_NAO_ENCONTRADA}`).
- Não use a palavra "TODO" em comentários (o JSLint acusa); use `// A IMPLEMENTAR:`.
- Sem `==`; sem variáveis ou funções não usadas.

### 10.4 CSS

- O atributo HTML `hidden` controla estados condicionais e prevalece sobre `display` de componentes, incluindo flex/grid. Remova o atributo para exibir; não substitua essa regra em CSS de páginas.

- Mobile-first; só `min-width` nas media queries (§3).
- Nada de cor/fonte/raio fora dos tokens.
- Seletores por classe; sem `id` no CSS; profundidade máxima 3.
- Página não estiliza componente global — se precisar de variação, cria modificador em `componentes.css` (na branch de base) ou classe própria prefixada com o nome da página (`.inicio-hero`).

---

## 11. Checklist de entrega de cada página

- [ ] Parcial passa no Nu HTML Checker embrulhada no `index.html` (sem erros).
- [ ] CSS passa no validador CSS.
- [ ] JS passa no JSLint.
- [ ] Testada em 375px, 768px e 1280px (sem rolagem horizontal).
- [ ] Um `h1`; hierarquia de títulos sem pulos; todos os `img` com `alt`.
- [ ] Navegável por teclado (foco visível, `Esc` fecha modal/gaveta).
- [ ] Usa só tokens e componentes deste guia.
- [ ] Imagens apontam para os caminhos de `assets/img/LEIAME.md`.

### Detalhe público de produto

A composição segue a página Produto Individual dos wireframes: galeria com favorito e miniaturas ao lado das informações, faixa com produtor e técnica, e produtos relacionados. A faixa usa alinhamento superior entre os títulos; o resumo da técnica combina imagem e texto, empilhados no smartphone. `css/paginas/produto.css` define apenas essa composição usando tokens; carrossel, card, favoritos e botões permanecem compartilhados.

O catálogo em modo lista limita a imagem a 32% do card (máximo 180px), mantém altura natural para não cortar título/autor/preço e reserva espaço para o favorito. Seus controles podem quebrar em linhas no mobile. Essas regras se restringem ao catálogo; tabelas, paginação administrativa e cards em grade mantêm suas dimensões.

O favorito ativo usa o mesmo ícone Lucide do estado inativo, com `aria-pressed="true"`, fundo primário e ícone invertido. O contraste do botão comunica o estado sem recorrer a outra coleção de ícones.

## Padrões transversais de ações e detalhes

Ações com texto usam ícone à esquerda (18px, `--tamanho-icone-acao`), seguido do verbo explícito. Status usam ícone de 16px (`--tamanho-icone-status`) e texto; nunca são botões, mesmo para rascunhos. Botões somente com ícone têm alvo de 44×44px (`--alvo-acao`), `aria-label`, `title` e foco nativo. Links de navegação editorial e chips de categoria mantêm só texto quando outro ícone não acrescenta significado. Controles de galeria e paginação mantêm setas; os nomes e números não mudam.

A coleção da interface é Lucide, por meio do Iconify já instalado. Referências antigas a outras coleções são normalizadas por `padronizarIcones`; WhatsApp preserva o símbolo de marca já adotado, sem alternativa Lucide. Não introduzir outra biblioteca.

| Ação | Ícone Lucide |
|---|---|
| Editar / corrigir | `pencil` |
| Visualizar / ver perfil | `eye` |
| Ocultar | `eye-off` |
| Excluir | `trash-2` |
| Duplicar | `copy` |
| Enviar / reenviar | `send` |
| Aprovar / republicar | `circle-check` |
| Rejeitar / confirmar rejeição | `circle-x` |
| Salvar / concluir cadastro | `check` |
| Cancelar / descartar / limpar | `x` |
| Adicionar / novo | `plus` |
| Voltar | `arrow-left` |
| Abrir no portal | `external-link` |
| Filtrar | `sliders-horizontal` |
| Analisar trabalho | `file-search` |
| Redefinir senha | `key-round` |

`conteudoAcao(texto)` gera ícone e texto escapado pelo registro semântico. `prepararAcoes(raiz)` aplica o mesmo registro ao conteúdo legado, sem substituir eventos nem alterar nomes/ações, e acrescenta títulos acessíveis aos controles compactos. Deve ser chamado após inserir conteúdo dinâmico. Ações destrutivas mantêm ícone e verbo explícito, variante de perigo e confirmação; não dependem só da cor.

Modais de detalhe/análise compartilham `criarDetalhesTrabalho`: imagem principal com proporção 4:3 e demais fotos abaixo; artesão, status, chips e descrição agrupados; materiais, dimensões e preço em lista de descrição semântica. Duas colunas quando houver espaço (a partir de 600px), uma no smartphone. A rejeição aparece em campo separado; o rodapé continua com ações identificadas. Modais pequenos atendem a confirmações; menus de várias ações usam grade responsiva. A anatomia global de título, botão fechar, padding e backdrop permanece compartilhada.

Filtros compactos usam rótulos curtos (“Status”, “Categoria/Técnica”, “Ordenar”) e selects de largura natural, sem fontes menores para forçar encaixe. Busca principal pode ocupar uma linha separada. Acima de 600px, grupos permanecem em linha enquanto couberem e quebram como unidades, sem separadores verticais; no smartphone os grupos reorganizam-se sem overflow. Chips de opções podem quebrar naturalmente.

Listas de taxonomias usam seções `.lista-taxonomias` dentro do padding do card: “Categorias cadastradas” e “Técnicas cadastradas”, cada uma com `criarChips`. Os chips são informação estática, não controles de edição. Configurações futuras continuam desabilitadas.

A preparação de ações é idempotente: não reaplica atributos de ícones já corretos. Os ícones da parcial são preparados imediatamente (`noobserver`), inclusive antes de mudar a página de uma listagem, para evitar controles temporariamente vazios. Remoção de chip/miniatura mantém o × convencional. Ações em cards preservam a área mínima de toque, mesmo em blocos de estado compactos.

Os cabeçalhos de configurações reutilizam `.bloco-form__cabecalho--secao`, com wrapper de ícone e texto. No grid desktop, a altura mínima comum acomoda as descrições sem deslocar o início do conteúdo entre cards vizinhos; em telas menores, a altura volta a ser natural.

Não reposicione um `iconify-icon` conectado apenas para remover espaços em branco. O preparador mantém nós já corretos; quando realmente precisa trocar um ícone de posição, cria uma instância nova. Isso evita estado interno de SVG inválido ao reconectar o custom element.

Ícones de status e envio não são ocultados em cards compactos no desktop. O ajuste de densidade acontece por quebra de linha e altura natural, não por remoção de informação. Em uma fileira com apenas “Mais ações”, o botão permanece quadrado; somente ações com texto podem crescer para preencher a largura.


## Validação final do portal público (18/11/2026)

Referência visual: `../wireframes.pdf`, dez páginas (Login, Início,
Catálogo, Produto, Artesãos, Perfil, Saberes, Liceu, Contato e Sobre).
A referência orienta a composição; dados e textos existentes prevalecem
sobre conteúdo ilustrativo. Header, footer, tokens e cards aprovados
são preservados. A seção de vídeo e a linha do tempo são requisitos
existentes, mesmo quando ampliam a altura em relação ao wireframe.

- Catálogo: grade de uma coluna no smartphone, duas no tablet e quatro
  no desktop, conforme §3 e o wireframe. Usar `minmax(0, 1fr)` e o
  espaçamento existente `--espaco-4`, sem mudar o card compartilhado.
  O modo lista continua com uma coluna e sua imagem limitada.
- Perfil do artesão: nomes, empreendimento, cidade e biografia aceitam
  palavras longas com `overflow-wrap: anywhere`. A informação ocupa
  o espaço restante sem reduzir a foto; em tablet/desktop, reservar
  a coluna da foto com base no limite já aprovado de 280px/38%.
  Links de contato e seus itens podem encolher e quebrar texto;
  o ícone mantém seu tamanho. Chips podem quebrar dentro do perfil.
  Essas regras ficam em `css/paginas/artesaos.css`.
- Não ocultar overflow para mascarar conteúdo cortado. Validar largura
  interna do diálogo, foto, contatos e fechamento por teclado nos
  tamanhos 1280px, 768px e 375px.
- Fotos institucionais e dos cinco integrantes seguem pendentes;
  os recursos disponíveis são placeholders, conforme o inventário.


## Correções de UI dos painéis e produto (18/11/2026)

- O foco programático no `main.painel__principal` não desenha contorno ao
  redor de toda a página; controles internos continuam com foco visível.
  O footer dos painéis não tem borda superior; o footer público é preservado.
- Cards de trabalhos organizam título/metadados, divisória, estado e ações
  em faixas comuns. Rascunhos mantêm Enviar e Editar; trabalhos em análise
  informam que a edição está indisponível. Ações só com ícone têm alvo de
  44px, nome acessível e title. Não esconder permissões ou status.
- Menus de ações usam uma coluna no smartphone, duas no tablet e botões
  proporcionais na mesma linha no desktop (1024px), sem reduzir fontes.
- Cabeçalho de Meus trabalhos: título e cadastro no cabeçalho; busca em
  linha própria; status/categoria/ordenação em grupos; contador e modo na
  linha anterior aos cards. Espaçamentos seguem tokens.
- Status das publicações usa ações de ícone com nome/title; espera segue
  desabilitada. Editar, ver motivo e abrir no portal preservam funções.
- Detalhes de trabalho têm galeria limitada e metadados em grade em telas
  amplas; a análise usa largura grande e espaços de 16/24px, evitando
  uma coluna excessivamente vertical. Motivo de rejeição tem Cancelar;
  aprovação exige confirmação explícita antes de persistir.
- Seleção múltipla usa fieldset/legend e checkboxes nativos com alvos de
  44px, borda/raio/tokens e resumo vivo da seleção. O select de origem
  continua sincronizado para preservar contrato, validação e persistência.
  Aplicar `prepararMultisselecao` a todos os selects múltiplos dos diálogos.
  Os formulários que já usam select e chips mantêm esse padrão aprovado.
- Produto: galeria e resumo alinhados ao topo; miniaturas proporcionais
  com seleção anunciada; materiais (`layers`), técnica (`hammer`) e
  dimensões (`ruler`) em lista de descrição com ícones Lucide; descrição
  separada por borda, produtor com foto e texto, técnica e relacionados
  preservados. Preço numérico usa a escala de título de seção existente;
  a mensagem de preço sob consulta usa texto de apoio e cor suave.
- Aviso do MVP tem `--espaco-5` de distância do formulário de configurações.


## Revisão complementar: filtros, produto e conta

Referências: `../liceu_capturas_correcoes_ui_ux.pdf` (capturas atuais e
Figma) e página Produto Individual de `../wireframes.pdf`.

- Publicações, Pendentes e Artesãos usam `.liceu-filtros`: busca com
  largura integral na primeira linha, controles na segunda, sem caixa
  cinza ou padding externo exclusivos. `.liceu-filtros__controles` usa
  grade proporcional com os tokens de espaço. Labels, selects e busca
  reutilizam `.campo` e `.busca`. Filtragem é automática em input/change;
  submit por Enter permanece suportado no formulário de Publicações.
- Limpar filtros combina ícone e texto com inline-flex, centralização
  nos dois eixos, gap de `--espaco-2` e ícone de `--tamanho-icone-acao`.
  Não aplicar offsets ou translação para alinhar o conteúdo.
- Produto: título usa `--fonte-h2`, atributos são três blocos com ícone,
  rótulo e valor e divisórias verticais discretas a partir de 600px;
  no celular, as divisórias são horizontais. A descrição mantém sua borda.
  Galeria 16:9 e miniaturas preservam os estados acessíveis existentes.
- A faixa de contexto reúne produtor e técnica em colunas iguais no
  desktop, separadas por borda vertical. Abaixo de 1024px, ficam empilhados
  com divisão horizontal. A foto do produtor e seu texto ficam lado a
  lado a partir de 600px; botões têm largura natural e podem quebrar texto.
  A imagem da técnica usa cerca de um terço da coluna e não comprime o
  texto; seu nome aparece em título próprio.
- Relacionados mantêm as colunas 1/2/4 e o gap compartilhado. Com três
  produtos no desktop, a grade é centralizada com a largura equivalente
  a três cards da grade de quatro. Não fabricar registros para completar.
- Minha conta reutiliza `.modal__acoes--grade` e modal médio: uma coluna
  no smartphone, duas no tablet e três ações proporcionais no desktop.
  Links e confirmação de logout mantêm seus comportamentos.
- Footer compartilhado: o item Ajuda (`#/contato`) é renderizado apenas
  na Área do Artesão. Na Área do Liceu, o item é removido antes da inserção
  da casca; Sobre e copyright permanecem. Não duplicar o footer, esconder
  apenas por CSS nem alterar o footer público.


### Refinamento dos botoes secundarios e seletores

- Botoes secundarios utilizam superficie suave e borda discreta.
- Menus personalizados utilizam raio medio.
- Hover e selecao empregam superficies suaves.
- A selecao continua indicada por peso tipografico.
- Estados de foco por teclado devem permanecer visiveis.
- As dimensoes minimas de interacao sao preservadas.
- Os ajustes pertencem aos componentes compartilhados.

## Rodada adicional: seletores, validação, cards e favoritos

Referência: `../capturas_ajustes_ui_liceu_rodada_atual.pdf`.

- Seleção simples: `js/seletores.js` melhora progressivamente os selects
  através de `prepararSeletores`, chamado pelo preparador de ações. O select
  permanece no formulário como fonte de valor, eventos e validade. A interface
  é uma combobox somente de seleção com listbox em popover na camada superior.
  Não cortar o valor selecionado: permitir quebra e reservar largura. Menus
  usam tokens, opções com alvo de 44px, grupos, hover/seleção/foco e rolagem
  interna de até 320px. Posicionar acima ou abaixo conforme a viewport.
- Teclado dos seletores: setas, Home/End e PageUp/PageDown navegam; Enter,
  Espaço ou Tab confirmam; Escape cancela a navegação sem mudar o valor e
  preserva o diálogo. Digitação busca opções. Desabilitados não abrem.
  Eventos input/change, reset, opções dinâmicas, rótulos e erros são
  sincronizados. Navegadores sem Popover API mantêm o select nativo.
  Referência semântica: [WAI-ARIA APG, select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/).
- Seleção múltipla conserva fieldset/checkboxes ou select+chips já aprovados.
  Não substituir por uma combobox simples nem perder valores persistidos.
- Obrigatórios: Nome completo e E-mail exibem asterisco, required e mensagens
  claras em região de alerta. Validar espaços no nome e formato do e-mail;
  unicidade e atualização de credenciais permanecem na camada de dados.
- Cards do artesão: remover a borda horizontal exclusiva do bloco de ações,
  título sem altura artificial, espaçamentos com tokens e ações alinhadas na
  base. Status usa altura de 32px e ícone de 16px. O motivo tem ícone de 16px
  em alvo transparente de 44px, alinhado ao chip; não diminuir o alvo.
- Status das publicações: busca e controles com áreas próprias no desktop,
  busca acima no tablet e tudo empilhado no celular. Reservar pelo menos
  12rem aos controles quando houver espaço e não ocultar seus valores.
- Filtros administrativos: rótulos e controles separados por espaco-2 e
  grade proporcional, sem compartilhar a linha da busca. Usar a combobox
  também nos filtros e formulários dos modais.
- Contexto do produto: duas colunas equivalentes com divisória no centro e
  títulos alinhados. Mídia de 128px no tablet/desktop (avatar circular e
  técnica retangular); textos flexíveis e botões com mesma anatomia/altura,
  na base. Biografias extensas têm região de rolagem por teclado, sem perder
  texto. No celular, preservar empilhamento e divisão horizontal.
- Modais: manter variantes pequena/média/grande, título com quebra segura,
  ações com texto completo e rolagem interna. Modal editorial de Saberes
  usa corpo e rodapé próprios, gap de 24px e botão com largura natural,
  altura mínima de 44px e texto que pode quebrar no smartphone.
- Somente favoritos: chip com coração e aria-pressed no catálogo público.
  Combinar com filtros, busca, ordenação e paginação; desfavoritar atualiza
  a lista. O estado vazio explica como exibir todos. Usar a chave existente
  liceu:favoritos; não adicionar filtros fictícios a Artesãos/Saberes nem
  ferramentas de favoritos nos painéis de gestão.


### Largura dos filtros do painel do artesao

- A busca ocupa uma linha propria.
- Em Meus trabalhos, os tres filtros dividem igualmente a largura no desktop.
- Em Status das Publicacoes, os dois filtros dividem igualmente a largura.
- Campos e seletores personalizados ocupam 100% da coluna.
- Em telas menores, preservar organizacao responsiva sem overflow.

## Identidade visual institucional — Liceu de Ofícios Criativos

### Referências e escopo

- Instagram: https://www.instagram.com/liceudeoficioscriativos/
- Materiais institucionais divulgados pela Prefeitura de Curitiba.
- Paleta proposta para o projeto acadêmico, não oficial.
- Publicações atuais do Instagram não foram verificadas integralmente.

### Conceito

Criatividade, cultura, acolhimento, inovação e valorização
do trabalho artesanal.

A comunicação visual combina cores criativas, superfícies claras,
elementos suavemente arredondados e fotografias que valorizam
os artesãos e suas produções.

### Paleta digital proposta

| Papel | Hex |
|---|---|
| Turquesa de marca (proposta) | #20A8A6 |
| Ação primária | #0C7774 |
| Hover primário | #095E5C |
| Amarelo criativo | #FFC928 |
| Rosa criativo | #E73571 |
| Petróleo | #183E45 |
| Off-white | #F8F7F3 |
| Superfície suave | #EAF5F3 |
| Borda suave | #C7DAD6 |

### Regras de aplicação

1. Usar turquesa profundo nas ações primárias.
2. Manter botões secundários discretos.
3. Reservar amarelo e rosa para destaques pontuais.
4. Evitar grandes áreas funcionais com cores saturadas.
5. Preservar a tipografia Inter.
6. Manter cantos suaves em campos, botões, cards e modais.
7. Reutilizar tokens globais em vez de repetir cores hexadecimais.
8. Aplicar a mesma identidade nas áreas pública, do artesão e do Liceu.
9. Manter a diferenciação semântica de erro, alerta e sucesso.
10. Garantir contraste WCAG AA e foco visível.
11. Não alterar os fluxos de autenticação, publicação e favoritos.
12. Preservar as correções de UI/UX já aprovadas.

### Herança de estilos

A fonte central da identidade cromática é `css/global.css`.

Atualizações em `docs/DESIGN.md` documentam o padrão, mas
não modificam automaticamente os componentes.

Componentes com cores fixas devem ser migrados cuidadosamente
para os tokens globais após validação visual.

### Recursos visuais

Utilizar fotografias e logotipos institucionais autorizados.
Manter os placeholders existentes enquanto não houver
arquivos definitivos.

## Migração integral da identidade visual

### Status da migração

A paleta cinza anterior era provisória, utilizada apenas
durante a construção e validação da interface.

A interpretação digital proposta para o portal é
fundamentada na paleta criativa documentada anteriormente.

### Regra obrigatória

Todos os componentes devem utilizar os tokens semânticos
do design system, incluindo:

- Cabeçalho público e cabeçalhos dos painéis.
- Barra lateral, menus e estados ativos.
- Rodapé e navegação institucional.
- Botões primários, secundários e de ação.
- Campos, buscas, seletores e filtros.
- Cards, tabelas, divisórias e contêineres.
- Chips, badges, indicadores e estatísticas.
- Modais, confirmações, alertas e feedbacks.
- Links, ícones, estados hover e foco.
- Paginação, favoritos e controles de visualização.

### Hierarquia cromática

- Turquesa profundo: ações principais e interações.
- Turquesa suave: superfícies e seleção.
- Petróleo: texto e contraste editorial.
- Off-white: fundos alternados.
- Amarelo e rosa: detalhes editoriais e acentos.
- Cores semânticas: sucesso, alerta e erro.

### Diretrizes

- Branco pode permanecer como superfície neutra.
- Cinzas não são proibidos por natureza, mas nenhum
  cinza provisório deve permanecer por falta de migração.
- Não aplicar cores saturadas indiscriminadamente.
- Não usar exclusivamente a cor para comunicar estados.
- Manter contraste e foco acessíveis.
- Preservar dimensões, layouts e fluxos aprovados.
- Não substituir imagens ou logotipos sem autorização.
- Evitar novos valores hexadecimais nos CSS de páginas.
- Priorizar variáveis existentes ou criar novos tokens
  semânticos quando necessário.

### Estratégia de implementação

1. Migrar tokens globais.
2. Auditar componentes e CSS específicos.
3. Migrar cores fixas conforme a função de cada elemento.
4. Validar visualmente portal público e os dois painéis.
5. Verificar responsividade, acessibilidade e regressões.

A auditoria deve distinguir cores estruturais, estados
semânticos e recursos decorativos. Não substituir cores
automaticamente apenas por semelhança hexadecimal.


## Identidade cromática aplicada — novembro de 2026

### Referências e limites

- Símbolo existente: `assets/logo.png`, com três áreas curvas de turquesa,
  amarelo e rosa. Preservar integralmente a imagem e suas proporções.
- Material oficial examinado: [Prefeitura de Curitiba, aniversário do Liceu,
  07/11/2024](https://www.curitiba.pr.gov.br/noticias/liceu-de-oficios-criativos-comemora-5-anos-de-apoio-aos-artesaos-de-curitiba/74867),
  incluindo a fotografia da fachada com o mesmo símbolo tricolor.
- O Instagram institucional foi consultado, mas não pôde ser carregado no
  ambiente de execução. Não foi encontrado/validado manual de cores oficial.
- Os códigos abaixo são uma interpretação digital da paleta proposta pelo
  projeto; não são apresentados como hexadecimais oficiais.

### Paleta final e combinações

| Cor | Valor | Uso real |
|---|---|---|
| Turquesa | `#20A8A6` | Grafismo tricolor e acentos de cards; sem texto branco pequeno |
| Turquesa profundo | `#0C7774` | Botão primário e seleção; texto branco |
| Turquesa escuro | `#095E5C` | Header, hover primário e links; branco no header |
| Amarelo | `#FFC928` | Sidebar ativa, ação editorial, indicadores e estatísticas; texto petróleo |
| Rosa | `#E73571` | Grafismo, detalhes editoriais e acentos decorativos |
| Rosa escuro | `#AD1B50` | Favoritos ativos, foco e links de acento; branco quando preenchido |
| Petróleo | `#183E45` | Texto, sidebar e footer; branco sobre fundos escuros |
| Off-white | `#F8F7F3` | Fundo de páginas; branco reservado a cards, campos, menus e modais |
| Amarelo suave | `#FFF0BD` | Hero, avisos e conteúdo editorial |
| Rosa suave | `#FCE7EF` | Faixas de pessoas, favoritos e contexto do produto |

### Aplicação por componente

- Header turquesa profundo e footer petróleo com faixa tricolor desenhada
  em background (sem acrescentar altura). Links brancos, hover amarelo e
  página ativa preenchida em amarelo com texto petróleo e peso forte, sem
  linha de indicação. A navegação mobile mantém as mesmas combinações.
- Sidebar petróleo: texto claro, hover tonal e item selecionado amarelo com
  texto petróleo. Foco amarelo nas superfícies escuras; não herdar texto
  branco para itens ativos claros.
- Hero público em amarelo suave com grafismos em rosa/turquesa, sem imagens
  novas. Faixas de pessoas/contexto em rosa suave. Botão editorial amarelo;
  botão secundário branco com borda turquesa. Ações principais permanecem
  turquesa, destrutivas usam erro e favoritos usam rosa escuro.
- Cards brancos sobre fundo quente, bordas suaves e acentos sem alterar
  suas dimensões. Estatísticas usam cores conforme papel de total, publicado,
  análise e pendência, identificados pelos ícones semânticos existentes e não
  pela posição do card. Rascunho usa seu par neutro; ícones e rótulos continuam explícitos.
- Tabelas com cabeçalho petróleo e texto branco, corpo branco e hover suave.
  Formulários usam campos brancos e bordas de controle com contraste; menus
  abertos usam hover amarelo suave e seleção turquesa com texto branco.
- Modais brancos recebem faixa tricolor superior sem alteração de padding,
  tamanho ou fluxo. Botão fechar e títulos seguem as cores interativas.
- Estados: publicado/ativo verde, análise/reenviado âmbar, rejeitado/inativo
  rosa escuro e rascunho verde acinzentado. Todos mantêm ícone e texto.
- Desabilitados preservam `disabled`/`aria-disabled` e recebem superfície e
  texto próprios. Foco tem contorno visível; erros não dependem só da borda.
- O cabeçalho do catálogo recebe plano amarelo suave, e o alternador de
  grade/lista usa seleção turquesa. O catálogo funcional (`css/produtos.css`, ausente no worktree de design)
  deve consumir estes mesmos tokens, incluindo busca, filtros e limpeza.
- Preservar HTML, tipografia, medidas, espaçamentos, dados, fotografias e
  placeholders. Grafismos e acentos não recebem eventos de ponteiro.

### Validação cromática

Verificar os pares de texto a 4,5:1, inclusive labels de botões, tabelas,
menus, estados e favoritos. Bordas de controles e indicadores de foco
precisam de 3:1 contra a superfície adjacente. Cores saturadas sem contraste
para texto pequeno ficam restritas a grafismos. Contraste de imagens de
conteúdo/placeholder não é inferido a partir dos tokens.


## Refinamento das superfícies e navegação pública

- O plano principal público usa `--cor-fundo-publico` (amarelo claro,
  `#FFF8E1`) por meio do escopo `.conteudo`. Painéis preservam seu fundo.
  As faixas alternadas usam turquesa suave (`--cor-superficie-forte`),
  substituindo a base bege acinzentada. Faixas editoriais rosa/amarelo
  existentes continuam com seus papéis.
- Atalhos compartilhados `.card-atalho` preservam a anatomia de card:
  superfície branca, borda completa suave, cantos arredondados e sombra
  discreta. Sem faixa superior decorativa. Ícone turquesa, título, descrição
  e seta menor organizam o conteúdo; toda a área permanece clicável.
  Hover/foco reforçam a borda sem deslocar o card. Preservar grade, padding,
  dimensões externas e contorno de foco visível.
- Header e footer usam `aria-current="page"` como fonte do estado ativo:
  preenchimento amarelo, texto petróleo e peso forte. Nenhum pseudo-elemento
  desenha linha de ativo ou hover. No desktop, o destaque do header tem
  44px dentro da barra existente de 64px; no menu móvel ocupa a entrada.
  O footer usa preenchimento e halo de fundo, sem deslocar links vizinhos.
  A faixa tricolor institucional da casca não indica rota e permanece.
- Os links ativos preservam contraste também no hover e no foco; Escape,
  navegação, rotas e marcação dinâmica continuam inalterados.


### Cabeçalho de Produtos em faixa inteira

O fundo editorial de `.catalogo-produto-cabecalho` ocupa a largura inteira
por uma camada decorativa com expansão lateral e recorte vertical. A faixa
começa logo abaixo do header público; o texto e os controles continuam
alinhados à grade limitada do catálogo. A camada não recebe cliques, não
altera a largura do documento e não interfere em filtros ou favoritos.


## Refinamento de chips, artesãos e modal de técnicas

- Chips de assunto usam seis pares de tokens `--cor-chip-…`: turquesa, rosa,
  amarelo, azul, verde e violeta. `corChip` no componente compartilhado associa
  categorias e técnicas a cores estáveis, inclusive em filtros e painéis.
  Texto e fundo têm contraste AA; badges de status conservam sua semântica.
  Seleção usa fundo escuro e peso forte; hover reforça a borda e foco mantém
  o contorno global. Não atribuir cores por posição na lista.
- Cards públicos de artesãos usam borda tricolor completa de 1px, superfície
  branca, raio grande e sombra discreta, reforçada no hover/foco interno, sem
  deslocamento. Avatares circulares têm moldura branca e halo turquesa suave.
  Preservar dimensões, grade/lista, ações e leitura dos nomes.
- O rodapé do modal editorial centraliza a ação de explorar os produtos,
  mantendo largura natural e quebra de texto em telas pequenas.
- PNG transparente institucional atualizado em `assets/logo.png`, fornecido
  pela equipe. Portal, painéis e login utilizam o mesmo arquivo original.


## Padrão compartilhado entre portal e painéis

- `.card` e `.bloco-form` compartilham `--raio-card`, `--borda-card`, superfície
  branca, contorno completo e sombra. Produtos, técnicas, pessoas, trabalhos,
  atalhos e blocos de formulário usam a mesma linguagem visual nos três ambientes.
  Hover/foco reforçam a sombra sem mover ou redimensionar os cards.
- Estatísticas preservam ícones, texto, fundos semânticos e borda completa da
  cor de status. Não aplicar borda tricolor a sinais de erro ou aprovação.
- Avatares compartilham formato circular, moldura branca e halo suave; manter
  as dimensões necessárias em tabelas, topbar e prévias. Tabelas mantêm grade,
  colunas, altura e paginação existentes.
- `prepararChips` conserva os pares de cores em etiquetas, filtros, chips
  removíveis e prévias de perfil; reaplicar após atualizar uma prévia dinâmica.
  Favoritos preservam o coração e a cor rosa, sem tratamento de categoria.
- Logo original RGBA de 1254 × 1254, sem transformação do arquivo. Na marca da
  casca, usar caixa de 72 × 52px com `object-fit: cover` para aproveitar as margens
  transparentes, e base clara arredondada para o lettering escuro continuar legível
  no cabeçalho e rodapé. Login usa `--tamanho-logo-login` (96px) e preserva a imagem
  inteira. O CSS funcional do login, ausente neste worktree, deve consumir o token.


## Acessibilidade — auditoria de 23/11/2026

- Marcas dos painéis têm nome acessível explícito; o menu de conta referencia
  os rótulos `painel-conta-rotulo` e `painel-conta-nome`, inclusive quando o nome
  visual é ocultado no celular. Campos de upload precisam de rótulo acessível.
- Atalho `Pular para o conteúdo` é o primeiro link do documento e só aparece
  no foco. Seu acionamento foca o main atual sem alterar a rota da SPA.
- Acordeões preservam os headings: colocar botão nativo `.acordeao-toggle`
  dentro de h3, com `aria-expanded` e `aria-controls` vinculados ao conteúdo.
  Teclado usa o comportamento nativo de Enter/Espaço.
- Checkboxes/radios do catálogo usam 24px, e seus labels têm alvo de 44px.
  Botões de remoção de chips têm alvo de 44px. Não confundir o mínimo AA de
  24px (WCAG 2.2, com exceções) com a recomendação de 44px do projeto.
- Carrosséis com vários slides oferecem Pausar/Retomar rotação, preservando
  a pausa quando o ponteiro/foco sai do componente. Preferência por movimento
  reduzido inicia em pausa; mudá-la para reduzir também interrompe a rotação.
  Pausa temporária por foco/hover e navegação manual são mantidas.
- Falhas de carregamento devem apresentar mensagem de erro anunciável e ação
  de tentar novamente; indisponibilidade da rede não equivale a rota inexistente.

Referências: [WCAG 2.2, alvos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
[pausa](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html),
[mensagens de status](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).
