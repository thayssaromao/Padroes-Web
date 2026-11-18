/*jslint browser */
/**
 * rotas.js — tabela de rotas da SPA (hash routing).
 *
 * Campos de cada rota (em ordem alfabética, exigência do JSLint):
 *   arquivo  parcial HTML carregada em <main id="conteudo">
 *   caminho  fragmento após o "#" (ex.: "/painel-liceu/artesaos")
 *   icone    ícone Iconify do item de menu do painel
 *   iniciar  função da página chamada após a parcial ser inserida
 *   layout   "portal" | "painel-liceu" | "painel-artesao"
 *   nome     rótulo exibido no menu
 *   titulo   título da aba do navegador
 *
 * Guia: docs/DESIGN.md §4 e §10.
 */

import {iniciarInicio} from "./paginas/inicio.js";
import {iniciarArtesaos} from "./paginas/artesaos.js";
import {inicializarProdutos} from "./produtos.js";
import {iniciarProduto} from "./paginas/produto.js";
import {iniciarSaberes} from "./paginas/saberes.js";
import {iniciarCadastro} from "./paginas/cadastro.js";
import {iniciarContato} from "./paginas/contato.js";
import {
    iniciarLiceuArtesaos,
    iniciarLiceuCadastro,
    iniciarLiceuConfiguracoes,
    iniciarLiceuInicio,
    iniciarLiceuPendentes,
    iniciarLiceuPublicacoes
} from "./paginas/painel-liceu.js";
import {
    iniciarArtesaoInicio,
    iniciarArtesaoNovoTrabalho,
    iniciarArtesaoPerfil,
    iniciarArtesaoStatus,
    iniciarArtesaoTrabalhos
} from "./paginas/painel-artesao.js";

const PAINEIS = Object.freeze({
    "painel-artesao": {titulo: "Área do Artesão"},
    "painel-liceu": {titulo: "Área do Liceu"}
});

const ROTAS = Object.freeze([
    {
        arquivo: "pages/cadastro.html",
        caminho: "/cadastro",
        iniciar: iniciarCadastro,
        layout: "portal",
        titulo: "Criar conta | Liceu"
    },

// ===== Portal (público) =====

    {
        arquivo: "pages/inicio.html",
        caminho: "/inicio",
        iniciar: iniciarInicio,
        layout: "portal",
        titulo: "Portal do Artesão | Liceu"
    },
    {
        arquivo: "pages/produtos.html",
        caminho: "/produtos",
        iniciar: inicializarProdutos,
        layout: "portal",
        titulo: "Produtos | Liceu"
    },
    {
        arquivo: "pages/produto.html",
        caminho: "/produto",
        iniciar: iniciarProduto,
        layout: "portal",
        titulo: "Produto | Liceu"
    },
    {
        arquivo: "pages/artesaos.html",
        caminho: "/artesaos",
        iniciar: iniciarArtesaos,
        layout: "portal",
        titulo: "Artesãos | Liceu"
    },
    {
        arquivo: "pages/saberes.html",
        caminho: "/saberes",
        iniciar: iniciarSaberes,
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
        iniciar: iniciarContato,
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
        iniciar: iniciarLiceuInicio,
        layout: "painel-liceu",
        nome: "Início",
        titulo: "Painel Administrativo | Liceu"
    },
    {
        arquivo: "pages/painel-liceu/artesaos.html",
        caminho: "/painel-liceu/artesaos",
        icone: "boxicons:user",
        iniciar: iniciarLiceuArtesaos,
        layout: "painel-liceu",
        nome: "Artesãos",
        titulo: "Artesãos | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/cadastrar-artesao.html",
        caminho: "/painel-liceu/cadastrar-artesao",
        icone: "lucide:square-plus",
        iniciar: iniciarLiceuCadastro,
        layout: "painel-liceu",
        nome: "Cadastrar Artesão",
        titulo: "Cadastrar Artesão | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/trabalhos-pendentes.html",
        caminho: "/painel-liceu/trabalhos-pendentes",
        icone: "lucide:file-text",
        iniciar: iniciarLiceuPendentes,
        layout: "painel-liceu",
        nome: "Trabalhos Pendentes",
        titulo: "Trabalhos Pendentes | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/publicacoes.html",
        caminho: "/painel-liceu/publicacoes",
        icone: "lucide:chart-no-axes-column",
        iniciar: iniciarLiceuPublicacoes,
        layout: "painel-liceu",
        nome: "Publicações",
        titulo: "Publicações | Área do Liceu"
    },
    {
        arquivo: "pages/painel-liceu/configuracoes.html",
        caminho: "/painel-liceu/configuracoes",
        icone: "lucide:settings",
        iniciar: iniciarLiceuConfiguracoes,
        layout: "painel-liceu",
        nome: "Configurações",
        titulo: "Configurações | Área do Liceu"
    },

// ===== Área do Artesão (restrita) =====

    {
        arquivo: "pages/painel-artesao/inicio.html",
        caminho: "/painel-artesao",
        icone: "lucide:house",
        iniciar: iniciarArtesaoInicio,
        layout: "painel-artesao",
        nome: "Início",
        titulo: "Área do Artesão | Liceu"
    },
    {
        arquivo: "pages/painel-artesao/meu-perfil.html",
        caminho: "/painel-artesao/meu-perfil",
        icone: "boxicons:user",
        iniciar: iniciarArtesaoPerfil,
        layout: "painel-artesao",
        nome: "Meu perfil",
        titulo: "Meu Perfil | Área do Artesão"
    },
    {
        arquivo: "pages/painel-artesao/meus-trabalhos.html",
        caminho: "/painel-artesao/meus-trabalhos",
        icone: "lucide:layers",
        iniciar: iniciarArtesaoTrabalhos,
        layout: "painel-artesao",
        nome: "Meus trabalhos",
        titulo: "Meus Trabalhos | Área do Artesão"
    },
    {
        arquivo: "pages/painel-artesao/novo-trabalho.html",
        caminho: "/painel-artesao/novo-trabalho",
        icone: "lucide:square-plus",
        iniciar: iniciarArtesaoNovoTrabalho,
        layout: "painel-artesao",
        nome: "Novo trabalho",
        titulo: "Novo Trabalho | Área do Artesão"
    },
    {
        arquivo: "pages/painel-artesao/status-publicacoes.html",
        caminho: "/painel-artesao/status-publicacoes",
        icone: "lucide:chart-no-axes-column",
        iniciar: iniciarArtesaoStatus,
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
