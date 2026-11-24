/*jslint browser */
/** Apresentação progressiva de selects; o controle original mantém o contrato. */
const seletores = new WeakMap();
let aberto;
let eventosLigados = false;
let numero = 0;

function fecharSeletor() {
    if (!aberto) {
        return;
    }
    const atual = aberto;
    aberto = undefined;
    if (atual.lista.matches(":popover-open")) {
        atual.lista.hidePopover();
    }
    atual.botao.setAttribute("aria-expanded", "false");
    atual.botao.removeAttribute("aria-activedescendant");
}

function ligarEventos() {
    if (eventosLigados) {
        return;
    }
    eventosLigados = true;
    document.addEventListener("pointerdown", function (evento) {
        if (aberto && !aberto.raiz.contains(evento.target)) {
            fecharSeletor();
        }
    });
    document.addEventListener("scroll", function (evento) {
        if (aberto && !aberto.lista.contains(evento.target)) {
            const posicao = aberto.botao.getBoundingClientRect();
            if (!aberto.select.isConnected
                    || Math.abs(posicao.top - aberto.topo) > 1
                    || Math.abs(posicao.left - aberto.esquerda) > 1) {
                fecharSeletor();
            }
        }
    }, true);
    window.addEventListener("resize", fecharSeletor);
}

function montarSeletor(select) {
    numero += 1;
    const id = select.id || "seletor-" + numero;
    select.id = id;
    const raiz = document.createElement("div");
    raiz.className = "seletor";
    const botao = document.createElement("button");
    botao.type = "button";
    botao.id = id + "-controle";
    botao.className = select.className;
    botao.classList.add("campo__entrada", "seletor__botao");
    botao.setAttribute("role", "combobox");
    botao.setAttribute("aria-haspopup", "listbox");
    botao.setAttribute("aria-expanded", "false");
    const valor = document.createElement("span");
    valor.id = id + "-valor";
    valor.className = "seletor__valor";
    const seta = document.createElement("iconify-icon");
    seta.setAttribute("icon", "lucide:chevron-down");
    seta.setAttribute("aria-hidden", "true");
    seta.setAttribute("noobserver", "");
    botao.append(valor, seta);
    const lista = document.createElement("div");
    lista.id = id + "-opcoes";
    lista.className = "seletor__lista";
    lista.setAttribute("role", "listbox");
    lista.setAttribute("popover", "manual");
    botao.setAttribute("aria-controls", lista.id);
    const erro = document.createElement("p");
    erro.id = id + "-erro";
    erro.className = "seletor__erro";
    erro.setAttribute("role", "alert");
    const rotulos = Array.from(select.labels);
    if (rotulos.length) {
        const ids = rotulos.map(function (rotulo, indice) {
            rotulo.id = rotulo.id || id + "-rotulo-" + indice;
            rotulo.addEventListener("click", function (evento) {
                evento.preventDefault();
                botao.focus();
            });
            return rotulo.id;
        });
        botao.setAttribute("aria-labelledby", ids.join(" ") + " " + valor.id);
        lista.setAttribute("aria-labelledby", ids.join(" "));
    } else {
        const nome = select.getAttribute("aria-label") || select.name || "Selecionar opção";
        botao.setAttribute("aria-label", nome);
        lista.setAttribute("aria-label", nome);
    }
    if (select.getAttribute("aria-describedby")) {
        botao.setAttribute("aria-describedby", select.getAttribute("aria-describedby"));
    }
    select.before(raiz);
    raiz.append(select, botao, lista, erro);
    select.classList.add("seletor__nativo");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    let ativo = 0;
    let letras = "";
    let ultimaLetra = 0;
    const estado = {botao, lista, raiz, select};
    const opcoes = function () { return Array.from(select.options); };
    const habilitada = function (opcao) {
        return !opcao.disabled && !opcao.hidden
            && !opcao.parentElement.disabled;
    };

    function destacar() {
        lista.querySelectorAll("[role=option]").forEach(function (opcao) {
            opcao.toggleAttribute("data-ativo", Number(opcao.dataset.indice) === ativo);
        });
        const item = lista.querySelector("[data-ativo]");
        if (item) {
            botao.setAttribute("aria-activedescendant", item.id);
            item.scrollIntoView({block: "nearest"});
        }
    }

    function atualizar() {
        valor.textContent = select.selectedOptions[0]?.textContent || "Selecione uma opção";
        botao.disabled = select.matches(":disabled");
        botao.setAttribute("aria-required", String(select.required));
        if (select.validity.valid) {
            botao.removeAttribute("aria-invalid");
            erro.textContent = "";
        }
        lista.replaceChildren();
        let indice = 0;
        function adicionar(opcao, pai) {
            const item = document.createElement("div");
            item.id = id + "-opcao-" + indice;
            item.dataset.indice = String(indice);
            item.className = "seletor__opcao";
            item.setAttribute("role", "option");
            item.setAttribute("aria-selected", String(opcao.selected));
            item.setAttribute("aria-disabled", String(!habilitada(opcao)));
            item.hidden = opcao.hidden;
            item.textContent = opcao.textContent;
            pai.append(item);
            indice += 1;
        }
        Array.from(select.children).forEach(function (filho) {
            if (filho.tagName === "OPTGROUP") {
                const grupo = document.createElement("div");
                grupo.setAttribute("role", "group");
                grupo.setAttribute("aria-label", filho.label);
                const titulo = document.createElement("p");
                titulo.className = "seletor__grupo";
                titulo.textContent = filho.label;
                titulo.setAttribute("aria-hidden", "true");
                grupo.append(titulo);
                Array.from(filho.children).forEach(function (opcao) {
                    adicionar(opcao, grupo);
                });
                lista.append(grupo);
            } else if (filho.tagName === "OPTION") {
                adicionar(filho, lista);
            }
        });
        if (aberto === estado && botao.disabled) {
            fecharSeletor();
        }
    }

    function abrir() {
        if (botao.disabled) {
            return;
        }
        fecharSeletor();
        atualizar();
        ativo = Math.max(0, select.selectedIndex);
        aberto = estado;
        lista.showPopover();
        botao.setAttribute("aria-expanded", "true");
        const campo = botao.getBoundingClientRect();
        estado.topo = campo.top;
        estado.esquerda = campo.left;
        const tokens = getComputedStyle(document.documentElement);
        const margem = parseFloat(tokens.getPropertyValue("--espaco-2"));
        const gap = parseFloat(tokens.getPropertyValue("--espaco-1"));
        const limite = 5 * parseFloat(tokens.getPropertyValue("--espaco-8"));
        lista.style.width = campo.width + "px";
        const largura = lista.getBoundingClientRect().width;
        lista.style.left = Math.max(margem,
            Math.min(campo.left, innerWidth - largura - margem)) + "px";
        const abaixo = innerHeight - campo.bottom - margem - gap;
        const acima = campo.top - margem - gap;
        const altura = Math.max(0, Math.min(limite, Math.max(abaixo, acima)));
        lista.style.maxHeight = altura + "px";
        lista.style.top = (abaixo >= Math.min(limite, lista.scrollHeight)
            || abaixo >= acima ? campo.bottom + gap
            : campo.top - Math.min(altura, lista.scrollHeight) - gap) + "px";
        destacar();
    }

    function confirmar() {
        const opcao = opcoes()[ativo];
        if (!opcao || !habilitada(opcao)) {
            return;
        }
        const anterior = select.value;
        select.selectedIndex = ativo;
        fecharSeletor();
        if (select.value !== anterior) {
            select.dispatchEvent(new Event("input", {bubbles: true}));
            select.dispatchEvent(new Event("change", {bubbles: true}));
        }
        atualizar();
    }

    botao.addEventListener("click", function () {
        if (aberto === estado) {
            fecharSeletor();
        } else {
            abrir();
        }
    });
    botao.addEventListener("keydown", function (evento) {
        const tecla = evento.key;
        if (tecla === "Tab") {
            if (aberto === estado) { confirmar(); }
            return;
        }
        if (tecla === "Escape") {
            if (aberto === estado) {
                evento.preventDefault();
                evento.stopPropagation();
                fecharSeletor();
            }
            return;
        }
        const navegacao = ["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"];
        if (tecla === "Enter" || tecla === " ") {
            evento.preventDefault();
            evento.stopPropagation();
            if (aberto === estado) { confirmar(); } else { abrir(); }
            return;
        }
        if (navegacao.includes(tecla)) {
            evento.preventDefault();
            const estavaAberto = aberto === estado;
            if (!estavaAberto) { abrir(); }
            const indices = opcoes().map(function (opcao, indice) {
                return habilitada(opcao) ? indice : -1;
            }).filter(function (indice) { return indice >= 0; });
            const atual = Math.max(0, indices.indexOf(ativo));
            const passo = tecla.startsWith("Page") ? 10 : 1;
            let proximo = atual;
            if (tecla === "Home") { proximo = 0; }
            else if (tecla === "End") { proximo = indices.length - 1; }
            else if (estavaAberto) {
                proximo = atual + (["ArrowUp", "PageUp"].includes(tecla) ? -passo : passo);
            }
            ativo = indices[Math.max(0, Math.min(indices.length - 1, proximo))];
            destacar();
        } else if (tecla.length === 1 && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
            evento.preventDefault();
            if (aberto !== estado) { abrir(); }
            letras = Date.now() - ultimaLetra < 700 ? letras + tecla : tecla;
            ultimaLetra = Date.now();
            const normal = function (texto) {
                return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            };
            const indice = opcoes().findIndex(function (opcao) {
                return habilitada(opcao) && normal(opcao.text).startsWith(normal(letras));
            });
            if (indice >= 0) { ativo = indice; destacar(); }
        }
    });
    botao.addEventListener("blur", function () {
        if (aberto === estado) { fecharSeletor(); }
    });
    lista.addEventListener("pointerdown", function (evento) {
        evento.preventDefault();
    });
    lista.addEventListener("click", function (evento) {
        const item = evento.target.closest("[role=option]");
        if (item) { ativo = Number(item.dataset.indice); confirmar(); }
    });
    select.addEventListener("change", function () { queueMicrotask(atualizar); });
    select.addEventListener("input", function () { queueMicrotask(atualizar); });
    select.addEventListener("focus", function () { botao.focus(); });
    select.addEventListener("invalid", function (evento) {
        evento.preventDefault();
        botao.setAttribute("aria-invalid", "true");
        botao.setAttribute("aria-describedby", erro.id);
        erro.textContent = select.validationMessage;
        botao.focus();
    });
    select.form?.addEventListener("reset", function () { queueMicrotask(atualizar); });
    const observador = new MutationObserver(atualizar);
    observador.observe(select, {attributes: true, childList: true, subtree: true});
    atualizar();
    seletores.set(select, {atualizar});
}

/** Melhora apenas seleções simples; múltiplas preservam checkboxes/chips. */
function prepararSeletores(raiz) {
    if (typeof HTMLElement.prototype.showPopover !== "function") {
        return;
    }
    if (aberto && !aberto.select.isConnected) { fecharSeletor(); }
    ligarEventos();
    raiz.querySelectorAll("select:not([multiple]):not([data-escolha-unica])").forEach(function (select) {
        const existente = seletores.get(select);
        if (existente) { existente.atualizar(); }
        else { montarSeletor(select); }
    });
}

export {prepararSeletores};
