/*jslint browser */
/**
 * paginas/painel-liceu/formularios.js — diálogos e campos dos modais do Liceu,
 * salvamento com proteção contra envio duplo e recarga da aba atual.
 * Guia: docs/DESIGN.md.
 */

import {
    criarCampoSenha,
    criarDialogo,
    escaparHtml,
    mostrarAviso,
    prepararAcoes
} from "../../componentes.js";
import {montarArtesaos} from "./artesaos.js";
import {montarCadastro} from "./cadastro.js";
import {montarInicio} from "./inicio.js";
import {montarPendentes} from "./pendentes.js";
import {montarPublicacoes} from "./publicacoes.js";

/** Monta um diálogo usando exclusivamente a anatomia do design system. */
function dialogo(titulo, conteudo, tamanho = "medio") {
    return criarDialogo(titulo, conteudo, "", {tamanho});
}

/** Recarrega apenas a parcial atual após uma mutação confirmada. */
async function atualizarAba() {
    const raiz = document.getElementById("conteudo");
    const marco = raiz.firstElementChild;
    const hash = window.location.hash;
    if (!hash.startsWith("#/painel-liceu")) {
        return;
    }
    const aba = hash.split("/")[2] || "inicio";
    const inicios = {
        artesaos: montarArtesaos,
        "cadastrar-artesao": montarCadastro,
        inicio: montarInicio,
        publicacoes: montarPublicacoes,
        "trabalhos-pendentes": montarPendentes
    };
    if (!inicios[aba]) {
        return;
    }
    const resposta = await fetch("pages/painel-liceu/" + aba + ".html");
    if (!resposta.ok) {
        throw new Error("Não foi possível atualizar a listagem.");
    }
    const html = await resposta.text();
    if (!marco.isConnected || window.location.hash !== hash) {
        return;
    }
    raiz.innerHTML = html;
    await inicios[aba](raiz);
    prepararAcoes(raiz);
}

function campo(nome, rotulo, valor = "", tipo = "text", obrigatorio = false) {
    if (tipo === "password") {
        return criarCampoSenha("liceu-" + nome, nome, rotulo, obrigatorio);
    }
    return (
        "<div class=\"campo\"><label class=\"campo__rotulo\""
        + ` for="liceu-${nome}">${escaparHtml(rotulo)}</label>`
        + `<input class="campo__entrada" id="liceu-${nome}"`
        + ` name="${nome}" type="${tipo}" value="${escaparHtml(valor)}"`
        + (obrigatorio ? " required" : "") + "></div>"
    );
}

function areaTexto(nome, rotulo, valor = "") {
    return (
        "<div class=\"campo\"><label class=\"campo__rotulo\""
        + ` for="liceu-${nome}">${escaparHtml(rotulo)}</label>`
        + `<textarea class="campo__entrada" id="liceu-${nome}"`
        + ` name="${nome}" rows="4">${escaparHtml(valor || "")}`
        + "</textarea></div>"
    );
}

function selecionarCampo(nome, rotulo, opcoes, valores, multiplo = false, obrigatorio = !multiplo) {
    return (
        "<div class=\"campo\"><label class=\"campo__rotulo\""
        + ` for="liceu-${nome}">${escaparHtml(rotulo)}</label>`
        + `<select class="campo__entrada" id="liceu-${nome}"`
        + ` name="${nome}"${multiplo ? " multiple" : ""}${obrigatorio ? " required" : ""}>`
        + opcoes.map(function (valor) {
            return (
                `<option value="${escaparHtml(valor)}"`
                + (valores.includes(valor) ? " selected" : "") + ">"
                + escaparHtml(valor) + "</option>"
            );
        }).join("") + "</select></div>"
    );
}

function acoesFormulario(rotulo = "Salvar alterações") {
    return (
        "<p role=\"alert\" data-erro></p><div class=\"modal__acoes\">"
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-fechar-modal>Cancelar</button>"
        + "<button type=\"submit\" class=\"btn btn--primario\">"
        + escaparHtml(rotulo) + "</button></div>"
    );
}

/** Evita envios duplicados e conserva os dados quando a escrita falha. */
function ligarSalvar(modal, salvar, mensagem) {
    const formulario = modal.querySelector("form");
    formulario.querySelectorAll("input[type=tel]").forEach(function (telefone) {
        telefone.addEventListener("input", function () {
            const digitos = telefone.value.replace(/\D/g, "");
            telefone.setCustomValidity(telefone.value && (digitos.length < 10
                || digitos.length > 13)
                ? "Informe um telefone válido com DDD." : "");
        });
    });
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const botao = formulario.querySelector("[type=submit]");
        if (botao.disabled || !formulario.reportValidity()) {
            return;
        }
        botao.disabled = true;
        try {
            await salvar(formulario.elements);
            if (!modal.isConnected) {
                return;
            }
            modal.close();
            mostrarAviso(mensagem);
            await atualizarAba();
        } catch (erro) {
            const alvo = formulario.querySelector("[data-erro]");
            alvo.textContent = erro.message || "Não foi possível salvar.";
        } finally {
            botao.disabled = false;
        }
    });
}

export {
    acoesFormulario,
    areaTexto,
    atualizarAba,
    campo,
    dialogo,
    ligarSalvar,
    selecionarCampo
};
