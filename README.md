# Portal do Artesão - Liceu de Ofícios de Curitiba

Projeto de extensão acadêmica desenvolvido para a disciplina de **Padrões Web** da UTFPR. O objetivo é criar uma plataforma digital de divulgação e catálogo para os artesãos do Liceu de Ofícios.
[Documento de Especificação](docs/ESPECIFICACOES.md)

## 🚀 Tecnologias Utilizadas

- HTML5 Semântico
- CSS3
- JavaScript Puro (Vanilla ES Modules)

### Biblioteca externa: Iconify (`iconify-icon` 2.3.0)

Única biblioteca JS do projeto, carregada via CDN no `index.html`. **Justificativa:** os wireframes usam cerca de 50 ícones de linha; o Iconify oferece um *web component* leve que baixa sob demanda apenas os ícones usados, sem etapa de build e sem framework, mantendo o HTML válido no W3C. Detalhes e tabela de ícones em [`docs/DESIGN.md`](docs/DESIGN.md) §6.

## 🎨 Design System

O guia visual e de código está em [`docs/DESIGN.md`](docs/DESIGN.md): tokens, componentes, layouts, padrão de popups e checklist de entrega de cada página. As imagens são placeholders trocáveis: veja [`assets/img/LEIAME.md`](assets/img/LEIAME.md).

---

## 🛠️ Como Rodar o Projeto Localmente

Como o projeto utiliza **ES Modules** em JavaScript (`type="module"`), os navegadores modernos bloqueiam a execução direta dos arquivos via protocolo local (`file:///`) por questões de segurança (CORS). Portanto, é necessário utilizar um servidor local estático.

Aqui estão as duas principais formas de rodar o projeto:

### Opção 1: Usando Node.js (`http-server`) — Recomendado
Caso você tenha o Node.js instalado no seu computador:

1. Abra o terminal na pasta raiz do projeto.
2. Execute o comando abaixo (o npm perguntará se deseja instalar o pacote, basta digitar `y`):
   ```bash
   npx http-server -p 8080 -c-1
   ```

3. Acesse `http://localhost:8080`. A opção `-c-1` desativa o cache do servidor durante o desenvolvimento, evitando arquivos antigos ao trocar de branch.

Se o servidor já estava rodando sem essa opção, encerre-o com `Ctrl+C` e execute novamente o comando acima. Depois faça uma recarga completa no navegador (`Ctrl+Shift+R`) para descartar os arquivos que já estavam em cache.

## Opção 2: Usando o Live Server (VS Code)
Se você estiver utilizando o Visual Studio Code:

1. Instale a extensão Live Server (criada por Ritwick Dey) no VS Code.

2. Abra a pasta do projeto no editor.

3. Clique com o botão direito no arquivo index.html e selecione "Open with Live Server".

4. O navegador abrirá automaticamente no endereço local sincronizado.
5. 
### Opção 3: Usando Python
Caso você tenha o Python instalado no seu computador:

1. Abra o terminal na pasta raiz do projeto.
2. Execute o comando abaixo:
   ```bash
   python3 -m http.server 8000


## Contas e fluxos de demonstração

Este MVP usa dados e autenticação locais. Use apenas dados fictícios.

| Papel | E-mail | Senha |
|---|---|---|
| Liceu | `liceu@exemplo.com` | `liceu123` |
| Artesã (Ana) | `ana@exemplo.com` | `artesao123` |

Os demais artesãos ativos da base inicial usam seus e-mails de `data/artesaos.json` e a senha `artesao123`, até uma redefinição pelo Liceu. Novos cadastros usam o e-mail e a senha provisória definidos no painel administrativo.

O ciclo de envio, moderação e reenvio funciona compartilhando o `localStorage` na mesma origem. “Lembrar de mim” controla a persistência da sessão; os cadastros/trabalhos permanecem locais independentemente dessa opção. Não existe autocadastro público nem backend de autenticação.

Veja [rotas e comportamentos](docs/FLUXOS.md) e [evidências da revisão funcional](docs/REVISAO-FUNCIONAL.md). Para verificar a camada de dados sem instalar dependências:

```bash
node tests/dados.mjs
```
