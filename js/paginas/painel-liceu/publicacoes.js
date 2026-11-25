/*jslint browser */
/**
 * paginas/painel-liceu/publicacoes.js — aba Publicações
 * (#/painel-liceu/publicacoes).
 * Guia: docs/DESIGN.md.
 */

import {
    criarStatus,
    escaparHtml,
    icone
} from "../../componentes.js";
import {
    carregarArtesaos,
    carregarCategorias,
    carregarTrabalhos,
    comNomeDoArtesao,
    formatarData
} from "../../dados.js";
import {
    editarPublicacao,
    excluirPublicacao,
    novaPublicacao,
    ocultarPublicacao,
    verPublicacao
} from "./acoes-trabalhos.js";
import {
    imagemDe,
    ligarAcoes
} from "./compartilhado.js";
import {
    criarOpcoes,
    ligarListagem
} from "./listagem.js";

/**
 * Botão de ícone de uma linha da tabela de publicações.
 * @param {string} acao nome da ação
 * @param {string} nomeIcone ícone Iconify
 * @param {string} rotulo texto de acessibilidade, ex.: "Ver"
 * @param {object} trabalho
 * @returns {string}
 */
function criarBotaoPublicacao(acao, nomeIcone, rotulo, trabalho) {
    return (
        "<button type=\"button\" class=\"btn btn--icone\""
        + ` data-acao="${acao}" data-id="${escaparHtml(trabalho.id)}"`
        + ` aria-label="${rotulo} ${escaparHtml(trabalho.titulo)}">`
        + icone(nomeIcone) + "</button>"
    );
}

/**
 * Linha da tabela de publicações.
 * @param {object} trabalho com artesaoNome (comNomeDoArtesao)
 * @returns {string}
 */
function criarLinhaPublicacao(trabalho) {
    return (
        "<tr>"
        + "<td data-rotulo=\"Imagem\">"
        + `<img class="tabela__miniatura" src="${imagemDe(trabalho)}"`
        + " alt=\"\" width=\"64\" height=\"44\" loading=\"lazy\"></td>"
        + "<td data-rotulo=\"Publicação / Produto\"><strong>"
        + escaparHtml(trabalho.titulo) + "</strong></td>"
        + "<td data-rotulo=\"Artesão\">"
        + escaparHtml(trabalho.artesaoNome) + "</td>"
        + "<td data-rotulo=\"Categoria\">"
        + escaparHtml(trabalho.categorias.join(", ")) + "</td>"
        + "<td data-rotulo=\"Data de publicação\">"
        + formatarData(trabalho.publicadoEm, false) + "</td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(trabalho.status) + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + criarBotaoPublicacao("ver", "lucide:eye", "Ver", trabalho)
        + criarBotaoPublicacao("editar", "lucide:pencil", "Editar", trabalho)
        + criarBotaoPublicacao(
            "ocultar",
            trabalho.status === "oculto" ? "lucide:eye" : "lucide:eye-off",
            trabalho.status === "oculto" ? "Republicar" : "Ocultar",
            trabalho
        )
        + criarBotaoPublicacao(
            "excluir",
            "lucide:trash-2",
            "Excluir",
            trabalho
        )
        + "</div></td></tr>"
    );
}

/**
 * Aba Publicações: tabela de publicações aprovadas.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarPublicacoes(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([
        carregarTrabalhos(),
        carregarCategorias(),
        carregarArtesaos()
    ]);
    if (!marco.isConnected) {
        return;
    }
    const publicados = await comNomeDoArtesao(
        dados[0].filter(function (trabalho) {
            return trabalho.status === "publicado" || trabalho.status === "oculto";
        })
    );
    if (!marco.isConnected) {
        return;
    }

    raiz.querySelector("[data-filtro=\"categoria\"]").insertAdjacentHTML(
        "beforeend",
        criarOpcoes(dados[1].categorias)
    );
    raiz.querySelector("[data-filtro=\"artesao\"]").insertAdjacentHTML(
        "beforeend",
        dados[2].map(function (artesao) {
            return (
                `<option value="${escaparHtml(artesao.id)}">`
                + escaparHtml(artesao.nome) + "</option>"
            );
        }).join("")
    );
    ligarListagem(raiz, {
        criarLinha: criarLinhaPublicacao,
        filtros: {
            artesao: function (trabalho, valor) {
                return trabalho.artesaoId === valor;
            },
            categoria: function (trabalho, valor) {
                return trabalho.categorias.includes(valor);
            },
            status: function (trabalho, valor) {
                return trabalho.status === valor;
            }
        },
        itens: publicados,
        ordemPadrao: "recentes",
        ordens: {
            recentes: function (a, b) {
                return new Date(b.publicadoEm) - new Date(a.publicadoEm);
            }
        },
        plural: "publicações",
        textos: function (trabalho) {
            return trabalho.titulo + " " + trabalho.artesaoNome;
        }
    });
    ligarAcoes(raiz.querySelector("[data-corpo]"), {
        editar: editarPublicacao,
        excluir: excluirPublicacao,
        ocultar: ocultarPublicacao,
        ver: verPublicacao
    });
    ligarAcoes(raiz.querySelector(".painel-cabecalho"), {
        nova: novaPublicacao
    });
}

export {
    montarPublicacoes
};
