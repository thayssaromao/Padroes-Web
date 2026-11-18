const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.PORTAL_URL || 'http://127.0.0.1:8091/';
const artifacts=process.env.RELATORIO_DIR || require('node:path').join(require('node:os').tmpdir(),'liceu-fluxos');
fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const reports=[];
 for(const [name,engine] of Object.entries({chromium,firefox})) {
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[],http=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400 && r.url().startsWith(base))http.push([r.status(),r.url()]);});
  page.setDefaultTimeout(10000);
  async function route(hash,selector='h1') {await page.goto(base+'#'+hash,{waitUntil:'domcontentloaded'});await page.locator('#conteudo '+selector).first().waitFor();}
  async function login(email,password){await page.goto(base+'#/login');await page.locator('#modal-login[open]').waitFor();await page.fill('#login-email',email);await page.fill('#login-senha',password);await page.locator('.modal-login__entrar').click();await page.locator('.painel__titulo').waitFor();await page.locator('#conteudo h1').waitFor();}
  async function logout(){await page.locator('[data-acao="sair"]').click();await page.locator('[data-confirmar-sair]').click();await page.waitForFunction(()=>location.hash==='#/inicio');await page.locator('#conteudo h1').waitFor();}
  async function stored(title){return page.evaluate(title=>JSON.parse(localStorage.getItem('liceu:base:v1')).trabalhos.find(t=>t.titulo===title),title);}
  async function create(title){await route('/painel-artesao/novo-trabalho','[data-form-trabalho]');await page.fill('#trabalho-nome',title);await page.selectOption('#trabalho-categoria','Decoração');await page.selectOption('#trabalho-tecnica','Cerâmica');await page.fill('#trabalho-descricao','Peça para validação ponta a ponta.');await page.locator('[data-form-trabalho] [type=submit]').click();await page.locator('[data-confirmar]').click();await page.waitForFunction(()=>location.hash.includes('status-publicacoes'));await page.locator('[data-linhas] tr').first().waitFor();return await stored(title);}
  async function analyze(id,reject=false){await route('/painel-liceu/trabalhos-pendentes','[data-acao="analisar"]');await page.locator('[data-busca]').fill((await page.evaluate(id=>JSON.parse(localStorage.getItem('liceu:base:v1')).trabalhos.find(t=>t.id===id).titulo,id)));await page.locator(`[data-acao="analisar"][data-id="${id}"]`).click();await page.locator('dialog[open] form').waitFor();if(reject){await page.locator('[data-rejeitar]').click();await page.fill('textarea[name=motivo]','Melhorar a descrição da peça.');await page.locator('[data-rejeitar]').click();}else await page.locator('[data-aprovar]').click();await page.locator('dialog[open]').waitFor({state:'hidden'});}
  try{
   await page.goto(base+'#/painel-liceu/artesaos');await page.locator('#modal-login[open]').waitFor();assert.equal(await page.locator('.painel__titulo').count(),0);await page.locator('#modal-login .modal__fechar').click();
   await login('ana@exemplo.com','artesao123');
   await page.reload();await page.locator('.painel__titulo').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('liceu:sessao')).artesaoId),'ana-martins');
   const a=await create('Fluxo aprovado '+name);
   assert.equal(a.status,'em-analise');
   await logout();await login('liceu@exemplo.com','liceu123');await analyze(a.id);assert.equal((await stored(a.titulo)).status,'publicado');
   await logout();await route('/produto?id='+a.id,'#produto-detalhes:not([hidden]) h1');assert.equal(await page.locator('h1').textContent(),a.titulo);
   await login('ana@exemplo.com','artesao123');const b=await create('Fluxo rejeitado '+name);await logout();await login('liceu@exemplo.com','liceu123');await analyze(b.id,true);assert.equal((await stored(b.titulo)).status,'rejeitado');
   await logout();await login('ana@exemplo.com','artesao123');await route('/painel-artesao/status-publicacoes','[data-linhas] tr');
   const row=page.locator('[data-linhas] tr').filter({hasText:b.titulo});await row.locator('[data-acao="motivo"]').click();assert.match(await page.locator('dialog[open]').innerText(),/Melhorar a descrição/);await page.locator('dialog[open]').getByRole('button',{name:'Editar e reenviar',exact:true}).click();await page.locator('#trabalho-nome').waitFor();assert.equal(await page.inputValue('#trabalho-nome'),b.titulo);await page.fill('#trabalho-descricao','Descrição corrigida com mais detalhes.');await page.locator('[data-form-trabalho] [type=submit]').click();await page.locator('[data-confirmar]').click();await page.waitForFunction(()=>location.hash.includes('status-publicacoes'));assert.equal((await stored(b.titulo)).status,'reenviado');
   await logout();await login('liceu@exemplo.com','liceu123');await route('/painel-liceu/trabalhos-pendentes','[data-acao="analisar"]');assert.equal(await page.locator(`[data-acao="analisar"][data-id="${b.id}"]`).count(),1);
   await route('/painel-liceu/cadastrar-artesao','[data-formulario]');await page.fill('#cad-nome','Artesã teste '+name);await page.fill('#cad-email',name+'@teste.local');await page.fill('#cad-senha','teste123');await page.fill('#cad-confirmar','teste123');await page.fill('#cad-empreendimento','Ateliê teste');await page.selectOption('#cad-categoria','Decoração');await page.selectOption('#cad-tecnicas','Cerâmica');await page.fill('#cad-whatsapp','41999998888');await page.locator('[data-formulario] [type=submit]').click();await page.waitForFunction(()=>location.hash.endsWith('/artesaos'));await page.locator('[data-busca]').fill('Artesã teste '+name);await page.locator('[data-corpo] tr:visible').first().waitFor();assert.match(await page.locator('[data-corpo]').innerText(),/Artesã teste/);
   await logout();await login(name+'@teste.local','teste123');assert.equal(await page.locator('[data-usuario-nome]').textContent(),'Artesã teste '+name);
   await route('/painel-liceu');await page.locator('#modal-login[open]').waitFor();assert.equal(await page.locator('[data-painel-titulo]').textContent(),'Área do Artesão');await page.locator('#modal-login .modal__fechar').click();
   await page.screenshot({path:artifacts+'/'+name+'-core.png',fullPage:true});
   assert.deepEqual(errors,[]);assert.deepEqual(http,[]);reports.push({browser:name,approval:true,rejectionResubmission:true,adminRegistrationLogin:true,sessionReload:true,routeGuards:true,errors,http});console.log(JSON.stringify(reports.at(-1)));
  }catch(e){console.log(name,'FAILED',e);await page.screenshot({path:artifacts+'/'+name+'-failure.png',fullPage:true});console.log(await page.locator('body').innerText());throw e;}finally{await browser.close();}
 }
 fs.writeFileSync(artifacts+'/core-report.json',JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
