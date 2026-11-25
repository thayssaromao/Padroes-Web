/*jslint browser */
/**
 * paginas/painel-liceu/pendentes.js — aba Trabalhos Pendentes
 * (#/painel-liceu/trabalhos-pendentes).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarChips,
    criarStatus,
    escaparHtml,
    icone
} from "../../componentes.js";
import {
    carregarCategorias,
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus,
    formatarData
} from "../../dados.js";
import {analisarTrabalho} from "./acoes-trabalhos.js";
import {
    filtrarPendentes,
    imagemDe,
    ligarAcoes
} from "./compartilhado.js";
import {
    ligarListagem,
    preencherFiltroCategorias
} from "./listagem.js";

/**
 * Linha da tabela de trabalhos pendentes.
 * @param {object} trabalho com artesaoNome (comNomeDoArtesao)
 * @returns {string}
 */
function criarLinhaPendente(trabalho) {
    const titulo = escaparHtml(trabalho.titulo);
    return (
        "<tr>"
        + "<td data-rotulo=\"Trabalho\"><span class=\"tabela__principal\">"
        + `<img class="tabela__miniatura" src="${imagemDe(trabalho)}"`
        + ` alt="" width="64" height="44" loading="lazy">${titulo}</span></td>`
        + "<td data-rotulo=\"Artesão\">"
        + escaparHtml(trabalho.artesaoNome) + "</td>"
        + "<td data-rotulo=\"Categoria / Técnica\">"
        + criarChips(trabalho.tecnicas.concat(trabalho.categorias)) + "</td>"
        + "<td data-rotulo=\"Enviado em\"><span class=\"liceu-data\">"
        + icone("lucide:calendar") + formatarData(trabalho.enviadoEm)
        + "</span></td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(trabalho.status)
        + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + "<button type=\"button\" class=\"btn btn--secundario btn--pequeno\""
        + ` data-acao="analisar" data-id="${escaparHtml(trabalho.id)}"`
        + ` aria-label="Analisar ${titulo}">`
        + icone("lucide:external-link") + "Analisar</button></div></td></tr>"
    );
}

/**
 * Aba Trabalhos Pendentes: resumo e tabela de análise.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarPendentes(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([
        carregarTrabalhos(),
        carregarCategorias()
    ]);
    if (!marco.isConnected) {
        return;
    }
    const pendentes = await comNomeDoArtesao(filtrarPendentes(dados[0]));
    if (!marco.isConnected) {
        return;
    }
    const contagem = contarPorStatus(pendentes);
    const resumo = [
        {
            icone: "lucide:hourglass",
            numero: contagem["em-analise"] || 0,
            rotulo: "Aguardando análise"
        },
        {
            icone: "lucide:refresh-cw",
            numero: contagem.reenviado || 0,
            rotulo: "Reenviado"
        },
        {
            icone: "lucide:circle-check",
            numero: dados[0].filter(function (trabalho) {
                return trabalho.analisadoEm && new Date(
                    trabalho.analisadoEm
                ).toLocaleDateString("pt-BR") === new Date(
                ).toLocaleDateString("pt-BR");
            }).length,
            rotulo: "Analisados hoje"
        }
    ];

    raiz.querySelector("[data-resumo]").innerHTML = resumo.map(
        criarCardEstatistica
    ).join("");
    preencherFiltroCategorias(
        raiz.querySelector("[data-filtro]"),
        dados[1]
    );
    ligarListagem(raiz, {
        criarLinha: criarLinhaPendente,
        filtros: {
            categoria: function (trabalho, valor) {
                return (
                    trabalho.categorias.includes(valor)
                    || trabalho.tecnicas.includes(valor)
                );
            }
        },
        itens: pendentes,
        ordemPadrao: "antigos",
        ordens: {
            antigos: function (a, b) {
                return new Date(a.enviadoEm) - new Date(b.enviadoEm);
            },
            recentes: function (a, b) {
                return new Date(b.enviadoEm) - new Date(a.enviadoEm);
            }
        },
        plural: "trabalhos",
        textos: function (trabalho) {
            return trabalho.titulo + " " + trabalho.artesaoNome;
        }
    });
    ligarAcoes(raiz.querySelector("[data-corpo]"), {
        analisar: analisarTrabalho
    });
}

export {
    montarPendentes
};
