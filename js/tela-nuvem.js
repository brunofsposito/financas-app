// Tela da conta e da sincronização (aba Ajustes). As regras ficam em nuvem.js.

Object.assign(el, {
  nuvemDesligada: document.getElementById('nuvem-desligada'),
  formNuvem: document.getElementById('form-nuvem'),
  nuvemErro: document.getElementById('nuvem-erro'),
  nuvemCriar: document.getElementById('nuvem-criar'),
  nuvemConectada: document.getElementById('nuvem-conectada'),
  nuvemEmail: document.getElementById('nuvem-email'),
  nuvemStatus: document.getElementById('nuvem-status'),
  nuvemSincronizar: document.getElementById('nuvem-sincronizar'),
  nuvemSair: document.getElementById('nuvem-sair'),
});

function textoStatusNuvem() {
  const pendentes = Nuvem.pendentes();
  const esperando = pendentes ? ` · ${pendentes} ${plural(pendentes, 'alteração esperando', 'alterações esperando')}` : '';
  switch (Nuvem.estado) {
    case 'sincronizando': return { nivel: 'aviso', texto: 'Sincronizando…' };
    case 'sem-internet': return { nivel: 'aviso', texto: `Sem internet${esperando}. Envia sozinho quando voltar.` };
    case 'erro': return { nivel: 'perigo', texto: `Não sincronizou: ${Nuvem.erro}${esperando}` };
    case 'sincronizada': {
      const hora = Nuvem.ultimaSincronizacao
        ? Nuvem.ultimaSincronizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      return { nivel: 'ok', texto: `Tudo salvo na nuvem${hora ? ` · ${hora}` : ''}` };
    }
    default: return { nivel: 'aviso', texto: '' };
  }
}

function renderizarNuvem() {
  const configurada = Nuvem.configurada();
  const logado = Boolean(Nuvem.usuario);
  el.nuvemDesligada.hidden = configurada;
  el.formNuvem.hidden = !configurada || logado;
  el.nuvemConectada.hidden = !logado;
  // Com a nuvem, o backup em arquivo vira opcional
  document.getElementById('dados-explicacao').textContent = logado
    ? 'Seus dados já ficam salvos na nuvem. O backup em arquivo é opcional (uma cópia extra).'
    : 'Os lançamentos ficam só neste navegador. Faça backup de vez em quando.';
  if (!logado) return;

  el.nuvemEmail.textContent = Nuvem.usuario.email;
  const { nivel, texto } = textoStatusNuvem();
  el.nuvemStatus.className = `nuvem-status nuvem-${nivel}`;
  el.nuvemStatus.textContent = texto;
  el.nuvemSincronizar.disabled = Nuvem.estado === 'sincronizando';
}

// Entrar ou criar conta: os dois usam o mesmo formulário
async function enviarFormNuvem(criar) {
  const f = el.formNuvem.elements;
  const email = f.email.value.trim();
  const senha = f.senha.value;
  if (!email || !senha) {
    el.nuvemErro.textContent = 'Preencha e-mail e senha.';
    return;
  }
  el.nuvemErro.textContent = criar ? 'Criando sua conta…' : 'Entrando…';
  try {
    if (criar) {
      const { precisaConfirmar } = await Nuvem.criarConta(email, senha);
      el.nuvemErro.textContent = precisaConfirmar
        ? 'Conta criada! Confirme pelo link que chegou no seu e-mail e depois toque em Entrar.' : '';
    } else {
      await Nuvem.entrar(email, senha);
      el.nuvemErro.textContent = '';
    }
    f.senha.value = '';
  } catch (erro) {
    el.nuvemErro.textContent = erro.message;
  }
  renderizarNuvem();
}

el.formNuvem.addEventListener('submit', (evento) => {
  evento.preventDefault();
  enviarFormNuvem(false);
});
el.nuvemCriar.addEventListener('click', () => enviarFormNuvem(true));
el.nuvemSincronizar.addEventListener('click', () => Nuvem.sincronizar());

el.nuvemSair.addEventListener('click', async () => {
  const pendentes = Nuvem.pendentes();
  const aviso = pendentes
    ? `Ainda há ${pendentes} ${plural(pendentes, 'alteração', 'alterações')} sem enviar e ${plural(pendentes, 'ela será perdida', 'elas serão perdidas')}. Sair mesmo assim?`
    : 'Sair da conta? Os dados saem deste celular, mas continuam salvos na nuvem.';
  if (!confirm(aviso)) return;
  // Os lembretes deste celular eram da conta que está saindo: desliga antes
  await Lembretes.desativar().catch(() => {});
  await Nuvem.sair();
  renderizar();
});

// A nuvem avisa: mudou o estado (redesenha a conta) ou chegaram dados novos (redesenha tudo)
document.addEventListener('nuvem:mudou', renderizarNuvem);
document.addEventListener('dados:atualizados', () => renderizar());

document.addEventListener('DOMContentLoaded', () => {
  renderizarNuvem();
  Nuvem.iniciar().catch((erro) => console.error('Nuvem:', erro));
});
