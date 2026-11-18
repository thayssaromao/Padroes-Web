import {autenticar} from "../dados.js";
import {
    abrirModal,
    fecharModal,
    mostrarAviso,
    prepararCamposSenha,
    prepararModais
} from "../componentes.js";

const ARQUIVO_LOGIN = "pages/login.html";
const ID_MODAL = "modal-login";

let carregamento;

/**
 * Valida as credenciais; se corretas, abre a sessão e avisa o router.
 * @param {HTMLElement} recipiente
 */
function ligarFormulario(recipiente) {
    const formulario = recipiente.querySelector("#login-form");
    const erro = recipiente.querySelector("#login-erro");
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const dados = new FormData(formulario);
        erro.hidden = true;
        let sessao = null;
        try {
            sessao = await autenticar(dados.get("email"), dados.get("senha"));
        } catch (ignore) {
            erro.textContent = "Não foi possível entrar. Tente novamente.";
            erro.hidden = false;
            return;
        }
        if (!sessao) {
            erro.textContent = "E-mail ou senha incorretos.";
            erro.hidden = false;
            return;
        }
        formulario.reset();
        fecharModal(ID_MODAL);
        window.dispatchEvent(new CustomEvent("liceu:login", {detail: sessao}));
    });
}

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
    ligarFormulario(recipiente);
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
