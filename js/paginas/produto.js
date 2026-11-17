/*jslint browser */
import {escaparHtml, iniciarCarrossel} from "../componentes.js";
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
        ["titulo", "categoria", "materiais", "tecnica", "dimensoes", "descricao"].forEach(
            function (campo) {
                raiz.querySelector("#produto-" + campo).textContent = (
                    produto[campo] || "Não informado"
                );
            }
        );
        raiz.querySelector("#produto-breadcrumb").textContent = produto.titulo;
        raiz.querySelector("#produto-preco").textContent = produto.preco === null
            ? "Preço sob consulta com o artesão" : Number(produto.preco).toLocaleString(
                "pt-BR", {currency: "BRL", style: "currency"}
            );
        const imagens = produto.imagens.length ? produto.imagens
            : ["assets/img/avatar-padrao.jpg"];
        const tecnicaImagem = raiz.querySelector("#produto-tecnica-imagem");
        tecnicaImagem.src = imagens[0];
        tecnicaImagem.alt = "Trabalho na técnica " + produto.tecnica;
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
                    + ` data-foto="${indice}" aria-label="Selecionar foto ${indice + 1}">`
                    + `<img src="${escaparHtml(imagem)}" alt=""`
                    + " width=\"100\" height=\"100\"></button>";
            }
        ).join("");
        galeria.querySelectorAll(".carrossel__seta").forEach(function (botao) {
            botao.hidden = imagens.length < 2;
        });
        iniciarCarrossel(galeria);
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
            "<div class=\"card-artesao-mini\"><img src=\""
            + escaparHtml(artesao.foto || "assets/img/avatar-padrao.jpg")
            + "\" alt=\"Foto de " + escaparHtml(artesao.nome)
            + "\" width=\"96\" height=\"96\"><p>"
            + escaparHtml(artesao.nome) + "<br>"
            + escaparHtml(artesao.empreendimento) + "</p></div><p>"
            + escaparHtml(artesao.bio) + "</p><a class=\"btn btn--secundario\""
            + " href=\"#/artesaos?id=" + encodeURIComponent(artesao.id)
            + "\">Conheça este artesão</a>"
        );
        raiz.querySelector("#produto-saber").textContent = produto.tecnica
            + ": conheça outros trabalhos e as pessoas que praticam este ofício.";
        raiz.querySelector("#produto-saber-link").href = "#/saberes?tecnica="
            + encodeURIComponent(produto.tecnica);
        const relacionados = vitrine.trabalhos.filter(function (trabalho) {
            return trabalho.id !== produto.id && (
                trabalho.categoria === produto.categoria
                || trabalho.tecnica === produto.tecnica
            );
        }).slice(0, 4);
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
