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
  const comVoz = typeof vozDisponivel === 'function' && vozDisponivel();
  el.fraseVoz.hidden = !(vazio && comVoz);
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

atualizarBotoesFrase();
