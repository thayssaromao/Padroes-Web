/*jslint browser */
/**
 * paginas/saberes.js — Catálogo de técnicas (#/saberes).
 * Segue o mesmo modelo de paginas/artesaos.js.
 * Guia: docs/DESIGN.md §5.5, §5.8, §5.9 e §8.
 */

import {carregarTecnicas} from "../dados.js";
import {
    abrirModal,
    criarCardTecnica,
    criarChips,
    criarPaginacao,
    escaparHtml,
    fecharModal,
    iniciarCarrossel,
    prepararModais
} from "../componentes.js";

const POR_PAGINA = 8;
const CATEGORIAS = [
    "Cerâmica",
    "Tecelagem",
    "Madeira",
    "Costura e Bordado",
    "Cestaria",
    "Pintura"
];

const REDUZIR = window.matchMedia("(prefers-reduced-motion: reduce)");

const estado = {
    busca: "",
    categoria: "",
    favoritos: new Set(),
    filtro: "Todos",
    material: "",
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
 * Aplica busca, chip de categoria e filtros do diálogo.
 * @param {Array<object>} tecnicas
 * @returns {Array<object>}
 */
function filtrarTecnicas(tecnicas) {
    const termo = normalizar(estado.busca).trim();
    return tecnicas.filter(function (tecnica) {
        const texto = normalizar([
            tecnica.nome,
            tecnica.descricao,
            tecnica.categoria
        ].concat(tecnica.materiais).join(" "));
        const passaBusca = texto.includes(termo);
        const passaFiltro = (
            estado.filtro === "Todos"
            || (
                estado.filtro === "Outros"
                ? !CATEGORIAS.includes(tecnica.categoria)
                : tecnica.categoria === estado.filtro
            )
        );
        const passaCategoria = (
            !estado.categoria || tecnica.categoria === estado.categoria
        );
        const passaMaterial = (
            !estado.material || tecnica.materiais.includes(estado.material)
        );
        return passaBusca && passaFiltro && passaCategoria && passaMaterial;
    });
}

/**
 * Ordena sem alterar a lista original.
 * @param {Array<object>} tecnicas
 * @returns {Array<object>}
 */
function ordenarTecnicas(tecnicas) {
    const copia = tecnicas.slice();
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
 * Preenche e abre o popup de detalhes da técnica.
 * @param {HTMLElement} raiz
 * @param {object} tecnica
 */
function abrirTecnica(raiz, tecnica) {
    raiz.querySelector("#modal-tecnica-titulo").textContent = tecnica.nome;
    raiz.querySelector("#modal-tecnica-categoria").textContent = (
        tecnica.categoria
    );
    raiz.querySelector("#modal-tecnica-descricao").textContent = (
        tecnica.descricao
    );
    raiz.querySelector("#modal-tecnica-materiais").innerHTML = criarChips(
        tecnica.materiais
    );
    abrirModal("modal-tecnica");
}

/**
 * Liga a listagem: busca, filtros, ordenação, paginação e modais.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 * @returns {Promise<void>}
 */
async function iniciarSaberes(raiz) {
    const marco = raiz.firstElementChild;
    let tecnicas = [];
    const grade = raiz.querySelector("#saberes-grade");
    const vazio = raiz.querySelector("#saberes-vazio");
    const contagem = raiz.querySelector("#saberes-contagem");
    const paginacao = raiz.querySelector("#saberes-paginacao");
    const chips = raiz.querySelectorAll(".filtro-chip");
    const modos = raiz.querySelectorAll("[data-visualizacao]");
    const filtroCategoria = raiz.querySelector("#saberes-filtro-categoria");
    const filtroMaterial = raiz.querySelector("#saberes-filtro-material");

    function preencherFiltros() {
        [
            {campo: filtroCategoria, valores: tecnicas.map(function (tecnica) {
                return tecnica.categoria;
            })},
            {campo: filtroMaterial, valores: tecnicas.flatMap(function (tecnica) {
                return tecnica.materiais;
            })}
        ].forEach(function (filtro) {
            const opcoes = Array.from(new Set(filtro.valores)).sort(function (a, b) {
                return a.localeCompare(b, "pt-BR");
            });
            filtro.campo.insertAdjacentHTML("beforeend", opcoes.map(function (opcao) {
                return `<option value="${escaparHtml(opcao)}">`
                    + escaparHtml(opcao) + "</option>";
            }).join(""));
        });
    }

    function marcarChip(nome) {
        chips.forEach(function (chip) {
            chip.setAttribute("aria-pressed", String(chip.textContent.trim() === nome));
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
        const lista = ordenarTecnicas(filtrarTecnicas(tecnicas));
        const ultimaPagina = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        estado.pagina = Math.min(estado.pagina, ultimaPagina);
        const inicio = (estado.pagina - 1) * POR_PAGINA;
        const pagina = lista.slice(inicio, inicio + POR_PAGINA);
        grade.innerHTML = pagina.map(function (tecnica) {
            return "<li>" + criarCardTecnica(tecnica, {
                favoritado: estado.favoritos.has(tecnica.id)
            }) + "</li>";
        }).join("");
        grade.classList.toggle(
            "saberes-grade--lista",
            estado.visualizacao === "lista"
        );
        vazio.hidden = lista.length > 0;
        vazio.textContent = "Nenhuma técnica encontrada. Ajuste a busca ou os filtros.";
        contagem.textContent = (
            lista.length === 0
            ? "Exibindo 0 de 0 técnicas"
            : `Exibindo ${inicio + 1} - ${inicio + pagina.length} de `
            + `${lista.length} técnicas`
        );
        renderizarPaginacao(lista.length);
        const filtros = Number(Boolean(estado.categoria)) + Number(Boolean(estado.material));
        raiz.querySelector("#saberes-filtrar-texto").textContent = (
            filtros > 0 ? `Filtrar (${filtros})` : "Filtrar"
        );
    }

    function recomecar() {
        estado.pagina = 1;
        renderizarGrade();
    }

    raiz.querySelector("#saberes-form").addEventListener(
        "submit",
        function (evento) {
            evento.preventDefault();
        }
    );
    raiz.querySelector("#saberes-busca").addEventListener(
        "input",
        function (evento) {
            estado.busca = evento.target.value;
            recomecar();
        }
    );
    raiz.querySelector("#saberes-filtrar").addEventListener(
        "click",
        function () {
            filtroCategoria.value = estado.categoria;
            filtroMaterial.value = estado.material;
            abrirModal("modal-filtros-saberes");
        }
    );
    raiz.querySelector("#saberes-filtros-form").addEventListener("submit", function (evento) {
        evento.preventDefault();
        estado.categoria = filtroCategoria.value;
        estado.material = filtroMaterial.value;
        // A categoria do diálogo substitui o chip para evitar filtros conflitantes.
        estado.filtro = "Todos";
        marcarChip("Todos");
        recomecar();
        fecharModal("modal-filtros-saberes");
    });
    raiz.querySelector("#saberes-limpar-filtros").addEventListener("click", function () {
        estado.categoria = "";
        estado.material = "";
        estado.filtro = "Todos";
        filtroCategoria.value = "";
        filtroMaterial.value = "";
        marcarChip("Todos");
        recomecar();
        fecharModal("modal-filtros-saberes");
    });
    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            estado.filtro = chip.textContent.trim();
            estado.categoria = "";
            marcarChip(estado.filtro);
            recomecar();
        });
    });
    raiz.querySelector("#saberes-ordem").addEventListener(
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
        const favorito = evento.target.closest("[data-favorito]");
        const saibaMais = evento.target.closest("[data-tecnica]");
        if (favorito) {
            const id = favorito.dataset.favorito;
            if (estado.favoritos.has(id)) {
                estado.favoritos.delete(id);
            } else {
                estado.favoritos.add(id);
            }
            favorito.setAttribute("aria-pressed", String(estado.favoritos.has(id)));
            return;
        }
        if (saibaMais) {
            const tecnica = tecnicas.find(function (item) {
                return item.id === saibaMais.dataset.tecnica;
            });
            if (tecnica) {
                abrirTecnica(raiz, tecnica);
            }
        }
    });

    iniciarCarrossel(raiz.querySelector(".carrossel"));
    prepararModais(raiz);
    estado.busca = "";
    estado.categoria = "";
    estado.filtro = "Todos";
    estado.material = "";
    estado.ordem = "recentes";
    estado.visualizacao = "grade";

    try {
        const todas = await carregarTecnicas();
        if (!marco.isConnected) {
            return;
        }
        tecnicas = todas;
        preencherFiltros();
        recomecar();
    } catch (erro) {
        if (!marco.isConnected) {
            return;
        }
        console.error(erro);
        vazio.textContent = "Não foi possível carregar as técnicas.";
        vazio.hidden = false;
        contagem.textContent = "Lista de técnicas indisponível.";
    } finally {
        grade.setAttribute("aria-busy", "false");
    }
}

export {
    iniciarSaberes
};
