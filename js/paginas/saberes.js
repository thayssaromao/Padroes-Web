/*jslint browser */
import {carregarCategorias} from "../dados.js";
import {
    abrirModal,
    criarPaginacao,
    escaparHtml,
    fecharModal,
    icone,
    iniciarCarrossel,
    prepararAcoes,
    prepararModais
} from "../componentes.js";
import {
    carregarVitrine,
    normalizar,
    parametrosPublicos
} from "./publico.js";

const DESCRICOES = Object.freeze({
    "Bordado": "Desenhos e texturas criados com pontos e linhas sobre tecido.",
    "Cerâmica": "Peças modeladas em argila que passam por secagem e queima.",
    "Cestaria": "Trançados manuais que dão forma a cestos e outros objetos.",
    "Crochê": "Laçadas de fios entrelaçadas com agulha, formando tecidos e peças.",
    "Fibras naturais": "Trabalho manual com fibras de origem vegetal.",
    "Macramê": "Nós feitos à mão com fios e cordões para criar tramas.",
    "Madeira": "Objetos e esculturas feitos pelo trabalho manual da madeira.",
    "Patchwork": "Composição de peças por meio da união de retalhos de tecido."
});
const POR_PAGINA = 8;

async function iniciarSaberes(raiz) {
    const marco = raiz.firstElementChild;
    const grade = raiz.querySelector("#saberes-grade");
    const vazio = raiz.querySelector("#saberes-vazio");
    const chips = raiz.querySelector("#saberes-chips");
    const busca = raiz.querySelector("#saberes-busca");
    const ordem = raiz.querySelector("#saberes-ordem");
    const paginacao = raiz.querySelector("#saberes-paginacao");
    const categoria = raiz.querySelector("#saberes-categoria");
    let tecnica = parametrosPublicos().get("tecnica") || "";
    let filtroCategoria = "";
    let pagina = 1;
    let tecnicas = [];
    let trabalhos = [];

    function descricao(nome) {
        return DESCRICOES[nome] || "Conheça os trabalhos deste ofício artesanal.";
    }

    function trabalhosTecnica(nome) {
        return trabalhos.filter(function (trabalho) {
            return trabalho.tecnicas.includes(nome);
        });
    }

    function detalhe(nome) {
        const lista = trabalhosTecnica(nome);
        raiz.querySelector("#saber-detalhe-titulo").textContent = nome;
        raiz.querySelector("#saber-detalhe-texto").textContent = descricao(nome);
        raiz.querySelector("#saber-detalhe-contagem").textContent = lista.length
            ? `${lista.length} trabalho(s) publicado(s) nesta técnica.`
            : "Ainda não há trabalhos publicados nesta técnica.";
        raiz.querySelector("#saber-detalhe-produtos").href = "#/produtos?tecnica="
            + encodeURIComponent(nome);
        abrirModal("saber-detalhe");
    }

    function renderizar() {
        const lista = tecnicas.filter(function (nome) {
            const obras = trabalhosTecnica(nome);
            const texto = nome + " " + descricao(nome) + " " + obras.map(
                function (trabalho) {
                    return trabalho.materiais;
                }
            ).join(" ");
            return (!tecnica || tecnica === nome)
                && normalizar(texto).includes(normalizar(busca.value.trim()))
                && (!filtroCategoria || obras.some(function (trabalho) {
                    return trabalho.categorias.includes(filtroCategoria);
                }));
        }).sort(function (a, b) {
            if (ordem.value === "nome") {
                return a.localeCompare(b, "pt-BR");
            }
            function recente(nome) {
                return trabalhosTecnica(nome).reduce(function (maximo, trabalho) {
                    return Math.max(maximo, Date.parse(trabalho.publicadoEm) || 0);
                }, 0);
            }
            return recente(b) - recente(a);
        });
        const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        pagina = Math.min(pagina, paginas);
        const inicio = (pagina - 1) * POR_PAGINA;
        grade.innerHTML = lista.slice(inicio, inicio + POR_PAGINA).map(
            function (nome) {
                const obras = trabalhosTecnica(nome);
                const imagem = obras[0]?.imagens[0]
                    || "assets/img/carrossel/artesaos-1.jpg";
                return "<li><article class=\"card card-produto\">"
                    + `<img class="card-produto__imagem" src="${escaparHtml(imagem)}"`
                    + ` alt="Trabalho na técnica ${escaparHtml(nome)}"`
                    + " width=\"400\" height=\"150\" loading=\"lazy\">"
                    + "<div class=\"card-produto__corpo\"><h3>"
                    + escaparHtml(nome) + "</h3><p class=\"texto-pequeno\">"
                    + escaparHtml(descricao(nome)) + "</p>"
                    + "<button type=\"button\" class=\"btn btn--secundario btn--pequeno\""
                    + ` data-tecnica="${escaparHtml(nome)}">Saber mais `
                    + icone("lucide:arrow-right") + "</button></div></article></li>";
            }
        ).join("");
        vazio.hidden = lista.length > 0;
        raiz.querySelector("#saberes-contagem").textContent = lista.length
            ? `Exibindo ${inicio + 1} - ${Math.min(inicio + POR_PAGINA, lista.length)}`
                + ` de ${lista.length} técnicas`
            : "Exibindo 0 de 0 técnicas";
        paginacao.innerHTML = paginas > 1
            ? criarPaginacao(pagina, paginas) : "";
        paginacao.hidden = paginas <= 1;
        paginacao.querySelectorAll("[data-pagina]").forEach(function (botao) {
            const destino = Number(botao.dataset.pagina);
            botao.disabled = destino < 1 || destino > paginas;
        });
        prepararAcoes(grade);
        prepararAcoes(paginacao);
        chips.querySelectorAll("[data-filtro]").forEach(function (botao) {
            botao.setAttribute("aria-pressed", String(
                botao.dataset.filtro === tecnica
            ));
        });
    }

    function recomecar() {
        pagina = 1;
        renderizar();
    }

    prepararModais(raiz);
    iniciarCarrossel(raiz.querySelector(".carrossel"));
    raiz.querySelector("#saberes-form").addEventListener("submit", function (evento) {
        evento.preventDefault();
        recomecar();
    });
    busca.addEventListener("input", recomecar);
    ordem.addEventListener("change", recomecar);
    raiz.querySelector("#saberes-filtrar").addEventListener("click", function () {
        categoria.value = filtroCategoria;
        abrirModal("saberes-filtros");
    });
    raiz.querySelector("#saberes-filtros-form").addEventListener(
        "submit", function (evento) {
            evento.preventDefault();
            filtroCategoria = categoria.value;
            recomecar();
            fecharModal("saberes-filtros");
        }
    );
    raiz.querySelector("#saberes-limpar").addEventListener("click", function () {
        filtroCategoria = "";
        tecnica = "";
        busca.value = "";
        categoria.value = "";
        recomecar();
        fecharModal("saberes-filtros");
    });
    chips.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-filtro]");
        if (botao) {
            tecnica = botao.dataset.filtro;
            recomecar();
        }
    });
    grade.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-tecnica]");
        if (botao) {
            detalhe(botao.dataset.tecnica);
        }
    });
    raiz.querySelectorAll("[data-modo]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            grade.classList.toggle(
                "artesaos-grade--lista", botao.dataset.modo === "lista"
            );
            raiz.querySelectorAll("[data-modo]").forEach(function (outro) {
                outro.setAttribute("aria-pressed", String(outro === botao));
            });
        });
    });
    paginacao.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-pagina]");
        if (botao && !botao.disabled) {
            pagina = Number(botao.dataset.pagina);
            renderizar();
        }
    });
    try {
        const resultado = await Promise.all([
            carregarCategorias(), carregarVitrine()
        ]);
        if (!marco.isConnected) {
            return;
        }
        tecnicas = resultado[0].tecnicas;
        trabalhos = resultado[1].trabalhos;
        if (!tecnicas.includes(tecnica)) {
            tecnica = "";
        }
        chips.innerHTML = [""].concat(tecnicas).map(function (nome) {
            return "<button type=\"button\" class=\"filtro-chip\""
                + ` data-filtro="${escaparHtml(nome)}" aria-pressed="false">`
                + escaparHtml(nome || "Todos") + "</button>";
        }).join("");
        categoria.insertAdjacentHTML("beforeend", resultado[0].categorias.map(
            function (nome) {
                return `<option value="${escaparHtml(nome)}">`
                    + escaparHtml(nome) + "</option>";
            }
        ).join(""));
        renderizar();
    } catch (ignore) {
        if (marco.isConnected) {
            vazio.hidden = false;
            vazio.textContent = "Não foi possível carregar os saberes.";
        }
    }
}

export {iniciarSaberes};
