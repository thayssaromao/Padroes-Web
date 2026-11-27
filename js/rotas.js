/*jslint browser */
/**
 * rotas.js — tabela de rotas da SPA (hash routing).
 *
 * Campos de cada rota (em ordem alfabética, exigência do JSLint):
 *   arquivo  parcial HTML carregada em <main id="conteudo">
 *   caminho  fragmento após o "#" (ex.: "/painel-liceu/artesaos")
 *   icone    ícone Iconify do item de menu do painel
 *   iniciar  carregador sob demanda (ver pagina()) que devolve a função
 *            da página, chamada após a parcial ser inserida
 *   layout   "portal" | "painel-liceu" | "painel-artesao"
 *   nome     rótulo exibido no menu
 *   titulo   título da aba do navegador
 *
 * Guia: docs/DESIGN.md §4 e §10.
 */

/**
 * Carrega o módulo da página só quando a rota é aberta.
 * @param {string} modulo caminho relativo a este arquivo
 * @param {string} nome função exportada que inicia a página
 * @returns {function(): Promise<function>} carregador da função
 */
function pagina(modulo, nome) {
    return function () {
        return import(modulo).then(function (exportado) {
            return exportado[nome];
        });
    };
}

const PAINEIS = Object.freeze({
    "painel-artesao": {titulo: "Área do Artesão"},
    "painel-liceu": {titulo: "Área do Liceu"}
});

const ROTAS = Object.freeze([
    {
        arquivo: "pages/cadastro.html",
        caminho: "/cadastro",
        iniciar: pagina("./paginas/cadastro.js", "iniciarCadastro"),
        layout: "portal",
        titulo: "Criar conta | Liceu"
    },

// ===== Portal (público) =====

    {
        arquivo: "pages/inicio.html",
        caminho: "/inicio",
        iniciar: pagina("./paginas/inicio.js", "iniciarInicio"),
        layout: "portal",
        titulo: "Portal do Artesão | Liceu"
    },
    {
        arquivo: "pages/produtos.html",
        caminho: "/produtos",
        iniciar: pagina("./produtos.js", "inicializarProdutos"),
        layout: "portal",
        titulo: "Produtos | Liceu"
    },
    {
        arquivo: "pages/produto.html",
        caminho: "/produto",
        iniciar: pagina("./paginas/produto.js", "iniciarProduto"),
        layout: "portal",
        titulo: "Produto | Liceu"
    },
    {
        arquivo: "pages/artesaos.html",
        caminho: "/artesaos",
        iniciar: pagina("./paginas/artesaos.js", "iniciarArtesaos"),
        layout: "portal",
        titulo: "Artesãos | Liceu"
    },
    {
        arquivo: "pages/saberes.html",
        caminho: "/saberes",
        iniciar: pagina("./paginas/saberes.js", "iniciarSaberes"),
        layout: "portal",
        titulo: "Saberes | Liceu"
    },
    {
        arquivo: "pages/o-liceu.html",
        caminho: "/o-liceu",
        layout: "portal",
        titulo: "O Liceu | Liceu"
    },
    {
        arquivo: "pages/contato.html",
        caminho: "/contato",
        iniciar: pagina("./paginas/contato.js", "iniciarContato"),
        layout: "portal",
        titulo: "Contato | Liceu"
    },
    {
        arquivo: "pages/sobre.html",
        caminho: "/sobre",
        layout: "portal",
        titulo: "Sobre o Projeto | UTFPR"
    },

// ===== Área do Liceu (restrita) =====

    {
        arquivo: "pages/painel-liceu/inicio.html",
        caminho: "/painel-liceu",
        icone: "lucide:house",
        iniciar: pagina("./paginas/painel-liceu/index.js", "iniciarLiceuInicio"),
        layout: "painel-liceu",
        nome: "Início",
        titulo: "Painel Administrativo | Liceu"
    },
    {
        arquivo: "pages/painel-liceu/artesaos.html",
        caminho: "/painel-liceu/artesaos",
        icone: "boxicons:user",
        iniciar: pagina("./paginas/painel-liceu/index.js", "iniciarLiceuArtesaos"),
        layout: "painel-liceu",
        nome: "Artesãos",
        titulo: "Artesãos | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/cadastrar-artesao.html",
        caminho: "/painel-liceu/cadastrar-artesao",
        icone: "lucide:square-plus",
        iniciar: pagina("./paginas/painel-liceu/index.js", "iniciarLiceuCadastro"),
        layout: "painel-liceu",
        nome: "Cadastrar Artesão",
        titulo: "Cadastrar Artesão | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/trabalhos-pendentes.html",
        caminho: "/painel-liceu/trabalhos-pendentes",
        icone: "lucide:file-text",
        iniciar: pagina("./paginas/painel-liceu/index.js", "iniciarLiceuPendentes"),
        layout: "painel-liceu",
        nome: "Trabalhos Pendentes",
        titulo: "Trabalhos Pendentes | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/publicacoes.html",
        caminho: "/painel-liceu/publicacoes",
        icone: "lucide:chart-no-axes-column",
        iniciar: pagina("./paginas/painel-liceu/index.js", "iniciarLiceuPublicacoes"),
        layout: "painel-liceu",
        nome: "Publicações",
        titulo: "Publicações | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/configuracoes.html",
        caminho: "/painel-liceu/configuracoes",
        icone: "lucide:settings",
        iniciar: pagina("./paginas/painel-liceu/index.js", "iniciarLiceuConfiguracoes"),
        layout: "painel-liceu",
        nome: "Configurações",
        titulo: "Configurações | Área do Liceu"
    },

// ===== Área do Artesão (restrita) =====

    {
        arquivo: "pages/painel-artesao/inicio.html",
        caminho: "/painel-artesao",
        icone: "lucide:house",
        iniciar: pagina("./paginas/painel-artesao/index.js", "iniciarArtesaoInicio"),
        layout: "painel-artesao",
        nome: "Início",
        titulo: "Área do Artesão | Liceu"
    },
    {
        arquivo: "pages/painel-artesao/meu-perfil.html",
        caminho: "/painel-artesao/meu-perfil",
        icone: "boxicons:user",
        iniciar: pagina("./paginas/painel-artesao/index.js", "iniciarArtesaoPerfil"),
        layout: "painel-artesao",
        nome: "Meu perfil",
        titulo: "Meu Perfil | Área do Artesão"
    },
    {
        arquivo: "pages/painel-artesao/meus-trabalhos.html",
        caminho: "/painel-artesao/meus-trabalhos",
        icone: "lucide:layers",
        iniciar: pagina("./paginas/painel-artesao/index.js", "iniciarArtesaoTrabalhos"),
        layout: "painel-artesao",
        nome: "Meus trabalhos",
        titulo: "Meus Trabalhos | Área do Artesão"
    },
    {
        arquivo: "pages/painel-artesao/novo-trabalho.html",
        caminho: "/painel-artesao/novo-trabalho",
        icone: "lucide:square-plus",
        iniciar: pagina("./paginas/painel-artesao/index.js", "iniciarArtesaoNovoTrabalho"),
        layout: "painel-artesao",
        nome: "Novo trabalho",
        titulo: "Novo Trabalho | Área do Artesão"
    },
    {
        arquivo: "pages/painel-artesao/status-publicacoes.html",
        caminho: "/painel-artesao/status-publicacoes",
        icone: "lucide:chart-no-axes-column",
        iniciar: pagina("./paginas/painel-artesao/index.js", "iniciarArtesaoStatus"),
        layout: "painel-artesao",
        nome: "Status das publicações",
        titulo: "Status das Publicações | Área do Artesão"
    }
]);

const ROTA_NAO_ENCONTRADA = Object.freeze({
    arquivo: "pages/nao-encontrado.html",
    caminho: "",
    layout: "portal",
    titulo: "Página não encontrada | Liceu"
});

export {PAINEIS, ROTAS, ROTA_NAO_ENCONTRADA};
