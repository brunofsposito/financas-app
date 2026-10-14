// Nuvem (Supabase): login e sincronização "offline primeiro".
//
// Como funciona:
// 1. O app continua salvando NO CELULAR primeiro (rápido e funciona sem internet).
// 2. Cada alteração entra numa FILA, guardada no celular.
// 3. Com internet e logado, a fila é ENVIADA para o banco (upsert/delete).
// 4. Ao abrir o app ou entrar na conta, o app PUXA tudo da nuvem e junta com o
//    que ainda está na fila (o que não foi enviado tem prioridade).
// Quem avisa das alterações é o storage.js (D03: só ele fala com o armazenamento).
// Este arquivo não sabe nada de tela: avisa mudanças com o evento 'nuvem:mudou'.

const TABELAS_NUVEM = {
  // tabela local: { chave do registro, colunas da chave no banco, local -> linha, linha -> local }
  lancamentos: {
    chave: 'id',
    conflito: 'user_id,id',
    paraLinha: (l, uid) => ({
      user_id: uid, id: l.id, movimento: l.movimento, valor: l.valor, data: l.data,
      descricao: l.descricao, categoria: l.categoria, tipo: l.tipo,
      conta_id: l.contaId || null, competencia: l.competencia || null,
      criado_em: l.criadoEm || new Date().toISOString(), atualizado_em: l.atualizadoEm || null,
    }),
    paraLocal: (r) => limparVazios({
      id: r.id, movimento: r.movimento, valor: r.valor, data: r.data, descricao: r.descricao,
      categoria: r.categoria, tipo: r.tipo, contaId: r.conta_id, competencia: r.competencia,
      criadoEm: r.criado_em, atualizadoEm: r.atualizado_em,
    }),
  },
  contas: {
    chave: 'id',
    conflito: 'user_id,id',
    paraLinha: (c, uid) => ({
      user_id: uid, id: c.id, descricao: c.descricao, valor: c.valor, dia: c.dia,
      categoria: c.categoria, tipo: c.tipo, inicio: c.inicio,
      criado_em: c.criadoEm || new Date().toISOString(), atualizado_em: c.atualizadoEm || null,
    }),
    paraLocal: (r) => limparVazios({
      id: r.id, descricao: r.descricao, valor: r.valor, dia: r.dia, categoria: r.categoria,
      tipo: r.tipo, inicio: r.inicio, criadoEm: r.criado_em, atualizadoEm: r.atualizado_em,
    }),
  },
  orcamentos: {
    chave: 'categoria', // um orçamento por categoria
    conflito: 'user_id,categoria',
    paraLinha: (o, uid) => ({
      user_id: uid, categoria: o.categoria, limite: o.limite,
      criado_em: o.criadoEm || new Date().toISOString(), atualizado_em: o.atualizadoEm || null,
    }),
    paraLocal: (r) => limparVazios({
      categoria: r.categoria, limite: r.limite, criadoEm: r.criado_em, atualizadoEm: r.atualizado_em,
    }),
  },
};

const Nuvem = {
  CHAVE_FILA: 'financas-app:fila-nuvem:v1',
  CHAVE_DONO: 'financas-app:nuvem-dono', // de qual usuário são os dados deste celular
  cliente: null,
  usuario: null, // { id, email } quando logado
  estado: 'desligada', // desligada | desconectada | sincronizando | sincronizada | sem-internet | erro
  erro: '',
  ultimaSincronizacao: null,
  temporizador: null,

  configurada() {
    return Boolean(CONFIG_NUVEM.url && CONFIG_NUVEM.chave && window.supabase);
  },

  // ---------- Início ----------

  async iniciar() {
    if (!this.configurada()) return this.mudarEstado('desligada');
    this.cliente = window.supabase.createClient(CONFIG_NUVEM.url, CONFIG_NUVEM.chave, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sobra-auth' },
    });
    const { data } = await this.cliente.auth.getSession();
    await this.definirUsuario(data && data.session ? data.session.user : null);
    // Enviar a fila quando a internet voltar
    window.addEventListener('online', () => this.sincronizar());
    window.addEventListener('offline', () => this.mudarEstado('sem-internet'));
  },

  async definirUsuario(user) {
    this.usuario = user ? { id: user.id, email: user.email } : null;
    if (!this.usuario) return this.mudarEstado('desconectada');
    // Primeira vez deste usuário neste celular: tudo que já está aqui sobe para a nuvem
    if (localStorage.getItem(this.CHAVE_DONO) !== this.usuario.id) {
      for (const tabela of Object.keys(TABELAS_NUVEM)) {
        const { chave } = TABELAS_NUVEM[tabela];
        for (const registro of Storage.carregar(tabela)) this.enfileirar(tabela, registro[chave], 'gravar');
      }
      localStorage.setItem(this.CHAVE_DONO, this.usuario.id);
    }
    await this.sincronizar();
  },

  // ---------- Conta ----------

  async criarConta(email, senha) {
    const { data, error } = await this.cliente.auth.signUp({ email, password: senha });
    if (error) throw new Error(traduzirErroNuvem(error));
    // Com confirmação de e-mail ligada, a sessão só existe depois de confirmar
    if (!data.session) return { precisaConfirmar: true };
    await this.definirUsuario(data.user);
    return { precisaConfirmar: false };
  },

  async entrar(email, senha) {
    const { data, error } = await this.cliente.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzirErroNuvem(error));
    await this.definirUsuario(data.user);
  },

  // Sair apaga os dados DESTE celular (a nuvem continua com tudo).
  // Assim, outra pessoa que entrar neste aparelho não vê os seus dados.
  async sair() {
    await this.cliente.auth.signOut();
    for (const tabela of Object.keys(TABELAS_NUVEM)) Storage.salvar(tabela, [], { semNuvem: true });
    localStorage.removeItem(this.CHAVE_FILA);
    localStorage.removeItem(this.CHAVE_DONO);
    this.usuario = null;
    this.mudarEstado('desconectada');
  },

  // ---------- Fila de alterações ----------

  lerFila() {
    try {
      return JSON.parse(localStorage.getItem(this.CHAVE_FILA)) || [];
    } catch {
      return [];
    }
  },

  salvarFila(fila) {
    localStorage.setItem(this.CHAVE_FILA, JSON.stringify(fila));
  },

  pendentes() {
    return this.lerFila().length;
  },

  // Uma entrada por registro: a última operação vale ('gravar' ou 'apagar').
  // "ordem" identifica cada alteração: se o registro mudar de novo DURANTE o envio,
  // a entrada nova (ordem diferente) não é apagada da fila por engano.
  enfileirar(tabela, chave, operacao) {
    const fila = this.lerFila().filter((f) => !(f.tabela === tabela && f.chave === chave));
    fila.push({ tabela, chave, operacao, ordem: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
    this.salvarFila(fila);
  },

  // Chamado pelo storage.js a cada gravação: compara antes x depois
  anotarMudancas(tabela, antes, depois) {
    if (!this.usuario || !TABELAS_NUVEM[tabela]) return;
    const { chave } = TABELAS_NUVEM[tabela];
    const porChave = (lista) => new Map(lista.map((r) => [r[chave], r]));
    const mapaAntes = porChave(antes);
    const mapaDepois = porChave(depois);
    for (const [k, registro] of mapaDepois) {
      if (JSON.stringify(registro) !== JSON.stringify(mapaAntes.get(k))) this.enfileirar(tabela, k, 'gravar');
    }
    for (const k of mapaAntes.keys()) {
      if (!mapaDepois.has(k)) this.enfileirar(tabela, k, 'apagar');
    }
    // Espera 1 segundo de "calma" para mandar tudo de uma vez
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.sincronizar(), 1000);
  },

  // ---------- Sincronizar: enviar a fila e puxar a nuvem ----------

  async sincronizar() {
    if (!this.usuario || this.sincronizando) return;
    if (!navigator.onLine) return this.mudarEstado('sem-internet');
    this.sincronizando = true;
    this.mudarEstado('sincronizando');
    try {
      await this.enviar();
      await this.puxar();
      this.ultimaSincronizacao = new Date();
      this.mudarEstado('sincronizada');
    } catch (erro) {
      this.erro = erro.message || String(erro);
      this.mudarEstado(navigator.onLine ? 'erro' : 'sem-internet');
    } finally {
      this.sincronizando = false;
    }
  },

  async enviar() {
    const fila = this.lerFila();
    if (!fila.length) return;
    const uid = this.usuario.id;
    for (const tabela of Object.keys(TABELAS_NUVEM)) {
      const regra = TABELAS_NUVEM[tabela];
      const daTabela = fila.filter((f) => f.tabela === tabela);
      if (!daTabela.length) continue;

      // Gravar (upsert = insere ou atualiza pela chave)
      const locais = new Map(Storage.carregar(tabela).map((r) => [r[regra.chave], r]));
      const gravar = daTabela.filter((f) => f.operacao === 'gravar' && locais.has(f.chave));
      if (gravar.length) {
        const linhas = gravar.map((f) => regra.paraLinha(locais.get(f.chave), uid));
        const { error } = await this.cliente.from(tabela).upsert(linhas, { onConflict: regra.conflito });
        if (error) throw new Error(traduzirErroNuvem(error));
      }
      // Apagar
      const apagar = daTabela.filter((f) => f.operacao === 'apagar').map((f) => f.chave);
      if (apagar.length) {
        const { error } = await this.cliente.from(tabela).delete().eq('user_id', uid).in(regra.chave, apagar);
        if (error) throw new Error(traduzirErroNuvem(error));
      }
      // Tira da fila só as alterações que foram enviadas (pela "ordem", não pela chave)
      const enviados = new Set(daTabela.map((f) => f.ordem));
      this.salvarFila(this.lerFila().filter((f) => !enviados.has(f.ordem)));
    }
  },

  // Puxa tudo da nuvem (é pouco: dados de uma pessoa) e junta com o que ainda está na fila
  async puxar() {
    const fila = this.lerFila();
    for (const tabela of Object.keys(TABELAS_NUVEM)) {
      const regra = TABELAS_NUVEM[tabela];
      const { data, error } = await this.cliente.from(tabela).select('*');
      if (error) throw new Error(traduzirErroNuvem(error));
      const pendentes = new Map(fila.filter((f) => f.tabela === tabela).map((f) => [f.chave, f.operacao]));
      const locais = new Map(Storage.carregar(tabela).map((r) => [r[regra.chave], r]));
      const resultado = new Map();
      for (const linha of data) {
        const local = regra.paraLocal(linha);
        const k = local[regra.chave];
        if (pendentes.get(k) === 'apagar') continue; // apagado aqui, ainda não enviado
        resultado.set(k, local);
      }
      // O que ainda não foi enviado vale mais que a nuvem
      for (const [k, operacao] of pendentes) {
        if (operacao === 'gravar' && locais.has(k)) resultado.set(k, locais.get(k));
      }
      Storage.salvar(tabela, [...resultado.values()], { semNuvem: true });
    }
    document.dispatchEvent(new CustomEvent('dados:atualizados'));
  },

  mudarEstado(estado) {
    this.estado = estado;
    document.dispatchEvent(new CustomEvent('nuvem:mudou'));
  },
};

// Tira os campos vazios (null) que vêm do banco, para o registro ficar igual ao do app
function limparVazios(objeto) {
  return Object.fromEntries(Object.entries(objeto).filter(([, v]) => v !== null && v !== undefined));
}

// Mensagens do Supabase em português, para a tela
function traduzirErroNuvem(erro) {
  const texto = (erro && (erro.message || erro.error_description)) || String(erro);
  if (/invalid login credentials/i.test(texto)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(texto)) return 'Confirme seu e-mail (veja a caixa de entrada) e depois entre.';
  if (/user already registered/i.test(texto)) return 'Já existe uma conta com este e-mail. Use "Entrar".';
  if (/password should be at least/i.test(texto)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/unable to validate email|invalid email/i.test(texto)) return 'Esse e-mail não parece válido.';
  if (/rate limit|too many/i.test(texto)) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (/failed to fetch|network/i.test(texto)) return 'Sem conexão com a nuvem. Tente de novo com internet.';
  return texto;
}
