/*
"Banco de dados" em arquivos JSON: cada coleção é um arquivo em `db/`.

- `data/` guarda os dados iniciais (semente), versionados no git.
- `db/` é o banco que o servidor lê e grava. Fica fora do git e é criado
  a partir de `data/` na primeira execução (ou com `npm run resetar`).

As gravações de uma mesma coleção passam por uma fila, então duas
requisições simultâneas nunca sobrescrevem uma à outra. Cada gravação
escreve num arquivo temporário e depois o renomeia, para que um arquivo
nunca fique pela metade se o servidor cair no meio da escrita.
*/
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const PASTA_SEMENTE = path.join(RAIZ, 'data');
const PASTA_BANCO = path.join(RAIZ, 'db');

export const COLECOES = ['usuarios', 'produtos', 'tecnicas', 'nichos', 'categorias'];

export class ErroBanco extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const arquivoDa = (colecao) => path.join(PASTA_BANCO, `${colecao}.json`);

/** Cria `db/` a partir de `data/`. Com `resetar`, descarta o banco atual. */
export async function inicializarBanco({ resetar = false } = {}) {
  await mkdir(PASTA_BANCO, { recursive: true });
  for (const colecao of COLECOES) {
    if (resetar || !existsSync(arquivoDa(colecao))) {
      await copyFile(path.join(PASTA_SEMENTE, `${colecao}.json`), arquivoDa(colecao));
    }
  }
}

/* ===== Leitura e gravação dos arquivos ===== */

async function ler(colecao) {
  return JSON.parse(await readFile(arquivoDa(colecao), 'utf8'));
}

async function gravar(colecao, itens) {
  const destino = arquivoDa(colecao);
  const temporario = `${destino}.${process.pid}.tmp`;
  await writeFile(temporario, JSON.stringify(itens, null, 2) + '\n');
  await rename(temporario, destino);
}

const filas = new Map();

/**
 * Lê a coleção, deixa `alterar` modificar o array e grava o resultado.
 * Alterações da mesma coleção rodam uma de cada vez.
 */
function alterarColecao(colecao, alterar) {
  const anterior = filas.get(colecao) ?? Promise.resolve();
  const atual = anterior.then(async () => {
    const itens = await ler(colecao);
    const resultado = alterar(itens);
    await gravar(colecao, itens);
    return resultado;
  });
  filas.set(colecao, atual.catch(() => {}));
  return atual;
}

function gerarId(colecao) {
  return `${colecao}_${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
}

function garantirUnicos(itens, item, campos) {
  for (const campo of campos) {
    const valor = item[campo];
    if (valor == null) continue;
    const repetido = itens.some(
      (outro) => outro.id !== item.id && String(outro[campo]).toLowerCase() === String(valor).toLowerCase()
    );
    if (repetido) throw new ErroBanco(409, `Já existe um registro com este ${campo}.`);
  }
}

/* ===== Operações ===== */

/**
 * Lista os itens de uma coleção. Cada filtro compara um campo por igualdade;
 * se o campo for um array, basta conter o valor.
 * Ex.: { status: 'publicado', tecnicaIds: 'teste_tecnica_1' }
 */
export async function listar(colecao, filtros = {}) {
  const condicoes = Object.entries(filtros);
  return (await ler(colecao)).filter((item) =>
    condicoes.every(([campo, valor]) =>
      Array.isArray(item[campo]) ? item[campo].includes(valor) : String(item[campo]) === valor
    )
  );
}

export async function buscar(colecao, id) {
  return (await ler(colecao)).find((item) => item.id === id) ?? null;
}

/** Insere um item novo. O `id` é sempre gerado pelo banco. */
export function inserir(colecao, dados, { unicos = [] } = {}) {
  return alterarColecao(colecao, (itens) => {
    const item = { ...dados, id: gerarId(colecao) };
    garantirUnicos(itens, item, unicos);
    itens.push(item);
    return item;
  });
}

/**
 * Substitui o item inteiro. Campos listados em `preservar` que não vierem
 * em `dados` são mantidos do item antigo (ex.: `senhaHash`).
 */
export function substituir(colecao, id, dados, { unicos = [], preservar = [] } = {}) {
  return alterarColecao(colecao, (itens) => {
    const indice = itens.findIndex((item) => item.id === id);
    if (indice < 0) return null;

    const item = { ...dados, id };
    for (const campo of preservar) {
      if (!(campo in item) && campo in itens[indice]) item[campo] = itens[indice][campo];
    }
    garantirUnicos(itens, item, unicos);
    itens[indice] = item;
    return item;
  });
}

/** Altera só os campos enviados, mantendo os demais. */
export function atualizar(colecao, id, campos, { unicos = [] } = {}) {
  return alterarColecao(colecao, (itens) => {
    const indice = itens.findIndex((item) => item.id === id);
    if (indice < 0) return null;

    const item = { ...itens[indice], ...campos, id };
    garantirUnicos(itens, item, unicos);
    itens[indice] = item;
    return item;
  });
}

/** Remove um item. Retorna `true` se ele existia. */
export function remover(colecao, id) {
  return alterarColecao(colecao, (itens) => {
    const indice = itens.findIndex((item) => item.id === id);
    if (indice < 0) return false;
    itens.splice(indice, 1);
    return true;
  });
}
