/*jslint browser */
/**
 * paginas/painel-liceu/configuracoes.js — aba Configurações
 * (#/painel-liceu/configuracoes).
 * Guia: docs/DESIGN.md.
 */

import {criarChips} from "../../componentes.js";
import {carregarCategorias} from "../../dados.js";

/**
 * Configurações futuras ficam identificadas sem simular salvamentos.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarConfiguracoes(raiz) {
    const marco = raiz.firstElementChild;
    const categorias = await carregarCategorias();
    if (!marco.isConnected) {
        return;
    }
    const formulario = raiz.querySelector("[data-formulario]");
    formulario.insertAdjacentHTML("beforebegin",
        "<aside class=\"aviso liceu-config-aviso\" id=\"config-mvp\"><p>"
        + "As configurações institucionais, preferências, gestão de listas e "
        + "permissões são previstas para uma etapa futura. No MVP, os papéis "
        + "são fixos e categorias e técnicas usam as opções predefinidas.</p>"
        + "</aside>");
    formulario.querySelectorAll("input, button").forEach(function (controle) {
        controle.disabled = true;
        controle.setAttribute("aria-describedby", "config-mvp");
    });
    const listas = raiz.querySelector("#config-categorias")
        .closest("section").querySelector(".liceu-bloco-config__corpo");
    listas.insertAdjacentHTML("beforeend",
        "<section class=\"lista-taxonomias\" aria-labelledby=\"categorias-lista\">"
        + "<h3 id=\"categorias-lista\">Categorias cadastradas</h3>"
        + criarChips(categorias.categorias) + "</section>"
        + "<section class=\"lista-taxonomias\" aria-labelledby=\"tecnicas-lista\">"
        + "<h3 id=\"tecnicas-lista\">Técnicas cadastradas</h3>"
        + criarChips(categorias.tecnicas) + "</section>");
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
    });
}

export {
    montarConfiguracoes
};
