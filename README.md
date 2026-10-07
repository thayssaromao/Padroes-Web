# Portal do Artesão - Liceu de Ofícios de Curitiba

Projeto de extensão acadêmica desenvolvido para a disciplina de **Padrões Web** da UTFPR. O objetivo é criar uma plataforma digital de divulgação e catálogo para os artesãos do Liceu de Ofícios.
[Documento de Especificação](/Users/cogeti-gp/Documents/Padroes-Web/docs/ESPECIFICACOES.md)

## 🚀 Tecnologias Utilizadas

- HTML5 Semântico
- CSS3
- JavaScript Puro (Vanilla ES Modules)

---

## 🛠️ Como Rodar o Projeto Localmente

Como o projeto utiliza **ES Modules** em JavaScript (`type="module"`), os navegadores modernos bloqueiam a execução direta dos arquivos via protocolo local (`file:///`) por questões de segurança (CORS). Portanto, é necessário utilizar um servidor local estático.

Aqui estão as duas principais formas de rodar o projeto:

### Opção 1: Usando Node.js (`http-server`) — Recomendado
Caso você tenha o Node.js instalado no seu computador:

1. Abra o terminal na pasta raiz do projeto.
2. Execute o comando abaixo (o npm perguntará se deseja instalar o pacote, basta digitar `y`):
   ```bash
   npx http-server

## Opção 2: Usando o Live Server (VS Code)
Se você estiver utilizando o Visual Studio Code:

1. Instale a extensão Live Server (criada por Ritwick Dey) no VS Code.

2. Abra a pasta do projeto no editor.

3. Clique com o botão direito no arquivo index.html e selecione "Open with Live Server".

4. O navegador abrirá automaticamente no endereço local sincronizado.
