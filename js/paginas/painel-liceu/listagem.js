/*jslint browser */
/**
 * paginas/painel-liceu/listagem.js — tabela com busca, filtros, ordenação
 * e paginação compartilhada pelas abas do Liceu.
 * Guia: docs/DESIGN.md.
 */

import {
    criarPaginacao,
    escaparHtml,
    prepararAcoes
} from "../../componentes.js";

const POR_PAGINA = 5;

/**
 * Minúsculas e sem acentos, para comparar textos na busca.
 * @param {string} texto
 * @returns {string}
 */
function normalizar(texto) {
    return String(texto).normalize("NFD").replace(
        /[\u0300-\u036f]/g,
        ""
    ).toLowerCase();
}

/**
 * Gera <option> a partir de uma lista de textos.
 * @param {string[]} itens
 * @returns {string}
 */
function criarOpcoes(itens) {
    return itens.map(function (item) {
        return (
            `<option value="${escaparHtml(item)}">`
            + escaparHtml(item) + "</option>"
        );
    }).join("");
}

/**
 * Preenche o select de filtro com categorias e técnicas agrupadas.
 * @param {HTMLSelectElement} select já com a opção "Todas"
 * @param {{categorias: string[], tecnicas: string[]}} dados
 */
function preencherFiltroCategorias(select, dados) {
    select.insertAdjacentHTML(
        "beforeend",
        "<optgroup label=\"Categorias\">" + criarOpcoes(dados.categorias)
        + "</optgroup><optgroup label=\"Técnicas\">"
        + criarOpcoes(dados.tecnicas) + "</optgroup>"
    );
}

/**
 * Liga busca, filtros, ordenação e paginação de uma tabela. A parcial
 * traz [data-busca], [data-filtro], [data-ordem], [data-corpo],
 * [data-contagem], [data-paginacao] e [data-vazio].
 * @param {HTMLElement} raiz
 * @param {object} config itens, criarLinha, filtros, ordemPadrao, ordens,
 *     plural, textos
 */
function ligarListagem(raiz, config) {
    const corpo = raiz.querySelector("[data-corpo]");
    const contagem = raiz.querySelector("[data-contagem]");
    const paginacao = raiz.querySelector("[data-paginacao]");
    const vazio = raiz.querySelector("[data-vazio]");
    const busca = raiz.querySelector("[data-busca]");
    const ordem = raiz.querySelector("[data-ordem]");
    const formulario = raiz.querySelector("[data-filtros]");
    const campos = Array.from(raiz.querySelectorAll("[data-filtro]"));
    const linhas = new Map();
    const fragmento = document.createDocumentFragment();
    let pagina = 1;
    let ordemAtual = [];
    let totalPaginas = 0;

    // Dados locais já carregados: prepare cada linha uma única vez, inclusive
    // seus ícones e imagens, sem reiniciá-los a cada clique na paginação.
    config.itens.forEach(function (item) {
        const auxiliar = document.createElement("tbody");
        auxiliar.innerHTML = config.criarLinha(item);
        const linha = auxiliar.firstElementChild;
        linha.hidden = true;
        linha.querySelectorAll("iconify-icon").forEach(function (elemento) {
            elemento.setAttribute("noobserver", "");
        });
        linha.querySelectorAll("img").forEach(function (imagem) {
            imagem.loading = "eager";
        });
        linhas.set(item, linha);
        fragmento.append(linha);
    });
    corpo.replaceChildren(fragmento);
    prepararAcoes(corpo);

    function atualizarPaginacao(total) {
        if (total !== totalPaginas) {
            paginacao.innerHTML = criarPaginacao(pagina, total);
            paginacao.querySelectorAll("iconify-icon").forEach(function (elemento) {
                elemento.setAttribute("noobserver", "");
            });
            totalPaginas = total;
        }
        paginacao.querySelectorAll(".paginacao__botao").forEach(function (botao) {
            if (!botao.classList.contains("paginacao__botao--seta")) {
                if (Number(botao.dataset.pagina) === pagina) {
                    botao.setAttribute("aria-current", "page");
                } else {
                    botao.removeAttribute("aria-current");
                }
            }
        });
        paginacao.querySelectorAll(".paginacao__botao--seta").forEach(function (botao, indice) {
            botao.dataset.pagina = String(
                indice === 0 ? Math.max(1, pagina - 1) : Math.min(total, pagina + 1)
            );
            botao.disabled = indice === 0 ? pagina === 1 : pagina === total;
        });
    }

    function selecionar() {
        const texto = normalizar(busca.value.trim());
        const comparar = config.ordens[(
            ordem
            ? ordem.value
            : config.ordemPadrao
        )];
        return config.itens.filter(function (item) {
            return (
                normalizar(config.textos(item)).includes(texto)
                && campos.every(function (campo) {
                    return (
                        !campo.value
                        || config.filtros[campo.dataset.filtro](
                            item,
                            campo.value
                        )
                    );
                })
            );
        }).sort(comparar);
    }

    function exibir(focar) {
        const lista = selecionar();
        const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        const inicio = (Math.min(pagina, total) - 1) * POR_PAGINA;
        const visiveis = lista.slice(inicio, inicio + POR_PAGINA);
        pagina = Math.min(pagina, total);
        // Só mova as linhas quando a busca/ordenação mudar. A paginação
        // alterna visibilidade, mantendo os elementos e seus SVGs montados.
        if (
            lista.length !== ordemAtual.length
            || lista.some(function (item, indice) {
                return item !== ordemAtual[indice];
            })
        ) {
            lista.forEach(function (item) {
                corpo.append(linhas.get(item));
            });
            ordemAtual = lista;
        }
        const selecionados = new Set(visiveis);
        linhas.forEach(function (linha, item) {
            linha.hidden = !selecionados.has(item);
        });
        vazio.hidden = lista.length > 0;
        contagem.textContent = (
            lista.length
            ? (
                `Mostrando ${inicio + 1}–${inicio + visiveis.length}`
                + ` de ${lista.length} ${config.plural}`
            )
            : "Nenhum resultado"
        );
        paginacao.hidden = lista.length === 0;
        atualizarPaginacao(total);
        prepararAcoes(paginacao);
        if (focar) {
            paginacao.querySelector("[aria-current]").focus({
                preventScroll: true
            });
        }
    }

    function recomecar() {
        pagina = 1;
        exibir();
    }

    busca.addEventListener("input", recomecar);
    if (formulario) {
        formulario.addEventListener("submit", function (evento) {
            evento.preventDefault();
            recomecar();
        });
    }
    campos.forEach(function (campo) {
        campo.addEventListener("change", recomecar);
    });
    if (ordem) {
        ordem.addEventListener("change", recomecar);
    }
    paginacao.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-pagina]");
        const destino = botao ? Number(botao.dataset.pagina) : pagina;
        if (botao && !botao.disabled && destino !== pagina) {
            pagina = destino;
            exibir(true);
        }
    });
    exibir();
}

export {
    criarOpcoes,
    ligarListagem,
    preencherFiltroCategorias
};
