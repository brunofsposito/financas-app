// Liga a tela às regras: reage aos cliques e desenha os dados na página.

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const hoje = new Date();
const estado = {
  ano: hoje.getFullYear(),
  mes: hoje.getMonth() + 1, // getMonth() começa em 0 (janeiro = 0)
  editandoId: null, // id do lançamento aberto no formulário (null = novo)
  pagando: null, // { contaId, competencia } quando o formulário registra o pagamento de uma conta
  filtros: { tipo: '', categoria: '' }, // '' = todos
};

const el = {
  tituloMes: document.getElementById('titulo-mes'),
  topoAno: document.getElementById('topo-ano'),
  mesAnterior: document.getElementById('mes-anterior'),
  mesSeguinte: document.getElementById('mes-seguinte'),
  botaoHoje: document.getElementById('botao-hoje'),
  chips: document.querySelectorAll('.chip'),
  filtroCategoria: document.getElementById('filtro-categoria'),
  avisoFiltro: document.getElementById('aviso-filtro'),
  limparFiltros: document.getElementById('limpar-filtros'),
  rotuloSaldo: document.getElementById('rotulo-saldo'),
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
  chipsCategoria: document.getElementById('chips-categoria'),
  chipsData: document.querySelectorAll('.chip-opcao[data-quando]'),
  chipCalendario: document.querySelector('.chip-calendario'),
  fraseEntendida: document.getElementById('frase-entendida'),
  toast: document.getElementById('toast'),
  toastTexto: document.getElementById('toast-texto'),
  toastDesfazer: document.getElementById('toast-desfazer'),
};

// ---------- Abas (V2) ----------
// A aba aberta fica no endereço da página (#contas, #orcamentos...).
// Assim o botão "voltar" do navegador funciona e dá para abrir uma aba por link.

const ABAS = ['inicio', 'contas', 'orcamentos', 'analises', 'ajustes'];

function abaDoEndereco() {
  const aba = location.hash.slice(1);
  return ABAS.includes(aba) ? aba : 'inicio';
}

function irParaAba(aba) {
  if (abaDoEndereco() !== aba) history.pushState(null, '', `#${aba}`);
  mostrarAba();
}

function mostrarAba() {
  const aba = abaDoEndereco();
  document.querySelectorAll('[data-aba]').forEach((secao) => {
    secao.hidden = secao.dataset.aba !== aba;
  });
  document.querySelectorAll('.nav-aba').forEach((botao) => {
    const ativa = botao.dataset.ir === aba;
    botao.classList.toggle('ativa', ativa);
    if (ativa) botao.setAttribute('aria-current', 'page');
    else botao.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-aba').forEach((botao) => {
  botao.addEventListener('click', () => irParaAba(botao.dataset.ir));
});
window.addEventListener('popstate', mostrarAba); // botão "voltar"

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
  if (estado.analise) estado.analise.selecionado = null; // o mês tocado no gráfico era de outra janela
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
  el.tituloMes.textContent = MESES[estado.mes - 1];
  el.topoAno.textContent = estado.ano;
  el.botaoHoje.hidden = ehMesAtual();

  // Primeiro o mês, depois os filtros. O resumo e a lista usam o mesmo resultado.
  const doMes = Lancamentos.doMes(estado.ano, estado.mes);
  const visiveis = Lancamentos.filtrar(doMes, estado.filtros);
  const { entrou, saiu, saldo } = Lancamentos.resumo(visiveis);
  const filtrando = temFiltroAtivo();

  el.entrou.textContent = Dinheiro.formatar(entrou);
  el.saiu.textContent = Dinheiro.formatar(saiu);
  renderizarValorHeroi(el.saldo, saldo);
  el.saldo.classList.toggle('negativo', saldo < 0);
  el.rotuloSaldo.textContent = filtrando ? 'Saldo do mês (filtrado)' : 'Saldo do mês';

  el.lista.replaceChildren(...visiveis.map(criarItemDaLista));
  el.vazio.hidden = visiveis.length > 0;
  el.vazio.innerHTML = doMes.length === 0
    ? 'Nenhum lançamento neste mês.<br>Toque em <strong>+</strong> para começar.'
    : 'Nenhum lançamento com esses filtros neste mês.';

  renderizarFiltros(filtrando);
  renderizarContas(); // tela-contas.js
  renderizarAvisos(); // tela-avisos.js
  renderizarPrevisao(saldo); // tela-contas.js
  renderizarDashboard(doMes); // tela-dashboard.js
  renderizarOrcamentos(); // tela-orcamentos.js
  renderizarAnalises(); // tela-analises.js
}

// O saldo em destaque: inteiro grande e fino, centavos e "R$" pequenos ao lado
function renderizarValorHeroi(elemento, centavos) {
  const { sinal, inteiro, centavos: dec } = Dinheiro.partes(centavos);
  const pedaco = (classe, texto) => {
    const span = document.createElement('span');
    span.className = classe;
    span.textContent = texto;
    return span;
  };
  elemento.replaceChildren(pedaco('inteiro', sinal + inteiro), pedaco('centavos', dec), pedaco('moeda', 'R$'));
  elemento.setAttribute('aria-label', Dinheiro.formatar(centavos));
}

// ---------- Filtros ----------

function temFiltroAtivo() {
  return Boolean(estado.filtros.tipo || estado.filtros.categoria);
}

function preencherFiltroCategoria() {
  const grupo = (rotulo, categorias) => {
    const g = document.createElement('optgroup');
    g.label = rotulo;
    g.append(...categorias.map((c) => new Option(c.nome, c.id)));
    return g;
  };
  el.filtroCategoria.replaceChildren(
    new Option('Todas as categorias', ''),
    grupo('Entradas', CATEGORIAS.entrada),
    grupo('Saídas', CATEGORIAS.saida),
  );
}

function renderizarFiltros(filtrando) {
  el.chips.forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.tipo === estado.filtros.tipo));
  });
  el.filtroCategoria.value = estado.filtros.categoria;
  el.filtroCategoria.classList.toggle('ativo', Boolean(estado.filtros.categoria));
  el.avisoFiltro.hidden = !filtrando;
}

el.chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    estado.filtros.tipo = chip.dataset.tipo;
    renderizar();
  });
});

el.filtroCategoria.addEventListener('change', () => {
  estado.filtros.categoria = el.filtroCategoria.value;
  renderizar();
});

el.limparFiltros.addEventListener('click', () => {
  estado.filtros = { tipo: '', categoria: '' };
  renderizar();
});

function criarItemDaLista(l) {
  const categoria = buscarCategoria(l.categoria);
  const [, mes, dia] = l.data.split('-');
  const sinal = l.movimento === 'entrada' ? '+' : '−';

  const li = document.createElement('li');
  // Cada item é um botão: tocar nele abre o lançamento para editar
  li.innerHTML = `
    <button type="button" class="item item-${l.movimento}">
      <span class="item-icone">${icone(categoria.icone)}</span>
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
    `${dia}/${mes} · ${categoria.nome} · ${l.tipo === 'pessoal' ? 'Pessoal' : 'Profissional'}${l.contaId ? ' · Conta fixa' : ''}`;
  li.querySelector('button').addEventListener('click', () => abrirFormulario(l));
  return li;
}

// ---------- Formulário ----------

// Categorias como chips com ícone. Por baixo são botões de opção (radio) com
// name="categoria": assim f.categoria.value continua funcionando para ler e escrever.
function preencherCategorias(movimento) {
  const chips = CATEGORIAS[movimento].map((c) => {
    const label = document.createElement('label');
    label.className = 'chip-categoria';
    label.innerHTML = `<input type="radio" name="categoria" value="${c.id}"><span>${icone(c.icone, 16)}${c.nome}</span>`;
    return label;
  });
  el.chipsCategoria.replaceChildren(...chips);
}

// Destaca "Hoje" ou "Ontem" quando a data escolhida é uma delas
function atualizarChipsData() {
  const data = el.formulario.elements.data.value;
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemISO = dataISO(ontem.getFullYear(), ontem.getMonth() + 1, ontem.getDate());
  const quando = data === hojeISO() ? 'hoje' : data === ontemISO ? 'ontem' : '';
  el.chipsData.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.quando === quando)));
  el.chipCalendario.classList.toggle('ativo', Boolean(data) && !quando);
  return { ontemISO };
}

// Data sugerida para um lançamento novo: hoje, se a tela está no mês atual.
// Em outro mês, o mesmo dia de hoje naquele mês (ex.: dia 31 em fevereiro vira dia 28).
function dataSugeridaISO() {
  const hojeDia = new Date().getDate();
  const ultimoDiaDoMes = new Date(estado.ano, estado.mes, 0).getDate();
  const dia = Math.min(hojeDia, ultimoDiaDoMes);
  return `${estado.ano}-${String(estado.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function preencherCampos(d) {
  const f = el.formulario.elements;
  f.movimento.value = d.movimento;
  preencherCategorias(d.movimento);
  if (d.valor) f.valor.value = Dinheiro.paraCampo(d.valor);
  f.descricao.value = d.descricao || '';
  if (d.categoria) f.categoria.value = d.categoria;
  f.data.value = d.data;
  f.tipo.value = d.tipo || 'pessoal';
}

// Quatro modos:
// - novo: abrirFormulario()
// - editar: abrirFormulario(lancamento)
// - pagar conta: abrirFormulario(null, { conta, competencia, data }), já preenchido com a conta
// - sugestão da frase rápida (V4): abrirFormulario(null, null, { dados, frase })
function abrirFormulario(lancamento = null, pagamento = null, sugestao = null) {
  const f = el.formulario.elements;
  el.formulario.reset();
  el.erro.textContent = '';
  estado.editandoId = lancamento ? lancamento.id : null;
  estado.pagando = pagamento ? { contaId: pagamento.conta.id, competencia: pagamento.competencia } : null;

  el.tituloFormulario.textContent = lancamento ? 'Editar lançamento'
    : pagamento ? `Pagar: ${pagamento.conta.descricao}`
      : sugestao ? 'Confira e salve' : 'Novo lançamento';
  el.botaoExcluir.hidden = !lancamento;
  el.fraseEntendida.hidden = !sugestao;
  if (sugestao) el.fraseEntendida.textContent = `“${sugestao.frase}”`;

  if (pagamento) {
    const { conta } = pagamento;
    // O valor da conta é previsto: dá para ajustar antes de salvar
    preencherCampos({ ...conta, movimento: 'saida', data: pagamento.data });
  } else if (lancamento) {
    preencherCampos(lancamento);
  } else if (sugestao) {
    preencherCampos(sugestao.dados);
  } else {
    preencherCampos({ movimento: 'saida', data: dataSugeridaISO() });
  }
  atualizarChipsData();
  ajustarLarguraValor();

  el.dialogo.showModal();
  // No modo novo, já abre o teclado no valor. Na confirmação da frase rápida,
  // o foco vai para o Salvar (um segundo "Enter" já salva). Nos outros, nada.
  if (sugestao) el.formulario.querySelector('[type=submit]').focus();
  else if (!lancamento && !pagamento) f.valor.focus();
}

function lerFormulario() {
  const f = el.formulario.elements;
  const valor = Dinheiro.paraCentavos(f.valor.value);
  if (valor === null) return { erro: 'Informe um valor maior que zero. Ex.: 150,00' };
  // Categoria antes da descrição: escolher a categoria já preenche a descrição
  if (!f.categoria.value) return { erro: 'Escolha uma categoria.' };
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

// O campo do valor cresce com o que foi digitado, para o "R$" ficar colado no número
function ajustarLarguraValor() {
  const campo = el.formulario.elements.valor;
  const texto = campo.value || campo.placeholder;
  campo.style.width = `${texto.length * 0.62 + 0.3}em`; // ~0,62em por dígito na fonte Sora
}

el.formulario.addEventListener('input', (evento) => {
  el.erro.textContent = ''; // corrigiu algo: some a mensagem de erro
  if (evento.target.name === 'valor') ajustarLarguraValor();
});

el.formulario.addEventListener('change', (evento) => {
  // Ao trocar entre Entrada e Saída, a lista de categorias muda junto
  if (evento.target.name === 'movimento') preencherCategorias(evento.target.value);
  // A descrição vazia ganha o nome da categoria escolhida (menos digitação)
  if (evento.target.name === 'categoria' && !el.formulario.elements.descricao.value.trim()) {
    el.formulario.elements.descricao.value = buscarCategoria(evento.target.value).nome;
  }
  if (evento.target.name === 'data') atualizarChipsData();
  el.erro.textContent = '';
});

el.chipsData.forEach((chip) => {
  chip.addEventListener('click', () => {
    const { ontemISO } = atualizarChipsData();
    el.formulario.elements.data.value = chip.dataset.quando === 'hoje' ? hojeISO() : ontemISO;
    atualizarChipsData();
  });
});

el.formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const { dados, erro } = lerFormulario();
  if (erro) {
    el.erro.textContent = erro;
    return;
  }
  if (estado.editandoId) {
    Lancamentos.atualizar(estado.editandoId, dados);
  } else {
    const novo = Lancamentos.criar({ ...dados, ...estado.pagando });
    mostrarToast(`${dados.descricao.trim()} · ${Dinheiro.formatar(dados.valor)} salvo`, () => {
      Lancamentos.excluir(novo.id);
      renderizar();
    });
  }
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

// ---------- Aviso rápido "Salvo · Desfazer" ----------

let temporizadorToast = null;

function mostrarToast(texto, aoDesfazer) {
  el.toastTexto.textContent = texto;
  el.toastDesfazer.hidden = !aoDesfazer;
  el.toastDesfazer.onclick = () => {
    esconderToast();
    aoDesfazer();
  };
  el.toast.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(esconderToast, 6000); // some sozinho depois de 6 segundos
}

function esconderToast() {
  el.toast.hidden = true;
}

// ---------- Backup ----------

el.botaoExportar = document.getElementById('botao-exportar');
el.botaoImportar = document.getElementById('botao-importar');
el.arquivoBackup = document.getElementById('arquivo-backup');
el.ultimoBackup = document.getElementById('ultimo-backup');
el.mensagemBackup = document.getElementById('mensagem-backup');

function renderizarUltimoBackup() {
  const data = Backup.ultimaExportacao();
  el.ultimoBackup.textContent = data
    ? `Último backup: ${data.toLocaleDateString('pt-BR')}`
    : 'Nenhum backup feito ainda.';
}

async function exportarBackup() {
  const json = JSON.stringify(Backup.gerar(), null, 2);
  const arquivo = new File([json], Backup.nomeDoArquivo(), { type: 'application/json' });

  // No celular, abre o menu de compartilhar (salvar em Arquivos, e-mail...).
  // No computador, baixa o arquivo direto.
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: 'Backup das finanças' });
    } catch (erro) {
      if (erro.name === 'AbortError') return; // a pessoa fechou o menu sem salvar
      throw erro;
    }
  } else {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = arquivo.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  Backup.registrarExportacao();
  renderizarUltimoBackup();
  el.mensagemBackup.textContent =
    `Backup gerado com ${Lancamentos.listar().length} lançamento(s), ${Contas.listar().length} conta(s) fixa(s) `
    + `e ${Orcamentos.listar().length} orçamento(s).`;
}

async function importarBackup(arquivo) {
  try {
    const dados = Backup.validar(await arquivo.text());
    const ok = confirm(`Importar ${dados.lancamentos.length} lançamento(s), ${dados.contas.length} conta(s) fixa(s) e ${dados.orcamentos.length} orçamento(s) deste backup?\n\nOs dados atuais são mantidos. Os que já existirem serão atualizados com a versão do backup.`);
    if (!ok) return;
    const r = Backup.importar(dados);
    el.mensagemBackup.textContent =
      `Importado: ${r.lancamentos.novos} lançamento(s) novo(s), ${r.contas.novos} conta(s) nova(s), `
      + `${r.orcamentos.novos} orçamento(s) novo(s). `
      + `Atualizados: ${r.lancamentos.atualizados + r.contas.atualizados + r.orcamentos.atualizados}.`;
    renderizar();
  } catch (erro) {
    el.mensagemBackup.textContent = erro.message;
  }
}

el.botaoExportar.addEventListener('click', () => {
  exportarBackup().catch(() => {
    el.mensagemBackup.textContent = 'Não foi possível gerar o backup.';
  });
});
el.botaoImportar.addEventListener('click', () => el.arquivoBackup.click());
el.arquivoBackup.addEventListener('change', () => {
  const arquivo = el.arquivoBackup.files[0];
  el.arquivoBackup.value = ''; // permite escolher o mesmo arquivo de novo depois
  if (arquivo) importarBackup(arquivo);
});

// Começa só depois que todos os arquivos .js foram carregados
// (renderizar() usa funções de tela-contas.js, que carrega depois deste).
document.addEventListener('DOMContentLoaded', () => {
  preencherFiltroCategoria();
  renderizarUltimoBackup();
  renderizar();
  mostrarAba();
});
