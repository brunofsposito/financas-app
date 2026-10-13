// Backup: exportar todos os lançamentos para um arquivo e importar de volta.
// Como os dados vivem só no navegador (D02), o backup é a forma de não perdê-los
// ao limpar o histórico ou trocar de celular.

const Backup = {
  VERSAO: 1, // versão do formato do arquivo, para mudanças futuras
  CHAVE_ULTIMO: 'financas-app:ultimo-backup',

  // Monta o conteúdo do arquivo de backup
  gerar() {
    return {
      app: 'financas-app',
      versao: this.VERSAO,
      exportadoEm: new Date().toISOString(),
      lancamentos: Lancamentos.listar(),
    };
  },

  nomeDoArquivo() {
    const d = new Date();
    const data = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `financas-backup-${data}.json`;
  },

  // Confere se o arquivo é mesmo um backup deste app antes de usar.
  // Devolve a lista de lançamentos ou lança um erro com a mensagem para o usuário.
  validar(texto) {
    let conteudo;
    try {
      conteudo = JSON.parse(texto);
    } catch {
      throw new Error('O arquivo não é um backup válido.');
    }
    if (!conteudo || conteudo.app !== 'financas-app' || !Array.isArray(conteudo.lancamentos)) {
      throw new Error('Este arquivo não é um backup do app de finanças.');
    }
    if (conteudo.versao > this.VERSAO) {
      throw new Error('Este backup foi feito por uma versão mais nova do app.');
    }
    const validos = conteudo.lancamentos.filter(lancamentoValido);
    if (validos.length !== conteudo.lancamentos.length) {
      throw new Error('O backup tem lançamentos com dados inválidos. Nada foi importado.');
    }
    return validos;
  },

  // Junta o backup com o que já existe: mesmo id = mesmo lançamento.
  // É como um MERGE no SQL: atualiza quem já existe e insere quem não existe.
  importar(lancamentosDoBackup) {
    const porId = new Map(Lancamentos.listar().map((l) => [l.id, l]));
    let novos = 0;
    for (const l of lancamentosDoBackup) {
      if (!porId.has(l.id)) novos++;
      porId.set(l.id, l);
    }
    Storage.salvar([...porId.values()]);
    return { novos, atualizados: lancamentosDoBackup.length - novos };
  },

  registrarExportacao() {
    try {
      localStorage.setItem(this.CHAVE_ULTIMO, new Date().toISOString());
    } catch {
      // Sem localStorage, só não mostramos a data do último backup
    }
  },

  ultimaExportacao() {
    try {
      const iso = localStorage.getItem(this.CHAVE_ULTIMO);
      return iso ? new Date(iso) : null;
    } catch {
      return null;
    }
  },
};

function lancamentoValido(l) {
  return l
    && typeof l.id === 'string' && l.id
    && (l.movimento === 'entrada' || l.movimento === 'saida')
    && Number.isInteger(l.valor) && l.valor > 0
    && /^\d{4}-\d{2}-\d{2}$/.test(l.data)
    && typeof l.descricao === 'string'
    && typeof l.categoria === 'string'
    && (l.tipo === 'pessoal' || l.tipo === 'profissional');
}
