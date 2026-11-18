/** Auditoria transversal de UI; usa a instalação de Playwright existente. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8091/";
const artifacts = process.env.RELATORIO_DIR || path.join(os.tmpdir(), "liceu-ui");
fs.mkdirSync(artifacts, {recursive: true});

async function login(page, role, remember) {
    await page.goto(base + "#/login");
    await page.locator("#modal-login[open]").waitFor();
    await page.fill("#login-email", role === "liceu" ? "liceu@exemplo.com" : "ana@exemplo.com");
    await page.fill("#login-senha", role === "liceu" ? "liceu123" : "artesao123");
    await page.locator("[name=lembrar]").setChecked(remember);
    await page.locator(".modal-login__entrar").click();
    await page.locator(".painel__titulo").waitFor({state:"attached"});
    await page.locator("#conteudo h1").waitFor();
}
async function route(page, hash, selector) {
    await page.goto(base + "#" + hash);
    await page.waitForFunction(async function (hash) {
        const {ROTAS} = await import("./js/rotas.js");
        const rota = ROTAS.find(x => x.caminho === hash.split("?")[0]);
        return rota && document.title === rota.titulo;
    }, hash);
    await page.locator("#conteudo " + selector).first().waitFor();
    await page.waitForFunction(() => Array.from(
        document.querySelectorAll("#conteudo iconify-icon")
    ).filter(x => {
        const r = x.getBoundingClientRect();
        return r.width && r.height && r.right > 0 && r.left < innerWidth
            && r.bottom > 0 && r.top < innerHeight;
    }).every(x => Boolean(x.shadowRoot?.querySelector("svg"))));
}
async function assertPassword(page, selector, input) {
    const button = page.locator(selector);
    assert.equal(await page.locator(input).getAttribute("type"), "password");
    assert.equal(await button.getAttribute("title"), "Mostrar senha");
    assert.equal(await button.locator("iconify-icon").getAttribute("icon"), "lucide:eye-off");
    await button.click();
    assert.equal(await page.locator(input).getAttribute("type"), "text");
    assert.equal(await button.getAttribute("aria-label"), "Ocultar senha");
    assert.equal(await button.getAttribute("title"), "Ocultar senha");
    assert.equal(await button.locator("iconify-icon").getAttribute("icon"), "lucide:eye");
    await button.click();
}
async function audit(page) {
    return page.evaluate(() => {
        const visible = x => x.getBoundingClientRect().width && x.getBoundingClientRect().height;
        const controls = Array.from(document.querySelectorAll("button,a.btn"))
            .filter(visible);
        const missing = controls.filter(x => !x.textContent.trim()
            && (!x.getAttribute("aria-label") || !x.getAttribute("title")))
            .map(x => x.outerHTML.slice(0, 180));
        const icons = Array.from(document.querySelectorAll("iconify-icon[icon]"))
            .map(x => x.getAttribute("icon"))
            .filter(x => !x.startsWith("lucide:") && x !== "mdi:whatsapp");
        return {missing, icons, overflow: document.documentElement.scrollWidth > innerWidth + 1};
    });
}
async function snapshot(page, name) {
    // Exercita rolagem real para carregar também controles fora da viewport.
    const modal = await page.locator("dialog[open]").count();
    if (!modal) {
        await page.evaluate(async () => {
            const original = scrollY;
            for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
                scrollTo(0, y);
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            scrollTo(0, original);
            await new Promise(resolve => requestAnimationFrame(resolve));
        });
    }
    try {
    await page.waitForFunction(() => {
        const root = document.querySelector("dialog[open]") || document;
        return Array.from(root.querySelectorAll("iconify-icon"))
            .filter(x => {
                const r = x.getBoundingClientRect();
                return r.width && r.height && r.right > 0 && r.left < innerWidth
            && r.bottom > 0 && r.top < innerHeight;
            }).every(x => Boolean(x.shadowRoot?.querySelector("svg")));
    });
    } catch (error) {
        console.error("SVG pendente", name, await page.evaluate(() => {
            const root = document.querySelector("dialog[open]") || document;
            return Array.from(root.querySelectorAll("iconify-icon")).filter(x => {
                const r = x.getBoundingClientRect();
                return r.width && r.height && r.right > 0 && r.left < innerWidth
            && r.bottom > 0 && r.top < innerHeight
                    && !x.shadowRoot?.querySelector("svg");
            }).map(x => ({icon:x.getAttribute("icon"),attrs:x.getAttributeNames(),
                state:x._state,visible:x._visible,connected:x._connected,
                parent:x.parentElement.outerHTML.slice(0,260)}));
        }));
        throw error;
    }
    await page.screenshot({path: path.join(artifacts, name + ".png"), fullPage: true});
}

(async function () {
    const reports = [];
    for (const [name, engine] of Object.entries({chromium, firefox})) {
        const browser = await engine.launch({headless: true});
        const context = await browser.newContext({viewport: {width:1280,height:960}, reducedMotion:"reduce"});
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        const errors = [];
        page.on("pageerror", e => errors.push(e.message));
        page.on("requestfailed", r => {if(r.url().includes("iconify")) console.log("Ícones rede",r.url(),r.failure());});
        const views = [];
        try {
            await page.goto(base + "#/login");
            await page.locator("#modal-login[open]").waitFor();
            await assertPassword(page, "[data-alternar-senha=login-senha]", "#login-senha");
            await page.locator("#modal-login .modal__fechar").click();
            for (const width of [1280,768,375]) {
                await page.setViewportSize({width,height:960});
                for (const [hash, selector] of [
                    ["/inicio","#inicio-produtos .card-produto"],
                    ["/contato","#contato-form"], ["/o-liceu","h1"], ["/sobre","h1"],
                    ["/produtos",".card-produto"], ["/saberes","#saberes-grade li"],
                    ["/artesaos",".card-artesao"], ["/produto?id=vaso-ceramica-rustica","#produto-detalhes:not([hidden])"]
                ]) {
                    await route(page, hash, selector);
                    const result = await audit(page);
                    assert.deepEqual(result, {missing:[],icons:[],overflow:false}, hash + " " + width);
                    if (width === 1280) {
                        const tops = await page.locator(".barra-filtros__item, .liceu-filtros .campo").evaluateAll(xs =>
                            xs.filter(x => x.getBoundingClientRect().width).map(x => x.getBoundingClientRect().top));
                        if (tops.length > 1) assert.ok(Math.max(...tops)-Math.min(...tops)<2, "Filtros em linha: " + hash);
                    }
                    views.push({hash,width,...result});
                }
                await page.locator("a[href='#/login']").first().evaluate(x => x.click());
                await page.locator("#modal-login[open]").waitFor();
                await snapshot(page, `${name}-login-${width}`);
                await page.locator("#modal-login .modal__fechar").click();
            }
            await login(page, "artesao", false);
            await page.evaluate(async () => {
                const d = await import("./js/dados.js");
                await d.salvarTrabalho({titulo:"Rascunho UI",artesaoId:"ana-martins",status:"rascunho",categoria:"Decoração",tecnica:"Cerâmica",imagens:["assets/img/trabalhos/jogo-xicaras.jpg"]});
            });
            for (const width of [1280,768,375]) {
                await page.setViewportSize({width,height:960});
                for (const [hash, selector] of [
                    ["/painel-artesao","[data-resumo] .card-estatistica"],
                    ["/painel-artesao/meu-perfil","[data-form-perfil]"],
                    ["/painel-artesao/meus-trabalhos","[data-grade] .card-produto"],
                    ["/painel-artesao/novo-trabalho","#trabalho-categoria option[value='Decoração']"],
                    ["/painel-artesao/status-publicacoes","[data-linhas] tr"]
                ]) {
                    await route(page,hash,selector.includes("option")?"[data-form-trabalho]":selector);
                    const result = await audit(page);
                    assert.deepEqual(result,{missing:[],icons:[],overflow:false},hash + " " + width);
                    if (width === 1280) {
                        const tops = await page.locator(".barra-filtros__item, .liceu-filtros .campo").evaluateAll(xs =>
                            xs.filter(x => x.getBoundingClientRect().width).map(x => x.getBoundingClientRect().top));
                        if (tops.length > 1) assert.ok(Math.max(...tops)-Math.min(...tops)<2, "Filtros em linha: " + hash);
                    }
                    views.push({hash,width,...result});
                    if (hash.endsWith("meus-trabalhos")) {
                        const tops = await page.locator(".barra-filtros__item").evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top));
                        if(width===1280) assert.ok(Math.max(...tops)-Math.min(...tops)<2, "Filtros de trabalhos em linha");
                        const card = page.locator(".card-produto").filter({hasText:"Rascunho UI"});
                        assert.equal(await card.locator(".status[data-status=rascunho] iconify-icon").getAttribute("icon"),"lucide:file-text");
                        assert.equal(await card.getByRole("button",{name:"Rascunho",exact:true}).count(),0);
                        assert.equal(await card.locator("[data-acao=enviar] iconify-icon").getAttribute("icon"),"lucide:send");
                        assert.ok(await card.locator(".status iconify-icon").isVisible(), "Badge de rascunho mantém ícone");
                        assert.ok(await card.locator("[data-acao=enviar] iconify-icon").isVisible(), "Envio mantém ícone");
                        const menuWidth = await page.locator("[data-acao=menu]").evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().width));
                        assert.ok(menuWidth.every(x=>Math.abs(x-44)<0.1), "Todos os menus de trabalho são compactos");
                        await snapshot(page,`${name}-trabalhos-${width}`);
                        await card.locator("[data-acao=menu]").click();
                        for(const [attribute,icon] of [["editar","pencil"],["duplicar","copy"],["enviar","send"],["excluir","trash-2"]]) {
                            assert.equal(await page.locator(`dialog[open] [data-${attribute}] iconify-icon`).getAttribute("icon"),"lucide:"+icon);
                        }
                        await snapshot(page,`${name}-menu-${width}`);
                        await page.keyboard.press("Escape");
                        await card.locator("[data-acao=enviar]").click();
                        assert.equal(await page.locator("dialog[open] [data-confirmar] iconify-icon").getAttribute("icon"),"lucide:send");
                        await snapshot(page,`${name}-confirmar-envio-${width}`);
                        await page.keyboard.press("Escape");
                    }
                }
            }
            await login(page,"liceu",false);
            for(const width of [1280,768,375]) {
                await page.setViewportSize({width,height:960});
                for(const [hash,selector] of [
                    ["/painel-liceu","[data-resumo] .card-estatistica"],
                    ["/painel-liceu/trabalhos-pendentes","[data-acao=analisar]"],
                    ["/painel-liceu/publicacoes","[data-acao=ver]"],
                    ["/painel-liceu/configuracoes",".lista-taxonomias"],
                    ["/painel-liceu/artesaos","[data-corpo] tr:visible"],
                    ["/painel-liceu/cadastrar-artesao","#cad-senha"]
                ]) {
                    await route(page,hash,selector);
                    const result=await audit(page);
                    assert.deepEqual(result,{missing:[],icons:[],overflow:false},hash+" "+width);
                    if (width === 1280) {
                        const tops = await page.locator(".barra-filtros__item, .liceu-filtros .campo").evaluateAll(xs =>
                            xs.filter(x => x.getBoundingClientRect().width).map(x => x.getBoundingClientRect().top));
                        if (tops.length > 1) assert.ok(Math.max(...tops)-Math.min(...tops)<2, "Filtros em linha: " + hash);
                    }
                    if (width === 1280) {
                        const tops = await page.locator(".barra-filtros__item, .liceu-filtros .campo").evaluateAll(xs => xs.filter(x=>x.getBoundingClientRect().width).map(x=>x.getBoundingClientRect().top));
                        if(tops.length>1) assert.ok(Math.max(...tops)-Math.min(...tops)<2, "Filtros em linha: "+hash);
                    }
                    views.push({hash,width,...result});
                    if(hash.endsWith("configuracoes")) {
                        assert.equal(await page.locator(".lista-taxonomias").count(),2);
                        assert.equal(await page.locator(".lista-taxonomias .chip").count(),14);
                        if (width === 1280) {
                            const heights = await page.locator(".liceu-bloco-config__cabecalho").evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height));
                            assert.equal(heights[0],heights[1]);assert.equal(heights[2],heights[3]);
                        }
                        await snapshot(page,`${name}-configuracoes-${width}`);
                    }
                    if(hash.endsWith("cadastrar-artesao")) {
                        await assertPassword(page,"[data-alternar-senha=cad-senha]","#cad-senha");
                        await assertPassword(page,"[data-alternar-senha=cad-confirmar]","#cad-confirmar");
                    }
                    if(hash.endsWith("publicacoes")) {
                        const sizes=await page.locator("[data-corpo] tr:visible").first().locator(".btn--icone").evaluateAll(xs=>xs.map(x=>[x.getBoundingClientRect().width,x.getBoundingClientRect().height]));
                        assert.deepEqual(sizes,[[44,44],[44,44],[44,44],[44,44]]);
                        await page.locator("[data-acao=ver]:visible").first().click();
                        assert.equal(await page.locator("dialog[open] .detalhe-trabalho dl dt").count(),3);
                        await snapshot(page,`${name}-publicacao-${width}`);
                        await page.keyboard.press("Escape");
                    }
                    if(hash.endsWith("trabalhos-pendentes")) {
                        await page.locator("[data-acao=analisar]:visible").first().click();
                        assert.equal(await page.locator("[data-aprovar] iconify-icon").getAttribute("icon"),"lucide:circle-check");
                        assert.equal(await page.locator("[data-rejeitar] iconify-icon").getAttribute("icon"),"lucide:circle-x");
                        await page.locator("[data-rejeitar]").click();
                        await page.locator("[data-motivo]:not([hidden])").waitFor();
                        assert.equal(await page.locator("[data-rejeitar] iconify-icon").getAttribute("icon"),"lucide:circle-x");
                        await snapshot(page,`${name}-analise-rejeicao-${width}`);
                        await page.keyboard.press("Escape");
                    }
                }
            }
            assert.deepEqual(errors,[]);
            reports.push({browser:name,views,errors});
            console.log(name+": "+views.length+" telas/breakpoints; ações, status, modais e senha válidos.");
        } finally { await browser.close(); }
        const profile=fs.mkdtempSync(path.join(os.tmpdir(),"liceu-remember-"));
        let persistent=await engine.launchPersistentContext(profile,{headless:true});
        let remembered=await persistent.newPage();
        await login(remembered,"liceu",true);
        await remembered.reload();await remembered.locator(".painel__titulo").waitFor();
        const another=await persistent.newPage();await another.goto(base+"#/painel-liceu");await another.locator(".painel__titulo").waitFor();
        await persistent.close();
        persistent=await engine.launchPersistentContext(profile,{headless:true});
        remembered=await persistent.newPage();await remembered.goto(base+"#/painel-liceu");await remembered.locator(".painel__titulo").waitFor();
        await remembered.locator("[data-acao=sair]").click();await remembered.locator("[data-confirmar-sair]").click();
        assert.equal(await remembered.evaluate(()=>localStorage.getItem("liceu:sessao")),null);
        await login(remembered,"artesao",false);
        await remembered.reload();await remembered.locator(".painel__titulo").waitFor();
        assert.ok(await remembered.evaluate(()=>sessionStorage.getItem("liceu:sessao")));
        assert.equal(await remembered.evaluate(()=>localStorage.getItem("liceu:sessao")),null);
        await remembered.close();
        const temporary=await persistent.newPage();await temporary.goto(base+"#/painel-artesao");await temporary.locator("#modal-login[open]").waitFor();
        await persistent.close();fs.rmSync(profile,{recursive:true,force:true});
        console.log(name+": lembrar/reload/nova aba/reinício real do navegador/logout/sessão temporária passaram.");
    }
    fs.writeFileSync(path.join(artifacts,"ui-report.json"),JSON.stringify(reports,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
