/*jslint browser */
/**
 * paginas/painel-liceu/index.js — ponto de entrada das abas da Área do
 * Liceu (#/painel-liceu/...), usado por js/rotas.js.
 *
 * Organização: uma aba por arquivo (inicio, artesaos, cadastro, pendentes,
 * publicacoes, configuracoes); ações dos modais em acoes-*.js; helpers em
 * formularios.js, listagem.js e compartilhado.js.
 * Guia: docs/DESIGN.md.
 */

import {montarArtesaos} from "./artesaos.js";
import {montarCadastro} from "./cadastro.js";
import {comTratamentoDeErro} from "./compartilhado.js";
import {montarConfiguracoes} from "./configuracoes.js";
import {montarInicio} from "./inicio.js";
import {montarPendentes} from "./pendentes.js";
import {montarPublicacoes} from "./publicacoes.js";

const iniciarLiceuArtesaos = comTratamentoDeErro(montarArtesaos);
const iniciarLiceuCadastro = comTratamentoDeErro(montarCadastro);
const iniciarLiceuConfiguracoes = comTratamentoDeErro(montarConfiguracoes);
const iniciarLiceuInicio = comTratamentoDeErro(montarInicio);
const iniciarLiceuPendentes = comTratamentoDeErro(montarPendentes);
const iniciarLiceuPublicacoes = comTratamentoDeErro(montarPublicacoes);

export {
    iniciarLiceuArtesaos,
    iniciarLiceuCadastro,
    iniciarLiceuConfiguracoes,
    iniciarLiceuInicio,
    iniciarLiceuPendentes,
    iniciarLiceuPublicacoes
};
