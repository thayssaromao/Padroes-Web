/*jslint browser */
/**
 * paginas/painel-artesao/imagens.js — leitura e redução de imagens antes
 * de salvar no navegador (foto do perfil e fotos dos trabalhos).
 * Guia: docs/DESIGN.md.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_IMAGEM = ["image/jpeg", "image/png"];

/** Reduz fotos antes de persistir no armazenamento limitado do navegador. */
function lerImagem(arquivo) {
    return new Promise(function (resolver, rejeitar) {
        if (!TIPOS_IMAGEM.includes(arquivo.type)
                || arquivo.size > MAX_BYTES) {
            rejeitar(new Error("Escolha uma imagem JPG ou PNG de até 10 MB."));
            return;
        }
        const leitor = new FileReader();
        leitor.onerror = function () {
            rejeitar(new Error("Não foi possível ler a imagem."));
        };
        leitor.onload = function () {
            const imagem = new Image();
            imagem.onerror = function () {
                rejeitar(new Error("O arquivo não contém uma imagem válida."));
            };
            imagem.onload = function () {
                const escala = Math.min(1, 1000 / Math.max(
                    imagem.naturalWidth,
                    imagem.naturalHeight
                ));
                const tela = document.createElement("canvas");
                tela.width = Math.max(
                    1, Math.round(imagem.naturalWidth * escala)
                );
                tela.height = Math.max(
                    1, Math.round(imagem.naturalHeight * escala)
                );
                const contexto = tela.getContext("2d");
                contexto.fillStyle = "white";
                contexto.fillRect(0, 0, tela.width, tela.height);
                contexto.drawImage(imagem, 0, 0, tela.width, tela.height);
                resolver(tela.toDataURL("image/jpeg", 0.75));
            };
            imagem.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}

export {
    lerImagem
};
