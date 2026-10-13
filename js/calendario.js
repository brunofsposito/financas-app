// Exporta as contas fixas para o Calendário (Fase 2, Entrega 2.3).
// Gera um arquivo .ics (iCalendar, padrão RFC 5545) que iPhone, Google e
// Outlook entendem. Cada conta vira um evento que se repete todo mês,
// com alarmes. Assim o próprio celular avisa, mesmo com o app fechado (D16).

const Calendario = {
  // Alarmes de cada evento. O evento é de "dia inteiro" e começa à meia-noite,
  // então o alarme é contado a partir da meia-noite do dia do vencimento.
  ALARMES: [
    { gatilho: '-PT15H', texto: 'vence amanhã' }, // dia anterior, às 9h
    { gatilho: 'PT9H', texto: 'vence hoje' }, // no dia, às 9h
  ],

  nomeDoArquivo(contas) {
    return contas.length === 1 ? `conta-${slug(contas[0].descricao)}.ics` : 'contas-fixas.ics';
  },

  gerar(contas) {
    const linhas = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//financas-app//Contas fixas//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...contas.flatMap((c) => this.evento(c)),
      'END:VCALENDAR',
    ];
    // O padrão exige quebra de linha CRLF e linhas de no máximo 75 bytes
    return linhas.map(dobrarLinha).join('\r\n') + '\r\n';
  },

  evento(conta) {
    const [ano, mes] = conta.inicio.split('-').map(Number);
    const primeiro = Contas.vencimentoNoMes(conta, ano, mes).replace(/-/g, '');
    const titulo = `💸 ${conta.descricao} · ${Dinheiro.formatar(conta.valor)}`;
    const url = location.href.split('#')[0].split('?')[0];
    return [
      'BEGIN:VEVENT',
      // UID fixo por conta: identifica o mesmo evento se for importado de novo
      `UID:${conta.id}@financas-app`,
      `DTSTAMP:${carimboUTC()}`,
      `DTSTART;VALUE=DATE:${primeiro}`,
      `RRULE:${this.regraMensal(conta.dia)}`,
      `SUMMARY:${escapar(titulo)}`,
      `DESCRIPTION:${escapar(`Conta fixa: vence todo dia ${conta.dia}. Valor previsto: ${Dinheiro.formatar(conta.valor)}.\nDepois de pagar, toque em "Paguei" no app: ${url}`)}`,
      `URL:${url}`,
      'TRANSP:TRANSPARENT', // não marca você como "ocupado" no dia
      ...this.ALARMES.flatMap((a) => [
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `TRIGGER:${a.gatilho}`,
        `DESCRIPTION:${escapar(`${conta.descricao} ${a.texto}`)}`,
        'END:VALARM',
      ]),
      'END:VEVENT',
    ];
  },

  // Regra de repetição mensal. Cuidado com dias 29, 30 e 31: pelo padrão,
  // "todo dia 31" PULA os meses que não têm dia 31. Para seguir a mesma regra
  // do app (D19: dia 31 em mês curto vira o último dia), usamos:
  // - dia 31: o último dia do mês (BYMONTHDAY=-1)
  // - dia 29 ou 30: "o maior entre 28..dia que existir no mês" (BYSETPOS=-1)
  regraMensal(dia) {
    if (dia <= 28) return `FREQ=MONTHLY;BYMONTHDAY=${dia}`;
    if (dia === 31) return 'FREQ=MONTHLY;BYMONTHDAY=-1';
    const dias = [];
    for (let d = 28; d <= dia; d++) dias.push(d);
    return `FREQ=MONTHLY;BYMONTHDAY=${dias.join(',')};BYSETPOS=-1`;
  },
};

// ---------- Ajudantes do formato .ics ----------

// Texto no .ics: barra, vírgula, ponto e vírgula e quebra de linha precisam de "\"
function escapar(texto) {
  return String(texto)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Data e hora atual em UTC no formato do .ics: 20261013T120000Z
function carimboUTC() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Linhas com mais de 75 bytes são "dobradas": continuam na linha seguinte,
// que começa com um espaço. Contamos bytes (UTF-8), não letras, por causa
// de acentos e emojis, e nunca cortamos um caractere no meio.
function dobrarLinha(linha) {
  const bytes = (txt) => new TextEncoder().encode(txt).length;
  const partes = [];
  let atual = '';
  let limite = 75;
  for (const caractere of linha) {
    if (bytes(atual + caractere) > limite) {
      partes.push(atual);
      atual = '';
      limite = 74; // as linhas de continuação já gastam 1 byte com o espaço
    }
    atual += caractere;
  }
  partes.push(atual);
  return partes.join('\r\n ');
}

// "Conta de Luz!" -> "conta-de-luz"
function slug(texto) {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'conta';
}
