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
    fecharModal,
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
    categoria: "",
    filtro: "Todos",
    ordem: "recentes",
    pagina: 1,
    tecnica: "",
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
        const texto = normalizar([
            artesao.nome,
            artesao.empreendimento,
            artesao.instagram
        ].join(" "));
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
        const passaCategoria = (
            !estado.categoria || artesao.categorias.includes(estado.categoria)
        );
        const passaTecnica = (
            !estado.tecnica || artesao.tecnicas.includes(estado.tecnica)
        );
        return passaBusca && passaFiltro && passaCategoria && passaTecnica;
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
    const foto = artesao.foto || "assets/img/avatar-padrao.jpg";
    return (
        "<li><article class=\"card card-artesao\">"
        + "<div class=\"card-artesao__topo\">"
        + `<img class="card-artesao__foto" src="${escaparHtml(foto)}"`
        + ` alt="Foto de ${escaparHtml(artesao.nome)}" width="88"`
        + " height=\"88\" loading=\"lazy\">"
        + "<div class=\"card-artesao__info\">"
        + "<h3 class=\"card-artesao__nome\">" + escaparHtml(artesao.nome)
        + "</h3><p class=\"card-artesao__empreendimento\">"
        + escaparHtml(artesao.empreendimento || artesao.instagram || "")
        + "</p><p class=\"local\">" + icone("lucide:map-pin")
        + escaparHtml(artesao.cidade) + "</p>"
        + "</div></div>"
        + criarChips(rotulos(artesao))
        + "<button type=\"button\" class=\"btn btn--secundario btn--bloco"
        + ` btn--pequeno" data-artesao="${escaparHtml(artesao.id)}"`
        + " aria-label=\"Ver perfil de " + escaparHtml(artesao.nome) + "\">"
        + "Ver perfil" + icone("lucide:arrow-right")
        + "</button></article></li>"
    );
}

/**
 * Abre o painel de filtros avançados.
 * @param {HTMLElement} raiz conteúdo da página
 */
function abrirFiltros(raiz) {
    raiz.querySelector("#artesaos-filtro-categoria").value = estado.categoria;
    raiz.querySelector("#artesaos-filtro-tecnica").value = estado.tecnica;
    abrirModal("modal-filtros-artesaos");
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
    const modal = raiz.querySelector("#modal-artesao");
    const artesao = await buscarArtesao(id);
    if (!artesao || !modal.isConnected) {
        return;
    }
    const foto = raiz.querySelector("#modal-artesao-foto");
    foto.src = artesao.foto || "assets/img/avatar-padrao.jpg";
    foto.alt = "Foto de " + artesao.nome;
    raiz.querySelector("#modal-artesao-titulo").textContent = artesao.nome;
    raiz.querySelector("#modal-artesao-empreendimento").textContent = (
        artesao.empreendimento || artesao.instagram || ""
    );
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
    const filtroCategoria = raiz.querySelector("#artesaos-filtro-categoria");
    const filtroTecnica = raiz.querySelector("#artesaos-filtro-tecnica");

    function preencherFiltros() {
        [
            {campo: filtroCategoria, chave: "categorias"},
            {campo: filtroTecnica, chave: "tecnicas"}
        ].forEach(function (filtro) {
            const opcoes = Array.from(new Set(ativos.flatMap(function (artesao) {
                return artesao[filtro.chave];
            }))).sort(function (a, b) {
                return a.localeCompare(b, "pt-BR");
            });
            filtro.campo.insertAdjacentHTML("beforeend", opcoes.map(function (opcao) {
                return `<option value="${escaparHtml(opcao)}">`
                    + escaparHtml(opcao) + "</option>";
            }).join(""));
        });
    }

    function renderizarPaginacao(total) {
        const paginas = Math.ceil(total / POR_PAGINA);
        paginacao.hidden = paginas <= 1;
        paginacao.innerHTML = (
            paginas > 1
            ? criarPaginacao(estado.pagina, paginas)
            : ""
        );
        paginacao.querySelectorAll(".paginacao__botao--seta").forEach(function (botao, indice) {
            botao.disabled = (
                indice === 0 ? estado.pagina === 1 : estado.pagina === paginas
            );
        });
    }

    function renderizarGrade() {
        const lista = ordenarArtesaos(filtrarArtesaos(ativos));
        const ultimaPagina = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        estado.pagina = Math.min(estado.pagina, ultimaPagina);
        const inicio = (estado.pagina - 1) * POR_PAGINA;
        const pagina = lista.slice(inicio, inicio + POR_PAGINA);
        grade.innerHTML = pagina.map(criarCardArtesao).join("");
        grade.classList.toggle(
            "artesaos-grade--lista",
            estado.visualizacao === "lista"
        );
        vazio.hidden = lista.length > 0;
        vazio.textContent = "Nenhum artesão encontrado. Ajuste a busca ou os filtros.";
        contagem.textContent = (
            lista.length === 0
            ? "Exibindo 0 de 0 artesãos"
            : `Exibindo ${inicio + 1} - ${inicio + pagina.length} de `
            + `${lista.length} artesãos`
        );
        renderizarPaginacao(lista.length);
        const filtros = Number(Boolean(estado.categoria)) + Number(Boolean(estado.tecnica));
        raiz.querySelector("#artesaos-filtrar-texto").textContent = (
            filtros > 0 ? `Filtrar (${filtros})` : "Filtrar"
        );
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
        function () {
            abrirFiltros(raiz);
        }
    );
    raiz.querySelector("#artesaos-filtros-form").addEventListener("submit", function (evento) {
        evento.preventDefault();
        estado.categoria = filtroCategoria.value;
        estado.tecnica = filtroTecnica.value;
        // A categoria do diálogo substitui o chip para evitar filtros conflitantes.
        estado.filtro = "Todos";
        chips.forEach(function (chip) {
            chip.setAttribute("aria-pressed", String(chip.textContent.trim() === "Todos"));
        });
        recomecar();
        fecharModal("modal-filtros-artesaos");
    });
    raiz.querySelector("#artesaos-limpar-filtros").addEventListener("click", function () {
        estado.categoria = "";
        estado.tecnica = "";
        estado.filtro = "Todos";
        filtroCategoria.value = "";
        filtroTecnica.value = "";
        chips.forEach(function (chip) {
            chip.setAttribute("aria-pressed", String(chip.textContent.trim() === "Todos"));
        });
        recomecar();
        fecharModal("modal-filtros-artesaos");
    });
    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            estado.filtro = chip.textContent.trim();
            estado.categoria = "";
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
        if (botao && !botao.disabled) {
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
            abrirPerfil(raiz, botao.dataset.artesao).catch(function () {
                if (marco.isConnected) {
                    mostrarAviso("Não foi possível abrir o perfil. Tente novamente.");
                }
            });
        }
    });

    raiz.addEventListener("error", function (evento) {
        const imagem = evento.target;
        if (
            imagem.matches(".card-artesao__foto, .artesaos-perfil__foto")
            && imagem.getAttribute("src") !== "assets/img/avatar-padrao.jpg"
        ) {
            imagem.src = "assets/img/avatar-padrao.jpg";
        }
    }, true);

    iniciarCarrossel(raiz.querySelector(".carrossel"));
    prepararModais(raiz);
    estado.busca = "";
    estado.categoria = "";
    estado.filtro = "Todos";
    estado.ordem = "recentes";
    estado.visualizacao = "grade";
    estado.tecnica = "";

    try {
        const todos = await carregarArtesaos();
        if (!marco.isConnected) {
            return;
        }
        ativos = todos.filter(function (artesao) {
            return artesao.status === "ativo";
        });
        preencherFiltros();
        recomecar();
    } catch (erro) {
        if (!marco.isConnected) {
            return;
        }
        console.error(erro);
        vazio.textContent = "Não foi possível carregar os artesãos.";
        vazio.hidden = false;
        contagem.textContent = "Lista de artesãos indisponível.";
    } finally {
        grade.setAttribute("aria-busy", "false");
    }
}

export {
    iniciarArtesaos
};
