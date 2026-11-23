/** Regressões de teclado, acessibilidade móvel e recuperação de carregamento. */
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.PORTAL_URL || 'http://127.0.0.1:8091/';

(async () => {
    for (const [name, engine] of Object.entries({chromium, firefox})) {
        const browser = await engine.launch({headless: true});
        const context = await browser.newContext({viewport: {width: 375, height: 900}, reducedMotion: 'reduce'});
        // Acelera apenas o relógio do carrossel, sem alterar a lógica da aplicação.
        await context.addInitScript(() => {
            const interval = window.setInterval.bind(window);
            window.setInterval = (fn, delay, ...args) => interval(fn, delay === 6000 ? 100 : delay, ...args);
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        try {
            await page.goto(base + '#/inicio');
            await page.locator('#conteudo h1').waitFor();
            await page.keyboard.press('Tab');
            assert.equal(await page.locator('.pular-conteudo').evaluate(e => e === document.activeElement), true);
            await page.keyboard.press('Enter');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'conteudo');
            assert.equal(new URL(page.url()).hash, '#/inicio');

            await page.locator('.cabecalho__menu').focus();
            await page.keyboard.press('Enter');
            await page.locator('.nav-portal--aberto').waitFor();
            await page.waitForTimeout(50);
            await page.keyboard.press('Tab');
            assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('#nav'))), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('.cabecalho__menu').evaluate(e => e === document.activeElement), true);

            const track = page.locator('.carrossel__trilho').first();
            const original = await track.getAttribute('style');
            await page.waitForTimeout(250);
            assert.equal(await track.getAttribute('style'), original);
            await page.getByRole('button', {name: 'Retomar rotação', exact: true}).click();
            await page.locator('#conteudo').focus();
            await page.mouse.move(0, 0);
            await page.waitForFunction(before => document.querySelector('.carrossel__trilho').getAttribute('style') !== before, original);
            await page.getByRole('button', {name: 'Pausar rotação', exact: true}).click();
            await page.locator('#conteudo').focus();
            await page.mouse.move(0, 0);
            const paused = await track.getAttribute('style');
            await page.waitForTimeout(250);
            assert.equal(await track.getAttribute('style'), paused);

            await page.goto(base + '#/produtos');
            const accordion = page.locator('.acordeao-toggle').first();
            await accordion.focus();
            assert.equal(await accordion.evaluate(e => e.tagName), 'BUTTON');
            assert.equal(await accordion.getAttribute('aria-expanded'), 'true');
            await page.keyboard.press('Enter');
            assert.equal(await accordion.getAttribute('aria-expanded'), 'false');
            await page.keyboard.press('Space');
            assert.equal(await accordion.getAttribute('aria-expanded'), 'true');
            const control = page.locator('.chk-categoria').first();
            const size = await control.boundingBox();
            assert.ok(size.width >= 24 && size.height >= 24);

            await page.goto(base + '#/login');
            await page.fill('#login-email', 'ana@exemplo.com');
            await page.fill('#login-senha', 'artesao123');
            await page.check('[name=lembrar]');
            await page.locator('.modal-login__entrar').click();
            await page.locator('#conteudo h1').waitFor();
            const account = page.getByRole('button', {name: 'Menu da conta de Ana Martins Mock'});
            await account.waitFor();
            await page.getByRole('link', {name: 'Liceu de Ofícios — início do portal'}).first().waitFor();
            await page.goto(base + '#/painel-artesao/meu-perfil');
            await page.getByLabel('Selecionar foto do perfil', {exact: true}).waitFor({state: 'attached'});
            const remove = page.locator('.chip__remover').first();
            await remove.waitFor();
            const removeSize = await remove.boundingBox();
            assert.ok(removeSize.width >= 43.99 && removeSize.height >= 43.99, JSON.stringify(removeSize));

            for (const [route, file, expected] of [
                ['/inicio', 'pages/inicio.html', 'Portal do Artesão'],
                ['/painel-artesao', 'pages/layouts/painel.html', 'Área do artesão']
            ]) {
                const failure = await context.newPage();
                failure.on('pageerror', e => errors.push(e.message));
                await failure.route('**/' + file, r => r.abort());
                await failure.goto(base + '#' + route);
                await failure.getByRole('heading', {name: 'Não foi possível carregar esta página'}).waitFor();
                assert.match(await failure.locator('[role=alert]').innerText(), /conexão/);
                await failure.unroute('**/' + file);
                await failure.getByRole('button', {name: 'Tentar novamente'}).click();
                await failure.getByRole('heading', {name: expected, exact: true}).waitFor();
                await failure.close();
            }
            assert.deepEqual(errors, []);
            console.log(JSON.stringify({browser: name, skipLink: true, keyboardMenu: true,
                carouselPause: true, reducedMotion: true, nativeAccordion: true,
                mobileNames: true, uploadLabel: true, touchTargets: true,
                partialRetry: true, layoutRetry: true, errors}));
        } finally {
            await browser.close();
        }
    }
})().catch(e => {console.error(e); process.exitCode = 1;});
