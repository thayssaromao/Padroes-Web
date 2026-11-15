/*jslint browser */
/**
 * paginas/artesaos.js — Listagem de artesãos (#/artesaos).
 * Guia: docs/DESIGN.md §5.5, §5.8, §5.9 e §8.
 */

import {buscarArtesao, carregarArtesaos} from "../dados.js";
import {
    abrirModal,
    criarChips,
    criarPaginacao,
    escaparHtml,
    icone,
    iniciarCarrossel,
    mostrarAviso,
    prepararModais
} from "../componentes.js";

const POR_PAGINA = 8;
const CATEGORIAS = [
    "Decoração",
    "Utilitários",
    "Acessórios",
    "Arte em tecido",
    "Cestaria",
    "Cerâmica"
];

const REDUZIR = window.matchMedia("(prefers-reduced-motion: reduce)");

const estado = {
    busca: "",
    filtro: "Todos",
    ordem: "recentes",
    pagina: 1,
    visualizacao: "grade"
};

/**
 * Minúsculas e sem acentos, para comparar textos.
 * @param {string} texto
 * @returns {string}
 */
function normalizar(texto) {
    return String(texto ?? "").normalize("NFD").replace(
        /[̀-ͯ]/g,
        ""
    ).toLowerCase();
}

/**
 * Rótulos (categorias e técnicas) de um artesão.
 * @param {object} artesao
 * @returns {string[]}
 */
function rotulos(artesao) {
    return artesao.categorias.concat(artesao.tecnicas);
}

/**
 * Aplica busca e chip de categoria.
 * @param {Array<object>} artesaos
 * @returns {Array<object>}
 */
function filtrarArtesaos(artesaos) {
    const termo = normalizar(estado.busca).trim();
    return artesaos.filter(function (artesao) {
        const lista = rotulos(artesao);
        const texto = normalizar(artesao.nome + " " + artesao.empreendimento);
        const passaBusca = texto.includes(termo);
        const passaFiltro = (
            estado.filtro === "Todos"
            || (
                estado.filtro === "Outros"
                ? !lista.some(function (rotulo) {
                    return CATEGORIAS.includes(rotulo);
                })
                : lista.includes(estado.filtro)
            )
        );
        return passaBusca && passaFiltro;
    });
}

/**
 * Ordena sem alterar a lista original.
 * @param {Array<object>} artesaos
 * @returns {Array<object>}
 */
function ordenarArtesaos(artesaos) {
    const copia = artesaos.slice();
    const porNome = function (a, b) {
        return a.nome.localeCompare(b.nome, "pt-BR");
    };
    if (estado.ordem === "nome-az") {
        return copia.sort(porNome);
    }
    if (estado.ordem === "nome-za") {
        return copia.sort(function (a, b) {
            return porNome(b, a);
        });
    }
    return copia.sort(function (a, b) {
        return Date.parse(b.cadastradoEm) - Date.parse(a.cadastradoEm);
    });
}

/**
 * HTML de um card de artesão (§5.5).
 * @param {object} artesao
 * @returns {string}
 */
function criarCardArtesao(artesao) {
    return (
        "<li><article class=\"card card-artesao\">"
        + "<div class=\"card-artesao__topo\">"
        + `<img class="card-artesao__foto" src="${escaparHtml(artesao.foto)}"`
        + ` alt="Foto de ${escaparHtml(artesao.nome)}" width="88"`
        + " height=\"88\" loading=\"lazy\">"
        + "<div class=\"card-artesao__info\">"
        + "<h3 class=\"card-artesao__nome\">" + escaparHtml(artesao.nome)
        + "</h3><p class=\"local\">" + icone("lucide:map-pin")
        + escaparHtml(artesao.cidade) + "</p>"
        + criarChips(rotulos(artesao))
        + "</div></div>"
        + "<button type=\"button\" class=\"btn btn--secundario btn--bloco"
        + ` btn--pequeno" data-artesao="${escaparHtml(artesao.id)}"`
        + " aria-label=\"Ver perfil de " + escaparHtml(artesao.nome) + "\">"
        + "Ver perfil" + icone("lucide:arrow-right")
        + "</button></article></li>"
    );
}

/**
 * Abre o painel de filtros avançados.
 */
function abrirFiltros() {
    // A IMPLEMENTAR: painel de filtros (categorias, técnicas, cidade),
    // DESIGN §8.3.
    mostrarAviso("Em breve: filtros avançados.");
}

/**
 * Preenche um link de contato ou esconde o item quando não há valor.
 * @param {HTMLAnchorElement} link
 * @param {string} [valor]
 * @param {function(string): string} montarHref
 */
function preencherContato(link, valor, montarHref) {
    link.parentElement.hidden = !valor;
    if (valor) {
        link.href = montarHref(valor);
        link.querySelector("span").textContent = valor;
    }
}

/**
 * Preenche e abre o popup de perfil.
 * @param {HTMLElement} raiz
 * @param {string} id
 * @returns {Promise<void>}
 */
async function abrirPerfil(raiz, id) {
    const artesao = await buscarArtesao(id);
    if (!artesao) {
        return;
    }
    const foto = raiz.querySelector("#modal-artesao-foto");
    foto.src = artesao.foto;
    foto.alt = "Foto de " + artesao.nome;
    raiz.querySelector("#modal-artesao-titulo").textContent = artesao.nome;
    raiz.querySelector("#modal-artesao-cidade").textContent = artesao.cidade;
    raiz.querySelector("#modal-artesao-chips").innerHTML = criarChips(
        rotulos(artesao)
    );
    raiz.querySelector("#modal-artesao-bio").textContent = artesao.bio;

    preencherContato(
        raiz.querySelector("#modal-artesao-instagram"),
        artesao.instagram,
        function (valor) {
            return (
                "https://instagram.com/"
                + encodeURIComponent(valor.replace(/^@/, ""))
            );
        }
    );
    preencherContato(
        raiz.querySelector("#modal-artesao-whatsapp"),
        artesao.whatsapp,
        function (valor) {
            return "https://wa.me/55" + valor.replace(/\D/g, "");
        }
    );
    preencherContato(
        raiz.querySelector("#modal-artesao-email"),
        artesao.email,
        function (valor) {
            return "mailto:" + valor;
        }
    );

    abrirModal("modal-artesao");
}

/**
 * Liga a listagem: busca, filtros, paginação e o modal de perfil.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 * @returns {Promise<void>}
 */
async function iniciarArtesaos(raiz) {
    const marco = raiz.firstElementChild;
    let ativos = [];
    const grade = raiz.querySelector("#artesaos-grade");
    const vazio = raiz.querySelector("#artesaos-vazio");
    const contagem = raiz.querySelector("#artesaos-contagem");
    const paginacao = raiz.querySelector("#artesaos-paginacao");
    const chips = raiz.querySelectorAll(".filtro-chip");
    const modos = raiz.querySelectorAll("[data-visualizacao]");

    function renderizarPaginacao(total) {
        const paginas = Math.ceil(total / POR_PAGINA);
        paginacao.hidden = paginas <= 1;
        paginacao.innerHTML = (
            paginas > 1
            ? criarPaginacao(estado.pagina, paginas)
            : ""
        );
    }

    function renderizarGrade() {
        const lista = ordenarArtesaos(filtrarArtesaos(ativos));
        const inicio = (estado.pagina - 1) * POR_PAGINA;
        const pagina = lista.slice(inicio, inicio + POR_PAGINA);
        grade.innerHTML = pagina.map(criarCardArtesao).join("");
        grade.classList.toggle(
            "artesaos-grade--lista",
            estado.visualizacao === "lista"
        );
        vazio.hidden = lista.length > 0;
        contagem.textContent = (
            lista.length === 0
            ? "Exibindo 0 de 0 artesãos"
            : `Exibindo ${inicio + 1} - ${inicio + pagina.length} de `
            + `${lista.length} artesãos`
        );
        renderizarPaginacao(lista.length);
    }

    function recomecar() {
        estado.pagina = 1;
        renderizarGrade();
    }

    raiz.querySelector("#artesaos-form").addEventListener(
        "submit",
        function (evento) {
            evento.preventDefault();
        }
    );
    raiz.querySelector("#artesaos-busca").addEventListener(
        "input",
        function (evento) {
            estado.busca = evento.target.value;
            recomecar();
        }
    );
    raiz.querySelector("#artesaos-filtrar").addEventListener(
        "click",
        abrirFiltros
    );
    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            estado.filtro = chip.textContent.trim();
            chips.forEach(function (outro) {
                outro.setAttribute("aria-pressed", String(outro === chip));
            });
            recomecar();
        });
    });
    raiz.querySelector("#artesaos-ordem").addEventListener(
        "change",
        function (evento) {
            estado.ordem = evento.target.value;
            recomecar();
        }
    );
    modos.forEach(function (modo) {
        modo.addEventListener("click", function () {
            estado.visualizacao = modo.dataset.visualizacao;
            modos.forEach(function (outro) {
                outro.setAttribute("aria-pressed", String(outro === modo));
            });
            renderizarGrade();
        });
    });
    paginacao.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-pagina]");
        if (botao) {
            estado.pagina = Number(botao.dataset.pagina);
            renderizarGrade();
            grade.scrollIntoView({
                behavior: (
                    REDUZIR.matches
                    ? "auto"
                    : "smooth"
                ),
                block: "start"
            });
            paginacao.querySelector("[aria-current]").focus({
                preventScroll: true
            });
        }
    });
    grade.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-artesao]");
        if (botao) {
            abrirPerfil(raiz, botao.dataset.artesao);
        }
    });

    iniciarCarrossel(raiz.querySelector(".carrossel"));
    prepararModais(raiz);
    estado.busca = "";
    estado.filtro = "Todos";
    estado.ordem = "recentes";
    estado.visualizacao = "grade";

    try {
        const todos = await carregarArtesaos();
        if (!marco.isConnected) {
            return;
        }
        ativos = todos.filter(function (artesao) {
            return artesao.status === "ativo";
        });
        recomecar();
    } catch (erro) {
        if (!marco.isConnected) {
            return;
        }
        console.error(erro);
        vazio.textContent = "Não foi possível carregar os artesãos.";
        vazio.hidden = false;
    }
}

export {
    iniciarArtesaos
};
