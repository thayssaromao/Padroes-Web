/*jslint browser */
/**
 * paginas/painel-liceu.js — abas da Área do Liceu (#/painel-liceu/...).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarChips,
    criarPaginacao,
    criarStatus,
    escaparHtml,
    icone,
    mostrarAviso,
    prepararCamposSenha
} from "../componentes.js";
import {
    carregarArtesaos,
    carregarCategorias,
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus,
    formatarData,
    salvarArtesao
} from "../dados.js";

const MAXIMO_CARDS_INICIO = 4;
const POR_PAGINA = 5;

// ===== Ações ainda sem tela (stubs) =====

/**
 * Abre a análise de um trabalho pendente.
 * @param {string} id id do trabalho
 */
function analisarTrabalho(id) {
    // A IMPLEMENTAR: abrir o popup de análise (aprovar ou rejeitar).
    mostrarAviso("Em breve: analisar o trabalho " + id + ".");
}

/**
 * Abre o perfil de um artesão.
 * @param {string} id id do artesão
 */
function verPerfilArtesao(id) {
    // A IMPLEMENTAR: abrir o popup com o perfil do artesão.
    mostrarAviso("Em breve: ver o perfil de " + id + ".");
}

/**
 * Abre a edição rápida de um artesão.
 * @param {string} id id do artesão
 */
function editarArtesao(id) {
    // A IMPLEMENTAR: abrir o popup de edição do artesão.
    mostrarAviso("Em breve: editar o cadastro de " + id + ".");
}

/**
 * Abre o menu de ações de um artesão (ativar/desativar, redefinir senha).
 * @param {string} id id do artesão
 */
function abrirMenuArtesao(id) {
    // A IMPLEMENTAR: abrir o menu de ações do artesão.
    mostrarAviso("Em breve: mais ações para " + id + ".");
}

// ===== Helpers compartilhados =====

/**
 * Liga cliques em elementos [data-acao] dentro de um contêiner.
 * @param {HTMLElement} alvo elemento interno da parcial
 * @param {object} acoes mapa nome da ação -> função(id)
 */
function ligarAcoes(alvo, acoes) {
    alvo.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-acao]");
        const acao = (
            botao
            ? acoes[botao.dataset.acao]
            : undefined
        );
        if (acao) {
            acao(botao.dataset.id);
        }
    });
}

/**
 * Minúsculas e sem acentos, para comparar textos na busca.
 * @param {string} texto
 * @returns {string}
 */
function normalizar(texto) {
    return String(texto).normalize("NFD").replace(
        /[\u0300-\u036f]/g,
        ""
    ).toLowerCase();
}

/**
 * Gera <option> a partir de uma lista de textos.
 * @param {string[]} itens
 * @returns {string}
 */
function criarOpcoes(itens) {
    return itens.map(function (item) {
        return (
            `<option value="${escaparHtml(item)}">`
            + escaparHtml(item) + "</option>"
        );
    }).join("");
}

/**
 * Preenche o select de filtro com categorias e técnicas agrupadas.
 * @param {HTMLSelectElement} select já com a opção "Todas"
 * @param {{categorias: string[], tecnicas: string[]}} dados
 */
function preencherFiltroCategorias(select, dados) {
    select.insertAdjacentHTML(
        "beforeend",
        "<optgroup label=\"Categorias\">" + criarOpcoes(dados.categorias)
        + "</optgroup><optgroup label=\"Técnicas\">"
        + criarOpcoes(dados.tecnicas) + "</optgroup>"
    );
}

/**
 * Liga busca, filtros, ordenação e paginação de uma tabela. A parcial
 * traz [data-busca], [data-filtro], [data-ordem], [data-corpo],
 * [data-contagem], [data-paginacao] e [data-vazio].
 * @param {HTMLElement} raiz
 * @param {object} config itens, criarLinha, filtros, ordemPadrao, ordens,
 *     plural, textos
 */
function ligarListagem(raiz, config) {
    const corpo = raiz.querySelector("[data-corpo]");
    const contagem = raiz.querySelector("[data-contagem]");
    const paginacao = raiz.querySelector("[data-paginacao]");
    const vazio = raiz.querySelector("[data-vazio]");
    const busca = raiz.querySelector("[data-busca]");
    const ordem = raiz.querySelector("[data-ordem]");
    const campos = Array.from(raiz.querySelectorAll("[data-filtro]"));
    let pagina = 1;

    function selecionar() {
        const texto = normalizar(busca.value.trim());
        const comparar = config.ordens[(
            ordem
            ? ordem.value
            : config.ordemPadrao
        )];
        return config.itens.filter(function (item) {
            return (
                normalizar(config.textos(item)).includes(texto)
                && campos.every(function (campo) {
                    return (
                        !campo.value
                        || config.filtros[campo.dataset.filtro](
                            item,
                            campo.value
                        )
                    );
                })
            );
        }).sort(comparar);
    }

    function exibir() {
        const lista = selecionar();
        const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        const inicio = (Math.min(pagina, total) - 1) * POR_PAGINA;
        const visiveis = lista.slice(inicio, inicio + POR_PAGINA);
        pagina = Math.min(pagina, total);
        corpo.innerHTML = visiveis.map(config.criarLinha).join("");
        vazio.hidden = lista.length > 0;
        contagem.textContent = (
            lista.length
            ? (
                `Mostrando ${inicio + 1}–${inicio + visiveis.length}`
                + ` de ${lista.length} ${config.plural}`
            )
            : "Nenhum resultado"
        );
        paginacao.innerHTML = criarPaginacao(pagina, total);
    }

    function recomecar() {
        pagina = 1;
        exibir();
    }

    busca.addEventListener("input", recomecar);
    campos.forEach(function (campo) {
        campo.addEventListener("change", recomecar);
    });
    if (ordem) {
        ordem.addEventListener("change", recomecar);
    }
    paginacao.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-pagina]");
        if (botao) {
            pagina = Number(botao.dataset.pagina);
            exibir();
        }
    });
    exibir();
}

/**
 * Trabalhos que aguardam análise (em análise ou reenviados), do mais
 * antigo para o mais recente.
 * @param {Array<object>} trabalhos
 * @returns {Array<object>}
 */
function filtrarPendentes(trabalhos) {
    return trabalhos.filter(function (trabalho) {
        return (
            trabalho.status === "em-analise"
            || trabalho.status === "reenviado"
        );
    }).sort(function (a, b) {
        return new Date(a.enviadoEm) - new Date(b.enviadoEm);
    });
}

// ===== Aba Início =====

/**
 * Card de trabalho aguardando análise.
 * @param {object} trabalho com artesaoNome (comNomeDoArtesao)
 * @returns {string}
 */
function criarCardPendente(trabalho) {
    return (
        "<article class=\"card card-trabalho\">"
        + `<img class="card-trabalho__imagem" src="${trabalho.imagens[0]}"`
        + ` alt="${escaparHtml(trabalho.titulo)}" width="400" height="160"`
        + " loading=\"lazy\">"
        + "<h3 class=\"card-trabalho__titulo\">"
        + escaparHtml(trabalho.titulo) + "</h3>"
        + "<p class=\"card-trabalho__meta\">" + icone("lucide:user")
        + escaparHtml(trabalho.artesaoNome) + "</p>"
        + "<p class=\"card-trabalho__meta\">" + icone("lucide:tag")
        + escaparHtml(trabalho.tecnica + " • " + trabalho.categoria) + "</p>"
        + "<p>" + criarStatus(trabalho.status) + "</p>"
        + "<button type=\"button\" class=\"btn btn--secundario btn--bloco\""
        + ` data-acao="analisar" data-id="${escaparHtml(trabalho.id)}">`
        + icone("lucide:external-link") + "Analisar</button></article>"
    );
}

/**
 * Aba Início: resumo e trabalhos aguardando análise.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarLiceuInicio(raiz) {
    const dados = await Promise.all([carregarArtesaos(), carregarTrabalhos()]);
    const contagem = contarPorStatus(dados[1]);
    const pendentes = filtrarPendentes(dados[1]);
    const resumo = [
        {
            icone: "lucide:users",
            numero: dados[0].length,
            rotulo: "Artesãos cadastrados"
        },
        {
            icone: "lucide:circle-check",
            numero: contagem.publicado || 0,
            rotulo: "Trabalhos publicados"
        },
        {
            icone: "lucide:clock",
            numero: pendentes.length,
            rotulo: "Aguardando análise"
        },
        {
            icone: "lucide:circle-x",
            numero: contagem.rejeitado || 0,
            rotulo: "Rejeitado / aguardando correção"
        }
    ];
    const lista = raiz.querySelector("[data-pendentes]");
    const exibidos = await comNomeDoArtesao(
        pendentes.slice(0, MAXIMO_CARDS_INICIO)
    );

    raiz.querySelector("[data-resumo]").innerHTML = resumo.map(
        criarCardEstatistica
    ).join("");
    lista.innerHTML = exibidos.map(criarCardPendente).join("");
    ligarAcoes(lista, {analisar: analisarTrabalho});
}

// ===== Aba Artesãos =====

/**
 * Linha da tabela de artesãos.
 * @param {object} artesao registro de data/artesaos.json
 * @returns {string}
 */
function criarLinhaArtesao(artesao) {
    const nome = escaparHtml(artesao.nome);
    const id = `data-id="${escaparHtml(artesao.id)}"`;
    return (
        "<tr>"
        + "<td data-rotulo=\"Artesão\"><span class=\"tabela__principal\">"
        + `<img class="avatar" src="${escaparHtml(artesao.foto)}" alt=""`
        + ` width="40" height="40" loading="lazy">${nome}</span></td>`
        + "<td data-rotulo=\"Empreendimento\">"
        + escaparHtml(artesao.empreendimento) + "</td>"
        + "<td data-rotulo=\"Categoria / Técnica\">"
        + criarChips(artesao.tecnicas.concat(artesao.categorias)) + "</td>"
        + "<td data-rotulo=\"Contato\"><span class=\"liceu-contato\">"
        + "<span>" + icone("lucide:mail") + escaparHtml(artesao.email)
        + "</span><span>" + icone("mdi:whatsapp")
        + escaparHtml(artesao.whatsapp) + "</span></span></td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(artesao.status)
        + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + `<button type="button" class="btn btn--secundario btn--pequeno"`
        + ` data-acao="ver-perfil" ${id}>`
        + icone("lucide:external-link") + "Ver perfil</button>"
        + `<button type="button" class="btn btn--secundario btn--pequeno"`
        + ` data-acao="editar" ${id}>`
        + icone("lucide:pencil") + "Editar</button>"
        + "<button type=\"button\" class=\"btn btn--icone\""
        + ` data-acao="mais" ${id}`
        + ` aria-label="Mais ações para ${nome}">`
        + icone("lucide:ellipsis") + "</button></div></td></tr>"
    );
}

/**
 * Aba Artesãos: tabela, busca e filtros.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarLiceuArtesaos(raiz) {
    const dados = await Promise.all([
        carregarArtesaos(),
        carregarCategorias()
    ]);
    preencherFiltroCategorias(
        raiz.querySelector("[data-filtro]"),
        dados[1]
    );
    ligarListagem(raiz, {
        criarLinha: criarLinhaArtesao,
        filtros: {
            categoria: function (artesao, valor) {
                return artesao.categorias.concat(artesao.tecnicas).includes(
                    valor
                );
            }
        },
        itens: dados[0],
        ordemPadrao: "recentes",
        ordens: {
            nome: function (a, b) {
                return a.nome.localeCompare(b.nome, "pt-BR");
            },
            recentes: function (a, b) {
                return new Date(b.cadastradoEm) - new Date(a.cadastradoEm);
            }
        },
        plural: "artesãos",
        textos: function (artesao) {
            return (
                artesao.nome + " " + artesao.email + " "
                + artesao.empreendimento
            );
        }
    });
    ligarAcoes(raiz.querySelector("[data-corpo]"), {
        editar: editarArtesao,
        mais: abrirMenuArtesao,
        "ver-perfil": verPerfilArtesao
    });
}

// ===== Aba Cadastrar Artesão =====

/**
 * Simula o cadastro de um novo artesão (sem a senha, que não é guardada).
 * @param {object} dados campos do formulário
 * @returns {Promise<void>}
 */
async function cadastrarArtesao(dados) {
    // A IMPLEMENTAR: enviar ao servidor e criar o acesso do artesão.
    await salvarArtesao(dados);
    mostrarAviso("Artesão cadastrado (simulação).");
}

/**
 * Liga o seletor de técnicas: escolher adiciona um chip removível e
 * mantém o campo oculto com os valores separados por vírgula.
 * @param {HTMLElement} raiz
 * @returns {function(): string[]} lê as técnicas escolhidas
 */
function ligarTecnicas(raiz) {
    const seletor = raiz.querySelector("[data-seletor-tecnicas]");
    const lista = raiz.querySelector("[data-tecnicas-lista]");
    const valor = raiz.querySelector("[data-tecnicas-valor]");
    let escolhidas = [];

    function exibir() {
        valor.value = escolhidas.join(",");
        lista.innerHTML = escolhidas.map(function (tecnica) {
            const nome = escaparHtml(tecnica);
            return (
                "<li class=\"chip chip--removivel\">" + nome
                + "<button type=\"button\" class=\"chip__remover\""
                + ` data-remover="${nome}" aria-label="Remover ${nome}">`
                + icone("lucide:x") + "</button></li>"
            );
        }).join("");
    }

    seletor.addEventListener("change", function () {
        if (seletor.value && !escolhidas.includes(seletor.value)) {
            escolhidas.push(seletor.value);
            exibir();
        }
        seletor.value = "";
    });
    lista.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-remover]");
        if (botao) {
            escolhidas = escolhidas.filter(function (tecnica) {
                return tecnica !== botao.dataset.remover;
            });
            exibir();
        }
    });
    raiz.querySelector("[data-formulario]").addEventListener(
        "reset",
        function () {
            escolhidas = [];
            exibir();
        }
    );
    return function () {
        return escolhidas.slice();
    };
}

/**
 * Aba Cadastrar Artesão: formulário de acesso inicial.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarLiceuCadastro(raiz) {
    const categorias = await carregarCategorias();
    const formulario = raiz.querySelector("[data-formulario]");
    const senha = formulario.elements.senha;
    const confirmar = formulario.elements.confirmar;
    const lerTecnicas = ligarTecnicas(raiz);

    function conferirSenhas() {
        confirmar.setCustomValidity(
            senha.value === confirmar.value
            ? ""
            : "As senhas não conferem."
        );
    }

    formulario.elements.categoria.insertAdjacentHTML(
        "beforeend",
        criarOpcoes(categorias.categorias)
    );
    raiz.querySelector("[data-seletor-tecnicas]").insertAdjacentHTML(
        "beforeend",
        criarOpcoes(categorias.tecnicas)
    );
    prepararCamposSenha(formulario);
    senha.addEventListener("input", conferirSenhas);
    confirmar.addEventListener("input", conferirSenhas);
    formulario.addEventListener("submit", function (evento) {
        const campos = formulario.elements;
        const categoria = campos.categoria.value;
        evento.preventDefault();
        cadastrarArtesao({
            categorias: (
                categoria
                ? [categoria]
                : []
            ),
            email: campos.email.value.trim(),
            empreendimento: campos.empreendimento.value.trim(),
            instagram: campos.instagram.value.trim(),
            nome: campos.nome.value.trim(),
            status: "ativo",
            tecnicas: lerTecnicas(),
            whatsapp: campos.whatsapp.value.trim()
        }).then(function () {
            formulario.reset();
        });
    });
}

// ===== Aba Trabalhos Pendentes =====

/**
 * Linha da tabela de trabalhos pendentes.
 * @param {object} trabalho com artesaoNome (comNomeDoArtesao)
 * @returns {string}
 */
function criarLinhaPendente(trabalho) {
    const titulo = escaparHtml(trabalho.titulo);
    return (
        "<tr>"
        + "<td data-rotulo=\"Trabalho\"><span class=\"tabela__principal\">"
        + `<img class="tabela__miniatura" src="${trabalho.imagens[0]}"`
        + ` alt="" width="64" height="44" loading="lazy">${titulo}</span></td>`
        + "<td data-rotulo=\"Artesão\">"
        + escaparHtml(trabalho.artesaoNome) + "</td>"
        + "<td data-rotulo=\"Categoria / Técnica\">"
        + criarChips([trabalho.tecnica, trabalho.categoria]) + "</td>"
        + "<td data-rotulo=\"Enviado em\"><span class=\"liceu-data\">"
        + icone("lucide:calendar") + formatarData(trabalho.enviadoEm)
        + "</span></td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(trabalho.status)
        + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + "<button type=\"button\" class=\"btn btn--secundario btn--pequeno\""
        + ` data-acao="analisar" data-id="${escaparHtml(trabalho.id)}"`
        + ` aria-label="Analisar ${titulo}">`
        + icone("lucide:external-link") + "Analisar</button></div></td></tr>"
    );
}

/**
 * Aba Trabalhos Pendentes: resumo e tabela de análise.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function iniciarLiceuPendentes(raiz) {
    const dados = await Promise.all([
        carregarTrabalhos(),
        carregarCategorias()
    ]);
    const pendentes = await comNomeDoArtesao(filtrarPendentes(dados[0]));
    const contagem = contarPorStatus(pendentes);
    const resumo = [
        {
            icone: "lucide:hourglass",
            numero: contagem["em-analise"] || 0,
            rotulo: "Aguardando análise"
        },
        {
            icone: "lucide:refresh-cw",
            numero: contagem.reenviado || 0,
            rotulo: "Reenviado"
        },
        {
            icone: "lucide:circle-check",
            // A IMPLEMENTAR: contar os trabalhos analisados no dia.
            numero: 2,
            rotulo: "Analisados hoje"
        }
    ];

    raiz.querySelector("[data-resumo]").innerHTML = resumo.map(
        criarCardEstatistica
    ).join("");
    preencherFiltroCategorias(
        raiz.querySelector("[data-filtro]"),
        dados[1]
    );
    ligarListagem(raiz, {
        criarLinha: criarLinhaPendente,
        filtros: {
            categoria: function (trabalho, valor) {
                return (
                    trabalho.categoria === valor
                    || trabalho.tecnica === valor
                );
            }
        },
        itens: pendentes,
        ordemPadrao: "antigos",
        ordens: {
            antigos: function (a, b) {
                return new Date(a.enviadoEm) - new Date(b.enviadoEm);
            },
            recentes: function (a, b) {
                return new Date(b.enviadoEm) - new Date(a.enviadoEm);
            }
        },
        plural: "trabalhos",
        textos: function (trabalho) {
            return trabalho.titulo + " " + trabalho.artesaoNome;
        }
    });
    ligarAcoes(raiz.querySelector("[data-corpo]"), {
        analisar: analisarTrabalho
    });
}

/**
 * Aba Publicações: tabela de publicações aprovadas.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarLiceuPublicacoes(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

/**
 * Aba Configurações: dados do Liceu e preferências.
 * @param {HTMLElement} ignore o <main id="conteudo"> com a parcial
 */
function iniciarLiceuConfiguracoes(ignore) {
    // A IMPLEMENTAR: na branch da página.
    return;
}

export {
    iniciarLiceuArtesaos,
    iniciarLiceuCadastro,
    iniciarLiceuConfiguracoes,
    iniciarLiceuInicio,
    iniciarLiceuPendentes,
    iniciarLiceuPublicacoes
};
