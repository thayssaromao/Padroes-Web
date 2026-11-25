/*jslint browser */
/**
 * paginas/painel-liceu/acoes-trabalhos.js — análise de trabalhos e
 * ações sobre publicações (ver, editar, ocultar, excluir, republicar).
 * Guia: docs/DESIGN.md.
 */

import {
    conteudoAcao,
    criarDetalhesTrabalho,
    escaparHtml,
    icone,
    mostrarAviso
} from "../../componentes.js";
import {
    atualizarStatusTrabalho,
    carregarCategorias,
    carregarTrabalhos,
    comNomeDoArtesao,
    excluirTrabalho,
    salvarTrabalho
} from "../../dados.js";
import {filtrarPendentes} from "./compartilhado.js";
import {
    acoesFormulario,
    areaTexto,
    atualizarAba,
    campo,
    dialogo,
    ligarSalvar,
    selecionarCampo
} from "./formularios.js";

async function obterTrabalho(id) {
    const trabalhos = await carregarTrabalhos();
    const trabalho = trabalhos.find(function (item) {
        return item.id === id;
    });
    if (!trabalho) {
        throw new Error("Trabalho não encontrado.");
    }
    return trabalho;
}

function detalhesTrabalho(trabalho) {
    return criarDetalhesTrabalho(trabalho);
}

async function analisarTrabalho(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const itens = await comNomeDoArtesao([await obterTrabalho(id)]);
    if (!marco.isConnected) {
        return;
    }
    const trabalho = itens[0];
    if (!filtrarPendentes([trabalho]).length) {
        mostrarAviso("Este trabalho já foi analisado.");
        await atualizarAba();
        return;
    }
    const modal = dialogo("Analisar: " + trabalho.titulo,
        detalhesTrabalho(trabalho)
        + "<form aria-label=\"Decisão da análise\"><div class=\"campo\" data-motivo hidden>"
        + "<label for=\"liceu-motivo\" class=\"campo__rotulo\">"
        + "Motivo da rejeição *</label><textarea id=\"liceu-motivo\""
        + " name=\"motivo\" class=\"campo__entrada\" rows=\"4\"></textarea>"
        + "</div><p role=\"alert\" data-erro></p>"
        + "<p data-confirmacao-aprovacao role=\"status\" hidden>"
        + "Tem certeza de que deseja aprovar este trabalho?</p>"
        + "<div class=\"modal__acoes\">"
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-cancelar-decisao hidden>Cancelar</button>"
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-rejeitar>Rejeitar</button>"
        + "<button type=\"submit\" class=\"btn btn--primario\""
        + " data-aprovar formnovalidate>Aprovar</button></div></form>", "grande");
    modal.classList.add("liceu-analise");
    const formulario = modal.querySelector("form");
    const cancelar = modal.querySelector("[data-cancelar-decisao]");
    const confirmacao = modal.querySelector("[data-confirmacao-aprovacao]");
    const rejeitar = modal.querySelector("[data-rejeitar]");
    const aprovar = modal.querySelector("[data-aprovar]");
    const motivo = formulario.elements.motivo;
    let ocupado = false;
    let etapa = "analisar";

    async function decidir(status) {
        if (ocupado || !modal.isConnected || !marco.isConnected) {
            return;
        }
        ocupado = true;
        cancelar.disabled = true;
        aprovar.disabled = true;
        rejeitar.disabled = true;
        try {
            await atualizarStatusTrabalho(id, status, motivo.value.trim());
            if (!marco.isConnected) {
                return;
            }
            modal.close();
            mostrarAviso(status === "publicado"
                ? "Trabalho aprovado e publicado no portal."
                : "Trabalho rejeitado. O artesão poderá consultar o motivo.");
            await atualizarAba();
        } catch (erro) {
            modal.querySelector("[data-erro]").textContent = erro.message;
        } finally {
            ocupado = false;
            cancelar.disabled = false;
            aprovar.disabled = false;
            rejeitar.disabled = false;
        }
    }

    function mudarEtapa(destino) {
        etapa = destino;
        modal.querySelector("[data-motivo]").hidden = etapa !== "rejeitar";
        confirmacao.hidden = etapa !== "aprovar";
        cancelar.hidden = etapa === "analisar";
        rejeitar.hidden = etapa === "aprovar";
        aprovar.hidden = etapa === "rejeitar";
        rejeitar.innerHTML = conteudoAcao(etapa === "rejeitar"
            ? "Confirmar rejeição" : "Rejeitar");
        aprovar.innerHTML = etapa === "aprovar"
            ? icone("lucide:circle-check") + "Confirmar aprovação"
            : conteudoAcao("Aprovar");
        aprovar.toggleAttribute("data-confirmar-aprovacao", etapa === "aprovar");
        motivo.setCustomValidity("");
        modal.querySelector("[data-erro]").textContent = "";
    }

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        if (ocupado || etapa === "rejeitar") {
            return;
        }
        if (etapa === "analisar") {
            mudarEtapa("aprovar");
            cancelar.focus();
            return;
        }
        decidir("publicado");
    });
    cancelar.addEventListener("click", function () {
        if (ocupado) {
            return;
        }
        const anterior = etapa;
        mudarEtapa("analisar");
        motivo.value = "";
        (anterior === "rejeitar" ? rejeitar : aprovar).focus();
    });
    rejeitar.addEventListener("click", function () {
        if (ocupado) {
            return;
        }
        if (etapa !== "rejeitar") {
            mudarEtapa("rejeitar");
            motivo.focus();
            return;
        }
        motivo.setCustomValidity(motivo.value.trim()
            ? "" : "Informe o motivo da rejeição.");
        if (motivo.reportValidity()) {
            decidir("rejeitado");
        }
    });
    motivo.addEventListener("input", function () {
        motivo.setCustomValidity("");
    });
}

async function verPublicacao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const dados = await comNomeDoArtesao([await obterTrabalho(id)]);
    if (marco.isConnected) {
        dialogo(dados[0].titulo, detalhesTrabalho(dados[0]), "grande");
    }
}

async function editarPublicacao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const dados = await Promise.all([obterTrabalho(id), carregarCategorias()]);
    if (!marco.isConnected) {
        return;
    }
    const trabalho = dados[0];
    const modal = dialogo("Editar publicação", "<form>"
        + campo("titulo", "Título *", trabalho.titulo, "text", true)
        + areaTexto("descricao", "Descrição *", trabalho.descricao)
        + selecionarCampo("categoria", "Categorias (selecione uma ou mais) *", dados[1].categorias,
            trabalho.categorias, true, true)
        + selecionarCampo("tecnica", "Técnicas (selecione uma ou mais) *", dados[1].tecnicas,
            trabalho.tecnicas, true, true)
        + campo("materiais", "Materiais", trabalho.materiais)
        + campo("dimensoes", "Dimensões", trabalho.dimensoes)
        + campo("preco", "Preço (R$)", trabalho.preco ?? "", "number")
        + acoesFormulario() + "</form>");
    modal.querySelector("[name=descricao]").required = true;
    modal.querySelector("[name=preco]").min = "0";
    modal.querySelector("[name=preco]").step = "0.01";
    ligarSalvar(modal, async function (campos) {
        if (!campos.titulo.value.trim() || !campos.descricao.value.trim()) {
            throw new Error("Preencha título e descrição.");
        }
        await salvarTrabalho(Object.assign({}, trabalho, {
            categorias: Array.from(campos.categoria.selectedOptions, function (opcao) { return opcao.value; }),
            descricao: campos.descricao.value.trim(),
            dimensoes: campos.dimensoes.value.trim(),
            materiais: campos.materiais.value.trim(),
            preco: campos.preco.value ? Number(campos.preco.value) : null,
            tecnicas: Array.from(campos.tecnica.selectedOptions, function (opcao) { return opcao.value; }),
            titulo: campos.titulo.value.trim()
        }));
    }, "Publicação atualizada.");
}

async function ocultarPublicacao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const trabalho = await obterTrabalho(id);
    if (!marco.isConnected) {
        return;
    }
    const ocultar = trabalho.status === "publicado";
    const modal = dialogo(ocultar ? "Ocultar publicação?"
        : "Republicar trabalho?", "<form><p>"
        + escaparHtml(trabalho.titulo)
        + (ocultar ? " deixará de aparecer no portal."
            : " voltará a aparecer no portal com a aprovação já registrada.")
        + "</p>" + acoesFormulario(ocultar ? "Ocultar" : "Republicar")
        + "</form>", "pequeno");
    ligarSalvar(modal, async function () {
        await salvarTrabalho(Object.assign({}, trabalho, {
            status: ocultar ? "oculto" : "publicado"
        }));
    }, ocultar ? "Publicação ocultada." : "Trabalho republicado.");
}

async function excluirPublicacao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const trabalho = await obterTrabalho(id);
    if (!marco.isConnected) {
        return;
    }
    const modal = dialogo("Excluir publicação?", "<form><p>"
        + escaparHtml(trabalho.titulo)
        + " será removido das listagens do portal e do artesão neste navegador."
        + " Esta ação não pode ser desfeita pela interface.</p>"
        + acoesFormulario("Excluir") + "</form>", "pequeno");
    modal.querySelector("[type=submit]").className = "btn btn--perigo";
    ligarSalvar(modal, async function () {
        await excluirTrabalho(id);
    }, "Publicação excluída.");
}

async function novaPublicacao() {
    const marco = document.getElementById("conteudo").firstElementChild;
    const trabalhos = await carregarTrabalhos();
    if (!marco.isConnected) {
        return;
    }
    const ocultos = trabalhos.filter(function (trabalho) {
        return trabalho.status === "oculto";
    });
    if (!ocultos.length) {
        dialogo("Nova publicação",
            "<p>Trabalhos aprovados são publicados automaticamente. "
            + "Não há publicações ocultas para republicar.</p>"
            + "<a class=\"btn btn--primario\""
            + " href=\"#/painel-liceu/trabalhos-pendentes\">"
            + "Analisar trabalhos pendentes</a>", "pequeno");
        return;
    }
    const modal = dialogo("Republicar trabalho aprovado", "<form>"
        + selecionarCampo("trabalho", "Trabalho aprovado", ocultos.map(
            function (trabalho) { return trabalho.id; }), [])
        + acoesFormulario("Republicar") + "</form>");
    modal.querySelectorAll("option").forEach(function (opcao) {
        opcao.textContent = ocultos.find(function (item) {
            return item.id === opcao.value;
        }).titulo;
    });
    ligarSalvar(modal, async function (campos) {
        const trabalho = ocultos.find(function (item) {
            return item.id === campos.trabalho.value;
        });
        await salvarTrabalho(Object.assign({}, trabalho, {status: "publicado"}));
    }, "Trabalho republicado.");
}

export {
    analisarTrabalho,
    editarPublicacao,
    excluirPublicacao,
    novaPublicacao,
    ocultarPublicacao,
    verPublicacao
};
