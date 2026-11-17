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
globalThis.fetch = async function (caminho) {
    const conteudo = await readFile(new URL("../" + caminho, import.meta.url));
    return {json: async () => JSON.parse(conteudo), ok: true};
};
const fonte = await readFile(new URL("../js/dados.js", import.meta.url), "utf8");
const dados = await import("data:text/javascript;base64,"
    + Buffer.from(fonte).toString("base64"));

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
