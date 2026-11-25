# Refinamentos dos painéis e base JSON — 24/11/2026

A seleção da sidebar usa rosa suave com ícone magenta; os seletores compartilhados usam azul suave e confirmação visual. Métricas e apoio administrativo recuperam cores em detalhes, com superfícies neutras. Miniaturas dos pendentes são quadradas. O perfil de consulta tem largura máxima de 600px, identidade agrupada e rolagem em telas pequenas.

`data/banco.json` reúne as cinco coleções anteriores, identidades e configurações de demonstração. O carregamento compartilha uma requisição, valida o formato, isola leituras e permite nova tentativa após falha. Contas existentes, dados locais e chaves de sessão foram preservados. As regras continuam em JavaScript e as alterações dos formulários ficam no navegador; o JSON não é um servidor de backend.

Validação: 14 testes de dados; contratos de 20 rotas e 26 HTML; fluxos, regressões e acessibilidade em Chromium e Firefox; 147 combinações responsivas e 42 verificações axe sem violações detectadas. Verificações adicionais confirmaram proporção das fotos, limites do modal, seleção/remoção de técnica e uma requisição à base por documento. As cinco coleções originais foram comparadas integralmente com a revisão anterior.

Comparação local: `http://localhost:8080/comparacoes/refinamentos/`. Evidências resumidas em `REFINAMENTOS_PAINEIS_EVIDENCIAS.json`. Os testes automáticos não substituem avaliação humana de acessibilidade.
