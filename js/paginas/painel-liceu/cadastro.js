/*jslint browser */
/**
 * paginas/painel-liceu/cadastro.js — aba Cadastrar Artesão
 * (#/painel-liceu/cadastrar-artesao).
 * Guia: docs/DESIGN.md.
 */

import {
    escaparHtml,
    icone,
    mostrarAviso,
    prepararAcoes,
    prepararCamposSenha
} from "../../componentes.js";
import {
    carregarCategorias,
    salvarArtesao
} from "../../dados.js";
import {criarOpcoes} from "./listagem.js";

/**
 * Liga o seletor de técnicas: escolher adiciona um chip removível e
 * mantém o campo oculto com os valores separados por vírgula.
 * @param {HTMLElement} raiz
 * @returns {function(): string[]} lê as técnicas escolhidas
 */
function ligarTecnicas(raiz) {
    const seletor = raiz.querySelector("[data-seletor-tecnicas]");
    const lista = raiz.querySelector("[data-tecnicas-lista]");
    const valor = raiz.querySelector("[data-tecnicas-valor]");
    let escolhidas = [];

    function exibir() {
        valor.value = escolhidas.join(",");
        lista.innerHTML = escolhidas.map(function (tecnica) {
            const nome = escaparHtml(tecnica);
            return (
                "<li class=\"chip chip--removivel\">" + nome
                + "<button type=\"button\" class=\"chip__remover\""
                + ` data-remover="${nome}" aria-label="Remover ${nome}">`
                + icone("lucide:x") + "</button></li>"
            );
        }).join("");
        prepararAcoes(lista);
    }

    seletor.addEventListener("change", function () {
        if (seletor.value && !escolhidas.includes(seletor.value)) {
            escolhidas.push(seletor.value);
            exibir();
        }
        seletor.value = "";
    });
    lista.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-remover]");
        if (botao) {
            escolhidas = escolhidas.filter(function (tecnica) {
                return tecnica !== botao.dataset.remover;
            });
            exibir();
        }
    });
    raiz.querySelector("[data-formulario]").addEventListener(
        "reset",
        function () {
            escolhidas = [];
            exibir();
        }
    );
    return function () {
        return escolhidas.slice();
    };
}

/**
 * Aba Cadastrar Artesão: formulário de acesso inicial.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarCadastro(raiz) {
    const marco = raiz.firstElementChild;
    const categorias = await carregarCategorias();
    if (!marco.isConnected) {
        return;
    }
    const formulario = raiz.querySelector("[data-formulario]");
    const senha = formulario.elements.senha;
    const confirmar = formulario.elements.confirmar;
    const lerTecnicas = ligarTecnicas(raiz);

    function conferirSenhas() {
        confirmar.setCustomValidity(
            senha.value === confirmar.value
            ? ""
            : "As senhas não conferem."
        );
    }

    formulario.elements.categoria.insertAdjacentHTML(
        "beforeend",
        criarOpcoes(categorias.categorias)
    );
    raiz.querySelector("[data-seletor-tecnicas]").insertAdjacentHTML(
        "beforeend",
        criarOpcoes(categorias.tecnicas)
    );
    prepararAcoes,
    prepararCamposSenha(formulario);
    senha.addEventListener("input", conferirSenhas);
    confirmar.addEventListener("input", conferirSenhas);
    const erro = document.createElement("p");
    erro.setAttribute("role", "alert");
    formulario.querySelector(".form-acoes").before(erro);
    formulario.elements.whatsapp.addEventListener("input", function () {
        const telefone = formulario.elements.whatsapp;
        const digitos = telefone.value.replace(/\D/g, "");
        telefone.setCustomValidity(telefone.value && (digitos.length < 10
            || digitos.length > 13) ? "Informe um telefone válido com DDD." : "");
    });
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const campos = formulario.elements;
        const botao = formulario.querySelector("[type=submit]");
        const categoria = campos.categoria.value;
        conferirSenhas();
        if (botao.disabled || !formulario.reportValidity()) {
            return;
        }
        if (!campos.nome.value.trim()) {
            erro.textContent = "Informe o nome completo do artesão.";
            campos.nome.focus();
            return;
        }
        botao.disabled = true;
        erro.textContent = "";
        try {
            await salvarArtesao({
                bio: "",
                categorias: categoria ? [categoria] : [],
                cidade: "Curitiba - PR",
                email: campos.email.value.trim(),
                empreendimento: campos.empreendimento.value.trim(),
                foto: "assets/img/avatar-padrao.jpg",
                instagram: campos.instagram.value.trim(),
                nome: campos.nome.value.trim(),
                senha: campos.senha.value,
                status: "ativo",
                tecnicas: lerTecnicas(),
                whatsapp: campos.whatsapp.value.trim()
            });
            mostrarAviso("Artesão cadastrado. O acesso já pode ser usado neste navegador.");
            if (!marco.isConnected) {
                return;
            }
            window.location.hash = "#/painel-liceu/artesaos";
        } catch (falha) {
            erro.textContent = falha.message || "Não foi possível cadastrar o artesão.";
        } finally {
            botao.disabled = false;
        }
    });
}

export {
    montarCadastro
};
