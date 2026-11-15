/*jslint browser */
/**
 * paginas/inicio.js — Home do portal (#/inicio).
 * Guia: docs/DESIGN.md.
 */
import {carregarArtesaos, carregarTrabalhos} from "../dados.js";
import {
    criarCardProduto,
    escaparHtml,
    icone,
    iniciarCarrossel
} from "../componentes.js";

const MAXIMO_DESTAQUES = 4;
const MAXIMO_ARTESAOS = 4;

/**
 * Card mini de artesão (foto redonda, nome e técnica principal).
 * @param {object} artesao registro de data/artesaos.json
 * @returns {string}
 */
function criarCardArtesaoMini(artesao) {
    return (
        "<a class=\"card-artesao-mini\" href=\"#/artesaos\">"
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
 * Persiste o favorito do produto.
 * @param {HTMLButtonElement} ignore botão já com o novo aria-pressed
 */
function salvarFavorito(ignore) {
    // A IMPLEMENTAR: guardar favoritos do visitante (localStorage).
    return;
}

/**
 * Alterna o estado e o ícone de um botão de favorito.
 * @param {HTMLButtonElement} botao
 */
function alternarFavorito(botao) {
    const ativo = botao.getAttribute("aria-pressed") !== "true";
    botao.setAttribute("aria-pressed", String(ativo));
    botao.innerHTML = icone(
        ativo
        ? "mdi:heart"
        : "lucide:heart"
    );
    salvarFavorito(botao);
}

/**
 * Liga os botões de favorito dentro do contêiner (delegação de eventos).
 * @param {HTMLElement} conteiner
 */
function ligarFavoritos(conteiner) {
    conteiner.addEventListener("click", function (evento) {
        const botao = evento.target.closest(".card-produto__favorito");
        if (botao) {
            alternarFavorito(botao);
        }
    });
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
        return criarCardProduto(trabalho);
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
        renderizar(lista, await carga);
    } catch (ignore) {
        mostrarMensagem(lista, falha);
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
            carregarTrabalhos(),
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
