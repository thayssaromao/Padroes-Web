/** Testes de integração do mock, sem dependências: node --test tests/dados.mjs */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

function armazenamento() {
    const mapa = new Map();
    return {
        clear() { mapa.clear(); },
        getItem(chave) { return mapa.get(chave) ?? null; },
        removeItem(chave) { mapa.delete(chave); },
        setItem(chave, valor) { mapa.set(chave, String(valor)); }
    };
}
globalThis.localStorage = armazenamento();
globalThis.sessionStorage = armazenamento();
const requisicoes = [];
globalThis.fetch = async function (caminho) {
    requisicoes.push(caminho);
    const conteudo = await readFile(new URL("../" + caminho, import.meta.url));
    return {json: async () => JSON.parse(conteudo), ok: true};
};
const fonte = await readFile(new URL("../js/dados.js", import.meta.url), "utf8");
const dados = await import("data:text/javascript;base64,"
    + Buffer.from(fonte).toString("base64"));

test("base única compartilha requisições concorrentes e isola as leituras", async () => {
    const [artesaos, trabalhos, categorias, tecnicas] = await Promise.all([
        dados.carregarArtesaos(), dados.carregarTrabalhos(),
        dados.carregarCategorias(), dados.carregarTecnicas()
    ]);
    assert.deepEqual(requisicoes, ["data/banco.json"]);
    assert.ok(artesaos.length && trabalhos.length && tecnicas.length);
    categorias.categorias.length = 0;
    tecnicas[0].nome = "Alteração externa";
    assert.ok((await dados.carregarCategorias()).categorias.length);
    assert.notEqual((await dados.carregarTecnicas())[0].nome, "Alteração externa");
});

test("base indisponível ou inválida permite nova tentativa sem apagar dados locais", async () => {
    const fetchOriginal = globalThis.fetch;
    const isolado = await import("data:text/javascript;base64,"
        + Buffer.from(fonte + "\n// teste de recuperação").toString("base64"));
    localStorage.setItem("preservar", "registro local");
    try {
        globalThis.fetch = async () => ({ok: false});
        await assert.rejects(isolado.carregarArtesaos(), /Falha ao carregar/);
        globalThis.fetch = async () => ({ok: true, json: async () => ({versao: 99})});
        await assert.rejects(isolado.carregarArtesaos(), /Base JSON inválida/);
        globalThis.fetch = fetchOriginal;
        assert.ok((await isolado.carregarArtesaos()).length);
        assert.equal(localStorage.getItem("preservar"), "registro local");
    } finally {
        globalThis.fetch = fetchOriginal;
        localStorage.removeItem("preservar");
    }
});

function limpar() {
    localStorage.clear();
    sessionStorage.clear();
}

async function entrarArtesao() {
    return dados.autenticar("ana@exemplo.com", "artesao123", false);
}
async function entrarLiceu() {
    return dados.autenticar("liceu@exemplo.com", "liceu123");
}
function novo(titulo = "Peça de integração") {
    return {
        artesaoId: "ana-martins", categoria: "Decoração",
        descricao: "Peça artesanal", imagens: [], status: "em-analise",
        tecnica: "Cerâmica", titulo
    };
}

test("envio, aprovação, leitura compartilhada e edição voltando à análise", async () => {
    limpar();
    await entrarArtesao();
    const enviado = await dados.salvarTrabalho(novo());
    assert.equal(enviado.status, "em-analise");
    await assert.rejects(dados.atualizarStatusTrabalho(enviado.id, "publicado"));
    await entrarLiceu();
    await dados.atualizarStatusTrabalho(enviado.id, "publicado");
    const publicado = (await dados.carregarTrabalhos()).find(x => x.id === enviado.id);
    assert.ok(publicado.publicadoEm);
    await entrarArtesao();
    const editado = await dados.salvarTrabalho({...publicado, titulo: "Peça corrigida"});
    assert.equal(editado.status, "em-analise");
    assert.equal(editado.publicadoEm, null);
});

test("rejeição exige motivo, artesão lê e reenvia à mesma fila", async () => {
    limpar();
    await entrarArtesao();
    const enviado = await dados.salvarTrabalho(novo());
    await entrarLiceu();
    await assert.rejects(dados.atualizarStatusTrabalho(enviado.id, "rejeitado", "  "));
    await dados.atualizarStatusTrabalho(enviado.id, "rejeitado", "Rever fotos");
    await entrarArtesao();
    const rejeitado = (await dados.trabalhosDoArtesao("ana-martins"))
        .find(x => x.id === enviado.id);
    assert.equal(rejeitado.motivoRejeicao, "Rever fotos");
    const reenviado = await dados.salvarTrabalho({...rejeitado, status: "reenviado"});
    assert.equal(reenviado.status, "reenviado");
    assert.equal(reenviado.motivoRejeicao, null);
    await entrarLiceu();
    await dados.atualizarStatusTrabalho(enviado.id, "publicado");
});

test("cadastro administrativo cria credencial e desativação revoga sessão", async () => {
    limpar();
    await assert.rejects(dados.salvarArtesao({nome: "Sem permissão"}));
    await entrarLiceu();
    const artesao = await dados.salvarArtesao({
        email: "novo@exemplo.com", nome: "Novo artesão", senha: "nova123"
    });
    assert.equal(artesao.senha, undefined);
    assert.ok(artesao.cadastradoEm);
    await dados.autenticar("novo@exemplo.com", "nova123", false);
    assert.equal(dados.obterSessao().artesaoId, artesao.id);
    await entrarLiceu();
    await dados.salvarArtesao({...artesao, status: "inativo"});
    await assert.rejects(dados.autenticar("novo@exemplo.com", "nova123"));
    dados.salvarSessao({artesaoId: artesao.id, perfil: "painel-artesao"});
    assert.equal(dados.obterSessao(), null);
});

test("ownership, bloqueio durante análise e exclusão dos próprios rascunhos", async () => {
    limpar();
    await entrarArtesao();
    await assert.rejects(dados.salvarTrabalho({...novo(), artesaoId: "carlos-silva"}));
    const enviado = await dados.salvarTrabalho(novo());
    await assert.rejects(dados.salvarTrabalho({...enviado, titulo: "Alteração indevida"}));
    await assert.rejects(dados.excluirTrabalho(enviado.id));
    const rascunho = await dados.salvarTrabalho({...novo(), status: "rascunho"});
    await dados.excluirTrabalho(rascunho.id);
    assert.equal((await dados.carregarTrabalhos()).some(x => x.id === rascunho.id), false);
});

test("leituras não mutam base, lembrar e logout respeitam armazenamento", async () => {
    limpar();
    await entrarArtesao();
    assert.ok(sessionStorage.getItem("liceu:sessao"));
    assert.equal(localStorage.getItem("liceu:sessao"), null);
    const lista = await dados.carregarArtesaos();
    lista[0].nome = "Mutação acidental";
    assert.notEqual((await dados.carregarArtesaos())[0].nome, lista[0].nome);
    await entrarLiceu();
    assert.ok(localStorage.getItem("liceu:sessao"));
    assert.equal(sessionStorage.getItem("liceu:sessao"), null);
    dados.encerrarSessao();
    assert.equal(dados.obterSessao(), null);
});

test("falha de armazenamento não confirma alterações nem modifica a base", async () => {
    limpar();
    await entrarArtesao();
    const original = localStorage.setItem;
    const antes = localStorage.getItem("liceu:base:v1");
    localStorage.setItem = function () { throw new Error("QuotaExceededError"); };
    try {
        await assert.rejects(dados.salvarTrabalho(novo()), /Não foi possível salvar/);
        assert.equal(localStorage.getItem("liceu:base:v1"), antes);
    } finally {
        localStorage.setItem = original;
    }
});

test("e-mail único e taxonomias predefinidas são validados", async () => {
    limpar();
    await entrarArtesao();
    await assert.rejects(dados.salvarTrabalho({...novo(), tecnica: "Inventada"}));
    await entrarLiceu();
    await assert.rejects(dados.salvarArtesao({
        email: "ana@exemplo.com", nome: "Duplicado", senha: "nova123"
    }));
    await assert.rejects(dados.salvarArtesao({email: "inválido", nome: "Inválido"}));
    await assert.rejects(dados.autenticar("ana@exemplo.com", "errada"));
});

test("credenciais novas usam hash com salt e sessões nunca guardam senha", async () => {
    limpar();
    await entrarLiceu();
    const a = await dados.salvarArtesao({
        email: "hash-a@exemplo.com", nome: "Hash A", senha: "segredo123"
    });
    const b = await dados.salvarArtesao({
        email: "hash-b@exemplo.com", nome: "Hash B", senha: "segredo123"
    });
    const texto = localStorage.getItem("liceu:base:v1");
    const base = JSON.parse(texto);
    assert.equal(texto.includes("segredo123"), false);
    assert.equal(base.credenciais[a.id].algoritmo, "PBKDF2-SHA-256");
    assert.notEqual(base.credenciais[a.id].salt, base.credenciais[b.id].salt);
    assert.notEqual(base.credenciais[a.id].hash, base.credenciais[b.id].hash);
    await dados.autenticar(a.email, "segredo123", true);
    assert.equal(dados.obterSessao().artesaoId, a.id);
    dados.salvarSessao({...dados.obterSessao(), senha: "nunca-persistir"});
    assert.equal(localStorage.getItem("liceu:sessao").includes("senha"), false);
});

test("migração remove senha legada sem perder os dados nem o acesso", async () => {
    limpar();
    localStorage.setItem("liceu:base:v1", JSON.stringify({
        artesaos: [], credenciais: {"ana-martins": "provisoria123"},
        trabalhos: [{...novo("Preservado"), id: "preservado"}]
    }));
    await dados.carregarArtesaos();
    assert.equal(localStorage.getItem("liceu:base:v1").includes("provisoria123"), false);
    await dados.autenticar("ana@exemplo.com", "provisoria123", false);
    assert.equal(dados.obterSessao().artesaoId, "ana-martins");
    assert.ok((await dados.carregarTrabalhos()).some(x => x.id === "preservado"));
    await assert.rejects(dados.autenticar("ana@exemplo.com", "artesao123"));
});

test("autocadastro integra credenciais, perfil pendente e ativação ao completar", async () => {
    limpar();
    const cadastro = {nome: "Nova artesã", email: "nova@teste.local", senha: "Nova123!", confirmar: "Nova123!"};
    await assert.rejects(dados.registrarArtesao({...cadastro, confirmar: "outra"}));
    await assert.rejects(dados.registrarArtesao({...cadastro, email: "admin@liceu.mock"}));
    const sessao = await dados.registrarArtesao(cadastro);
    assert.equal(dados.obterSessao().artesaoId, sessao.artesaoId);
    const inicial = await dados.buscarArtesao(sessao.artesaoId);
    assert.equal(inicial.status, "inativo");
    assert.equal(inicial.cadastroPendente, true);
    assert.equal(localStorage.getItem("liceu:base:v1").includes(cadastro.senha), false);
    await assert.rejects(dados.registrarArtesao(cadastro));
    dados.encerrarSessao();
    await dados.autenticar(cadastro.email, cadastro.senha);
    const completo = await dados.salvarArtesao({...inicial, categorias: ["Decoração"], tecnicas: ["Cerâmica"]});
    assert.equal(completo.status, "ativo");
    assert.equal(completo.cadastroPendente, false);
    await entrarLiceu();
    await dados.salvarArtesao({...completo, status: "inativo"});
    await assert.rejects(dados.autenticar(cadastro.email, cadastro.senha));
});

test("formatos locais anteriores preservam contas e trabalhos na integração", async () => {
    limpar();
    const artesao = {id: "legado", nome: "Legado", email: "legado@teste.local", status: "ativo", categorias: ["Decoração"], tecnicas: ["Cerâmica"]};
    localStorage.setItem("liceu:artesaos", JSON.stringify([artesao]));
    localStorage.setItem("liceu:usuarios", JSON.stringify([{artesaoId: artesao.id, email: artesao.email, senha: "Legado123!", perfil: "painel-artesao"}]));
    localStorage.setItem("liceu:trabalhos", JSON.stringify([{...novo("Legado preservado"), id: "legado-trabalho", artesaoId: artesao.id}]));
    await dados.autenticar(artesao.email, "Legado123!");
    assert.equal(dados.obterSessao().artesaoId, artesao.id);
    assert.ok((await dados.carregarTrabalhos()).some(x => x.id === "legado-trabalho"));
    assert.equal(JSON.parse(localStorage.getItem("liceu:base:v1")).credenciais.legado.algoritmo, "PBKDF2-SHA-256");
    assert.ok(localStorage.getItem("liceu:artesaos"));
});

test("contas de demonstração da main permanecem disponíveis", async () => {
    limpar();
    assert.equal((await dados.autenticar("admin@liceu.mock", "admin123")).perfil, "painel-liceu");
    assert.equal((await dados.autenticar("artesao@liceu.mock", "artesao123")).artesaoId, "ana-martins");
    const perfil = await dados.buscarArtesao("ana-martins");
    await assert.rejects(dados.salvarArtesao({...perfil, email: "admin@liceu.mock"}));
});
