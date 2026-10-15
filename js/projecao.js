// Projeção do acumulado (D45): "se continuar assim, quanto vai sobrar?"
// Decisões do Bruno: soma só o que sobra A PARTIR DE AGORA (sem saldo inicial) e SEM JUROS.
//
// A conta separa o que é certo do que é estimado:
//   sobra de um mês = fixos (entradas fixas − contas fixas, cadastrados)
//                   + variáveis (a média do que entrou − saiu fora dos fixos nos últimos meses)
// A faixa usa o pior e o melhor mês recente de variáveis, no lugar da média.
// Este arquivo não sabe nada de tela.

const Projecao = {
  MESES_BASE: 3, // quantos meses fechados entram na média dos variáveis
  HORIZONTE: 12, // meses à frente

  calcular(hoje) {
    const [ano, mes, dia] = hoje.split('-').map(Number);
    const contas = Contas.listar();
    const base = this.mesesBase(ano, mes, contas);
    const variaveis = base.map((b) => b.variavel);
    const temVariaveis = variaveis.length > 0;
    const cenarios = {
      provavel: temVariaveis ? Math.round(variaveis.reduce((s, v) => s + v, 0) / variaveis.length) : 0,
      pior: temVariaveis ? Math.min(...variaveis) : 0,
      melhor: temVariaveis ? Math.max(...variaveis) : 0,
    };
    if (!temVariaveis && contas.length === 0) return { disponivel: false };

    // Mês atual: o saldo de hoje + fixos que ainda faltam + a parte dos variáveis que falta do mês
    const doMes = Lancamentos.doMes(ano, mes);
    const saldoHoje = Lancamentos.resumo(doMes).saldo;
    const { aPagar, aReceber } = Contas.pendentesNoMes(ano, mes, hoje, {});
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const restante = (diasNoMes - dia) / diasNoMes;

    const serie = [];
    const acumulado = { provavel: 0, pior: 0, melhor: 0 };
    for (let k = 0; k <= this.HORIZONTE; k++) {
      const d = new Date(ano, mes - 1 + k, 1);
      const m = { ano: d.getFullYear(), mes: d.getMonth() + 1 };
      for (const c of Object.keys(acumulado)) {
        acumulado[c] += k === 0
          ? saldoHoje + aReceber.total - aPagar.total + Math.round(cenarios[c] * restante)
          : this.fixosDoMes(contas, m) + cenarios[c];
      }
      serie.push({ ...m, k, ...acumulado });
    }

    return {
      disponivel: true,
      serie,
      fixosPorMes: this.fixosDoMes(contas, serie[1]),
      variaveisPorMes: cenarios.provavel,
      mesesBase: base.length,
      temVariaveis,
    };
  },

  // Entradas fixas − contas fixas que valem naquele mês
  fixosDoMes(contas, { ano, mes }) {
    return contas
      .filter((c) => Contas.valeNoMes(c, ano, mes))
      .reduce((soma, c) => soma + (Contas.ehEntrada(c) ? c.valor : -c.valor), 0);
  },

  // Os últimos meses FECHADOS com lançamentos (até 12 meses para trás), com o
  // saldo só dos variáveis: SUM(entradas) − SUM(saídas) WHERE não é de um fixo
  mesesBase(ano, mes, contas) {
    const base = [];
    for (let i = 1; i <= 12 && base.length < this.MESES_BASE; i++) {
      const d = new Date(ano, mes - 1 - i, 1);
      const doMes = Lancamentos.doMes(d.getFullYear(), d.getMonth() + 1);
      if (!doMes.length) continue;
      const variaveis = doMes.filter((l) => !this.pareceFixo(l, contas));
      base.push({ ano: d.getFullYear(), mes: d.getMonth() + 1, variavel: Lancamentos.resumo(variaveis).saldo });
    }
    return base;
  },

  // Um lançamento é de um fixo se está ligado a ele (contaId) ou, nos meses de
  // antes do fixo existir, se "bate" com ele: mesmo movimento e mesmo nome, ou
  // mesma categoria com valor parecido (até 15% de diferença). Sem isso, o salário
  // lançado à mão em setembro entraria duas vezes: como variável e como fixo.
  pareceFixo(lancamento, contas) {
    if (lancamento.contaId) return true;
    const nome = normalizar(lancamento.descricao);
    return contas.some((c) => Contas.movimento(c) === lancamento.movimento && (
      normalizar(c.descricao) === nome
      || (c.categoria === lancamento.categoria && Math.abs(c.valor - lancamento.valor) <= c.valor * 0.15)
    ));
  },
};
