/*jslint browser */
/**
 * paginas/painel-artesao.js — abas da Área do Artesão (#/painel-artesao/...).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarCardProduto,
    criarPaginacao,
    criarStatus,
    escaparHtml,
    icone,
    mostrarAviso
} from "../componentes.js";
import {
    buscarArtesao,
    carregarCategorias,
    contarPorStatus,
    formatarData,
    obterSessao,
    salvarTrabalho,
    sessaoDemonstracao,
    trabalhosDoArtesao
} from "../dados.js";

const ROTA_TRABALHOS = "#/painel-artesao/meus-trabalhos";

const COMPARADORES = Object.freeze({
    antigos: function (a, b) {
        return new Date(a.atualizadoEm) - new Date(b.atualizadoEm);
    },
    nome: function (a, b) {
        return a.titulo.localeCompare(b.titulo, "pt-BR");
    },
    recentes: function (a, b) {
        return new Date(b.atualizadoEm) - new Date(a.atualizadoEm);
    }
});

/**
 * Filtra trabalhos por status, busca no texto e (opcional) categoria ou
 * técnica. "em-analise" inclui os reenviados.
 * @param {Array<object>} trabalhos
 * @param {{busca: string, categoria?: string, status: string}} filtros
 * @returns {Array<object>}
 */
function filtrarTrabalhos(trabalhos, filtros) {
    const termo = filtros.busca.trim().toLowerCase();
    return trabalhos.filter(function (trabalho) {
        const texto = [
            trabalho.titulo,
            trabalho.categoria,
            trabalho.tecnica
        ].join(" ").toLowerCase();
        const statusOk = (
            !filtros.status
            || trabalho.status === filtros.status
            || (
                filtros.status === "em-analise"
                && trabalho.status === "reenviado"
            )
        );
        const categoriaOk = (
            !filtros.categoria
            || trabalho.categoria === filtros.categoria
            || trabalho.tecnica === filtros.categoria
        );
        return statusOk && categoriaOk && (!termo || texto.includes(termo));
    });
}

/**
 * Artesão logado (sessão salva ou sessão de demonstração).
 * @returns {Promise<{artesao: object, sessao: object}>}
 */
async function artesaoLogado() {
    const salva = obterSessao();
    const demonstracao = sessaoDemonstracao("painel-artesao");
    let sessao = (
        (salva && salva.artesaoId)
        ? salva
        : demonstracao
    );
    let artesao = await buscarArtesao(sessao.artesaoId);
    if (!artesao) {
        sessao = demonstracao;
        artesao = await buscarArtesao(sessao.artesaoId);
    }
    return {artesao, sessao};
}

/**
 * Trabalhos do artesão logado, do mais recente para o mais antigo.
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDoLogado() {
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDoArtesao(sessao.artesaoId);
    return trabalhos.slice().sort(function (a, b) {
        return new Date(b.atualizadoEm) - new Date(a.atualizadoEm);
    });
}

/**
 * Aba Início: resumo e últimos trabalhos.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarInicio(raiz) {
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDoLogado();
    const contagem = contarPorStatus(trabalhos);
    const soma = function (...chaves) {
        return chaves.reduce(function (total, chave) {
            return total + (contagem[chave] || 0);
        }, 0);
    };
    raiz.querySelector("[data-artesao-nome]").textContent = sessao.nome;
    raiz.querySelector("[data-resumo]").innerHTML = [
        ["lucide:layers", trabalhos.length, "Trabalhos cadastrados"],
        ["lucide:circle-check", soma("publicado"), "Publicados"],
        ["lucide:clock", soma("em-analise", "reenviado"), "Em análise"],
        ["lucide:circle-x", soma("rejeitado", "rascunho"), "Não publicado"]
    ].map(function ([icone, numero, rotulo]) {
        return criarCardEstatistica({icone, numero, rotulo});
    }).join("");
    raiz.querySelector("[data-ultimos]").innerHTML = trabalhos.slice(
        0,
        4
    ).map(function (trabalho) {
        return criarCardProduto(trabalho, {
            favorito: false,
            href: ROTA_TRABALHOS,
            status: true
        });
    }).join("");
}

/**
 * Preenche um <select> com opções (mantém a primeira, o texto-guia).
 * @param {HTMLSelectElement} seletor
 * @param {string[]} valores
 */
function preencherOpcoes(seletor, valores) {
    seletor.insertAdjacentHTML("beforeend", valores.map(function (valor) {
        return (
            `<option value="${escaparHtml(valor)}">`
            + escaparHtml(valor) + "</option>"
        );
    }).join(""));
}

/**
 * Seletor de técnicas: o select adiciona um chip removível por técnica.
 * @param {HTMLSelectElement} seletor
 * @param {HTMLElement} lista <ul class="chips"> que recebe os chips
 * @param {Function} aoMudar chamada com a lista atual de técnicas
 * @returns {{definir: Function, obter: Function}}
 */
function ligarSeletorTecnicas(seletor, lista, aoMudar) {
    let tecnicas = [];

    function desenhar() {
        lista.innerHTML = tecnicas.map(function (tecnica) {
            return (
                "<li class=\"chip chip--removivel\">"
                + escaparHtml(tecnica)
                + "<button type=\"button\" class=\"chip__remover\""
                + ` data-remover="${escaparHtml(tecnica)}"`
                + ` aria-label="Remover ${escaparHtml(tecnica)}">`
                + icone("lucide:x") + "</button></li>"
            );
        }).join("");
        aoMudar(tecnicas);
    }

    seletor.addEventListener("change", function () {
        if (seletor.value && !tecnicas.includes(seletor.value)) {
            tecnicas = tecnicas.concat(seletor.value);
            desenhar();
        }
        seletor.value = "";
    });
    lista.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-remover]");
        if (botao) {
            tecnicas = tecnicas.filter(function (tecnica) {
                return tecnica !== botao.dataset.remover;
            });
            desenhar();
        }
    });

    return {
        definir: function (novas) {
            tecnicas = novas.slice();
            desenhar();
        },
        obter: function () {
            return tecnicas;
        }
    };
}

/**
 * Liga o botão "Alterar foto" ao input de arquivo e mostra a imagem
 * escolhida, liberando o object URL anterior.
 * @param {HTMLElement} raiz
 * @param {Function} aoMudar chamada com a nova URL da imagem
 * @returns {{restaurar: Function}}
 */
function ligarTrocaDeFoto(raiz, aoMudar) {
    const botao = raiz.querySelector("[data-alterar-foto]");
    const entrada = raiz.querySelector("[data-foto-entrada]");
    const imagem = raiz.querySelector("[data-foto]");
    let urlAtual = "";

    function liberar() {
        if (urlAtual) {
            URL.revokeObjectURL(urlAtual);
            urlAtual = "";
        }
    }

    botao.addEventListener("click", function () {
        entrada.click();
    });
    entrada.addEventListener("change", function () {
        const arquivo = entrada.files[0];
        if (arquivo) {
            liberar();
            urlAtual = URL.createObjectURL(arquivo);
            imagem.src = urlAtual;
            aoMudar(urlAtual);
        }
    });

    return {
        restaurar: function (origem) {
            liberar();
            entrada.value = "";
            imagem.src = origem;
            aoMudar(origem);
        }
    };
}

/**
 * Atualiza o card de pré-visualização do perfil público.
 * @param {HTMLElement} raiz
 * @param {string[]} tecnicas técnicas escolhidas
 */
function atualizarPrevia(raiz, tecnicas) {
    const valor = function (id) {
        return raiz.querySelector(id).value.trim();
    };
    const texto = function (gancho, conteudo) {
        raiz.querySelector(gancho).textContent = conteudo;
    };
    texto("[data-previa-nome]", valor("#perfil-nome") || "Nome do Artesão");
    texto(
        "[data-previa-categoria]",
        valor("#perfil-categoria") || "Categoria"
    );
    texto("[data-previa-tecnicas]", "Técnicas: " + tecnicas.join(", "));
    texto(
        "[data-previa-bio]",
        valor("#perfil-bio")
        || "Um breve texto sobre você, sua história e sua relação com o "
        + "artesanato."
    );
}

/**
 * Salva o perfil do artesão.
 * @param {object} ignore dados do formulário
 */
function salvarPerfil(ignore) {
    // A IMPLEMENTAR: persistir o perfil com salvarArtesao (localStorage).
    mostrarAviso("Em breve: salvar as alterações do perfil.");
}

/**
 * Aba Meu perfil: formulário e pré-visualização.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarPerfil(raiz) {
    const {artesao} = await artesaoLogado();
    const dadosCategorias = await carregarCategorias();
    const formulario = raiz.querySelector("[data-form-perfil]");
    const previaFoto = raiz.querySelector("[data-previa-foto]");
    const seletorCategoria = raiz.querySelector("#perfil-categoria");
    let seletorTecnicas;

    function aoMudar() {
        atualizarPrevia(raiz, seletorTecnicas.obter());
    }

    preencherOpcoes(seletorCategoria, dadosCategorias.categorias);
    preencherOpcoes(
        raiz.querySelector("#perfil-tecnica"),
        dadosCategorias.tecnicas
    );
    seletorTecnicas = ligarSeletorTecnicas(
        raiz.querySelector("#perfil-tecnica"),
        raiz.querySelector("[data-tecnicas]"),
        aoMudar
    );
    const foto = ligarTrocaDeFoto(raiz, function (url) {
        previaFoto.src = url;
    });

    function preencher() {
        const campos = {
            "#perfil-bio": artesao.bio,
            "#perfil-email": artesao.email,
            "#perfil-empreendimento": artesao.empreendimento,
            "#perfil-instagram": artesao.instagram,
            "#perfil-nome": artesao.nome,
            "#perfil-whatsapp": artesao.whatsapp
        };
        Object.entries(campos).forEach(function ([seletor, valor]) {
            raiz.querySelector(seletor).value = valor ?? "";
        });
        seletorCategoria.value = artesao.categorias[0] ?? "";
        foto.restaurar(artesao.foto);
        seletorTecnicas.definir(artesao.tecnicas);
    }

    preencher();
    ["#perfil-nome", "#perfil-categoria", "#perfil-bio"].forEach(
        function (seletor) {
            raiz.querySelector(seletor).addEventListener("input", aoMudar);
        }
    );
    raiz.querySelector("[data-cancelar]").addEventListener(
        "click",
        function () {
            preencher();
            mostrarAviso("Alterações descartadas.");
        }
    );
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        if (formulario.reportValidity()) {
            salvarPerfil(Object.assign(
                Object.fromEntries(new FormData(formulario)),
                {tecnicas: seletorTecnicas.obter()}
            ));
        }
    });
}

// ===== Meus trabalhos =====

const POR_PAGINA = 8;

/**
 * Abre a edição de um trabalho.
 * @param {object} trabalho
 */
function editarTrabalho(trabalho) {
    // A IMPLEMENTAR: abrir o formulário de edição do trabalho.
    mostrarAviso("Em breve: editar \"" + trabalho.titulo + "\".");
}

/**
 * Abre o menu de ações (⋯) de um trabalho.
 * @param {object} trabalho
 */
function abrirMenuTrabalho(trabalho) {
    // A IMPLEMENTAR: menu com Ver no portal, Duplicar, Enviar para análise
    // e Excluir.
    mostrarAviso("Em breve: mais ações para \"" + trabalho.titulo + "\".");
}

/**
 * Mostra o motivo da rejeição de um trabalho.
 * @param {object} trabalho
 */
function verMotivo(trabalho) {
    // A IMPLEMENTAR: popup com o motivo da rejeição e "Editar e reenviar".
    mostrarAviso("Em breve: motivo da rejeição de " + trabalho.titulo + ".");
}

/**
 * Envia um rascunho para a análise do Liceu.
 * @param {object} trabalho
 */
function enviarParaAnalise(trabalho) {
    // A IMPLEMENTAR: confirmar e mudar o status para "em-analise".
    mostrarAviso("Em breve: enviar \"" + trabalho.titulo + "\" para análise.");
}

/**
 * Botão com ícone e texto para o rodapé dos cards.
 * @param {string} acao valor de data-acao
 * @param {string} id id do trabalho
 * @param {string} nomeIcone
 * @param {string} texto
 * @param {string} classes classes extras
 * @returns {string}
 */
function criarBotaoAcao(acao, id, nomeIcone, texto, classes) {
    return (
        `<button type="button" class="btn ${classes}"`
        + ` data-acao="${acao}" data-id="${escaparHtml(id)}">`
        + (
            classes.includes("btn--link")
            ? texto + icone(nomeIcone)
            : icone(nomeIcone) + texto
        )
        + "</button>"
    );
}

/**
 * Bloco de estado de rascunhos e rejeitados (no lugar do badge).
 * @param {object} trabalho
 * @returns {string}
 */
function criarEstadoTrabalho(trabalho) {
    if (trabalho.status === "rejeitado") {
        return (
            "<div class=\"artesao-estado\">"
            + criarStatus("rejeitado")
            + criarBotaoAcao(
                "motivo",
                trabalho.id,
                "lucide:arrow-right",
                "Ver motivo",
                "btn--link"
            )
            + "</div>"
        );
    }
    if (trabalho.status === "rascunho") {
        return (
            "<div class=\"artesao-estado\">"
            + criarBotaoAcao(
                "editar",
                trabalho.id,
                "lucide:file",
                "Rascunho",
                "btn--suave btn--pequeno"
            )
            + criarBotaoAcao(
                "enviar",
                trabalho.id,
                "lucide:send",
                "Enviar para análise",
                "btn--suave btn--pequeno"
            )
            + "</div>"
        );
    }
    return "";
}

/**
 * Card de um trabalho com as ações conforme o status.
 * @param {object} trabalho
 * @returns {string}
 */
function criarAcoesTrabalho(trabalho) {
    const titulo = escaparHtml(trabalho.titulo);
    const acoes = (
        criarEstadoTrabalho(trabalho)
        + "<div class=\"artesao-botoes\">"
        + criarBotaoAcao(
            "editar",
            trabalho.id,
            "lucide:pencil",
            "Editar",
            "btn--suave btn--pequeno"
        )
        + "<button type=\"button\" class=\"btn btn--icone\""
        + ` data-acao="menu" data-id="${escaparHtml(trabalho.id)}"`
        + ` aria-label="Mais ações para ${titulo}">`
        + icone("lucide:ellipsis") + "</button></div>"
    );
    return criarCardProduto(trabalho, {
        acoes,
        favorito: false,
        href: ROTA_TRABALHOS,
        status: (
            trabalho.status !== "rascunho"
            && trabalho.status !== "rejeitado"
        )
    });
}

/**
 * Aba Meus trabalhos: grade de trabalhos com filtros.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarTrabalhos(raiz) {
    const todos = await trabalhosDoLogado();
    const dadosCategorias = await carregarCategorias();
    const grade = raiz.querySelector("[data-grade]");
    const seletorCategoria = raiz.querySelector("[data-filtro-categoria]");
    const estado = {busca: "", ordem: "recentes", pagina: 1};

    seletorCategoria.insertAdjacentHTML(
        "beforeend",
        "<optgroup label=\"Categorias\">"
        + dadosCategorias.categorias.map(function (nome) {
            return (
                `<option value="${escaparHtml(nome)}">`
                + escaparHtml(nome) + "</option>"
            );
        }).join("")
        + "</optgroup><optgroup label=\"Técnicas\">"
        + dadosCategorias.tecnicas.map(function (nome) {
            return (
                `<option value="${escaparHtml(nome)}">`
                + escaparHtml(nome) + "</option>"
            );
        }).join("")
        + "</optgroup>"
    );

    function filtrar() {
        const lista = filtrarTrabalhos(todos, {
            busca: estado.busca,
            categoria: seletorCategoria.value,
            status: raiz.querySelector("[data-filtro-status]").value
        });
        return lista.sort(COMPARADORES[estado.ordem]);
    }

    function desenhar() {
        const lista = filtrar();
        const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        estado.pagina = Math.min(estado.pagina, totalPaginas);
        const inicio = (estado.pagina - 1) * POR_PAGINA;
        const pagina = lista.slice(inicio, inicio + POR_PAGINA);
        grade.innerHTML = (
            pagina.length
            ? pagina.map(criarAcoesTrabalho).join("")
            : "<p class=\"artesao-vazio\">Nenhum trabalho encontrado.</p>"
        );
        raiz.querySelector("[data-contagem]").textContent = (
            pagina.length
            ? `Exibindo ${inicio + 1} - ${inicio + pagina.length} de `
            + `${lista.length} trabalhos`
            : "Exibindo 0 trabalhos"
        );
        raiz.querySelector("[data-paginacao]").innerHTML = (
            totalPaginas > 1
            ? criarPaginacao(estado.pagina, totalPaginas)
            : ""
        );
    }

    function voltarEDesenhar() {
        estado.pagina = 1;
        desenhar();
    }

    raiz.querySelector("[data-busca]").addEventListener(
        "input",
        function (evento) {
            estado.busca = evento.target.value;
            voltarEDesenhar();
        }
    );
    raiz.querySelector("[data-ordem]").addEventListener(
        "change",
        function (evento) {
            estado.ordem = evento.target.value;
            voltarEDesenhar();
        }
    );
    [
        raiz.querySelector("[data-filtro-status]"),
        seletorCategoria
    ].forEach(function (seletor) {
        seletor.addEventListener("change", voltarEDesenhar);
    });
    raiz.querySelectorAll("[data-visao]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            raiz.querySelectorAll("[data-visao]").forEach(function (outro) {
                outro.setAttribute("aria-pressed", String(outro === botao));
            });
            grade.classList.toggle(
                "artesao-lista",
                botao.dataset.visao === "lista"
            );
        });
    });
    raiz.querySelector("[data-paginacao]").addEventListener(
        "click",
        function (evento) {
            const botao = evento.target.closest("[data-pagina]");
            if (botao) {
                estado.pagina = Number(botao.dataset.pagina);
                desenhar();
            }
        }
    );
    grade.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-acao]");
        const trabalho = botao && todos.find(function (item) {
            return item.id === botao.dataset.id;
        });
        const acoes = {
            editar: editarTrabalho,
            enviar: enviarParaAnalise,
            menu: abrirMenuTrabalho,
            motivo: verMotivo
        };
        if (trabalho) {
            acoes[botao.dataset.acao](trabalho);
        }
    });

    desenhar();
}

// ===== Novo trabalho =====

const MAX_IMAGENS = 8;
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_IMAGEM = ["image/jpeg", "image/png"];

/**
 * Abre a lista de rascunhos do artesão.
 */
function abrirRascunhos() {
    // A IMPLEMENTAR: popup/lista com os rascunhos salvos do artesão.
    mostrarAviso("Em breve: seus rascunhos.");
}

/**
 * Salva ou envia o trabalho para análise.
 * @param {object} dados campos do formulário e nomes das imagens
 * @param {string} status "rascunho" | "em-analise"
 * @returns {Promise<void>}
 */
async function enviarTrabalho(dados, status) {
    // A IMPLEMENTAR: persistência real (salvarTrabalho ainda é um stub).
    await salvarTrabalho(Object.assign({}, dados, {status}));
    mostrarAviso(
        status === "rascunho"
        ? "Rascunho salvo (simulação)."
        : "Trabalho enviado para análise (simulação)."
    );
}

/**
 * Área de upload: clique, arrastar-soltar, limite de 8 imagens e
 * miniaturas com remoção e selo de capa.
 * @param {HTMLElement} raiz
 * @returns {{nomes: Function}}
 */
function ligarUpload(raiz) {
    const area = raiz.querySelector("[data-upload]");
    const entrada = raiz.querySelector("[data-upload-entrada]");
    const lista = raiz.querySelector("[data-miniaturas]");
    let imagens = [];

    function desenhar() {
        lista.innerHTML = imagens.map(function (imagem, indice) {
            return (
                "<li class=\"miniatura\">"
                + `<img src="${imagem.url}" width="80" height="80"`
                + ` alt="Imagem ${indice + 1}: `
                + escaparHtml(imagem.arquivo.name) + "\">"
                + "<button type=\"button\" class=\"miniatura__remover\""
                + ` data-remover="${indice}"`
                + ` aria-label="Remover imagem ${indice + 1}">`
                + icone("lucide:x") + "</button>"
                + (
                    indice === 0
                    ? "<span class=\"miniatura__capa\">★ Capa</span>"
                    : ""
                )
                + "</li>"
            );
        }).join("");
    }

    function adicionar(arquivos) {
        const validos = Array.from(arquivos).filter(function (arquivo) {
            return TIPOS_IMAGEM.includes(arquivo.type)
            && arquivo.size <= MAX_BYTES;
        });
        const vagas = MAX_IMAGENS - imagens.length;
        if (validos.length < arquivos.length) {
            mostrarAviso("Só JPG ou PNG de até 10 MB são aceitos.");
        }
        if (validos.length > vagas) {
            mostrarAviso("Limite de 8 imagens por trabalho.");
        }
        imagens = imagens.concat(validos.slice(0, vagas).map(
            function (arquivo) {
                return {arquivo, url: URL.createObjectURL(arquivo)};
            }
        ));
        desenhar();
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
    area.addEventListener("drop", function () {
        area.classList.remove("upload--arrastando");
    });
    area.addEventListener("drop", function (evento) {
        evento.preventDefault();
        adicionar(evento.dataTransfer.files);
    });
    lista.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-remover]");
        if (botao) {
            const indice = Number(botao.dataset.remover);
            URL.revokeObjectURL(imagens[indice].url);
            imagens = imagens.filter(function (ignore, posicao) {
                return posicao !== indice;
            });
            desenhar();
        }
    });

    return {
        nomes: function () {
            return imagens.map(function (imagem) {
                return imagem.arquivo.name;
            });
        }
    };
}

/**
 * Aba Novo trabalho: formulário e upload de imagens.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarNovoTrabalho(raiz) {
    const dadosCategorias = await carregarCategorias();
    const formulario = raiz.querySelector("[data-form-trabalho]");
    const campoPreco = raiz.querySelector("[data-preco]");
    const upload = ligarUpload(raiz);

    preencherOpcoes(
        raiz.querySelector("#trabalho-categoria"),
        dadosCategorias.categorias
    );
    preencherOpcoes(
        raiz.querySelector("#trabalho-tecnica"),
        dadosCategorias.tecnicas
    );
    raiz.querySelectorAll("[data-preco-tipo]").forEach(function (opcao) {
        opcao.addEventListener("change", function () {
            const definir = opcao.value === "definir" && opcao.checked;
            campoPreco.disabled = !definir;
            campoPreco.required = definir;
            if (definir) {
                campoPreco.focus();
            } else {
                campoPreco.value = "";
            }
        });
    });

    function coletar() {
        const dados = Object.fromEntries(new FormData(formulario));
        return Object.assign(dados, {imagens: upload.nomes()});
    }

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        if (formulario.reportValidity()) {
            enviarTrabalho(coletar(), "em-analise");
        }
    });
    raiz.querySelector("[data-salvar-rascunho]").addEventListener(
        "click",
        function () {
            enviarTrabalho(coletar(), "rascunho");
        }
    );
    raiz.querySelector("[data-rascunhos]").addEventListener(
        "click",
        abrirRascunhos
    );
}

// ===== Status das publicações =====

/**
 * Linha da tabela de status, com as ações conforme o status.
 * @param {object} trabalho
 * @returns {string}
 */
function criarLinhaStatus(trabalho) {
    const id = escaparHtml(trabalho.id);
    const botao = function (acao, nomeIcone, texto, classes) {
        return (
            `<button type="button" class="btn ${classes}"`
            + ` data-acao="${acao}" data-id="${id}">`
            + icone(nomeIcone) + texto + "</button>"
        );
    };
    const acoes = {
        "em-analise": (
            "<button type=\"button\" class=\"btn btn--suave btn--pequeno\""
            + " aria-disabled=\"true\">"
            + icone("lucide:hourglass") + "Aguardando análise</button>"
        ),
        publicado: (
            "<a class=\"btn btn--secundario btn--pequeno\" href=\"#/produtos\">"
            + icone("lucide:external-link") + "Ver no portal</a>"
        ),
        rascunho: botao(
            "editar",
            "lucide:pencil",
            "Continuar edição",
            "btn--secundario btn--pequeno"
        ),
        rejeitado: (
            "<button type=\"button\" class=\"btn btn--link\""
            + ` data-acao="motivo" data-id="${id}">Ver motivo</button>`
            + botao(
                "editar",
                "lucide:pencil",
                "Editar e reenviar",
                "btn--secundario btn--pequeno"
            )
        )
    };
    acoes.reenviado = acoes["em-analise"];
    return (
        "<tr>"
        + "<td data-rotulo=\"Trabalho\"><div class=\"tabela__principal\">"
        + "<img class=\"tabela__miniatura\" src=\""
        + escaparHtml(trabalho.imagens[0]) + "\""
        + " alt=\"\" width=\"64\" height=\"44\" loading=\"lazy\">"
        + "<div><strong>" + escaparHtml(trabalho.titulo) + "</strong>"
        + "<span class=\"texto-suave\">"
        + escaparHtml(trabalho.categoria + " • " + trabalho.tecnica)
        + "</span></div></div></td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(trabalho.status)
        + "</td>"
        + "<td data-rotulo=\"Última atualização\">"
        + escaparHtml(formatarData(trabalho.atualizadoEm)) + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + (acoes[trabalho.status] ?? "") + "</div></td>"
        + "</tr>"
    );
}

/**
 * Aba Status das publicações: resumo e tabela.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarStatus(raiz) {
    const todos = await trabalhosDoLogado();
    const contagem = contarPorStatus(todos);
    const corpo = raiz.querySelector("[data-linhas]");
    const estado = {busca: "", ordem: "recentes"};

    raiz.querySelector("[data-resumo]").innerHTML = [
        ["lucide:circle-check", contagem.publicado, "Publicados"],
        [
            "lucide:clock",
            (contagem["em-analise"] || 0) + (contagem.reenviado || 0),
            "Em análise"
        ],
        ["lucide:file-text", contagem.rascunho, "Rascunhos"],
        ["lucide:circle-x", contagem.rejeitado, "Rejeitados"]
    ].map(function ([icone, numero, rotulo]) {
        return criarCardEstatistica({
            icone,
            numero: numero || 0,
            rotulo
        });
    }).join("");

    function desenhar() {
        const lista = filtrarTrabalhos(todos, {
            busca: estado.busca,
            status: raiz.querySelector("[data-filtro-status]").value
        }).sort(COMPARADORES[estado.ordem]);
        corpo.innerHTML = lista.map(criarLinhaStatus).join("");
        raiz.querySelector("[data-vazio]").hidden = lista.length > 0;
    }

    raiz.querySelector("[data-busca]").addEventListener(
        "input",
        function (evento) {
            estado.busca = evento.target.value;
            desenhar();
        }
    );
    raiz.querySelector("[data-filtro-status]").addEventListener(
        "change",
        desenhar
    );
    raiz.querySelector("[data-ordem]").addEventListener(
        "change",
        function (evento) {
            estado.ordem = evento.target.value;
            desenhar();
        }
    );
    corpo.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-acao]");
        const trabalho = botao && todos.find(function (item) {
            return item.id === botao.dataset.id;
        });
        if (trabalho) {
            (
                botao.dataset.acao === "motivo"
                ? verMotivo
                : editarTrabalho
            )(trabalho);
        }
    });

    desenhar();
}

/**
 * Envolve a montagem de uma aba: se o carregamento de dados falhar,
 * mostra uma mensagem visível no lugar do conteúdo.
 * @param {string} descricao o que não pôde ser carregado
 * @param {Function} montar função async que recebe a raiz
 * @returns {Function}
 */
function protegida(descricao, montar) {
    return async function (raiz) {
        try {
            await montar(raiz);
        } catch (ignore) {
            raiz.insertAdjacentHTML(
                "beforeend",
                "<p class=\"artesao-vazio\" role=\"alert\">"
                + `Não foi possível carregar ${descricao}.</p>`
            );
        }
    };
}

const iniciarArtesaoInicio = protegida("o resumo", montarInicio);
const iniciarArtesaoNovoTrabalho = protegida(
    "o formulário",
    montarNovoTrabalho
);
const iniciarArtesaoPerfil = protegida("o perfil", montarPerfil);
const iniciarArtesaoStatus = protegida("as publicações", montarStatus);
const iniciarArtesaoTrabalhos = protegida("os trabalhos", montarTrabalhos);

export {
    iniciarArtesaoInicio,
    iniciarArtesaoNovoTrabalho,
    iniciarArtesaoPerfil,
    iniciarArtesaoStatus,
    iniciarArtesaoTrabalhos
};
