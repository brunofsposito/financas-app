// Liga a tela às regras: reage aos cliques e desenha os dados na página.

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const hoje = new Date();
const estado = {
  ano: hoje.getFullYear(),
  mes: hoje.getMonth() + 1, // getMonth() começa em 0 (janeiro = 0)
  editandoId: null, // id do lançamento aberto no formulário (null = novo)
};

const el = {
  tituloMes: document.getElementById('titulo-mes'),
  mesAnterior: document.getElementById('mes-anterior'),
  mesSeguinte: document.getElementById('mes-seguinte'),
  botaoHoje: document.getElementById('botao-hoje'),
  entrou: document.getElementById('entrou'),
  saiu: document.getElementById('saiu'),
  saldo: document.getElementById('saldo'),
  lista: document.getElementById('lista'),
  vazio: document.getElementById('vazio'),
  botaoNovo: document.getElementById('botao-novo'),
  dialogo: document.getElementById('dialogo'),
  formulario: document.getElementById('formulario'),
  tituloFormulario: document.getElementById('titulo-formulario'),
  botaoExcluir: document.getElementById('botao-excluir'),
  botaoCancelar: document.getElementById('botao-cancelar'),
  erro: document.getElementById('erro'),
};

// ---------- Navegação entre meses ----------

function ehMesAtual() {
  const agora = new Date();
  return estado.ano === agora.getFullYear() && estado.mes === agora.getMonth() + 1;
}

// delta = -1 (mês anterior) ou +1 (próximo mês)
function mudarMes(delta) {
  // O Date resolve a virada de ano: mês 13 de 2026 vira janeiro de 2027
  const d = new Date(estado.ano, estado.mes - 1 + delta, 1);
  irParaMes(d.getFullYear(), d.getMonth() + 1);
}

function irParaMes(ano, mes) {
  estado.ano = ano;
  estado.mes = mes;
  renderizar();
}

function irParaHoje() {
  const agora = new Date();
  irParaMes(agora.getFullYear(), agora.getMonth() + 1);
}

el.mesAnterior.addEventListener('click', () => mudarMes(-1));
el.mesSeguinte.addEventListener('click', () => mudarMes(1));
el.botaoHoje.addEventListener('click', irParaHoje);

// ---------- Desenhar a tela ----------

function renderizar() {
  el.tituloMes.textContent = `${MESES[estado.mes - 1]} ${estado.ano}`;
  el.botaoHoje.hidden = ehMesAtual();

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
  // Cada item é um botão: tocar nele abre o lançamento para editar
  li.innerHTML = `
    <button type="button" class="item item-${l.movimento}">
      <span class="item-icone" aria-hidden="true">${categoria.icone}</span>
      <span class="item-texto">
        <span class="item-descricao"></span>
        <span class="item-detalhe"></span>
      </span>
      <span class="item-valor">${sinal} ${Dinheiro.formatar(l.valor)}</span>
    </button>
  `;
  // textContent (e não innerHTML) para o texto digitado pelo usuário: evita que
  // uma descrição com código HTML seja interpretada pelo navegador.
  li.querySelector('.item-descricao').textContent = l.descricao;
  li.querySelector('.item-detalhe').textContent =
    `${dia}/${mes} · ${categoria.nome} · ${l.tipo === 'pessoal' ? 'Pessoal' : 'Profissional'}`;
  li.querySelector('button').addEventListener('click', () => abrirFormulario(l));
  return li;
}

// ---------- Formulário ----------

function preencherCategorias(movimento) {
  const select = el.formulario.elements.categoria;
  select.replaceChildren(...CATEGORIAS[movimento].map((c) => new Option(`${c.icone} ${c.nome}`, c.id)));
}

// Data sugerida para um lançamento novo: hoje, se a tela está no mês atual.
// Em outro mês, o mesmo dia de hoje naquele mês (ex.: dia 31 em fevereiro vira dia 28).
function dataSugeridaISO() {
  const hojeDia = new Date().getDate();
  const ultimoDiaDoMes = new Date(estado.ano, estado.mes, 0).getDate();
  const dia = Math.min(hojeDia, ultimoDiaDoMes);
  return `${estado.ano}-${String(estado.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Sem lançamento: modo "novo". Com lançamento: modo "editar", já preenchido.
function abrirFormulario(lancamento = null) {
  const f = el.formulario.elements;
  el.formulario.reset();
  el.erro.textContent = '';
  estado.editandoId = lancamento ? lancamento.id : null;

  el.tituloFormulario.textContent = lancamento ? 'Editar lançamento' : 'Novo lançamento';
  el.botaoExcluir.hidden = !lancamento;

  if (lancamento) {
    f.movimento.value = lancamento.movimento;
    preencherCategorias(lancamento.movimento);
    f.valor.value = Dinheiro.paraCampo(lancamento.valor);
    f.descricao.value = lancamento.descricao;
    f.categoria.value = lancamento.categoria;
    f.data.value = lancamento.data;
    f.tipo.value = lancamento.tipo;
  } else {
    preencherCategorias('saida');
    f.data.value = dataSugeridaISO();
  }

  el.dialogo.showModal();
  // No modo novo, já abre o teclado no valor. Na edição, não: evita cobrir a tela.
  if (!lancamento) f.valor.focus();
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

el.botaoNovo.addEventListener('click', () => abrirFormulario());
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
  if (estado.editandoId) Lancamentos.atualizar(estado.editandoId, dados);
  else Lancamentos.criar(dados);
  el.dialogo.close();
  // Vai para o mês do lançamento salvo, para ele não "sumir" da tela
  const [ano, mes] = dados.data.split('-').map(Number);
  irParaMes(ano, mes);
});

el.botaoExcluir.addEventListener('click', () => {
  if (!estado.editandoId) return;
  if (!confirm('Excluir este lançamento? Essa ação não pode ser desfeita.')) return;
  Lancamentos.excluir(estado.editandoId);
  el.dialogo.close();
  renderizar();
});

renderizar();
