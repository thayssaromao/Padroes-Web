/** Contraste da identidade: tokens e texto renderizado, sem dependências novas. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PORTAL_URL || 'http://127.0.0.1:8091/';
const dir = path.join(process.env.RELATORIO_DIR || '/tmp/liceu-validacao-final', 'identidade');
function luminance(rgb) {
    const c = rgb.slice(0,3).map(v => {v /= 255;return v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4;});
    return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;
}
function contrast(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
async function audit(page, label) {
    // Aguarda a pintura do estado com reducedMotion; evita amostrar o quadro anterior.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
    const samples = await page.evaluate(() => {
        const parse = value => (value.match(/[\d.]+/g)||[]).map(Number);
        function background(el) {
            const layers=[];
            while(el){const c=parse(getComputedStyle(el).backgroundColor);layers.push(c);if(c[3]===undefined||c[3]>=1)break;el=el.parentElement;}
            let result=[255,255,255];
            for(const c of layers.reverse()){const a=c[3]??1;result=result.map((v,i)=>c[i]*a+v*(1-a));}
            return result;
        }
        return [...document.querySelectorAll('body *')].flatMap(el => {
            const style=getComputedStyle(el), rect=el.getBoundingClientRect();
            if(!rect.width||!rect.height||style.visibility!=='visible'||Number(style.opacity)===0
                ||el.closest('script,style,svg,iconify-icon,select,option,[aria-hidden="true"],[disabled],[aria-disabled="true"]'))return [];
            const direct=[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
            const input=el.matches('input:not([type=checkbox]):not([type=radio]),textarea');
            if(!direct&&!input)return [];
            const item={selector:el.id||el.className||el.tagName,text:el.textContent.trim().slice(0,60),foreground:parse(style.color),background:background(el)};
            const result=[item];
            if(input&&el.placeholder){result.push({...item,text:'placeholder',foreground:parse(getComputedStyle(el,'::placeholder').color)});}
            return result;
        });
    });
    const stats=await page.locator('.card-estatistica').evaluateAll(cards=>cards.flatMap(card=>{
        const tokens={'lucide:circle-check':'--cor-sucesso-fundo','lucide:clock':'--cor-alerta-fundo','lucide:circle-x':'--cor-erro-fundo','lucide:file-text':'--cor-rascunho-fundo'};
        const token=tokens[card.querySelector('iconify-icon')?.getAttribute('icon')];if(!token)return [];
        const probe=document.createElement('span');probe.style.backgroundColor=`var(${token})`;card.append(probe);
        const expected=getComputedStyle(probe).backgroundColor;probe.remove();
        return [{label:card.textContent,actual:getComputedStyle(card).backgroundColor,expected}];
    }));
    for(const stat of stats) assert.equal(stat.actual,stat.expected,label+' — estado da estatística '+stat.label);
    const failures=samples.map(s=>({...s,ratio:contrast(s.foreground,s.background)})).filter(s=>s.ratio<4.5);
    assert.deepEqual(failures,[],label+' — contraste de texto');
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth+1),label+' — overflow');
    return samples.length;
}
async function tokenPairs(page) {
    const pairs=[
        ['--cor-texto','--cor-fundo'],['--cor-texto-suave','--cor-editorial'],['--cor-texto-apagado','--cor-editorial-alternada'],
        ['--cor-texto-invertido','--cor-primaria'],['--cor-texto-invertido','--cor-primaria-hover'],
        ['--cor-nav-texto','--cor-barra'],['--cor-nav-texto','--cor-lateral'],['--cor-nav-texto','--cor-nav-hover'],
        ['--cor-texto','--cor-lateral-ativo'],['--cor-link-barra-hover','--cor-barra'],
        ['--cor-texto','--cor-destaque'],['--cor-link','--cor-secundaria'],
        ['--cor-texto-invertido','--cor-favorito'],['--cor-texto-invertido','--cor-erro'],
        ['--cor-sucesso','--cor-sucesso-fundo'],['--cor-alerta','--cor-alerta-fundo'],
        ['--cor-erro','--cor-erro-fundo'],['--cor-informacao','--cor-informacao-fundo'],
        ['--cor-rascunho','--cor-rascunho-fundo'],['--cor-desabilitado-texto','--cor-desabilitado']
    ];
    const controls=[['--cor-foco','--cor-campo'],['--cor-borda-controle','--cor-campo'],['--cor-destaque','--cor-barra'],['--cor-primaria','--cor-fundo']];
    const resolved=await page.evaluate(pairs=>pairs.map(([a,b])=>{
        const probe=document.createElement('span');probe.style.color=`var(${a})`;probe.style.backgroundColor=`var(${b})`;document.body.append(probe);
        const st=getComputedStyle(probe),parse=s=>s.match(/[\d.]+/g).map(Number);
        const result={a,b,foreground:parse(st.color),background:parse(st.backgroundColor)};probe.remove();return result;
    }),[...pairs,...controls]);
    return resolved.map((s,i)=>{const ratio=contrast(s.foreground,s.background);assert.ok(ratio>=(i<pairs.length?4.5:3),JSON.stringify({...s,ratio}));return {text:s.a,surface:s.b,ratio:Number(ratio.toFixed(2))};});
}
async function route(page,hash,selector) {
    await page.goto(base+'#/'+hash);
    if(hash.startsWith('painel-')) await page.locator('.painel__link[aria-current=page][href="#/'+hash+'"]').waitFor({state:'attached'});
    await page.locator('#conteudo '+selector).first().waitFor({state:'attached'});
    await page.evaluate(()=>document.fonts.ready);
}
(async()=>{
    fs.mkdirSync(dir,{recursive:true});const reports=[];
    for(const [name,engine]of Object.entries({chromium,firefox})){
        const browser=await engine.launch();try{
            const page=await browser.newPage({reducedMotion:'reduce'});let samples=0;
            await route(page,'inicio','#inicio-produtos .card');const pairs=await tokenPairs(page);
            for(const width of[1280,768,375]){
                await page.setViewportSize({width,height:960});
                for(const [hash,selector]of[['inicio','#inicio-produtos .card'],['produtos','#gradeProdutos .card'],['artesaos','#artesaos-grade .card'],['saberes','#saberes-grade .card'],['produto?id=vaso-ceramica-rustica','#produto-detalhes:not([hidden])'],['o-liceu','h1'],['contato','h1']]){
                    await route(page,hash,selector);samples+=await audit(page,name+' '+hash+' '+width);
                }
                await route(page,'produtos','#selectOrdenacao-controle');await page.locator('#selectOrdenacao-controle').click();samples+=await audit(page,'menu aberto');await page.keyboard.press('Escape');
                await page.locator('#btnSomenteFavoritos').click();samples+=await audit(page,'favoritos ativos');
                await route(page,'saberes','#saberes-grade [data-tecnica]');await page.locator('[data-tecnica]').first().click();samples+=await audit(page,'modal saber');await page.keyboard.press('Escape');
            }
            for(const [role,email,password]of[['artesao','ana@exemplo.com','artesao123'],['liceu','liceu@exemplo.com','liceu123']]){
                await page.goto(base+'#/login');await page.locator('#modal-login[open]').waitFor();samples+=await audit(page,'login');
                await page.fill('#login-email',email);await page.fill('#login-senha',password);await page.locator('.modal-login__entrar').click();await page.locator('[data-painel-titulo]').waitFor({state:'attached'});
                for(const width of[1280,768,375]){
                    await page.setViewportSize({width,height:960});
                    const routes=role==='liceu'?['','/artesaos','/trabalhos-pendentes','/publicacoes','/configuracoes']:['','/meu-perfil','/meus-trabalhos','/novo-trabalho','/status-publicacoes'];
                    for(const tail of routes){await route(page,'painel-'+role+tail,'h1');samples+=await audit(page,role+tail+' '+width);}
                    if(width===375){await page.locator('.painel__menu').click();samples+=await audit(page,'sidebar mobile');await page.keyboard.press('Escape');}
                }
            }
            const report={browser:name,widths:[1280,768,375],textSamples:samples,tokenPairs:pairs,failures:[]};reports.push(report);console.log(JSON.stringify({browser:name,textSamples:samples,tokenPairs:pairs.length,failures:[]}));
        }finally{await browser.close();}
    }
    fs.writeFileSync(path.join(dir,'contraste.json'),JSON.stringify(reports,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
