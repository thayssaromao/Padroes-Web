/*jslint browser */
/**
 * dados.js — acesso aos dados simulados (pasta data) e à sessão.
 *
 * Sem back-end: os JSON são a "base de dados" inicial e o localStorage
 * guarda a sessão e as alterações compartilhadas pelos painéis.
 * Guia: docs/DESIGN.md §10 e docs/ESPECIFICACOES.md (Fonte de Dados).
 */

const CHAVE_SESSAO = "liceu:sessao";
const CHAVE_BASE = "liceu:base:v1";

function lerBase() {
    const texto = localStorage.getItem(CHAVE_BASE);
    if (!texto) {
        return {artesaos: [], credenciais: {}, trabalhos: []};
    }
    const base = JSON.parse(texto);
    if (!Array.isArray(base.artesaos) || !Array.isArray(base.trabalhos)
            || !base.credenciais) {
        throw new Error("Dados locais inválidos. Não foi possível ler a base.");
    }
    return base;
}

function gravarBase(base) {
    try {
        localStorage.setItem(CHAVE_BASE, JSON.stringify(base));
    } catch (ignore) {
        throw new Error("Não foi possível salvar. Verifique o espaço do "
            + "navegador ou reduza as imagens e tente novamente.");
    }
}

async function carregarColecao(nome, arquivo) {
    const iniciais = await lerJson(arquivo);
    const alterados = lerBase()[nome];
    const mapa = new Map(iniciais.map(function (item) {
        return [item.id, item];
    }));
    alterados.forEach(function (item) {
        mapa.set(item.id, item);
    });
    return structuredClone(Array.from(mapa.values()).filter(function (item) {
        return !item.excluido;
    }));
}

function exigirSessao(perfil) {
    const sessao = obterSessao();
    if (!sessao || (perfil && sessao.perfil !== perfil)) {
        throw new Error("Entre com uma conta autorizada para esta ação.");
    }
    return sessao;
}

function substituir(lista, registro) {
    return lista.filter(function (item) {
        return item.id !== registro.id;
    }).concat([registro]);
}
const cache = new Map();

const SESSOES_DEMONSTRACAO = Object.freeze({
    "painel-artesao": {
        artesaoId: "ana-martins",
        foto: "assets/img/artesaos/ana-martins.jpg",
        nome: "Ana Martins Mock",
        perfil: "painel-artesao"
    },
    "painel-liceu": {
        foto: "assets/img/avatar-padrao.jpg",
        nome: "Administração",
        perfil: "painel-liceu"
    }
});

/**
 * Lê um arquivo JSON uma única vez e guarda o resultado em memória.
 * @param {string} caminho
 * @returns {Promise<object>}
 */
async function lerJson(caminho) {
    if (cache.has(caminho)) {
        return cache.get(caminho);
    }
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error("Falha ao carregar " + caminho);
    }
    const dados = await resposta.json();
    cache.set(caminho, dados);
    return dados;
}

/** @returns {Promise<Array<object>>} lista de artesãos */
function carregarArtesaos() {
    return carregarColecao("artesaos", "data/artesaos.json");
}

/** @returns {Promise<Array<object>>} lista de trabalhos (produtos) */
function carregarTrabalhos() {
    return carregarColecao("trabalhos", "data/trabalhos.json");
}

/** @returns {Promise<{categorias: string[], tecnicas: string[]}>} */
function carregarCategorias() {
    return lerJson("data/categorias.json");
}

/**
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
async function buscarArtesao(id) {
    const artesaos = await carregarArtesaos();
    return artesaos.find(function (artesao) {
        return artesao.id === id;
    });
}

/**
 * @param {string} artesaoId
 * @returns {Promise<Array<object>>}
 */
async function trabalhosDoArtesao(artesaoId) {
    const trabalhos = await carregarTrabalhos();
    return trabalhos.filter(function (trabalho) {
        return trabalho.artesaoId === artesaoId;
    });
}

/**
 * Junta o nome do artesão em cada trabalho (útil para tabelas e cards).
 * @param {Array<object>} trabalhos
 * @returns {Promise<Array<object>>}
 */
async function comNomeDoArtesao(trabalhos) {
    const artesaos = await carregarArtesaos();
    return trabalhos.map(function (trabalho) {
        const artesao = artesaos.find(function (item) {
            return item.id === trabalho.artesaoId;
        });
        return Object.assign({}, trabalho, {
            artesaoNome: (
                artesao
                ? artesao.nome
                : "—"
            )
        });
    });
}

/**
 * Conta itens por status: {publicado: 8, "em-analise": 3, ...}.
 * @param {Array<{status: string}>} lista
 * @returns {object}
 */
function contarPorStatus(lista) {
    return lista.reduce(function (contagem, item) {
        contagem[item.status] = (contagem[item.status] || 0) + 1;
        return contagem;
    }, {});
}

/**
 * Formata data ISO como "10/11/2026 às 09:24".
 * @param {string} iso
 * @param {boolean} [comHora=true]
 * @returns {string}
 */
function formatarData(iso, comHora = true) {
    const data = new Date(iso);
    const dia = data.toLocaleDateString("pt-BR");
    if (!comHora) {
        return dia;
    }
    const hora = data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
    return dia + " às " + hora;
}

// ===== Sessão =====

/** @returns {object|null} sessão salva no navegador */
function obterSessao() {
    try {
        const sessao = JSON.parse(
            sessionStorage.getItem(CHAVE_SESSAO)
            || localStorage.getItem(CHAVE_SESSAO)
        );
        if (!sessao || !["painel-artesao", "painel-liceu"].includes(
            sessao.perfil
        )) {
            return null;
        }
        if (sessao.perfil === "painel-artesao") {
            const artesao = lerBase().artesaos.find(function (item) {
                return item.id === sessao.artesaoId;
            });
            if (!sessao.artesaoId || (artesao && artesao.status !== "ativo")) {
                return null;
            }
            if (artesao) {
                return Object.assign({}, sessao, {
                    foto: artesao.foto,
                    nome: artesao.nome
                });
            }
        }
        return sessao;
    } catch (ignore) {
        return null;
    }
}

/** Persiste a sessão localmente ou somente nesta aba. */
function salvarSessao(sessao, lembrar = true) {
    const armazenamento = lembrar ? localStorage : sessionStorage;
    encerrarSessao();
    armazenamento.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

function encerrarSessao() {
    localStorage.removeItem(CHAVE_SESSAO);
    sessionStorage.removeItem(CHAVE_SESSAO);
}

/** Autenticação acadêmica local: nunca usar senhas reais. */
async function autenticar(email, senha, lembrar = true) {
    const endereco = email.trim().toLowerCase();
    let sessao;
    if (endereco === "liceu@exemplo.com" && senha === "liceu123") {
        sessao = Object.assign({}, SESSOES_DEMONSTRACAO["painel-liceu"]);
    } else {
        const artesaos = await carregarArtesaos();
        const artesao = artesaos.find(function (item) {
            return item.email.toLowerCase() === endereco;
        });
        const credenciais = lerBase().credenciais;
        const esperada = artesao && (credenciais[artesao.id] || "artesao123");
        if (!artesao || artesao.status !== "ativo" || senha !== esperada) {
            throw new Error("E-mail ou senha inválidos, ou conta inativa.");
        }
        sessao = {
            artesaoId: artesao.id,
            foto: artesao.foto,
            nome: artesao.nome,
            perfil: "painel-artesao"
        };
    }
    salvarSessao(sessao, lembrar);
    return sessao;
}

/**
 * Sessão fictícia usada enquanto a tela de login não existe.
 * @param {string} layout "painel-liceu" | "painel-artesao"
 * @returns {object}
 */
function sessaoDemonstracao(layout) {
    return SESSOES_DEMONSTRACAO[layout];
}

// ===== Escrita local compartilhada entre os papéis =====

/** Cria ou atualiza um trabalho; alterações publicadas voltam à análise. */
async function salvarTrabalho(trabalho) {
    const sessao = exigirSessao();
    const trabalhos = await carregarTrabalhos();
    const anterior = trabalhos.find(function (item) {
        return item.id === trabalho.id;
    });
    const agora = new Date().toISOString();
    const registro = Object.assign({}, anterior, trabalho, {
        atualizadoEm: agora,
        id: trabalho.id || crypto.randomUUID()
    });
    if (sessao.perfil === "painel-artesao") {
        if (registro.artesaoId !== sessao.artesaoId
                || (anterior && anterior.artesaoId !== sessao.artesaoId)) {
            throw new Error("Você só pode alterar seus próprios trabalhos.");
        }
        if (anterior && ["em-analise", "reenviado"].includes(anterior.status)) {
            throw new Error("Aguarde a análise antes de editar este trabalho.");
        }
        if (anterior && ["publicado", "oculto"].includes(anterior.status)) {
            registro.status = "em-analise";
        }
        if (!["rascunho", "em-analise", "reenviado"].includes(registro.status)) {
            throw new Error("Status inválido para envio do artesão.");
        }
        if (registro.status !== "rascunho") {
            registro.enviadoEm = agora;
            registro.motivoRejeicao = null;
            registro.publicadoEm = null;
            registro.analisadoEm = null;
        }
    }
    if (!registro.titulo || !registro.titulo.trim() || !registro.artesaoId) {
        throw new Error("Informe título e artesão do trabalho.");
    }
    const opcoes = await carregarCategorias();
    if (registro.status !== "rascunho" && (
        !opcoes.categorias.includes(registro.categoria)
        || !opcoes.tecnicas.includes(registro.tecnica)
    )) {
        throw new Error("Selecione categoria e técnica predefinidas.");
    }
    registro.titulo = registro.titulo.trim();
    const base = lerBase();
    base.trabalhos = substituir(base.trabalhos, registro);
    gravarBase(base);
    return structuredClone(registro);
}

/** Modera somente trabalhos que aguardam análise. */
async function atualizarStatusTrabalho(id, status, motivo = "") {
    exigirSessao("painel-liceu");
    const trabalhos = await carregarTrabalhos();
    const trabalho = trabalhos.find(function (item) {
        return item.id === id;
    });
    if (!trabalho || !["em-analise", "reenviado"].includes(trabalho.status)) {
        throw new Error("Este trabalho não está aguardando análise.");
    }
    if (!["publicado", "rejeitado"].includes(status)) {
        throw new Error("Decisão de análise inválida.");
    }
    if (status === "rejeitado" && !motivo.trim()) {
        throw new Error("Informe o motivo da rejeição.");
    }
    return salvarTrabalho(Object.assign({}, trabalho, {
        analisadoEm: new Date().toISOString(),
        motivoRejeicao: status === "rejeitado" ? motivo.trim() : null,
        publicadoEm: status === "publicado" ? new Date().toISOString() : null,
        status
    }));
}

/** Salva perfil e credenciais locais em uma única escrita. */
async function salvarArtesao(artesao) {
    const sessao = exigirSessao();
    const artesaos = await carregarArtesaos();
    const anterior = artesaos.find(function (item) {
        return item.id === artesao.id;
    });
    const registro = Object.assign({
        bio: "",
        cadastradoEm: new Date().toISOString(),
        categorias: [],
        cidade: "Curitiba - PR",
        empreendimento: "",
        foto: "assets/img/avatar-padrao.jpg",
        instagram: "",
        status: "ativo",
        tecnicas: [],
        whatsapp: ""
    }, anterior, artesao, {
        id: artesao.id || crypto.randomUUID()
    });
    if (sessao.perfil === "painel-artesao") {
        if (!anterior || anterior.id !== sessao.artesaoId) {
            throw new Error("Você só pode alterar seu próprio perfil.");
        }
        registro.status = anterior.status;
    }
    registro.email = (registro.email || "").trim().toLowerCase();
    registro.nome = (registro.nome || "").trim();
    if (!registro.nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registro.email)
            || artesaos.some(function (item) {
        return item.id !== registro.id && item.email === registro.email;
    }) || registro.email === "liceu@exemplo.com") {
        throw new Error("Informe nome e um e-mail válido ainda não cadastrado.");
    }
    const base = lerBase();
    if (registro.senha) {
        if (sessao.perfil !== "painel-liceu" || registro.senha.length < 6) {
            throw new Error("A senha provisória deve ter ao menos 6 caracteres.");
        }
        base.credenciais[registro.id] = registro.senha;
    }
    delete registro.senha;
    base.artesaos = substituir(base.artesaos, registro);
    gravarBase(base);
    return structuredClone(registro);
}

/** Remove da base visível sem modificar os JSON iniciais. */
async function excluirTrabalho(id) {
    const sessao = exigirSessao();
    const trabalhos = await carregarTrabalhos();
    const trabalho = trabalhos.find(function (item) {
        return item.id === id;
    });
    if (!trabalho) {
        throw new Error("Trabalho não encontrado.");
    }
    if (sessao.perfil === "painel-artesao" && (
        trabalho.artesaoId !== sessao.artesaoId
        || !["rascunho", "rejeitado"].includes(trabalho.status)
    )) {
        throw new Error("Só é possível excluir seus rascunhos ou rejeitados.");
    }
    const base = lerBase();
    base.trabalhos = substituir(base.trabalhos,
        Object.assign({}, trabalho, {excluido: true}));
    gravarBase(base);
}

export {
    atualizarStatusTrabalho,
    autenticar,
    buscarArtesao,
    carregarArtesaos,
    carregarCategorias,
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus,
    encerrarSessao,
    excluirTrabalho,
    formatarData,
    obterSessao,
    salvarArtesao,
    salvarSessao,
    salvarTrabalho,
    sessaoDemonstracao,
    trabalhosDoArtesao
};
