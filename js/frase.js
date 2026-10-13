// Frase rápida (V4): transforma "gastei 45 no mercado ontem" num lançamento.
// Só regras, sem servidor e sem IA: valor = primeiro número; entrada ou saída
// por palavras como "recebi"; categoria por um dicionário de palavras; data por
// "hoje", "ontem", "dia 10" ou "10/10". Com "todo dia 7", vira conta fixa.
// Este arquivo não sabe nada de tela: recebe um texto e devolve dados.

// Palavras que indicam dinheiro ENTRANDO
const PALAVRAS_ENTRADA = /\b(recebi|receb\w*|ganhei|ganho|entrou|caiu|salario|freela\w*|reembolso|estorno|rendimento\w*|dividendo\w*|vendi|venda)\b/;

// Palavras que indicam trabalho (tipo "profissional")
const PALAVRAS_PROFISSIONAL = /\b(trabalho|profissional|empresa|cliente|cnpj|mei|idenx)\b/;

// Dicionário de categorias: [expressão, categoria]. A primeira que casar vence.
// As palavras estão sem acento porque a frase é normalizada antes (ver normalizar).
const DICIONARIO_CATEGORIAS = {
  entrada: [
    [/\b(salario|holerite|pagamento da empresa)\b/, 'salario'],
    [/\b(freela\w*|extra|bico|projeto|servico)\b/, 'renda-extra'],
    [/\b(reembolso|estorno|devolu\w*)\b/, 'reembolso'],
    [/\b(rendimento\w*|juros|dividendo\w*|cdb|poupanca|tesouro)\b/, 'rendimentos'],
  ],
  saida: [
    [/\b(netflix|spotify|streaming|assinatura\w*|prime|disney|youtube|icloud|chatgpt|deezer|hbo|globoplay)\b/, 'assinaturas'],
    [/\b(mercado|supermercado|feira|padaria|acougue|hortifruti|sacolao|atacad\w*)\b/, 'mercado'],
    [/\b(ifood|rappi|restaurante|lanche\w*|almoco|jantar|pizza\w*|hamburguer\w*|cafe|cafeteria|bar|delivery|marmita|sushi)\b/, 'restaurantes'],
    [/\b(uber|99pop|taxi|gasolina|combustivel|etanol|posto|onibus|metro|estacionamento|pedagio|oficina|mecanico)\b/, 'transporte'],
    [/\b(aluguel|condominio|luz|energia|agua|gas|internet|iptu|faxina|diarista)\b/, 'moradia'],
    [/\b(farmacia|remedio\w*|medic\w*|consulta|dentista|exame\w*|plano de saude|hospital|terapia|psicolog\w*)\b/, 'saude'],
    [/\b(curso\w*|escola|faculdade|livro\w*|mensalidade|aula\w*|material escolar)\b/, 'educacao'],
    [/\b(cinema|show|viagem|passeio|ingresso\w*|jogo\w*|academia|parque|balada)\b/, 'lazer'],
    [/\b(roupa\w*|shopping|presente\w*|loja|tenis|sapato\w*|eletronico\w*|celular)\b/, 'compras'],
    [/\b(cartao|fatura|parcela|emprestimo|financiamento|divida)\b/, 'cartao-dividas'],
    [/\b(imposto\w*|taxa\w*|ipva|multa|darf|tarifa)\b/, 'impostos-taxas'],
  ],
};

// Palavras que não entram na descrição ("gastei 45 no mercado" -> "Mercado")
const PALAVRAS_VAZIAS = new Set([
  'gastei', 'gasto', 'paguei', 'pago', 'comprei', 'compra', 'recebi', 'ganhei', 'foi', 'deu', 'caiu', 'entrou',
  'no', 'na', 'nos', 'nas', 'de', 'do', 'da', 'dos', 'das', 'em', 'com', 'pra', 'para', 'pro', 'o', 'a', 'os', 'as',
  'um', 'uma', 'e', 'reais', 'real', 'r$', 'rs', 'hoje', 'ontem', 'anteontem', 'mil', 'todo', 'todos', 'dia', 'mes',
]);

// Minúsculas e sem acento: "Condomínio" -> "condominio"
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Devolve { ok: true, tipo: 'lancamento' | 'conta', dados } ou { ok: false, erro }
function interpretarFrase(texto, hoje = hojeISO()) {
  const original = texto.trim();
  let frase = normalizar(original);
  if (!frase) return { ok: false, erro: 'Escreva algo como: mercado 45' };

  // 1. Recorrência: "todo dia 7" -> conta fixa
  let diaConta = null;
  frase = frase.replace(/\btodos?\s+(?:o\s+)?dia\s+(\d{1,2})\b/, (_, dia) => {
    diaConta = Number(dia);
    return ' ';
  });

  // 2. Data: "ontem", "anteontem", "dia 10", "10/10"
  let data = hoje;
  const [anoHoje, mesHoje, diaHoje] = hoje.split('-').map(Number);
  if (/\banteontem\b/.test(frase)) data = somarDias(hoje, -2);
  else if (/\bontem\b/.test(frase)) data = somarDias(hoje, -1);
  frase = frase.replace(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/, (_, d, m, a) => {
    const ano = a ? Number(a.length === 2 ? `20${a}` : a) : anoHoje;
    data = dataISO(ano, Number(m), Number(d));
    return ' ';
  });
  frase = frase.replace(/\bdia\s+(\d{1,2})\b/, (_, d) => {
    // "dia 20" num dia 13: provavelmente foi no mês passado
    const dia = Number(d);
    const mesAtras = dia > diaHoje;
    const ref = new Date(anoHoje, mesHoje - 1 - (mesAtras ? 1 : 0), 1);
    data = dataISO(ref.getFullYear(), ref.getMonth() + 1, dia);
    return ' ';
  });

  // 3. Valor: o primeiro número que sobrou ("45", "45,90", "1.200", "2 mil")
  const achado = frase.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(\s*mil\b)?/);
  if (!achado) return { ok: false, erro: 'Não encontrei o valor. Tente assim: mercado 45' };
  let valor = Dinheiro.paraCentavos(achado[1]);
  if (valor !== null && achado[2]) valor *= 1000;
  if (!valor) return { ok: false, erro: 'O valor precisa ser maior que zero.' };

  // 4. Entrada ou saída, categoria e tipo
  const movimento = PALAVRAS_ENTRADA.test(frase) ? 'entrada' : 'saida';
  const encontrada = DICIONARIO_CATEGORIAS[movimento].find(([regra]) => regra.test(frase));
  const categoria = encontrada ? encontrada[1] : (movimento === 'entrada' ? 'outras-entradas' : 'outras-saidas');
  const tipo = PALAVRAS_PROFISSIONAL.test(frase) || categoria === 'salario' ? 'profissional' : 'pessoal';

  // 5. Descrição: as palavras que sobram, tirando números, datas e palavras vazias
  const descricao = criarDescricao(original) || buscarCategoria(categoria).nome;

  const dados = { movimento, valor, descricao, categoria, tipo, data };
  if (diaConta && movimento === 'saida') {
    return { ok: true, tipo: 'conta', dados: { ...dados, dia: Math.min(Math.max(diaConta, 1), 31) } };
  }
  return { ok: true, tipo: 'lancamento', dados };
}

function criarDescricao(original) {
  const palavras = original
    .replace(/\btodos?\s+(?:o\s+)?dia\s+\d{1,2}\b/gi, ' ')
    .replace(/\bdia\s+\d{1,2}\b/gi, ' ')
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, ' ')
    .split(/\s+/)
    .filter((p) => p && !/\d/.test(p) && !PALAVRAS_VAZIAS.has(normalizar(p)));
  const texto = palavras.join(' ').slice(0, 60);
  return texto ? texto[0].toUpperCase() + texto.slice(1) : '';
}

function somarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number);
  const data = new Date(a, m - 1, d + dias);
  return dataISO(data.getFullYear(), data.getMonth() + 1, data.getDate());
}
