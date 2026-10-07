# Descrição do Projeto
O Portal do Artesão do Liceu de Ofícios é uma plataforma digital de divulgação e catálogo voltada à valorização do artesanato local, dos saberes tradicionais e dos profissionais vinculados ao Liceu em Curitiba.

**Propósito Principal:** Servir como vitrine digital centralizada para que artesãos apresentem suas histórias, técnicas e produtos, superando barreiras tecnológicas na transição para o ambiente digital.

### Escopo Funcional (Ciclo 1 / MVP):

- Listagem pública de artesãos com cards interativos e modais de detalhes.

- Área de cadastro e login para artesãos e para a equipe administrativa do Liceu.

- Cadastro de produtos/trabalhos pelos artesãos com fluxo de moderação (necessidade de aprovação prévia pelo Liceu antes de irem ao ar).

- Filtros por categorias, nichos e técnicas com opções pré-definidas.

# Stack Tecnológica

- Linguagens Base: HTML5 semântico, CSS3 e JavaScript puro.
- Arquitetura: Sem utilização de frameworks de front-end (como React, Vue ou Angular) e sem etapas de build obrigatórias (o código roda nativamente direto no navegador).
- Estilização e Identidade Visual: Adesão estrita à identidade visual oficial do Liceu de Ofícios de Curitiba (utilizando variáveis de cores e tipografia padronizadas via CSS).

# Estratégia de Navegação
A aplicação funcionará como uma Single Page Application (SPA)

**Principais / Rotas:**
- index.html — Home / Vitrine principal.

- login.html — Tela unificada de acesso (Artesão / Liceu).

- cadastro.html — Registro inicial de novos artesãos (Nome, e-mail e senha).

- painel-artesao.html — Área restrita para o artesão gerenciar seu perfil e cadastrar novos trabalhos.

- painel-liceu.html — Área restrita para a equipe do Liceu aprovar/rejeitar os trabalhos submetidos.

- Outras rotas específicas.

# Convenções
- Pull Requests (PRs): Todo merge para a main deve passar por revisão cruzada de pelo menos um colega da equipe
- Branch Principal: main (código estável correspondente às entregas oficiais).
- Branches de Trabalho: Nomes descritivos baseados na tarefa, ex: feat/modal-artesao, fix/responsividade-cards, refactor/fluxo-aprovacao.

# Fonte de Dados
Como o projeto acadêmico foca inicialmente na interface e na lógica de front-end com Padrões Web, os dados da aplicação (artesãos, produtos, status de aprovação e categorias) serão persistidos em um arquivo .json.

Para simular o comportamento de banco de dados e persistência entre telas sem back-end, utilizaremos o localStorage do navegador integrado às funções do JavaScript.

# Hospedagem

Necessário definir com o Liceu.