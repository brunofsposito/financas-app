// Tela dos orçamentos: uma barra de progresso por categoria com limite.
// A barra tem duas partes: o que já foi GASTO (cheia) e o PREVISTO em contas
// fixas ainda não pagas (listrada). As regras ficam em orcamentos.js.

Object.assign(el, {
  secaoOrcamentos: document.getElementById('secao-orcamentos'),
  listaOrcamentos: document.getElementById('lista-orcamentos'),
  orcamentosVazio: document.getElementById('orcamentos-vazio'),
  orcamentosAvisoFiltro: document.getElementById('orcamentos-aviso-filtro'),
  botaoNovoOrcamento: document.getElementById('botao-novo-orcamento'),
  dialogoOrcamento: document.getElementById('dialogo-orcamento'),
  formularioOrcamento: document.getElementById('formulario-orcamento'),
  tituloOrcamento: document.getElementById('titulo-orcamento'),
  erroOrcamento: document.getElementById('erro-orcamento'),
  cancelarOrcamento: document.getElementById('cancelar-orcamento'),
  removerOrcamento: document.getElementById('remover-orcamento'),
});

estado.editandoOrcamento = null; // categoria do orçamento aberto no formulário

// ---------- Lista ----------

function renderizarOrcamentos() {
  const situacoes = Orcamentos.doMes(estado.ano, estado.mes, hojeISO());
  el.listaOrcamentos.replaceChildren(...situacoes.map(criarItemOrcamento));
  el.orcamentosVazio.hidden = situacoes.length > 0;
  // Se houver filtro ligado, avisa que o orçamento olha a categoria inteira
  el.orcamentosAvisoFiltro.hidden = situacoes.length === 0 || !temFiltroAtivo();
  // Todas as categorias de saída já têm limite: esconde o "+ Definir limite"
  el.botaoNovoOrcamento.hidden = situacoes.length >= CATEGORIAS.saida.length;
}

// Selo com ícone + texto (a cor nunca vem sozinha)
function seloOrcamento({ status, limite, gasto, previsto, uso }) {
  switch (status) {
    case 'estourado': return `🔴 Estourou ${Dinheiro.formatar(gasto - limite)}`;
    case 'vai-estourar': return '⚠️ Vai estourar com as contas fixas';
    case 'perto': return `⚠️ ${Math.round((gasto / limite) * 100)}% usado`;
    default: return `✅ Restam ${Dinheiro.formatar(limite - gasto - previsto)}`;
  }
}

function criarItemOrcamento(situacao) {
  const { categoria, limite, gasto, previsto, status } = situacao;
  const cat = buscarCategoria(categoria);
  // Larguras em % do limite. Passou do limite: a barra fica cheia.
  const pctGasto = Math.min(100, (gasto / limite) * 100);
  const pctPrevisto = Math.min(100 - pctGasto, (previsto / limite) * 100);
  const detalhe = previsto > 0
    ? `${Dinheiro.formatar(gasto)} gastos + ${Dinheiro.formatar(previsto)} previstos de ${Dinheiro.formatar(limite)}`
    : `${Dinheiro.formatar(gasto)} de ${Dinheiro.formatar(limite)}`;

  const li = document.createElement('li');
  li.innerHTML = `
    <button type="button" class="orcamento orcamento-${status}">
      <span class="barra-topo">
        <span class="barra-nome">${cat.icone} ${cat.nome}</span>
        <span class="selo selo-orcamento">${seloOrcamento(situacao)}</span>
      </span>
      <span class="medidor" role="img" aria-label="${detalhe}">
        <span class="medidor-gasto" style="width: ${pctGasto}%"></span>
        <span class="medidor-previsto" style="width: ${pctPrevisto}%"></span>
      </span>
      <span class="item-detalhe">${detalhe}</span>
    </button>
  `;
  li.querySelector('button').addEventListener('click', () => abrirFormularioOrcamento(categoria));
  return li;
}

// ---------- Formulário ----------

function abrirFormularioOrcamento(categoria = null) {
  const f = el.formularioOrcamento.elements;
  el.formularioOrcamento.reset();
  el.erroOrcamento.textContent = '';
  estado.editandoOrcamento = categoria;

  // Novo: só as categorias de saída que ainda não têm limite.
  // Editar: a categoria fica fixa (para trocar, remova e crie outro).
  const comLimite = new Set(Orcamentos.listar().map((o) => o.categoria));
  const opcoes = categoria
    ? CATEGORIAS.saida.filter((c) => c.id === categoria)
    : CATEGORIAS.saida.filter((c) => !comLimite.has(c.id));
  f.categoria.replaceChildren(...opcoes.map((c) => new Option(`${c.icone} ${c.nome}`, c.id)));
  f.categoria.disabled = Boolean(categoria);

  el.tituloOrcamento.textContent = categoria ? 'Editar limite' : 'Definir limite';
  el.removerOrcamento.hidden = !categoria;
  if (categoria) f.limite.value = Dinheiro.paraCampo(Orcamentos.buscar(categoria).limite);

  el.dialogoOrcamento.showModal();
  if (!categoria) f.limite.focus();
}

el.botaoNovoOrcamento.addEventListener('click', () => abrirFormularioOrcamento());
el.cancelarOrcamento.addEventListener('click', () => el.dialogoOrcamento.close());

el.formularioOrcamento.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const f = el.formularioOrcamento.elements;
  const limite = Dinheiro.paraCentavos(f.limite.value);
  if (limite === null) {
    el.erroOrcamento.textContent = 'Informe um limite maior que zero. Ex.: 800,00';
    return;
  }
  Orcamentos.definir(estado.editandoOrcamento || f.categoria.value, limite);
  el.dialogoOrcamento.close();
  renderizar();
});

el.removerOrcamento.addEventListener('click', () => {
  if (!estado.editandoOrcamento) return;
  if (!confirm('Remover o limite desta categoria? Os lançamentos não são afetados.')) return;
  Orcamentos.remover(estado.editandoOrcamento);
  el.dialogoOrcamento.close();
  renderizar();
});
