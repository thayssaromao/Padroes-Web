/*jslint browser */
/**
 * layout.js — comportamento das cascas (portal e painel).
 * Guia: docs/DESIGN.md §4.
 */

import {ROTAS} from "./rotas.js";
import {escaparHtml, icone, mostrarAviso} from "./componentes.js";
import {encerrarSessao} from "./dados.js";

const ARQUIVO_PAINEL = "pages/layouts/painel.html";

/**
 * Abre/fecha uma gaveta controlada por um botão com aria-controls.
 * @param {HTMLButtonElement} botao
 * @param {HTMLElement} gaveta
 * @param {string} classeAberta
 * @param {boolean} [abrir]
 */
function alternarGaveta(botao, gaveta, classeAberta, abrir) {
    const aberta = (
        abrir === undefined
        ? botao.getAttribute("aria-expanded") !== "true"
        : abrir
    );
    botao.setAttribute("aria-expanded", String(aberta));
    gaveta.classList.toggle(classeAberta, aberta);
    if (botao.getAttribute("aria-controls") === "nav") {
        botao.setAttribute("aria-label", aberta ? "Fechar menu" : "Abrir menu");
    }
}

/** Fecha todas as gavetas (chamado a cada troca de rota e com Esc). */
function fecharGavetas() {
    document.querySelectorAll("[aria-controls][aria-expanded]").forEach(
        function (botao) {
            const alvo = document.getElementById(
                botao.getAttribute("aria-controls")
            );
            if (alvo) {
                alternarGaveta(botao, alvo, alvo.dataset.classeAberta, false);
            }
        }
    );
}

// ===== Portal =====

/**
 * Marca o link da rota atual no menu e no rodapé do portal.
 * @param {string} caminho
 */
function atualizarNavPortal(caminho) {
    document.querySelectorAll(
        ".nav-portal__link, .nav-portal__entrar, .rodape__links a"
    ).forEach(function (link) {
        if (link.getAttribute("href") === "#" + caminho) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

/** Liga o botão hambúrguer do portal (uma vez, no carregamento). */
function iniciarMenuPortal() {
    document.querySelector(".pular-conteudo").addEventListener("click", function (evento) {
        evento.preventDefault();
        const conteudo = document.getElementById("conteudo");
        if (conteudo) {
            conteudo.focus({preventScroll: true});
            conteudo.scrollIntoView({block: "start"});
        }
    });
    const botao = document.querySelector(".cabecalho__menu");
    const nav = document.getElementById("nav");
    const desktop = window.matchMedia("(min-width: 1280px)");
    nav.dataset.classeAberta = "nav-portal--aberto";
    botao.addEventListener("click", function () {
        alternarGaveta(botao, nav, "nav-portal--aberto");
    });
    nav.addEventListener("click", function (evento) {
        const link = evento.target.closest("a");
        if (!link || desktop.matches) {
            return;
        }
        alternarGaveta(botao, nav, "nav-portal--aberto", false);
        // A rota atual não dispara hashchange; retire o foco da gaveta fechada.
        if (link.hash === (window.location.hash || "#/inicio")) {
            document.getElementById("conteudo").focus({preventScroll: true});
        }
    });
    document.addEventListener("click", function (evento) {
        if (!nav.contains(evento.target) && !botao.contains(evento.target)) {
            if (!desktop.matches && nav.contains(document.activeElement)) {
                botao.focus();
            }
            alternarGaveta(botao, nav, "nav-portal--aberto", false);
        }
    });
    document.addEventListener("focusin", function (evento) {
        if (!nav.contains(evento.target) && !botao.contains(evento.target)) {
            alternarGaveta(botao, nav, "nav-portal--aberto", false);
        }
    });
    desktop.addEventListener("change", function () {
        if (!desktop.matches && nav.contains(document.activeElement)) {
            botao.focus();
        }
        alternarGaveta(botao, nav, "nav-portal--aberto", false);
    });
    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            if (botao.getAttribute("aria-expanded") === "true") {
                botao.focus();
            }
            fecharGavetas();
        }
    });
}

// ===== Painel =====

/**
 * Gera os itens do menu lateral a partir das rotas do painel.
 * @param {string} layout
 * @returns {string}
 */
function criarMenuPainel(layout) {
    return ROTAS.filter(function (rota) {
        return rota.layout === layout;
    }).map(function (rota) {
        return (
            `<li><a class="painel__link" href="#${rota.caminho}">`
            + icone(rota.icone) + escaparHtml(rota.nome) + "</a></li>"
        );
    }).join("");
}

/**
 * Marca o item ativo do menu lateral.
 * @param {string} caminho
 */
function atualizarMenuPainel(caminho) {
    document.querySelectorAll("[data-painel-menu] .painel__link").forEach(
        function (link) {
            if (link.getAttribute("href") === "#" + caminho) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        }
    );
}

/** Abre a lista de notificações. */
function abrirNotificacoes() {
    // A IMPLEMENTAR: dropdown de notificações (§8.2).
    mostrarAviso("Em breve: notificações.");
}

/** Abre o menu do usuário. */
function abrirMenuUsuario() {
    // A IMPLEMENTAR: dropdown do menu do usuário (§8.2).
    mostrarAviso("Em breve: menu do usuário.");
}

/** Encerra a sessão e volta ao portal. */
function sair() {
    // A IMPLEMENTAR: pedir confirmação com o modal "Deseja sair?" (§8.2).
    encerrarSessao();
    mostrarAviso("Sessão encerrada.");
    window.location.hash = "#/inicio";
}

/**
 * Insere a casca do painel em raiz e preenche título, menu e usuário.
 * @param {HTMLElement} raiz
 * @param {string} layout "painel-liceu" | "painel-artesao"
 * @param {{titulo: string}} painel dados de PAINEIS[layout]
 * @param {{nome: string, foto: string}} sessao
 * @returns {Promise<HTMLElement>} o <main id="conteudo"> da casca
 */
async function montarPainel(raiz, layout, painel, sessao) {
    const resposta = await fetch(ARQUIVO_PAINEL);
    raiz.innerHTML = await resposta.text();
    if (layout === "painel-liceu") {
        raiz.querySelector("[data-ajuda-artesao]").remove();
    }

    const lateral = raiz.querySelector("#painel-lateral");
    const botaoMenu = raiz.querySelector(".painel__menu");

    raiz.querySelector("[data-painel-titulo]").textContent = painel.titulo;
    raiz.querySelector("[data-painel-menu]").innerHTML = (
        criarMenuPainel(layout)
    );
    raiz.querySelector("[data-usuario-nome]").textContent = sessao.nome;
    raiz.querySelector("[data-usuario-foto]").src = sessao.foto;

    lateral.dataset.classeAberta = "painel__lateral--aberto";
    botaoMenu.addEventListener("click", function () {
        alternarGaveta(botaoMenu, lateral, "painel__lateral--aberto");
    });
    raiz.querySelector("[data-acao=\"sair\"]").addEventListener("click", sair);
    raiz.querySelector("[data-acao=\"notificacoes\"]").addEventListener(
        "click",
        abrirNotificacoes
    );
    raiz.querySelector("[data-acao=\"menu-usuario\"]").addEventListener(
        "click",
        abrirMenuUsuario
    );

    return raiz.querySelector("#conteudo");
}

export {
    atualizarMenuPainel,
    atualizarNavPortal,
    fecharGavetas,
    iniciarMenuPortal,
    montarPainel
};
