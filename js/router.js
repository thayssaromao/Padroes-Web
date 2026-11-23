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
    atualizarUsuarioPainel,
    fecharGavetas,
    iniciarMenuPortal,
    montarPainel
} from "./layout.js";
import {obterSessao, sessaoDemonstracao} from "./dados.js";
import {mostrarAviso, padronizarIcones, prepararAcoes} from "./componentes.js";
import {abrirLogin} from "./paginas/login.js";

/**
 * Guarda local das áreas restritas, conforme o papel da sessão mock.
 */
const GUARDA_ATIVA = true;
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
        return rota.caminho === caminho.split("?")[0];
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

/** Exibe falha recuperável sem depender de outra requisição de HTML. */
function mostrarFalhaPagina(conteudo) {
    conteudo.innerHTML = "<section class=\"secao\"><div class=\"container pilha\">"
        + "<h1>Não foi possível carregar esta página</h1>"
        + "<p role=\"alert\">Verifique sua conexão e tente novamente.</p>"
        + "<div><button type=\"button\" class=\"btn btn--primario\""
        + " data-tentar-novamente>Tentar novamente</button></div></div></section>";
    conteudo.querySelector("[data-tentar-novamente]").addEventListener(
        "click", carregarPagina
    );
    document.title = "Página indisponível | Liceu";
    conteudo.focus({preventScroll: true});
}

/**
 * Monta a casca do layout da rota (só quando o layout muda).
 * @param {object} rota
 * @returns {Promise<HTMLElement>} o <main id="conteudo">
 */
async function prepararLayout(rota, minha) {
    if (rota.layout === layoutAtual) {
        return document.getElementById("conteudo");
    }
    const recipiente = document.createElement("div");
    let conteudo;
    if (rota.layout === "portal") {
        recipiente.innerHTML = "<main id=\"conteudo\" "
            + "class=\"conteudo\" tabindex=\"-1\"></main>";
        conteudo = recipiente.firstElementChild;
    } else {
        conteudo = await montarPainel(
            recipiente,
            rota.layout,
            PAINEIS[rota.layout],
            obterSessao() ?? sessaoDemonstracao(rota.layout)
        );
    }
    if (minha !== navegacao) {
        return null;
    }
    document.body.className = rota.layout === "portal"
        ? "layout-portal" : "layout-painel";
    raiz.replaceChildren(...recipiente.childNodes);
    layoutAtual = rota.layout;
    return conteudo;
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
        if (!obterSessao()) {
            caminhoAnterior = CAMINHO_PADRAO;
            window.history.replaceState(null, "", "#" + CAMINHO_PADRAO);
            await carregarPagina();
            abrirLogin();
        } else {
            window.location.hash = "#" + CAMINHO_LOGIN;
        }
        return;
    }
    atualizarUsuarioPainel(raiz, obterSessao());
    caminhoAnterior = caminho;
    navegacao += 1;
    minha = navegacao;

    let conteudo;
    try {
        conteudo = await prepararLayout(rota, minha);
    } catch (falha) {
        if (minha !== navegacao) {
            return;
        }
        layoutAtual = "";
        document.body.className = "layout-portal";
        raiz.innerHTML = "<main id=\"conteudo\" class=\"conteudo\" tabindex=\"-1\"></main>";
        mostrarFalhaPagina(document.getElementById("conteudo"));
        return;
    }
    if (minha !== navegacao) {
        return;
    }
    try {
        html = await buscarParcial(rota.arquivo);
    } catch (ignore) {
        if (minha === navegacao) {
            mostrarFalhaPagina(conteudo);
        }
        return;
    }
    if (minha !== navegacao) {
        return;
    }

    conteudo.innerHTML = html;
    prepararAcoes(conteudo);
    conteudo.classList.remove("entrando");
    conteudo.getBoundingClientRect();
    conteudo.classList.add("entrando");
    document.title = rota.titulo;

    atualizarNavPortal(caminho.split("?")[0]);
    atualizarMenuPainel(caminho.split("?")[0]);
    fecharGavetas();

    if (!primeiraCarga) {
        window.scrollTo(0, 0);
        conteudo.focus({preventScroll: true});
    }
    primeiraCarga = false;

    if (rota.iniciar) {
        try {
            await rota.iniciar(conteudo);
            if (minha === navegacao) {
                prepararAcoes(raiz);
            }
        } catch (falha) {
            if (minha === navegacao) {
                mostrarAviso("Não foi possível concluir o carregamento. "
                    + "Tente novamente.");
            }
        }
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

padronizarIcones(document);
prepararAcoes(document);
iniciarMenuPortal();
document.addEventListener("click", interceptarLinkLogin);
window.addEventListener("hashchange", carregarPagina);
carregarPagina();

// Uma sessão encerrada em outra aba também encerra o acesso neste painel.
window.addEventListener("storage", function (evento) {
    if (evento.key === "liceu:sessao" || evento.key === "liceu:base:v1") {
        if (evento.key === "liceu:sessao") {
            layoutAtual = "";
        }
        carregarPagina();
    }
});

// Uma nova conta exige remontar a casca, mesmo quando o hash não muda.
window.addEventListener("conta-autenticada", function (evento) {
    const destino = "#/" + evento.detail;
    layoutAtual = "";
    if (window.location.hash === destino) {
        carregarPagina();
    } else {
        window.location.hash = destino;
    }
});
