/*jslint browser */
/**
 * dados.js — acesso aos dados simulados (data/banco.json) e à sessão.
 *
 * Sem back-end: o JSON é a "base de dados" inicial e o localStorage
 * guarda a sessão e as alterações compartilhadas pelos painéis.
 * Guia: docs/DESIGN.md §10 e docs/ESPECIFICACOES.md (Fonte de Dados).
 */

const CHAVE_SESSAO = "liceu:sessao";
const CHAVE_BASE = "liceu:base:v1";

const ITERACOES_SENHA = 120000;
let migracaoCredenciais;

function codificarBytes(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function decodificarBytes(texto) {
    return Uint8Array.from(atob(texto), function (letra) {
        return letra.charCodeAt(0);
    });
}

async function derivarSenha(senha, salt, iteracoes) {
    const chave = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(senha), "PBKDF2", false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits({
        hash: "SHA-256",
        iterations: iteracoes,
        name: "PBKDF2",
        salt
    }, chave, 256);
    return codificarBytes(bits);
}

async function criarCredencial(senha) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return {
        algoritmo: "PBKDF2-SHA-256",
        hash: await derivarSenha(senha, salt, ITERACOES_SENHA),
        iteracoes: ITERACOES_SENHA,
        salt: codificarBytes(salt)
    };
}

async function conferirCredencial(senha, credencial) {
    if (!credencial) {
        const banco = await carregarBanco();
        return senha === banco.autenticacao.senhaArtesaoPadrao;
    }
    if (credencial.algoritmo !== "PBKDF2-SHA-256"
            || !Number.isInteger(credencial.iteracoes)
            || credencial.iteracoes < 1 || credencial.iteracoes > 1000000) {
        return false;
    }
    return await derivarSenha(senha, decodificarBytes(credencial.salt),
        credencial.iteracoes) === credencial.hash;
}

/** Converte a base antiga sem excluir contas, trabalhos ou sessões. */
async function executarMigracaoCredenciais() {
    const antigas = Object.entries(lerBase().credenciais).filter(
        function (item) {
            return typeof item[1] === "string";
        }
    );
    if (!antigas.length) {
        return;
    }
    const novas = await Promise.all(antigas.map(async function (item) {
        return [item[0], item[1], await criarCredencial(item[1])];
    }));
    const base = lerBase();
    novas.forEach(function (item) {
        if (base.credenciais[item[0]] === item[1]) {
            base.credenciais[item[0]] = item[2];
        }
    });
    gravarBase(base);
}

function migrarCredenciais() {
    if (!migracaoCredenciais) {
        migracaoCredenciais = executarMigracaoCredenciais().finally(
            function () {
                migracaoCredenciais = undefined;
            }
        );
    }
    return migracaoCredenciais;
}

/** Lê registros do formato anterior sem apagar as chaves originais. */
function lerLegado(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados
            : dados && typeof dados === "object" ? Object.values(dados) : [];
    } catch (ignore) {
        return [];
    }
}

function lerBase() {
    const texto = localStorage.getItem(CHAVE_BASE);
    const base = texto ? JSON.parse(texto)
        : {artesaos: [], credenciais: {}, trabalhos: []};
    if (!Array.isArray(base.artesaos) || !Array.isArray(base.trabalhos)
            || !base.credenciais) {
        throw new Error("Dados locais inválidos. Não foi possível ler a base.");
    }
    const usuarios = lerLegado("liceu:usuarios");
    const antigos = lerLegado("liceu:artesaos").map(function (artesao) {
        const usuario = usuarios.find(function (item) {
            return item.artesaoId === artesao.id;
        });
        return Object.assign({}, artesao, {
            cadastroPendente: Boolean(usuario && artesao.status === "inativo"
                && !artesao.categorias?.length && !artesao.tecnicas?.length)
        });
    });
    ["artesaos", "trabalhos"].forEach(function (nome) {
        const lista = nome === "artesaos" ? antigos : lerLegado("liceu:trabalhos");
        const mapa = new Map(lista.filter(function (item) {
            return item && item.id;
        }).map(function (item) { return [item.id, item]; }));
        base[nome].forEach(function (item) { mapa.set(item.id, item); });
        base[nome] = Array.from(mapa.values());
    });
    usuarios.forEach(function (usuario) {
        if (usuario.artesaoId && typeof usuario.senha === "string"
                && !Object.hasOwn(base.credenciais, usuario.artesaoId)) {
            base.credenciais[usuario.artesaoId] = usuario.senha;
        }
    });
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

/** Lê o formato anterior e mantém aliases de leitura para integrações antigas. */
function normalizarTrabalho(trabalho) {
    const categorias = Array.from(new Set(Array.isArray(trabalho.categorias)
        ? trabalho.categorias : (trabalho.categoria ? [trabalho.categoria] : [])));
    const tecnicas = Array.from(new Set(Array.isArray(trabalho.tecnicas)
        ? trabalho.tecnicas : (trabalho.tecnica ? [trabalho.tecnica] : [])));
    return Object.assign({}, trabalho, {
        categorias, tecnicas, categoria: categorias[0] || "", tecnica: tecnicas[0] || ""
    });
}

async function carregarColecao(nome) {
    const iniciais = await lerColecaoInicial(nome);
    await migrarCredenciais();
    const alterados = lerBase()[nome];
    const mapa = new Map(iniciais.map(function (item) {
        return [item.id, item];
    }));
    alterados.forEach(function (item) {
        mapa.set(item.id, item);
    });
    return structuredClone(Array.from(mapa.values()).filter(function (item) {
        return !item.excluido;
    }).map(function (item) {
        return nome === "trabalhos" ? normalizarTrabalho(item) : item;
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
let bancoInicial;

/** Uma única requisição compartilhada; falhas permitem tentar novamente. */
async function carregarBanco() {
    if (!bancoInicial) {
        bancoInicial = (async function () {
            const resposta = await fetch("data/banco.json");
            if (!resposta.ok) {
                throw new Error("Falha ao carregar data/banco.json");
            }
            const banco = await resposta.json();
            if (banco.versao !== 1 || !Array.isArray(banco.artesaos)
                    || !Array.isArray(banco.trabalhos)
                    || !Array.isArray(banco.usuarios)
                    || !Array.isArray(banco.tecnicas)
                    || !Array.isArray(banco.categorias?.categorias)
                    || !Array.isArray(banco.categorias?.tecnicas)
                    || !banco.sessoesDemonstracao
                    || !banco.autenticacao?.senhaArtesaoPadrao) {
                throw new Error("Base JSON inválida ou versão não suportada.");
            }
            return banco;
        }());
    }
    try {
        return await bancoInicial;
    } catch (erro) {
        bancoInicial = undefined;
        throw erro;
    }
}

/** Isola os consumidores para não alterar a base inicial em memória. */
async function lerColecaoInicial(nome) {
    const banco = await carregarBanco();
    return structuredClone(banco[nome]);
}

/** @returns {Promise<Array<object>>} lista de artesãos */
function carregarArtesaos() {
    return carregarColecao("artesaos");
}

/** @returns {Promise<Array<object>>} lista de trabalhos (produtos) */
function carregarTrabalhos() {
    return carregarColecao("trabalhos");
}

/** @returns {Promise<{categorias: string[], tecnicas: string[]}>} */
function carregarCategorias() {
    return lerColecaoInicial("categorias");
}

/** Catálogo institucional de técnicas já publicado na main. */
function carregarTecnicas() {
    return lerColecaoInicial("tecnicas");
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

function senhaValida(senha) {
    const texto = String(senha);
    const tamanho = Array.from(texto).length;
    return tamanho >= 8 && tamanho <= 12 && /\d/.test(texto)
        && /[^\p{L}\p{N}\s]/u.test(texto);
}

/** Integra o autocadastro existente à base compartilhada e às credenciais. */
async function registrarArtesao(dados) {
    const nome = String(dados.nome || "").trim();
    const email = String(dados.email || "").trim().toLowerCase();
    if (!nome || !emailValido(email)) {
        throw new Error("Informe nome e um e-mail válido.");
    }
    if (!senhaValida(dados.senha)) {
        throw new Error("A senha deve ter de 8 a 12 caracteres, com número e símbolo.");
    }
    if (dados.senha !== dados.confirmar) {
        throw new Error("As senhas não são iguais.");
    }
    const artesaos = await carregarArtesaos();
    const usuarios = await lerColecaoInicial("usuarios");
    if (artesaos.some(function (item) { return item.email === email; })
            || usuarios.some(function (item) { return item.email === email; })) {
        throw new Error("Este e-mail já está cadastrado.");
    }
    const artesao = {
        bio: "", cadastroPendente: true, cadastradoEm: new Date().toISOString(),
        categorias: [], cidade: "", email, empreendimento: "",
        foto: "assets/img/avatar-padrao.jpg", id: crypto.randomUUID(),
        instagram: "", nome, status: "inativo", tecnicas: [], whatsapp: ""
    };
    const credencial = await criarCredencial(dados.senha);
    const base = lerBase();
    base.artesaos.push(artesao);
    base.credenciais[artesao.id] = credencial;
    gravarBase(base);
    const sessao = {artesaoId: artesao.id, foto: artesao.foto,
        nome, perfil: "painel-artesao"};
    salvarSessao(sessao);
    return sessao;
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
            if (!sessao.artesaoId || (artesao && artesao.status !== "ativo"
                    && !artesao.cadastroPendente)) {
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
    const identidade = {
        artesaoId: sessao.artesaoId,
        foto: sessao.foto,
        nome: sessao.nome,
        perfil: sessao.perfil
    };
    armazenamento.setItem(CHAVE_SESSAO, JSON.stringify(identidade));
}

function encerrarSessao() {
    localStorage.removeItem(CHAVE_SESSAO);
    sessionStorage.removeItem(CHAVE_SESSAO);
}

/** Autenticação acadêmica local: nunca usar senhas reais. */
async function autenticar(email, senha, lembrar = true) {
    let endereco = email.trim().toLowerCase();
    const usuarios = await lerColecaoInicial("usuarios");
    const contaPadrao = usuarios.find(function (item) {
        return item.email === endereco && item.senha === senha;
    });
    if (contaPadrao?.perfil === "painel-artesao"
            && !lerBase().credenciais[contaPadrao.artesaoId]) {
        const artesao = await buscarArtesao(contaPadrao.artesaoId);
        endereco = artesao?.email || endereco;
    }
    let sessao;
    if (contaPadrao?.perfil === "painel-liceu") {
        sessao = await sessaoDemonstracao("painel-liceu");
    } else {
        const artesaos = await carregarArtesaos();
        const artesao = artesaos.find(function (item) {
            return item.email.toLowerCase() === endereco;
        });
        const credenciais = lerBase().credenciais;
        const valida = artesao && await conferirCredencial(
            senha, credenciais[artesao.id]
        );
        if (!artesao || (artesao.status !== "ativo"
                && !artesao.cadastroPendente) || !valida) {
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
 * Identidade de demonstração mantida para compatibilidade das telas.
 * @param {string} layout "painel-liceu" | "painel-artesao"
 * @returns {Promise<object>}
 */
async function sessaoDemonstracao(layout) {
    const banco = await carregarBanco();
    return structuredClone(banco.sessoesDemonstracao[layout]);
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
    if ((trabalho.categorias !== undefined && !Array.isArray(trabalho.categorias))
            || (trabalho.tecnicas !== undefined && !Array.isArray(trabalho.tecnicas))) {
        throw new Error("Categorias e técnicas devem ser listas.");
    }
    const registro = normalizarTrabalho(Object.assign({}, anterior, trabalho, {
        atualizadoEm: agora,
        id: trabalho.id || crypto.randomUUID()
    }));
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
        !registro.categorias.length || !registro.tecnicas.length
        || !registro.categorias.every(function (valor) {
            return opcoes.categorias.includes(valor);
        }) || !registro.tecnicas.every(function (valor) {
            return opcoes.tecnicas.includes(valor);
        })
    )) {
        throw new Error("Selecione pelo menos uma categoria e uma técnica predefinidas.");
    }
    registro.titulo = registro.titulo.trim();
    const base = lerBase();
    const persistido = Object.assign({}, registro);
    delete persistido.categoria;
    delete persistido.tecnica;
    base.trabalhos = substituir(base.trabalhos, persistido);
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
        if (anterior.cadastroPendente && registro.categorias?.length
                && registro.tecnicas?.length) {
            registro.cadastroPendente = false;
            registro.status = "ativo";
        }
    } else if (artesao.status === "inativo") {
        registro.cadastroPendente = false;
    }
    registro.email = (registro.email || "").trim().toLowerCase();
    registro.nome = (registro.nome || "").trim();
    if (!registro.nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registro.email)
            || artesaos.some(function (item) {
        return item.id !== registro.id && item.email === registro.email;
    })) {
        throw new Error("Informe nome e um e-mail válido ainda não cadastrado.");
    }
    const usuariosPadrao = await lerColecaoInicial("usuarios");
    if (usuariosPadrao.some(function (usuario) {
        return usuario.email === registro.email && usuario.artesaoId !== registro.id;
    })) {
        throw new Error("Este e-mail já está cadastrado.");
    }
    let credencial;
    if (registro.senha) {
        if (sessao.perfil !== "painel-liceu" || registro.senha.length < 6) {
            throw new Error("A senha provisória deve ter ao menos 6 caracteres.");
        }
        credencial = await criarCredencial(registro.senha);
    }
    const base = lerBase();
    if (credencial) {
        base.credenciais[registro.id] = credencial;
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
    carregarBanco,
    carregarCategorias,
    carregarTrabalhos,
    carregarTecnicas,
    emailValido,
    registrarArtesao,
    senhaValida,
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
