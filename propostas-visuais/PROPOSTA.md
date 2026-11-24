# Direção de arte e refinamento visual — Liceu

Data: 23/11/2026. Estado: **arquivo histórico do estudo anterior à aprovação**.
A direção Equilibrada foi aprovada e refinada posteriormente. Este diagnóstico
preserva a análise original; o padrão vigente está em `../docs/DESIGN.md`.
Base: `37922e3`, preservando a auditoria em `docs/AUDITORIA_UI_UX.md`.

## A. Diagnóstico estético atual

A identidade é reconhecível: o símbolo do Liceu, o turquesa profundo, o amarelo
e o rosa conectam o portal à ideia de criatividade e acolhimento. A tipografia
Inter é legível e os componentes já têm consistência estrutural. Não é uma
interface sem identidade nem um caso que exija reconstrução.

A oportunidade está na **distribuição da atenção**. Muitas superfícies recebem
simultaneamente cor, contorno tricolor, raio grande e sombra. Esses recursos são
coerentes com a marca, mas sua repetição em praticamente todos os cards e blocos
de formulário reduz a diferença visual entre destaque editorial, cadastro e
conteúdo comum. Essa é uma avaliação de direção de arte, não um novo defeito
funcional ou uma falha de acessibilidade comprovada.

### Observações nas telas renderizadas

| Área | Observação | Leitura de design | Decisão proposta |
|---|---|---|---|
| Home | Hero amarelo, atalhos sobre verde, catálogo sobre amarelo e pessoas sobre rosa. | A alternância é acolhedora, mas quase todas as faixas pedem atenção cromática. | Refinar: base mais neutra, tintas em áreas editoriais selecionadas. |
| Ações da Home | “Explorar produtos” e “Conhecer o Liceu” têm o mesmo preenchimento amarelo. | Falta diferenciação visual entre ação principal e alternativa. | Reformular a hierarquia: primeira turquesa, segunda branca com borda. Sem mudar links. |
| Artesãos e produtos | Bordas tricolores contornam todos os cards. | A moldura tem presença própria e compete com nome, chips e futuras fotografias. | Comparar contorno tricolor atenuado com contorno verde suave completo. |
| Cadastros internos | Blocos grandes repetem a moldura tricolor e raio de 24px. | O acabamento editorial da vitrine aparece com o mesmo peso em uma tarefa operacional. | Refinar intensidade; manter a mesma família visual nas três áreas. |
| Chips | Existem seis cores por categoria/técnica e contornos coloridos escuros. | A variedade ajuda a reconhecer assuntos; a soma das bordas aumenta o ruído na barra de filtros. | Manter cores e mapeamento; suavizar bordas dos não selecionados. |
| Títulos | Peso 800 é recorrente, inclusive em telas com conteúdo denso. | Dá presença, mas pode diminuir a distinção entre comunicação editorial e operação. | Refinar pesos e espaçamento entre letras; preservar fonte. |
| Sombras | Hover compartilhado pode chegar a 12px/32px com 18% de opacidade. | Em comparação renderizada, uma sombra menor deixa os contornos mais limpos. | Refinar elevação, sem animação ou deslocamento novo. |
| Fotografias | A vitrine ainda contém arquivos provisórios com nomes de arquivo visíveis. | É uma limitação importante da percepção de acabamento, que CSS não resolve. | Avaliar conteúdo definitivo autorizado. Nenhuma imagem foi inventada. |
| Header e footer | Turquesa/petróleo com texto claro e faixa institucional. | Formam âncoras visuais fortes e reconhecíveis. | Manter estrutura, marca e faixa; apenas harmonizar tons se a direção equilibrada for escolhida. |

## B. Análise cromática e duas direções concretas

Não proponho uma terceira identidade radical nesta rodada: as cores do símbolo
já sustentam a personalidade do projeto. A principal limitação observada é de
proporção e intensidade de aplicação, não a ausência de uma cor nova. Ambas as
direções preservam o PNG original, as cores dos estados, os chips diferentes e
a borda completa dos cards, conforme os pedidos anteriores.

As cores propostas são escolhas digitais do projeto, não um manual oficial do Liceu.

### Refinamento conservador

Mantém os principais tons atuais, atenua as superfícies e torna mais discreto
o contorno tricolor. É a alternativa de menor mudança perceptiva.

| Papel | HEX | Exemplo de aplicação |
|---|---|---|
| Primária | `#0C7774` | Botão de salvar, ação principal da Home. |
| Hover primário / links | `#095E5C` | Hover de ação e links. |
| Header | `#095E5C` | Navegação pública e topbar. |
| Footer / lateral | `#183E45` | Base institucional e navegação interna. |
| Destaque amarelo | `#FFC928` | Seleção e acentos de marca. |
| Destaque rosa | `#E73571` | Grafismo institucional pontual. |
| Fundo principal | `#F8F7F3` | Portal e painéis; substitui o amarelo contínuo do portal. |
| Superfície elevada | `#FFFFFF` | Cards, campos e modais. |
| Editorial amarelo | `#FFF3CF` | Hero e conteúdo editorial. |
| Editorial rosa | `#F9EDF1` | Faixa de pessoas e apresentação. |
| Superfície alternada | `#EAF3F0` | Seções de apoio. |
| Texto | `#183E45` | Títulos e conteúdo. |
| Texto de apoio | `#48625E` | Metadados e descrições. |
| Borda decorativa | `#CCDAD5` | Chips não selecionados e divisórias. |
| Borda de campo | `#6C837D` | Limite dos controles. |
| Contorno tricolor atenuado | `#5A9D98` / `#D4B25C` / `#C96C89` | Borda completa dos cards, mantendo a ordem da marca. |

**Justificativa:** preserva a expressividade, com menos competição entre moldura
e conteúdo. A neutralização do plano principal torna a superfície branca útil
para organizar a leitura, enquanto amarelo e rosa continuam presentes.

**Vantagens:** continuidade com a interface atual; baixo esforço; conserva o
contorno multicolorido solicitado anteriormente; exige menos ajustes de estados.

**Desvantagens:** ainda há ornamentação em blocos operacionais; a mudança de
percepção é moderada; permanece dependente de fotografias melhores.

### Modernização equilibrada — recomendada

Linguagem **institucional criativa e acolhedora**. A marca continua tricolor;
a estrutura usa turquesa profundo, branco quente e verde suave. Amarelo e rosa
aparecem em seleção, categorias, favoritos e momentos editoriais.

| Papel | HEX | Exemplo de aplicação |
|---|---|---|
| Primária | `#146F67` | CTAs principais, salvar e enviar. |
| Hover / links | `#0A514D` | Interação com contraste forte. |
| Header | `#104C49` | Cabeçalho público e topbar. |
| Footer / lateral | `#173D3A` | Base institucional e menus internos. |
| Amarelo de interface | `#F5CD58` | Item selecionado e destaque pontual. |
| Turquesa de marca | `#20A8A6` | Símbolo e faixa institucional preservados. |
| Amarelo de marca | `#FFC928` | Símbolo e faixa institucional preservados. |
| Rosa de marca | `#E73571` | Símbolo e faixa institucional preservados. |
| Foco / favorito | `#A62255` | Anel de foco e coração ativo. |
| Fundo principal | `#FBFAF7` | Base comum do portal e dos painéis. |
| Superfície elevada | `#FFFFFF` | Cards, formulários, menus e modais. |
| Superfície alternada | `#EDF3EF` | Faixas de apoio e contexto. |
| Editorial amarelo | `#FAF0D7` | Hero e comunicação editorial. |
| Editorial rosa | `#F7EFF1` | Apresentações pontuais. |
| Texto | `#213D38` | Títulos e conteúdo. |
| Texto de apoio | `#536B63` | Descrições e metadados. |
| Borda decorativa | `#D5DFD9` | Separadores e chips não selecionados. |
| Contorno de card | `#B8D0C8` | Borda completa, suave e contínua. |
| Borda de controle | `#75877D` | Campos e seletores. |

**Justificativa:** deixa pessoas, trabalhos e chamadas para ação conduzirem a
composição. A identidade permanece nas áreas que orientam a experiência e nos
detalhes de marca, sem repetir uma moldura expressiva em todos os contêineres.
Não é uma proposta de monocromia: os seis grupos de chips permanecem coloridos.

**Vantagens:** hierarquia mais nítida; melhor equilíbrio com fotografias futuras;
mesma linguagem para vitrine e tarefas internas; tipografia ganha espaço para
organizar o conteúdo; contornos completos continuam presentes.

**Desvantagens:** menos exuberante; muda mais a percepção do site; exige cuidado
para que os elementos institucionais e as categorias não desapareçam num excesso
de neutralidade. A avaliação de preferência deve ser sua, não presumida como fato.

### Estados e contrastes

As cores semânticas atuais são preservadas nas duas propostas:

| Estado | Texto / ícone | Fundo |
|---|---|---|
| Sucesso | `#146347` | `#E4F3E8` |
| Análise / alerta | `#765000` | Conservador `#FFF3CF`; equilibrado `#FAF0D7` |
| Erro / rejeição | `#A02548` | Conservador `#F9EDF1`; equilibrado `#F7EFF1` |
| Informação | `#15546C` | `#E5F0F7` |
| Rascunho | `#485E59` | `#EAEFE9` |
| Desabilitado | `#52665F` | `#E4E8E2` |

A primeira conferência calculou estes pares principais:

| Par | Conservador | Equilibrado |
|---|---|---|
| Branco sobre primária | 5,38:1 | 6,00:1 |
| Branco sobre header | 7,59:1 | 9,76:1 |
| Texto principal sobre fundo | 10,80:1 | 11,24:1 |
| Texto de apoio sobre branco | Mantém o par atual | 5,75:1 |
| Borda de controle sobre branco | Mantém o par atual | 3,81:1 |
| Texto principal sobre seleção amarela | Mantém o par atual | 7,69:1 |

Esses cálculos não substituem a revisão de todos os estados renderizados após a
implementação. Os badges continuam com texto/ícone e não dependem apenas de cor.

## C. Direção de arte recomendada

Recomendo **Modernização equilibrada**: institucional, criativa e acolhedora.
O projeto valoriza o trabalho artesanal e seus autores; as superfícies devem
apresentar esse conteúdo com clareza. A cor institucional ancora a navegação,
os chips reconhecem os assuntos, e os acentos dão personalidade a áreas seletivas.

O objetivo não é transformar o portal em um painel corporativo genérico.
Preservar o símbolo, a faixa tricolor, as categorias coloridas, os tons quentes
editoriais e a presença das pessoas é parte da direção recomendada.

Se a borda tricolor em todos os cards for uma preferência indispensável, a
alternativa conservadora é a escolha mais adequada. Não a removi do código atual.

## D. Recomendações por componente

| Componente | Classificação | Proposta e justificativa |
|---|---|---|
| Logo original | MANTER | Arquivo, proporção e transparência. Base clara discreta onde o lettering escuro precisa de contraste. |
| Header e lateral | REFINAR | Mesma estrutura; tons harmonizados; seleção amarela mais contida na opção equilibrada. |
| Ações da Home | REFORMULAR | Ação primária turquesa e alternativa branca. Os dois links atuais permanecem. |
| Demais botões | REFINAR | Papéis claros: primário preenchido, secundário contornado, destrutivo semântico. Manter alvos e rótulos. |
| Cards públicos | REFINAR | Borda completa; comparar tricolor suave com verde suave. Sem efeito de vidro ou deslocamento novo. |
| Blocos de formulário | REFINAR | Mesmo padrão dos cards, com presença decorativa menor e espaço para os campos. |
| Inputs e seletores | REFINAR | Raio de 8px, borda legível e foco preservado. Não trocar a interação ou o contrato dos seletores. |
| Chips | MANTER / REFINAR | Manter cores por assunto; suavizar bordas dos não selecionados, preservando a seleção preenchida. |
| Badges | MANTER | Significado por estado, texto e ícone já funcionam. |
| Títulos | REFINAR | Inter preservada; títulos em 700 na direção equilibrada, evitando competir com todos os CTAs. |
| Ícones | MANTER | Registro semântico e família existente. Ícones de marca podem manter sua identidade própria. |
| Faixas de página | REFINAR | Alternância mais contida; reservar tinta mais intensa para conteúdo editorial. |
| Sublinhados decorativos de seções | REFORMULAR | Nos exemplos, títulos organizam a seção por peso e espaço; o traço rosa repetido deixa de ser obrigatório. |
| Modais | MANTER / REFINAR | Preservar foco, fechamento, botão centralizado de explorar técnica e rolagem; harmonizar tons depois da escolha. |
| Footer | MANTER / REFINAR | Mesma composição institucional; contraste mantido; tom coordenado com a lateral. |
| Fotos, vídeo e material institucional | AVALIAR | Conteúdo definitivo autorizado tem impacto maior que acrescentar efeitos. Sem geração de pessoas ou troca por imagens aleatórias. |

## E. Proposta de design system visual

Tokens abaixo são **candidatos**, não alterações aprovadas em `docs/DESIGN.md`.

| Grupo | Conservador | Equilibrado |
|---|---|---|
| Família | Inter + fallbacks atuais | Inter + fallbacks atuais |
| Corpo público | 15px | 16px |
| Corpo de painel | Manter 14px | Manter 14px para densidade de gestão |
| Título de página pública | Escala atual | Escala atual, peso 700, tracking de -0,025em |
| Título de card de artesão | 15px / 700 / linha 1,35 | 16px / 700 / linha 1,35 |
| Metadados | 13px | 13px |
| Campos | Escala atual; avaliar 16px no celular na implementação | Escala atual; avaliar 16px no celular na implementação |
| Escala de espaço | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px | Mesma escala |
| Card / bloco de formulário | Raio 20px | Raio 16px |
| Campo | Raio 8px | Raio 8px |
| Botão | Raio 10px | Raio 10px |
| Modal | Manter 24px | Manter 24px |
| Avatar / status | Circular / pílula | Circular / pílula |
| Contorno | Completo, 1px, tricolor atenuado | Completo, 1px, `#B8D0C8` |
| Sombra de repouso | `0 2px 5px rgb(24 62 69 / 5%)` | `0 2px 6px rgb(23 61 58 / 4%)` |
| Sombra de interação | `0 6px 16px rgb(24 62 69 / 10%)` | `0 5px 14px rgb(23 61 58 / 9%)` |
| Animações | Sem animações novas | Sem animações novas |

Não recomendo substituir a Inter nesta rodada. A troca de fonte acrescentaria
uma variável de carregamento e de composição sem benefício demonstrado para
este projeto. Antes disso, ajustar peso, escala e comprimento das linhas é
uma intervenção mais previsível.

Os raios diferentes têm função: campos e botões são controles, cards agrupam
conteúdo, modais são superfícies maiores, e avatares representam pessoas.
Coerência não exige que todos tenham exatamente o mesmo raio.

## F. Plano de refinamento após aprovação

| Prioridade | Intervenção | Impacto estético | Esforço | Dependências |
|---|---|---|---|---|
| P1 | Consolidar a paleta escolhida nos tokens | Alto | Baixo | Aprovação da direção. |
| P1 | Ajustar hierarquia das ações e superfícies | Alto | Baixo/médio | Tokens aprovados. |
| P2 | Aplicar contornos, raios e sombras compartilhados | Alto | Médio | Preservar borda completa e badges semânticos. |
| P2 | Refinar títulos e leitura de cards | Médio/alto | Médio | Verificar quebras em 320px e densidade dos painéis. |
| P2 | Harmonizar chips, campos, seletores e footer | Médio | Médio | Manter rótulos, foco e comportamento. |
| P3 | Revisar seções e detalhes editoriais | Médio | Médio | Conteúdo atual e escolhas aprovadas. |
| Conteúdo | Fotos e vídeo definitivos | Alto | Dependente da equipe | Material autorizado. |
| Validação | Capturas, contraste, matriz responsiva e testes | Obrigatório | Médio | Implementação terminada. |

Seguir o fluxo do repositório: registrar decisões e estilos primeiro em
`feat/design-system`, documentar os tokens e incorporar os commits à branch
funcional preservando histórico. Não modificar regras de negócio.

## G. Comparações produzidas e limite desta etapa

A galeria em `http://localhost:8080/propostas-visuais/` permite escolher:

- Atual, refinamento conservador ou modernização equilibrada.
- Início, Artesãos, Produtos, painel do Liceu, cadastro do Liceu e perfil do artesão.
- Desktop de 1440px ou celular de 375px.
- Comparação lado a lado com o estado atual.

Foram renderizadas **36 combinações**: seis telas × três versões × duas larguras.
Não houve overflow do documento nessas amostras. As propostas foram aplicadas
somente na memória de contextos isolados do navegador para gerar as capturas.
O HTML/CSS/JS de produção e os dados do portal permanecem inalterados.

A comparação interativa de componentes é um recorte de card e formulário;
as capturas da galeria mostram as páginas completas com a fonte efetivamente
carregada no navegador. Logo e fotos provisórias foram preservados nas propostas.

A galeria foi exercitada, e as telas representativas foram inspecionadas
renderizadas. Isso valida a comparação visual produzida, não uma implementação
completa nem a aprovação da direção. Não foram repetidas todas as suítes do
projeto porque nenhum estilo de produção foi alterado nesta etapa.

A implementação global e sua bateria final de testes aguardam sua escolha,
conforme o pedido: “Não implemente imediatamente uma reformulação global sem
minha aprovação da direção visual.”
