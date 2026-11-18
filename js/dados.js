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

const CHAVE_ARTESAOS = "liceu:artesaos";
const CHAVE_TRABALHOS = "liceu:trabalhos";
const CHAVE_USUARIOS = "liceu:usuarios";
const FOTO_PADRAO = "assets/img/avatar-padrao.jpg";
const SENHA_MAXIMO = 12;
const SENHA_MINIMO = 8;
const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PERFIL_ARTESAO = "painel-artesao";
const PERFIL_LICEU = "painel-liceu";

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

/**
 * @param {string} chave
 * @returns {Array<object>} lista guardada no navegador (vazia se não houver)
 */
function lerLista(chave) {
    try {
        return JSON.parse(localStorage.getItem(chave)) ?? [];
    } catch (ignore) {
        return [];
    }
}

/**
 * @param {string} chave
 * @param {object} item acrescentado ao fim da lista guardada
 */
function acrescentarNaLista(chave, item) {
    localStorage.setItem(chave, JSON.stringify(lerLista(chave).concat(item)));
}

/** @returns {Promise<Array<object>>} artesãos do JSON mais os cadastrados */
async function carregarArtesaos() {
    const base = await lerJson("data/artesaos.json");
    return base.concat(lerLista(CHAVE_ARTESAOS));
}

/** @returns {Promise<Array<object>>} trabalhos do JSON com as alterações salvas no navegador */
async function carregarTrabalhos() {
    const base = await lerJson("data/trabalhos.json");
    const locais = lerTrabalhosLocais();
    const ids = new Set(locais.map(function (trabalho) {
        return trabalho.id;
    }));
    return base.filter(function (trabalho) {
        return !ids.has(trabalho.id);
    }).concat(locais);
}

/** @returns {Promise<{categorias: string[], tecnicas: string[]}>} */
function carregarCategorias() {
    return lerJson("data/categorias.json");
}

/** @returns {Promise<Array<object>>} catálogo de técnicas artesanais */
function carregarTecnicas() {
    return lerJson("data/tecnicas.json");
}

/** @returns {Promise<Array<object>>} contas de teste mais as cadastradas */
async function carregarUsuarios() {
    const base = await lerJson("data/usuarios.json");
    return base.concat(lerLista(CHAVE_USUARIOS));
}

/**
 * @param {string} email
 * @returns {boolean} true se tem o formato nome@dominio.ext
 */
function emailValido(email) {
    return PADRAO_EMAIL.test(String(email).trim());
}

/**
 * Regra da senha: de 8 a 12 caracteres, com pelo menos um número e um
 * caractere especial (qualquer símbolo que não seja letra, número ou espaço).
 * @param {string} senha
 * @returns {boolean}
 */
function senhaValida(senha) {
    const tamanho = Array.from(String(senha)).length;
    return (
        tamanho >= SENHA_MINIMO
        && tamanho <= SENHA_MAXIMO
        && /\d/.test(senha)
        && /[^\p{L}\p{N}\s]/u.test(senha)
    );
}

/**
 * Cadastra um artesão: cria o usuário (perfil artesão) e o registro do
 * artesão (inativo até o perfil ser completado) e já abre a sessão.
 * @param {{nome: string, email: string, senha: string, confirmar: string}} dados
 * @returns {Promise<object>} a sessão aberta
 */
async function registrarArtesao(dados) {
    const nome = String(dados.nome ?? "").trim();
    const email = String(dados.email ?? "").trim().toLowerCase();
    if (!nome || !email || !dados.senha) {
        throw new Error("Preencha todos os campos.");
    }
    if (!emailValido(email)) {
        throw new Error("Digite um e-mail válido, como nome@exemplo.com.");
    }
    if (!senhaValida(dados.senha)) {
        throw new Error(
            "A senha deve ter de 8 a 12 caracteres, com pelo menos um número"
            + " e um caractere especial."
        );
    }
    if (dados.senha !== dados.confirmar) {
        throw new Error("As senhas não são iguais.");
    }
    const usuarios = await carregarUsuarios();
    if (usuarios.some(function (usuario) {
        return usuario.email === email;
    })) {
        throw new Error("Este e-mail já está cadastrado.");
    }
    const id = "artesao-" + Date.now();
    acrescentarNaLista(CHAVE_ARTESAOS, {
        bio: "",
        cadastradoEm: new Date().toISOString(),
        categorias: [],
        cidade: "",
        email,
        empreendimento: "",
        foto: FOTO_PADRAO,
        id,
        instagram: "",
        nome,
        status: "inativo",
        tecnicas: [],
        whatsapp: ""
    });
    acrescentarNaLista(CHAVE_USUARIOS, {
        artesaoId: id,
        email,
        foto: FOTO_PADRAO,
        id: "usuario-" + id,
        nome,
        perfil: PERFIL_ARTESAO,
        senha: dados.senha
    });
    return autenticar(email, dados.senha);
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
    const sessao = obterSessao();
    if (
        !sessao
        || (sessao.perfil === PERFIL_ARTESAO && sessao.artesaoId !== artesaoId)
    ) {
        throw new Error("Acesso não permitido.");
    }
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
 * Valida e-mail e senha contra data/usuarios.json e abre a sessão.
 * A senha nunca é guardada na sessão. Sem back-end, isto é só controle
 * de interface para demonstração: não é segurança real.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<object|null>} sessão aberta ou null se inválido
 */
async function autenticar(email, senha) {
    const usuarios = await carregarUsuarios();
    const usuario = usuarios.find(function (item) {
        return (
            item.email === String(email).trim().toLowerCase()
            && item.senha === senha
        );
    });
    if (!usuario) {
        return null;
    }
    const {senha: ignore, ...sessao} = usuario;
    salvarSessao(sessao);
    return sessao;
}

/**
 * Garante que há sessão do perfil exigido; senão lança erro.
 * Protege as operações de escrita mesmo se a interface for burlada.
 * @param {string} perfil "painel-artesao" | "painel-liceu"
 * @returns {object} a sessão
 */
function exigirPerfil(perfil) {
    const sessao = obterSessao();
    if (!sessao || sessao.perfil !== perfil) {
        throw new Error("Acesso não permitido.");
    }
    return sessao;
}

// ===== Escrita (a implementar) =====

/** @returns {Array<object>} trabalhos criados ou alterados neste navegador */
function lerTrabalhosLocais() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_TRABALHOS)) ?? [];
    } catch (ignore) {
        return [];
    }
}

/** @param {object} trabalho grava (ou substitui, pelo id) no localStorage */
function gravarTrabalhoLocal(trabalho) {
    const locais = lerTrabalhosLocais().filter(function (item) {
        return item.id !== trabalho.id;
    });
    locais.push(trabalho);
    localStorage.setItem(CHAVE_TRABALHOS, JSON.stringify(locais));
}

/**
 * Cria ou atualiza um trabalho do artesão logado. O dono é sempre o
 * artesão da sessão, e só ele pode alterar um trabalho existente.
 * @param {object} trabalho
 * @returns {Promise<object>} o trabalho salvo
 */
async function salvarTrabalho(trabalho) {
    const sessao = exigirPerfil(PERFIL_ARTESAO);
    const todos = await carregarTrabalhos();
    const atual = todos.find(function (item) {
        return item.id === trabalho.id;
    });
    if (atual && atual.artesaoId !== sessao.artesaoId) {
        throw new Error("Acesso não permitido.");
    }
    const agora = new Date().toISOString();
    const status = trabalho.status ?? "rascunho";
    const salvo = Object.assign({}, atual, trabalho, {
        artesaoId: sessao.artesaoId,
        atualizadoEm: agora,
        id: (atual ? atual.id : "trabalho-" + Date.now()),
        status
    });
    if (status === "em-analise" || status === "reenviado") {
        salvo.enviadoEm = agora;
        salvo.motivoRejeicao = null;
    }
    gravarTrabalhoLocal(salvo);
    return salvo;
}

/**
 * Aprova ou rejeita um trabalho (fluxo de moderação do Liceu).
 * Exige perfil de administrador e que o trabalho esteja aguardando análise.
 * @param {string} id
 * @param {string} status "publicado" | "rejeitado"
 * @param {string} [motivo] obrigatório na rejeição
 * @returns {Promise<object>} o trabalho atualizado
 */
async function atualizarStatusTrabalho(id, status, motivo) {
    exigirPerfil(PERFIL_LICEU);
    const todos = await carregarTrabalhos();
    const atual = todos.find(function (item) {
        return item.id === id;
    });
    const analisavel = (
        atual
        && (atual.status === "em-analise" || atual.status === "reenviado")
    );
    if (!analisavel || !["publicado", "rejeitado"].includes(status)) {
        throw new Error("Trabalho não pode ser analisado.");
    }
    if (status === "rejeitado" && !String(motivo ?? "").trim()) {
        throw new Error("Informe o motivo da rejeição.");
    }
    const agora = new Date().toISOString();
    const analisado = Object.assign({}, atual, {
        analisadoEm: agora,
        atualizadoEm: agora,
        motivoRejeicao: (
            status === "rejeitado"
            ? String(motivo).trim()
            : null
        ),
        publicadoEm: (
            status === "publicado"
            ? agora
            : atual.publicadoEm
        ),
        status
    });
    gravarTrabalhoLocal(analisado);
    return analisado;
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
    autenticar,
    buscarArtesao,
    carregarArtesaos,
    carregarCategorias,
    carregarTecnicas,
    carregarTrabalhos,
    carregarUsuarios,
    comNomeDoArtesao,
    contarPorStatus,
    emailValido,
    encerrarSessao,
    exigirPerfil,
    formatarData,
    obterSessao,
    registrarArtesao,
    salvarArtesao,
    salvarSessao,
    salvarTrabalho,
    senhaValida,
    trabalhosDoArtesao
};
