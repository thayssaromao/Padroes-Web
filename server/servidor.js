/*
Servidor do Portal do Artesão.

- Serve os arquivos do site (index.html, css/, js/, pages/, assets/).
- Expõe a API REST em /api, que lê e grava o banco JSON (server/banco.js).

Rotas da API (documentadas em docs/MODELO-DADOS.md):
  GET    /api/<colecao>?campo=valor   lista (com filtros opcionais)
  GET    /api/<colecao>/<id>          busca um item
  POST   /api/<colecao>               cria (o id é gerado pelo servidor)
  PUT    /api/<colecao>/<id>          substitui o item inteiro
  PATCH  /api/<colecao>/<id>          altera só os campos enviados
  DELETE /api/<colecao>/<id>          remove
  POST   /api/login                   { email, senha } -> usuário
*/
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import {
  COLECOES, ErroBanco, inicializarBanco,
  listar, buscar, inserir, substituir, atualizar, remover,
} from './banco.js';

const PORTA = Number(process.env.PORTA ?? 3000);
const RAIZ = path.resolve(import.meta.dirname, '..');
const PASTAS_PUBLICAS = ['css', 'js', 'pages', 'assets'];
const LIMITE_CORPO = 10 * 1024 * 1024; // 10 MB, para caber imagens em data URL

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/* ===== Respostas ===== */

function responderJson(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': TIPOS['.json'] });
  res.end(JSON.stringify(corpo));
}

function responderErro(res, status, mensagem) {
  responderJson(res, status, { erro: mensagem });
}

async function lerCorpo(req) {
  const partes = [];
  let tamanho = 0;
  for await (const parte of req) {
    tamanho += parte.length;
    if (tamanho > LIMITE_CORPO) throw new ErroBanco(413, 'Corpo da requisição muito grande.');
    partes.push(parte);
  }

  let corpo;
  try {
    corpo = JSON.parse(Buffer.concat(partes).toString('utf8'));
  } catch {
    throw new ErroBanco(400, 'O corpo da requisição precisa ser um JSON válido.');
  }
  if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw new ErroBanco(400, 'O corpo da requisição precisa ser um objeto JSON.');
  }
  return corpo;
}

/* ===== Usuários e senhas ===== */

const hashSenha = (senha) => createHash('sha256').update(String(senha)).digest('hex');

/** O hash da senha nunca sai do servidor. */
function semSenha(colecao, item) {
  if (colecao !== 'usuarios' || !item) return item;
  const { senhaHash, ...resto } = item;
  return resto;
}

/** Troca `senha` (texto) por `senhaHash`. O cliente não pode enviar o hash. */
function prepararUsuario({ senha, senhaHash, ...dados }) {
  if (senha !== undefined) {
    if (typeof senha !== 'string' || senha.length < 6) {
      throw new ErroBanco(400, 'A senha precisa ter pelo menos 6 caracteres.');
    }
    dados.senhaHash = hashSenha(senha);
  }
  return dados;
}

async function login(req, res) {
  const { email, senha } = await lerCorpo(req);
  const usuarios = await listar('usuarios');
  const usuario = usuarios.find(
    (u) => typeof email === 'string' && u.email.toLowerCase() === email.toLowerCase()
  );

  const esperado = Buffer.from(usuario?.senhaHash ?? '0'.repeat(64), 'hex');
  const recebido = Buffer.from(hashSenha(senha ?? ''), 'hex');
  if (!usuario || !timingSafeEqual(esperado, recebido)) {
    return responderErro(res, 401, 'E-mail ou senha incorretos.');
  }
  responderJson(res, 200, semSenha('usuarios', usuario));
}

/* ===== API ===== */

async function tratarApi(req, res, url) {
  const [, , colecao, id, ...sobra] = url.pathname.split('/').map(decodeURIComponent);

  if (colecao === 'login' && !id && req.method === 'POST') return login(req, res);
  if (!COLECOES.includes(colecao) || sobra.length > 0) {
    return responderErro(res, 404, 'Rota não encontrada.');
  }

  const ehUsuarios = colecao === 'usuarios';
  const opcoes = ehUsuarios ? { unicos: ['email'], preservar: ['senhaHash'] } : {};
  const preparar = (dados) => (ehUsuarios ? prepararUsuario(dados) : dados);

  if (!id) {
    if (req.method === 'GET') {
      const itens = await listar(colecao, Object.fromEntries(url.searchParams));
      return responderJson(res, 200, itens.map((item) => semSenha(colecao, item)));
    }
    if (req.method === 'POST') {
      const dados = preparar(await lerCorpo(req));
      if (ehUsuarios && !dados.senhaHash) throw new ErroBanco(400, 'Informe a senha do usuário.');
      const item = await inserir(colecao, dados, opcoes);
      res.setHeader('Location', `/api/${colecao}/${encodeURIComponent(item.id)}`);
      return responderJson(res, 201, semSenha(colecao, item));
    }
    res.setHeader('Allow', 'GET, POST');
    return responderErro(res, 405, 'Método não permitido.');
  }

  let resultado;
  switch (req.method) {
    case 'GET':
      resultado = await buscar(colecao, id);
      break;
    case 'PUT':
      resultado = await substituir(colecao, id, preparar(await lerCorpo(req)), opcoes);
      break;
    case 'PATCH':
      resultado = await atualizar(colecao, id, preparar(await lerCorpo(req)), opcoes);
      break;
    case 'DELETE':
      if (!(await remover(colecao, id))) return responderErro(res, 404, 'Item não encontrado.');
      res.writeHead(204);
      return res.end();
    default:
      res.setHeader('Allow', 'GET, PUT, PATCH, DELETE');
      return responderErro(res, 405, 'Método não permitido.');
  }

  if (!resultado) return responderErro(res, 404, 'Item não encontrado.');
  responderJson(res, 200, semSenha(colecao, resultado));
}

/* ===== Arquivos do site ===== */

async function servirArquivo(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return responderErro(res, 405, 'Método não permitido.');
  }

  const relativo = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
  const caminho = path.resolve(RAIZ, relativo);
  const pasta = path.relative(RAIZ, caminho).split(path.sep)[0];

  // Só index.html e as pastas públicas. Bloqueia data/, db/, server/, .git etc.
  const permitido = relativo === 'index.html' || PASTAS_PUBLICAS.includes(pasta);
  if (!permitido || !caminho.startsWith(RAIZ + path.sep)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Não encontrado');
  }

  try {
    const conteudo = await readFile(caminho);
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(caminho).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : conteudo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}

/* ===== Início ===== */

const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      await tratarApi(req, res, url);
    } else {
      await servirArquivo(req, res, url);
    }
  } catch (erro) {
    if (erro instanceof ErroBanco) return responderErro(res, erro.status, erro.message);
    if (erro instanceof URIError) return responderErro(res, 400, 'URL inválida.');
    console.error(erro);
    if (!res.headersSent) responderErro(res, 500, 'Erro interno do servidor.');
  }
});

await inicializarBanco();
servidor.listen(PORTA, () => {
  console.log(`Portal do Artesão rodando em http://localhost:${PORTA}`);
});
