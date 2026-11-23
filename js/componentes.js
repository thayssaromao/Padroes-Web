/*jslint browser */
import {prepararSeletores} from "./seletores.js";
/**
 * componentes.js — componentes reutilizáveis (geram HTML ou ligam eventos).
 * Guia visual: docs/DESIGN.md §5 e §8.
 */

const STATUS = Object.freeze({
    "ativo": {icone: "lucide:circle-check", texto: "Ativo"},
    "em-analise": {icone: "lucide:clock", texto: "Em análise"},
    "inativo": {icone: "lucide:circle-x", texto: "Inativo"},
    "publicado": {icone: "lucide:circle-check", texto: "Publicado"},
    "rascunho": {icone: "lucide:file-text", texto: "Rascunho"},
    "reenviado": {icone: "lucide:refresh-cw", texto: "Reenviado"},
    "rejeitado": {icone: "lucide:circle-x", texto: "Rejeitado"}
});

const INTERVALO_CARROSSEL = 6000;
const senhasPreparadas = new WeakSet();

// Compatibilidade das páginas antigas com os ícones aprovados no design system.
const ICONES_PADRAO = Object.freeze({
    "akar-icons:light-bulb": "lucide:lightbulb",
    "boxicons:user": "lucide:user",
    "bx:shopping-bag": "lucide:shopping-bag",
    "solar:bag-4-bold": "lucide:shopping-bag",
    "solar:buildings-2-bold": "lucide:landmark",
    "solar:user-bold": "lucide:user",
    "uix-sharp:greek-temple": "lucide:landmark"
});

const ENTIDADES = Object.freeze({
    "&": "&amp;",
    "'": "&#39;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
});

/**
 * Escapa texto para inserir com segurança em innerHTML.
 * @param {string} texto
 * @returns {string}
 */
function escaparHtml(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, function (caractere) {
        return ENTIDADES[caractere];
    });
}

/**
 * Ícone Iconify decorativo.
 * @param {string} nome ex.: "lucide:house"
 * @returns {string}
 */
function icone(nome) {
    const padrao = ICONES_PADRAO[nome] || nome;
    return `<iconify-icon icon="${escaparHtml(padrao)}" aria-hidden="true" noobserver></iconify-icon>`;
}

/**
 * Aplica os ícones aprovados às parciais HTML de páginas ainda não migradas.
 * @param {HTMLElement} raiz conteúdo recém-carregado
 */
function padronizarIcones(raiz) {
    raiz.querySelectorAll("iconify-icon[icon]").forEach(function (elemento) {
        const padrao = ICONES_PADRAO[elemento.getAttribute("icon")];
        if (padrao) {
            elemento.setAttribute("icon", padrao);
        }
    });
}

/**
 * Badge de status (§5.4).
 * @param {string} status chave de STATUS
 * @returns {string}
 */
function criarStatus(status) {
    const info = STATUS[status] ?? {icone: "lucide:circle", texto: status};
    return (
        `<span class="status" data-status="${escaparHtml(status)}">`
        + icone(info.icone) + escaparHtml(info.texto) + "</span>"
    );
}

/** Registro semântico: a mesma ação mantém o mesmo ícone em toda a UI. */
const ACOES = Object.freeze([
    [/^(editar|corrigir)/i, "pencil"],
    [/^(confirmar rejei|rejeitar)/i, "circle-x"],
    [/^(aprovar|publicar|republicar)/i, "circle-check"],
    [/^(enviar|reenviar)/i, "send"],
    [/^(excluir|remover)/i, "trash-2"],
    [/^duplicar/i, "copy"],
    [/^ocultar/i, "eye-off"],
    [/^(salvar|cadastrar$)/i, "check"],
    [/^(cancelar|descartar|limpar)/i, "x"],
    [/^voltar ao portal/i, "external-link"],
    [/^(voltar|retornar)/i, "arrow-left"],
    [/^(adicionar|cadastrar novo|nova publica|novo trabalho)/i, "plus"],
    [/^(analisar|ver trabalhos pendentes)/i, "file-search"],
    [/^(ver no portal)/i, "external-link"],
    [/^(ver em grade|visualiza.*grade)/i, "layout-grid"],
    [/^(ver em lista|visualiza.*lista)/i, "list"],
    [/^(ver perfil|visualizar|ver publica)/i, "eye"],
    [/^(ver motivo|saber mais)/i, "info"],
    [/^(filtrar|aplicar filtros)/i, "sliders-horizontal"],
    [/^(redefinir senha|alterar senha)/i, "key-round"],
    [/^(gerenciar permiss)/i, "lock"],
    [/^(gerenciar categor|gerenciar t)/i, "list"],
    [/^(meu perfil|minha conta)/i, "user"],
    [/^sair/i, "log-out"],
    [/^entrar/i, "log-in"]
]);

function iconeAcao(texto) {
    const regra = ACOES.find(function (item) {
        return item[0].test(texto.trim());
    });
    return regra ? "lucide:" + regra[1] : "";
}

/** Texto deve ser explícito: o helper nunca troca o nome de uma ação. */
function conteudoAcao(texto) {
    const nome = iconeAcao(texto);
    return (nome ? icone(nome) : "") + escaparHtml(texto);
}

/** A mesma categoria/técnica conserva sua cor em cards, filtros e painéis. */
function corChip(texto) {
    const grupos = [
        ["Decoração", "Macramê", "Cestaria"],
        ["Utilitários", "Cerâmica"],
        ["Acessórios", "Bordado"],
        ["Organização", "Crochê"],
        ["Arte em tecido", "Madeira"],
        ["Outros", "Patchwork", "Fibras naturais"]
    ];
    const cores = ["turquesa", "rosa", "amarelo", "azul", "verde", "violeta"];
    const indice = grupos.findIndex(function (grupo) {
        return grupo.includes(texto.trim());
    });
    return cores[indice < 0 ? 0 : indice];
}

/** Migra ações existentes sem alterar handlers, texto ou semântica. */
function prepararAcoes(raiz) {
    prepararSeletores(raiz);
    raiz.querySelectorAll(".chip, .filtro-chip").forEach(function (chip) {
        chip.dataset.cor = corChip(chip.textContent);
    });
    padronizarIcones(raiz);
    raiz.querySelectorAll("iconify-icon").forEach(function (elemento) {
        if (!elemento.hasAttribute("noobserver")) {
            elemento.setAttribute("noobserver", "");
        }
    });
    raiz.querySelectorAll("button, a.btn, a.link-seta").forEach(
        function (botao) {
            if (botao.hasAttribute("data-alternar-senha")) {
                return;
            }
            const texto = botao.textContent.trim();
            const rotulo = botao.getAttribute("aria-label")
                || botao.getAttribute("title") || texto;
            if (!texto && rotulo) {
                botao.setAttribute("aria-label", rotulo);
                botao.setAttribute("title", rotulo);
            }
            if (botao.classList.contains("modal__fechar")) {
                botao.setAttribute("title", rotulo || "Fechar");
            }
            if (botao.matches(".chip__remover, .miniatura__remover")) {
                return;
            }
            const nome = iconeAcao(texto || rotulo);
            if (!nome || botao.classList.contains("paginacao__botao")) {
                return;
            }
            const desenho = botao.querySelector("iconify-icon, svg");
            if (desenho && desenho.localName === "iconify-icon") {
                const primeiro = Array.from(botao.childNodes).find(
                    function (node) {
                        return node.nodeType === Node.ELEMENT_NODE
                            || node.textContent.trim();
                    }
                );
                if (primeiro !== desenho) {
                    // Reconectar um custom element pode invalidar seu SVG.
                    desenho.remove();
                    botao.insertAdjacentHTML("afterbegin", icone(nome));
                } else if (desenho.getAttribute("icon") !== nome) {
                    desenho.setAttribute("icon", nome);
                }
            } else if (desenho) {
                desenho.remove();
                botao.insertAdjacentHTML("afterbegin", icone(nome));
            } else {
                botao.insertAdjacentHTML("afterbegin", icone(nome));
            }
        }
    );
}

/** Campo reutilizável para senhas provisórias e suas confirmações. */
function criarCampoSenha(id, nome, rotulo, obrigatorio = false) {
    return (
        "<div class=\"campo\"><label class=\"campo__rotulo\" for=\""
        + escaparHtml(id) + "\">" + escaparHtml(rotulo) + "</label>"
        + "<div class=\"campo__grupo\">" + icone("lucide:lock")
        + "<input class=\"campo__entrada campo__entrada--senha\" id=\""
        + escaparHtml(id) + "\" name=\"" + escaparHtml(nome)
        + "\" type=\"password\" autocomplete=\"new-password\" minlength=\"6\""
        + (obrigatorio ? " required" : "") + ">"
        + "<button type=\"button\" class=\"btn btn--icone\""
        + " data-alternar-senha=\"" + escaparHtml(id)
        + "\" aria-label=\"Mostrar senha\" title=\"Mostrar senha\""
        + " aria-pressed=\"false\">" + icone("lucide:eye-off")
        + "</button></div></div>"
    );
}

/** Conteúdo compartilhado de visualização e análise de trabalhos. */
function criarDetalhesTrabalho(trabalho) {
    const imagens = trabalho.imagens && trabalho.imagens.length
        ? trabalho.imagens : ["assets/img/avatar-padrao.jpg"];
    const galeria = imagens.map(function (imagem, indice) {
        return "<img src=\"" + escaparHtml(imagem) + "\" alt=\""
            + escaparHtml(trabalho.titulo) + " — foto " + (indice + 1)
            + "\" width=\"640\" height=\"480\" loading=\"lazy\">";
    }).join("");
    const preco = trabalho.preco === null || trabalho.preco === undefined
        ? "Sob consulta" : Number(trabalho.preco).toLocaleString(
            "pt-BR", {currency: "BRL", style: "currency"}
        );
    const dados = [
        ["layers", "Materiais", trabalho.materiais || "Não informado"],
        ["ruler", "Dimensões", trabalho.dimensoes || "Não informado"],
        ["banknote", "Preço", preco]
    ];
    return (
        "<div class=\"detalhe-trabalho\"><div class=\"detalhe-trabalho__galeria\""
        + " role=\"group\" aria-label=\"Imagens do trabalho\">" + galeria
        + "</div><div class=\"pilha\"><p class=\"linha\">"
        + icone("lucide:user") + "<strong>Artesão</strong> "
        + escaparHtml(trabalho.artesaoNome || "Não informado") + "</p>"
        + "<p>" + criarStatus(trabalho.status) + "</p>"
        + criarChips([trabalho.categoria, trabalho.tecnica].filter(Boolean))
        + "<div class=\"pilha\"><h3>Descrição</h3><p>"
        + escaparHtml(trabalho.descricao || "Não informada") + "</p></div>"
        + "<dl class=\"detalhe-trabalho__metadados\">"
        + dados.map(function (item) {
            return "<div><dt>" + icone("lucide:" + item[0])
                + escaparHtml(item[1]) + "</dt><dd>"
                + escaparHtml(item[2]) + "</dd></div>";
        }).join("") + "</dl></div></div>"
    );
}

/**
 * Lista de chips estáticos (§5.3).
 * @param {string[]} itens
 * @returns {string}
 */
function criarChips(itens) {
    return "<ul class=\"chips\">" + itens.map(function (item) {
        return `<li class="chip" data-cor="${corChip(item)}">${escaparHtml(item)}</li>`;
    }).join("") + "</ul>";
}

/**
 * Card de produto/trabalho (§5.5).
 * @param {object} trabalho registro de data/trabalhos.json
 * @param {object} [opcoes]
 * @param {boolean} [opcoes.favorito=true] mostra o botão de favorito
 * @param {boolean} [opcoes.status=false] mostra o badge de status
 * @param {string} [opcoes.acoes=""] HTML extra no rodapé do card
 * @param {string} [opcoes.href] link do título
 * @returns {string}
 */
function criarCardProduto(trabalho, opcoes = {}) {
    const href = opcoes.href ?? "#/produtos";
    const favorito = (
        opcoes.favorito === false
        ? ""
        : "<button type=\"button\" class=\"card-produto__favorito\""
        + " aria-pressed=\"false\" aria-label=\"Favoritar "
        + escaparHtml(trabalho.titulo) + "\">"
        + icone("lucide:heart") + "</button>"
    );
    const status = (
        opcoes.status
        ? "<p>" + criarStatus(trabalho.status) + "</p>"
        : ""
    );
    const acoes = (
        opcoes.acoes
        ? `<div class="card-produto__acoes">${opcoes.acoes}</div>`
        : ""
    );
    const imagem = escaparHtml(
        (trabalho.imagens && trabalho.imagens[0])
        || "assets/img/avatar-padrao.jpg"
    );
    return (
        "<article class=\"card card--clicavel card-produto\">"
        + `<img class="card-produto__imagem" src="${imagem}"`
        + ` alt="${escaparHtml(trabalho.titulo)}" width="400" height="150"`
        + " loading=\"lazy\">"
        + favorito
        + "<div class=\"card-produto__corpo\">"
        + `<h3 class="card-produto__titulo"><a href="${href}">`
        + escaparHtml(trabalho.titulo) + "</a></h3>"
        + "<p class=\"card-produto__meta\">"
        + escaparHtml(trabalho.tecnica + " • " + trabalho.categoria) + "</p>"
        + status + acoes
        + "</div></article>"
    );
}

/**
 * Card de estatística (§5.5).
 * @param {{icone: string, numero: number, rotulo: string}} dados
 * @returns {string}
 */
function criarCardEstatistica(dados) {
    return (
        "<article class=\"card card-estatistica\">"
        + icone(dados.icone)
        + "<p><strong class=\"card-estatistica__numero\">"
        + escaparHtml(dados.numero) + "</strong>"
        + "<span class=\"card-estatistica__rotulo\">"
        + escaparHtml(dados.rotulo) + "</span></p></article>"
    );
}

/**
 * Paginação (§5.9). Os botões têm data-pagina para o clique.
 * @param {number} atual página atual (começa em 1)
 * @param {number} total total de páginas
 * @returns {string}
 */
function criarPaginacao(atual, total) {
    const paginas = Array.from({length: total}, function (ignore, indice) {
        return indice + 1;
    });
    const numeros = paginas.map(function (pagina) {
        const corrente = (
            pagina === atual
            ? " aria-current=\"page\""
            : ""
        );
        return (
            "<li><button type=\"button\" class=\"paginacao__botao\""
            + ` data-pagina="${pagina}"${corrente}>${pagina}</button></li>`
        );
    }).join("");
    const anterior = Math.max(1, atual - 1);
    const proxima = Math.min(total, atual + 1);
    return (
        "<ul class=\"paginacao__lista\">"
        + "<li><button type=\"button\" class=\"paginacao__botao "
        + `paginacao__botao--seta" data-pagina="${anterior}"`
        + " aria-label=\"Página anterior\">" + icone("lucide:chevron-left")
        + "</button></li>"
        + numeros
        + "<li><button type=\"button\" class=\"paginacao__botao "
        + `paginacao__botao--seta" data-pagina="${proxima}"`
        + " aria-label=\"Próxima página\">" + icone("lucide:chevron-right")
        + "</button></li></ul>"
    );
}

/**
 * Liga um carrossel já presente no HTML (§5.7).
 * Estrutura esperada: .carrossel > .carrossel__janela > .carrossel__trilho
 * > .carrossel__slide; botões .carrossel__seta--anterior/--proxima;
 * .carrossel__indicadores > .carrossel__ponto.
 * @param {HTMLElement} carrossel
 */
function iniciarCarrossel(carrossel) {
    const trilho = carrossel.querySelector(".carrossel__trilho");
    const slides = carrossel.querySelectorAll(".carrossel__slide");
    const pontos = carrossel.querySelectorAll(".carrossel__ponto");
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    let atual = 0;
    let pausado = false;
    let temporizador;

    function irPara(indice) {
        atual = (indice + slides.length) % slides.length;
        trilho.style.transform = `translateX(-${atual * 100}%)`;
        slides.forEach(function (slide, posicao) {
            slide.setAttribute("aria-hidden", String(posicao !== atual));
        });
        pontos.forEach(function (ponto, posicao) {
            ponto.setAttribute("aria-current", String(posicao === atual));
        });
    }

    function avancar() {
        if (!document.body.contains(carrossel)) {
            clearInterval(temporizador);
            return;
        }
        if (!pausado) {
            irPara(atual + 1);
        }
    }

    carrossel.querySelector(".carrossel__seta--anterior").addEventListener(
        "click",
        function () {
            irPara(atual - 1);
        }
    );
    carrossel.querySelector(".carrossel__seta--proxima").addEventListener(
        "click",
        function () {
            irPara(atual + 1);
        }
    );
    pontos.forEach(function (ponto, posicao) {
        ponto.addEventListener("click", function () {
            irPara(posicao);
        });
    });
    ["mouseenter", "focusin"].forEach(function (evento) {
        carrossel.addEventListener(evento, function () {
            pausado = true;
        });
    });
    ["mouseleave", "focusout"].forEach(function (evento) {
        carrossel.addEventListener(evento, function () {
            pausado = false;
        });
    });

    irPara(0);
    if (!reduzir.matches && slides.length > 1) {
        temporizador = setInterval(avancar, INTERVALO_CARROSSEL);
    }
}

// ===== Modais (§8) =====

/** @param {string} id id do <dialog> */
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal && !modal.open) {
        modal.showModal();
    }
}

/** @param {string} id id do <dialog> */
function fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal && modal.open) {
        modal.close();
    }
}

/**
 * Liga fechar (botão .modal__fechar, [data-fechar-modal] e clique no
 * fundo) em todos os <dialog class="modal"> dentro de raiz.
 * @param {HTMLElement} raiz
 */
function prepararModais(raiz) {
    raiz.querySelectorAll("dialog.modal").forEach(function (modal) {
        modal.querySelectorAll(
            ".modal__fechar, [data-fechar-modal]"
        ).forEach(function (botao) {
            botao.addEventListener("click", function () {
                modal.close();
            });
        });
        modal.addEventListener("click", function (evento) {
            if (evento.target === modal) {
                modal.close();
            }
        });
    });
}

/**
 * Botões "olho" que alternam campos de senha (§5.2).
 * Marcação: <button data-alternar-senha="idDoInput" aria-pressed="false">.
 * @param {HTMLElement} raiz
 */
function prepararCamposSenha(raiz) {
    raiz.querySelectorAll("[data-alternar-senha]").forEach(function (botao) {
        const campo = raiz.querySelector("#" + CSS.escape(
            botao.dataset.alternarSenha
        ));
        if (!campo) {
            return;
        }
        function atualizar() {
            const visivel = campo.type === "text";
            const rotulo = visivel ? "Ocultar senha" : "Mostrar senha";
            botao.innerHTML = icone(visivel
                ? "lucide:eye" : "lucide:eye-off");
            botao.setAttribute("aria-pressed", String(visivel));
            botao.setAttribute("aria-label", rotulo);
            botao.setAttribute("title", rotulo);
            botao.setAttribute("aria-controls", campo.id);
            campo.classList.add("campo__entrada--senha");
        }
        atualizar();
        if (senhasPreparadas.has(botao)) {
            return;
        }
        senhasPreparadas.add(botao);
        botao.addEventListener("click", function () {
            campo.type = campo.type === "password" ? "text" : "password";
            atualizar();
        });
        if (campo.form) {
            campo.form.addEventListener("reset", function () {
                campo.type = "password";
                atualizar();
            });
        }
    });
}

/**
 * Mensagem flutuante temporária (§8.4).
 * @param {string} mensagem
 */
function mostrarAviso(mensagem) {
    const aviso = document.createElement("p");
    aviso.className = "aviso-flutuante";
    aviso.setAttribute("role", "status");
    aviso.textContent = mensagem;
    document.body.append(aviso);
    setTimeout(function () {
        aviso.remove();
    }, 4000);
}

/** Substitui a apresentação do select múltiplo sem alterar seus valores. */
function prepararMultisselecao(raiz) {
    raiz.querySelectorAll("select[multiple]").forEach(function (select) {
        if (select.dataset.multisselecao) {
            return;
        }
        select.dataset.multisselecao = "true";
        const rotulo = select.labels[0];
        const grupo = document.createElement("fieldset");
        grupo.className = "multisselecao";
        const legenda = document.createElement("legend");
        legenda.textContent = rotulo ? rotulo.textContent : select.name;
        grupo.append(legenda);
        const opcoes = document.createElement("div");
        opcoes.className = "multisselecao__opcoes";
        const resumo = document.createElement("p");
        resumo.className = "multisselecao__resumo";
        resumo.setAttribute("aria-live", "polite");
        const controles = Array.from(select.options).map(function (opcao) {
            const label = document.createElement("label");
            label.className = "multisselecao__opcao";
            const controle = document.createElement("input");
            controle.type = "checkbox";
            controle.checked = opcao.selected;
            controle.disabled = select.disabled || opcao.disabled;
            controle.addEventListener("change", function () {
                opcao.selected = controle.checked;
                select.dispatchEvent(new Event("change", {bubbles: true}));
            });
            label.append(controle, document.createTextNode(opcao.text));
            opcoes.append(label);
            return controle;
        });
        function atualizar() {
            controles.forEach(function (controle, indice) {
                controle.checked = select.options[indice].selected;
            });
            resumo.textContent = Array.from(select.selectedOptions).map(
                function (opcao) { return opcao.text; }
            ).join(", ") || "Nenhuma opção selecionada";
        }
        select.addEventListener("change", atualizar);
        grupo.append(opcoes, resumo);
        select.after(grupo);
        select.hidden = true;
        if (rotulo) {
            rotulo.hidden = true;
        }
        atualizar();
    });
}

export {
    STATUS,
    abrirModal,
    conteudoAcao,
    criarCampoSenha,
    criarCardEstatistica,
    criarCardProduto,
    criarChips,
    criarDetalhesTrabalho,
    criarPaginacao,
    criarStatus,
    escaparHtml,
    fecharModal,
    icone,
    iniciarCarrossel,
    mostrarAviso,
    padronizarIcones,
    prepararAcoes,
    prepararCamposSenha,
    prepararModais,
    prepararMultisselecao
};
