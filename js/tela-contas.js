// Tela das contas fixas (Fase 2): lista do mês com status, botão "Paguei",
// formulário de conta e o alerta no topo. As regras ficam em contas.js.

Object.assign(el, {
  secaoContas: document.getElementById('secao-contas'),
  listaContas: document.getElementById('lista-contas'),
  contasVazio: document.getElementById('contas-vazio'),
  botaoNovaConta: document.getElementById('botao-nova-conta'),
  dialogoConta: document.getElementById('dialogo-conta'),
  formularioConta: document.getElementById('formulario-conta'),
  tituloConta: document.getElementById('titulo-conta'),
  erroConta: document.getElementById('erro-conta'),
  cancelarConta: document.getElementById('cancelar-conta'),
  excluirConta: document.getElementById('excluir-conta'),
  botaoCalendario: document.getElementById('botao-calendario'),
  calendarioConta: document.getElementById('calendario-conta'),
  cardPrevisao: document.getElementById('card-previsao'),
  previsao: document.getElementById('previsao'),
  previsaoDetalhe: document.getElementById('previsao-detalhe'),
  rotuloDiaConta: document.getElementById('rotulo-dia-conta'),
  mensagemCalendario: document.getElementById('mensagem-calendario'),
});

estado.editandoContaId = null;

const plural = (n, um, varios) => (n === 1 ? um : varios);

// ---------- Lista de contas do mês ----------

function renderizarContas() {
  const ocorrencias = Contas.doMes(estado.ano, estado.mes, hojeISO());
  el.listaContas.replaceChildren(...ocorrencias.map(criarItemConta));
  el.contasVazio.hidden = ocorrencias.length > 0;
  el.botaoCalendario.hidden = Contas.listar().length === 0;
}

// Ícone de cada status: o selo nunca depende só da cor
const ICONE_STATUS_CONTA = { paga: 'check', atrasada: 'alerta', hoje: 'relogio', proxima: 'relogio', futura: 'calendario' };

// Texto curto do status, ex.: "Vence em 3 dias", "Atrasada há 2 dias".
// Entrada fixa fala diferente: "Cai em 3 dias", "Recebida 05/10".
function textoStatus({ conta, status, dias, pagamento, vencimento }) {
  const [, mes, dia] = (pagamento ? pagamento.data : vencimento).split('-');
  const entrada = Contas.ehEntrada(conta);
  const verbo = entrada ? 'Cai' : 'Vence';
  switch (status) {
    case 'paga': return `${entrada ? 'Recebida' : 'Paga'} ${dia}/${mes}`;
    case 'atrasada': return `Atrasada há ${-dias} ${plural(-dias, 'dia', 'dias')}`;
    case 'hoje': return `${verbo} hoje`;
    case 'proxima': return `${verbo} em ${dias} ${plural(dias, 'dia', 'dias')}`;
    default: return `${verbo} ${dia}/${mes}`;
  }
}

function criarItemConta(ocorrencia) {
  const { conta, pagamento, status } = ocorrencia;
  const categoria = buscarCategoria(conta.categoria);
  // Paga: mostra o valor que de fato saiu. Pendente: o valor previsto.
  const valor = pagamento ? pagamento.valor : conta.valor;
  const entrada = Contas.ehEntrada(conta);
  const feito = entrada ? 'recebido' : 'pago';

  const li = document.createElement('li');
  li.className = `conta conta-${status}${entrada ? ' conta-entrada' : ''}`;
  li.innerHTML = `
    <button type="button" class="item">
      <span class="item-icone">${icone(categoria.icone)}</span>
      <span class="item-texto">
        <span class="item-descricao"></span>
        <span class="item-detalhe">Todo dia ${conta.dia} · ${pagamento ? feito : 'previsto'} ${entrada ? '+' : ''}${Dinheiro.formatar(valor)}</span>
      </span>
      <span class="selo selo-${status}">${icone(ICONE_STATUS_CONTA[status], 14)}${textoStatus(ocorrencia)}</span>
    </button>
  `;
  li.querySelector('.item-descricao').textContent = conta.descricao;
  li.querySelector('.item').addEventListener('click', () => abrirFormularioConta(conta));

  if (!pagamento) {
    const paguei = document.createElement('button');
    paguei.type = 'button';
    paguei.className = 'botao-paguei';
    paguei.textContent = entrada ? 'Recebi' : 'Paguei';
    paguei.addEventListener('click', () => pagarConta(ocorrencia));
    li.append(paguei);
  }
  return li;
}

// "Paguei": abre o formulário de lançamento já preenchido com a conta.
// A data sugerida é hoje se a conta é do mês atual; senão, o dia do vencimento.
function pagarConta({ conta, vencimento }) {
  const hoje = hojeISO();
  const mesmoMes = vencimento.slice(0, 7) === hoje.slice(0, 7);
  abrirFormulario(null, {
    conta,
    competencia: competencia(estado.ano, estado.mes),
    data: mesmoMes ? hoje : vencimento,
  });
}

// ---------- Previsão do fim do mês (Entrega 2.4) ----------

// saldo = saldo do mês que já está no resumo (com os mesmos filtros)
function renderizarPrevisao(saldo) {
  const hoje = hojeISO();
  const mesPassado = competencia(estado.ano, estado.mes) < hoje.slice(0, 7);
  const { temContas, aPagar, aReceber } = Contas.pendentesNoMes(estado.ano, estado.mes, hoje, estado.filtros);

  // Só faz sentido no mês atual ou nos futuros, e se houver fixos
  el.cardPrevisao.hidden = mesPassado || !temContas;
  if (el.cardPrevisao.hidden) return;

  // Previsão = saldo de hoje + o que ainda vai entrar − o que ainda vai sair
  const previsto = saldo + aReceber.total - aPagar.total;
  el.previsao.textContent = Dinheiro.formatar(previsto);
  el.previsao.classList.toggle('negativo', previsto < 0);
  const partes = [`Saldo ${Dinheiro.formatar(saldo)}`];
  if (aReceber.quantidade) partes.push(`+ ${Dinheiro.formatar(aReceber.total)} a receber`);
  if (aPagar.quantidade) {
    partes.push(`− ${Dinheiro.formatar(aPagar.total)} de ${aPagar.quantidade} ${plural(aPagar.quantidade, 'conta a pagar', 'contas a pagar')}`);
  }
  el.previsaoDetalhe.textContent = partes.length === 1
    ? 'Todos os fixos do mês já foram pagos e recebidos.'
    : partes.join(' ');
}

// ---------- Formulário de conta fixa ----------

// sugestao: dados vindos da frase rápida ("aluguel 1200 todo dia 7"), para conferir e salvar
function abrirFormularioConta(conta = null, sugestao = null) {
  const f = el.formularioConta.elements;
  el.formularioConta.reset();
  el.erroConta.textContent = '';
  estado.editandoContaId = conta ? conta.id : null;

  el.excluirConta.hidden = !conta;
  el.calendarioConta.hidden = !conta;

  const dados = conta || sugestao;
  f.movimento.value = dados ? Contas.movimento(dados) : 'saida';
  atualizarMovimentoConta();
  el.tituloConta.textContent = conta ? 'Editar fixo' : sugestao ? 'Confira o fixo' : 'Novo fixo';
  if (dados) {
    f.descricao.value = dados.descricao;
    f.valor.value = Dinheiro.paraCampo(dados.valor);
    f.dia.value = dados.dia;
    f.categoria.value = dados.categoria;
    f.tipo.value = dados.tipo;
  }

  el.dialogoConta.showModal();
  if (!dados) f.descricao.focus();
}

// Saída ou entrada: muda as categorias e o texto do dia ("Vence" x "Cai")
function atualizarMovimentoConta() {
  const f = el.formularioConta.elements;
  const movimento = f.movimento.value;
  const escolhida = f.categoria.value;
  f.categoria.replaceChildren(...CATEGORIAS[movimento].map((c) => new Option(c.nome, c.id)));
  if (CATEGORIAS[movimento].some((c) => c.id === escolhida)) f.categoria.value = escolhida;
  el.rotuloDiaConta.textContent = movimento === 'entrada' ? 'Cai todo dia' : 'Vence todo dia';
  f.descricao.placeholder = movimento === 'entrada' ? 'Ex.: Salário' : 'Ex.: Aluguel';
}

el.formularioConta.addEventListener('change', (evento) => {
  if (evento.target.name === 'movimento') atualizarMovimentoConta();
});

function lerFormularioConta() {
  const f = el.formularioConta.elements;
  const valor = Dinheiro.paraCentavos(f.valor.value);
  const dia = Number(f.dia.value);
  if (!f.descricao.value.trim()) return { erro: 'Informe uma descrição.' };
  if (valor === null) return { erro: 'Informe o valor previsto. Ex.: 150,00' };
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return { erro: 'O dia do vencimento vai de 1 a 31.' };
  return {
    dados: {
      movimento: f.movimento.value,
      descricao: f.descricao.value,
      valor,
      dia,
      categoria: f.categoria.value,
      tipo: f.tipo.value,
    },
  };
}

el.botaoNovaConta.addEventListener('click', () => abrirFormularioConta());
el.cancelarConta.addEventListener('click', () => el.dialogoConta.close());

el.formularioConta.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const { dados, erro } = lerFormularioConta();
  if (erro) {
    el.erroConta.textContent = erro;
    return;
  }
  if (estado.editandoContaId) {
    Contas.atualizar(estado.editandoContaId, dados);
  } else {
    // A conta vale a partir do mês que está na tela
    Contas.criar({ ...dados, inicio: competencia(estado.ano, estado.mes) });
  }
  el.dialogoConta.close();
  renderizar();
});

el.excluirConta.addEventListener('click', () => {
  if (!estado.editandoContaId) return;
  const ok = confirm('Excluir este fixo? Ele deixa de aparecer nos próximos meses.\n\nOs lançamentos já feitos continuam lá.');
  if (!ok) return;
  Contas.excluir(estado.editandoContaId);
  el.dialogoConta.close();
  renderizar();
});

// ---------- Calendário (Entrega 2.3) ----------

// Baixa o arquivo .ics. No iPhone, o Safari oferece "Adicionar ao Calendário".
function exportarParaCalendario(contas) {
  const ics = Calendario.gerar(contas);
  const arquivo = new File([ics], Calendario.nomeDoArquivo(contas), { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement('a');
  link.href = url;
  link.download = arquivo.name;
  link.click();
  // Damos um tempo antes de liberar o arquivo: o iPhone pode demorar para abri-lo
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  el.mensagemCalendario.textContent = contas.length === 1
    ? `Arquivo gerado para "${contas[0].descricao}". Abra e toque em "Adicionar".`
    : `Arquivo gerado com ${contas.length} contas. Abra e toque em "Adicionar tudo".`;
}

el.botaoCalendario.addEventListener('click', () => exportarParaCalendario(Contas.listar()));

el.calendarioConta.addEventListener('click', () => {
  const conta = Contas.buscar(estado.editandoContaId);
  if (!conta) return;
  el.dialogoConta.close();
  exportarParaCalendario([conta]);
});
