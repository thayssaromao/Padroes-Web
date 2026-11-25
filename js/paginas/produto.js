/*jslint browser */
import {criarChips, escaparHtml, icone, iniciarCarrossel} from "../componentes.js";
import {
    carregarVitrine,
    criarCardPublico,
    ligarFavoritos,
    parametrosPublicos
} from "./publico.js";

async function iniciarProduto(raiz) {
    const marco = raiz.firstElementChild;
    const feedback = raiz.querySelector("#produto-feedback");
    const id = parametrosPublicos().get("id");
    try {
        const vitrine = await carregarVitrine();
        if (!marco.isConnected) {
            return;
        }
        const produto = vitrine.trabalhos.find(function (trabalho) {
            return trabalho.id === id;
        });
        if (!produto) {
            feedback.innerHTML = "Produto não encontrado ou indisponível. "
                + "<a href=\"#/produtos\">Voltar ao catálogo</a>";
            raiz.querySelector("#produto-detalhes").hidden = false;
            raiz.querySelector("#produto-detalhes").replaceChildren(
                raiz.querySelector("#produto-titulo")
            );
            raiz.querySelector("#produto-titulo").textContent = "Produto indisponível";
            return;
        }
        const artesao = vitrine.artesaos.find(function (item) {
            return item.id === produto.artesaoId;
        });
        feedback.hidden = true;
        ["detalhes", "contexto", "relacionados-secao"].forEach(function (parte) {
            raiz.querySelector("#produto-" + parte).hidden = false;
        });
        ["titulo", "materiais", "tecnica", "dimensoes", "descricao"].forEach(
            function (campo) {
                raiz.querySelector("#produto-" + campo).textContent = (
                    (campo === "tecnica" ? produto.tecnicas.join(", ") : produto[campo]) || "Não informado"
                );
            }
        );
        raiz.querySelector("#produto-categoria").innerHTML = criarChips(produto.categorias);
        raiz.querySelector("#produto-breadcrumb").textContent = produto.titulo;
        raiz.querySelector("#produto-preco").textContent = produto.preco === null
            ? "Preço sob consulta com o artesão" : Number(produto.preco).toLocaleString(
                "pt-BR", {currency: "BRL", style: "currency"}
            );
        raiz.querySelector("#produto-preco").classList.toggle(
            "produto-preco--consulta", produto.preco === null
        );
        const imagens = produto.imagens.length ? produto.imagens
            : ["assets/img/avatar-padrao.jpg"];
        const tecnicaImagem = raiz.querySelector("#produto-tecnica-imagem");
        tecnicaImagem.src = imagens[0];
        tecnicaImagem.alt = "Trabalho nas técnicas " + produto.tecnicas.join(", ");
        const galeria = raiz.querySelector("#produto-galeria");
        galeria.querySelector(".carrossel__trilho").innerHTML = imagens.map(
            function (imagem, indice) {
                return "<li class=\"carrossel__slide\" aria-roledescription=\"slide\""
                    + ` aria-label="${indice + 1} de ${imagens.length}">`
                    + `<img src="${escaparHtml(imagem)}"`
                    + ` alt="${escaparHtml(produto.titulo)} — foto ${indice + 1}"`
                    + " width=\"1200\" height=\"525\"></li>";
            }
        ).join("");
        galeria.querySelector(".carrossel__indicadores").innerHTML = imagens.map(
            function (ignore, indice) {
                return "<button type=\"button\" class=\"carrossel__ponto\""
                    + ` aria-label="Ir para foto ${indice + 1}"`
                    + ` aria-current="${indice === 0}"></button>`;
            }
        ).join("");
        raiz.querySelector("#produto-miniaturas").innerHTML = imagens.map(
            function (imagem, indice) {
                return "<button type=\"button\" class=\"miniatura\""
                    + ` data-foto="${indice}" aria-label="Selecionar foto ${indice + 1}"`
                    + ` aria-pressed="${indice === 0}">`
                    + `<img src="${escaparHtml(imagem)}" alt=""`
                    + " width=\"100\" height=\"100\"></button>";
            }
        ).join("");
        galeria.querySelectorAll(".carrossel__seta").forEach(function (botao) {
            botao.hidden = imagens.length < 2;
        });
        galeria.querySelector(".carrossel__indicadores").hidden = imagens.length < 2;
        iniciarCarrossel(galeria);
        function atualizarMiniaturas() {
            const pontos = galeria.querySelectorAll(".carrossel__ponto");
            raiz.querySelectorAll("[data-foto]").forEach(function (botao, indice) {
                botao.setAttribute("aria-pressed", String(
                    pontos[indice].getAttribute("aria-current") === "true"
                ));
            });
        }
        const observador = new MutationObserver(atualizarMiniaturas);
        observador.observe(galeria.querySelector(".carrossel__indicadores"), {
            attributeFilter: ["aria-current"],
            attributes: true,
            subtree: true
        });
        atualizarMiniaturas();
        raiz.querySelector("#produto-miniaturas").addEventListener(
            "click", function (evento) {
                const botao = evento.target.closest("[data-foto]");
                if (botao) {
                    galeria.querySelectorAll(".carrossel__ponto")[
                        Number(botao.dataset.foto)
                    ].click();
                }
            }
        );
        raiz.querySelector("#produto-artesao").innerHTML = (
            "<img src=\""
            + escaparHtml(artesao.foto || "assets/img/avatar-padrao.jpg")
            + "\" alt=\"Foto de " + escaparHtml(artesao.nome)
            + "\" width=\"96\" height=\"96\"><div class=\"pilha\"><p><strong>"
            + escaparHtml(artesao.nome) + "</strong><br>"
            + escaparHtml(artesao.empreendimento) + "</p><p class=\"produto-bio\" tabindex=\"0\">"
            + escaparHtml(artesao.bio) + "</p><a class=\"btn btn--secundario\""
            + " href=\"#/artesaos?id=" + encodeURIComponent(artesao.id)
            + "\">Conheça este artesão" + icone("lucide:arrow-right")
            + "</a></div>"
        );
        raiz.querySelector("#produto-saber-nome").textContent = produto.tecnicas.join(", ");
        raiz.querySelector("#produto-saber").textContent =
            "Conheça outros trabalhos e as pessoas que praticam este ofício.";
        const linkTecnica = raiz.querySelector("#produto-saber-link");
        produto.tecnicas.forEach(function (nome, indice) {
            const link = indice ? linkTecnica.cloneNode(true) : linkTecnica;
            if (indice) {
                link.removeAttribute("id");
                linkTecnica.parentElement.append(link);
            }
            link.href = "#/saberes?tecnica=" + encodeURIComponent(nome);
            link.innerHTML = "Conheça " + escaparHtml(nome) + icone("lucide:arrow-right");
        });
        const relacionados = vitrine.trabalhos.filter(function (trabalho) {
            return trabalho.id !== produto.id && (
                trabalho.categorias.some(function (valor) { return produto.categorias.includes(valor); })
                || trabalho.tecnicas.some(function (valor) { return produto.tecnicas.includes(valor); })
            );
        }).slice(0, 4);
        raiz.querySelector("#produto-relacionados").classList.toggle(
            "produto-relacionados--tres", relacionados.length === 3
        );
        raiz.querySelector("#produto-relacionados").innerHTML = relacionados.map(
            function (trabalho) {
                return criarCardPublico(trabalho);
            }
        ).join("") || "<p>Nenhum produto relacionado no momento.</p>";
        raiz.querySelector("#produto-favorito").dataset.favorito = produto.id;
        raiz.querySelector("#produto-favorito").setAttribute(
            "aria-label", "Favoritar " + produto.titulo
        );
        ligarFavoritos(raiz);
    } catch (ignore) {
        if (marco.isConnected) {
            feedback.textContent = "Não foi possível carregar este produto.";
        }
    }
}

export {iniciarProduto};
