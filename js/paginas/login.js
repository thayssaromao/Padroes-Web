/*jslint browser */
import {
    abrirModal,
    fecharModal,
    mostrarAviso,
    prepararCamposSenha,
    prepararModais
} from "../componentes.js";

import {autenticar} from "../dados.js";

const ARQUIVO_LOGIN = "pages/login.html";
const ID_MODAL = "modal-login";

let carregamento;

/** @returns {Promise<void>} insere o <dialog> no fim do <body> */
async function carregarLogin() {
    const resposta = await fetch(ARQUIVO_LOGIN);
    const recipiente = document.createElement("div");
    if (!resposta.ok) {
        throw new Error(String(resposta.status));
    }
    recipiente.innerHTML = await resposta.text();
    document.body.append(recipiente);
    prepararModais(recipiente);
    prepararCamposSenha(recipiente);
    const formulario = recipiente.querySelector("form");
    const erro = recipiente.querySelector("[data-login-erro]");
    const botao = formulario.querySelector("[type=submit]");
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        if (botao.disabled || !formulario.reportValidity()) {
            return;
        }
        botao.disabled = true;
        erro.textContent = "";
        try {
            const sessao = await autenticar(
                formulario.elements.email.value,
                formulario.elements.senha.value,
                formulario.elements.lembrar.checked
            );
            fecharModal(ID_MODAL);
            formulario.reset();
            window.dispatchEvent(new CustomEvent("conta-autenticada", {
                detail: sessao.perfil
            }));
            mostrarAviso("Bem-vindo, " + sessao.nome + ".");
        } catch (falha) {
            erro.textContent = falha.message;
        } finally {
            botao.disabled = false;
        }
    });
    recipiente.querySelector("[data-recuperar-senha]").addEventListener(
        "click",
        function () {
            fecharModal(ID_MODAL);
            window.location.hash = "#/contato";
            mostrarAviso("Solicite ao Liceu a redefinição do acesso.");
        }
    );
}

/** Abre a janela de login. */
async function abrirLogin() {
    carregamento = carregamento ?? carregarLogin();
    try {
        await carregamento;
    } catch (ignore) {
        carregamento = undefined;
        mostrarAviso("Não foi possível abrir o login. Tente novamente.");
        return;
    }
    abrirModal(ID_MODAL);
}

export {abrirLogin};
