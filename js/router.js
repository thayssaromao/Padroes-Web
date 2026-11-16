/*jslint browser */
/**
 * router.js — ponto de entrada da SPA (roteamento por hash).
 *
 * 1. Lê o caminho após o "#" e encontra a rota em js/rotas.js.
 * 2. Aplica a guarda das áreas restritas.
 * 3. Monta o layout (portal ou painel) se ele mudou.
 * 4. Carrega a parcial HTML em <main id="conteudo">.
 * 5. Chama a função iniciar da página, se houver.
 *
 * Guia: docs/ESPECIFICACOES.md (Estratégia de Navegação) e
 * docs/DESIGN.md §4 e §10.
 */

import {PAINEIS, ROTA_NAO_ENCONTRADA, ROTAS} from "./rotas.js";
import {
    atualizarMenuPainel,
    atualizarNavPortal,
    fecharGavetas,
    iniciarMenuPortal,
    montarPainel
} from "./layout.js";
import {obterSessao, sessaoDemonstracao} from "./dados.js";
import {abrirLogin} from "./paginas/login.js";

/**
 * Guarda das áreas restritas. Fica desligada até a tela de login existir;
 * enquanto isso os painéis usam uma sessão de demonstração.
 */
const GUARDA_ATIVA = false;
const CAMINHO_PADRAO = "/inicio";
const CAMINHO_LOGIN = "/login";

const raiz = document.getElementById("raiz");
let layoutAtual = "";
let primeiraCarga = true;
let navegacao = 0;
let caminhoAnterior = CAMINHO_PADRAO;

/** @returns {string} caminho atual, ex.: "/painel-liceu/artesaos" */
function caminhoAtual() {
    return window.location.hash.slice(1) || CAMINHO_PADRAO;
}

/**
 * @param {string} caminho
 * @returns {object} rota correspondente ou a de "não encontrada"
 */
function encontrarRota(caminho) {
    return ROTAS.find(function (rota) {
        return rota.caminho === caminho;
    }) ?? ROTA_NAO_ENCONTRADA;
}

/**
 * Verifica se a sessão permite abrir a rota.
 * @param {object} rota
 * @returns {boolean}
 */
function podeAcessar(rota) {
    const sessao = obterSessao();
    if (!GUARDA_ATIVA || rota.layout === "portal") {
        return true;
    }
    return Boolean(sessao) && sessao.perfil === rota.layout;
}

/**
 * @param {string} arquivo
 * @returns {Promise<string>} HTML da parcial
 */
async function buscarParcial(arquivo) {
    const resposta = await fetch(arquivo);
    if (!resposta.ok) {
        throw new Error(String(resposta.status));
    }
    return resposta.text();
}

/**
 * Monta a casca do layout da rota (só quando o layout muda).
 * @param {object} rota
 * @returns {Promise<HTMLElement>} o <main id="conteudo">
 */
function prepararLayout(rota) {
    if (rota.layout === layoutAtual) {
        return Promise.resolve(document.getElementById("conteudo"));
    }
    layoutAtual = rota.layout;

    if (rota.layout === "portal") {
        document.body.className = "layout-portal";
        raiz.innerHTML = (
            "<main id=\"conteudo\" class=\"conteudo\" tabindex=\"-1\"></main>"
        );
        return Promise.resolve(document.getElementById("conteudo"));
    }

    document.body.className = "layout-painel";
    return montarPainel(
        raiz,
        rota.layout,
        PAINEIS[rota.layout],
        obterSessao() ?? sessaoDemonstracao(rota.layout)
    );
}

/** Carrega a rota atual. Chamado no início e a cada "hashchange". */
async function carregarPagina() {
    let caminho = caminhoAtual();
    let rota;
    let html = "";
    let minha;

    // O login não é uma página: é um <dialog> aberto sobre a página atual.
    // Volta o endereço para a página anterior sem recarregá-la.
    if (caminho === CAMINHO_LOGIN) {
        window.history.replaceState(null, "", "#" + caminhoAnterior);
        abrirLogin();
        if (!primeiraCarga) {
            return;
        }
        caminho = caminhoAnterior;
    }

    rota = encontrarRota(caminho);
    if (!podeAcessar(rota)) {
        window.location.hash = "#" + CAMINHO_LOGIN;
        return;
    }
    caminhoAnterior = caminho;
    navegacao += 1;
    minha = navegacao;

    const conteudo = await prepararLayout(rota);
    if (minha !== navegacao) {
        return;
    }
    try {
        html = await buscarParcial(rota.arquivo);
    } catch (ignore) {
        rota = ROTA_NAO_ENCONTRADA;
        html = await buscarParcial(rota.arquivo);
    }
    if (minha !== navegacao) {
        return;
    }

    conteudo.innerHTML = html;
    conteudo.classList.remove("entrando");
    conteudo.getBoundingClientRect();
    conteudo.classList.add("entrando");
    document.title = rota.titulo;

    atualizarNavPortal(caminho);
    atualizarMenuPainel(caminho);
    fecharGavetas();

    if (!primeiraCarga) {
        window.scrollTo(0, 0);
        conteudo.focus({preventScroll: true});
    }
    primeiraCarga = false;

    if (rota.iniciar) {
        rota.iniciar(conteudo);
    }
}

iniciarMenuPortal();
window.addEventListener("hashchange", carregarPagina);
carregarPagina();
