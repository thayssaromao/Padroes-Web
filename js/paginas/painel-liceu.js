/*jslint browser */
/**
 * paginas/painel-liceu.js — abas da Área do Liceu (#/painel-liceu/...).
 * Guia: docs/DESIGN.md.
 */

import {
    conteudoAcao,
    criarCampoSenha,
    criarCardEstatistica,
    criarChips,
    criarDetalhesTrabalho,
    criarDialogo,
    criarPaginacao,
    criarStatus,
    escaparHtml,
    icone,
    mostrarAviso,
    prepararAcoes,
    prepararCamposSenha
} from "../componentes.js";
import {
    atualizarStatusTrabalho,
    buscarArtesao,
    carregarArtesaos,
    carregarCategorias,
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus,
    excluirTrabalho,
    formatarData,
    salvarArtesao,
    salvarTrabalho
} from "../dados.js";

const MAXIMO_CARDS_INICIO = 4;
const POR_PAGINA = 5;

// ===== Ações dos painéis =====

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

function selecionarCampo(nome, rotulo, opcoes, valores, multiplo = false) {
    return (
        "<div class=\"campo\"><label class=\"campo__rotulo\""
        + ` for="liceu-${nome}">${escaparHtml(rotulo)}</label>`
        + `<select class="campo__entrada" id="liceu-${nome}"`
        + ` name="${nome}"${multiplo ? " multiple" : " required"}>`
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
        + "<div class=\"modal__acoes\">"
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-rejeitar>Rejeitar</button>"
        + "<button type=\"submit\" class=\"btn btn--primario\""
        + " data-aprovar formnovalidate>Aprovar</button></div></form>", "grande");
    const formulario = modal.querySelector("form");
    const rejeitar = modal.querySelector("[data-rejeitar]");
    const aprovar = modal.querySelector("[data-aprovar]");
    const motivo = formulario.elements.motivo;
    let ocupado = false;

    async function decidir(status) {
        if (ocupado) {
            return;
        }
        ocupado = true;
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
            aprovar.disabled = false;
            rejeitar.disabled = false;
        }
    }

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        decidir("publicado");
    });
    rejeitar.addEventListener("click", function () {
        const area = modal.querySelector("[data-motivo]");
        if (area.hidden) {
            area.hidden = false;
            motivo.focus();
            rejeitar.innerHTML = conteudoAcao("Confirmar rejeição");
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

async function verPerfilArtesao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const artesao = await buscarArtesao(id);
    if (!artesao || !marco.isConnected) {
        return;
    }
    dialogo(artesao.nome,
        `<img class="avatar" src="${escaparHtml(artesao.foto)}"`
        + " alt=\"\" width=\"80\" height=\"80\"><p>"
        + escaparHtml(artesao.empreendimento) + "</p><p>"
        + escaparHtml(artesao.cidade) + "</p>"
        + criarChips(artesao.categorias.concat(artesao.tecnicas))
        + "<p>" + escaparHtml(artesao.bio || "Perfil em elaboração.")
        + "</p><h3>Contato</h3><p>"
        + escaparHtml(artesao.email) + "</p><p>"
        + escaparHtml(artesao.whatsapp || "WhatsApp não informado")
        + "</p><p>" + escaparHtml(artesao.instagram || "") + "</p>",
        "grande");
}

async function editarArtesao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const dados = await Promise.all([buscarArtesao(id), carregarCategorias()]);
    if (!dados[0] || !marco.isConnected) {
        return;
    }
    const artesao = dados[0];
    const modal = dialogo("Editar artesão", "<form>"
        + campo("nome", "Nome completo *", artesao.nome, "text", true)
        + campo("email", "E-mail *", artesao.email, "email", true)
        + campo("empreendimento", "Empreendimento", artesao.empreendimento)
        + campo("cidade", "Cidade", artesao.cidade)
        + selecionarCampo("categorias", "Categorias (selecione uma ou mais)",
            dados[1].categorias, artesao.categorias, true)
        + selecionarCampo("tecnicas", "Técnicas (selecione uma ou mais)",
            dados[1].tecnicas, artesao.tecnicas, true)
        + areaTexto("bio", "História e apresentação", artesao.bio)
        + campo("whatsapp", "WhatsApp", artesao.whatsapp, "tel")
        + campo("instagram", "Instagram / Rede social", artesao.instagram)
        + acoesFormulario() + "</form>");
    ligarSalvar(modal, async function (campos) {
        if (!campos.nome.value.trim()) {
            throw new Error("Informe o nome do artesão.");
        }
        await salvarArtesao(Object.assign({}, artesao, {
            bio: campos.bio.value.trim(),
            categorias: Array.from(campos.categorias.selectedOptions,
                function (opcao) { return opcao.value; }),
            cidade: campos.cidade.value.trim(),
            email: campos.email.value.trim(),
            empreendimento: campos.empreendimento.value.trim(),
            instagram: campos.instagram.value.trim(),
            nome: campos.nome.value.trim(),
            tecnicas: Array.from(campos.tecnicas.selectedOptions,
                function (opcao) { return opcao.value; }),
            whatsapp: campos.whatsapp.value.trim()
        }));
    }, "Cadastro do artesão atualizado.");
}

async function abrirMenuArtesao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const artesao = await buscarArtesao(id);
    if (!artesao || !marco.isConnected) {
        return;
    }
    const ativo = artesao.status === "ativo";
    const modal = dialogo("Acesso de " + artesao.nome,
        "<p>" + criarStatus(artesao.status) + "</p><p>"
        + "Desativar o cadastro retira o perfil e os trabalhos do portal "
        + "e impede novos acessos enquanto estiver inativo.</p>"
        + "<div class=\"modal__acoes\"><button type=\"button\""
        + " class=\"btn btn--secundario\" data-alterar-status>"
        + (ativo ? "Desativar artesão" : "Ativar artesão") + "</button>"
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-senha>Redefinir senha</button></div>"
        + "<p role=\"alert\" data-erro></p>");
    modal.querySelector("[data-alterar-status]").addEventListener(
        "click", function () {
            modal.close();
            const confirmar = dialogo(ativo ? "Desativar artesão?"
                : "Ativar artesão?", "<form><p>"
                + escaparHtml(artesao.nome) + "</p>"
                + acoesFormulario(ativo ? "Desativar" : "Ativar")
                + "</form>", "pequeno");
            ligarSalvar(confirmar, async function () {
                await salvarArtesao(Object.assign({}, artesao, {
                    status: ativo ? "inativo" : "ativo"
                }));
            }, "Status do artesão atualizado.");
        }
    );
    modal.querySelector("[data-senha]").addEventListener("click", function () {
        modal.close();
        const senha = dialogo("Redefinir senha provisória", "<form>"
            + campo("senha", "Nova senha provisória *", "", "password", true)
            + campo("confirmar", "Confirmar senha *", "", "password", true)
            + acoesFormulario("Redefinir senha") + "</form>", "pequeno");
        senha.querySelector("[name=senha]").minLength = 6;
        ligarSalvar(senha, async function (campos) {
            if (campos.senha.value !== campos.confirmar.value) {
                throw new Error("As senhas não conferem.");
            }
            await salvarArtesao(Object.assign({}, artesao, {
                senha: campos.senha.value
            }));
        }, "Senha provisória redefinida neste navegador.");
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
        + selecionarCampo("categoria", "Categoria *", dados[1].categorias,
            [trabalho.categoria])
        + selecionarCampo("tecnica", "Técnica *", dados[1].tecnicas,
            [trabalho.tecnica])
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
            categoria: campos.categoria.value,
            descricao: campos.descricao.value.trim(),
            dimensoes: campos.dimensoes.value.trim(),
            materiais: campos.materiais.value.trim(),
            preco: campos.preco.value ? Number(campos.preco.value) : null,
            tecnica: campos.tecnica.value,
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
            Promise.resolve(acao(botao.dataset.id)).catch(function (erro) {
                mostrarAviso(erro.message || "Não foi possível concluir a ação.");
            });
        }
    });
}

/**
 * Caminho (já escapado) da primeira imagem do trabalho, com reserva.
 * @param {object} trabalho
 * @returns {string}
 */
function imagemDe(trabalho) {
    return escaparHtml(
        (trabalho.imagens && trabalho.imagens[0])
        || "assets/img/avatar-padrao.jpg"
    );
}

/**
 * Troca o conteúdo dinâmico da aba por uma mensagem de erro.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 * @param {Element} marco elemento da parcial capturado antes da carga
 */
function mostrarErroDeCarga(raiz, marco) {
    if (!marco || !marco.isConnected) {
        return;
    }
    const cabecalho = raiz.querySelector(".painel-cabecalho");
    if (!cabecalho || !raiz.contains(cabecalho)) {
        return;
    }
    Array.from(raiz.children).forEach(function (filho) {
        if (filho !== cabecalho) {
            filho.remove();
        }
    });
    cabecalho.insertAdjacentHTML(
        "afterend",
        "<p class=\"liceu-erro\" role=\"alert\">"
        + "Não foi possível carregar os dados.</p>"
    );
}

/**
 * Envolve o início de uma aba para tratar falhas ao carregar dados.
 * @param {function(HTMLElement)} iniciar função da aba
 * @returns {function(HTMLElement): Promise<void>}
 */
function comTratamentoDeErro(iniciar) {
    return async function (raiz) {
        const marco = raiz.firstElementChild;
        try {
            await iniciar(raiz);
        } catch (erro) {
            if (marco && marco.isConnected) {
                console.error(erro);
            }
            mostrarErroDeCarga(raiz, marco);
        }
    };
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
    const formulario = raiz.querySelector("[data-filtros]");
    const campos = Array.from(raiz.querySelectorAll("[data-filtro]"));
    const linhas = new Map();
    const fragmento = document.createDocumentFragment();
    let pagina = 1;
    let ordemAtual = [];
    let totalPaginas = 0;

    // Dados locais já carregados: prepare cada linha uma única vez, inclusive
    // seus ícones e imagens, sem reiniciá-los a cada clique na paginação.
    config.itens.forEach(function (item) {
        const auxiliar = document.createElement("tbody");
        auxiliar.innerHTML = config.criarLinha(item);
        const linha = auxiliar.firstElementChild;
        linha.hidden = true;
        linha.querySelectorAll("iconify-icon").forEach(function (elemento) {
            elemento.setAttribute("noobserver", "");
        });
        linha.querySelectorAll("img").forEach(function (imagem) {
            imagem.loading = "eager";
        });
        linhas.set(item, linha);
        fragmento.append(linha);
    });
    corpo.replaceChildren(fragmento);
    prepararAcoes(corpo);

    function atualizarPaginacao(total) {
        if (total !== totalPaginas) {
            paginacao.innerHTML = criarPaginacao(pagina, total);
            paginacao.querySelectorAll("iconify-icon").forEach(function (elemento) {
                elemento.setAttribute("noobserver", "");
            });
            totalPaginas = total;
        }
        paginacao.querySelectorAll(".paginacao__botao").forEach(function (botao) {
            if (!botao.classList.contains("paginacao__botao--seta")) {
                if (Number(botao.dataset.pagina) === pagina) {
                    botao.setAttribute("aria-current", "page");
                } else {
                    botao.removeAttribute("aria-current");
                }
            }
        });
        paginacao.querySelectorAll(".paginacao__botao--seta").forEach(function (botao, indice) {
            botao.dataset.pagina = String(
                indice === 0 ? Math.max(1, pagina - 1) : Math.min(total, pagina + 1)
            );
            botao.disabled = indice === 0 ? pagina === 1 : pagina === total;
        });
    }

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

    function exibir(focar) {
        const lista = selecionar();
        const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        const inicio = (Math.min(pagina, total) - 1) * POR_PAGINA;
        const visiveis = lista.slice(inicio, inicio + POR_PAGINA);
        pagina = Math.min(pagina, total);
        // Só mova as linhas quando a busca/ordenação mudar. A paginação
        // alterna visibilidade, mantendo os elementos e seus SVGs montados.
        if (
            lista.length !== ordemAtual.length
            || lista.some(function (item, indice) {
                return item !== ordemAtual[indice];
            })
        ) {
            lista.forEach(function (item) {
                corpo.append(linhas.get(item));
            });
            ordemAtual = lista;
        }
        const selecionados = new Set(visiveis);
        linhas.forEach(function (linha, item) {
            linha.hidden = !selecionados.has(item);
        });
        vazio.hidden = lista.length > 0;
        contagem.textContent = (
            lista.length
            ? (
                `Mostrando ${inicio + 1}–${inicio + visiveis.length}`
                + ` de ${lista.length} ${config.plural}`
            )
            : "Nenhum resultado"
        );
        paginacao.hidden = lista.length === 0;
        atualizarPaginacao(total);
        prepararAcoes(paginacao);
        if (focar) {
            paginacao.querySelector("[aria-current]").focus({
                preventScroll: true
            });
        }
    }

    function recomecar() {
        pagina = 1;
        exibir();
    }

    busca.addEventListener("input", recomecar);
    if (formulario) {
        formulario.addEventListener("submit", function (evento) {
            evento.preventDefault();
            recomecar();
        });
    }
    campos.forEach(function (campo) {
        campo.addEventListener("change", recomecar);
    });
    if (ordem) {
        ordem.addEventListener("change", recomecar);
    }
    paginacao.addEventListener("click", function (evento) {
        const botao = evento.target.closest("[data-pagina]");
        const destino = botao ? Number(botao.dataset.pagina) : pagina;
        if (botao && !botao.disabled && destino !== pagina) {
            pagina = destino;
            exibir(true);
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
        + `<img class="card-trabalho__imagem" src="${imagemDe(trabalho)}"`
        + " alt=\"\" width=\"400\" height=\"160\""
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
async function montarInicio(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([carregarArtesaos(), carregarTrabalhos()]);
    if (!marco.isConnected) {
        return;
    }
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
    if (!marco.isConnected) {
        return;
    }

    raiz.querySelector("[data-resumo]").innerHTML = resumo.map(
        criarCardEstatistica
    ).join("");
    lista.innerHTML = exibidos.length
        ? exibidos.map(criarCardPendente).join("")
        : "<p class=\"liceu-vazio\">Nenhum trabalho aguarda análise.</p>";
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
    const empreendimento = escaparHtml(artesao.empreendimento);
    const email = escaparHtml(artesao.email);
    const whatsapp = escaparHtml(artesao.whatsapp);
    const id = `data-id="${escaparHtml(artesao.id)}"`;
    return (
        "<tr>"
        + "<td data-rotulo=\"Artesão\"><span class=\"tabela__principal\">"
        + `<img class="avatar" src="${escaparHtml(artesao.foto)}" alt=""`
        + " width=\"40\" height=\"40\" loading=\"lazy\">"
        + `<span class="tabela__texto" title="${nome}">${nome}</span>`
        + "</span></td>"
        + `<td data-rotulo="Empreendimento" title="${empreendimento}">`
        + empreendimento + "</td>"
        + "<td data-rotulo=\"Categoria / Técnica\">"
        + criarChips(artesao.tecnicas.concat(artesao.categorias)) + "</td>"
        + "<td data-rotulo=\"Contato\"><span class=\"liceu-contato\">"
        + "<span>" + icone("lucide:mail")
        + `<span class="tabela__texto" title="${email}">${email}</span>`
        + "</span><span>" + icone("mdi:whatsapp")
        + `<span class="tabela__texto" title="${whatsapp}">${whatsapp}</span>`
        + "</span></span></td>"
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
async function montarArtesaos(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([
        carregarArtesaos(),
        carregarCategorias()
    ]);
    if (!marco.isConnected) {
        return;
    }
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
async function montarCadastro(raiz) {
    const marco = raiz.firstElementChild;
    const categorias = await carregarCategorias();
    if (!marco.isConnected) {
        return;
    }
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
    prepararAcoes,
    prepararCamposSenha(formulario);
    senha.addEventListener("input", conferirSenhas);
    confirmar.addEventListener("input", conferirSenhas);
    const erro = document.createElement("p");
    erro.setAttribute("role", "alert");
    formulario.querySelector(".form-acoes").before(erro);
    formulario.elements.whatsapp.addEventListener("input", function () {
        const telefone = formulario.elements.whatsapp;
        const digitos = telefone.value.replace(/\D/g, "");
        telefone.setCustomValidity(telefone.value && (digitos.length < 10
            || digitos.length > 13) ? "Informe um telefone válido com DDD." : "");
    });
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const campos = formulario.elements;
        const botao = formulario.querySelector("[type=submit]");
        const categoria = campos.categoria.value;
        conferirSenhas();
        if (botao.disabled || !formulario.reportValidity()) {
            return;
        }
        if (!campos.nome.value.trim()) {
            erro.textContent = "Informe o nome completo do artesão.";
            campos.nome.focus();
            return;
        }
        botao.disabled = true;
        erro.textContent = "";
        try {
            await salvarArtesao({
                bio: "",
                categorias: categoria ? [categoria] : [],
                cidade: "Curitiba - PR",
                email: campos.email.value.trim(),
                empreendimento: campos.empreendimento.value.trim(),
                foto: "assets/img/avatar-padrao.jpg",
                instagram: campos.instagram.value.trim(),
                nome: campos.nome.value.trim(),
                senha: campos.senha.value,
                status: "ativo",
                tecnicas: lerTecnicas(),
                whatsapp: campos.whatsapp.value.trim()
            });
            mostrarAviso("Artesão cadastrado. O acesso já pode ser usado neste navegador.");
            if (!marco.isConnected) {
                return;
            }
            window.location.hash = "#/painel-liceu/artesaos";
        } catch (falha) {
            erro.textContent = falha.message || "Não foi possível cadastrar o artesão.";
        } finally {
            botao.disabled = false;
        }
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
        + `<img class="tabela__miniatura" src="${imagemDe(trabalho)}"`
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
async function montarPendentes(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([
        carregarTrabalhos(),
        carregarCategorias()
    ]);
    if (!marco.isConnected) {
        return;
    }
    const pendentes = await comNomeDoArtesao(filtrarPendentes(dados[0]));
    if (!marco.isConnected) {
        return;
    }
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
            numero: dados[0].filter(function (trabalho) {
                return trabalho.analisadoEm && new Date(
                    trabalho.analisadoEm
                ).toLocaleDateString("pt-BR") === new Date(
                ).toLocaleDateString("pt-BR");
            }).length,
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

// ===== Aba Publicações =====

/**
 * Botão de ícone de uma linha da tabela de publicações.
 * @param {string} acao nome da ação
 * @param {string} nomeIcone ícone Iconify
 * @param {string} rotulo texto de acessibilidade, ex.: "Ver"
 * @param {object} trabalho
 * @returns {string}
 */
function criarBotaoPublicacao(acao, nomeIcone, rotulo, trabalho) {
    return (
        "<button type=\"button\" class=\"btn btn--icone\""
        + ` data-acao="${acao}" data-id="${escaparHtml(trabalho.id)}"`
        + ` aria-label="${rotulo} ${escaparHtml(trabalho.titulo)}">`
        + icone(nomeIcone) + "</button>"
    );
}

/**
 * Linha da tabela de publicações.
 * @param {object} trabalho com artesaoNome (comNomeDoArtesao)
 * @returns {string}
 */
function criarLinhaPublicacao(trabalho) {
    return (
        "<tr>"
        + "<td data-rotulo=\"Imagem\">"
        + `<img class="tabela__miniatura" src="${imagemDe(trabalho)}"`
        + " alt=\"\" width=\"64\" height=\"44\" loading=\"lazy\"></td>"
        + "<td data-rotulo=\"Publicação / Produto\"><strong>"
        + escaparHtml(trabalho.titulo) + "</strong></td>"
        + "<td data-rotulo=\"Artesão\">"
        + escaparHtml(trabalho.artesaoNome) + "</td>"
        + "<td data-rotulo=\"Categoria\">"
        + escaparHtml(trabalho.categoria) + "</td>"
        + "<td data-rotulo=\"Data de publicação\">"
        + formatarData(trabalho.publicadoEm, false) + "</td>"
        + "<td data-rotulo=\"Status\">" + criarStatus(trabalho.status) + "</td>"
        + "<td data-rotulo=\"Ações\"><div class=\"tabela__acoes\">"
        + criarBotaoPublicacao("ver", "lucide:eye", "Ver", trabalho)
        + criarBotaoPublicacao("editar", "lucide:pencil", "Editar", trabalho)
        + criarBotaoPublicacao(
            "ocultar",
            trabalho.status === "oculto" ? "lucide:eye" : "lucide:eye-off",
            trabalho.status === "oculto" ? "Republicar" : "Ocultar",
            trabalho
        )
        + criarBotaoPublicacao(
            "excluir",
            "lucide:trash-2",
            "Excluir",
            trabalho
        )
        + "</div></td></tr>"
    );
}

/**
 * Aba Publicações: tabela de publicações aprovadas.
 * @param {HTMLElement} raiz o <main id="conteudo"> com a parcial
 */
async function montarPublicacoes(raiz) {
    const marco = raiz.firstElementChild;
    const dados = await Promise.all([
        carregarTrabalhos(),
        carregarCategorias(),
        carregarArtesaos()
    ]);
    if (!marco.isConnected) {
        return;
    }
    const publicados = await comNomeDoArtesao(
        dados[0].filter(function (trabalho) {
            return trabalho.status === "publicado" || trabalho.status === "oculto";
        })
    );
    if (!marco.isConnected) {
        return;
    }

    raiz.querySelector("[data-filtro=\"categoria\"]").insertAdjacentHTML(
        "beforeend",
        criarOpcoes(dados[1].categorias)
    );
    raiz.querySelector("[data-filtro=\"artesao\"]").insertAdjacentHTML(
        "beforeend",
        dados[2].map(function (artesao) {
            return (
                `<option value="${escaparHtml(artesao.id)}">`
                + escaparHtml(artesao.nome) + "</option>"
            );
        }).join("")
    );
    ligarListagem(raiz, {
        criarLinha: criarLinhaPublicacao,
        filtros: {
            artesao: function (trabalho, valor) {
                return trabalho.artesaoId === valor;
            },
            categoria: function (trabalho, valor) {
                return trabalho.categoria === valor;
            },
            status: function (trabalho, valor) {
                return trabalho.status === valor;
            }
        },
        itens: publicados,
        ordemPadrao: "recentes",
        ordens: {
            recentes: function (a, b) {
                return new Date(b.publicadoEm) - new Date(a.publicadoEm);
            }
        },
        plural: "publicações",
        textos: function (trabalho) {
            return trabalho.titulo + " " + trabalho.artesaoNome;
        }
    });
    ligarAcoes(raiz.querySelector("[data-corpo]"), {
        editar: editarPublicacao,
        excluir: excluirPublicacao,
        ocultar: ocultarPublicacao,
        ver: verPublicacao
    });
    ligarAcoes(raiz.querySelector(".painel-cabecalho"), {
        nova: novaPublicacao
    });
}

// ===== Aba Configurações =====

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
        "<aside class=\"aviso\" id=\"config-mvp\"><p>"
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
        '<section class="lista-taxonomias" aria-labelledby="categorias-lista">'
        + '<h3 id="categorias-lista">Categorias cadastradas</h3>'
        + criarChips(categorias.categorias) + '</section>'
        + '<section class="lista-taxonomias" aria-labelledby="tecnicas-lista">'
        + '<h3 id="tecnicas-lista">Técnicas cadastradas</h3>'
        + criarChips(categorias.tecnicas) + '</section>');
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
    });
}

const iniciarLiceuArtesaos = comTratamentoDeErro(montarArtesaos);
const iniciarLiceuCadastro = comTratamentoDeErro(montarCadastro);
const iniciarLiceuConfiguracoes = comTratamentoDeErro(montarConfiguracoes);
const iniciarLiceuInicio = comTratamentoDeErro(montarInicio);
const iniciarLiceuPendentes = comTratamentoDeErro(montarPendentes);
const iniciarLiceuPublicacoes = comTratamentoDeErro(montarPublicacoes);

export {
    iniciarLiceuArtesaos,
    iniciarLiceuCadastro,
    iniciarLiceuConfiguracoes,
    iniciarLiceuInicio,
    iniciarLiceuPendentes,
    iniciarLiceuPublicacoes
};
