/*jslint browser */
/** Dados e interações comuns da vitrine pública. */
import {carregarArtesaos, carregarTrabalhos} from "../dados.js";
import {
    criarCardProduto,
    escaparHtml,
    icone,
    mostrarAviso
} from "../componentes.js";

const CHAVE_FAVORITOS = "liceu:favoritos";
const favoritosPreparados = new WeakSet();

function lerFavoritos() {
    try {
        const lista = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS));
        return Array.isArray(lista) ? Array.from(new Set(lista.filter(
            function (id) { return typeof id === "string" && id.length > 0; }
        ))) : [];
    } catch (ignore) {
        return [];
    }
}

function atualizarFavorito(botao, ativo) {
    botao.setAttribute("aria-pressed", String(ativo));
    botao.innerHTML = icone("lucide:heart");
}

/** Atualiza controles existentes e avisa listagens sem manter referências antigas. */
function avisarFavoritos() {
    const favoritos = lerFavoritos();
    document.querySelectorAll("[data-favorito]").forEach(function (botao) {
        atualizarFavorito(botao, favoritos.includes(botao.dataset.favorito));
    });
    document.querySelectorAll("[data-favoritos-lista]").forEach(function (lista) {
        lista.dispatchEvent(new CustomEvent("favoritos-alterados"));
    });
}

window.addEventListener("storage", function (evento) {
    if (evento.key === CHAVE_FAVORITOS || evento.key === null) {
        avisarFavoritos();
    }
});

/** Liga os favoritos também em cards inseridos depois da inicialização. */
function ligarFavoritos(conteiner) {
    conteiner.querySelectorAll("[data-favorito]").forEach(function (botao) {
        atualizarFavorito(botao, lerFavoritos().includes(botao.dataset.favorito));
    });
    conteiner.dataset.favoritosLista = "";
    if (favoritosPreparados.has(conteiner)) {
        return;
    }
    favoritosPreparados.add(conteiner);
    conteiner.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-favorito]");
        if (!botao) {
            return;
        }
        const lista = lerFavoritos();
        const id = botao.dataset.favorito;
        const ativo = !lista.includes(id);
        const nova = ativo ? lista.concat(id) : lista.filter(function (item) {
            return item !== id;
        });
        try {
            localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(nova));
            avisarFavoritos();
        } catch (ignore) {
            mostrarAviso("Não foi possível salvar o favorito neste navegador.");
        }
    });
}

function criarCardPublico(trabalho, opcoes = {}) {
    const html = criarCardProduto(trabalho, Object.assign({}, opcoes, {
        href: "#/produto?id=" + encodeURIComponent(trabalho.id)
    }));
    const ativo = lerFavoritos().includes(trabalho.id);
    return html.replace(
        "class=\"card-produto__favorito\"",
        "class=\"card-produto__favorito\" data-favorito=\""
        + escaparHtml(trabalho.id) + "\""
    ).replace(
        "aria-pressed=\"false\"",
        "aria-pressed=\"" + String(ativo) + "\""
    );
}

/** Somente trabalhos publicados de artesãos ativos são públicos. */
async function carregarVitrine() {
    const listas = await Promise.all([
        carregarTrabalhos(), carregarArtesaos()
    ]);
    const artesaos = listas[1].filter(function (artesao) {
        return artesao.status === "ativo";
    });
    const trabalhos = listas[0].filter(function (trabalho) {
        return trabalho.status === "publicado" && artesaos.some(
            function (artesao) {
                return artesao.id === trabalho.artesaoId;
            }
        );
    });
    return {artesaos, trabalhos};
}

function parametrosPublicos() {
    return new URLSearchParams(window.location.hash.split("?")[1] || "");
}

function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(
        /[\u0300-\u036f]/g, ""
    ).toLowerCase();
}

export {
    carregarVitrine,
    criarCardPublico,
    lerFavoritos,
    ligarFavoritos,
    normalizar,
    parametrosPublicos
};
