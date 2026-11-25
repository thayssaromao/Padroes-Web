/*jslint browser */
/**
 * paginas/painel-artesao/trabalhos.js — aba Meus trabalhos
 * (#/painel-artesao/meus-trabalhos).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardProduto,
    criarPaginacao,
    criarStatus,
    escaparHtml,
    icone,
    prepararAcoes
} from "../../componentes.js";
import {carregarCategorias} from "../../dados.js";
import {
    abrirMenuTrabalho,
    editarTrabalho,
    enviarParaAnalise,
    verMotivo
} from "./acoes-trabalho.js";
import {
    COMPARADORES,
    filtrarTrabalhos,
    parametros,
    trabalhosDoLogado
} from "./compartilhado.js";

const POR_PAGINA = 8;

/**
 * Botão com ícone e texto para o rodapé dos cards.
 * @param {string} acao valor de data-acao
 * @param {string} id id do trabalho
 * @param {string} nomeIcone
 * @param {string} texto
 * @param {string} classes classes extras
 * @returns {string}
 */
function criarBotaoAcao(acao, id, nomeIcone, texto, classes) {
    return (
        `<button type="button" class="btn ${classes}"`
        + ` data-acao="${acao}" data-id="${escaparHtml(id)}">`
        + icone(nomeIcone) + texto
        + "</button>"
    );
}

/**
 * Faixa de status e acesso ao motivo, quando houver rejeição.
 * @param {object} trabalho
 * @returns {string}
 */
function criarEstadoTrabalho(trabalho) {
    return "<div class=\"artesao-estado\">"
        + criarStatus(trabalho.status)
        + (trabalho.status === "rejeitado"
            ? `<button type="button" class="btn btn--icone" data-acao="motivo"`
                + ` data-id="${escaparHtml(trabalho.id)}"`
                + ` aria-label="Ver motivo" title="Ver motivo">`
                + icone("lucide:info") + "</button>"
            : "") + "</div>";
}

/**
 * Card de um trabalho com as ações conforme o status.
 * @param {object} trabalho
 * @returns {string}
 */
function criarAcoesTrabalho(trabalho) {
    const titulo = escaparHtml(trabalho.titulo);
    const acoes = (
        criarEstadoTrabalho(trabalho)
        + "<div class=\"artesao-botoes\">"
        + (trabalho.status === "rascunho"
            ? `<button type="button" class="btn btn--suave btn--pequeno"`
                + ` data-acao="enviar" data-id="${escaparHtml(trabalho.id)}"`
                + ` aria-label="Enviar para análise" title="Enviar para análise">`
                + icone("lucide:send") + "Enviar</button>"
            : "")
        + (["em-analise", "reenviado"].includes(trabalho.status)
            ? "<span class=\"texto-suave\">Edição indisponível</span>"
            : trabalho.status === "rascunho"
                ? `<button type="button" class="btn btn--icone"`
                    + ` data-acao="editar" data-id="${escaparHtml(trabalho.id)}"`
                    + ` aria-label="Editar" title="Editar">`
                    + icone("lucide:pencil") + "</button>"
                : criarBotaoAcao("editar", trabalho.id, "lucide:pencil",
                    "Editar", "btn--suave btn--pequeno"))
        + "<button type=\"button\" class=\"btn btn--icone\""
        + ` data-acao="menu" data-id="${escaparHtml(trabalho.id)}"`
        + ` aria-label="Mais ações para ${titulo}">`
        + icone("lucide:ellipsis") + "</button></div>"
    );
    return criarCardProduto(trabalho, {
        acoes,
        favorito: false,
        href: "#/painel-artesao/novo-trabalho?id="
            + encodeURIComponent(trabalho.id),
        status: false
    });
}

/**
 * Aba Meus trabalhos: grade de trabalhos com filtros.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarTrabalhos(raiz) {
    const marco = raiz.firstElementChild;
    let todos = await trabalhosDoLogado();
    const dadosCategorias = await carregarCategorias();
    if (!marco.isConnected) {
        return;
    }
    const grade = raiz.querySelector("[data-grade]");
    const seletorCategoria = raiz.querySelector("[data-filtro-categoria]");
    const estado = {busca: "", ordem: "recentes", pagina: 1};
    raiz.querySelector("[data-filtro-status]").value = (
        parametros().get("status") || ""
    );

    seletorCategoria.insertAdjacentHTML(
        "beforeend",
        "<optgroup label=\"Categorias\">"
        + dadosCategorias.categorias.map(function (nome) {
            return (
                `<option value="${escaparHtml(nome)}">`
                + escaparHtml(nome) + "</option>"
            );
        }).join("")
        + "</optgroup><optgroup label=\"Técnicas\">"
        + dadosCategorias.tecnicas.map(function (nome) {
            return (
                `<option value="${escaparHtml(nome)}">`
                + escaparHtml(nome) + "</option>"
            );
        }).join("")
        + "</optgroup>"
    );

    function filtrar() {
        const lista = filtrarTrabalhos(todos, {
            busca: estado.busca,
            categoria: seletorCategoria.value,
            status: raiz.querySelector("[data-filtro-status]").value
        });
        return lista.sort(COMPARADORES[estado.ordem]);
    }

    function desenhar() {
        const lista = filtrar();
        const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        estado.pagina = Math.min(estado.pagina, totalPaginas);
        const inicio = (estado.pagina - 1) * POR_PAGINA;
        const pagina = lista.slice(inicio, inicio + POR_PAGINA);
        grade.innerHTML = (
            pagina.length
            ? pagina.map(criarAcoesTrabalho).join("")
            : "<p class=\"artesao-vazio\">Nenhum trabalho encontrado.</p>"
        );
        raiz.querySelector("[data-contagem]").textContent = (
            pagina.length
            ? `Exibindo ${inicio + 1} - ${inicio + pagina.length} de `
            + `${lista.length} trabalhos`
            : "Exibindo 0 trabalhos"
        );
        raiz.querySelector("[data-paginacao]").innerHTML = (
            totalPaginas > 1
            ? criarPaginacao(estado.pagina, totalPaginas)
            : ""
        );
        prepararAcoes(grade);
        prepararAcoes(raiz.querySelector("[data-paginacao]"));
    }

    function voltarEDesenhar() {
        estado.pagina = 1;
        desenhar();
    }

    raiz.querySelector("[data-busca]").addEventListener(
        "input",
        function (evento) {
            estado.busca = evento.target.value;
            voltarEDesenhar();
        }
    );
    raiz.querySelector("[data-ordem]").addEventListener(
        "change",
        function (evento) {
            estado.ordem = evento.target.value;
            voltarEDesenhar();
        }
    );
    [
        raiz.querySelector("[data-filtro-status]"),
        seletorCategoria
    ].forEach(function (seletor) {
        seletor.addEventListener("change", voltarEDesenhar);
    });
    raiz.querySelectorAll("[data-visao]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            raiz.querySelectorAll("[data-visao]").forEach(function (outro) {
                outro.setAttribute("aria-pressed", String(outro === botao));
            });
            grade.classList.toggle(
                "artesao-lista",
                botao.dataset.visao === "lista"
            );
        });
    });
    raiz.querySelector("[data-paginacao]").addEventListener(
        "click",
        function (evento) {
            const botao = evento.target.closest("[data-pagina]");
            if (botao) {
                estado.pagina = Number(botao.dataset.pagina);
                desenhar();
            }
        }
    );
    async function atualizar() {
        todos = await trabalhosDoLogado();
        if (marco.isConnected) {
            desenhar();
        }
    }

    grade.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-acao]");
        const trabalho = botao && todos.find(function (item) {
            return item.id === botao.dataset.id;
        });
        const acoes = {
            editar: editarTrabalho,
            enviar: enviarParaAnalise,
            menu: abrirMenuTrabalho,
            motivo: verMotivo
        };
        if (trabalho) {
            acoes[botao.dataset.acao](trabalho, atualizar);
        }
    });

    desenhar();
}

export {
    montarTrabalhos
};
