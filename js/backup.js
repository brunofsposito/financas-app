// Backup: exportar todos os dados (lançamentos e contas) para um arquivo e importar de volta.
// Como os dados vivem só no navegador (D02), o backup é a forma de não perdê-los
// ao limpar o histórico ou trocar de celular.

const Backup = {
  // Versão do formato do arquivo. v1: só lançamentos. v2: lançamentos + contas.
  VERSAO: 2,
  CHAVE_ULTIMO: 'financas-app:ultimo-backup',

  // Monta o conteúdo do arquivo de backup
  gerar() {
    return {
      app: 'financas-app',
      versao: this.VERSAO,
      exportadoEm: new Date().toISOString(),
      lancamentos: Lancamentos.listar(),
      contas: Storage.carregar('contas'),
    };
  },

  nomeDoArquivo() {
    const d = new Date();
    const data = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `financas-backup-${data}.json`;
  },

  // Confere se o arquivo é mesmo um backup deste app antes de usar.
  // Devolve { lancamentos, contas } ou lança um erro com a mensagem para o usuário.
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
    const contas = conteudo.contas || []; // backups v1 não têm contas
    if (!Array.isArray(contas)
      || !conteudo.lancamentos.every(lancamentoValido)
      || !contas.every(contaValida)) {
      throw new Error('O backup tem dados inválidos. Nada foi importado.');
    }
    return { lancamentos: conteudo.lancamentos, contas };
  },

  // Junta o backup com o que já existe: mesmo id = mesmo registro.
  // É como um MERGE no SQL: atualiza quem já existe e insere quem não existe.
  importar({ lancamentos, contas }) {
    return {
      lancamentos: mesclar('lancamentos', lancamentos),
      contas: mesclar('contas', contas),
    };
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

function mesclar(tabela, doBackup) {
  const porId = new Map(Storage.carregar(tabela).map((r) => [r.id, r]));
  let novos = 0;
  for (const r of doBackup) {
    if (!porId.has(r.id)) novos++;
    porId.set(r.id, r);
  }
  Storage.salvar(tabela, [...porId.values()]);
  return { novos, atualizados: doBackup.length - novos };
}

function contaValida(c) {
  return c
    && typeof c.id === 'string' && c.id
    && typeof c.descricao === 'string'
    && Number.isInteger(c.valor) && c.valor > 0
    && Number.isInteger(c.dia) && c.dia >= 1 && c.dia <= 31
    && typeof c.categoria === 'string'
    && (c.tipo === 'pessoal' || c.tipo === 'profissional')
    && /^\d{4}-\d{2}$/.test(c.inicio);
}

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
