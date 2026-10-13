// Tela das contas fixas (Fase 2): lista do mês com status, botão "Paguei",
// formulário de conta e o alerta no topo. As regras ficam em contas.js.

Object.assign(el, {
  alertaContas: document.getElementById('alerta-contas'),
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
});

estado.editandoContaId = null;

const plural = (n, um, varios) => (n === 1 ? um : varios);

// ---------- Lista de contas do mês ----------

function renderizarContas() {
  const ocorrencias = Contas.doMes(estado.ano, estado.mes, hojeISO());
  el.listaContas.replaceChildren(...ocorrencias.map(criarItemConta));
  el.contasVazio.hidden = ocorrencias.length > 0;
}

// Texto curto do status, ex.: "Vence em 3 dias", "Atrasada há 2 dias"
function textoStatus({ status, dias, pagamento, vencimento }) {
  const [, mes, dia] = (pagamento ? pagamento.data : vencimento).split('-');
  switch (status) {
    case 'paga': return `✅ Paga ${dia}/${mes}`;
    case 'atrasada': return `Atrasada há ${-dias} ${plural(-dias, 'dia', 'dias')}`;
    case 'hoje': return 'Vence hoje';
    case 'proxima': return `Vence em ${dias} ${plural(dias, 'dia', 'dias')}`;
    default: return `Vence ${dia}/${mes}`;
  }
}

function criarItemConta(ocorrencia) {
  const { conta, pagamento, status } = ocorrencia;
  const categoria = buscarCategoria(conta.categoria);
  // Paga: mostra o valor que de fato saiu. Pendente: o valor previsto.
  const valor = pagamento ? pagamento.valor : conta.valor;

  const li = document.createElement('li');
  li.className = `conta conta-${status}`;
  li.innerHTML = `
    <button type="button" class="item">
      <span class="item-icone" aria-hidden="true">${categoria.icone}</span>
      <span class="item-texto">
        <span class="item-descricao"></span>
        <span class="item-detalhe">Todo dia ${conta.dia} · ${pagamento ? 'pago' : 'previsto'} ${Dinheiro.formatar(valor)}</span>
      </span>
      <span class="selo selo-${status}">${textoStatus(ocorrencia)}</span>
    </button>
  `;
  li.querySelector('.item-descricao').textContent = conta.descricao;
  li.querySelector('.item').addEventListener('click', () => abrirFormularioConta(conta));

  if (!pagamento) {
    const paguei = document.createElement('button');
    paguei.type = 'button';
    paguei.className = 'botao-paguei';
    paguei.textContent = 'Paguei';
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

// ---------- Alerta no topo ----------

function renderizarAlerta() {
  const { atrasadas, emBreve } = Contas.alertas(hojeISO());
  const partes = [];
  if (atrasadas.length) {
    partes.push(`${atrasadas.length} ${plural(atrasadas.length, 'conta atrasada', 'contas atrasadas')}`);
  }
  if (emBreve.length) {
    partes.push(`${emBreve.length} ${plural(emBreve.length, 'vence', 'vencem')} nos próximos ${Contas.DIAS_ALERTA} dias`);
  }
  el.alertaContas.hidden = partes.length === 0;
  if (!partes.length) return;

  el.alertaContas.classList.toggle('alerta-atrasada', atrasadas.length > 0);
  el.alertaContas.textContent = `${atrasadas.length ? '⚠️' : '🔔'} ${partes.join(' · ')}`;
  // Tocar no alerta leva ao mês da conta mais urgente e rola até as contas
  const primeira = atrasadas[0] || emBreve[0];
  el.alertaContas.onclick = () => {
    const [ano, mes] = primeira.vencimento.split('-').map(Number);
    irParaMes(ano, mes);
    el.secaoContas.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

// ---------- Formulário de conta fixa ----------

function abrirFormularioConta(conta = null) {
  const f = el.formularioConta.elements;
  el.formularioConta.reset();
  el.erroConta.textContent = '';
  estado.editandoContaId = conta ? conta.id : null;

  el.tituloConta.textContent = conta ? 'Editar conta fixa' : 'Nova conta fixa';
  el.excluirConta.hidden = !conta;
  f.categoria.replaceChildren(...CATEGORIAS.saida.map((c) => new Option(`${c.icone} ${c.nome}`, c.id)));

  if (conta) {
    f.descricao.value = conta.descricao;
    f.valor.value = Dinheiro.paraCampo(conta.valor);
    f.dia.value = conta.dia;
    f.categoria.value = conta.categoria;
    f.tipo.value = conta.tipo;
  }

  el.dialogoConta.showModal();
  if (!conta) f.descricao.focus();
}

function lerFormularioConta() {
  const f = el.formularioConta.elements;
  const valor = Dinheiro.paraCentavos(f.valor.value);
  const dia = Number(f.dia.value);
  if (!f.descricao.value.trim()) return { erro: 'Informe uma descrição.' };
  if (valor === null) return { erro: 'Informe o valor previsto. Ex.: 150,00' };
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return { erro: 'O dia do vencimento vai de 1 a 31.' };
  return {
    dados: {
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
  const ok = confirm('Excluir esta conta fixa? Ela deixa de aparecer nos próximos meses.\n\nOs pagamentos já feitos continuam nos lançamentos.');
  if (!ok) return;
  Contas.excluir(estado.editandoContaId);
  el.dialogoConta.close();
  renderizar();
});
