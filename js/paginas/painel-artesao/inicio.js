/*jslint browser */
/**
 * paginas/painel-artesao/inicio.js — aba Início (#/painel-artesao).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarCardProduto
} from "../../componentes.js";
import {contarPorStatus} from "../../dados.js";
import {
    artesaoLogado,
    trabalhosDaSessao
} from "./compartilhado.js";

/**
 * Aba Início: resumo e últimos trabalhos.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarInicio(raiz) {
    const marco = raiz.firstElementChild;
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDaSessao(sessao);
    if (!marco.isConnected) {
        return;
    }
    const contagem = contarPorStatus(trabalhos);
    const soma = function (...chaves) {
        return chaves.reduce(function (total, chave) {
            return total + (contagem[chave] || 0);
        }, 0);
    };
    raiz.querySelector("[data-artesao-nome]").textContent = sessao.nome;
    raiz.querySelector("[data-resumo]").innerHTML = [
        ["lucide:layers", trabalhos.length, "Trabalhos cadastrados"],
        ["lucide:circle-check", soma("publicado"), "Publicados"],
        ["lucide:clock", soma("em-analise", "reenviado"), "Em análise"],
        [
            "lucide:circle-x",
            soma("rejeitado", "rascunho", "oculto"),
            "Não publicado"
        ]
    ].map(function ([icone, numero, rotulo]) {
        return criarCardEstatistica({icone, numero, rotulo});
    }).join("");
    raiz.querySelector("[data-ultimos]").innerHTML = trabalhos.slice(
        0,
        4
    ).map(function (trabalho) {
        return criarCardProduto(trabalho, {
            favorito: false,
            href: "#/painel-artesao/novo-trabalho?id="
                + encodeURIComponent(trabalho.id),
            status: true
        });
    }).join("") || (
        "<p class=\"artesao-vazio\">Você ainda não cadastrou trabalhos.</p>"
    );
}

export {
    montarInicio
};
