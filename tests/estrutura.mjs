/** Verifica contratos locais de rotas/parciais sem dependências. */
import assert from "node:assert/strict";
import {readFile, readdir} from "node:fs/promises";
const fonte = await readFile(new URL("../js/rotas.js", import.meta.url), "utf8");
const ROTAS = Array.from(fonte.matchAll(
    /arquivo: "([^"]+)",\s+caminho: "([^"]+)"/g
), item => ({arquivo: item[1], caminho: item[2]}));

const caminhos = new Set(ROTAS.map(rota => rota.caminho));
assert.equal(caminhos.size, ROTAS.length, "Não deve haver rotas duplicadas");
caminhos.add("/login");
for (const rota of ROTAS) {
    const html = await readFile(new URL("../" + rota.arquivo, import.meta.url), "utf8");
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, rota.arquivo);
    assert.equal(/<(?:html|head|body|main)(?:\s|>)/i.test(html), false, rota.arquivo);
}
const arquivos = ["../index.html"];
async function listar(diretorio) {
    const entradas = await readdir(new URL(diretorio, import.meta.url), {withFileTypes: true});
    for (const entrada of entradas) {
        if (entrada.isDirectory()) {
            await listar(diretorio + "/" + entrada.name);
        } else if (entrada.name.endsWith(".html")) {
            arquivos.push(diretorio + "/" + entrada.name);
        }
    }
}
await listar("../pages");
for (const arquivo of arquivos) {
    const html = (await readFile(new URL(arquivo, import.meta.url), "utf8"))
        .replace(/<!--[\s\S]*?-->/g, "");
    for (const link of html.matchAll(/href="#(\/[^"?]*)(?:\?[^\"]*)?"/g)) {
        assert.ok(caminhos.has(link[1]), arquivo + ": " + link[1]);
    }
    for (const imagem of html.matchAll(/<img\b[^>]*>/g)) {
        assert.ok(/\balt="/.test(imagem[0]), arquivo + ": imagem sem alt");
        assert.ok(/\bwidth="/.test(imagem[0]), arquivo + ": imagem sem largura");
        assert.ok(/\bheight="/.test(imagem[0]), arquivo + ": imagem sem altura");
    }
}
console.log(`${ROTAS.length} rotas e ${arquivos.length} arquivos HTML: contratos válidos.`);
