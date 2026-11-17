import {
    abrirModal,
    mostrarAviso,
    prepararCamposSenha,
    prepararModais
} from "../componentes.js";

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
