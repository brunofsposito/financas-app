// Orçamento por categoria: um limite mensal de gasto (ex.: Mercado até R$ 800).
// O mesmo limite vale para todos os meses.
//
// Para cada mês, comparamos o limite com:
// - gasto: saídas já lançadas naquela categoria;
// - previsto: contas fixas daquela categoria ainda não pagas no mês.
// Gasto + previsto = "comprometido": o que vai sair até o fim do mês.

const Orcamentos = {
  PERTO_DO_LIMITE: 0.8, // a partir de 80% usado, avisa

  // SELECT * FROM orcamentos. A categoria é a chave: um limite por categoria.
  listar() {
    return Storage.carregar('orcamentos');
  },

  buscar(categoria) {
    return this.listar().find((o) => o.categoria === categoria) || null;
  },

  // Cria ou atualiza (um "UPSERT"): se a categoria já tem limite, troca o valor
  definir(categoria, limite) {
    const todos = this.listar();
    const existente = todos.find((o) => o.categoria === categoria);
    if (existente) {
      existente.limite = limite;
      existente.atualizadoEm = new Date().toISOString();
    } else {
      todos.push({ categoria, limite, criadoEm: new Date().toISOString() });
    }
    Storage.salvar('orcamentos', todos);
  },

  remover(categoria) {
    Storage.salvar('orcamentos', this.listar().filter((o) => o.categoria !== categoria));
  },

  // Situação de cada orçamento num mês, do mais apertado para o mais folgado.
  // status: 'estourado' | 'vai-estourar' | 'perto' | 'ok'
  doMes(ano, mes, hojeISO) {
    const lancamentos = Lancamentos.doMes(ano, mes);
    const contasPendentes = Contas.doMes(ano, mes, hojeISO).filter((o) => o.status !== 'paga');

    return this.listar()
      .map(({ categoria, limite }) => {
        const gasto = somar(lancamentos.filter((l) => l.movimento === 'saida' && l.categoria === categoria));
        const previsto = somar(contasPendentes.map((o) => o.conta).filter((c) => c.categoria === categoria));
        let status = 'ok';
        if (gasto > limite) status = 'estourado';
        else if (gasto + previsto > limite) status = 'vai-estourar';
        else if (gasto >= limite * this.PERTO_DO_LIMITE) status = 'perto';
        return { categoria, limite, gasto, previsto, status, uso: (gasto + previsto) / limite };
      })
      .sort((a, b) => b.uso - a.uso);
  },

  // Para o alerta no topo: orçamentos do mês atual que pedem atenção
  alertas(hojeISO) {
    const [ano, mes] = hojeISO.split('-').map(Number);
    return this.doMes(ano, mes, hojeISO).filter((o) => o.status !== 'ok');
  },
};

function somar(registros) {
  return registros.reduce((soma, r) => soma + r.valor, 0);
}
