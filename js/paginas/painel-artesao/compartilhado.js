/*jslint browser */
/**
 * paginas/painel-artesao/compartilhado.js — helpers usados por várias abas
 * do Artesão (diálogos, sessão, filtros, opções de select, proteção de
 * carga).
 * Guia: docs/DESIGN.md.
 */

import {
    criarDialogo,
    escaparHtml
} from "../../componentes.js";
import {
    buscarArtesao,
    obterSessao,
    sessaoDemonstracao,
    trabalhosDoArtesao
} from "../../dados.js";

/** Conteúdo variável sobre a anatomia compartilhada do design system. */
function dialogo(titulo, corpo, acoes = "") {
    return criarDialogo(titulo, corpo, acoes);
}

function confirmar(titulo, mensagem, texto = "Confirmar") {
    return new Promise(function (resolver) {
        const modal = dialogo(
            titulo,
            "<p>" + escaparHtml(mensagem) + "</p>",
            "<button type=\"button\" class=\"btn btn--secundario\""
            + " data-fechar-modal>Cancelar</button>"
            + "<button type=\"button\" class=\"btn btn--primario\""
            + " data-confirmar>" + escaparHtml(texto) + "</button>"
        );
        modal.classList.add("modal--pequeno");
        modal.classList.remove("modal--medio");
        if (texto === "Excluir" || texto === "Descartar") {
            const botao = modal.querySelector("[data-confirmar]");
            botao.classList.replace("btn--primario", "btn--perigo");
        }
        modal.addEventListener("close", function () {
            resolver(modal.returnValue === "confirmado");
        });
        modal.querySelector("[data-confirmar]").addEventListener(
            "click",
            function () {
                modal.close("confirmado");
            }
        );
    });
}

function parametros() {
    return new URLSearchParams(window.location.hash.split("?")[1] || "");
}

const COMPARADORES = Object.freeze({
    antigos: function (a, b) {
        return new Date(a.atualizadoEm) - new Date(b.atualizadoEm);
    },
    nome: function (a, b) {
        return a.titulo.localeCompare(b.titulo, "pt-BR");
    },
    recentes: function (a, b) {
        return new Date(b.atualizadoEm) - new Date(a.atualizadoEm);
    }
});

/**
 * Minúsculas e sem acentos, para comparar textos na busca.
 * @param {string} texto
 * @returns {string}
 */
function semAcento(texto) {
    return texto.normalize("NFD").replace(
        /[\u0300-\u036f]/g,
        ""
    ).toLowerCase();
}

/**
 * Filtra trabalhos por status, busca no texto e (opcional) categoria ou
 * técnica. "em-analise" inclui os reenviados.
 * @param {Array<object>} trabalhos
 * @param {{busca: string, categoria?: string, status: string}} filtros
 * @returns {Array<object>}
 */
function filtrarTrabalhos(trabalhos, filtros) {
    const termo = semAcento(filtros.busca.trim());
    return trabalhos.filter(function (trabalho) {
        const texto = semAcento([
            trabalho.titulo,
            trabalho.categorias.join(" "),
            trabalho.tecnicas.join(" ")
        ].join(" "));
        const statusOk = (
            !filtros.status
            || trabalho.status === filtros.status
            || (
                filtros.status === "em-analise"
                && trabalho.status === "reenviado"
            )
        );
        const categoriaOk = (
            !filtros.categoria
            || trabalho.categorias.includes(filtros.categoria)
            || trabalho.tecnicas.includes(filtros.categoria)
        );
        return statusOk && categoriaOk && (!termo || texto.includes(termo));
    });
}

/**
 * Artesão logado (sessão salva ou sessão de demonstração).
 * @returns {Promise<{artesao: object, sessao: object}>}
 */
async function artesaoLogado() {
    const salva = obterSessao();
    const demonstracao = await sessaoDemonstracao("painel-artesao");
    let sessao = (
        (salva && salva.artesaoId)
        ? salva
        : demonstracao
    );
    let artesao = await buscarArtesao(sessao.artesaoId);
    if (!artesao) {
        sessao = demonstracao;
        artesao = await buscarArtesao(sessao.artesaoId);
    }
    return {artesao, sessao};
}

/**
 * Trabalhos do artesão da sessão, do mais recente para o mais antigo.
 * @param {{artesaoId: string}} sessao
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDaSessao(sessao) {
    const trabalhos = await trabalhosDoArtesao(sessao.artesaoId);
    return trabalhos.slice().sort(function (a, b) {
        return new Date(b.atualizadoEm) - new Date(a.atualizadoEm);
    });
}

/**
 * Trabalhos do artesão logado, do mais recente para o mais antigo.
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDoLogado() {
    const {sessao} = await artesaoLogado();
    return trabalhosDaSessao(sessao);
}

/**
 * Preenche um <select> com opções (mantém a primeira, o texto-guia).
 * @param {HTMLSelectElement} seletor
 * @param {string[]} valores
 */
function preencherOpcoes(seletor, valores) {
    seletor.insertAdjacentHTML("beforeend", valores.map(function (valor) {
        return (
            `<option value="${escaparHtml(valor)}">`
            + escaparHtml(valor) + "</option>"
        );
    }).join(""));
}

/**
 * Envolve a montagem de uma aba: se o carregamento de dados falhar,
 * mostra uma mensagem visível no lugar do conteúdo.
 * @param {string} descricao o que não pôde ser carregado
 * @param {Function} montar função async que recebe a raiz
 * @returns {Function}
 */
function protegida(descricao, montar) {
    return async function (raiz) {
        const marco = raiz.firstElementChild;
        try {
            await montar(raiz);
        } catch (erro) {
            if (!marco || !marco.isConnected) {
                return;
            }
            console.error(erro);
            raiz.insertAdjacentHTML(
                "beforeend",
                "<p class=\"artesao-vazio\" role=\"alert\">"
                + `Não foi possível carregar ${descricao}.</p>`
            );
        }
    };
}

export {
    COMPARADORES,
    artesaoLogado,
    confirmar,
    dialogo,
    filtrarTrabalhos,
    parametros,
    preencherOpcoes,
    protegida,
    trabalhosDaSessao,
    trabalhosDoLogado
};
