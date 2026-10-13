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

function vozDisponivel() {
  return Boolean(Reconhecimento);
}

const ERROS_VOZ = {
  'not-allowed': 'O microfone não foi liberado. Libere nas configurações do Safari ou use o microfone do teclado.',
  'service-not-allowed': 'O reconhecimento de voz não está disponível aqui. Use o microfone do teclado.',
  'no-speech': 'Não ouvi nada. Toque no microfone e fale de novo.',
  'audio-capture': 'Não encontrei um microfone.',
  'network': 'O reconhecimento de voz precisa de internet.',
};

function iniciarVoz() {
  reconhecedor = new Reconhecimento();
  reconhecedor.lang = 'pt-BR';
  reconhecedor.interimResults = true; // mostra o texto enquanto a pessoa fala
  reconhecedor.continuous = false; // para sozinho quando a pessoa termina a frase
  reconhecedor.maxAlternatives = 1;

  reconhecedor.onresult = (evento) => {
    el.fraseTexto.value = Array.from(evento.results).map((r) => r[0].transcript).join(' ').trim();
  };
  reconhecedor.onerror = (evento) => {
    if (evento.error !== 'aborted') el.fraseErro.textContent = ERROS_VOZ[evento.error] || 'Não consegui ouvir. Tente de novo.';
  };
  reconhecedor.onend = () => {
    pararVisualVoz();
    // Terminou de falar e há texto: segue direto para a confirmação
    if (el.fraseTexto.value.trim()) enviarFrase();
  };

  el.fraseTexto.value = '';
  el.fraseErro.textContent = '';
  ouvindo = true;
  el.fraseForm.classList.add('ouvindo');
  el.fraseTexto.placeholder = 'Ouvindo… fale o gasto';
  el.fraseVoz.setAttribute('aria-label', 'Parar de ouvir');
  atualizarBotoesFrase();
  try {
    reconhecedor.start();
  } catch {
    pararVisualVoz();
    el.fraseErro.textContent = ERROS_VOZ['service-not-allowed'];
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
  if (ouvindo) reconhecedor.stop(); // tocar de novo encerra (e segue para a confirmação)
  else iniciarVoz();
});

atualizarBotoesFrase();
