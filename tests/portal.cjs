/** Complemento da auditoria pública: geometria, teclado e contato simulado. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8091/";
const artifacts = path.join(process.env.RELATORIO_DIR || "/tmp/liceu-validacao-final", "portal");
const views = [
    ["inicio", "#inicio-produtos .card"],
    ["produtos", "#gradeProdutos .card"],
    ["produto?id=vaso-ceramica-rustica", "#produto-detalhes:not([hidden])"],
    ["artesaos", "#artesaos-grade .card"],
    ["saberes", "#saberes-grade .card"],
    ["o-liceu", "h1"], ["sobre", "h1"], ["contato", "#contato-form"]
];

async function route(page, hash, selector) {
    await page.goto(base + "#/" + hash);
    await page.locator("#conteudo " + selector).first().waitFor();
}

async function fits(locator) {
    const size = await locator.evaluate(el => ({client: el.clientWidth, scroll: el.scrollWidth}));
    assert.ok(size.scroll <= size.client + 1, JSON.stringify(size));
}

async function snapshot(page, name) {
    const modal = await page.locator("dialog[open]").count();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({path: path.join(artifacts, name + ".png"), fullPage: !modal});
}

async function contact(page) {
    await route(page, "contato", "#contato-form");
    let requests = 0;
    let mode = "success";
    let release;
    await page.route("https://api.web3forms.com/submit", async request => {
        requests += 1;
        if (mode === "network") return request.abort("failed");
        if (mode === "success") {
            const body = request.request().postData();
            assert.match(body, /Teste do portal/);
            assert.match(body, /portal@exemplo.com/);
            await new Promise(resolve => { release = resolve; });
        }
        await request.fulfill({
            status: mode === "success" ? 200 : 500,
            contentType: "application/json",
            body: JSON.stringify({success: mode === "success"})
        });
    });
    const submit = page.locator("#contato-form [type=submit]");
    await submit.click();
    assert.equal(requests, 0, "Campos vazios não enviam mensagens");
    await page.fill("#contato-nome", "   ");
    await page.fill("#contato-email", "portal@exemplo.com");
    await page.fill("#contato-mensagem", "Mensagem de teste");
    await submit.click();
    assert.equal(requests, 0, "Nome apenas com espaços é inválido");
    await page.fill("#contato-nome", "Teste do portal");
    await submit.click();
    await page.waitForFunction(() => document.querySelector("#contato-form [type=submit]").disabled);
    assert.match(await page.locator(".contato-feedback").innerText(), /Enviando/);
    while (!release) await page.waitForTimeout(20);
    release();
    await page.waitForFunction(() => document.querySelector(".contato-feedback").textContent.includes("sucesso"));
    assert.equal(await page.inputValue("#contato-nome"), "");
    for (const failure of ["server", "network"]) {
        mode = failure;
        await page.fill("#contato-nome", "Teste do portal");
        await page.fill("#contato-email", "portal@exemplo.com");
        await page.fill("#contato-mensagem", "Mensagem de teste");
        await submit.click();
        await page.waitForFunction(() => !document.querySelector("#contato-form [type=submit]").disabled);
        assert.match(await page.locator(".contato-feedback").innerText(), failure === "server" ? /Não foi possível/ : /Erro de conexão/);
        assert.equal(await page.inputValue("#contato-nome"), "Teste do portal");
    }
    assert.equal(requests, 3);
}

(async () => {
    fs.mkdirSync(artifacts, {recursive: true});
    const reports = [];
    for (const [name, engine] of Object.entries({chromium, firefox})) {
        const browser = await engine.launch({headless: true});
        try {
            const page = await browser.newPage({reducedMotion: "reduce"});
            const longPage = await browser.newPage({reducedMotion: "reduce"});
            const errors = [];
            page.on("pageerror", error => errors.push(error.message));
            longPage.on("pageerror", error => errors.push(error.message));
            // Dados longos são respostas fictícias, sem gravar a base do portal.
            await longPage.route("**/data/artesaos.json", async request => {
                const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/artesaos.json"), "utf8"));
                const artisan = data.find(item => item.id === "ana-martins");
                for (const field of ["nome", "empreendimento", "cidade", "bio"]) {
                    artisan[field] = "TextoSemEspacos".repeat(20);
                }
                artisan.email = "contato".repeat(25) + "@exemplo.com";
                await request.fulfill({json: data});
            });
            for (const width of [1280, 768, 375]) {
                await page.setViewportSize({width, height: 960});
                for (const [hash, selector] of views) {
                    await route(page, hash, selector);
                    await fits(page.locator("html"));
                    if (hash === "produtos") {
                        const columns = await page.locator("#gradeProdutos").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
                        assert.equal(columns, width === 1280 ? 4 : width === 768 ? 2 : 1);
                        await page.locator("#btnViewLista").click();
                        await fits(page.locator("#gradeProdutos"));
                        await page.locator("#btnViewGrade").click();
                    }
                    if (["inicio", "artesaos", "saberes"].includes(hash)) {
                        const next = page.locator(".carrossel__seta--proxima");
                        await next.focus();
                        await page.keyboard.press("Enter");
                        assert.equal(await page.locator(".carrossel__ponto").nth(1).getAttribute("aria-current"), "true");
                        await page.locator(".carrossel__seta--anterior").click();
                    }
                    await snapshot(page, `${name}-${hash.split("?")[0]}-${width}`);
                    if (hash === "saberes") {
                        await page.locator("[data-modo=lista]").click();
                        await fits(page.locator("#saberes-grade"));
                        await page.locator("[data-tecnica]").first().click();
                        await page.locator("#saber-detalhe[open]").waitFor();
                        await fits(page.locator("#saber-detalhe"));
                        await page.keyboard.press("Escape");
                        await page.locator("#saberes-busca").fill("zzzznenhumresultado");
                        assert.equal(await page.locator("#saberes-vazio").isVisible(), true);
                    }
                    if (hash === "artesaos") {
                        await page.locator("[data-artesao]").first().click();
                        await page.locator("#modal-artesao[open]").waitFor();
                        await fits(page.locator("#modal-artesao"));
                        await snapshot(page, `${name}-perfil-${width}`);
                        await page.keyboard.press("Escape");
                    }
                }
                await longPage.setViewportSize({width, height: 960});
                await route(longPage, "inicio", "#inicio-produtos .card");
                await route(longPage, "artesaos?id=ana-martins", "#modal-artesao[open]");
                const modal = longPage.locator("#modal-artesao");
                await fits(modal);
                await fits(longPage.locator(".artesaos-perfil__info"));
                await fits(longPage.locator(".artesaos-contato"));
                const photo = await longPage.locator("#modal-artesao-foto").boundingBox();
                assert.ok(photo.width > 150, "Foto preserva espaço com textos longos");
                assert.ok(Math.abs(photo.width - photo.height) < 2, "Foto permanece quadrada");
                await snapshot(longPage, `${name}-perfil-longo-${width}`);
                await longPage.keyboard.press("Escape");
                assert.equal(await modal.getAttribute("open"), null);
                // Abrir por botão verifica também o retorno do foco ao fechar.
                const profile = longPage.locator("[data-artesao=ana-martins]");
                await longPage.locator("#artesaos-busca").fill("TextoSemEspacos");
                await profile.click();
                await longPage.keyboard.press("Escape");
                assert.equal(await profile.evaluate(el => el === document.activeElement), true);
                await page.goto(base + "#/login");
                await page.locator("#modal-login[open]").waitFor();
                await fits(page.locator("#modal-login"));
                await snapshot(page, `${name}-login-${width}`);
                await page.keyboard.press("Escape");
            }
            await contact(page);
            assert.deepEqual(errors, []);
            reports.push({browser: name, screens: 30, longProfile: true, catalogColumns: [4, 2, 1], contactMocked: true, keyboard: true, errors});
            console.log(JSON.stringify(reports.at(-1)));
        } finally {
            await browser.close();
        }
    }
    fs.writeFileSync(path.join(artifacts, "report.json"), JSON.stringify(reports, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
