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

/** Move o sublinhado animado até o link ativo do menu (desktop). */
function moverSublinhado() {
    const ativo = document.querySelector(
        ".nav-portal__link[aria-current=\"page\"]"
    );
    const sublinhado = document.querySelector(".nav-portal__sublinhado");
    if (!sublinhado) {
        return;
    }
    if (!ativo) {
        sublinhado.style.width = "0";
        return;
    }
    sublinhado.style.width = `${ativo.offsetWidth}px`;
    sublinhado.style.transform = `translateX(${ativo.offsetLeft}px)`;
}

/**
 * Marca o link da rota atual no menu e no rodapé do portal.
 * @param {string} caminho
 */
function atualizarNavPortal(caminho) {
    document.querySelectorAll(
        ".nav-portal__link, .rodape__links a"
    ).forEach(function (link) {
        if (link.getAttribute("href") === "#" + caminho) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
    moverSublinhado();
}

/** Liga o botão hambúrguer do portal (uma vez, no carregamento). */
function iniciarMenuPortal() {
    const botao = document.querySelector(".cabecalho__menu");
    const nav = document.getElementById("nav");
    nav.dataset.classeAberta = "nav-portal--aberto";
    botao.addEventListener("click", function () {
        alternarGaveta(botao, nav, "nav-portal--aberto");
    });
    window.addEventListener("resize", moverSublinhado);
    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            fecharGavetas();
        }
    });
    // A fonte muda a largura dos links depois que carrega.
    document.fonts.ready.then(moverSublinhado);
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
    // A IMPLEMENTAR: dropdowns de notificações e do menu do usuário (§8.2).

    return raiz.querySelector("#conteudo");
}

export {
    atualizarMenuPainel,
    atualizarNavPortal,
    fecharGavetas,
    iniciarMenuPortal,
    montarPainel
};
