/*jslint browser */
/**
 * paginas/painel-liceu/inicio.js — aba Início (#/painel-liceu).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarStatus,
    escaparHtml,
    icone
} from "../../componentes.js";
import {
    carregarArtesaos,
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus
} from "../../dados.js";
import {analisarTrabalho} from "./acoes-trabalhos.js";
import {
    filtrarPendentes,
    imagemDe,
    ligarAcoes
} from "./compartilhado.js";

const MAXIMO_CARDS_INICIO = 4;

/**
 * Card de trabalho aguardando análise.
 * @param {object} trabalho com artesaoNome (comNomeDoArtesao)
 * @returns {string}
 */
function criarCardPendente(trabalho) {
    return (
        "<article class=\"card card-trabalho\">"
        + `<img class="card-trabalho__imagem" src="${imagemDe(trabalho)}"`
        + " alt=\"\" width=\"160\" height=\"160\""
        + " loading=\"lazy\">"
        + "<div class=\"card-trabalho__conteudo\"><h3 class=\"card-trabalho__titulo\">"
        + escaparHtml(trabalho.titulo) + "</h3>"
        + "<p class=\"card-trabalho__meta\">" + icone("lucide:user")
        + "<span>" + escaparHtml(trabalho.artesaoNome) + "</span></p>"
        + "<p class=\"card-trabalho__meta\">" + icone("lucide:tag")
        + "<span>" + escaparHtml(trabalho.tecnicas.concat(trabalho.categorias).join(" • "))
        + "</span></p></div>"
        + "<div class=\"card-trabalho__rodape\">" + criarStatus(trabalho.status)
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + ` data-acao="analisar" data-id="${escaparHtml(trabalho.id)}">`
        + icone("lucide:file-search") + "Analisar</button></div></article>"
    );
}

/**
 * Aba Início: resumo e trabalhos aguardando análise.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarInicio(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([carregarArtesaos(), carregarTrabalhos()]);
    if (!marco.isConnected) {
        return;
    }
    const contagem = contarPorStatus(dados[1]);
    const pendentes = filtrarPendentes(dados[1]);
    const resumo = [
        {
            icone: "lucide:users",
            numero: dados[0].length,
            rotulo: "Artesãos cadastrados"
        },
        {
            icone: "lucide:circle-check",
            numero: contagem.publicado || 0,
            rotulo: "Trabalhos publicados"
        },
        {
            icone: "lucide:clock",
            numero: pendentes.length,
            rotulo: "Aguardando análise"
        },
        {
            icone: "lucide:circle-x",
            numero: contagem.rejeitado || 0,
            rotulo: "Rejeitado / aguardando correção"
        }
    ];
    const lista = raiz.querySelector("[data-pendentes]");
    const exibidos = await comNomeDoArtesao(
        pendentes.slice(0, MAXIMO_CARDS_INICIO)
    );
    if (!marco.isConnected) {
        return;
    }

    raiz.querySelector("[data-resumo]").innerHTML = resumo.map(
        criarCardEstatistica
    ).join("");
    lista.innerHTML = exibidos.length
        ? exibidos.map(criarCardPendente).join("")
        : "<p class=\"liceu-vazio\">Nenhum trabalho aguarda análise.</p>";
    ligarAcoes(lista, {analisar: analisarTrabalho});
}

export {
    montarInicio
};
