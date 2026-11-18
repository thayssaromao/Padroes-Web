/** Casos da rodada adicional; dados e armazenamento em contextos próprios. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8091/";
const dir = path.join(process.env.RELATORIO_DIR || "/tmp/liceu-validacao-final", "rodada-atual", "depois");
async function route(page, hash, selector) {
    await page.goto(base + "#/" + hash);
    await page.locator("#conteudo " + selector).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
}
async function shot(page, name) {
    if (await page.locator(".aviso-flutuante").count()) await page.locator(".aviso-flutuante").waitFor({state:"hidden"});
    const overlay = await page.locator("dialog[open], :popover-open").count();
    if (!overlay) await page.evaluate(() => scrollTo(0,0));
    await page.screenshot({path:path.join(dir,name+".png"),fullPage:!overlay});
}
async function fits(page) {
    assert.ok(await page.locator("html").evaluate(x=>x.scrollWidth<=innerWidth+1));
    assert.equal(await page.locator("select:not([multiple]):not(.seletor__nativo)").count(),0);
    for (const modal of await page.locator("dialog[open]").all()) assert.ok(await modal.evaluate(x=>x.scrollWidth<=x.clientWidth+1));
}
async function login(page, role, email) {
    await page.goto(base + "#/login");
    await page.locator("#modal-login[open]").waitFor();
    await page.fill("#login-email",email || (role==="liceu"?"liceu@exemplo.com":"ana@exemplo.com"));
    await page.fill("#login-senha",role==="liceu"?"liceu123":"artesao123");
    await page.locator(".modal-login__entrar").click();
    await page.locator(".painel__titulo").waitFor({state:"attached"});
}
async function menu(page, id, name) {
    const control=page.locator("#"+id+"-controle");
    await control.scrollIntoViewIfNeeded();
    const before=await page.locator("#"+id).inputValue();
    await control.press("Enter");
    const list=page.locator("#"+id+"-opcoes");
    await list.waitFor();
    const rect=await list.boundingBox(), view=page.viewportSize();
    assert.ok(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=view.width+1 && rect.y+rect.height<=view.height+1, JSON.stringify(rect));
    assert.ok(await list.locator("[role=option]:visible").count());
    await control.press("ArrowDown");
    assert.ok(await control.getAttribute("aria-activedescendant"));
    await control.press("Escape");
    assert.equal(await page.locator("#"+id).inputValue(),before);
    assert.equal(await control.getAttribute("aria-expanded"),"false");
    await control.press("Enter");
    if(name) await shot(page,name);
    await control.press("Escape");
}
async function profile(page, width, name) {
    await route(page,"painel-artesao/meu-perfil","#perfil-nome");
    await page.waitForFunction(()=>Boolean(document.querySelector("#perfil-nome")?.value));
    const originalName=await page.inputValue("#perfil-nome"), originalEmail=await page.inputValue("#perfil-email");
    const before=await page.evaluate(()=>localStorage.getItem("liceu:base:v1"));
    for(const [field,value,message]of [["nome","","nome completo"],["nome","   ","nome completo"],["email","","e-mail"],["email","invalido","e-mail válido"]]){
        await page.fill("#perfil-nome",originalName);await page.fill("#perfil-email",originalEmail);
        await page.fill("#perfil-"+field,value);await page.locator("[data-form-perfil] [type=submit]").click();
        assert.match(await page.locator("#perfil-feedback").innerText(),new RegExp(message));
        assert.equal(await page.evaluate(()=>localStorage.getItem("liceu:base:v1")),before);
    }
    await page.fill("#perfil-nome",originalName);await page.fill("#perfil-email","carlos@exemplo.com");
    await page.locator("[data-form-perfil] [type=submit]").click();
    await page.waitForFunction(()=>document.querySelector("#perfil-feedback").textContent.includes("cadastrado"));
    assert.equal(await page.evaluate(()=>localStorage.getItem("liceu:base:v1")),before);
    await page.fill("#perfil-email",originalEmail);
    assert.match(await page.locator("label[for=perfil-nome]").innerText(),/\*/);
    assert.match(await page.locator("label[for=perfil-email]").innerText(),/\*/);
    await menu(page,"perfil-categoria",`${name}-seletor-perfil-${width}`);
    const control=page.locator("#perfil-categoria-controle");
    await page.locator("#perfil-categoria").evaluate(x=>{x.disabled=true;});
    await page.waitForFunction(()=>document.querySelector("#perfil-categoria-controle").disabled);
    assert.equal(await control.isDisabled(),true);
    await page.locator("#perfil-categoria").evaluate(x=>{x.disabled=false;x.add(new Option("Opção dinâmica de teste","dinamica"));});
    await page.waitForFunction(()=>document.querySelector("#perfil-categoria-opcoes").textContent.includes("Opção dinâmica de teste"));
    await page.locator("#perfil-categoria").evaluate(x=>x.options[x.options.length-1].remove());
    await page.waitForFunction(()=>!document.querySelector("#perfil-categoria-opcoes").textContent.includes("Opção dinâmica de teste"));
    await control.press("Enter");await control.press("End");await control.press("Enter");
    assert.equal(await page.inputValue("#perfil-categoria"),"Outros");
    await page.selectOption("#perfil-categoria","Decoração");
    assert.match(await control.innerText(),/Decoração/);
    await page.locator("#perfil-tecnica-controle").click();
    await page.getByRole("option",{name:"Madeira",exact:true}).click();
    assert.equal(await page.inputValue("#perfil-tecnica"),"");
    assert.match(await page.locator("#perfil-tecnica-controle").innerText(),/Selecione/);
    await fits(page);await shot(page,`${name}-perfil-${width}`);
    if(width===1280){
        await page.fill("#perfil-email","ana.rodada@exemplo.com");
        await page.locator("[data-form-perfil] [type=submit]").click();
        await page.waitForFunction(()=>document.querySelector("[type=submit]")?.disabled===false);
        await page.reload();await page.locator("#perfil-email").waitFor();
        await page.waitForFunction(()=>document.querySelector("#perfil-email")?.value==="ana.rodada@exemplo.com");
        assert.equal(await page.inputValue("#perfil-email"),"ana.rodada@exemplo.com");
        const another=await page.context().newPage();await login(another,"artesao","ana.rodada@exemplo.com");
        assert.equal(await another.locator("#modal-login[open]").count(),0);await another.close();
    }
}
async function favoriteFlow(page, name) {
    await route(page,"produtos","#gradeProdutos .card");
    const originalBase=await page.evaluate(()=>localStorage.getItem("liceu:base:v1"));
    await page.locator("#btnSomenteFavoritos").click();
    assert.match(await page.locator("#gradeProdutos").innerText(),/Nenhum favorito/);
    await page.locator("#btnSomenteFavoritos").click();
    await page.locator("[data-favorito]").first().click();
    const id=await page.locator("[data-favorito][aria-pressed=true]").first().getAttribute("data-favorito");
    await page.locator("#btnSomenteFavoritos").click();
    assert.equal(await page.locator("#gradeProdutos .card").count(),1);
    await page.fill("#inputBusca","zzznada");assert.match(await page.locator("#gradeProdutos").innerText(),/Nenhum favorito/);
    await page.fill("#inputBusca","");
    await page.locator("[data-categoria=Utilitários]").click();assert.equal(await page.locator("#gradeProdutos .card").count(),0);
    await page.locator("[data-categoria=Todos]").click();
    await page.selectOption("#selectOrdenacao","menor_preco");
    assert.equal(await page.locator("#gradeProdutos .card").count(),1);
    await page.reload();await page.locator("#gradeProdutos .card").first().waitFor();
    assert.equal(await page.locator(`[data-favorito="${id}"]`).getAttribute("aria-pressed"),"true");
    await page.locator("#btnSomenteFavoritos").click();
    await page.locator("[data-favorito]").click();assert.equal(await page.locator("#gradeProdutos .card").count(),0);
    await page.locator("#btnLimparFiltros").click();
    for(const item of await page.locator("#gradeProdutos [data-favorito]").all()) await item.click();
    await page.locator("#paginacaoCatalogo [data-pagina='2']:not(.paginacao__botao--seta)").click();
    await page.locator("#gradeProdutos [data-favorito]").click();
    const ids=await page.evaluate(()=>JSON.parse(localStorage.getItem("liceu:favoritos")));
    assert.equal(ids.length,9);assert.equal(new Set(ids).size,9);
    await page.locator("#btnSomenteFavoritos").click();
    await page.locator("#paginacaoCatalogo [data-pagina='2']:not(.paginacao__botao--seta)").click();
    await page.locator("#gradeProdutos [data-favorito]").click();
    assert.equal(await page.locator("#gradeProdutos .card").count(),8);
    assert.equal(await page.locator("#paginacaoCatalogo").isVisible(),false);
    const other=await page.context().newPage();
    await route(other,"produto?id="+ids[0],"#produto-detalhes:not([hidden])");
    await other.locator("#produto-favorito").click();
    await page.waitForFunction(()=>document.querySelectorAll("#gradeProdutos .card").length===7);
    await other.close();
    assert.equal(await page.evaluate(()=>localStorage.getItem("liceu:base:v1")),originalBase);
    await shot(page,`${name}-favoritos-1280`);
}
(async()=>{
    fs.mkdirSync(dir,{recursive:true});const reports=[];
    for(const[name,engine]of Object.entries({chromium,firefox})){
        const browser=await engine.launch({headless:true});const errors=[];
        try{
            const context=await browser.newContext({reducedMotion:"reduce"});const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));await login(page,"artesao");
            for(const width of[1280,768,375]){
                await page.setViewportSize({width,height:960});await profile(page,width,name);
                await route(page,"painel-artesao/meus-trabalhos","[data-grade] .card");
                const cards=await page.locator("[data-grade] .card").evaluateAll(xs=>xs.map(x=>({top:Math.round(x.getBoundingClientRect().top),bottom:x.querySelector(".artesao-botoes").getBoundingClientRect().bottom,border:getComputedStyle(x.querySelector(".card-produto__acoes")).borderTopWidth})));
                assert.ok(cards.every(x=>x.border==="0px"));
                for(const top of new Set(cards.map(x=>x.top))){const line=cards.filter(x=>x.top===top).map(x=>x.bottom);assert.ok(Math.max(...line)-Math.min(...line)<2);}
                const rejected=page.locator(".card").filter({has:page.locator(".status[data-status=rejeitado]")});
                const info=rejected.locator("[data-acao=motivo]");assert.equal(await info.evaluate(x=>x.getBoundingClientRect().width),44);
                assert.equal(await info.locator("iconify-icon").evaluate(x=>getComputedStyle(x).fontSize),"16px");
                await info.click();await page.locator("dialog[open]").waitFor();await fits(page);await page.keyboard.press("Escape");await shot(page,`${name}-trabalhos-${width}`);
                await route(page,"painel-artesao/status-publicacoes","[data-linhas] tr");
                for(const id of["status-filtro","status-ordem"]){assert.ok(await page.locator('#'+id+'-controle').evaluate(x=>x.scrollWidth<=x.clientWidth+1));await menu(page,id);}
                await fits(page);await shot(page,`${name}-status-${width}`);
                await route(page,"painel-artesao/novo-trabalho","#trabalho-categoria-controle");await menu(page,"trabalho-categoria");await menu(page,"trabalho-tecnica",`${name}-seletor-novo-${width}`);
                await page.locator("#trabalho-categoria").evaluate(x=>x.reportValidity());assert.equal(await page.locator("#trabalho-categoria-controle").getAttribute("aria-invalid"),"true");
                await fits(page);await shot(page,`${name}-novo-${width}`);
            }
            const adminContext=await browser.newContext({reducedMotion:"reduce"});const admin=await adminContext.newPage();admin.on("pageerror",e=>errors.push(e.message));await login(admin,"liceu");
            for(const width of[1280,768,375]){
                await admin.setViewportSize({width,height:960});
                for(const [hash,selector,label]of[["artesaos","[data-corpo] tr:visible","artesaos"],["publicacoes","[data-acao=ver]","publicacoes"],["trabalhos-pendentes","[data-acao=analisar]","pendentes"]]){
                    await route(admin,"painel-liceu/"+hash,selector);await fits(admin);const first=await admin.locator(".liceu-filtros select").first().getAttribute("id");await menu(admin,first,`${name}-seletor-${label}-${width}`);await shot(admin,`${name}-${label}-${width}`);
                    if(hash!=="trabalhos-pendentes"){
                        await admin.locator("[data-acao=editar]:visible").first().click();await admin.locator("dialog[open]").waitFor();await fits(admin);
                        const select=admin.locator("dialog[open] select:not([multiple])").first();if(await select.count()){const id=await select.getAttribute("id");await menu(admin,id);assert.equal(await admin.locator("dialog[open]").count(),1);}
                        await shot(admin,`${name}-editar-${hash==="artesaos"?"artesao":"publicacao"}-${width}`);await admin.keyboard.press("Escape");
                    }
                }
            }
            const publicContext=await browser.newContext({reducedMotion:"reduce"});const pub=await publicContext.newPage();pub.on("pageerror",e=>errors.push(e.message));
            for(const width of[1280,768,375]){
                await pub.setViewportSize({width,height:960});await route(pub,"produto?id=vaso-ceramica-rustica","#produto-detalhes:not([hidden])");await fits(pub);
                if(width===1280){const boxes=await pub.locator(".produto-contexto .btn").evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().bottom));assert.ok(Math.abs(boxes[0]-boxes[1])<2);}
                await shot(pub,`${name}-produto-${width}`);
                if(width===1280){
                    await pub.locator(".produto-bio").evaluate(x=>{x.textContent=x.textContent.repeat(8);x.focus();});
                    assert.ok(await pub.locator(".produto-bio").evaluate(x=>x.scrollHeight>x.clientHeight&&x.tabIndex===0));
                    const bottoms=await pub.locator(".produto-contexto .btn").evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().bottom));
                    assert.ok(Math.abs(bottoms[0]-bottoms[1])<2);
                    await shot(pub,`${name}-produto-bio-longa-${width}`);
                }
                await route(pub,"saberes","#saberes-grade [data-tecnica]");const trigger=pub.locator("[data-tecnica]").first();await trigger.click();await pub.locator("#saber-detalhe[open]").waitFor();await fits(pub);assert.ok(await pub.locator("#saber-detalhe-produtos").evaluate(x=>x.scrollWidth<=x.clientWidth+1&&x.getBoundingClientRect().height>=44));await shot(pub,`${name}-saber-${width}`);await pub.keyboard.press("Escape");assert.equal(await trigger.evaluate(x=>x===document.activeElement),true);
                await route(pub,"produtos","#gradeProdutos .card");await fits(pub);await shot(pub,`${name}-catalogo-${width}`);
            }
            await pub.setViewportSize({width:1280,height:960});await favoriteFlow(pub,name);assert.deepEqual(errors,[]);
            const report={browser:name,widths:[1280,768,375],required:true,selectors:true,cards:true,modals:true,favorites:true,crossTabFavorites:true,errors};reports.push(report);console.log(JSON.stringify(report));
        }finally{await browser.close();}
    }
    fs.writeFileSync(path.join(dir,"report.json"),JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
