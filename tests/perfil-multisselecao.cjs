/** Perfil: seleção múltipla compartilhada, prévia, descarte e persistência. */
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.PORTAL_URL || 'http://127.0.0.1:8091/';
(async () => {
    for (const [name, engine] of Object.entries({chromium, firefox})) {
        const browser = await engine.launch();
        const page = await browser.newPage({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
            await page.goto(base + '#/login');
            await page.fill('#login-email', 'ana@exemplo.com');
            await page.fill('#login-senha', 'artesao123');
            await page.locator('.modal-login__entrar').click();
            await page.locator('#conteudo h1').waitFor();
            await page.goto(base + '#/painel-artesao/meu-perfil');
            const categorias = page.locator('.multisselecao').filter({has: page.locator('legend', {hasText: 'Categorias'})});
            const tecnicas = page.locator('.multisselecao').filter({has: page.locator('legend', {hasText: 'Técnicas'})});
            await tecnicas.getByRole('checkbox', {name: 'Cerâmica', exact: true}).waitFor();
            assert.equal(await categorias.getByRole('checkbox', {name: 'Decoração', exact: true}).isChecked(), true);
            assert.equal(await tecnicas.getByRole('checkbox', {name: 'Cerâmica', exact: true}).isChecked(), true);
            await categorias.getByRole('checkbox', {name: 'Acessórios', exact: true}).check();
            await tecnicas.getByRole('checkbox', {name: 'Bordado', exact: true}).check();
            assert.match(await page.locator('[data-previa-categorias]').innerText(), /Acessórios/);
            assert.match(await page.locator('[data-previa-tecnicas]').innerText(), /Bordado/);
            await page.locator('[data-cancelar]').click();
            await page.locator('dialog[open] [data-confirmar]').click();
            await page.waitForFunction(() => !Array.from(document.querySelector('#perfil-categoria').selectedOptions).some(o => o.value === 'Acessórios'));
            assert.equal(await categorias.getByRole('checkbox', {name: 'Acessórios', exact: true}).isChecked(), false);
            assert.equal(await tecnicas.getByRole('checkbox', {name: 'Bordado', exact: true}).isChecked(), false);
            await categorias.getByRole('checkbox', {name: 'Acessórios', exact: true}).check();
            await tecnicas.getByRole('checkbox', {name: 'Bordado', exact: true}).check();
            await page.locator('[data-form-perfil] [type=submit]').click();
            await page.waitForFunction(() => JSON.parse(localStorage.getItem('liceu:base:v1')).artesaos
                .some(a => a.id === 'ana-martins' && a.categorias.includes('Acessórios') && a.tecnicas.includes('Bordado')));
            await page.reload();
            await tecnicas.getByRole('checkbox', {name: 'Bordado', exact: true}).waitFor();
            assert.equal(await categorias.getByRole('checkbox', {name: 'Acessórios', exact: true}).isChecked(), true);
            assert.equal(await tecnicas.getByRole('checkbox', {name: 'Bordado', exact: true}).isChecked(), true);
            await tecnicas.getByRole('checkbox', {name: 'Bordado', exact: true}).focus();
            await page.keyboard.press('Space');
            assert.equal(await tecnicas.getByRole('checkbox', {name: 'Bordado', exact: true}).isChecked(), false);
            assert.doesNotMatch(await page.locator('[data-previa-tecnicas]').innerText(), /Bordado/);
            for (const width of [320, 375, 768, 1440]) {
                await page.setViewportSize({width, height: 1000});
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            }
            // Novo/Editar trabalho usa as mesmas opções visuais, com múltiplas escolhas.
            await page.goto(base + '#/painel-artesao/novo-trabalho?id=travessa-ceramica');
            const utilitarios = page.getByRole('checkbox', {name: 'Utilitários', exact: true});
            const decoracao = page.getByRole('checkbox', {name: 'Decoração', exact: true});
            const ceramica = page.getByRole('checkbox', {name: 'Cerâmica', exact: true});
            await utilitarios.waitFor();
            assert.equal(await utilitarios.isChecked(), true);
            assert.equal(await ceramica.isChecked(), true);
            await decoracao.check();
            assert.equal(await utilitarios.isChecked(), true);
            assert.deepEqual(await page.locator('#trabalho-categoria').evaluate(e => Array.from(e.selectedOptions, o => o.value)), ['Decoração', 'Utilitários']);
            await page.reload();
            await utilitarios.waitFor();
            assert.equal(await utilitarios.isChecked(), true);
            await page.goto(base + '#/painel-artesao/novo-trabalho');
            await decoracao.waitFor();
            assert.equal(await page.locator('.multisselecao input:checked').count(), 0);
            assert.equal(await decoracao.evaluate(e => !e.validity.valid), true);
            await page.fill('#trabalho-nome', 'Validação das escolhas visíveis');
            await page.locator('[data-form-trabalho] [type=submit]').click();
            assert.equal(await decoracao.evaluate(e => e === document.activeElement), true);
            await decoracao.check();
            await ceramica.check();
            assert.equal(await decoracao.evaluate(e => e.validity.valid), true);
            assert.equal(await ceramica.evaluate(e => e.validity.valid), true);
            for (const width of [320, 375, 768, 1440]) {
                await page.setViewportSize({width, height: 1000});
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            }
            assert.deepEqual(errors, []);
            console.log(JSON.stringify({browser: name, initialSelection: true, livePreview: true,
                discard: true, persistedMultipleValues: true, keyboard: true, workMultipleSelection: true, workRequiredValidation: true, workEditValues: true, overflow: 0, errors}));
        } finally {
            await browser.close();
        }
    }
})().catch(error => {console.error(error); process.exitCode = 1;});
