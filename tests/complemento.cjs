/** Revisão complementar: filtros, produto, conta e Ajuda por perfil. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8091/";
const dir = path.join(process.env.RELATORIO_DIR || "/tmp/liceu-validacao-final", "complemento", "depois");

async function route(page, hash, selector) {
    await page.goto(base + "#/" + hash);
    await page.locator("#conteudo " + selector).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
}
async function fits(locator) {
    assert.ok(await locator.evaluate(x => x.scrollWidth <= x.clientWidth + 1));
}
async function shot(page, name) {
    if (await page.locator(".aviso-flutuante").count()) {
        await page.locator(".aviso-flutuante").waitFor({state: "hidden"});
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({path: path.join(dir, name + ".png"), fullPage: !await page.locator("dialog[open]").count()});
}
async function login(page, role) {
    await page.goto(base + "#/login");
    await page.locator("#modal-login[open]").waitFor();
    await page.fill("#login-email", role === "liceu" ? "liceu@exemplo.com" : "ana@exemplo.com");
    await page.fill("#login-senha", role === "liceu" ? "liceu123" : "artesao123");
    await page.locator(".modal-login__entrar").click();
    await page.locator(".painel__titulo").waitFor();
}
async function account(page, width, name) {
    await page.locator("[data-acao=menu-usuario]").click();
    const modal = page.locator("dialog[open]");
    await modal.waitFor();
    await fits(modal);
    const buttons = modal.locator(".modal__acoes > .btn");
    assert.equal(await buttons.count(), 3);
    const rects = await buttons.evaluateAll(xs => xs.map(x => x.getBoundingClientRect().toJSON()));
    if (width === 1280) {
        assert.ok(Math.max(...rects.map(x => x.top)) - Math.min(...rects.map(x => x.top)) < 1);
        assert.ok(Math.max(...rects.map(x => x.width)) - Math.min(...rects.map(x => x.width)) < 1);
    }
    if (width === 375) assert.ok(rects[0].bottom <= rects[1].top && rects[1].bottom <= rects[2].top);
    await shot(page, name);
    await modal.getByRole("button", {name: "Sair", exact: true}).click();
    await page.locator("[data-confirmar-sair]").waitFor();
    await page.getByRole("button", {name: "Cancelar", exact: true}).click();
    assert.equal(await page.locator(".painel__titulo").count(), 1);
    assert.ok(await page.evaluate(async () => (await import("./js/dados.js")).obterSessao()));
}
async function publicationFilters(page) {
    await page.locator("[data-filtro=status]").selectOption("publicado");
    await page.locator("[data-filtro=categoria]").selectOption("Decoração");
    await page.locator("[data-filtro=artesao]").selectOption("ana-martins");
    const expected = await page.evaluate(async () => {
        const {carregarTrabalhos} = await import("./js/dados.js");
        return (await carregarTrabalhos()).filter(x => x.status === "publicado" && x.categoria === "Decoração" && x.artesaoId === "ana-martins").length;
    });
    assert.ok(expected > 0);
    assert.match(await page.locator("[data-contagem]").innerText(), new RegExp("de " + expected + " publicações"));
    await page.locator("[data-busca]").fill("zzznadapublicado");
    assert.equal(await page.locator("[data-vazio]").isVisible(), true);
    await page.locator("[data-busca]").fill("vaso");
    await page.locator("[data-busca]").press("Enter");
    assert.equal(await page.locator("[data-corpo] tr:visible").count(), 1);
    assert.match(await page.locator("[data-corpo] tr:visible").innerText(), /Vaso em Cerâmica/);
}

(async () => {
    fs.mkdirSync(dir, {recursive: true});
    const reports = [];
    for (const [name, engine] of Object.entries({chromium, firefox})) {
        const browser = await engine.launch({headless: true});
        const errors = [];
        try {
            const page = await browser.newPage({reducedMotion: "reduce"});
            page.on("pageerror", e => errors.push(e.message));
            await login(page, "liceu");
            for (const width of [1280, 768, 375]) {
                await page.setViewportSize({width, height: 960});
                let reference;
                for (const [hash, selector, label] of [
                    ["painel-liceu/publicacoes", "[data-acao=ver]", "publicacoes"],
                    ["painel-liceu/trabalhos-pendentes", "[data-acao=analisar]", "pendentes"],
                    ["painel-liceu/artesaos", "[data-corpo] tr:visible", "artesaos"]
                ]) {
                    await route(page, hash, selector);
                    await fits(page.locator("html"));
                    assert.equal(await page.locator(".painel__rodape a[href='#/contato']").count(), 0);
                    assert.equal(await page.locator(".painel__rodape a[href='#/sobre']").count(), 1);
                    assert.equal(await page.locator(".painel__rodape li:empty").count(), 0);
                    const geometry = await page.locator(".liceu-filtros").evaluate(el => {
                        const search = el.querySelector(".busca").getBoundingClientRect();
                        const group = el.querySelector(".liceu-filtros__controles").getBoundingClientRect();
                        const fields = Array.from(el.querySelectorAll("select"), x => {
                            const c = getComputedStyle(x);
                            return [c.height, c.borderRadius, c.fontSize, c.borderColor];
                        });
                        return {search: search.toJSON(), group: group.toJSON(), fields, background: getComputedStyle(el).backgroundColor};
                    });
                    assert.ok(geometry.search.bottom <= geometry.group.top);
                    assert.ok(Math.abs(geometry.search.width - geometry.group.width) < 1);
                    assert.equal(geometry.background, "rgba(0, 0, 0, 0)");
                    if (reference) assert.deepEqual(geometry.fields[0], reference);
                    reference = geometry.fields[0];
                    assert.ok(geometry.fields.every(x => JSON.stringify(x) === JSON.stringify(reference)));
                    await shot(page, `${name}-${label}-${width}`);
                    if (label === "publicacoes") {
                        assert.equal(await page.locator(".liceu-filtros [type=submit]").count(), 0);
                        await publicationFilters(page);
                    }
                }
                await page.locator(".painel__principal").focus();
                await account(page, width, `${name}-conta-${width}`);
                await shot(page, `${name}-footer-admin-${width}`);
                await route(page, "produtos", "#gradeProdutos .card");
                const clear = page.locator("#btnLimparFiltros");
                assert.equal(await clear.evaluate(x => getComputedStyle(x).display), "inline-flex");
                assert.equal(await clear.evaluate(x => getComputedStyle(x).alignItems), "center");
                assert.equal(await clear.evaluate(x => getComputedStyle(x).justifyContent), "center");
                await page.fill("#inputBusca", "zzznadacatalogo");
                await clear.click();
                assert.equal(await page.inputValue("#inputBusca"), "");
                assert.ok(await page.locator("#gradeProdutos .card").count());
                await shot(page, `${name}-catalogo-${width}`);
                await route(page, "produto?id=vaso-ceramica-rustica", "#produto-detalhes:not([hidden])");
                await fits(page.locator("html"));
                const context = await page.evaluate(() => {
                    const photo = document.querySelector(".produto-produtor > img").getBoundingClientRect();
                    const text = document.querySelector(".produto-produtor > .pilha").getBoundingClientRect();
                    const button = document.querySelector(".produto-produtor .btn").getBoundingClientRect();
                    const section = document.querySelector(".produto-contexto > section + section");
                    return {photo: photo.toJSON(), text: text.toJSON(), button: button.toJSON(), leftBorder: getComputedStyle(section).borderLeftWidth, topBorder: getComputedStyle(section).borderTopWidth};
                });
                if (width >= 600) {
                    assert.ok(context.photo.right < context.text.left);
                    assert.ok(context.button.width < context.text.width);
                }
                assert.equal(width >= 1024 ? context.leftBorder : context.topBorder, "1px");
                assert.ok(await page.locator("#produto-saber-nome").innerText());
                await shot(page, `${name}-produto-${width}`);
                const related = page.locator("#produto-relacionados");
                const columns = await related.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
                assert.equal(columns, width === 1280 ? 4 : width === 768 ? 2 : 1);
                if (width === 1280) {
                    const size = await related.locator(".card").first().evaluate(x => x.getBoundingClientRect().width);
                    await route(page, "produto?id=escultura-madeira", "#produto-detalhes:not([hidden])");
                    assert.equal(await related.locator(".card").count(), 3);
                    assert.equal(await related.evaluate(el => el.classList.contains("produto-relacionados--tres")), true);
                    const reduced = await related.locator(".card").first().evaluate(x => x.getBoundingClientRect().width);
                    assert.ok(Math.abs(size - reduced) < 1, "Três relacionados não esticam os cards");
                    await shot(page, `${name}-relacionados-tres-${width}`);
                }
            }
            const artisan = await browser.newPage({reducedMotion: "reduce"});
            artisan.on("pageerror", e => errors.push(e.message));
            await login(artisan, "artesao");
            for (const width of [1280, 768, 375]) {
                await artisan.setViewportSize({width, height: 960});
                const help = artisan.locator(".painel__rodape a[href='#/contato']");
                assert.equal(await help.count(), 1);
                assert.equal(await help.innerText(), "Ajuda");
                await fits(artisan.locator("html"));
                await shot(artisan, `${name}-footer-artesao-${width}`);
                await account(artisan, width, `${name}-conta-artesao-${width}`);
            }
            await artisan.locator(".painel__rodape a[href='#/contato']").click();
            await artisan.locator("#contato-form").waitFor();
            assert.equal(await artisan.locator(".rodape a[href='#/sobre']").count(), 1);
            assert.deepEqual(errors, []);
            const report = {browser: name, widths: [1280,768,375], filters: true, product: true, account: true, roleFooter: true, errors};
            reports.push(report);
            console.log(JSON.stringify(report));
        } finally { await browser.close(); }
    }
    fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify(reports, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
