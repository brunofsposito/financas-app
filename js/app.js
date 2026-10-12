// Liga a tela às regras: reage aos cliques e desenha os dados na página.

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const hoje = new Date();
const estado = {
  ano: hoje.getFullYear(),
  mes: hoje.getMonth() + 1, // getMonth() começa em 0 (janeiro = 0)
};

const el = {
  tituloMes: document.getElementById('titulo-mes'),
  entrou: document.getElementById('entrou'),
  saiu: document.getElementById('saiu'),
  saldo: document.getElementById('saldo'),
  lista: document.getElementById('lista'),
  vazio: document.getElementById('vazio'),
  botaoNovo: document.getElementById('botao-novo'),
  dialogo: document.getElementById('dialogo'),
  formulario: document.getElementById('formulario'),
  botaoCancelar: document.getElementById('botao-cancelar'),
  erro: document.getElementById('erro'),
};

// ---------- Desenhar a tela ----------

function renderizar() {
  el.tituloMes.textContent = `${MESES[estado.mes - 1]} ${estado.ano}`;

  const doMes = Lancamentos.doMes(estado.ano, estado.mes);
  const { entrou, saiu, saldo } = Lancamentos.resumo(doMes);

  el.entrou.textContent = Dinheiro.formatar(entrou);
  el.saiu.textContent = Dinheiro.formatar(saiu);
  el.saldo.textContent = Dinheiro.formatar(saldo);
  el.saldo.classList.toggle('negativo', saldo < 0);

  el.lista.replaceChildren(...doMes.map(criarItemDaLista));
  el.vazio.hidden = doMes.length > 0;
}

function criarItemDaLista(l) {
  const categoria = buscarCategoria(l.categoria);
  const [, mes, dia] = l.data.split('-');
  const sinal = l.movimento === 'entrada' ? '+' : '−';

  const li = document.createElement('li');
  li.className = `item item-${l.movimento}`;
  li.innerHTML = `
    <span class="item-icone" aria-hidden="true">${categoria.icone}</span>
    <span class="item-texto">
      <span class="item-descricao"></span>
      <span class="item-detalhe"></span>
    </span>
    <span class="item-valor">${sinal} ${Dinheiro.formatar(l.valor)}</span>
  `;
  // textContent (e não innerHTML) para o texto digitado pelo usuário: evita que
  // uma descrição com código HTML seja interpretada pelo navegador.
  li.querySelector('.item-descricao').textContent = l.descricao;
  li.querySelector('.item-detalhe').textContent =
    `${dia}/${mes} · ${categoria.nome} · ${l.tipo === 'pessoal' ? 'Pessoal' : 'Profissional'}`;
  return li;
}

// ---------- Formulário ----------

function preencherCategorias(movimento) {
  const select = el.formulario.elements.categoria;
  select.replaceChildren(...CATEGORIAS[movimento].map((c) => new Option(`${c.icone} ${c.nome}`, c.id)));
}

function dataDeHojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function abrirFormulario() {
  el.formulario.reset();
  el.erro.textContent = '';
  preencherCategorias('saida');
  el.formulario.elements.data.value = dataDeHojeISO();
  el.dialogo.showModal();
  el.formulario.elements.valor.focus();
}

function lerFormulario() {
  const f = el.formulario.elements;
  const valor = Dinheiro.paraCentavos(f.valor.value);
  if (valor === null) return { erro: 'Informe um valor maior que zero. Ex.: 150,00' };
  if (!f.descricao.value.trim()) return { erro: 'Informe uma descrição.' };
  if (!f.data.value) return { erro: 'Informe a data.' };

  return {
    dados: {
      movimento: f.movimento.value,
      valor,
      descricao: f.descricao.value,
      categoria: f.categoria.value,
      data: f.data.value,
      tipo: f.tipo.value,
    },
  };
}

el.botaoNovo.addEventListener('click', abrirFormulario);
el.botaoCancelar.addEventListener('click', () => el.dialogo.close());

// Ao trocar entre Entrada e Saída, a lista de categorias muda junto
el.formulario.addEventListener('change', (evento) => {
  if (evento.target.name === 'movimento') preencherCategorias(evento.target.value);
});

el.formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const { dados, erro } = lerFormulario();
  if (erro) {
    el.erro.textContent = erro;
    return;
  }
  Lancamentos.criar(dados);
  el.dialogo.close();
  renderizar();
});

renderizar();
