/*jslint browser */
import {carregarCategorias} from "./dados.js";
import {criarPaginacao, escaparHtml, prepararAcoes} from "./componentes.js";
import {
    carregarVitrine,
    criarCardPublico,
    lerFavoritos,
    ligarFavoritos,
    normalizar,
    parametrosPublicos
} from "./paginas/publico.js";

const POR_PAGINA = 8;

async function inicializarProdutos(raiz) {
    const marco = raiz.firstElementChild;
    const painel = raiz.querySelector("#painelFiltros");
    const grade = raiz.querySelector("#gradeProdutos");
    const contador = raiz.querySelector("#contadorResultados");
    const busca = raiz.querySelector("#inputBusca");
    const ordem = raiz.querySelector("#selectOrdenacao");
    const paginacao = raiz.querySelector("#paginacaoCatalogo");
    const pilulas = raiz.querySelector("#pilulasCategoria");
    const botaoFavoritos = raiz.querySelector("#btnSomenteFavoritos");
    let somenteFavoritos = false;
    let pagina = 1;
    let trabalhos = [];
    let artesaos = [];

    function marcados(classe) {
        return Array.from(painel.querySelectorAll(
            "." + classe + ":checked"
        ), function (campo) {
            return campo.value;
        });
    }

    function sincronizarPilulas() {
        const categorias = marcados("chk-categoria");
        pilulas.querySelectorAll("button").forEach(function (botao) {
            const ativo = (
                categorias.length === 0
                ? botao.dataset.categoria === "Todos"
                : categorias.length === 1
                && categorias[0] === botao.dataset.categoria
            );
            botao.classList.toggle("ativa", ativo);
            botao.setAttribute("aria-pressed", String(ativo));
        });
    }

    function renderizar() {
        const categorias = marcados("chk-categoria");
        const tecnicas = marcados("chk-tecnica");
        const materiais = marcados("chk-material");
        const preco = painel.querySelector(
            "input[name=\"faixaPreco\"]:checked"
        ).value;
        const favoritos = lerFavoritos();
        botaoFavoritos.setAttribute("aria-pressed", String(somenteFavoritos));
        const lista = trabalhos.filter(function (trabalho) {
            const artesao = artesaos.find(function (item) {
                return item.id === trabalho.artesaoId;
            });
            const texto = normalizar([
                trabalho.titulo, artesao.nome, trabalho.descricao,
                trabalho.categoria, trabalho.tecnica
            ].join(" "));
            const valor = trabalho.preco;
            const passaPreco = preco === "todos" || (
                valor !== null && Number.isFinite(Number(valor)) && (
                    (preco === "ate50" && valor <= 50)
                    || (preco === "50a100" && valor > 50 && valor <= 100)
                    || (preco === "acima100" && valor > 100)
                )
            );
            return (!somenteFavoritos || favoritos.includes(trabalho.id))
                && texto.includes(normalizar(busca.value.trim()))
                && (!categorias.length || categorias.includes(trabalho.categoria))
                && (!tecnicas.length || tecnicas.includes(trabalho.tecnica))
                && (!materiais.length || materiais.some(function (material) {
                    return normalizar(trabalho.materiais).includes(
                        normalizar(material)
                    );
                })) && passaPreco;
        });
        lista.sort(function (a, b) {
            if (ordem.value !== "recentes") {
                if (a.preco === null) {
                    return b.preco === null ? 0 : 1;
                }
                if (b.preco === null) {
                    return -1;
                }
                return ordem.value === "menor_preco"
                    ? a.preco - b.preco : b.preco - a.preco;
            }
            return Date.parse(b.publicadoEm) - Date.parse(a.publicadoEm);
        });
        const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        pagina = Math.min(pagina, paginas);
        const inicio = (pagina - 1) * POR_PAGINA;
        const visiveis = lista.slice(inicio, inicio + POR_PAGINA);
        grade.innerHTML = visiveis.map(function (trabalho) {
            const artesao = artesaos.find(function (item) {
                return item.id === trabalho.artesaoId;
            });
            const precoTexto = trabalho.preco === null
                ? "Preço sob consulta" : Number(trabalho.preco).toLocaleString(
                    "pt-BR", {currency: "BRL", style: "currency"}
                );
            return criarCardPublico(trabalho, {
                acoes: "<p class=\"texto-pequeno\">Por "
                    + escaparHtml(artesao.nome) + "<br>"
                    + escaparHtml(precoTexto) + "</p>"
            });
        }).join("") || "<p class=\"texto-suave\" role=\"status\">"
            + (somenteFavoritos
                ? "Nenhum favorito encontrado para estes filtros. Favorite um produto ou desative Somente favoritos."
                : "Nenhum produto encontrado. Ajuste a busca ou os filtros.")
            + "</p>";
        contador.textContent = lista.length
            ? `Exibindo ${inicio + 1} - ${inicio + visiveis.length}`
                + ` de ${lista.length} produtos`
            : "Exibindo 0 de 0 produtos";
        paginacao.innerHTML = paginas > 1
            ? criarPaginacao(pagina, paginas) : "";
        paginacao.hidden = paginas <= 1;
        paginacao.querySelectorAll("[data-pagina]").forEach(function (botao) {
            const destino = Number(botao.dataset.pagina);
            botao.disabled = destino < 1 || destino > paginas;
        });
        prepararAcoes(grade);
        prepararAcoes(paginacao);
        sincronizarPilulas();
    }

    function recomecar() {
        pagina = 1;
        renderizar();
    }

    botaoFavoritos.addEventListener("click", function () {
        somenteFavoritos = !somenteFavoritos;
        recomecar();
    });
    grade.addEventListener("favoritos-alterados", function () {
        if (somenteFavoritos && marco.isConnected) {
            renderizar();
        }
    });

    painel.querySelectorAll(".acordeao-toggle").forEach(function (titulo, indice) {
        const lista = titulo.closest(".grupo-filtro").querySelector(".lista-checkboxes");
        lista.id = "catalogo-filtro-" + indice;
        titulo.setAttribute("aria-controls", lista.id);
        function alternar() {
            const grupo = titulo.closest(".grupo-filtro");
            grupo.classList.toggle("aberto");
            titulo.setAttribute("aria-expanded", String(
                grupo.classList.contains("aberto")
            ));
        }
        titulo.setAttribute("aria-expanded", String(
            titulo.closest(".grupo-filtro").classList.contains("aberto")
        ));
        titulo.addEventListener("click", alternar);
    });
    busca.addEventListener("input", recomecar);
    painel.addEventListener("change", recomecar);
    ordem.addEventListener("change", recomecar);
    pilulas.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-categoria]");
        if (botao) {
            painel.querySelectorAll(".chk-categoria").forEach(function (campo) {
                campo.checked = campo.value === botao.dataset.categoria;
            });
            recomecar();
        }
    });
    raiz.querySelector("#btnLimparFiltros").addEventListener("click", function () {
        busca.value = "";
        somenteFavoritos = false;
        painel.querySelectorAll("input[type=\"checkbox\"]").forEach(
            function (campo) {
                campo.checked = false;
            }
        );
        painel.querySelector("[value=\"todos\"]").checked = true;
        recomecar();
    });
    ["Grade", "Lista"].forEach(function (tipo) {
        const botao = raiz.querySelector("#btnView" + tipo);
        botao.setAttribute("aria-label", "Visualização em " + tipo.toLowerCase());
        botao.setAttribute("aria-pressed", String(tipo === "Grade"));
        botao.addEventListener("click", function () {
            grade.classList.toggle("modo-lista", tipo === "Lista");
            ["Grade", "Lista"].forEach(function (outro) {
                const item = raiz.querySelector("#btnView" + outro);
                item.classList.toggle("ativa", outro === tipo);
                item.setAttribute("aria-pressed", String(outro === tipo));
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
    ligarFavoritos(grade);
    try {
        const resultado = await Promise.all([
            carregarVitrine(), carregarCategorias()
        ]);
        if (!marco.isConnected) {
            return;
        }
        trabalhos = resultado[0].trabalhos;
        artesaos = resultado[0].artesaos;
        ["categorias", "tecnicas"].forEach(function (chave, indice) {
            const classe = indice === 0 ? "chk-categoria" : "chk-tecnica";
            const grupo = painel.querySelector("." + classe).parentElement.parentElement;
            grupo.innerHTML = resultado[1][chave].map(function (opcao) {
                return "<label><input type=\"checkbox\" class=\"" + classe
                    + "\" value=\"" + escaparHtml(opcao) + "\"> "
                    + escaparHtml(opcao) + "</label>";
            }).join("");
        });
        pilulas.innerHTML = ["Todos"].concat(resultado[1].categorias).map(
            function (opcao) {
                return "<button type=\"button\" class=\"opcao filtro-chip\""
                    + " data-categoria=\"" + escaparHtml(opcao) + "\">"
                    + escaparHtml(opcao) + "</button>";
            }
        ).join("");
        const tecnicaInicial = parametrosPublicos().get("tecnica");
        const categoriaInicial = parametrosPublicos().get("categoria");
        painel.querySelectorAll(".chk-tecnica").forEach(function (campo) {
            campo.checked = campo.value === tecnicaInicial;
        });
        painel.querySelectorAll(".chk-categoria").forEach(function (campo) {
            campo.checked = campo.value === categoriaInicial;
        });
        renderizar();
    } catch (ignore) {
        if (marco.isConnected) {
            grade.textContent = "Não foi possível carregar o catálogo.";
            contador.textContent = "Catálogo indisponível.";
        }
    }
}

export {inicializarProdutos};
