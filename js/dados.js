/*
Acesso aos dados do portal pelo navegador.

Os dados ficam no servidor (server/servidor.js), num banco em arquivos JSON.
Este módulo só faz as requisições para a API em /api. Todas as funções que
falam com o servidor são assíncronas: use `await`.

Estrutura documentada em docs/MODELO-DADOS.md.
*/
const API = '/api';

export const COLECOES = ['usuarios', 'produtos', 'tecnicas', 'nichos', 'categorias'];

export const PERFIS = Object.freeze({
  ADMIN: 'admin',
  ARTESAO: 'artesao',
});

export const STATUS = Object.freeze({
  RASCUNHO: 'rascunho',
  AGUARDANDO: 'aguardando',
  PUBLICADO: 'publicado',
  REJEITADO: 'rejeitado',
});

export const ROTULOS_STATUS = Object.freeze({
  [STATUS.RASCUNHO]: 'Rascunho',
  [STATUS.AGUARDANDO]: 'Aguardando aprovação',
  [STATUS.PUBLICADO]: 'Publicado',
  [STATUS.REJEITADO]: 'Rejeitado',
});

/** Erro devolvido pela API. `status` é o código HTTP (404, 409...). */
export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

/* ===== Requisições ===== */

async function requisitar(caminho, { metodo = 'GET', corpo } = {}) {
  const opcoes = { method: metodo };
  if (corpo !== undefined) {
    opcoes.headers = { 'Content-Type': 'application/json' };
    opcoes.body = JSON.stringify(corpo);
  }

  const resposta = await fetch(API + caminho, opcoes);
  if (!resposta.ok) {
    const { erro } = await resposta.json().catch(() => ({}));
    throw new ErroApi(resposta.status, erro ?? `Erro ${resposta.status}`);
  }
  return resposta.status === 204 ? null : resposta.json();
}

const caminhoDo = (colecao, id) => `/${colecao}/${encodeURIComponent(id)}`;

/* ===== Acesso genérico ===== */

/**
 * Lista os itens de uma coleção. `filtros` compara campos por igualdade
 * (em campos de array, basta conter o valor).
 * Ex.: listar('produtos', { status: 'publicado', artesaoId: 'teste_artesao_1' })
 */
export function listar(colecao, filtros = {}) {
  const busca = new URLSearchParams(filtros).toString();
  return requisitar(`/${colecao}${busca ? `?${busca}` : ''}`);
}

/** Um item pelo id, ou `null` se não existir. */
export async function buscarPorId(colecao, id) {
  try {
    return await requisitar(caminhoDo(colecao, id));
  } catch (erro) {
    if (erro.status === 404) return null;
    throw erro;
  }
}

/** Cria um item. O servidor gera o `id` e devolve o item criado. */
export function criar(colecao, item) {
  return requisitar(`/${colecao}`, { metodo: 'POST', corpo: item });
}

/** Substitui o item inteiro (campos que não forem enviados somem). */
export function substituir(colecao, id, item) {
  return requisitar(caminhoDo(colecao, id), { metodo: 'PUT', corpo: item });
}

/** Altera só os campos enviados. Ex.: atualizar('produtos', id, { status: 'publicado' }) */
export function atualizar(colecao, id, campos) {
  return requisitar(caminhoDo(colecao, id), { metodo: 'PATCH', corpo: campos });
}

/** Remove um item. */
export function remover(colecao, id) {
  return requisitar(caminhoDo(colecao, id), { metodo: 'DELETE' });
}

/** Cria (sem `id`) ou substitui (com `id`) um item. Retorna o item salvo. */
export function salvar(colecao, item) {
  return item.id ? substituir(colecao, item.id, item) : criar(colecao, item);
}

/* ===== Login ===== */

/**
 * Confere e-mail e senha no servidor. Retorna o usuário (sem a senha) ou
 * lança `ErroApi` com status 401 se estiverem incorretos.
 *
 * Para criar um usuário ou trocar a senha, envie o campo `senha` em texto:
 * o servidor guarda só o hash. Ex.: atualizar('usuarios', id, { senha: 'nova123' })
 */
export function entrar(email, senha) {
  return requisitar('/login', { metodo: 'POST', corpo: { email, senha } });
}

/* ===== Artesãos (área pública) ===== */

/** Remove o e-mail antes de expor um artesão nas telas públicas. */
function semDadosDeLogin({ email, ...publico }) {
  return publico;
}

export async function listarArtesaos() {
  const artesaos = await listar('usuarios', { perfil: PERFIS.ARTESAO });
  return artesaos.map(semDadosDeLogin);
}

export async function buscarArtesao(id) {
  const usuario = await buscarPorId('usuarios', id);
  return usuario?.perfil === PERFIS.ARTESAO ? semDadosDeLogin(usuario) : null;
}

/* ===== Produtos ===== */

export function listarProdutosPublicados() {
  return listar('produtos', { status: STATUS.PUBLICADO });
}

export function listarProdutosDoArtesao(artesaoId) {
  return listar('produtos', { artesaoId });
}

export function listarProdutosAguardando() {
  return listar('produtos', { status: STATUS.AGUARDANDO });
}
