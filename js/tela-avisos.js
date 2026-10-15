// Avisos: em vez de um "relatório" ("1 conta atrasada · 2 orçamentos..."),
// mostramos UMA coisa por vez, a mais urgente, já com o botão que resolve.
// Os outros avisos ficam atrás de "+N avisos", cada um com a sua ação.

Object.assign(el, {
  aviso: document.getElementById('aviso'),
  avisoIcone: document.getElementById('aviso-icone'),
  avisoTexto: document.getElementById('aviso-texto'),
  avisoAcao: document.getElementById('aviso-acao'),
  maisAvisos: document.getElementById('mais-avisos'),
  dialogoAvisos: document.getElementById('dialogo-avisos'),
  listaAvisos: document.getElementById('lista-avisos'),
  fecharAvisos: document.getElementById('fechar-avisos'),
});

// Ordem de urgência: quanto menor, mais urgente.
// Problema (rosa) vem antes de atenção (laranja); conta vem antes de orçamento
// quando o dinheiro já está atrasado ou vence hoje.
const URGENCIA = {
  'conta-atrasada': 1,
  'conta-hoje': 2,
  'orcamento-estourado': 3,
  'conta-proxima': 4,
  'orcamento-vai-estourar': 5,
  'orcamento-perto': 6,
};

// Junta os avisos de contas e de orçamentos numa fila só, do mais urgente ao menos.
function montarAvisos() {
  const hoje = hojeISO();
  const { atrasadas, emBreve } = Contas.alertas(hoje);
  const avisos = [];

  for (const o of [...atrasadas, ...emBreve]) {
    const dias = Math.abs(o.dias);
    const tipo = o.status === 'atrasada' ? 'conta-atrasada' : o.status === 'hoje' ? 'conta-hoje' : 'conta-proxima';
    const texto = {
      'conta-atrasada': `${o.conta.descricao} está atrasada há ${dias} ${plural(dias, 'dia', 'dias')}`,
      'conta-hoje': `${o.conta.descricao} vence hoje`,
      'conta-proxima': `${o.conta.descricao} vence em ${dias} ${plural(dias, 'dia', 'dias')}`,
    }[tipo];
    avisos.push({
      tipo,
      nivel: tipo === 'conta-atrasada' ? 'perigo' : 'aviso',
      icone: tipo === 'conta-atrasada' ? 'alerta' : 'relogio',
      texto,
      detalhe: Dinheiro.formatar(o.conta.valor),
      ordem: o.dias,
      acao: { rotulo: 'Paguei', executar: () => pagarContaDoAviso(o) },
    });
  }

  for (const o of Orcamentos.alertas(hoje)) {
    const nome = buscarCategoria(o.categoria).nome;
    const tipo = `orcamento-${o.status}`;
    const texto = {
      'orcamento-estourado': `${nome} estourou o limite em ${Dinheiro.formatar(o.gasto - o.limite)}`,
      'orcamento-vai-estourar': `${nome} vai estourar com as contas fixas`,
      'orcamento-perto': `${nome}: ${Math.round((o.gasto / o.limite) * 100)}% do orçamento usado`,
    }[tipo];
    avisos.push({
      tipo,
      nivel: o.status === 'estourado' ? 'perigo' : 'aviso',
      icone: 'pizza',
      texto,
      detalhe: `Limite de ${Dinheiro.formatar(o.limite)}`,
      ordem: -o.uso,
      acao: o.status === 'vai-estourar'
        ? { rotulo: 'Ver contas', executar: () => { el.dialogoAvisos.close(); verFixos(); } }
        : { rotulo: 'Ver gastos', executar: () => verGastosDaCategoria(o.categoria) },
    });
  }

  return avisos.sort((a, b) => URGENCIA[a.tipo] - URGENCIA[b.tipo] || a.ordem - b.ordem);
}

// ---------- Ações ----------

function pagarContaDoAviso(ocorrencia) {
  el.dialogoAvisos.close();
  const [ano, mes] = ocorrencia.vencimento.split('-').map(Number);
  irParaMes(ano, mes); // o pagamento é da competência da conta
  pagarConta(ocorrencia); // tela-contas.js: abre o formulário já preenchido
}

// Mostra os lançamentos do mês atual só daquela categoria
function verGastosDaCategoria(categoria) {
  el.dialogoAvisos.close();
  estado.filtros = { tipo: '', categoria };
  irParaHoje();
  irParaAba('inicio');
  document.getElementById('secao-lancamentos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Desenho ----------

function renderizarAvisos() {
  const avisos = montarAvisos();
  el.aviso.hidden = avisos.length === 0;
  el.maisAvisos.hidden = avisos.length < 2;
  if (!avisos.length) return;

  // O topo mostra só o mais urgente
  const [principal, ...resto] = avisos;
  el.aviso.className = `aviso aviso-${principal.nivel}`;
  el.avisoIcone.innerHTML = icone(principal.icone, 20);
  el.avisoTexto.textContent = principal.texto;
  el.avisoAcao.textContent = principal.acao.rotulo;
  el.avisoAcao.onclick = principal.acao.executar;
  el.maisAvisos.textContent = `+${resto.length} ${plural(resto.length, 'aviso', 'avisos')}`;

  // A lista completa (aberta pelo "+N avisos")
  el.listaAvisos.replaceChildren(...avisos.map(criarItemAviso));
}

function criarItemAviso(aviso) {
  const li = document.createElement('li');
  li.className = `aviso-item aviso-${aviso.nivel}`;
  li.innerHTML = `
    <span class="aviso-icone">${icone(aviso.icone, 18)}</span>
    <span class="aviso-item-texto"><span class="aviso-titulo"></span><span class="aviso-detalhe"></span></span>
    <button type="button" class="aviso-acao"></button>
  `;
  li.querySelector('.aviso-titulo').textContent = aviso.texto;
  li.querySelector('.aviso-detalhe').textContent = aviso.detalhe;
  const botao = li.querySelector('button');
  botao.textContent = aviso.acao.rotulo;
  botao.addEventListener('click', aviso.acao.executar);
  return li;
}

el.maisAvisos.addEventListener('click', () => el.dialogoAvisos.showModal());
el.fecharAvisos.addEventListener('click', () => el.dialogoAvisos.close());
