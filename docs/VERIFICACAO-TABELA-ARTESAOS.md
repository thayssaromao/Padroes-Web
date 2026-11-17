# Verificação da geometria da tabela administrativa de artesãos

> Atualização de acabamento: a reserva vertical foi transferida para `.liceu-listagem-artesaos`, externa à caixa com borda. Em nova validação no Chromium e Firefox, a sequência 1 → 2 → 3 → 2 → 1 manteve a região externa com 540px; a caixa da tabela teve 467,5px nas páginas completas e 215px na última página. Contador, paginação, footer e medidas horizontais permaneceram nas posições anteriores. As medições abaixo registram a etapa estrutural anterior, quando a reserva ainda ficava no contêiner com borda.

Data: 16/11/2026. Rota: `http://127.0.0.1:8080/#/painel-liceu/artesaos`.

Medição no servidor de desenvolvimento real, em sessões novas de Chromium e Firefox, viewport de 1536 × 1100 CSS px, ordenação Nome A–Z. Sequência executada: **1 → 2 → 3 → 2 → 1**. Coordenadas obtidas com `getBoundingClientRect()`, em CSS px. Nenhuma largura é calculada por JavaScript na aplicação.

## Diagnóstico anterior à alteração

- `thead` e `tbody` pertencem à mesma tabela. O JavaScript atual mantém o cabeçalho e alterna a visibilidade de linhas já existentes do corpo; a reconstrução por `innerHTML` acontecia na implementação anterior.
- O estilo base móvel usa linhas em grid e células em flex. A partir de 1024px, os estilos computados são `table-row` e `table-cell`, com `box-sizing: border-box`.
- Antes desta rodada, a versão entregue pelo servidor já usava `table-layout: fixed` e larguras nos `th:nth-child`. A medição anterior apresentou variação de 0px nos dois navegadores: não foi possível reproduzir a diferença horizontal relatada em sessões novas dessa versão.
- O servidor retorna `Cache-Control: max-age=3600` para HTML, CSS e JavaScript. Os arquivos recebidos eram idênticos aos do workspace. Cache antigo no navegador é uma possibilidade, não uma causa comprovada da sessão do usuário.
- `table-layout: fixed` não substitui a verificação da largura do contêiner nem comprova que o navegador carregou a versão atual do CSS.

## Alteração estrutural

As proporções existentes (18% / 15% / 15% / 21% / 9% / 22%) foram transferidas dos seletores de cabeçalho para as classes de seis elementos `col` em um único `colgroup`. A tabela mantém `width: 100%`, `table-layout: fixed`, largura mínima de 1120px e a mesma distribuição inicial. Nenhum `th` ou `td` possui uma definição independente de largura.

O cabeçalho, seus estilos e a lógica da paginação não foram alterados nesta rodada. A região externa continua reservando 468px no desktop, inclusive na última página com dois registros, sem linhas fictícias. O `colgroup` é desativado abaixo de 1024px para preservar o layout responsivo existente.

## Medidas após a alteração

### chromium

Variação máxima entre todos os cliques: **0px**. Altura do cabeçalho: **44px**. Fonte computada: `700 13px / 19.5px Inter, Arial, Helvetica, sans-serif`.

| Página | Coluna | left | width | right | height |
|---|---|---:|---:|---:|---:|
| 1 | Artesão | 273.00 | 221.39 | 494.39 | 44.00 |
| 1 | Empreendimento | 494.39 | 184.50 | 678.89 | 44.00 |
| 1 | Categoria / Técnica | 678.89 | 184.50 | 863.39 | 44.00 |
| 1 | Contato | 863.39 | 258.30 | 1121.69 | 44.00 |
| 1 | Status | 1121.69 | 110.69 | 1232.38 | 44.00 |
| 1 | Ações | 1232.38 | 270.63 | 1503.00 | 44.00 |
| 2 | Artesão | 273.00 | 221.39 | 494.39 | 44.00 |
| 2 | Empreendimento | 494.39 | 184.50 | 678.89 | 44.00 |
| 2 | Categoria / Técnica | 678.89 | 184.50 | 863.39 | 44.00 |
| 2 | Contato | 863.39 | 258.30 | 1121.69 | 44.00 |
| 2 | Status | 1121.69 | 110.69 | 1232.38 | 44.00 |
| 2 | Ações | 1232.38 | 270.63 | 1503.00 | 44.00 |
| 3 | Artesão | 273.00 | 221.39 | 494.39 | 44.00 |
| 3 | Empreendimento | 494.39 | 184.50 | 678.89 | 44.00 |
| 3 | Categoria / Técnica | 678.89 | 184.50 | 863.39 | 44.00 |
| 3 | Contato | 863.39 | 258.30 | 1121.69 | 44.00 |
| 3 | Status | 1121.69 | 110.69 | 1232.38 | 44.00 |
| 3 | Ações | 1232.38 | 270.63 | 1503.00 | 44.00 |

A repetição das páginas 2 e 1 produziu as mesmas medidas. A identidade da tabela, do `thead` e do `colgroup` foi preservada; o observador não registrou nenhuma mutação no cabeçalho. Padding, fonte, line-height, bordas e box-sizing foram comparados e permaneceram iguais. As células do corpo alinharam-se com os limites dos cabeçalhos, com tolerância inferior a 0,5px.

### firefox

Variação máxima entre todos os cliques: **0px**. Altura do cabeçalho: **44px**. Fonte computada: `700 13px / 19.5px Inter, Arial, Helvetica, sans-serif`.

| Página | Coluna | left | width | right | height |
|---|---|---:|---:|---:|---:|
| 1 | Artesão | 273.00 | 221.40 | 494.40 | 44.00 |
| 1 | Empreendimento | 494.40 | 184.50 | 678.90 | 44.00 |
| 1 | Categoria / Técnica | 678.90 | 184.50 | 863.40 | 44.00 |
| 1 | Contato | 863.40 | 258.30 | 1121.70 | 44.00 |
| 1 | Status | 1121.70 | 110.70 | 1232.40 | 44.00 |
| 1 | Ações | 1232.40 | 270.60 | 1503.00 | 44.00 |
| 2 | Artesão | 273.00 | 221.40 | 494.40 | 44.00 |
| 2 | Empreendimento | 494.40 | 184.50 | 678.90 | 44.00 |
| 2 | Categoria / Técnica | 678.90 | 184.50 | 863.40 | 44.00 |
| 2 | Contato | 863.40 | 258.30 | 1121.70 | 44.00 |
| 2 | Status | 1121.70 | 110.70 | 1232.40 | 44.00 |
| 2 | Ações | 1232.40 | 270.60 | 1503.00 | 44.00 |
| 3 | Artesão | 273.00 | 221.40 | 494.40 | 44.00 |
| 3 | Empreendimento | 494.40 | 184.50 | 678.90 | 44.00 |
| 3 | Categoria / Técnica | 678.90 | 184.50 | 863.40 | 44.00 |
| 3 | Contato | 863.40 | 258.30 | 1121.70 | 44.00 |
| 3 | Status | 1121.70 | 110.70 | 1232.40 | 44.00 |
| 3 | Ações | 1232.40 | 270.60 | 1503.00 | 44.00 |

A repetição das páginas 2 e 1 produziu as mesmas medidas. A identidade da tabela, do `thead` e do `colgroup` foi preservada; o observador não registrou nenhuma mutação no cabeçalho. Padding, fonte, line-height, bordas e box-sizing foram comparados e permaneceram iguais. As células do corpo alinharam-se com os limites dos cabeçalhos, com tolerância inferior a 0,5px.

## Verificações adicionais

- A geometria da página 1 foi comparada antes e depois da alteração: diferença inferior a 0,5px para left, right, width e height de todos os cabeçalhos.
- Posições e dimensões da borda externa, filtros, paginação, header, sidebar e footer permaneceram iguais durante a sequência.
- Dados reais e dados simulados com nomes, empreendimentos, e-mails e etiquetas extensos foram testados em 1536, 1280 e 1024px, repetindo toda a sequência.
- A apresentação em cards foi conferida em 768 e 390px, sem overflow horizontal da página.
- Quando as seis colunas não cabem no desktop intermediário, permanece a rolagem interna já existente, sem corte de ações ou expansão da página.
- Na tabela, apenas as linhas visíveis do `tbody` mudam durante a paginação. O contador e o estado ativo dos controles continuam sendo atualizados normalmente; o cabeçalho e as colunas não são reconstruídos nem recebem estilos por JavaScript.

## Conferência no navegador do usuário

Como o servidor permite uma hora de cache, faça uma recarga forçada (`Ctrl + Shift + R`) antes da comparação. Para desenvolvimento futuro, `npx http-server -c-1` desativa o cache; o servidor em execução não foi interrompido ou reconfigurado por esta tarefa.
