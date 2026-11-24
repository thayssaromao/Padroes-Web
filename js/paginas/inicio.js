/*jslint browser */
/**
 * paginas/inicio.js — Home do portal (#/inicio).
 * Guia: docs/DESIGN.md.
 */
import {carregarArtesaos} from "../dados.js";
import {
    carregarVitrine,
    criarCardPublico,
    ligarFavoritos
} from "./publico.js";
import {
    escaparHtml,
    iniciarCarrossel
} from "../componentes.js";

const MAXIMO_DESTAQUES = 4;
const MAXIMO_ARTESAOS = 4;

/**
 * Card mini de artesão (foto redonda, nome e técnica principal).
 * @param {object} artesao registro de data/banco.json (artesaos)
 * @returns {string}
 */
function criarCardArtesaoMini(artesao) {
    return (
        "<a class=\"card-artesao-mini\" href=\"#/artesaos?id="
        + encodeURIComponent(artesao.id) + "\">"
        + `<img src="${escaparHtml(artesao.foto)}"`
        + ` alt="Foto de ${escaparHtml(artesao.nome)}"`
        + " width=\"96\" height=\"96\" loading=\"lazy\">"
        + "<span class=\"pilha\">"
        + "<span class=\"card-artesao-mini__nome\">"
        + escaparHtml(artesao.nome) + "</span>"
        + "<span class=\"texto-suave texto-pequeno\">"
        + escaparHtml(artesao.tecnicas[0]) + "</span>"
        + "</span></a>"
    );
}

/**
 * Mostra uma mensagem simples no lugar da lista.
 * @param {HTMLElement} lista
 * @param {string} mensagem
 */
function mostrarMensagem(lista, mensagem) {
    lista.innerHTML = (
        "<p class=\"texto-suave inicio-vazio\">"
        + escaparHtml(mensagem) + "</p>"
    );
}

/**
 * Renderiza os produtos publicados em destaque.
 * @param {HTMLElement} lista
 * @param {Array<object>} trabalhos
 */
function renderizarDestaques(lista, trabalhos) {
    const destaques = trabalhos.filter(function (trabalho) {
        return trabalho.status === "publicado" && trabalho.destaque === true;
    }).slice(0, MAXIMO_DESTAQUES);
    if (destaques.length === 0) {
        mostrarMensagem(lista, "Nenhum produto em destaque no momento.");
        return;
    }
    lista.innerHTML = destaques.map(function (trabalho) {
        return criarCardPublico(trabalho);
    }).join("");
}

/**
 * Renderiza os primeiros artesãos ativos.
 * @param {HTMLElement} lista
 * @param {Array<object>} artesaos
 */
function renderizarArtesaos(lista, artesaos) {
    const ativos = artesaos.filter(function (artesao) {
        return artesao.status === "ativo";
    }).slice(0, MAXIMO_ARTESAOS);
    if (ativos.length === 0) {
        mostrarMensagem(lista, "Nenhum artesão ativo no momento.");
        return;
    }
    lista.innerHTML = ativos.map(criarCardArtesaoMini).join("");
}

/**
 * Carrega dados e renderiza uma seção, com mensagem própria em caso de erro.
 * @param {Promise<Array<object>>} carga
 * @param {HTMLElement} lista
 * @param {function} renderizar
 * @param {string} falha mensagem de erro da seção
 * @returns {Promise<void>}
 */
async function preencherSecao(carga, lista, renderizar, falha) {
    try {
        const dados = await carga;
        if (lista.isConnected) {
            renderizar(lista, dados);
        }
    } catch (ignore) {
        if (lista.isConnected) {
            mostrarMensagem(lista, falha);
        }
    }
}

/**
 * Liga a Home: carrossel, produtos em destaque e artesãos.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 * @returns {Promise<void>}
 */
async function iniciarInicio(raiz) {
    const produtos = raiz.querySelector("#inicio-produtos");
    const artesaos = raiz.querySelector("#inicio-artesaos-lista");

    iniciarCarrossel(raiz.querySelector(".carrossel"));
    ligarFavoritos(produtos);
    await Promise.all([
        preencherSecao(
            carregarVitrine().then(function (vitrine) {
                return vitrine.trabalhos;
            }),
            produtos,
            renderizarDestaques,
            "Não foi possível carregar os produtos em destaque."
        ),
        preencherSecao(
            carregarArtesaos(),
            artesaos,
            renderizarArtesaos,
            "Não foi possível carregar os artesãos."
        )
    ]);
}

export {
    iniciarInicio
};
