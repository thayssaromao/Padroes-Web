# Rotas e contratos funcionais do MVP

O roteador resolve o caminho antes do `?` no hash. O layout, a navegação e as permissões são definidos em `js/rotas.js`; recarregamento, histórico e deep links funcionam em hospedagem estática.

| Área | Tela / rota | Entrada e saída | Ações |
|---|---|---|---|
| Pública | Início `#/inicio` | Header, logo, retorno dos painéis → catálogo/perfil/produto | Carrossel, destaques, favoritos e CTAs |
| Pública | Produtos `#/produtos` | Header/Home/Saberes → produto | Busca, categoria/técnica/material/preço, ordenação, grade/lista, paginação, favorito |
| Pública | Produto `#/produto?id=<id>` | Catálogo/Home/relacionados → perfil/Saberes/catálogo | Galeria, miniaturas, favorito, relacionados e estado indisponível |
| Pública | Artesãos `#/artesaos` | Header/Home/produto → modal de perfil | Busca, categorias/técnicas/cidade, ordem, grade/lista, paginação, contatos |
| Pública | Perfil `#/artesaos?id=<id>` | Produto/Home/listagem → fechar modal | Perfil do artesão ativo e links de contato |
| Pública | Saberes `#/saberes` | Header/produto → modal técnico/catálogo | Busca, técnica, categoria, ordem, grade/lista, detalhes e produtos relacionados |
| Pública | Sobre o Liceu `#/o-liceu` | Header/Home → portal | Conteúdo institucional e links existentes |
| Pública | Contato `#/contato` | Header/ajuda/recuperação → portal | Formulário validado, envio Web3Forms, feedback de sucesso/erro |
| Pública | Sobre `#/sobre` | Footer → portal | Informações do projeto/equipe |
| Acesso | Cadastro `#/cadastro` | Login → novo painel | Nome/e-mail/senha/confirmar, perfil inicial pendente e conclusão do perfil |
| Acesso | Login `#/login` (modal) | Entrar/guarda → painel do papel | Credenciais mock, lembrar, mostrar senha, recuperar via contato e fechar |
| Artesão | Início `#/painel-artesao` | Login/sidebar → perfil/trabalhos/status/portal | Resumos calculados, atalhos, últimas publicações |
| Artesão | Perfil `#/painel-artesao/meu-perfil` | Sidebar/dashboard → salvar/cancelar | Dados atuais, nicho/técnicas, contatos, bio, foto e prévia |
| Artesão | Trabalhos `#/painel-artesao/meus-trabalhos` | Sidebar/dashboard/formulário → editar/status/produto | Busca/filtros/ordem, paginação, grade/lista, menu, duplicar e exclusão permitida |
| Artesão | Novo/editar `#/painel-artesao/novo-trabalho` | Sidebar/trabalhos/motivo → rascunhos/status | Dados, imagens, preço opcional, rascunho, envio, cancelamento confirmado; edição recebe `?id=` |
| Artesão | Status `#/painel-artesao/status-publicacoes` | Sidebar/envio → motivo/edição/produto | Resumos, busca/status/ordem, motivo, reenvio e ações conforme estado |
| Liceu | Início `#/painel-liceu` | Login/sidebar → pendentes/cadastro/artesãos | Resumos reais, trabalhos pendentes e atalhos |
| Liceu | Artesãos `#/painel-liceu/artesaos` | Sidebar/cadastro → perfil/edição/acesso | Busca/filtros/ordem, paginação, ativar/desativar, redefinir senha |
| Liceu | Cadastro `#/painel-liceu/cadastrar-artesao` | Sidebar/dashboard → listagem | Nome/e-mail, senha/confirmar, perfil inicial, nicho/técnicas, contatos e cancelar |
| Liceu | Pendentes `#/painel-liceu/trabalhos-pendentes` | Sidebar/dashboard → modal de análise | Busca/filtros/ordem/paginação, métricas, aprovar ou rejeitar com motivo |
| Liceu | Publicações `#/painel-liceu/publicacoes` | Sidebar → detalhes/edição | Busca/filtros/ordem/paginação, ocultar/republicar, excluir com confirmação |
| Liceu | Configurações `#/painel-liceu/configuracoes` | Sidebar → consulta | Fora do MVP: controles desabilitados e listas predefinidas consultáveis |
| Compartilhada | Topbar/sidebar/footer | Painéis → perfil/painel/ajuda/sobre/portal | Resumo de notificações baseado nos dados, menu da conta, gaveta móvel e saída confirmada |
| Fallback | Hash não registrado | Qualquer link desconhecido → início | Página não encontrada |

## Regras de dados e publicação

- Uma publicação só aparece no portal quando está `publicado` e seu artesão está `ativo`. Ocultação e desativação retiram a visibilidade pública, sem apagar dados do artesão.
- Aprovação/rejeição são exclusivas do Liceu e só se aplicam a `em-analise`/`reenviado`. Rejeição exige motivo; reenvio limpa o motivo anterior da decisão atual e retorna à fila.
- O artesão só altera seu perfil e seus trabalhos. Em análise, a edição fica bloqueada. Duplicar gera novo rascunho. Salvar publicado/oculto devolve à análise; não mantém uma cópia pública anterior.
- O salvamento local conserva imagens, dados e estados no reload. Cotas são limitadas pelo navegador; erro de escrita mantém os dados do formulário para correção.
- Notificações apresentam o estado atual dos trabalhos, sem envio em tempo real ou histórico de notificações de servidor. Os diálogos reutilizam a anatomia compartilhada do design system, inclusive para as ações da topbar.

## Acesso e apresentação compartilhada

“Lembrar de mim” mantém apenas a identidade mock em `localStorage`; sem marcar, a identidade fica em `sessionStorage`. Logout limpa ambos. Senhas não fazem parte da sessão; credenciais provisórias usam PBKDF2-SHA-256 com salt aleatório, e registros antigos são migrados sem excluir os dados locais. Essa derivação não transforma o mock em autenticação de servidor.

Campos de senha (login, provisória, confirmação e redefinição) usam o mesmo controle: `eye-off`/“Mostrar senha” quando ocultos e `eye`/“Ocultar senha” quando visíveis, com `title`, `aria-label`, `aria-pressed` e `aria-controls` atualizados. O reset do formulário restaura o estado oculto.

Status são badges estáticos com ícone; ações permanecem em botões distintos. Modais de visualização e análise compartilham a apresentação de imagens, artesão, status, chips, descrição e metadados. Os detalhes dos padrões reutilizáveis estão em [DESIGN.md](DESIGN.md).

## Fora do MVP e dependências

Não existem venda/checkout, permissões administrativas configuráveis, edição dinâmica de taxonomias ou recuperação automática por e-mail. Dados entre dispositivos, autenticação segura, envio de credenciais e armazenamento de mídia em servidor exigem backend. Conteúdo institucional definitivo, fotos reais e vídeo dependem da equipe/Liceu; a paleta digital proposta está documentada no design system.


## Cadastro e compatibilidade dos dados locais

O cadastro público valida nome, e-mail único e senha de 8 a 12 caracteres,
com número e símbolo. Cria o perfil inicialmente inativo e pendente, com
acesso ao painel para completá-lo. Ao salvar categoria e técnica, ele se
ativa e pode aparecer no portal. Desativação administrativa revoga o acesso
mesmo quando a conta se originou do autocadastro.

Cadastro público e administrativo usam a base `liceu:base:v1`, com
credenciais derivadas por PBKDF2. Contas e trabalhos das antigas chaves
`liceu:artesaos`, `liceu:usuarios` e `liceu:trabalhos` são incorporados na
leitura, preservando as chaves originais. Registros já atualizados na base
compartilhada têm prioridade, inclusive exclusões e redefinições de senha.
