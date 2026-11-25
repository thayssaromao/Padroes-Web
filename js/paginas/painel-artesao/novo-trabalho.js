/*jslint browser */
/**
 * paginas/painel-artesao/novo-trabalho.js — aba Novo trabalho, também
 * usada para editar (#/painel-artesao/novo-trabalho?id=...).
 * Guia: docs/DESIGN.md.
 */

import {
    escaparHtml,
    icone,
    mostrarAviso,
    prepararAcoes,
    prepararMultisselecao
} from "../../componentes.js";
import {
    carregarCategorias,
    salvarTrabalho
} from "../../dados.js";
import {
    artesaoLogado,
    confirmar,
    parametros,
    preencherOpcoes,
    trabalhosDaSessao
} from "./compartilhado.js";
import {lerImagem} from "./imagens.js";

const ROTA_TRABALHOS = "#/painel-artesao/meus-trabalhos";

const MAX_IMAGENS = 8;

/** Upload persistente: dados das imagens, nunca nomes ou URLs temporárias. */
function ligarUpload(raiz, iniciais = []) {
    const area = raiz.querySelector("[data-upload]");
    const entrada = raiz.querySelector("[data-upload-entrada]");
    const lista = raiz.querySelector("[data-miniaturas]");
    let imagens = iniciais.slice();
    let pendente = Promise.resolve();

    function desenhar() {
        lista.innerHTML = imagens.map(function (url, indice) {
            return (
                "<li class=\"miniatura\"><img src=\"" + escaparHtml(url)
                + "\" width=\"80\" height=\"80\" alt=\"Imagem "
                + (indice + 1) + " do trabalho\">"
                + "<button type=\"button\" class=\"miniatura__remover\""
                + " data-remover=\"" + indice
                + "\" aria-label=\"Remover imagem "
                + (indice + 1) + "\">" + icone("lucide:x") + "</button>"
                + (indice === 0
                    ? "<span class=\"miniatura__capa\">★ Capa</span>"
                    : "") + "</li>"
            );
        }).join("");
        prepararAcoes(lista);
    }

    function adicionar(arquivos) {
        const novos = Array.from(arquivos);
        pendente = pendente.then(async function () {
            const vagas = MAX_IMAGENS - imagens.length;
            if (novos.length > vagas) {
                mostrarAviso("Limite de 8 imagens por trabalho.");
            }
            const resultados = await Promise.all(novos.slice(0, vagas).map(
                function (arquivo) {
                    return lerImagem(arquivo).catch(function (erro) {
                        mostrarAviso(erro.message);
                        return null;
                    });
                }
            ));
            imagens = imagens.concat(resultados.filter(Boolean));
            if (lista.isConnected) {
                desenhar();
            }
        });
    }

    entrada.addEventListener("change", function () {
        adicionar(entrada.files);
        entrada.value = "";
    });
    ["dragenter", "dragover"].forEach(function (evento) {
        area.addEventListener(evento, function (ocorrencia) {
            ocorrencia.preventDefault();
            area.classList.add("upload--arrastando");
        });
    });
    area.addEventListener("dragleave", function (evento) {
        if (!area.contains(evento.relatedTarget)) {
            area.classList.remove("upload--arrastando");
        }
    });
    area.addEventListener("drop", function (evento) {
        area.classList.remove("upload--arrastando");
        evento.preventDefault();
        adicionar(evento.dataTransfer.files);
    });
    lista.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-remover]");
        if (botao) {
            const indice = Number(botao.dataset.remover);
            imagens = imagens.filter(function (ignore, posicao) {
                return posicao !== indice;
            });
            desenhar();
        }
    });
    desenhar();
    return {
        obter: async function () {
            await pendente;
            return imagens.slice();
        }
    };
}

/** O formulário existente também atende à edição, sem nova tela. */
async function montarNovoTrabalho(raiz) {
    const marco = raiz.firstElementChild;
    const dadosCategorias = await carregarCategorias();
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDaSessao(sessao);
    const id = parametros().get("id");
    const existente = trabalhos.find(function (item) {
        return item.id === id;
    });
    if (!marco.isConnected) {
        return;
    }
    if (id && !existente) {
        raiz.querySelector("[data-form-trabalho]").remove();
        raiz.insertAdjacentHTML("beforeend",
            "<p class=\"artesao-vazio\" role=\"alert\">"
            + "Trabalho não encontrado para este artesão. "
            + "<a href=\"#/painel-artesao/meus-trabalhos\">"
            + "Voltar aos trabalhos</a></p>");
        return;
    }
    const formulario = raiz.querySelector("[data-form-trabalho]");
    const campoPreco = raiz.querySelector("[data-preco]");
    const upload = ligarUpload(raiz, existente ? existente.imagens : []);
    const bloqueado = existente
        && ["em-analise", "reenviado"].includes(existente.status);
    let salvando = false;

    preencherOpcoes(raiz.querySelector("#trabalho-categoria"),
        dadosCategorias.categorias);
    preencherOpcoes(raiz.querySelector("#trabalho-tecnica"),
        dadosCategorias.tecnicas);
    if (existente) {
        raiz.querySelector("h1").textContent = "Editar Trabalho";
        raiz.querySelector(".sobretitulo").textContent = "Editar trabalho";
        Object.entries(existente).forEach(function ([chave, valor]) {
            const campo = formulario.elements.namedItem(chave);
            if (campo && typeof valor === "string") {
                campo.value = valor;
            }
        });
        if (existente.preco !== null && existente.preco !== undefined) {
            formulario.querySelector("[value=\"definir\"]").checked = true;
            campoPreco.disabled = false;
            campoPreco.required = true;
            campoPreco.value = String(existente.preco).replace(".", ",");
        }
        if (existente.status === "rejeitado") {
            formulario.querySelector("[type=\"submit\"]").lastChild.textContent
                = " Editar e reenviar";
            raiz.querySelector(".texto-apoio").textContent =
                "Corrija seu trabalho e envie novamente ao Liceu.";
        } else if (["publicado", "oculto"].includes(existente.status)) {
            raiz.querySelector(".texto-apoio").textContent =
                "Ao salvar alterações, o trabalho volta à análise do Liceu.";
            raiz.querySelector("[data-salvar-rascunho]").remove();
        }
    }
    if (bloqueado) {
        Array.from(formulario.elements).forEach(function (campo) {
            campo.disabled = true;
        });
        raiz.querySelector(".texto-apoio").textContent =
            "Este trabalho está em análise. Aguarde o retorno do Liceu.";
    }
    ["categoria", "tecnica"].forEach(function (nome) {
        const campo = formulario.querySelector("[name=" + nome + "]");
        const valores = existente ? existente[nome === "categoria" ? "categorias" : "tecnicas"] : [];
        Array.from(campo.options).forEach(function (opcao) {
            opcao.selected = valores.includes(opcao.value);
        });
    });
    prepararMultisselecao(raiz);
    raiz.querySelectorAll("[data-preco-tipo]").forEach(function (opcao) {
        opcao.addEventListener("change", function () {
            const definir = formulario.querySelector(
                "[name=\"preco-tipo\"]:checked"
            ).value === "definir";
            campoPreco.disabled = !definir;
            campoPreco.required = definir;
            if (definir) {
                campoPreco.focus();
            } else {
                campoPreco.value = "";
            }
        });
    });

    let alterado = false;
    formulario.addEventListener("input", function () {
        alterado = true;
    });
    formulario.addEventListener("change", function () {
        alterado = true;
    });
    formulario.querySelector("[data-miniaturas]").addEventListener(
        "click", function (evento) {
            if (evento.target.closest("[data-remover]")) {
                alterado = true;
            }
        }
    );
    formulario.querySelector("[data-upload]").addEventListener(
        "drop", function () {
            alterado = true;
        }
    );
    async function sairFormulario(destino) {
        if (alterado && !await confirmar(
            "Descartar alterações?",
            "As alterações não salvas deste trabalho serão descartadas.",
            "Descartar"
        )) {
            return;
        }
        window.location.hash = destino;
    }
    formulario.querySelector("a[href]").addEventListener(
        "click", function (evento) {
            evento.preventDefault();
            sairFormulario(ROTA_TRABALHOS);
        }
    );

    async function salvar(status) {
        if (salvando || bloqueado) {
            return;
        }
        formulario.elements.titulo.setCustomValidity(
            formulario.elements.titulo.value.trim()
            ? ""
            : "Informe o nome do trabalho."
        );
        if (status !== "rascunho" && !formulario.reportValidity()) {
            return;
        }
        if (!formulario.elements.titulo.reportValidity()) {
            return;
        }
        const dados = Object.fromEntries(new FormData(formulario));
        let preco = null;
        if (dados["preco-tipo"] === "definir") {
            preco = Number(dados.preco.trim().replace(",", "."));
            if (!Number.isFinite(preco) || preco < 0 || !dados.preco.trim()) {
                mostrarAviso("Informe um preço válido em reais.");
                campoPreco.focus();
                return;
            }
        }
        salvando = true;
        const botoes = formulario.querySelectorAll("button");
        botoes.forEach(function (botao) {
            botao.disabled = true;
        });
        try {
            if (status !== "rascunho" && !await confirmar(
                "Enviar para análise?",
                "O trabalho ficará disponível no portal "
                + "após aprovação do Liceu.",
                "Enviar"
            )) {
                return;
            }
            const imagens = await upload.obter();
            if (!marco.isConnected) {
                return;
            }
            const rejeitado = existente && (
                existente.status === "rejeitado"
                || Boolean(existente.motivoRejeicao)
            );
            await salvarTrabalho(Object.assign({}, existente || {}, dados, {
                artesaoId: sessao.artesaoId,
                categorias: new FormData(formulario).getAll("categoria"),
                tecnicas: new FormData(formulario).getAll("tecnica"),
                destaque: false,
                enviadoEm: status === "rascunho"
                    ? null : new Date().toISOString(),
                imagens: imagens.length
                    ? imagens : ["assets/img/avatar-padrao.jpg"],
                motivoRejeicao: status === "rascunho" && existente
                    ? existente.motivoRejeicao : null,
                preco,
                publicadoEm: null,
                status: rejeitado && status !== "rascunho"
                    ? "reenviado" : status,
                titulo: dados.titulo.trim()
            }));
            mostrarAviso(status === "rascunho"
                ? "Rascunho salvo."
                : (rejeitado ? "Trabalho reenviado para análise."
                    : "Trabalho enviado para análise."));
            window.location.hash = status === "rascunho"
                ? ROTA_TRABALHOS : "#/painel-artesao/status-publicacoes";
        } catch (erro) {
            mostrarAviso(erro.message || "Não foi possível salvar o trabalho.");
        } finally {
            salvando = false;
            botoes.forEach(function (botao) {
                botao.disabled = false;
            });
        }
    }
    formulario.elements.titulo.addEventListener("input", function () {
        formulario.elements.titulo.setCustomValidity("");
    });
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        salvar("em-analise");
    });
    raiz.querySelector("[data-salvar-rascunho]")?.addEventListener(
        "click", function () {
            salvar("rascunho");
        }
    );
    raiz.querySelector("[data-rascunhos]").addEventListener(
        "click", function () {
            sairFormulario(ROTA_TRABALHOS + "?status=rascunho");
        }
    );
}

export {
    montarNovoTrabalho
};
