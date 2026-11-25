# Auditoria de UI/UX, front-end e design system

Data: 23/11/2026. Base: `c8d543c`. Branch de entrega: `fix/auditoria-ui-ux`.
Escopo: portal público, Área do Artesão e Área do Liceu, preservando o MVP local.

## Etapa 1 — Diagnóstico geral

A base funcional do MVP está integrada. O catálogo, favoritos, cadastro,
conclusão de perfil, credenciais de demonstração, envio, aprovação, rejeição,
correção e reenvio passaram nas suítes existentes. A interface mantém identidade
tricolor, tokens semânticos, componentes compartilhados e estados textuais.
Não foi necessária migração de stack nem redesenho.

A auditoria encontrou falhas de acessibilidade em componentes específicos e uma
falha de recuperação de rede. Essas ocorrências foram corrigidas. A matriz de
responsividade não apresentou overflow horizontal do documento, antes ou depois.

Isso não torna o produto pronto para produção: autenticação e dados continuam
locais e simulados, conforme o escopo documentado. Conteúdo visual provisório,
entrega real de mensagens e desempenho em usuários reais têm validações pendentes.

### Método e evidências

- 20 rotas registradas, mais o modal de login, em 320, 375, 430, 768, 1024,
  1440 e 1920px: **147 combinações antes e 147 depois**, em Chromium.
- Axe-core 4.10.3 em 320 e 1440px: **42 execuções por rodada**. Tags WCAG A/AA,
  WCAG 2.1/2.2 AA disponíveis no motor e boas práticas.
- Capturas completas das 42 configurações por rodada, inspeção visual de
  telas representativas e revisão do código HTML, CSS e JavaScript afetado.
- Fluxos, regressões e nova suíte de acessibilidade em Chromium e Firefox,
  em contextos isolados, sem reutilizar dados pessoais.
- Teste do contato com resposta simulada, sem mensagem externa real.
- Carregamentos completos da home em contextos novos para performance:
  três amostras da base anterior e três da versão corrigida.

[Evidências resumidas e matriz completa](AUDITORIA_UI_UX_EVIDENCIAS.json).
Artefatos brutos e capturas desta execução: `/tmp/liceu-auditoria/antes/` e
`/tmp/liceu-auditoria/depois/`. São temporários; os resultados resumidos são
preservados no repositório. Controles ocultos deliberadamente, tabelas com
rolagem interna e slides fora da janela não foram classificados como overflow
de página ou como defeitos de alvo de toque por si só.

## Etapa 2 — Auditoria detalhada

### MANTER

| Página/componente | Evidência e motivo para manter |
|---|---|
| Início e navegação pública | Hierarquia, CTAs e rotas existentes; navegação e filtros exercitados sem erro de console. |
| Produtos e produto individual | Busca, favoritos persistidos, grade/lista, paginação, galeria, relacionados e estados indisponíveis continuam funcionais. |
| Artesãos e Saberes | Busca, filtros, ordenação e modais preservados; modal retorna o foco ao acionador; seletor funciona por teclado. |
| Cadastro e login | Validação, contas de demonstração, conclusão de perfil, lembrar sessão e guardas passaram nos testes. |
| Perfil e trabalhos do artesão | Propriedade dos registros, restrição de edição durante análise e persistência mantidas; sem alteração de regra de negócio. |
| Pendentes e publicações do Liceu | Aprovação, rejeição com motivo, reenvio e publicação confirmados por fluxos; geometria da tabela e paginação preservadas. |
| Configurações | Controles de evolução futura já estão desabilitados e explicados. Sua ausência funcional não foi tratada como defeito do MVP. |
| Sobre o Liceu, Sobre e Contato | Conteúdos institucionais preservados; formulário validado com feedback de sucesso simulado. Fotos provisórias continuam identificadas como pendência de conteúdo. |
| Design system | Tokens, cores por assunto, status com ícone e texto, logo original, bordas completas e componentes compartilhados preservados. |
| Arquitetura | HTML, CSS e ES Modules sem framework ou build obrigatório; dados centralizados em `js/dados.js`; não há benefício demonstrado para reescrita ou novas dependências de aplicação. |

### CORRIGIR — problemas confirmados e resolvidos

A gravidade abaixo expressa impacto no produto. A classificação técnica do axe
é registrada separadamente no JSON e não equivale automaticamente à gravidade
de negócio. Ocorrências repetidas em várias telas têm a mesma causa compartilhada.

| ID / gravidade | Página ou componente | Problema e evidência antes | Impacto e justificativa | Correção aplicada | Risco |
|---|---|---|---|---|---|
| C01 / alta | Topbar dos dois painéis, no celular | Axe: `button-name` e `link-name`; nome da conta e texto da marca eram ocultados por CSS, com imagens decorativas de alt vazio. | Leitor de tela encontra ação e link sem identificação. | Marca com nome acessível; conta referencia texto de finalidade e nome dinâmico por `aria-labelledby`, mesmo quando o texto visual é oculto. | Baixo: atributos e texto auxiliar; ações existentes mantidas. |
| C02 / alta | Meu perfil do artesão | Axe: `label` em `#perfil-foto`, nas duas larguras auditadas. | Campo de arquivo sem finalidade acessível. | Rótulo explícito “Selecionar foto do perfil”. | Baixo: upload e validação não alterados. |
| C03 / média | Acordeões de filtros em Produtos | Axe: `aria-allowed-role`; quatro `h3 role="button"`. | Semântica de heading substituída por um papel não permitido naquele elemento. | Botão nativo dentro de h3, com estado expandido e referência ao grupo. Enter/Espaço usam comportamento nativo; removido handler redundante. | Baixo: filtros e seleção mantidos; teclado testado. |
| C04 / média | Checkboxes/radios do catálogo | Axe: `target-size`; checkboxes de 15×15px e distância segura calculada de 22px. | Facilita ativação acidental e dificulta toque. | Controles de 24×24px e labels com alvo mínimo de 44px. | Baixo: aumenta altura do painel; estados e valores não mudam. |
| C05 / média | Chips removíveis de técnicas | Medição DOM encontrou botão chegando a 4×4px antes da renderização do ícone; não havia mínimo CSS próprio. | A ação depende do desenho para obter área clicável suficiente. | Alvo mínimo independente de 44px, alinhamento central e rótulo já existente preservado. | Baixo: chips ficam mais altos; sem corte ou overflow observado. |
| C06 / média | Carrosséis de Início, Artesãos e galeria com várias fotos | Avanço automático a cada 6s; apenas hover/foco suspendiam a rotação, sem pausa persistente. | A pessoa precisa permanecer sobre o componente para interromper atualizações. | Controle textual Pausar/Retomar; pausa mantida ao sair do componente. Preferência por movimento reduzido inicia em pausa e mudança para reduzir interrompe rotação. | Baixo: navegação manual e pontos mantidos; relógio acelerado apenas nos testes. |
| C07 / alta | Roteador e carregamento de layouts | Ao abortar a parcial e o fallback, `#conteudo` ficava vazio e o navegador emitia `Failed to fetch` não tratado. | Impede continuar a navegação quando há indisponibilidade de rede. | Mensagem local anunciável e botão “Tentar novamente”, sem depender de outra requisição para exibir o erro. Layout também pode ser recuperado. | Médio: altera o caminho de falha global; recuperação de parcial/layout e navegação rápida testadas. |

### MELHORAR — refinamentos aplicados

| ID / gravidade | Componente | Evidência e impacto | Melhoria, justificativa e risco |
|---|---|---|---|
| M01 / baixa | Navegação repetida | Primeiro Tab ia à marca; não havia atalho explícito para o conteúdo principal. | Primeiro link agora permite pular a casca, foca o main atual e preserva a rota. Melhora eficiência de teclado; baixo risco. Não foi declarado que a ausência anterior, isoladamente, comprovava falha WCAG, pois landmarks também são mecanismo de navegação. |
| M02 / baixa | `docs/DESIGN.md` | Seções centrais ainda descreviam chips monocromáticos, avatares quadrados e hover com deslocamento, divergindo do CSS atual. | Contratos atualizados para as cores por assunto, borda/raio compartilhados, avatares circulares e pausa. Reduz decisões conflitantes; sem efeito funcional. |

### AVALIAR — pendências e recomendações opcionais

| ID / gravidade contextual | Página/componente | Evidência observada | Impacto possível, recomendação e risco |
|---|---|---|---|
| A01 / alta antes de produção | Dados e autenticação | Persistência e permissões no navegador; documentação identifica o mock local. | Não há autenticação nem autorização de servidor ou sincronização entre dispositivos. Planejar backend antes de produção. Risco alto de migração; fora desta correção e sem mudança de dados. |
| A02 / média | Fotos e conteúdo visual | Capturas mostram placeholders com nomes de arquivos; `assets/img/LEIAME.md` documenta os recursos provisórios. | Limita a avaliação da qualidade editorial final. Receber fotos e conteúdos autorizados da equipe/Liceu. Não inventar pessoas ou substituir material institucional. Risco baixo após validação de conteúdo. |
| A03 / média | Catálogo em 320px | Filtros ficam antes dos produtos e ocupam uma faixa vertical extensa; há CSS legado para um botão móvel que não existe na página atual. | Avaliar filtros recolhíveis no celular, com acionador visível e indicação de filtros ativos. Oportunidade de UX, não bloqueio funcional comprovado. Mudaria o estado inicial e a descoberta dos filtros; validar com usuários antes de escolher essa interação. |
| A04 / baixa | Logo e imagens | PNG original: 428.163 bytes, 1254×1254px, exibido em caixas pequenas. | Considerar variantes otimizadas para exibição, mantendo original e transparência. Não há ganho medido dessa mudança; arquivo institucional foi preservado. Risco de perda de qualidade se conversão for indiscriminada. |
| A05 / média | Tipografia e público-alvo | Corpo aprovado de 14px e algumas etiquetas de 12px. Os pares de cores principais têm bom contraste calculado. | Testar leitura com o público real, inclusive baixa visão. Tamanho pequeno não foi tratado automaticamente como infração WCAG. Uma revisão da escala afetaria várias composições; risco médio. |
| A06 / média | Contato e mídia externa | Contato depende de Web3Forms; home inclui iframe de YouTube e recursos de fontes/ícones externos. | Confirmar entrega com a instituição e revisar a experiência sem esses serviços. Não houve envio externo real na auditoria. O vídeo e suas legendas não foram certificados. |
| A07 / baixa | CSS e carregamento modular | Existem regras legadas e carregamento inicial de estilos/módulos de várias páginas. | Remover código apenas com evidência de desuso e ganho mensurável. Sem mudança ampla de arquitetura ou importação por hipótese. Risco médio de regressão visual se houver limpeza indiscriminada. |

## Etapa 3 — Plano de ação

| Prioridade | Ação | Impacto / esforço / risco | Situação |
|---|---|---|---|
| P1 | Recuperar falhas de página e layout (C07) | Alto / médio / médio | Implementada e testada em dois navegadores. |
| P1 | Nomear controles móveis e upload (C01–C02) | Alto / baixo / baixo | Implementada; achados automáticos eliminados. |
| P2 | Corrigir acordeões e alvos (C03–C05) | Médio / baixo / baixo | Implementada; teclado e dimensões verificados. |
| P2 | Oferecer pausa persistente (C06) | Médio / médio / baixo | Implementada; pausa e retomada verificadas. |
| P3 | Atalho e documentação (M01–M02) | Médio / baixo / baixo | Implementadas. |
| Planejamento | Backend e validação institucional (A01, A02, A06) | Alto antes de produção / alto / variável | Pendente, fora do MVP local auditado. |
| Pesquisa/medição | Filtros móveis, escala e otimizações (A03–A05, A07) | Potencial / variável / médio | Opcionais; exigem contexto ou medição adicional. |

## Etapa 4 — Implementação

Padrões visuais e acessíveis registrados primeiro em `feat/design-system`,
commits `e6b5463` e `f5b2e39`, e incorporados por merge à branch de auditoria.
Conflitos foram resolvidos preservando o diálogo funcional da conta e os
contratos das páginas existentes. Sem force-push ou publicação remota.

Arquivos e responsabilidades:

- `css/componentes.css`: alvos de chips e filtros, acordeão e controle do carrossel.
- `css/layout.css`, `index.html`, `js/layout.js`: atalho para o conteúdo.
- `pages/layouts/painel.html`: nomes acessíveis da marca e da conta.
- `js/componentes.js`: pausa persistente e preferência por movimento reduzido.
- `pages/produtos.html`, `js/produtos.js`, `css/produtos.css`: integração do
  acordeão nativo e remoção das dimensões conflitantes de 15px.
- `pages/painel-artesao/meu-perfil.html`: rótulo do arquivo de foto.
- `js/router.js`: apresentação e recuperação de falhas de página/layout.
- `tests/acessibilidade.cjs`, `tests/README.md`: regressões reproduzíveis.
- `docs/DESIGN.md`: contratos atualizados; este relatório e seu JSON registram a auditoria.

Não foram modificados dados iniciais, autenticação mock, regras de publicação,
integrações externas, conteúdo institucional ou o PNG original do logo.

## Etapa 5 — Validação

| Verificação | Antes | Depois |
|---|---|---|
| Responsividade, 147 combinações | Sem overflow do documento | Sem overflow do documento |
| Axe, 42 configurações | 14 configurações com violações; 5 regras; 44 ocorrências de elementos, incluindo repetições entre larguras | Nenhuma violação detectada nas mesmas configurações |
| JavaScript e respostas locais na matriz | Sem erros no uso normal | Sem erros no uso normal |
| Falha provocada ao carregar uma página | Conteúdo vazio e rejeição não tratada | Erro anunciado, botão de tentativa e recuperação verificada |
| Contraste complementar | Não foi feita certificação integral | 16 pares principais de tokens calculados; mínimo 5,38:1 |
| Dados | 12 testes passando | 12 testes passando |
| Estrutura | 20 rotas e 26 HTML válidos nos contratos locais | Mesmos contratos válidos |
| Fluxos existentes | Base conhecida pelas verificações anteriores | Chromium e Firefox passaram nesta rodada |
| Regressões existentes | Base conhecida pelas verificações anteriores | Chromium e Firefox passaram nesta rodada |
| Nova suíte de acessibilidade | Ausente | Chromium e Firefox passaram |
| Sintaxe JavaScript | Stack sem compilação obrigatória | Todos os arquivos de `js/` passaram em `node --check`; `git diff --check` sem problemas |

A nova suíte verifica atalho sem alterar hash, menu por teclado, foco,
carrossel em movimento reduzido, pausa persistente, botão nativo do acordeão,
nomes móveis, upload, alvos e recuperação de parcial e layout. As suítes
existentes verificam cadastro, conclusão de perfil, sessão, guardas, aprovação,
rejeição, reenvio, favoritos, catálogo, tabelas, identidade entre abas e navegação
rápida. O modal de perfil e o seletor também foram exercitados por teclado;
a saída do modal restaurou foco no acionador.

### Performance: medição local, sem alegação de ganho

Home em 1440×1000, três contextos novos por versão, rede local, sem simulação
de conexão móvel ou CPU lenta. Medidas coletadas após fontes prontas e breve
janela de estabilização. Os dados iniciais de navegações por hash foram
**descartados para a comparação de performance**, pois acumulavam no mesmo
documento. Somente as seis navegações completas constam como amostras válidas
no campo `performance_carregamentos_completos` do JSON.

| Métrica de laboratório | Antes | Depois |
|---|---|---|
| LCP, mediana | 540ms | 524ms |
| LCP, intervalo observado | 432–1448ms | 448–528ms |
| CLS, mediana | 0,0693 | 0,0684 |
| Recursos por navegação | 56 | 56 |
| Transferência contabilizada pelo navegador | 1.158.033 bytes | 1.161.244 bytes |

A diferença é compatível com variação de execução; não foi demonstrada melhora
material de performance. As correções adicionaram aproximadamente 3,1KiB de
transferência não comprimida nessa amostra, sem dependência nova de aplicação.
INP de produção e percentis de usuários reais **não foram medidos**. O servidor
Python de desenvolvimento não representa cache, compressão ou latência da
hospedagem final. O total de recursos pode não representar todos os bytes
internos de iframe ou recursos externos sem dados de timing expostos.

### Limitações explícitas

- Zero violações no axe não é certificação WCAG AA. Houve resultados
  inconclusivos de contraste sobre fundos compostos, referências ARIA de
  popovers e conteúdo de iframe. Os tokens principais foram calculados
  separadamente; o seletor aberto foi exercitado e não apresentou violação
  automática. A revisão integral com tecnologia assistiva permanece pendente.
- A matriz das sete larguras usou Chromium; Firefox foi usado nas suítes de
  fluxo, regressão e acessibilidade, não em toda a matriz de 147 estados.
- Não houve teste com leitores de tela reais, hardware móvel, zoom em todas
  as combinações, inspeção integral de vídeo/legendas ou pessoas usuárias.
- Os contratos de HTML locais e a sintaxe JS foram verificados; não foi
  executada certificação remota integral pelos validadores W3C nem JSLint.
- Envio real de contato, recuperação por e-mail, autenticação de servidor e
  armazenamento entre dispositivos não foram certificados.

## Etapa 6 — Resultado e próximos passos

Mantidos a identidade, stack, conteúdos e fluxos do MVP. Corrigidos os sete
grupos de problemas confirmados e aplicados dois refinamentos de navegação e
documentação. As verificações executadas não detectaram regressões.

A entrega está em branch local para revisão. O servidor em `localhost:8080`
serve o checkout atual. A versão temporária anterior na porta 8081 foi usada
somente para medição comparativa. Antes de produção, priorizar A01, validar
conteúdo institucional e entrega de contato. Demais propostas permanecem
opcionais, sem alterar regras de negócio por hipótese.

### Referências

- [W3C: tamanho mínimo de alvos, WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- [W3C: pausar, parar e ocultar](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
- [W3C: mensagens de status](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).
