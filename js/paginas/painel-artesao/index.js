/*jslint browser */
/**
 * paginas/painel-artesao/index.js — ponto de entrada das abas da Área do
 * Artesão (#/painel-artesao/...), usado por js/rotas.js.
 *
 * Organização: uma aba por arquivo (inicio, perfil, trabalhos,
 * novo-trabalho, status); ações sobre trabalhos em acoes-trabalho.js;
 * helpers em compartilhado.js e imagens.js.
 * Guia: docs/DESIGN.md.
 */

import {protegida} from "./compartilhado.js";
import {montarInicio} from "./inicio.js";
import {montarNovoTrabalho} from "./novo-trabalho.js";
import {montarPerfil} from "./perfil.js";
import {montarStatus} from "./status.js";
import {montarTrabalhos} from "./trabalhos.js";

const iniciarArtesaoInicio = protegida("o resumo", montarInicio);
const iniciarArtesaoNovoTrabalho = protegida(
    "o formulário",
    montarNovoTrabalho
);
const iniciarArtesaoPerfil = protegida("o perfil", montarPerfil);
const iniciarArtesaoStatus = protegida("as publicações", montarStatus);
const iniciarArtesaoTrabalhos = protegida("os trabalhos", montarTrabalhos);

export {
    iniciarArtesaoInicio,
    iniciarArtesaoNovoTrabalho,
    iniciarArtesaoPerfil,
    iniciarArtesaoStatus,
    iniciarArtesaoTrabalhos
};
