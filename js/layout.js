/*jslint browser */
/**
 * layout.js — comportamento das cascas (portal e painel).
 * Guia: docs/DESIGN.md §4.
 */

import {ROTAS} from "./rotas.js";
import {criarDialogo, escaparHtml, icone, mostrarAviso} from "./componentes.js";
import {carregarTrabalhos, encerrarSessao, obterSessao} from "./dados.js";

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
        const rotulo = aberta ? "Fechar menu" : "Abrir menu";
        botao.setAttribute("aria-label", rotulo);
        botao.setAttribute("title", rotulo);
    }
    if (botao.getAttribute("aria-controls") === "painel-lateral") {
        const rotulo = aberta ? "Fechar menu do painel" : "Abrir menu do painel";
        botao.setAttribute("aria-label", rotulo);
        botao.setAttribute("title", rotulo);
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

/** Mostra os estados atuais, sem simular notificações de um servidor. */
async function abrirNotificacoes() {
    const sessao = obterSessao();
    const painel = document.querySelector(".painel");
    try {
        const trabalhos = await carregarTrabalhos();
        if (!painel.isConnected) {
            return;
        }
        const itens = trabalhos.filter(function (item) {
            return sessao.perfil === "painel-liceu"
                ? ["em-analise", "reenviado"].includes(item.status)
                : item.artesaoId === sessao.artesaoId
                    && item.status === "rejeitado";
        });
        const destino = sessao.perfil === "painel-liceu"
            ? "#/painel-liceu/trabalhos-pendentes"
            : "#/painel-artesao/status-publicacoes";
        const texto = sessao.perfil === "painel-liceu"
            ? " trabalho(s) aguardando análise."
            : " trabalho(s) com correções solicitadas pelo Liceu.";
        const modal = criarDialogo("Notificações", "<p>"
            + itens.length + texto + "</p>",
            '<a class="btn btn--primario" href="' + destino
            + '">Ver trabalhos</a>', {raiz: painel, tamanho: "pequeno"});
        modal.querySelector("a").addEventListener("click", function () {
            modal.close();
        });
    } catch (ignore) {
        mostrarAviso("Não foi possível carregar as notificações.");
    }
}

/** Menu da conta atual com navegação e encerramento de sessão. */
function abrirMenuUsuario() {
    const sessao = obterSessao();
    const destino = sessao.perfil === "painel-artesao"
        ? "#/painel-artesao/meu-perfil" : "#/painel-liceu";
    const botao = document.querySelector('[data-acao="menu-usuario"]');
    botao.setAttribute("aria-expanded", "true");
    const modal = criarDialogo("Minha conta", "<p>"
        + escaparHtml(sessao.nome) + "</p>",
        '<a class="btn btn--secundario" href="' + destino + '">'
        + (sessao.perfil === "painel-artesao" ? "Meu perfil" : "Meu painel")
        + '</a><a class="btn btn--secundario" href="#/inicio">'
        + 'Voltar ao Portal</a><button class="btn btn--primario"'
        + ' type="button" data-sair>Sair</button>',
        {raiz: document.querySelector(".painel"), tamanho: "pequeno"});
    modal.addEventListener("close", function () {
        botao.setAttribute("aria-expanded", "false");
    });
    modal.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            modal.close();
        });
    });
    modal.querySelector("[data-sair]").addEventListener("click", function () {
        modal.close();
        sair();
    });
}

/** Confirma o encerramento da sessão e volta ao portal. */
function sair() {
    const modal = criarDialogo("Deseja sair do painel?",
        "<p>Você poderá entrar novamente com sua conta.</p>",
        '<button type="button" class="btn btn--secundario"'
        + ' data-fechar-modal>Cancelar</button>'
        + '<button type="button" class="btn btn--primario"'
        + ' data-confirmar-sair>Sair</button>',
        {raiz: document.querySelector(".painel"), tamanho: "pequeno"});
    modal.querySelector("[data-confirmar-sair]").addEventListener(
        "click", function () {
            encerrarSessao();
            modal.close();
            mostrarAviso("Sessão encerrada.");
            window.location.hash = "#/inicio";
        }
    );
}

/** Atualiza a identidade sem reconstruir a navegação compartilhada. */
function atualizarUsuarioPainel(raiz, sessao) {
    if (!sessao) {
        return;
    }
    const nome = raiz.querySelector("[data-usuario-nome]");
    const foto = raiz.querySelector("[data-usuario-foto]");
    if (nome && foto) {
        nome.textContent = sessao.nome;
        foto.src = sessao.foto || "assets/img/avatar-padrao.jpg";
    }
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
    if (!resposta.ok) {
        throw new Error("Não foi possível carregar o painel.");
    }
    raiz.innerHTML = await resposta.text();

    const lateral = raiz.querySelector("#painel-lateral");
    const botaoMenu = raiz.querySelector(".painel__menu");

    raiz.querySelector("[data-painel-titulo]").textContent = painel.titulo;
    raiz.querySelector("[data-painel-menu]").innerHTML = (
        criarMenuPainel(layout)
    );
    atualizarUsuarioPainel(raiz, sessao);

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

    const controlador = new AbortController();
    const opcoes = {signal: controlador.signal};
    function fecharLateral(evento) {
        if (!lateral.isConnected) {
            controlador.abort();
            return;
        }
        if (!lateral.contains(evento.target)
                && !botaoMenu.contains(evento.target)) {
            alternarGaveta(botaoMenu, lateral,
                "painel__lateral--aberto", false);
        }
    }
    document.addEventListener("click", fecharLateral, opcoes);
    document.addEventListener("focusin", fecharLateral, opcoes);
    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape"
                && botaoMenu.getAttribute("aria-expanded") === "true") {
            alternarGaveta(botaoMenu, lateral,
                "painel__lateral--aberto", false);
            botaoMenu.focus();
        }
    }, opcoes);
    return raiz.querySelector("#conteudo");
}

export {
    atualizarMenuPainel,
    atualizarNavPortal,
    atualizarUsuarioPainel,
    fecharGavetas,
    iniciarMenuPortal,
    montarPainel
};
