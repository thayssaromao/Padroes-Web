const rotas = [
  { nome: 'Início',   caminho: '/inicio',   arquivo: 'pages/inicio.html',   titulo: 'Tela Inicial' },
  { nome: 'Produtos', caminho: '/produtos', arquivo: 'pages/produtos.html', titulo: 'Produtos | Liceu' },
  { nome: 'Artesãos', caminho: '/artesaos', arquivo: 'pages/artesaos.html', titulo: 'Artesãos | Liceu' },
  { nome: 'Saberes',  caminho: '/saberes',  arquivo: 'pages/saberes.html',  titulo: 'Saberes | Liceu' },
  { nome: 'Sobre',    caminho: '/sobre',    arquivo: 'pages/sobre.html',    titulo: 'Sobre | UTFPR' },
  { nome: 'Contato',  caminho: '/contato',  arquivo: 'pages/contato.html',  titulo: 'Contato | Liceu' },
];

const rotaNaoEncontrada = {
  arquivo: 'pages/nao-encontrado.html',
  titulo: 'Página Não Encontrada',
};

const nav = document.querySelector('#nav');
const conteudo = document.querySelector('#conteudo');

function caminhoAtual() {
  return location.hash.slice(1) || '/inicio';
}

function atualizarLinhaIndicadora() {
  const linkAtivo = nav.querySelector('a[aria-current="page"]');
  const underline = nav.querySelector('.nav-underline');

  if (linkAtivo && underline) {
    const largura = linkAtivo.offsetWidth;
    const deslocamento = linkAtivo.offsetLeft;

    underline.style.width = `${largura}px`;
    underline.style.transform = `translateX(${deslocamento}px)`;
  }
}

function montarNav() {
  nav.innerHTML = rotas
    .map(({ nome, caminho: c }) => `<a href="#${c}">${nome}</a>`)
    .join('') + '<div class="nav-underline"></div>';
}

function renderizarNav(caminho) {
  nav.querySelectorAll('a').forEach((link) => {
    const ativo = link.getAttribute('href') === `#${caminho}`;
    if (ativo) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  atualizarLinhaIndicadora();
}

async function carregarPagina() {
  const caminho = caminhoAtual();
  const rota = rotas.find(r => r.caminho === caminho) ?? rotaNaoEncontrada;

  renderizarNav(caminho);
  document.title = rota.titulo;

  try {
    const resposta = await fetch(rota.arquivo);
    if (!resposta.ok) throw new Error(resposta.status);
    conteudo.innerHTML = await resposta.text();
  } catch {
    const fallback = await fetch(rotaNaoEncontrada.arquivo);
    conteudo.innerHTML = await fallback.text();
    document.title = rotaNaoEncontrada.titulo;
  }
}

window.addEventListener('hashchange', carregarPagina);
window.addEventListener('resize', atualizarLinhaIndicadora);
window.addEventListener('hashchange', carregarPagina);
window.addEventListener('resize', atualizarLinhaIndicadora);

montarNav();
carregarPagina();