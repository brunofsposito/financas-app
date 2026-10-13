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

  // Centavos -> pedaços para o "número herói". Ex.: 325010 -> { sinal: '', inteiro: '3.250', centavos: ',10' }
  partes(centavos) {
    const [inteiro, decimais] = (Math.abs(centavos) / 100)
      .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .split(',');
    return { sinal: centavos < 0 ? '−' : '', inteiro, centavos: `,${decimais}` };
  },

  // Centavos -> texto para o campo do formulário. Ex.: 150050 -> "1.500,50"
  paraCampo(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  },
};

const Lancamentos = {
  // SELECT * FROM lancamentos
  listar() {
    return Storage.carregar('lancamentos');
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
    // Pagamento de conta recorrente: guarda de qual conta e de qual mês ele é.
    // É a "chave estrangeira" que liga o lançamento à conta (ver contas.js).
    if (dados.contaId) {
      lancamento.contaId = dados.contaId;
      lancamento.competencia = dados.competencia; // 'AAAA-MM'
    }
    const todos = this.listar();
    todos.push(lancamento);
    Storage.salvar('lancamentos', todos);
    return lancamento;
  },

  // SELECT * FROM lancamentos WHERE id = ?
  buscar(id) {
    return this.listar().find((l) => l.id === id) || null;
  },

  // UPDATE lancamentos SET ... WHERE id = ?
  atualizar(id, dados) {
    const todos = this.listar();
    const indice = todos.findIndex((l) => l.id === id);
    if (indice === -1) return null;
    todos[indice] = {
      ...todos[indice], // mantém o que não muda (id, criadoEm)
      movimento: dados.movimento,
      valor: dados.valor,
      data: dados.data,
      descricao: dados.descricao.trim(),
      categoria: dados.categoria,
      tipo: dados.tipo,
      atualizadoEm: new Date().toISOString(),
    };
    Storage.salvar('lancamentos', todos);
    return todos[indice];
  },

  // DELETE FROM lancamentos WHERE id = ?
  excluir(id) {
    const restantes = this.listar().filter((l) => l.id !== id);
    Storage.salvar('lancamentos', restantes);
  },

  // ... WHERE tipo = ? AND categoria = ?
  // Filtro vazio ('') significa "todos": aquela condição não entra no WHERE.
  filtrar(lista, { tipo = '', categoria = '' } = {}) {
    return lista.filter((l) => (!tipo || l.tipo === tipo) && (!categoria || l.categoria === categoria));
  },

  // Dashboard (Entrega 6): para onde foi o dinheiro.
  // SELECT categoria, SUM(valor) FROM lista WHERE movimento = 'saida'
  // GROUP BY categoria ORDER BY SUM(valor) DESC
  saidasPorCategoria(lista) {
    const somas = new Map();
    for (const l of lista) {
      if (l.movimento !== 'saida') continue;
      somas.set(l.categoria, (somas.get(l.categoria) || 0) + l.valor);
    }
    const total = [...somas.values()].reduce((a, b) => a + b, 0);
    return {
      total,
      categorias: [...somas.entries()]
        .map(([categoria, valor]) => ({ categoria, valor, fracao: valor / total }))
        .sort((a, b) => b.valor - a.valor),
    };
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
