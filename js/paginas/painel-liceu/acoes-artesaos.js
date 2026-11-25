/*jslint browser */
/**
 * paginas/painel-liceu/acoes-artesaos.js — ações sobre artesãos
 * (ver perfil, editar, ativar/desativar, redefinir senha).
 * Guia: docs/DESIGN.md.
 */

import {
    criarChips,
    criarStatus,
    escaparHtml
} from "../../componentes.js";
import {
    buscarArtesao,
    carregarCategorias,
    salvarArtesao
} from "../../dados.js";
import {
    acoesFormulario,
    areaTexto,
    campo,
    dialogo,
    ligarSalvar,
    selecionarCampo
} from "./formularios.js";

async function verPerfilArtesao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const artesao = await buscarArtesao(id);
    if (!artesao || !marco.isConnected) {
        return;
    }
    dialogo(artesao.nome,
        "<div class=\"perfil-consulta__identidade\">"
        + `<img class="avatar" src="${escaparHtml(artesao.foto)}"`
        + " alt=\"\" width=\"64\" height=\"64\"><div><p>"
        + escaparHtml(artesao.empreendimento) + "</p>"
        + "<p class=\"perfil-consulta__local\">"
        + escaparHtml(artesao.cidade) + "</p></div></div>"
        + criarChips(artesao.categorias.concat(artesao.tecnicas))
        + "<p>" + escaparHtml(artesao.bio || "Perfil em elaboração.")
        + "</p><section class=\"perfil-consulta__contato\" aria-label=\"Contato\">"
        + "<h3>Contato</h3><p>"
        + escaparHtml(artesao.email) + "</p><p>"
        + escaparHtml(artesao.whatsapp || "WhatsApp não informado")
        + "</p><p>" + escaparHtml(artesao.instagram || "") + "</p></section>",
        "perfil");
}

async function editarArtesao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const dados = await Promise.all([buscarArtesao(id), carregarCategorias()]);
    if (!dados[0] || !marco.isConnected) {
        return;
    }
    const artesao = dados[0];
    const modal = dialogo("Editar artesão", "<form>"
        + campo("nome", "Nome completo *", artesao.nome, "text", true)
        + campo("email", "E-mail *", artesao.email, "email", true)
        + campo("empreendimento", "Empreendimento", artesao.empreendimento)
        + campo("cidade", "Cidade", artesao.cidade)
        + selecionarCampo("categorias", "Categorias (selecione uma ou mais)",
            dados[1].categorias, artesao.categorias, true)
        + selecionarCampo("tecnicas", "Técnicas (selecione uma ou mais)",
            dados[1].tecnicas, artesao.tecnicas, true)
        + areaTexto("bio", "História e apresentação", artesao.bio)
        + campo("whatsapp", "WhatsApp", artesao.whatsapp, "tel")
        + campo("instagram", "Instagram / Rede social", artesao.instagram)
        + acoesFormulario() + "</form>");
    ligarSalvar(modal, async function (campos) {
        if (!campos.nome.value.trim()) {
            throw new Error("Informe o nome do artesão.");
        }
        await salvarArtesao(Object.assign({}, artesao, {
            bio: campos.bio.value.trim(),
            categorias: Array.from(campos.categorias.selectedOptions,
                function (opcao) { return opcao.value; }),
            cidade: campos.cidade.value.trim(),
            email: campos.email.value.trim(),
            empreendimento: campos.empreendimento.value.trim(),
            instagram: campos.instagram.value.trim(),
            nome: campos.nome.value.trim(),
            tecnicas: Array.from(campos.tecnicas.selectedOptions,
                function (opcao) { return opcao.value; }),
            whatsapp: campos.whatsapp.value.trim()
        }));
    }, "Cadastro do artesão atualizado.");
}

async function abrirMenuArtesao(id) {
    const marco = document.getElementById("conteudo").firstElementChild;
    const artesao = await buscarArtesao(id);
    if (!artesao || !marco.isConnected) {
        return;
    }
    const ativo = artesao.status === "ativo";
    const modal = dialogo("Acesso de " + artesao.nome,
        "<p>" + criarStatus(artesao.status) + "</p><p>"
        + "Desativar o cadastro retira o perfil e os trabalhos do portal "
        + "e impede novos acessos enquanto estiver inativo.</p>"
        + "<div class=\"modal__acoes\"><button type=\"button\""
        + " class=\"btn btn--secundario\" data-alterar-status>"
        + (ativo ? "Desativar artesão" : "Ativar artesão") + "</button>"
        + "<button type=\"button\" class=\"btn btn--secundario\""
        + " data-senha>Redefinir senha</button></div>"
        + "<p role=\"alert\" data-erro></p>");
    modal.querySelector("[data-alterar-status]").addEventListener(
        "click", function () {
            modal.close();
            const confirmar = dialogo(ativo ? "Desativar artesão?"
                : "Ativar artesão?", "<form><p>"
                + escaparHtml(artesao.nome) + "</p>"
                + acoesFormulario(ativo ? "Desativar" : "Ativar")
                + "</form>", "pequeno");
            ligarSalvar(confirmar, async function () {
                await salvarArtesao(Object.assign({}, artesao, {
                    status: ativo ? "inativo" : "ativo"
                }));
            }, "Status do artesão atualizado.");
        }
    );
    modal.querySelector("[data-senha]").addEventListener("click", function () {
        modal.close();
        const senha = dialogo("Redefinir senha provisória", "<form>"
            + campo("senha", "Nova senha provisória *", "", "password", true)
            + campo("confirmar", "Confirmar senha *", "", "password", true)
            + acoesFormulario("Redefinir senha") + "</form>", "pequeno");
        senha.querySelector("[name=senha]").minLength = 6;
        ligarSalvar(senha, async function (campos) {
            if (campos.senha.value !== campos.confirmar.value) {
                throw new Error("As senhas não conferem.");
            }
            await salvarArtesao(Object.assign({}, artesao, {
                senha: campos.senha.value
            }));
        }, "Senha provisória redefinida neste navegador.");
    });
}

export {
    abrirMenuArtesao,
    editarArtesao,
    verPerfilArtesao
};
