/*jslint browser */
/**
 * router.js — ponto de entrada da SPA (roteamento por hash).
 *
 * 1. Lê o caminho após o "#" e encontra a rota em js/rotas.js.
 * 2. Aplica o controle de acesso por perfil às áreas restritas.
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
import {obterSessao} from "./dados.js";
import {mostrarAviso, padronizarIcones} from "./componentes.js";
import {abrirLogin} from "./paginas/login.js";

const CAMINHO_PADRAO = "/inicio";
const CAMINHO_LOGIN = "/login";

const raiz = document.getElementById("raiz");
let layoutAtual = "";
let primeiraCarga = true;
let navegacao = 0;
let caminhoAnterior = CAMINHO_PADRAO;
let destinoPosLogin = "";

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
 * Controle de acesso por perfil. O perfil da sessão ("painel-artesao" ou
 * "painel-liceu") só abre as rotas do próprio layout; o portal é público.
 * @param {object} rota
 * @returns {string} "ok" | "login" (sem sessão) | "negado" (outro perfil)
 */
function verificarAcesso(rota) {
    const sessao = obterSessao();
    if (rota.layout === "portal") {
        return "ok";
    }
    if (!sessao) {
        return "login";
    }
    return (
        sessao.perfil === rota.layout
        ? "ok"
        : "negado"
    );
}

/** @returns {string} caminho do painel inicial do perfil logado */
function painelDaSessao() {
    const sessao = obterSessao();
    return (
        sessao
        ? "/" + sessao.perfil
        : CAMINHO_PADRAO
    );
}

/** Troca o link "Entrar" do portal por "Meu painel" quando há sessão. */
function atualizarLinkEntrar() {
    const link = document.querySelector(".nav-portal__entrar");
    const logado = Boolean(obterSessao());
    link.href = "#" + (
        logado
        ? painelDaSessao()
        : CAMINHO_LOGIN
    );
    link.lastChild.textContent = (
        logado
        ? " Meu painel "
        : " Entrar "
    );
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
        obterSessao()
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
        if (obterSessao()) {
            // Quem já entrou não vê o login: vai para o próprio painel.
            window.location.hash = "#" + painelDaSessao();
            return;
        }
        abrirLogin();
        if (!primeiraCarga) {
            return;
        }
        caminho = caminhoAnterior;
    }

    rota = encontrarRota(caminho);
    const acesso = verificarAcesso(rota);
    if (acesso === "login") {
        destinoPosLogin = caminho;
        window.location.hash = "#" + CAMINHO_LOGIN;
        return;
    }
    if (acesso === "negado") {
        mostrarAviso("Acesso não permitido para o seu perfil.");
        window.location.hash = "#" + painelDaSessao();
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
    padronizarIcones(conteudo);
    conteudo.classList.remove("entrando");
    conteudo.getBoundingClientRect();
    conteudo.classList.add("entrando");
    document.title = rota.titulo;

    atualizarLinkEntrar();
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

/**
 * Links para "#/login" abrem o modal direto, sem passar pelo hash: assim
 * não fica uma entrada duplicada da página atual no histórico.
 * Ctrl/Cmd/Shift + clique e botão do meio seguem o link normalmente.
 * @param {MouseEvent} evento
 */
function interceptarLinkLogin(evento) {
    const link = evento.target.closest(
        "a[href=\"#" + CAMINHO_LOGIN + "\"]"
    );
    if (
        !link ||
        evento.button !== 0 ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.altKey
    ) {
        return;
    }
    evento.preventDefault();
    abrirLogin();
}

/**
 * Depois do login, segue para a página restrita que o usuário tentou
 * abrir (se o perfil permitir) ou para o painel do perfil.
 */
function aoEntrar() {
    const destino = destinoPosLogin;
    destinoPosLogin = "";
    const permitido = destino && verificarAcesso(encontrarRota(destino)) === "ok";
    const alvo = "#" + (
        permitido
        ? destino
        : painelDaSessao()
    );
    if (window.location.hash === alvo) {
        carregarPagina();
    } else {
        window.location.hash = alvo;
    }
}

iniciarMenuPortal();
window.addEventListener("liceu:login", aoEntrar);
document.addEventListener("click", interceptarLinkLogin);
window.addEventListener("hashchange", carregarPagina);
carregarPagina();
