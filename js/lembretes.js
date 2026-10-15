// Lembretes de vencimento por notificação (D46). Regras e conversa com o navegador
// e com a nuvem; a tela fica em tela-lembretes.js.
//
// Como funciona:
// 1. O app registra o service worker (sw.js), que recebe as notificações com o app fechado.
// 2. Ao ativar, o iPhone pede a sua permissão (uma vez) e cria uma "inscrição":
//    um endereço único deste celular + chaves para cifrar as mensagens.
// 3. A inscrição vai para a tabela lembretes_push no Supabase (só você vê a sua: RLS).
// 4. Todo dia às 9h, a função "lembretes" da nuvem avisa das contas que vencem hoje e amanhã.

const Lembretes = {
  registro: null, // o service worker registrado
  estado: 'carregando', // carregando | sem-suporte | instalar | bloqueada | desligada | ativa

  // iPhone e iPad (o iPad se identifica como Mac)
  ehIOS() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  // No iPhone, notificação de app da web só existe com o app instalado na tela de início
  instalado() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  },

  configurado() {
    return Boolean(CONFIG_NUVEM.vapidPublica);
  },

  async iniciar() {
    if (!('serviceWorker' in navigator)) return this.mudarEstado('sem-suporte');
    try {
      this.registro = await navigator.serviceWorker.register('sw.js');
    } catch (erro) {
      console.error('Lembretes: service worker não registrou', erro);
      return this.mudarEstado('sem-suporte');
    }
    await this.atualizarEstado();
    // Já ativo: reenvia a inscrição (se a nuvem a apagou ou o iPhone a renovou, volta a valer)
    if (this.estado === 'ativa' && Nuvem.usuario) this.salvar(await this.inscricao()).catch(() => {});
  },

  async atualizarEstado() {
    if (!('PushManager' in window) || !('Notification' in window)) {
      return this.mudarEstado(this.ehIOS() && !this.instalado() ? 'instalar' : 'sem-suporte');
    }
    if (Notification.permission === 'denied') return this.mudarEstado('bloqueada');
    const inscricao = await this.inscricao();
    return this.mudarEstado(inscricao && Notification.permission === 'granted' ? 'ativa' : 'desligada');
  },

  async inscricao() {
    return this.registro ? this.registro.pushManager.getSubscription() : null;
  },

  // Precisa vir de um toque: o iPhone só mostra o pedido de permissão assim
  async ativar() {
    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') {
      await this.atualizarEstado();
      throw new Error(permissao === 'denied'
        ? 'As notificações ficaram bloqueadas. Libere em Ajustes do iPhone → Notificações → Sobra.'
        : 'Sem a permissão, o Sobra não consegue avisar.');
    }
    const registro = this.registro || await navigator.serviceWorker.ready;
    const inscricao = await registro.pushManager.getSubscription()
      || await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chavePublicaVapid() });
    await this.salvar(inscricao);
    await this.atualizarEstado();
  },

  // INSERT ... ON CONFLICT (endpoint) DO UPDATE: um registro por celular
  async salvar(inscricao) {
    if (!inscricao) return;
    const { endpoint, keys } = inscricao.toJSON();
    const { error } = await Nuvem.cliente
      .from('lembretes_push')
      .upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' });
    if (error) throw new Error(traduzirErroNuvem(error));
  },

  async desativar() {
    const inscricao = await this.inscricao();
    if (inscricao) {
      if (Nuvem.cliente && Nuvem.usuario) {
        await Nuvem.cliente.from('lembretes_push').delete().eq('endpoint', inscricao.endpoint);
      }
      await inscricao.unsubscribe();
    }
    await this.atualizarEstado();
  },

  // Pede para a nuvem mandar uma notificação agora, só para você
  async testar() {
    const { data, error } = await Nuvem.cliente.functions.invoke('lembretes', { body: { teste: true } });
    if (error) throw new Error('A nuvem não respondeu. Confira se a função "lembretes" foi criada (docs/LEMBRETES.md).');
    if (!data || !data.enviados) throw new Error('Nenhum aparelho recebeu. Toque em Desativar e ative de novo.');
  },

  mudarEstado(estado) {
    this.estado = estado;
    document.dispatchEvent(new CustomEvent('lembretes:mudou'));
  },
};

// A chave pública VAPID (config.js) em bytes, como o navegador pede
function chavePublicaVapid() {
  const base = CONFIG_NUVEM.vapidPublica.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base + '='.repeat((4 - (base.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
