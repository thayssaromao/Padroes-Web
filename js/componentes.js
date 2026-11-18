/*jslint browser */
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

// Compatibilidade das páginas antigas com os ícones aprovados no design system.
const ICONES_PADRAO = Object.freeze({
    "lucide:landmark": "uix-sharp:greek-temple",
    "lucide:lightbulb": "akar-icons:light-bulb",
    "lucide:shopping-bag": "bx:shopping-bag",
    "lucide:user": "boxicons:user",
    "lucide:user-plus": "boxicons:user",
    "lucide:users": "boxicons:user",
    "solar:bag-4-bold": "bx:shopping-bag",
    "solar:buildings-2-bold": "uix-sharp:greek-temple",
    "solar:user-bold": "boxicons:user"
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
    return `<iconify-icon icon="${escaparHtml(padrao)}" aria-hidden="true"></iconify-icon>`;
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

/**
 * Lista de chips estáticos (§5.3).
 * @param {string[]} itens
 * @returns {string}
 */
function criarChips(itens) {
    return "<ul class=\"chips\">" + itens.map(function (item) {
        return `<li class="chip">${escaparHtml(item)}</li>`;
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
 * Card de técnica da página Saberes (§5.5).
 * @param {object} tecnica registro de data/tecnicas.json
 * @param {object} [opcoes]
 * @param {boolean} [opcoes.favoritado=false] estado inicial do favorito
 * @returns {string}
 */
function criarCardTecnica(tecnica, opcoes = {}) {
    const nome = escaparHtml(tecnica.nome);
    const id = escaparHtml(tecnica.id);
    const imagem = (
        tecnica.imagem
        ? `<img class="card-tecnica__imagem" src="${escaparHtml(tecnica.imagem)}"`
        + ` alt="" width="400" height="150" loading="lazy">`
        : "<div class=\"card-tecnica__imagem\" aria-hidden=\"true\"></div>"
    );
    return (
        "<article class=\"card card-tecnica\">"
        + imagem
        + "<button type=\"button\" class=\"card-tecnica__favorito\""
        + ` data-favorito="${id}"`
        + ` aria-pressed="${Boolean(opcoes.favoritado)}"`
        + ` aria-label="Favoritar ${nome}">`
        + icone("lucide:heart") + "</button>"
        + "<div class=\"card-tecnica__corpo\">"
        + `<h3 class="card-tecnica__titulo">${nome}</h3>`
        + "<p class=\"card-tecnica__descricao\">"
        + escaparHtml(tecnica.descricao) + "</p>"
        + "<button type=\"button\" class=\"btn btn--secundario btn--bloco"
        + ` btn--pequeno" data-tecnica="${id}"`
        + ` aria-label="Saiba mais sobre ${nome}">`
        + "Saiba mais" + icone("lucide:arrow-right")
        + "</button></div></article>"
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
        // O fundo (::backdrop) e o espaço vazio do próprio <dialog> têm o
        // mesmo target, então decide pela posição do clique: só fecha se
        // ele cair fora do retângulo do modal.
        modal.addEventListener("click", function (evento) {
            const area = modal.getBoundingClientRect();
            const fora = (
                evento.clientX < area.left ||
                evento.clientX > area.right ||
                evento.clientY < area.top ||
                evento.clientY > area.bottom
            );
            if (evento.target === modal && fora) {
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
        botao.addEventListener("click", function () {
            const campo = document.getElementById(
                botao.dataset.alternarSenha
            );
            const mostrar = campo.type === "password";
            campo.type = (
                mostrar
                ? "text"
                : "password"
            );
            botao.setAttribute("aria-pressed", String(mostrar));
        });
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

export {
    STATUS,
    abrirModal,
    criarCardEstatistica,
    criarCardProduto,
    criarCardTecnica,
    criarChips,
    criarPaginacao,
    criarStatus,
    escaparHtml,
    fecharModal,
    icone,
    iniciarCarrossel,
    mostrarAviso,
    padronizarIcones,
    prepararCamposSenha,
    prepararModais
};
