const produtosData = [
    { id: 1, nome: "Vaso Rústico", artesao: "Maria Silva", preco: 45.00, categoria: "Cerâmica", tecnica: "Cerâmica", material: "Argila", favorito: false },
    { id: 2, nome: "Cesto de Palha", artesao: "João Souza", preco: 85.00, categoria: "Cestaria", tecnica: "Arte sustentável", material: "Fibra Natural", favorito: true },
    { id: 3, nome: "Manta Bordada", artesao: "Ana Clara", preco: 120.00, categoria: "Arte em tecido", tecnica: "Bordado", material: "Algodão", favorito: false },
    { id: 4, nome: "Centro de Mesa", artesao: "Pedro Alves", preco: 60.00, categoria: "Decoração", tecnica: "Macramê", material: "Linha", favorito: false },
];

export function inicializarProdutos(conteudo) {
    const catalogo = conteudo.querySelector('.catalogo-container');
    const painelFiltros = catalogo.querySelector('#painelFiltros');
    const gradeProdutos = catalogo.querySelector('#gradeProdutos');
    const contadorResultados = catalogo.querySelector('#contadorResultados');
    const btnFiltro = catalogo.querySelector('#btnFiltro');
    const inputBusca = catalogo.querySelector('#inputBusca');
    const btnLimparFiltros = catalogo.querySelector('#btnLimparFiltros');
    const selectOrdenacao = catalogo.querySelector('#selectOrdenacao');
    const btnGrid = catalogo.querySelector('#btnViewGrade');
    const btnList = catalogo.querySelector('#btnViewLista');
    const pilulas = catalogo.querySelectorAll('.opcao-categoria .opcao');
    const pilulaTodos = catalogo.querySelector('.opcao-categoria .opcao[data-categoria="Todos"]');
    const precoTodos = painelFiltros.querySelector('input[name="faixaPreco"][value="todos"]');

    painelFiltros.querySelectorAll('.acordeao-toggle').forEach(titulo => {
        titulo.addEventListener('click', () => {
            titulo.closest('.grupo-filtro').classList.toggle('aberto');
        });
    });

    function renderizarProdutos(produtos) {
        gradeProdutos.replaceChildren();

        if (produtos.length === 0) {
            gradeProdutos.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 2rem;">Nenhum produto encontrado com estes filtros.</p>';
            contadorResultados.innerText = 'Exibindo 0 produtos';
            return;
        }

        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'card-produto';
            card.innerHTML = `
                <div class="card-imagem">
                    <button type="button" class="btn-favorito ${produto.favorito ? 'favoritado' : ''}">
                        ${produto.favorito ? '♥️' : '♡'}
                    </button>
                </div>
                <div class="card-info">
                    <h4>${produto.nome}</h4>
                    <p class="artesao">Por ${produto.artesao}</p>
                    <p class="preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                </div>
            `;

            card.querySelector('.btn-favorito').addEventListener('click', () => {
                produto.favorito = !produto.favorito;
                aplicarFiltros();
            });

            gradeProdutos.appendChild(card);
        });

        contadorResultados.innerText = `Exibindo 1 - ${produtos.length} de ${produtos.length} produtos`;
    }

    function aplicarFiltros() {
        const termoBusca = inputBusca.value.toLowerCase();
        const categoriaAtiva = catalogo.querySelector('.opcao-categoria .ativa').dataset.categoria;
        const categoriasCheck = Array.from(painelFiltros.querySelectorAll('.chk-categoria:checked'), campo => campo.value);
        const tecnicasCheck = Array.from(painelFiltros.querySelectorAll('.chk-tecnica:checked'), campo => campo.value);
        const materiaisCheck = Array.from(painelFiltros.querySelectorAll('.chk-material:checked'), campo => campo.value);
        const precoCheck = painelFiltros.querySelector('input[name="faixaPreco"]:checked').value;

        const produtosFiltrados = produtosData.filter(produto => {
            const bateBusca = produto.nome.toLowerCase().includes(termoBusca) ||
                produto.artesao.toLowerCase().includes(termoBusca);
            const batePilula = categoriaAtiva === 'Todos' || produto.categoria === categoriaAtiva;
            const bateCategoria = categoriasCheck.length === 0 || categoriasCheck.includes(produto.categoria);
            const bateTecnica = tecnicasCheck.length === 0 || tecnicasCheck.includes(produto.tecnica);
            const bateMaterial = materiaisCheck.length === 0 || materiaisCheck.includes(produto.material);

            let batePreco = true;
            if (precoCheck === 'ate50') batePreco = produto.preco <= 50;
            if (precoCheck === '50a100') batePreco = produto.preco > 50 && produto.preco <= 100;
            if (precoCheck === 'acima100') batePreco = produto.preco > 100;

            return bateBusca && batePilula && bateCategoria && bateTecnica && bateMaterial && batePreco;
        });

        switch (selectOrdenacao.value) {
            case 'menor_preco':
                produtosFiltrados.sort((a, b) => a.preco - b.preco);
                break;
            case 'maior_preco':
                produtosFiltrados.sort((a, b) => b.preco - a.preco);
                break;
            default:
                // No mock, os IDs maiores representam os cadastros mais recentes.
                produtosFiltrados.sort((a, b) => b.id - a.id);
        }

        renderizarProdutos(produtosFiltrados);
    }

    function selecionarPilula(selecionada) {
        pilulas.forEach(pilula => pilula.classList.toggle('ativa', pilula === selecionada));
    }

    painelFiltros.addEventListener('change', aplicarFiltros);
    selectOrdenacao.addEventListener('change', aplicarFiltros);

    inputBusca.addEventListener('keydown', evento => {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            aplicarFiltros();
        }
    });

    pilulas.forEach(botao => {
        botao.addEventListener('click', () => {
            selecionarPilula(botao);
            aplicarFiltros();
        });
    });

    btnLimparFiltros.addEventListener('click', () => {
        inputBusca.value = '';
        painelFiltros.querySelectorAll('input[type="checkbox"]').forEach(campo => {
            campo.checked = false;
        });
        precoTodos.checked = true;
        selecionarPilula(pilulaTodos);
        aplicarFiltros();
    });

    btnGrid.addEventListener('click', () => {
        gradeProdutos.classList.remove('modo-lista');
        btnGrid.classList.add('ativa');
        btnList.classList.remove('ativa');
    });

    btnList.addEventListener('click', () => {
        gradeProdutos.classList.add('modo-lista');
        btnList.classList.add('ativa');
        btnGrid.classList.remove('ativa');
    });

    aplicarFiltros();
}