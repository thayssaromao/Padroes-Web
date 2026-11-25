/*jslint browser */
/**
 * paginas/painel-artesao/status.js — aba Status das publicações
 * (#/painel-artesao/status-publicacoes).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarStatus,
    escaparHtml,
    icone,
    prepararAcoes
} from "../../componentes.js";
import {
    contarPorStatus,
    formatarData
} from "../../dados.js";
import {
    editarTrabalho,
    verMotivo
} from "./acoes-trabalho.js";
import {
    COMPARADORES,
    filtrarTrabalhos,
    trabalhosDoLogado
} from "./compartilhado.js";

/**
 * Linha da tabela de status, com as ações conforme o status.
 * @param {object} trabalho
 * @returns {string}
 */
function criarLinhaStatus(trabalho) {
    const id = escaparHtml(trabalho.id);
    const botao = function (acao, nomeIcone, texto) {
        return `<button type="button" class="btn btn--icone"`
            + ` data-acao="${acao}" data-id="${id}"`
            + ` aria-label="${texto}" title="${texto}">`
            + icone(nomeIcone) + "</button>";
    };
    const acoes = {
        "em-analise": "<button type=\"button\" class=\"btn btn--icone\""
            + " disabled aria-label=\"Aguardando análise\""
            + " title=\"Aguardando análise\">"
            + icone("lucide:hourglass") + "</button>",
        publicado: `<a class="btn btn--icone" href="#/produto?id=`
            + encodeURIComponent(trabalho.id)
            + `" aria-label="Ver no portal" title="Ver no portal">`
            + icone("lucide:external-link") + "</a>",
        rascunho: botao("editar", "lucide:pencil", "Continuar edição"),
        rejeitado: botao("motivo", "lucide:info", "Ver motivo")
            + botao("editar", "lucide:pencil", "Editar e reenviar")
    };
    acoes.reenviado = acoes["em-analise"];
    acoes.oculto = botao(
        "editar", "lucide:pencil", "Editar e enviar para análise"
    );
    return (
        "<tr>"
        + "<td data-rotulo=\"Trabalho\"><div class=\"tabela__principal\">"
        + "<img class=\"tabela__miniatura\" src=\""
        + escaparHtml(
            trabalho.imagens[0] || "assets/img/avatar-padrao.jpg"
        ) + "\""
        + " alt=\"\" width=\"64\" height=\"44\" loading=\"lazy\">"
        + "<div><strong>" + escaparHtml(trabalho.titulo) + "</strong>"
        + "<span class=\"texto-suave\">"
        + escaparHtml(trabalho.categorias.concat(trabalho.tecnicas).join(" • "))
        + "</span></div></div></td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(trabalho.status)
        + "</td>"
        + "<td data-rotulo=\"Última atualização\">"
        + escaparHtml(formatarData(trabalho.atualizadoEm)) + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + (acoes[trabalho.status] ?? "") + "</div></td>"
        + "</tr>"
    );
}

/**
 * Aba Status das publicações: resumo e tabela.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarStatus(raiz) {
    const marco = raiz.firstElementChild;
    const todos = await trabalhosDoLogado();
    if (!marco.isConnected) {
        return;
    }
    const contagem = contarPorStatus(todos);
    const corpo = raiz.querySelector("[data-linhas]");
    const estado = {busca: "", ordem: "recentes"};

    raiz.querySelector("[data-resumo]").innerHTML = [
        ["lucide:circle-check", contagem.publicado, "Publicados"],
        [
            "lucide:clock",
            (contagem["em-analise"] || 0) + (contagem.reenviado || 0),
            "Em análise"
        ],
        ["lucide:file-text", contagem.rascunho, "Rascunhos"],
        ["lucide:circle-x", contagem.rejeitado, "Rejeitados"]
    ].map(function ([icone, numero, rotulo]) {
        return criarCardEstatistica({
            icone,
            numero: numero || 0,
            rotulo
        });
    }).join("");

    function desenhar() {
        const lista = filtrarTrabalhos(todos, {
            busca: estado.busca,
            status: raiz.querySelector("[data-filtro-status]").value
        }).sort(COMPARADORES[estado.ordem]);
        corpo.innerHTML = lista.map(criarLinhaStatus).join("");
        prepararAcoes(corpo);
        raiz.querySelector("[data-vazio]").hidden = lista.length > 0;
    }

    raiz.querySelector("[data-busca]").addEventListener(
        "input",
        function (evento) {
            estado.busca = evento.target.value;
            desenhar();
        }
    );
    raiz.querySelector("[data-filtro-status]").addEventListener(
        "change",
        desenhar
    );
    raiz.querySelector("[data-ordem]").addEventListener(
        "change",
        function (evento) {
            estado.ordem = evento.target.value;
            desenhar();
        }
    );
    corpo.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-acao]");
        const trabalho = botao && todos.find(function (item) {
            return item.id === botao.dataset.id;
        });
        if (trabalho) {
            (
                botao.dataset.acao === "motivo"
                ? verMotivo
                : editarTrabalho
            )(trabalho);
        }
    });

    desenhar();
}

export {
    montarStatus
};
