// Tela dos lembretes (D46): a seção em Ajustes e o convite no bloco "A pagar e a receber".
// As regras ficam em lembretes.js.

Object.assign(el, {
  lembretesTexto: document.getElementById('lembretes-texto'),
  lembretesAtivar: document.getElementById('lembretes-ativar'),
  lembretesAtivos: document.getElementById('lembretes-ativos'),
  lembretesTestar: document.getElementById('lembretes-testar'),
  lembretesDesativar: document.getElementById('lembretes-desativar'),
  lembretesMensagem: document.getElementById('lembretes-mensagem'),
  lembretesConvite: document.getElementById('lembretes-convite'),
});

const COMO_AVISA = 'Aviso no celular 1 dia antes e no dia do vencimento de cada conta fixa, às 9h. Conta já paga não avisa.';

function textoLembretes() {
  if (!Nuvem.usuario) return 'Entre na sua conta (acima) para receber os lembretes: quem avisa é a nuvem, mesmo com o app fechado.';
  if (!Lembretes.configurado()) return 'Os lembretes ainda não foram configurados na nuvem.';
  switch (Lembretes.estado) {
    case 'instalar': return 'No iPhone, os lembretes só funcionam com o Sobra instalado: abra pelo ícone da tela de início.';
    case 'sem-suporte': return 'Este navegador não recebe notificações.';
    case 'bloqueada': return 'As notificações do Sobra estão bloqueadas. Libere em Ajustes do iPhone → Notificações → Sobra.';
    case 'ativa': return `Ligados neste celular. ${COMO_AVISA}`;
    case 'carregando': return '';
    default: return COMO_AVISA;
  }
}

// Pode ligar agora? (logado, configurado, aparelho compatível e ainda desligado)
function podeAtivarLembretes() {
  return Boolean(Nuvem.usuario) && Lembretes.configurado() && Lembretes.estado === 'desligada';
}

function renderizarLembretes() {
  el.lembretesTexto.textContent = textoLembretes();
  el.lembretesAtivar.hidden = !podeAtivarLembretes();
  el.lembretesAtivos.hidden = !(Nuvem.usuario && Lembretes.estado === 'ativa');
  // Convite na Início: só se há conta fixa a pagar e os lembretes podem ser ligados
  const temContas = Contas.listar().some((c) => !Contas.ehEntrada(c));
  el.lembretesConvite.hidden = !(temContas && podeAtivarLembretes());
}

async function ativarLembretes(origem) {
  el.lembretesMensagem.textContent = '';
  try {
    await Lembretes.ativar();
    mostrarToast('Lembretes ligados: aviso 1 dia antes e no dia, às 9h');
  } catch (erro) {
    if (origem === 'convite') irParaAba('ajustes');
    el.lembretesMensagem.textContent = erro.message;
  }
  renderizarLembretes();
}

el.lembretesAtivar.addEventListener('click', () => ativarLembretes('ajustes'));
el.lembretesConvite.addEventListener('click', () => ativarLembretes('convite'));

el.lembretesTestar.addEventListener('click', async () => {
  el.lembretesMensagem.textContent = 'Enviando…';
  try {
    await Lembretes.testar();
    el.lembretesMensagem.textContent = 'Enviado. A notificação chega em alguns segundos.';
  } catch (erro) {
    el.lembretesMensagem.textContent = erro.message;
  }
});

el.lembretesDesativar.addEventListener('click', async () => {
  await Lembretes.desativar().catch(() => {});
  el.lembretesMensagem.textContent = 'Lembretes desligados neste celular.';
  renderizarLembretes();
});

// Ao entrar na conta com os lembretes já ativos, reenvia a inscrição deste celular
// (se a nuvem a apagou ou o iPhone a renovou, volta a valer). Uma vez por abertura.
let inscricaoReenviada = false;
document.addEventListener('nuvem:mudou', () => {
  if (!inscricaoReenviada && Nuvem.usuario && Lembretes.estado === 'ativa') {
    inscricaoReenviada = true;
    Lembretes.inscricao().then((i) => Lembretes.salvar(i)).catch(() => {});
  }
  renderizarLembretes();
});
document.addEventListener('lembretes:mudou', renderizarLembretes);
document.addEventListener('dados:atualizados', renderizarLembretes);

document.addEventListener('DOMContentLoaded', () => {
  renderizarLembretes();
  Lembretes.iniciar();
});
