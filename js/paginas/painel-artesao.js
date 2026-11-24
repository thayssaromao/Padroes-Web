/*jslint browser */
/**
 * paginas/painel-artesao.js — abas da Área do Artesão (#/painel-artesao/...).
 * Guia: docs/DESIGN.md.
 */

import {
    criarCardEstatistica,
    criarCardProduto,
    criarChips,
    criarDialogo,
    criarPaginacao,
    criarStatus,
    escaparHtml,
    icone,
    mostrarAviso,
    prepararAcoes,
    prepararChips,
    prepararMultisselecao
} from "../componentes.js";
import {
    buscarArtesao,
    carregarCategorias,
    contarPorStatus,
    excluirTrabalho,
    formatarData,
    obterSessao,
    salvarArtesao,
    salvarTrabalho,
    sessaoDemonstracao,
    trabalhosDoArtesao
} from "../dados.js";

const ROTA_TRABALHOS = "#/painel-artesao/meus-trabalhos";

/** Conteúdo variável sobre a anatomia compartilhada do design system. */
function dialogo(titulo, corpo, acoes = "") {
    return criarDialogo(titulo, corpo, acoes);
}

function confirmar(titulo, mensagem, texto = "Confirmar") {
    return new Promise(function (resolver) {
        const modal = dialogo(
            titulo,
            "<p>" + escaparHtml(mensagem) + "</p>",
            "<button type=\"button\" class=\"btn btn--secundario\""
            + " data-fechar-modal>Cancelar</button>"
            + "<button type=\"button\" class=\"btn btn--primario\""
            + " data-confirmar>" + escaparHtml(texto) + "</button>"
        );
        modal.classList.add("modal--pequeno");
        modal.classList.remove("modal--medio");
        if (texto === "Excluir" || texto === "Descartar") {
            const botao = modal.querySelector("[data-confirmar]");
            botao.classList.replace("btn--primario", "btn--perigo");
        }
        modal.addEventListener("close", function () {
            resolver(modal.returnValue === "confirmado");
        });
        modal.querySelector("[data-confirmar]").addEventListener(
            "click",
            function () {
                modal.close("confirmado");
            }
        );
    });
}

/** Reduz fotos antes de persistir no armazenamento limitado do navegador. */
function lerImagem(arquivo) {
    return new Promise(function (resolver, rejeitar) {
        if (!TIPOS_IMAGEM.includes(arquivo.type)
                || arquivo.size > MAX_BYTES) {
            rejeitar(new Error("Escolha uma imagem JPG ou PNG de até 10 MB."));
            return;
        }
        const leitor = new FileReader();
        leitor.onerror = function () {
            rejeitar(new Error("Não foi possível ler a imagem."));
        };
        leitor.onload = function () {
            const imagem = new Image();
            imagem.onerror = function () {
                rejeitar(new Error("O arquivo não contém uma imagem válida."));
            };
            imagem.onload = function () {
                const escala = Math.min(1, 1000 / Math.max(
                    imagem.naturalWidth,
                    imagem.naturalHeight
                ));
                const tela = document.createElement("canvas");
                tela.width = Math.max(
                    1, Math.round(imagem.naturalWidth * escala)
                );
                tela.height = Math.max(
                    1, Math.round(imagem.naturalHeight * escala)
                );
                const contexto = tela.getContext("2d");
                contexto.fillStyle = "white";
                contexto.fillRect(0, 0, tela.width, tela.height);
                contexto.drawImage(imagem, 0, 0, tela.width, tela.height);
                resolver(tela.toDataURL("image/jpeg", 0.75));
            };
            imagem.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}

function parametros() {
    return new URLSearchParams(window.location.hash.split("?")[1] || "");
}

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
 * Minúsculas e sem acentos, para comparar textos na busca.
 * @param {string} texto
 * @returns {string}
 */
function semAcento(texto) {
    return texto.normalize("NFD").replace(
        /[\u0300-\u036f]/g,
        ""
    ).toLowerCase();
}

/**
 * Filtra trabalhos por status, busca no texto e (opcional) categoria ou
 * técnica. "em-analise" inclui os reenviados.
 * @param {Array<object>} trabalhos
 * @param {{busca: string, categoria?: string, status: string}} filtros
 * @returns {Array<object>}
 */
function filtrarTrabalhos(trabalhos, filtros) {
    const termo = semAcento(filtros.busca.trim());
    return trabalhos.filter(function (trabalho) {
        const texto = semAcento([
            trabalho.titulo,
            trabalho.categoria,
            trabalho.tecnica
        ].join(" "));
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
    const demonstracao = await sessaoDemonstracao("painel-artesao");
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
 * Trabalhos do artesão da sessão, do mais recente para o mais antigo.
 * @param {{artesaoId: string}} sessao
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDaSessao(sessao) {
    const trabalhos = await trabalhosDoArtesao(sessao.artesaoId);
    return trabalhos.slice().sort(function (a, b) {
        return new Date(b.atualizadoEm) - new Date(a.atualizadoEm);
    });
}

/**
 * Trabalhos do artesão logado, do mais recente para o mais antigo.
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDoLogado() {
    const {sessao} = await artesaoLogado();
    return trabalhosDaSessao(sessao);
}

/**
 * Aba Início: resumo e últimos trabalhos.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarInicio(raiz) {
    const marco = raiz.firstElementChild;
    const {sessao} = await artesaoLogado();
    const trabalhos = await trabalhosDaSessao(sessao);
    if (!marco.isConnected) {
        return;
    }
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
        [
            "lucide:circle-x",
            soma("rejeitado", "rascunho", "oculto"),
            "Não publicado"
        ]
    ].map(function ([icone, numero, rotulo]) {
        return criarCardEstatistica({icone, numero, rotulo});
    }).join("");
    raiz.querySelector("[data-ultimos]").innerHTML = trabalhos.slice(
        0,
        4
    ).map(function (trabalho) {
        return criarCardProduto(trabalho, {
            favorito: false,
            href: "#/painel-artesao/novo-trabalho?id="
                + encodeURIComponent(trabalho.id),
            status: true
        });
    }).join("") || (
        "<p class=\"artesao-vazio\">Você ainda não cadastrou trabalhos.</p>"
    );
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

/** Valores de um select múltiplo apresentado pelo componente compartilhado. */
function ligarSelecaoMultipla(seletor, aoMudar) {
    seletor.addEventListener("change", aoMudar);
    return {
        definir: function (valores) {
            Array.from(seletor.options).forEach(function (opcao) {
                opcao.selected = valores.includes(opcao.value);
            });
            seletor.dispatchEvent(new Event("change", {bubbles: true}));
        },
        obter: function () {
            return Array.from(seletor.selectedOptions, function (opcao) {
                return opcao.value;
            });
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
    let atual = imagem.src;
    let pendente = Promise.resolve();
    let versao = 0;

    botao.addEventListener("click", function () {
        entrada.click();
    });
    entrada.addEventListener("change", function () {
        const arquivo = entrada.files[0];
        versao += 1;
        const minha = versao;
        if (arquivo) {
            pendente = lerImagem(arquivo).then(function (url) {
                if (minha !== versao) {
                    return;
                }
                atual = url;
                imagem.src = url;
                aoMudar(url);
            }).catch(function (erro) {
                mostrarAviso(erro.message);
            });
        }
    });

    return {
        obter: async function () {
            await pendente;
            return atual;
        },
        restaurar: function (origem) {
            versao += 1;
            atual = origem || "assets/img/avatar-padrao.jpg";
            entrada.value = "";
            imagem.src = atual;
            aoMudar(atual);
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
    const categorias = Array.from(
        raiz.querySelector("#perfil-categoria").selectedOptions,
        function (opcao) { return opcao.value; }
    );
    raiz.querySelector("[data-previa-categorias]").innerHTML = criarChips(
        categorias.length ? categorias : ["Categoria"]
    );
    texto("[data-previa-tecnicas]", "Técnicas: " + tecnicas.join(", "));
    texto(
        "[data-previa-bio]",
        valor("#perfil-bio")
        || "Um breve texto sobre você, sua história e sua relação com o "
        + "artesanato."
    );
    prepararChips(raiz.querySelector(".previa-perfil"));
}

/**
 * Aba Meu perfil: formulário e pré-visualização.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarPerfil(raiz) {
    const marco = raiz.firstElementChild;
    let {artesao} = await artesaoLogado();
    const dadosCategorias = await carregarCategorias();
    if (!marco.isConnected) {
        return;
    }
    const formulario = raiz.querySelector("[data-form-perfil]");
    const previaFoto = raiz.querySelector("[data-previa-foto]");
    const seletorCategoria = raiz.querySelector("#perfil-categoria");
    let seletorTecnicas;
    let seletorCategorias;
    let salvo;

    function aoMudar() {
        atualizarPrevia(raiz, seletorTecnicas.obter());
    }

    preencherOpcoes(seletorCategoria, dadosCategorias.categorias);
    preencherOpcoes(
        raiz.querySelector("#perfil-tecnica"),
        dadosCategorias.tecnicas
    );
    seletorTecnicas = ligarSelecaoMultipla(
        raiz.querySelector("#perfil-tecnica"), aoMudar
    );
    seletorCategorias = ligarSelecaoMultipla(seletorCategoria, aoMudar);
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
            raiz.querySelector(seletor).setCustomValidity("");
        });
        seletorCategorias.definir(artesao.categorias);
        foto.restaurar(artesao.foto);
        seletorTecnicas.definir(artesao.tecnicas);
    }

    function estadoPerfil() {
        return JSON.stringify({
            campos: Object.fromEntries(new FormData(formulario)),
            categorias: seletorCategorias.obter(),
            foto: previaFoto.src,
            tecnicas: seletorTecnicas.obter()
        });
    }
    const feedback = formulario.querySelector("[data-perfil-feedback]");
    const campoNome = formulario.elements.nome;
    const campoEmail = formulario.elements.email;
    function validarPessoais() {
        campoNome.setCustomValidity(campoNome.value.trim()
            ? "" : "Informe o nome completo.");
        const email = campoEmail.value.trim();
        campoEmail.setCustomValidity(!email ? "Informe o e-mail."
            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ? "" : "Informe um e-mail válido.");
        [campoNome, campoEmail].forEach(function (campo) {
            if (campo.validity.valid) {
                campo.removeAttribute("aria-invalid");
            }
        });
    }
    [campoNome, campoEmail].forEach(function (campo) {
        campo.addEventListener("input", function () {
            validarPessoais();
            feedback.textContent = "";
        });
    });
    formulario.addEventListener("invalid", function (evento) {
        if ([campoNome, campoEmail].includes(evento.target)) {
            validarPessoais();
            evento.target.setAttribute("aria-invalid", "true");
            feedback.textContent = evento.target.validationMessage;
        }
    }, true);
    const campoWhatsapp = formulario.elements.whatsapp;
    campoWhatsapp.addEventListener("input", function () {
        const numero = campoWhatsapp.value.replace(/\D/g, "");
        campoWhatsapp.setCustomValidity(!campoWhatsapp.value
            || (numero.length >= 10 && numero.length <= 13)
            ? "" : "Informe um WhatsApp com DDD.");
    });
    preencher();
    prepararMultisselecao(raiz);
    salvo = estadoPerfil();
    ["#perfil-nome", "#perfil-categoria", "#perfil-bio"].forEach(
        function (seletor) {
            raiz.querySelector(seletor).addEventListener("input", aoMudar);
        }
    );
    raiz.querySelector("[data-cancelar]").addEventListener(
        "click",
        async function () {
            if (estadoPerfil() !== salvo && !await confirmar(
                "Descartar alterações?",
                "As alterações não salvas do perfil serão descartadas.",
                "Descartar"
            )) {
                return;
            }
            preencher();
            feedback.textContent = "";
            [campoNome, campoEmail].forEach(function (campo) {
                campo.removeAttribute("aria-invalid");
            });
            salvo = estadoPerfil();
            mostrarAviso("Alterações descartadas.");
        }
    );
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const botao = formulario.querySelector("[type=\"submit\"]");
        validarPessoais();
        if (!formulario.reportValidity() || botao.disabled) {
            return;
        }
        feedback.textContent = "";
        botao.disabled = true;
        try {
            const dados = Object.fromEntries(new FormData(formulario));
            const imagem = await foto.obter();
            if (!marco.isConnected) {
                return;
            }
            artesao = await salvarArtesao(Object.assign({}, artesao, dados, {
                categorias: seletorCategorias.obter(),
                foto: imagem,
                tecnicas: seletorTecnicas.obter()
            }));
            if (marco.isConnected) {
                document.querySelector("[data-usuario-nome]").textContent
                    = artesao.nome;
                const usuarioFoto = document.querySelector(
                    "[data-usuario-foto]"
                );
                usuarioFoto.src = artesao.foto;
            }
            salvo = estadoPerfil();
            mostrarAviso("Alterações do perfil salvas.");
        } catch (erro) {
            feedback.textContent = erro.message || "Não foi possível salvar o perfil.";
        } finally {
            botao.disabled = false;
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
    if (!trabalho.titulo.trim() || !trabalho.categoria || !trabalho.tecnica) {
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
        + icone(nomeIcone) + texto
        + "</button>"
    );
}

/**
 * Faixa de status e acesso ao motivo, quando houver rejeição.
 * @param {object} trabalho
 * @returns {string}
 */
function criarEstadoTrabalho(trabalho) {
    return "<div class=\"artesao-estado\">"
        + criarStatus(trabalho.status)
        + (trabalho.status === "rejeitado"
            ? `<button type="button" class="btn btn--icone" data-acao="motivo"`
                + ` data-id="${escaparHtml(trabalho.id)}"`
                + ` aria-label="Ver motivo" title="Ver motivo">`
                + icone("lucide:info") + "</button>"
            : "") + "</div>";
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
        + (trabalho.status === "rascunho"
            ? `<button type="button" class="btn btn--suave btn--pequeno"`
                + ` data-acao="enviar" data-id="${escaparHtml(trabalho.id)}"`
                + ` aria-label="Enviar para análise" title="Enviar para análise">`
                + icone("lucide:send") + "Enviar</button>"
            : "")
        + (["em-analise", "reenviado"].includes(trabalho.status)
            ? "<span class=\"texto-suave\">Edição indisponível</span>"
            : trabalho.status === "rascunho"
                ? `<button type="button" class="btn btn--icone"`
                    + ` data-acao="editar" data-id="${escaparHtml(trabalho.id)}"`
                    + ` aria-label="Editar" title="Editar">`
                    + icone("lucide:pencil") + "</button>"
                : criarBotaoAcao("editar", trabalho.id, "lucide:pencil",
                    "Editar", "btn--suave btn--pequeno"))
        + "<button type=\"button\" class=\"btn btn--icone\""
        + ` data-acao="menu" data-id="${escaparHtml(trabalho.id)}"`
        + ` aria-label="Mais ações para ${titulo}">`
        + icone("lucide:ellipsis") + "</button></div>"
    );
    return criarCardProduto(trabalho, {
        acoes,
        favorito: false,
        href: "#/painel-artesao/novo-trabalho?id="
            + encodeURIComponent(trabalho.id),
        status: false
    });
}

/**
 * Aba Meus trabalhos: grade de trabalhos com filtros.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarTrabalhos(raiz) {
    const marco = raiz.firstElementChild;
    let todos = await trabalhosDoLogado();
    const dadosCategorias = await carregarCategorias();
    if (!marco.isConnected) {
        return;
    }
    const grade = raiz.querySelector("[data-grade]");
    const seletorCategoria = raiz.querySelector("[data-filtro-categoria]");
    const estado = {busca: "", ordem: "recentes", pagina: 1};
    raiz.querySelector("[data-filtro-status]").value = (
        parametros().get("status") || ""
    );

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
        prepararAcoes(grade);
        prepararAcoes(raiz.querySelector("[data-paginacao]"));
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
    async function atualizar() {
        todos = await trabalhosDoLogado();
        if (marco.isConnected) {
            desenhar();
        }
    }

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
            acoes[botao.dataset.acao](trabalho, atualizar);
        }
    });

    desenhar();
}

// ===== Novo trabalho =====

const MAX_IMAGENS = 8;
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_IMAGEM = ["image/jpeg", "image/png"];

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

// ===== Status das publicações =====

/**
 * Linha da tabela de status, com as ações conforme o status.
 * @param {object} trabalho
 * @returns {string}
 */
function criarLinhaStatus(trabalho) {
    const id = escaparHtml(trabalho.id);
    const botao = function (acao, nomeIcone, texto) {
        return `<button type="button" class="btn btn--icone"`
            + ` data-acao="${acao}" data-id="${id}"`
            + ` aria-label="${texto}" title="${texto}">`
            + icone(nomeIcone) + "</button>";
    };
    const acoes = {
        "em-analise": "<button type=\"button\" class=\"btn btn--icone\""
            + " disabled aria-label=\"Aguardando análise\""
            + " title=\"Aguardando análise\">"
            + icone("lucide:hourglass") + "</button>",
        publicado: `<a class="btn btn--icone" href="#/produto?id=`
            + encodeURIComponent(trabalho.id)
            + `" aria-label="Ver no portal" title="Ver no portal">`
            + icone("lucide:external-link") + "</a>",
        rascunho: botao("editar", "lucide:pencil", "Continuar edição"),
        rejeitado: botao("motivo", "lucide:info", "Ver motivo")
            + botao("editar", "lucide:pencil", "Editar e reenviar")
    };
    acoes.reenviado = acoes["em-analise"];
    acoes.oculto = botao(
        "editar", "lucide:pencil", "Editar e enviar para análise"
    );
    return (
        "<tr>"
        + "<td data-rotulo=\"Trabalho\"><div class=\"tabela__principal\">"
        + "<img class=\"tabela__miniatura\" src=\""
        + escaparHtml(
            trabalho.imagens[0] || "assets/img/avatar-padrao.jpg"
        ) + "\""
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
    const marco = raiz.firstElementChild;
    const todos = await trabalhosDoLogado();
    if (!marco.isConnected) {
        return;
    }
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
        prepararAcoes(corpo);
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
        const marco = raiz.firstElementChild;
        try {
            await montar(raiz);
        } catch (erro) {
            if (!marco || !marco.isConnected) {
                return;
            }
            console.error(erro);
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
