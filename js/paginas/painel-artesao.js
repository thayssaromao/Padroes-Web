/*jslint browser */
/**
 * paginas/painel-artesao.js — abas da Área do Artesão (#/painel-artesao/...).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarCardProduto
} from "../componentes.js";
import {
    buscarArtesao,
    contarPorStatus,
    obterSessao,
    sessaoDemonstracao,
    trabalhosDoArtesao
} from "../dados.js";

const ROTA_TRABALHOS = "#/painel-artesao/meus-trabalhos";

/**
 * Artesão logado (sessão salva ou sessão de demonstração).
 * @returns {Promise<{artesao: object, sessao: object}>}
 */
async function artesaoLogado() {
    const salva = obterSessao();
    const sessao = (
        (salva && salva.artesaoId)
        ? salva
        : sessaoDemonstracao("painel-artesao")
    );
    const artesao = await buscarArtesao(sessao.artesaoId);
    return {artesao, sessao};
}

/**
 * Trabalhos do artesão logado, do mais recente para o mais antigo.
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDoLogado() {
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDoArtesao(sessao.artesaoId);
    return trabalhos.slice().sort(function (a, b) {
        return new Date(b.atualizadoEm) - new Date(a.atualizadoEm);
    });
}

/**
 * Aba Início: resumo e últimos trabalhos.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarArtesaoInicio(raiz) {
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDoLogado();
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
        ["lucide:circle-x", soma("rejeitado", "rascunho"), "Não publicado"]
    ].map(function ([icone, numero, rotulo]) {
        return criarCardEstatistica({icone, numero, rotulo});
    }).join("");
    raiz.querySelector("[data-ultimos]").innerHTML = trabalhos.slice(
        0,
        4
    ).map(function (trabalho) {
        return criarCardProduto(trabalho, {
            favorito: false,
            href: ROTA_TRABALHOS,
            status: true
        });
    }).join("");
}

/**
 * Aba Meu perfil: formulário e pré-visualização.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarArtesaoPerfil(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Meus trabalhos: grade de trabalhos com filtros.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarArtesaoTrabalhos(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Novo trabalho: formulário e upload de imagens.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarArtesaoNovoTrabalho(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Status das publicações: resumo e tabela.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarArtesaoStatus(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

export {
    iniciarArtesaoInicio,
    iniciarArtesaoNovoTrabalho,
    iniciarArtesaoPerfil,
    iniciarArtesaoStatus,
    iniciarArtesaoTrabalhos
};
