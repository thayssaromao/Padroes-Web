/*jslint browser */
/**
 * paginas/cadastro.js — Cadastro de artesão (#/cadastro).
 * Formulário simples: nome, e-mail, senha e confirmação.
 */

import {
    emailValido,
    obterSessao,
    registrarArtesao,
    senhaValida
} from "../dados.js";
import {mostrarAviso, prepararCamposSenha} from "../componentes.js";

const CAMPOS = ["nome", "email", "senha", "confirmar"];

/**
 * Valida os campos e devolve as mensagens de erro (vazio = válido).
 * @param {{nome: string, email: string, senha: string, confirmar: string}} dados
 * @returns {object} mensagem por campo com erro
 */
function validar(dados) {
    const erros = {};
    if (!dados.nome.trim()) {
        erros.nome = "Informe seu nome.";
    }
    if (!dados.email.trim()) {
        erros.email = "Informe seu e-mail.";
    } else if (!emailValido(dados.email)) {
        erros.email = "Digite um e-mail válido, como nome@exemplo.com.";
    }
    if (!dados.senha) {
        erros.senha = "Crie uma senha.";
    } else if (!senhaValida(dados.senha)) {
        erros.senha = (
            "A senha deve ter de 8 a 12 caracteres, com pelo menos um número"
            + " e um caractere especial."
        );
    }
    if (!dados.confirmar) {
        erros.confirmar = "Repita a senha.";
    } else if (dados.senha !== dados.confirmar) {
        erros.confirmar = "As senhas não são iguais.";
    }
    return erros;
}

/**
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
function iniciarCadastro(raiz) {
    const sessao = obterSessao();
    if (sessao) {
        // Quem já entrou não precisa criar conta: vai ao próprio painel.
        window.location.hash = "#/" + sessao.perfil;
        return;
    }
    const formulario = raiz.querySelector("#cadastro-form");

    function mostrarErro(campo, mensagem) {
        const entrada = formulario.elements[campo];
        const aviso = raiz.querySelector("#cadastro-" + campo + "-erro");
        aviso.textContent = mensagem ?? "";
        aviso.hidden = !mensagem;
        entrada.setAttribute("aria-invalid", String(Boolean(mensagem)));
    }

    function limparErros() {
        CAMPOS.forEach(function (campo) {
            mostrarErro(campo);
        });
    }

    prepararCamposSenha(raiz);
    CAMPOS.forEach(function (campo) {
        formulario.elements[campo].addEventListener("input", function () {
            mostrarErro(campo);
        });
    });

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const botao = formulario.querySelector("[type=\"submit\"]");
        const dados = Object.fromEntries(new FormData(formulario));
        let erros = validar(dados);
        limparErros();
        if (Object.keys(erros).length === 0) {
            botao.disabled = true;
            try {
                await registrarArtesao(dados);
            } catch (erro) {
                erros = {email: erro.message};
            }
            botao.disabled = false;
        }
        const primeiro = CAMPOS.find(function (campo) {
            return erros[campo];
        });
        if (primeiro) {
            CAMPOS.forEach(function (campo) {
                mostrarErro(campo, erros[campo]);
            });
            formulario.elements[primeiro].focus();
            return;
        }
        mostrarAviso("Conta criada com sucesso!");
        window.dispatchEvent(new CustomEvent("conta-autenticada", {
            detail: "painel-artesao"
        }));
    });
}

export {iniciarCadastro};
