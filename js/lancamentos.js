// Regras de negócio dos lançamentos.
// Aqui ficam as "queries" do app: filtrar por mês, somar entradas e saídas.
// Este arquivo não sabe nada de tela: só recebe e devolve dados.

// Dinheiro é sempre guardado em CENTAVOS (número inteiro).
// Ex.: R$ 1.500,00 vira 150000. Isso evita erros de arredondamento
// (em JavaScript, 0.1 + 0.2 = 0.30000000000000004).

const Dinheiro = {
  // Texto digitado pelo usuário -> centavos. Ex.: "1.500,50" -> 150050
  paraCentavos(texto) {
    let limpo = String(texto).trim().replace(/[R$\s]/g, '');
    if (limpo.includes(',')) {
      // Formato brasileiro: ponto separa milhar, vírgula separa centavos
      limpo = limpo.replace(/\./g, '').replace(',', '.');
    } else if (!/^\d+\.\d{1,2}$/.test(limpo)) {
      // Sem vírgula: só aceitamos o ponto como decimal se tiver 1 ou 2 casas (ex.: "45.90")
      limpo = limpo.replace(/\./g, '');
    }
    const numero = Number(limpo);
    if (!Number.isFinite(numero) || numero <= 0) return null;
    return Math.round(numero * 100);
  },

  // Centavos -> texto em reais. Ex.: 150050 -> "R$ 1.500,50"
  formatar(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },
};

const Lancamentos = {
  // SELECT * FROM lancamentos
  listar() {
    return Storage.carregar();
  },

  // SELECT * FROM lancamentos WHERE data LIKE '2026-10%' ORDER BY data DESC
  doMes(ano, mes) {
    const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;
    return this.listar()
      .filter((l) => l.data.startsWith(prefixo))
      .sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));
  },

  // INSERT INTO lancamentos VALUES (...)
  criar(dados) {
    const lancamento = {
      id: gerarId(),
      movimento: dados.movimento, // 'entrada' ou 'saida'
      valor: dados.valor, // em centavos
      data: dados.data, // 'AAAA-MM-DD'
      descricao: dados.descricao.trim(),
      categoria: dados.categoria,
      tipo: dados.tipo, // 'pessoal' ou 'profissional'
      criadoEm: new Date().toISOString(),
    };
    const todos = this.listar();
    todos.push(lancamento);
    Storage.salvar(todos);
    return lancamento;
  },

  // SELECT SUM(valor) ... GROUP BY movimento
  resumo(lista) {
    let entrou = 0;
    let saiu = 0;
    for (const l of lista) {
      if (l.movimento === 'entrada') entrou += l.valor;
      else saiu += l.valor;
    }
    return { entrou, saiu, saldo: entrou - saiu };
  },
};

function gerarId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
