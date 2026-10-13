// Tela da frase rápida (V4): a barra no topo do Início.
// Escreve (ou dita) "gastei 45 no mercado ontem", o app entende (frase.js)
// e abre o formulário já preenchido para conferir. "Todo dia 7" abre uma conta fixa.

Object.assign(el, {
  fraseForm: document.getElementById('frase-rapida'),
  fraseTexto: document.getElementById('frase-texto'),
  fraseVoz: document.getElementById('frase-voz'),
  fraseEnviar: document.getElementById('frase-enviar'),
  fraseErro: document.getElementById('frase-erro'),
});

// Campo vazio: mostra o microfone (se houver voz, V5). Com texto: mostra a seta de enviar.
function atualizarBotoesFrase() {
  const vazio = !el.fraseTexto.value.trim();
  const comVoz = vozDisponivel();
  // Enquanto ouve, o microfone fica visível: ele é o botão de parar
  el.fraseVoz.hidden = !(comVoz && (vazio || ouvindo));
  el.fraseEnviar.hidden = !el.fraseVoz.hidden; // um botão ou outro, nunca os dois
}

function enviarFrase() {
  const frase = el.fraseTexto.value.trim();
  const resultado = interpretarFrase(frase);
  if (!resultado.ok) {
    el.fraseErro.textContent = resultado.erro;
    return;
  }
  el.fraseErro.textContent = '';
  el.fraseTexto.value = '';
  el.fraseTexto.blur();
  atualizarBotoesFrase();

  if (resultado.tipo === 'conta') {
    abrirFormularioConta(null, resultado.dados); // tela-contas.js
  } else {
    abrirFormulario(null, null, { dados: resultado.dados, frase }); // app.js
  }
}

el.fraseForm.addEventListener('submit', (evento) => {
  evento.preventDefault();
  enviarFrase();
});

el.fraseTexto.addEventListener('input', () => {
  el.fraseErro.textContent = '';
  atualizarBotoesFrase();
});

// ---------- Voz (V5) ----------
// Usa o reconhecimento de voz do próprio navegador (Web Speech API).
// No iPhone, o Safari oferece isso como "webkitSpeechRecognition".
// Se não existir, o botão do microfone simplesmente não aparece
// (o microfone do teclado do iPhone continua funcionando no campo de texto).

const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
let reconhecedor = null;
let ouvindo = false;
let vozFalhou = false; // falhou por falta de suporte: esconde o botão até recarregar
let erroDaVoz = null; // código do erro da última tentativa (ex.: 'not-allowed')
let chegouPalavra = false; // o reconhecimento entregou algum texto nesta tentativa?
let vozJaFuncionou = false; // se funcionou uma vez, o aparelho suporta: nunca esconder o botão
let vigia = null; // temporizador que desiste se nenhuma palavra chegar

// Navegadores dentro de outros apps (Claude, WhatsApp, Instagram) no iPhone ligam o
// microfone mas não entregam o texto. Sem nenhuma palavra em 6 s, desistimos e explicamos.
const ESPERA_PRIMEIRA_PALAVRA = 6000;

function vozDisponivel() {
  return Boolean(Reconhecimento) && !vozFalhou;
}

// Erros que significam "este aparelho/navegador não consegue": não adianta tentar de novo
const ERROS_SEM_SUPORTE = ['service-not-allowed', 'audio-capture', 'language-not-supported'];

// Mostra a mensagem com o código técnico entre parênteses (ajuda a diagnosticar por print)
function mostrarErroVoz(codigo) {
  const mensagem = ERROS_VOZ[codigo] || 'Não consegui ouvir. Tente de novo ou use o microfone do teclado.';
  el.fraseErro.textContent = `${mensagem} (${codigo})`;
  // Só desiste de vez se a voz NUNCA funcionou nesta sessão
  if (ERROS_SEM_SUPORTE.includes(codigo) && !vozJaFuncionou) {
    vozFalhou = true;
    atualizarBotoesFrase();
    el.fraseTexto.focus(); // abre o teclado, que tem o próprio microfone
  }
}

const ERROS_VOZ = {
  'not-allowed': 'O microfone não foi liberado. Libere nas configurações do Safari ou use o microfone do teclado.',
  'service-not-allowed': 'O reconhecimento de voz não está disponível aqui. Use o microfone do teclado.',
  'no-speech': 'Não ouvi nada. Toque no microfone e fale de novo.',
  'sem-resultado': 'O reconhecimento terminou sem ouvir nada. Tente de novo ou use o microfone do teclado.',
  'sem-transcricao': 'Nenhuma palavra chegou. Se o app está aberto dentro de outro app (como o Claude ou o WhatsApp), abra no Safari ou pelo ícone na Tela de Início. Ou use o microfone do teclado.',
  'falha-ao-iniciar': 'Não foi possível ligar o reconhecimento de voz. Use o microfone do teclado.',
  'language-not-supported': 'O reconhecimento de voz não aceita português neste aparelho. Use o microfone do teclado.',
  'audio-capture': 'Não encontrei um microfone.',
  'network': 'O reconhecimento de voz precisa de internet.',
};

// Encerra a sessão anterior por completo: no iPhone, uma sessão que não foi
// encerrada pode "prender" o microfone e a próxima não recebe nada.
function encerrarSessaoDeVoz() {
  if (!reconhecedor) return;
  reconhecedor.onresult = reconhecedor.onerror = reconhecedor.onend = null;
  try { reconhecedor.abort(); } catch { /* já encerrada */ }
  reconhecedor = null;
}

function iniciarVoz() {
  encerrarSessaoDeVoz();
  reconhecedor = new Reconhecimento();
  reconhecedor.lang = 'pt-BR';
  reconhecedor.interimResults = true; // mostra o texto enquanto a pessoa fala
  reconhecedor.continuous = false; // para sozinho quando a pessoa termina a frase
  reconhecedor.maxAlternatives = 1;

  reconhecedor.onresult = (evento) => {
    chegouPalavra = true;
    vozJaFuncionou = true;
    el.fraseTexto.value = Array.from(evento.results).map((r) => r[0].transcript).join(' ').trim();
  };
  reconhecedor.onerror = (evento) => {
    erroDaVoz = evento.error;
    if (evento.error !== 'aborted') mostrarErroVoz(evento.error);
  };
  reconhecedor.onend = () => {
    clearTimeout(vigia);
    encerrarSessaoDeVoz(); // libera o microfone para a próxima vez
    pararVisualVoz();
    // Terminou de falar e há texto: segue direto para a confirmação
    if (el.fraseTexto.value.trim()) enviarFrase();
    // Terminou sem texto e sem erro: nunca fica em silêncio, sempre explica
    else if (!erroDaVoz) mostrarErroVoz('sem-resultado');
  };

  el.fraseTexto.value = '';
  el.fraseErro.textContent = '';
  erroDaVoz = null;
  chegouPalavra = false;
  ouvindo = true;
  el.fraseForm.classList.add('ouvindo');
  el.fraseTexto.placeholder = 'Ouvindo… fale o gasto';
  el.fraseVoz.setAttribute('aria-label', 'Parar de ouvir');
  atualizarBotoesFrase();
  try {
    reconhecedor.start();
    vigia = setTimeout(() => {
      if (chegouPalavra || !ouvindo) return;
      erroDaVoz = 'sem-transcricao';
      encerrarSessaoDeVoz();
      pararVisualVoz();
      mostrarErroVoz('sem-transcricao');
    }, ESPERA_PRIMEIRA_PALAVRA);
  } catch {
    clearTimeout(vigia);
    encerrarSessaoDeVoz();
    pararVisualVoz();
    mostrarErroVoz('falha-ao-iniciar');
    if (!vozJaFuncionou) {
      vozFalhou = true;
      atualizarBotoesFrase();
    }
  }
}

function pararVisualVoz() {
  ouvindo = false;
  el.fraseForm.classList.remove('ouvindo');
  el.fraseTexto.placeholder = 'Gastei 45 no mercado…';
  el.fraseVoz.setAttribute('aria-label', 'Falar o lançamento');
  atualizarBotoesFrase();
}

el.fraseVoz.addEventListener('click', () => {
  if (ouvindo && reconhecedor) reconhecedor.stop(); // tocar de novo encerra (e segue para a confirmação)
  else iniciarVoz();
});

atualizarBotoesFrase();
