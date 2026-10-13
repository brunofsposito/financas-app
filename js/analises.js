// Análises (aba Análises): regras sobre os lançamentos ao longo do tempo.
// Nenhum dado novo é guardado: tudo é calculado a partir dos lançamentos,
// como consultas com GROUP BY mês. Este arquivo não sabe nada de tela.

const Analises = {
  QUANTOS_MESES: 6,

  // Os N meses que terminam no mês informado, do mais antigo ao mais novo
  janela(ano, mes, n = this.QUANTOS_MESES) {
    const meses = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(ano, mes - 1 - i, 1); // o Date resolve a virada de ano
      meses.push({ ano: d.getFullYear(), mes: d.getMonth() + 1 });
    }
    return meses;
  },

  // O mês ainda está em andamento? (só o mês de hoje)
  ehParcial({ ano, mes }, hoje) {
    return competencia(ano, mes) === hoje.slice(0, 7);
  },

  // SELECT mes, SUM(valor) FROM lancamentos WHERE movimento = 'saida' [AND categoria = ?] GROUP BY mes
  // e também entradas e saldo, para o gráfico de colunas.
  porMes(meses, hoje, categoria = '') {
    return meses.map((m) => {
      const doMes = Lancamentos.doMes(m.ano, m.mes);
      const saidas = doMes.filter((l) => l.movimento === 'saida' && (!categoria || l.categoria === categoria));
      const { entrou, saiu } = Lancamentos.resumo(doMes);
      return {
        ...m,
        saiu: somar(saidas),
        saldo: entrou - saiu,
        temDados: doMes.length > 0,
        parcial: this.ehParcial(m, hoje),
      };
    });
  },

  // Média só dos meses FECHADOS e COM DADOS (meses antes de começar a usar o app não contam como zero)
  media(linhas) {
    const validos = linhas.filter((l) => l.temDados && !l.parcial);
    return validos.length ? Math.round(validos.reduce((s, l) => s + l.saiu, 0) / validos.length) : null;
  },

  // As categorias de saída que mais pesaram na janela (para os chips do gráfico)
  principaisCategorias(meses, quantas = 4) {
    const somas = new Map();
    for (const m of meses) {
      for (const l of Lancamentos.doMes(m.ano, m.mes)) {
        if (l.movimento === 'saida') somas.set(l.categoria, (somas.get(l.categoria) || 0) + l.valor);
      }
    }
    return [...somas.entries()].sort((a, b) => b[1] - a[1]).slice(0, quantas).map(([categoria]) => categoria);
  },

  // Comparação com o mês anterior "até o mesmo dia". No mês corrente, compara até hoje;
  // num mês já fechado, compara os meses inteiros. Comparar outubro até dia 13 com
  // setembro inteiro seria injusto.
  comparacao(ano, mes, hoje) {
    const anterior = new Date(ano, mes - 2, 1);
    const ant = { ano: anterior.getFullYear(), mes: anterior.getMonth() + 1 };
    const doAnterior = Lancamentos.doMes(ant.ano, ant.mes);
    if (!doAnterior.length) return { disponivel: false, anterior: ant };

    const parcial = this.ehParcial({ ano, mes }, hoje);
    const dia = parcial ? Number(hoje.slice(8, 10)) : 31;
    const ateDia = (lista) => lista.filter((l) => l.movimento === 'saida' && Number(l.data.slice(8, 10)) <= dia);
    const atual = ateDia(Lancamentos.doMes(ano, mes));
    const passado = ateDia(doAnterior);

    // Diferença por categoria: as 3 que mais mudaram (em reais)
    const porCategoria = new Map();
    const acumular = (lista, campo) => {
      for (const l of lista) {
        const valores = porCategoria.get(l.categoria) || { agora: 0, antes: 0 };
        valores[campo] += l.valor;
        porCategoria.set(l.categoria, valores);
      }
    };
    acumular(atual, 'agora');
    acumular(passado, 'antes');
    const categorias = [...porCategoria.entries()]
      .map(([categoria, v]) => ({ categoria, ...v, diferenca: v.agora - v.antes }))
      .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca))
      .slice(0, 3);

    return {
      disponivel: true,
      anterior: ant,
      parcial,
      dia,
      agora: somar(atual),
      antes: somar(passado),
      categorias,
    };
  },
};

// Variação percentual arredondada, ou null quando não há base de comparação
function variacao(agora, antes) {
  return antes ? Math.round(((agora - antes) / antes) * 100) : null;
}
