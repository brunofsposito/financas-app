// Contas recorrentes (Fase 2): aluguel, internet, assinaturas... e também
// entradas fixas, como o salário (campo `movimento`, D39).
// Uma conta é um "molde" que se repete todo mês num dia de vencimento.
//
// A conta NÃO guarda se foi paga. O pagamento é um lançamento comum com
// `contaId` (qual conta) e `competencia` (de qual mês, 'AAAA-MM').
// O status é calculado juntando as duas tabelas, como um LEFT JOIN:
//   contas LEFT JOIN lancamentos ON contaId = conta.id AND competencia = '2026-10'
// Assim, excluir o lançamento do pagamento faz a conta voltar a "pendente".

const Contas = {
  // SELECT * FROM contas ORDER BY dia
  listar() {
    return Storage.carregar('contas').sort((a, b) => a.dia - b.dia);
  },

  buscar(id) {
    return this.listar().find((c) => c.id === id) || null;
  },

  // Contas antigas não têm `movimento`: todas eram saídas
  movimento(conta) {
    return conta.movimento || 'saida';
  },

  ehEntrada(conta) {
    return this.movimento(conta) === 'entrada';
  },

  criar(dados) {
    const conta = {
      id: gerarId(),
      movimento: dados.movimento || 'saida', // 'entrada' (ex.: salário) ou 'saida' (ex.: aluguel)
      descricao: dados.descricao.trim(),
      valor: dados.valor, // valor previsto, em centavos (pode variar na hora de pagar)
      dia: dados.dia, // dia do vencimento, de 1 a 31
      categoria: dados.categoria,
      tipo: dados.tipo,
      inicio: dados.inicio, // 'AAAA-MM': a partir de qual mês a conta vale
      criadoEm: new Date().toISOString(),
    };
    const todas = Storage.carregar('contas');
    todas.push(conta);
    Storage.salvar('contas', todas);
    return conta;
  },

  atualizar(id, dados) {
    const todas = Storage.carregar('contas');
    const indice = todas.findIndex((c) => c.id === id);
    if (indice === -1) return null;
    todas[indice] = {
      ...todas[indice],
      movimento: dados.movimento || 'saida',
      descricao: dados.descricao.trim(),
      valor: dados.valor,
      dia: dados.dia,
      categoria: dados.categoria,
      tipo: dados.tipo,
      atualizadoEm: new Date().toISOString(),
    };
    Storage.salvar('contas', todas);
    return todas[indice];
  },

  // Excluir a conta encerra a recorrência. Os pagamentos já feitos
  // continuam nos lançamentos (são dinheiro que de fato saiu).
  excluir(id) {
    Storage.salvar('contas', Storage.carregar('contas').filter((c) => c.id !== id));
  },

  // ---------- Regras de vencimento e status ----------

  // Data de vencimento num mês. Dia 31 em fevereiro vira o último dia (28 ou 29).
  vencimentoNoMes(conta, ano, mes) {
    const ultimoDia = new Date(ano, mes, 0).getDate();
    return dataISO(ano, mes, Math.min(conta.dia, ultimoDia));
  },

  // A conta só vale a partir do mês em que foi cadastrada
  valeNoMes(conta, ano, mes) {
    return competencia(ano, mes) >= conta.inicio;
  },

  // O lançamento que pagou esta conta neste mês (o "JOIN"), ou null
  pagamentoNoMes(conta, ano, mes, lancamentos) {
    const comp = competencia(ano, mes);
    return lancamentos.find((l) => l.contaId === conta.id && l.competencia === comp) || null;
  },

  // Status de uma conta num mês, em relação a hoje.
  // status: 'paga' | 'atrasada' | 'hoje' | 'proxima' (vence em até DIAS_ALERTA) | 'futura'
  situacao(conta, ano, mes, hojeISO, lancamentos) {
    const vencimento = this.vencimentoNoMes(conta, ano, mes);
    const pagamento = this.pagamentoNoMes(conta, ano, mes, lancamentos);
    const dias = diasEntre(hojeISO, vencimento); // negativo = já passou
    let status;
    if (pagamento) status = 'paga';
    else if (dias < 0) status = 'atrasada';
    else if (dias === 0) status = 'hoje';
    else if (dias <= this.DIAS_ALERTA) status = 'proxima';
    else status = 'futura';
    return { conta, vencimento, pagamento, dias, status };
  },

  DIAS_ALERTA: 5, // "vence em breve" = nos próximos 5 dias

  // Todas as contas de um mês, com status, em ordem de vencimento
  doMes(ano, mes, hojeISO) {
    const lancamentos = Lancamentos.listar();
    return this.listar()
      .filter((c) => this.valeNoMes(c, ano, mes))
      .map((c) => this.situacao(c, ano, mes, hojeISO, lancamentos))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  },

  // Previsão (Entrega 2.4): o que ainda falta pagar e receber de fixos no mês.
  // Usa os mesmos filtros da tela (tipo e categoria), para bater com o resumo.
  // SELECT movimento, SUM(valor), COUNT(*) FROM contas do mês
  // WHERE não paga AND <filtros> GROUP BY movimento
  pendentesNoMes(ano, mes, hojeISO, filtros) {
    const doMes = this.doMes(ano, mes, hojeISO);
    const pendentes = Lancamentos.filtrar(
      doMes.filter((o) => o.status !== 'paga').map((o) => o.conta),
      filtros,
    );
    const resumo = (lista) => ({ quantidade: lista.length, total: lista.reduce((soma, c) => soma + c.valor, 0) });
    return {
      temContas: doMes.length > 0,
      aPagar: resumo(pendentes.filter((c) => !this.ehEntrada(c))),
      aReceber: resumo(pendentes.filter((c) => this.ehEntrada(c))),
    };
  },

  // Para o alerta no topo: contas atrasadas do mês atual e contas que vencem
  // nos próximos dias (olhando também o mês seguinte, para o fim do mês).
  // Só saídas: entrada fixa (salário) não é algo que você precisa "pagar".
  alertas(hojeISO) {
    const [ano, mes] = hojeISO.split('-').map(Number);
    const seguinte = new Date(ano, mes, 1); // mês seguinte (o Date resolve a virada de ano)
    const ocorrencias = [
      ...this.doMes(ano, mes, hojeISO),
      ...this.doMes(seguinte.getFullYear(), seguinte.getMonth() + 1, hojeISO),
    ].filter((o) => !this.ehEntrada(o.conta));
    return {
      atrasadas: ocorrencias.filter((o) => o.status === 'atrasada'),
      emBreve: ocorrencias.filter((o) => o.status === 'hoje' || o.status === 'proxima'),
    };
  },
};

// ---------- Ajudantes de data ----------

function dataISO(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function competencia(ano, mes) {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

function hojeISO() {
  const d = new Date();
  return dataISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// Diferença em dias entre duas datas 'AAAA-MM-DD'. Usamos UTC para o
// horário de verão não "roubar" uma hora e errar a conta.
function diasEntre(deISO, ateISO) {
  const utc = (iso) => {
    const [a, m, d] = iso.split('-').map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((utc(ateISO) - utc(deISO)) / 86400000);
}
