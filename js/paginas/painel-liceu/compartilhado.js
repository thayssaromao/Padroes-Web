/*jslint browser */
/**
 * paginas/painel-liceu/compartilhado.js — helpers usados por várias abas
 * do Liceu (ações por data-acao, imagem, erro de carga, pendentes).
 * Guia: docs/DESIGN.md.
 */

import {
    escaparHtml,
    mostrarAviso
} from "../../componentes.js";

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
            Promise.resolve(acao(botao.dataset.id)).catch(function (erro) {
                mostrarAviso(erro.message || "Não foi possível concluir a ação.");
            });
        }
    });
}

/**
 * Caminho (já escapado) da primeira imagem do trabalho, com reserva.
 * @param {object} trabalho
 * @returns {string}
 */
function imagemDe(trabalho) {
    return escaparHtml(
        (trabalho.imagens && trabalho.imagens[0])
        || "assets/img/avatar-padrao.jpg"
    );
}

/**
 * Troca o conteúdo dinâmico da aba por uma mensagem de erro.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 * @param {Element} marco elemento da parcial capturado antes da carga
 */
function mostrarErroDeCarga(raiz, marco) {
    if (!marco || !marco.isConnected) {
        return;
    }
    const cabecalho = raiz.querySelector(".painel-cabecalho");
    if (!cabecalho || !raiz.contains(cabecalho)) {
        return;
    }
    Array.from(raiz.children).forEach(function (filho) {
        if (filho !== cabecalho) {
            filho.remove();
        }
    });
    cabecalho.insertAdjacentHTML(
        "afterend",
        "<p class=\"liceu-erro\" role=\"alert\">"
        + "Não foi possível carregar os dados.</p>"
    );
}

/**
 * Envolve o início de uma aba para tratar falhas ao carregar dados.
 * @param {function(HTMLElement)} iniciar função da aba
 * @returns {function(HTMLElement): Promise<void>}
 */
function comTratamentoDeErro(iniciar) {
    return async function (raiz) {
        const marco = raiz.firstElementChild;
        try {
            await iniciar(raiz);
        } catch (erro) {
            if (marco && marco.isConnected) {
                console.error(erro);
            }
            mostrarErroDeCarga(raiz, marco);
        }
    };
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

export {
    comTratamentoDeErro,
    filtrarPendentes,
    imagemDe,
    ligarAcoes
};
