// Dashboard, parte A (Entrega 6): para onde foi o dinheiro no mês.
// Gráfico de barras horizontais, do maior para o menor, numa cor só.
// Barras e não pizza: com até 12 categorias, comparar comprimentos é muito
// mais fácil do que comparar fatias, e não precisamos de 12 cores.

Object.assign(el, {
  secaoDashboard: document.getElementById('secao-dashboard'),
  subtituloDashboard: document.getElementById('subtitulo-dashboard'),
  graficoCategorias: document.getElementById('grafico-categorias'),
  verTodasCategorias: document.getElementById('ver-todas-categorias'),
});

estado.dashboardAberto = false; // mostrando todas as categorias ou só as maiores

const CATEGORIAS_VISIVEIS = 5;

// doMes = todos os lançamentos do mês (antes dos filtros)
function renderizarDashboard(doMes) {
  // Respeita o filtro de tipo (pessoal/profissional). O filtro de categoria
  // não reduz o gráfico: ele só DESTACA a categoria escolhida.
  const base = Lancamentos.filtrar(doMes, { tipo: estado.filtros.tipo });
  const { total, categorias } = Lancamentos.saidasPorCategoria(base);

  el.secaoDashboard.hidden = total === 0;
  if (total === 0) return;

  const selecionada = estado.filtros.categoria;
  const temDestaque = categorias.some((c) => c.categoria === selecionada);
  const tipo = { pessoal: ' · só pessoal', profissional: ' · só profissional' }[estado.filtros.tipo] || '';
  el.subtituloDashboard.textContent =
    `Saídas de ${MESES[estado.mes - 1].toLowerCase()}: ${Dinheiro.formatar(total)}${tipo}. Toque numa categoria para ver os lançamentos.`;

  // Mostra as maiores; o resto fica atrás do "Ver todas".
  // Se a categoria destacada estiver escondida, abre tudo para ela aparecer.
  const escondeAlgumas = categorias.length > CATEGORIAS_VISIVEIS + 1;
  const indiceSelecionada = categorias.findIndex((c) => c.categoria === selecionada);
  const aberto = estado.dashboardAberto || indiceSelecionada >= CATEGORIAS_VISIVEIS;
  const visiveis = escondeAlgumas && !aberto ? categorias.slice(0, CATEGORIAS_VISIVEIS) : categorias;

  // A maior categoria ocupa a largura toda; as outras, proporcionalmente
  const maior = categorias[0].valor;
  el.graficoCategorias.replaceChildren(...visiveis.map((c) => criarBarra(c, maior, selecionada, temDestaque)));

  el.verTodasCategorias.hidden = !escondeAlgumas;
  el.verTodasCategorias.dataset.aberto = String(aberto);
  el.verTodasCategorias.dataset.selecionadaEscondida = String(indiceSelecionada >= CATEGORIAS_VISIVEIS);
  el.verTodasCategorias.textContent = aberto
    ? 'Ver menos'
    : `Ver todas (+${categorias.length - CATEGORIAS_VISIVEIS})`;
}

function criarBarra({ categoria, valor, fracao }, maior, selecionada, temDestaque) {
  const cat = buscarCategoria(categoria);
  const pct = fracao < 0.01 ? '<1%' : `${Math.round(fracao * 100)}%`;
  // Mínimo de 2% de largura para uma categoria pequena não sumir
  const largura = Math.max(2, (valor / maior) * 100);
  const ativa = categoria === selecionada;

  const li = document.createElement('li');
  li.innerHTML = `
    <button type="button" class="barra-linha${temDestaque ? (ativa ? ' destacada' : ' apagada') : ''}"
      aria-pressed="${ativa}" aria-label="${cat.nome}: ${Dinheiro.formatar(valor)}, ${pct} das saídas">
      <span class="barra-topo">
        <span class="barra-nome">${icone(cat.icone, 16)}${cat.nome}</span>
        <span class="barra-valor">${Dinheiro.formatar(valor)} <span class="barra-pct">${pct}</span></span>
      </span>
      <span class="barra-trilho"><span class="barra" style="width: ${largura}%"></span></span>
    </button>
  `;
  // Tocar liga o filtro da categoria; tocar de novo desliga
  li.querySelector('button').addEventListener('click', () => {
    estado.filtros.categoria = ativa ? '' : categoria;
    renderizar();
  });
  return li;
}

el.verTodasCategorias.addEventListener('click', () => {
  const { aberto, selecionadaEscondida } = el.verTodasCategorias.dataset;
  estado.dashboardAberto = aberto !== 'true';
  // Ao fechar, se a categoria selecionada vai ficar escondida, tira o filtro dela
  if (!estado.dashboardAberto && selecionadaEscondida === 'true') estado.filtros.categoria = '';
  renderizar();
});
