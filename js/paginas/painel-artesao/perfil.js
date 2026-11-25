/*jslint browser */
/**
 * paginas/painel-artesao/perfil.js — aba Meu perfil
 * (#/painel-artesao/meu-perfil).
 * Guia: docs/DESIGN.md.
 */

import {
    criarChips,
    mostrarAviso,
    prepararChips,
    prepararMultisselecao
} from "../../componentes.js";
import {
    carregarCategorias,
    salvarArtesao
} from "../../dados.js";
import {
    artesaoLogado,
    confirmar,
    preencherOpcoes
} from "./compartilhado.js";
import {lerImagem} from "./imagens.js";

/** Valores de um select múltiplo apresentado pelo componente compartilhado. */
function ligarSelecaoMultipla(seletor, aoMudar) {
    seletor.addEventListener("change", aoMudar);
    return {
        definir: function (valores) {
            Array.from(seletor.options).forEach(function (opcao) {
                opcao.selected = valores.includes(opcao.value);
            });
            seletor.dispatchEvent(new Event("change", {bubbles: true}));
        },
        obter: function () {
            return Array.from(seletor.selectedOptions, function (opcao) {
                return opcao.value;
            });
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
    let atual = imagem.src;
    let pendente = Promise.resolve();
    let versao = 0;

    botao.addEventListener("click", function () {
        entrada.click();
    });
    entrada.addEventListener("change", function () {
        const arquivo = entrada.files[0];
        versao += 1;
        const minha = versao;
        if (arquivo) {
            pendente = lerImagem(arquivo).then(function (url) {
                if (minha !== versao) {
                    return;
                }
                atual = url;
                imagem.src = url;
                aoMudar(url);
            }).catch(function (erro) {
                mostrarAviso(erro.message);
            });
        }
    });

    return {
        obter: async function () {
            await pendente;
            return atual;
        },
        restaurar: function (origem) {
            versao += 1;
            atual = origem || "assets/img/avatar-padrao.jpg";
            entrada.value = "";
            imagem.src = atual;
            aoMudar(atual);
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
    const categorias = Array.from(
        raiz.querySelector("#perfil-categoria").selectedOptions,
        function (opcao) { return opcao.value; }
    );
    raiz.querySelector("[data-previa-categorias]").innerHTML = criarChips(
        categorias.length ? categorias : ["Categoria"]
    );
    texto("[data-previa-tecnicas]", "Técnicas: " + tecnicas.join(", "));
    texto(
        "[data-previa-bio]",
        valor("#perfil-bio")
        || "Um breve texto sobre você, sua história e sua relação com o "
        + "artesanato."
    );
    prepararChips(raiz.querySelector(".previa-perfil"));
}

/**
 * Aba Meu perfil: formulário e pré-visualização.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarPerfil(raiz) {
    const marco = raiz.firstElementChild;
    let {artesao} = await artesaoLogado();
    const dadosCategorias = await carregarCategorias();
    if (!marco.isConnected) {
        return;
    }
    const formulario = raiz.querySelector("[data-form-perfil]");
    const previaFoto = raiz.querySelector("[data-previa-foto]");
    const seletorCategoria = raiz.querySelector("#perfil-categoria");
    let seletorTecnicas;
    let seletorCategorias;
    let salvo;

    function aoMudar() {
        atualizarPrevia(raiz, seletorTecnicas.obter());
    }

    preencherOpcoes(seletorCategoria, dadosCategorias.categorias);
    preencherOpcoes(
        raiz.querySelector("#perfil-tecnica"),
        dadosCategorias.tecnicas
    );
    seletorTecnicas = ligarSelecaoMultipla(
        raiz.querySelector("#perfil-tecnica"), aoMudar
    );
    seletorCategorias = ligarSelecaoMultipla(seletorCategoria, aoMudar);
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
            raiz.querySelector(seletor).setCustomValidity("");
        });
        seletorCategorias.definir(artesao.categorias);
        foto.restaurar(artesao.foto);
        seletorTecnicas.definir(artesao.tecnicas);
    }

    function estadoPerfil() {
        return JSON.stringify({
            campos: Object.fromEntries(new FormData(formulario)),
            categorias: seletorCategorias.obter(),
            foto: previaFoto.src,
            tecnicas: seletorTecnicas.obter()
        });
    }
    const feedback = formulario.querySelector("[data-perfil-feedback]");
    const campoNome = formulario.elements.nome;
    const campoEmail = formulario.elements.email;
    function validarPessoais() {
        campoNome.setCustomValidity(campoNome.value.trim()
            ? "" : "Informe o nome completo.");
        const email = campoEmail.value.trim();
        campoEmail.setCustomValidity(!email ? "Informe o e-mail."
            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ? "" : "Informe um e-mail válido.");
        [campoNome, campoEmail].forEach(function (campo) {
            if (campo.validity.valid) {
                campo.removeAttribute("aria-invalid");
            }
        });
    }
    [campoNome, campoEmail].forEach(function (campo) {
        campo.addEventListener("input", function () {
            validarPessoais();
            feedback.textContent = "";
        });
    });
    formulario.addEventListener("invalid", function (evento) {
        if ([campoNome, campoEmail].includes(evento.target)) {
            validarPessoais();
            evento.target.setAttribute("aria-invalid", "true");
            feedback.textContent = evento.target.validationMessage;
        }
    }, true);
    const campoWhatsapp = formulario.elements.whatsapp;
    campoWhatsapp.addEventListener("input", function () {
        const numero = campoWhatsapp.value.replace(/\D/g, "");
        campoWhatsapp.setCustomValidity(!campoWhatsapp.value
            || (numero.length >= 10 && numero.length <= 13)
            ? "" : "Informe um WhatsApp com DDD.");
    });
    preencher();
    prepararMultisselecao(raiz);
    salvo = estadoPerfil();
    ["#perfil-nome", "#perfil-categoria", "#perfil-bio"].forEach(
        function (seletor) {
            raiz.querySelector(seletor).addEventListener("input", aoMudar);
        }
    );
    raiz.querySelector("[data-cancelar]").addEventListener(
        "click",
        async function () {
            if (estadoPerfil() !== salvo && !await confirmar(
                "Descartar alterações?",
                "As alterações não salvas do perfil serão descartadas.",
                "Descartar"
            )) {
                return;
            }
            preencher();
            feedback.textContent = "";
            [campoNome, campoEmail].forEach(function (campo) {
                campo.removeAttribute("aria-invalid");
            });
            salvo = estadoPerfil();
            mostrarAviso("Alterações descartadas.");
        }
    );
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const botao = formulario.querySelector("[type=\"submit\"]");
        validarPessoais();
        if (!formulario.reportValidity() || botao.disabled) {
            return;
        }
        feedback.textContent = "";
        botao.disabled = true;
        try {
            const dados = Object.fromEntries(new FormData(formulario));
            const imagem = await foto.obter();
            if (!marco.isConnected) {
                return;
            }
            artesao = await salvarArtesao(Object.assign({}, artesao, dados, {
                categorias: seletorCategorias.obter(),
                foto: imagem,
                tecnicas: seletorTecnicas.obter()
            }));
            if (marco.isConnected) {
                document.querySelector("[data-usuario-nome]").textContent
                    = artesao.nome;
                const usuarioFoto = document.querySelector(
                    "[data-usuario-foto]"
                );
                usuarioFoto.src = artesao.foto;
            }
            salvo = estadoPerfil();
            mostrarAviso("Alterações do perfil salvas.");
        } catch (erro) {
            feedback.textContent = erro.message || "Não foi possível salvar o perfil.";
        } finally {
            botao.disabled = false;
        }
    });
}

export {
    montarPerfil
};
