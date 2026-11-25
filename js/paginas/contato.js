/*jslint browser */
/**
 * paginas/contato.js — Página de contato (#/contato).
 * Envia o formulário pelo serviço Web3Forms (não há back-end próprio).
 * Guia: docs/DESIGN.md §10.2.
 */

const ENDERECO_ENVIO = "https://api.web3forms.com/submit";

/** Chave pública do Web3Forms (feita para ficar no front-end). */
const CHAVE_ACESSO = "bfcffd7a-e9e1-4609-a6b6-ddfa187ffefd";

const MENSAGENS = Object.freeze({
    conexao: "Erro de conexão. Verifique sua internet e tente novamente.",
    enviando: "Enviando...",
    falha: "Não foi possível enviar a mensagem. Tente novamente.",
    sucesso: "Mensagem enviada com sucesso! Em breve entraremos em contato."
});

/**
 * Envia o formulário e mostra o resultado no parágrafo de feedback.
 * @param {SubmitEvent} evento
 */
async function enviarMensagem(evento) {
    const formulario = evento.currentTarget;
    const botao = formulario.querySelector("button[type=\"submit\"]");
    const feedback = formulario.querySelector(".contato-feedback");
    let dados;
    let resposta;
    let resultado;

    evento.preventDefault();
    if (botao.disabled) {
        return;
    }
    formulario.querySelectorAll("input, textarea").forEach(function (campo) {
        campo.value = campo.value.trim();
    });
    if (!formulario.reportValidity()) {
        return;
    }
    dados = new FormData(formulario);
    dados.append("access_key", CHAVE_ACESSO);
    dados.append("subject", "Nova mensagem pelo site - Liceu de Ofícios");
    dados.append("from_name", "Site Liceu de Ofícios");

    botao.disabled = true;
    feedback.textContent = MENSAGENS.enviando;

    try {
        resposta = await fetch(ENDERECO_ENVIO, {body: dados, method: "POST"});
        resultado = await resposta.json();
        if (!formulario.isConnected) {
            return;
        }
        if (resposta.ok && resultado.success) {
            feedback.textContent = MENSAGENS.sucesso;
            formulario.reset();
        } else {
            feedback.textContent = MENSAGENS.falha;
        }
    } catch (ignore) {
        if (formulario.isConnected) {
            feedback.textContent = MENSAGENS.conexao;
        }
    }

    botao.disabled = false;
}

/**
 * Liga o envio do formulário de contato.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
function iniciarContato(raiz) {
    const formulario = raiz.querySelector("#contato-form");
    if (formulario) {
        formulario.addEventListener("submit", enviarMensagem);
    }
}

export {
    iniciarContato
};
