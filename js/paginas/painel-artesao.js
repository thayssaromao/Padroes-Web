/*jslint browser */
/**
 * paginas/painel-artesao.js — abas da Área do Artesão (#/painel-artesao/...).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarCardProduto,
    escaparHtml,
    icone,
    mostrarAviso
} from "../componentes.js";
import {
    buscarArtesao,
    carregarCategorias,
    contarPorStatus,
    obterSessao,
    sessaoDemonstracao,
    trabalhosDoArtesao
} from "../dados.js";

const ROTA_TRABALHOS = "#/painel-artesao/meus-trabalhos";

/**
 * Artesão logado (sessão salva ou sessão de demonstração).
 * @returns {Promise<{artesao: object, sessao: object}>}
 */
async function artesaoLogado() {
    const salva = obterSessao();
    const sessao = (
        (salva && salva.artesaoId)
        ? salva
        : sessaoDemonstracao("painel-artesao")
    );
    const artesao = await buscarArtesao(sessao.artesaoId);
    return {artesao, sessao};
}

/**
 * Trabalhos do artesão logado, do mais recente para o mais antigo.
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDoLogado() {
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDoArtesao(sessao.artesaoId);
    return trabalhos.slice().sort(function (a, b) {
        return new Date(b.atualizadoEm) - new Date(a.atualizadoEm);
    });
}

/**
 * Aba Início: resumo e últimos trabalhos.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarArtesaoInicio(raiz) {
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDoLogado();
    const contagem = contarPorStatus(trabalhos);
    const soma = function (...chaves) {
        return chaves.reduce(function (total, chave) {
            return total + (contagem[chave] || 0);
        }, 0);
    };
    raiz.querySelector("[data-artesao-nome]").textContent = sessao.nome;
    raiz.querySelector("[data-resumo]").innerHTML = [
        ["lucide:layers", trabalhos.length, "Trabalhos cadastrados"],
        ["lucide:circle-check", soma("publicado"), "Publicados"],
        ["lucide:clock", soma("em-analise", "reenviado"), "Em análise"],
        ["lucide:circle-x", soma("rejeitado", "rascunho"), "Não publicado"]
    ].map(function ([icone, numero, rotulo]) {
        return criarCardEstatistica({icone, numero, rotulo});
    }).join("");
    raiz.querySelector("[data-ultimos]").innerHTML = trabalhos.slice(
        0,
        4
    ).map(function (trabalho) {
        return criarCardProduto(trabalho, {
            favorito: false,
            href: ROTA_TRABALHOS,
            status: true
        });
    }).join("");
}

/**
 * Preenche um <select> com opções (mantém a primeira, o texto-guia).
 * @param {HTMLSelectElement} seletor
 * @param {string[]} valores
 */
function preencherOpcoes(seletor, valores) {
    seletor.insertAdjacentHTML("beforeend", valores.map(function (valor) {
        return (
            `<option value="${escaparHtml(valor)}">`
            + escaparHtml(valor) + "</option>"
        );
    }).join(""));
}

/**
 * Seletor de técnicas: o select adiciona um chip removível por técnica.
 * @param {HTMLSelectElement} seletor
 * @param {HTMLElement} lista <ul class="chips"> que recebe os chips
 * @param {Function} aoMudar chamada com a lista atual de técnicas
 * @returns {{definir: Function, obter: Function}}
 */
function ligarSeletorTecnicas(seletor, lista, aoMudar) {
    let tecnicas = [];

    function desenhar() {
        lista.innerHTML = tecnicas.map(function (tecnica) {
            return (
                "<li class=\"chip chip--removivel\">"
                + escaparHtml(tecnica)
                + "<button type=\"button\" class=\"chip__remover\""
                + ` data-remover="${escaparHtml(tecnica)}"`
                + ` aria-label="Remover ${escaparHtml(tecnica)}">`
                + icone("lucide:x") + "</button></li>"
            );
        }).join("");
        aoMudar(tecnicas);
    }

    seletor.addEventListener("change", function () {
        if (seletor.value && !tecnicas.includes(seletor.value)) {
            tecnicas = tecnicas.concat(seletor.value);
            desenhar();
        }
        seletor.value = "";
    });
    lista.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-remover]");
        if (botao) {
            tecnicas = tecnicas.filter(function (tecnica) {
                return tecnica !== botao.dataset.remover;
            });
            desenhar();
        }
    });

    return {
        definir: function (novas) {
            tecnicas = novas.slice();
            desenhar();
        },
        obter: function () {
            return tecnicas;
        }
    };
}

/**
 * Liga o botão "Alterar foto" ao input de arquivo e mostra a imagem
 * escolhida, liberando o object URL anterior.
 * @param {HTMLElement} raiz
 * @param {Function} aoMudar chamada com a nova URL da imagem
 * @returns {{restaurar: Function}}
 */
function ligarTrocaDeFoto(raiz, aoMudar) {
    const botao = raiz.querySelector("[data-alterar-foto]");
    const entrada = raiz.querySelector("[data-foto-entrada]");
    const imagem = raiz.querySelector("[data-foto]");
    let urlAtual = "";

    function liberar() {
        if (urlAtual) {
            URL.revokeObjectURL(urlAtual);
            urlAtual = "";
        }
    }

    botao.addEventListener("click", function () {
        entrada.click();
    });
    entrada.addEventListener("change", function () {
        const arquivo = entrada.files[0];
        if (arquivo) {
            liberar();
            urlAtual = URL.createObjectURL(arquivo);
            imagem.src = urlAtual;
            aoMudar(urlAtual);
        }
    });

    return {
        restaurar: function (origem) {
            liberar();
            entrada.value = "";
            imagem.src = origem;
            aoMudar(origem);
        }
    };
}

/**
 * Atualiza o card de pré-visualização do perfil público.
 * @param {HTMLElement} raiz
 * @param {string[]} tecnicas técnicas escolhidas
 */
function atualizarPrevia(raiz, tecnicas) {
    const valor = function (id) {
        return raiz.querySelector(id).value.trim();
    };
    const texto = function (gancho, conteudo) {
        raiz.querySelector(gancho).textContent = conteudo;
    };
    texto("[data-previa-nome]", valor("#perfil-nome") || "Nome do Artesão");
    texto(
        "[data-previa-categoria]",
        valor("#perfil-categoria") || "Categoria"
    );
    texto("[data-previa-tecnicas]", "Técnicas: " + tecnicas.join(", "));
    texto(
        "[data-previa-bio]",
        valor("#perfil-bio")
        || "Um breve texto sobre você, sua história e sua relação com o "
        + "artesanato."
    );
}

/**
 * Salva o perfil do artesão.
 * @param {object} ignore dados do formulário
 */
function salvarPerfil(ignore) {
    // A IMPLEMENTAR: persistir o perfil com salvarArtesao (localStorage).
    mostrarAviso("Em breve: salvar as alterações do perfil.");
}

/**
 * Aba Meu perfil: formulário e pré-visualização.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarArtesaoPerfil(raiz) {
    const {artesao} = await artesaoLogado();
    const dadosCategorias = await carregarCategorias();
    const formulario = raiz.querySelector("[data-form-perfil]");
    const previaFoto = raiz.querySelector("[data-previa-foto]");
    const seletorCategoria = raiz.querySelector("#perfil-categoria");
    let seletorTecnicas;

    function aoMudar() {
        atualizarPrevia(raiz, seletorTecnicas.obter());
    }

    preencherOpcoes(seletorCategoria, dadosCategorias.categorias);
    preencherOpcoes(
        raiz.querySelector("#perfil-tecnica"),
        dadosCategorias.tecnicas
    );
    seletorTecnicas = ligarSeletorTecnicas(
        raiz.querySelector("#perfil-tecnica"),
        raiz.querySelector("[data-tecnicas]"),
        aoMudar
    );
    const foto = ligarTrocaDeFoto(raiz, function (url) {
        previaFoto.src = url;
    });

    function preencher() {
        const campos = {
            "#perfil-bio": artesao.bio,
            "#perfil-email": artesao.email,
            "#perfil-empreendimento": artesao.empreendimento,
            "#perfil-instagram": artesao.instagram,
            "#perfil-nome": artesao.nome,
            "#perfil-whatsapp": artesao.whatsapp
        };
        Object.entries(campos).forEach(function ([seletor, valor]) {
            raiz.querySelector(seletor).value = valor ?? "";
        });
        seletorCategoria.value = artesao.categorias[0] ?? "";
        foto.restaurar(artesao.foto);
        seletorTecnicas.definir(artesao.tecnicas);
    }

    preencher();
    ["#perfil-nome", "#perfil-categoria", "#perfil-bio"].forEach(
        function (seletor) {
            raiz.querySelector(seletor).addEventListener("input", aoMudar);
        }
    );
    raiz.querySelector("[data-cancelar]").addEventListener(
        "click",
        preencher
    );
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        if (formulario.reportValidity()) {
            salvarPerfil(Object.assign(
                Object.fromEntries(new FormData(formulario)),
                {tecnicas: seletorTecnicas.obter()}
            ));
        }
    });
}

/**
 * Aba Meus trabalhos: grade de trabalhos com filtros.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarArtesaoTrabalhos(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Novo trabalho: formulário e upload de imagens.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarArtesaoNovoTrabalho(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Status das publicações: resumo e tabela.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarArtesaoStatus(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

export {
    iniciarArtesaoInicio,
    iniciarArtesaoNovoTrabalho,
    iniciarArtesaoPerfil,
    iniciarArtesaoStatus,
    iniciarArtesaoTrabalhos
};
