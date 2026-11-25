/*jslint browser */
/**
 * paginas/painel-liceu/artesaos.js — aba Artesãos (#/painel-liceu/artesaos).
 * Guia: docs/DESIGN.md.
 */

import {
    criarChips,
    criarStatus,
    escaparHtml,
    icone
} from "../../componentes.js";
import {
    carregarArtesaos,
    carregarCategorias
} from "../../dados.js";
import {
    abrirMenuArtesao,
    editarArtesao,
    verPerfilArtesao
} from "./acoes-artesaos.js";
import {ligarAcoes} from "./compartilhado.js";
import {
    ligarListagem,
    preencherFiltroCategorias
} from "./listagem.js";

/**
 * Linha da tabela de artesãos.
 * @param {object} artesao registro de data/banco.json (artesaos)
 * @returns {string}
 */
function criarLinhaArtesao(artesao) {
    const nome = escaparHtml(artesao.nome);
    const empreendimento = escaparHtml(artesao.empreendimento);
    const email = escaparHtml(artesao.email);
    const whatsapp = escaparHtml(artesao.whatsapp);
    const id = `data-id="${escaparHtml(artesao.id)}"`;
    return (
        "<tr>"
        + "<td data-rotulo=\"Artesão\"><span class=\"tabela__principal\">"
        + `<img class="avatar" src="${escaparHtml(artesao.foto)}" alt=""`
        + " width=\"40\" height=\"40\" loading=\"lazy\">"
        + `<span class="tabela__texto" title="${nome}">${nome}</span>`
        + "</span></td>"
        + `<td data-rotulo="Empreendimento" title="${empreendimento}">`
        + empreendimento + "</td>"
        + "<td data-rotulo=\"Categoria / Técnica\">"
        + criarChips(artesao.tecnicas.concat(artesao.categorias)) + "</td>"
        + "<td data-rotulo=\"Contato\"><span class=\"liceu-contato\">"
        + "<span>" + icone("lucide:mail")
        + `<span class="tabela__texto" title="${email}">${email}</span>`
        + "</span><span>" + icone("mdi:whatsapp")
        + `<span class="tabela__texto" title="${whatsapp}">${whatsapp}</span>`
        + "</span></span></td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(artesao.status)
        + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + `<button type="button" class="btn btn--secundario btn--pequeno"`
        + ` data-acao="ver-perfil" ${id}>`
        + icone("lucide:external-link") + "Ver perfil</button>"
        + `<button type="button" class="btn btn--secundario btn--pequeno"`
        + ` data-acao="editar" ${id}>`
        + icone("lucide:pencil") + "Editar</button>"
        + "<button type=\"button\" class=\"btn btn--icone\""
        + ` data-acao="mais" ${id}`
        + ` aria-label="Mais ações para ${nome}">`
        + icone("lucide:ellipsis") + "</button></div></td></tr>"
    );
}

/**
 * Aba Artesãos: tabela, busca e filtros.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarArtesaos(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([
        carregarArtesaos(),
        carregarCategorias()
    ]);
    if (!marco.isConnected) {
        return;
    }
    preencherFiltroCategorias(
        raiz.querySelector("[data-filtro]"),
        dados[1]
    );
    ligarListagem(raiz, {
        criarLinha: criarLinhaArtesao,
        filtros: {
            categoria: function (artesao, valor) {
                return artesao.categorias.concat(artesao.tecnicas).includes(
                    valor
                );
            }
        },
        itens: dados[0],
        ordemPadrao: "recentes",
        ordens: {
            nome: function (a, b) {
                return a.nome.localeCompare(b.nome, "pt-BR");
            },
            recentes: function (a, b) {
                return new Date(b.cadastradoEm) - new Date(a.cadastradoEm);
            }
        },
        plural: "artesãos",
        textos: function (artesao) {
            return (
                artesao.nome + " " + artesao.email + " "
                + artesao.empreendimento
            );
        }
    });
    ligarAcoes(raiz.querySelector("[data-corpo]"), {
        editar: editarArtesao,
        mais: abrirMenuArtesao,
        "ver-perfil": verPerfilArtesao
    });
}

export {
    montarArtesaos
};
