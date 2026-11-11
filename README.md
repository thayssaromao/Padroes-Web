# Portal do Artesão - Liceu de Ofícios de Curitiba

Projeto de extensão acadêmica desenvolvido para a disciplina de **Padrões Web** da UTFPR. O objetivo é criar uma plataforma digital de divulgação e catálogo para os artesãos do Liceu de Ofícios.
[Documento de Especificação](/Users/cogeti-gp/Documents/Padroes-Web/docs/ESPECIFICACOES.md)

## 🚀 Tecnologias Utilizadas

- HTML5 Semântico
- CSS3
- JavaScript Puro (Vanilla ES Modules)

---

## 🛠️ Como Rodar o Projeto Localmente

O projeto tem um servidor Node.js (sem dependências externas) que entrega o site e a API de dados. Os dados ficam em arquivos JSON. É preciso ter o **Node.js 20.11 ou superior**.

1. Abra o terminal na pasta raiz do projeto.
2. Execute:
   ```bash
   npm start
   ```
3. Acesse `http://localhost:3000`.

Outros comandos:

- `npm run dev`: igual ao `start`, mas reinicia o servidor sozinho quando um arquivo de `server/` muda.
- `npm run resetar`: apaga as alterações feitas pelo site e volta aos dados iniciais de `data/`.
- Para usar outra porta: `PORTA=8080 npm start`.

> Servidores só de arquivos estáticos (`npx http-server`, Live Server) não servem mais: eles não respondem às rotas `/api` e o site fica sem dados.

Detalhes do banco e da API em [docs/MODELO-DADOS.md](docs/MODELO-DADOS.md).
