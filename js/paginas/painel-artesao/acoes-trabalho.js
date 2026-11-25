/*jslint browser */
/**
 * paginas/painel-artesao/acoes-trabalho.js — ações sobre um trabalho
 * (editar, menu, motivo da rejeição, enviar para análise).
 * Guia: docs/DESIGN.md.
 */

import {
    criarStatus,
    escaparHtml,
    mostrarAviso
} from "../../componentes.js";
import {
    excluirTrabalho,
    salvarTrabalho
} from "../../dados.js";
import {
    confirmar,
    dialogo
} from "./compartilhado.js";

/**
 * Abre a edição de um trabalho.
 * @param {object} trabalho
 */
function editarTrabalho(trabalho) {
    if (["em-analise", "reenviado"].includes(trabalho.status)) {
        mostrarAviso(
            "Aguarde a análise do Liceu antes de editar este trabalho."
        );
        return;
    }
    window.location.hash = "#/painel-artesao/novo-trabalho?id="
        + encodeURIComponent(trabalho.id);
}

function abrirMenuTrabalho(trabalho, aoMudar) {
    const editavel = !["em-analise", "reenviado"].includes(trabalho.status);
    const publicado = trabalho.status === "publicado";
    const modal = dialogo(
        trabalho.titulo,
        "<p>" + criarStatus(trabalho.status) + "</p>",
        (publicado
            ? "<a class=\"btn btn--secundario\" href=\"#/produto?id="
                + encodeURIComponent(trabalho.id) + "\">Ver no portal</a>"
            : "")
        + (editavel
            ? "<button type=\"button\" class=\"btn btn--secundario\""
                + " data-editar>Editar</button>"
            : "")
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-duplicar>Duplicar</button>"
        + (trabalho.status === "rascunho"
            ? "<button type=\"button\" class=\"btn btn--primario\""
                + " data-enviar>Enviar para análise</button>"
            : "")
        + (["rascunho", "rejeitado"].includes(trabalho.status)
            ? "<button type=\"button\" class=\"btn btn--perigo\""
                + " data-excluir>Excluir</button>"
            : "")
    );
    modal.querySelector(".modal__acoes").classList.add("modal__acoes--grade");
    modal.addEventListener("click", async function (evento) {
        const botao = evento.target.closest("button");
        if (!botao || botao.disabled) {
            return;
        }
        try {
            if (botao.hasAttribute("data-editar")) {
                modal.close();
                editarTrabalho(trabalho);
            } else if (botao.hasAttribute("data-duplicar")) {
                botao.disabled = true;
                const copia = Object.assign({}, trabalho, {
                    atualizadoEm: new Date().toISOString(),
                    destaque: false,
                    enviadoEm: null,
                    id: undefined,
                    motivoRejeicao: null,
                    publicadoEm: null,
                    status: "rascunho",
                    titulo: trabalho.titulo + " (cópia)"
                });
                await salvarTrabalho(copia);
                modal.close();
                mostrarAviso("Trabalho duplicado como rascunho.");
                await aoMudar();
            } else if (botao.hasAttribute("data-enviar")) {
                modal.close();
                await enviarParaAnalise(trabalho, aoMudar);
            } else if (botao.hasAttribute("data-excluir")) {
                modal.close();
                if (await confirmar("Excluir trabalho?", trabalho.titulo
                        + " será excluído deste navegador.", "Excluir")) {
                    await excluirTrabalho(trabalho.id);
                    mostrarAviso("Trabalho excluído.");
                    await aoMudar();
                }
            }
        } catch (erro) {
            mostrarAviso(erro.message || "Não foi possível concluir a ação.");
            botao.disabled = false;
        }
    });
}

function verMotivo(trabalho) {
    const modal = dialogo(
        "Motivo da rejeição",
        "<div class=\"pilha\"><h3>" + escaparHtml(trabalho.titulo)
        + "</h3><p>"
        + escaparHtml(trabalho.motivoRejeicao || "Nenhum motivo informado.")
        + "</p></div>",
        "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-fechar-modal>Voltar</button>"
        + "<button type=\"button\" class=\"btn btn--primario\""
        + " data-editar>Editar e reenviar</button>"
    );
    modal.querySelector("[data-editar]").addEventListener("click", function () {
        modal.close();
        editarTrabalho(trabalho);
    });
}

async function enviarParaAnalise(trabalho, aoMudar) {
    if (!trabalho.titulo.trim() || !trabalho.categorias.length || !trabalho.tecnicas.length) {
        mostrarAviso("Complete nome, categoria e técnica antes de enviar.");
        editarTrabalho(trabalho);
        return;
    }
    if (!await confirmar("Enviar para análise?", trabalho.titulo
            + " será analisado pelo Liceu antes da publicação.", "Enviar")) {
        return;
    }
    try {
        await salvarTrabalho(Object.assign({}, trabalho, {
            enviadoEm: new Date().toISOString(),
            motivoRejeicao: null,
            status: trabalho.motivoRejeicao ? "reenviado" : "em-analise"
        }));
        mostrarAviso("Trabalho enviado para análise.");
        await aoMudar();
    } catch (erro) {
        mostrarAviso(erro.message || "Não foi possível enviar o trabalho.");
    }
}

export {
    abrirMenuTrabalho,
    editarTrabalho,
    enviarParaAnalise,
    verMotivo
};
