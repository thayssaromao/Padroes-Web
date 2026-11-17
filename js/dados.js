/*jslint browser */
/**
 * dados.js — acesso aos dados simulados (pasta data) e à sessão.
 *
 * Sem back-end: os JSON são a "base de dados" inicial e o localStorage
 * guarda a sessão e as alterações feitas nos painéis.
 * Guia: docs/DESIGN.md §10 e docs/ESPECIFICACOES.md (Fonte de Dados).
 */

const CHAVE_SESSAO = "liceu:sessao";
const CHAVE_TRABALHOS = "liceu:trabalhos";
const cache = new Map();

// pra qual status cada um pode ir (fluxo de publicacao)
const FLUXO_STATUS = Object.freeze({
    "em-analise": ["publicado", "rejeitado"],
    "publicado": [],
    "rascunho": ["em-analise"],
    "reenviado": ["publicado", "rejeitado"],
    "rejeitado": ["reenviado"]
});

const SESSOES_DEMONSTRACAO = Object.freeze({
    "painel-artesao": {
        artesaoId: "ana-martins",
        foto: "assets/img/artesaos/ana-martins.jpg",
        nome: "Ana Martins",
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

/** @returns {object} trabalhos alterados nos paineis, por id */
function lerTrabalhosSalvos() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_TRABALHOS)) || {};
    } catch (ignore) {
        return {};
    }
}

/**
 * lista de trabalhos (produtos). o json e a base e o que foi mudado
 * nos paineis fica no localStorage por cima
 * @returns {Promise<Array<object>>}
 */
async function carregarTrabalhos() {
    const base = await lerJson("data/trabalhos.json");
    const salvos = lerTrabalhosSalvos();
    const lista = base.map(function (trabalho) {
        return salvos[trabalho.id] || trabalho;
    });
    // trabalhos novos que nao estao no json
    return lista.concat(Object.values(salvos).filter(function (trabalho) {
        return !base.some(function (item) {
            return item.id === trabalho.id;
        });
    }));
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

// ===== Escrita =====

/**
 * Cria ou atualiza um trabalho no localStorage.
 * @param {object} trabalho
 * @returns {Promise<object>}
 */
function salvarTrabalho(trabalho) {
    // A IMPLEMENTAR: criar trabalho novo (id, datas) quando o form
    // de novo trabalho for ligado. por enquanto so salva o que vier
    const salvos = lerTrabalhosSalvos();
    salvos[trabalho.id] = trabalho;
    localStorage.setItem(CHAVE_TRABALHOS, JSON.stringify(salvos));
    return Promise.resolve(trabalho);
}

/**
 * @param {string} atual status de agora
 * @param {string} novo status que quer ir
 * @returns {boolean} se o fluxo deixa mudar
 */
function podeMudarStatus(atual, novo) {
    return (FLUXO_STATUS[atual] || []).includes(novo);
}

/**
 * Muda o status de um trabalho seguindo o fluxo.
 * aprovar/rejeitar (Liceu), enviar rascunho e reenviar (artesao)
 * @param {string} id
 * @param {string} status novo status (ver FLUXO_STATUS)
 * @param {object} [extra] motivo (pra rejeitar) e campos editados (reenvio)
 * @returns {Promise<object>} o trabalho atualizado
 */
async function atualizarStatusTrabalho(id, status, extra = {}) {
    const trabalhos = await carregarTrabalhos();
    const atual = trabalhos.find(function (item) {
        return item.id === id;
    });
    const agora = new Date().toISOString();
    const motivo = String(extra.motivo || "").trim();
    if (!atual) {
        throw new Error("Trabalho não encontrado: " + id);
    }
    if (!podeMudarStatus(atual.status, status)) {
        throw new Error(
            "Não pode mudar de " + atual.status + " para " + status
        );
    }
    if (status === "rejeitado" && !motivo) {
        throw new Error("Informe o motivo da rejeição.");
    }
    const novo = Object.assign({}, atual, extra.campos, {
        atualizadoEm: agora,
        status
    });
    if (status === "publicado" || status === "rejeitado") {
        novo.analisadoEm = agora;
    }
    if (status === "publicado") {
        novo.publicadoEm = agora;
        novo.motivoRejeicao = null;
    }
    if (status === "rejeitado") {
        novo.motivoRejeicao = motivo;
    }
    // enviar ou reenviar conta como envio novo pra fila do Liceu
    if (status === "em-analise" || status === "reenviado") {
        novo.enviadoEm = agora;
    }
    return salvarTrabalho(novo);
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
    carregarTrabalhos,
    comNomeDoArtesao,
    contarPorStatus,
    encerrarSessao,
    formatarData,
    obterSessao,
    podeMudarStatus,
    salvarArtesao,
    salvarSessao,
    salvarTrabalho,
    sessaoDemonstracao,
    trabalhosDoArtesao
};
