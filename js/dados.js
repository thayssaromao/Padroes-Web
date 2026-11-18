/*jslint browser */
/**
 * dados.js — acesso aos dados simulados (pasta data) e à sessão.
 *
 * Sem back-end: os JSON são a "base de dados" inicial e o localStorage
 * guarda a sessão e, no futuro, as alterações feitas nos painéis.
 * Guia: docs/DESIGN.md §10 e docs/ESPECIFICACOES.md (Fonte de Dados).
 */

const CHAVE_SESSAO = "liceu:sessao";
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
    return lerJson("data/artesaos.json");
}

/** @returns {Promise<Array<object>>} lista de trabalhos (produtos) */
function carregarTrabalhos() {
    return lerJson("data/trabalhos.json");
}

/** @returns {Promise<{categorias: string[], tecnicas: string[]}>} */
function carregarCategorias() {
    return lerJson("data/categorias.json");
}

/** @returns {Promise<Array<object>>} catálogo de técnicas artesanais */
function carregarTecnicas() {
    return lerJson("data/tecnicas.json");
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
        return JSON.parse(localStorage.getItem(CHAVE_SESSAO));
    } catch (ignore) {
        return null;
    }
}

/** @param {object} sessao */
function salvarSessao(sessao) {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

function encerrarSessao() {
    localStorage.removeItem(CHAVE_SESSAO);
}

/**
 * Sessão fictícia usada enquanto a tela de login não existe.
 * @param {string} layout "painel-liceu" | "painel-artesao"
 * @returns {object}
 */
function sessaoDemonstracao(layout) {
    return SESSOES_DEMONSTRACAO[layout];
}

// ===== Escrita (a implementar) =====

/**
 * Cria ou atualiza um trabalho no localStorage.
 * @param {object} trabalho
 * @returns {Promise<object>}
 */
function salvarTrabalho(trabalho) {
    // A IMPLEMENTAR: salvar no localStorage + data/trabalhos.json.
    return Promise.resolve(trabalho);
}

/**
 * Aprova ou rejeita um trabalho (fluxo de moderação do Liceu).
 * @param {string} id
 * @param {string} status "publicado" | "rejeitado"
 * @param {string} [motivo]
 * @returns {Promise<void>}
 */
function atualizarStatusTrabalho(id, status, motivo) {
    // A IMPLEMENTAR: alterar status, registrar motivo e data de análise.
    return Promise.resolve({id, motivo, status});
}

/**
 * Cria ou atualiza um artesão no localStorage.
 * @param {object} artesao
 * @returns {Promise<object>}
 */
function salvarArtesao(artesao) {
    // A IMPLEMENTAR: salvar no localStorage + data/artesaos.json.
    return Promise.resolve(artesao);
}

export {
    atualizarStatusTrabalho,
    buscarArtesao,
    carregarArtesaos,
    carregarCategorias,
    carregarTecnicas,
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus,
    encerrarSessao,
    formatarData,
    obterSessao,
    salvarArtesao,
    salvarSessao,
    salvarTrabalho,
    sessaoDemonstracao,
    trabalhosDoArtesao
};
