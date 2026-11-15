/*jslint browser */
/**
 * paginas/painel-liceu.js — abas da Área do Liceu (#/painel-liceu/...).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarStatus,
    escaparHtml,
    icone,
    mostrarAviso
} from "../componentes.js";
import {
    carregarArtesaos,
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus
} from "../dados.js";

const MAXIMO_CARDS_INICIO = 4;

// ===== Ações ainda sem tela (stubs) =====

/**
 * Abre a análise de um trabalho pendente.
 * @param {string} id id do trabalho
 */
function analisarTrabalho(id) {
    // A IMPLEMENTAR: abrir o popup de análise (aprovar ou rejeitar).
    mostrarAviso("Em breve: analisar o trabalho " + id + ".");
}

// ===== Helpers compartilhados =====

/**
 * Liga cliques em elementos [data-acao] dentro de um contêiner.
 * @param {HTMLElement} alvo elemento interno da parcial
 * @param {object} acoes mapa nome da ação -> função(id)
 */
function ligarAcoes(alvo, acoes) {
    alvo.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-acao]");
        const acao = (
            botao
            ? acoes[botao.dataset.acao]
            : undefined
        );
        if (acao) {
            acao(botao.dataset.id);
        }
    });
}

/**
 * Trabalhos que aguardam análise (em análise ou reenviados), do mais
 * antigo para o mais recente.
 * @param {Array<object>} trabalhos
 * @returns {Array<object>}
 */
function filtrarPendentes(trabalhos) {
    return trabalhos.filter(function (trabalho) {
        return (
            trabalho.status === "em-analise"
            || trabalho.status === "reenviado"
        );
    }).sort(function (a, b) {
        return new Date(a.enviadoEm) - new Date(b.enviadoEm);
    });
}

// ===== Aba Início =====

/**
 * Card de trabalho aguardando análise.
 * @param {object} trabalho com artesaoNome (comNomeDoArtesao)
 * @returns {string}
 */
function criarCardPendente(trabalho) {
    return (
        "<article class=\"card card-trabalho\">"
        + `<img class="card-trabalho__imagem" src="${trabalho.imagens[0]}"`
        + ` alt="${escaparHtml(trabalho.titulo)}" width="400" height="160"`
        + " loading=\"lazy\">"
        + "<h3 class=\"card-trabalho__titulo\">"
        + escaparHtml(trabalho.titulo) + "</h3>"
        + "<p class=\"card-trabalho__meta\">" + icone("lucide:user")
        + escaparHtml(trabalho.artesaoNome) + "</p>"
        + "<p class=\"card-trabalho__meta\">" + icone("lucide:tag")
        + escaparHtml(trabalho.tecnica + " • " + trabalho.categoria) + "</p>"
        + "<p>" + criarStatus(trabalho.status) + "</p>"
        + "<button type=\"button\" class=\"btn btn--secundario btn--bloco\""
        + ` data-acao="analisar" data-id="${escaparHtml(trabalho.id)}">`
        + icone("lucide:external-link") + "Analisar</button></article>"
    );
}

/**
 * Aba Início: resumo e trabalhos aguardando análise.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarLiceuInicio(raiz) {
    const dados = await Promise.all([carregarArtesaos(), carregarTrabalhos()]);
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

    raiz.querySelector("[data-resumo]").innerHTML = resumo.map(
        criarCardEstatistica
    ).join("");
    lista.innerHTML = exibidos.map(criarCardPendente).join("");
    ligarAcoes(lista, {analisar: analisarTrabalho});
}

/**
 * Aba Artesãos: tabela, busca e filtros.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarLiceuArtesaos(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Cadastrar Artesão: formulário de acesso inicial.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarLiceuCadastro(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Trabalhos Pendentes: resumo e tabela de análise.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarLiceuPendentes(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Publicações: tabela de publicações aprovadas.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarLiceuPublicacoes(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Configurações: dados do Liceu e preferências.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarLiceuConfiguracoes(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

export {
    iniciarLiceuArtesaos,
    iniciarLiceuCadastro,
    iniciarLiceuConfiguracoes,
    iniciarLiceuInicio,
    iniciarLiceuPendentes,
    iniciarLiceuPublicacoes
};
