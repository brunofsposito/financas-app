// Tela da aba Análises: gastos por mês (linha), saldo por mês (colunas),
// comparação com o mês anterior e o "Para onde foi o dinheiro" (tela-dashboard.js).
// Os gráficos são SVG desenhados aqui mesmo, sem biblioteca externa.
// As regras ficam em analises.js.

Object.assign(el, {
  analisesSub: document.getElementById('analises-sub'),
  cardEvolucao: document.getElementById('card-evolucao'),
  chipsEvolucao: document.getElementById('chips-evolucao'),
  graficoEvolucao: document.getElementById('grafico-evolucao'),
  cardSaldos: document.getElementById('card-saldos'),
  graficoSaldos: document.getElementById('grafico-saldos'),
  saldosResumo: document.getElementById('saldos-resumo'),
  cardInicioAnalises: document.getElementById('card-inicio-analises'),
  inicioGastoMes: document.getElementById('inicio-gasto-mes'),
  cardComparacao: document.getElementById('card-comparacao'),
});

estado.analise = { categoria: '', selecionado: null }; // chip escolhido e mês tocado no gráfico

const ABREV = (mes) => MESES[mes - 1].slice(0, 3);
const svgTexto = (x, y, texto, extra = '') =>
  `<text x="${x}" y="${y}" fill="#8c8c86" font-family="Sora, system-ui, sans-serif" font-size="10" ${extra}>${texto}</text>`;

// "6 mil", "2,5 mil", "800" (para os rótulos do eixo)
function valorCurto(centavos) {
  const reais = centavos / 100;
  return reais >= 1000 ? `${(reais / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `${Math.round(reais)}`;
}

// Um teto "redondo" para o eixo, logo acima do maior valor (ex.: 5.310 -> 6 mil)
function tetoRedondo(maximo) {
  if (maximo <= 0) return 10000; // R$ 100
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const passo = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((p) => p * potencia >= maximo);
  return passo * potencia;
}

// Coluna com ponta arredondada (4px) e reta na linha de base
function caminhoColuna(x, y0, largura, altura, paraCima) {
  const r = Math.min(4, altura);
  if (paraCima) {
    const y = y0 - altura;
    return `M${x} ${y0} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + largura - r} Q${x + largura} ${y} ${x + largura} ${y + r} V${y0} Z`;
  }
  const y = y0 + altura;
  return `M${x} ${y0} V${y - r} Q${x} ${y} ${x + r} ${y} H${x + largura - r} Q${x + largura} ${y} ${x + largura} ${y - r} V${y0} Z`;
}

// ---------- Desenho geral ----------

function renderizarAnalises() {
  const hoje = hojeISO();
  const meses = Analises.janela(estado.ano, estado.mes);
  const linhas = Analises.porMes(meses, hoje, estado.analise.categoria);
  const comDados = linhas.filter((l) => l.temDados).length;

  const [primeiro, ultimo] = [meses[0], meses[meses.length - 1]];
  el.analisesSub.textContent = `Últimos ${meses.length} meses · ${MESES[primeiro.mes - 1].toLowerCase()} a ${MESES[ultimo.mes - 1].toLowerCase()}`;

  // Com menos de 2 meses de dados, um gráfico de evolução não diz nada: mostra o estado inicial
  const poucosDados = comDados < 2;
  el.cardEvolucao.hidden = poucosDados;
  el.cardSaldos.hidden = poucosDados;
  el.cardInicioAnalises.hidden = !poucosDados;

  if (poucosDados) {
    const atual = linhas[linhas.length - 1];
    el.inicioGastoMes.textContent = Dinheiro.formatar(atual.saiu);
  } else {
    renderizarChipsEvolucao(meses);
    desenharEvolucao(linhas);
    desenharSaldos(linhas);
  }
  renderizarComparacao(hoje);
}

// ---------- Gastos por mês (linha) ----------

function renderizarChipsEvolucao(meses) {
  const opcoes = ['', ...Analises.principaisCategorias(meses)];
  // A categoria escolhida pode ter saído do top 4 ao trocar de mês: volta para "Tudo"
  if (!opcoes.includes(estado.analise.categoria)) estado.analise.categoria = '';
  el.chipsEvolucao.replaceChildren(...opcoes.map((categoria) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'chip-pequeno';
    botao.textContent = categoria ? buscarCategoria(categoria).nome : 'Tudo';
    botao.setAttribute('aria-pressed', String(categoria === estado.analise.categoria));
    botao.addEventListener('click', () => {
      estado.analise = { categoria, selecionado: null };
      renderizarAnalises();
    });
    return botao;
  }));
}

function desenharEvolucao(linhas) {
  const media = Analises.media(linhas);
  const primeiroComDados = linhas.findIndex((l) => l.temDados);
  const pontos = linhas.map((l, i) => (i >= primeiroComDados ? l : null)); // antes de começar: sem ponto
  const valores = pontos.filter(Boolean).map((p) => p.saiu);
  const teto = tetoRedondo(Math.max(...valores, media || 0));

  const L = 44; const R = 310; const T = 14; const H = 150; // área do gráfico
  const passo = (R - L) / (linhas.length - 1);
  const x = (i) => L + i * passo;
  const y = (v) => T + H * (1 - v / teto);

  let svg = '';
  // Grade discreta e eixo (um só)
  for (const v of [teto, teto / 2, 0]) {
    svg += `<line x1="${L}" y1="${y(v)}" x2="${R}" y2="${y(v)}" stroke="${v ? '#262624' : '#3a3a37'}" stroke-width="1"/>`;
    svg += svgTexto(0, y(v) + 4, valorCurto(v));
  }
  // Média (só de meses fechados)
  if (media !== null) {
    svg += `<line x1="${L}" y1="${y(media)}" x2="${R}" y2="${y(media)}" stroke="#8c8c86" stroke-width="1" stroke-dasharray="3 4"/>`;
    // Contorno da cor do fundo: o texto continua legível mesmo cruzando a linha
    svg += svgTexto(R, y(media) - 6, `média R$ ${Math.round(media / 100).toLocaleString('pt-BR')}`,
      'text-anchor="end" stroke="#181816" stroke-width="4" paint-order="stroke"');
  }
  // Linha: contínua nos meses fechados, tracejada até o mês em andamento
  const idx = pontos.map((p, i) => (p ? i : null)).filter((i) => i !== null);
  const fechados = idx.filter((i) => !pontos[i].parcial);
  if (fechados.length > 1) {
    svg += `<path d="${fechados.map((i, k) => `${k ? 'L' : 'M'}${x(i)} ${y(pontos[i].saiu)}`).join(' ')}" fill="none" stroke="#d4ff3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const parcial = idx.find((i) => pontos[i].parcial);
  if (parcial !== undefined && fechados.length) {
    const anterior = fechados[fechados.length - 1];
    svg += `<path d="M${x(anterior)} ${y(pontos[anterior].saiu)} L${x(parcial)} ${y(pontos[parcial].saiu)}" fill="none" stroke="#d4ff3a" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 4"/>`;
    svg += svgTexto(x(parcial), Math.min(y(pontos[parcial].saiu) + 20, T + H - 4), 'parcial', 'text-anchor="end"');
  }
  // Mês tocado: linha vertical
  const sel = estado.analise.selecionado;
  if (sel !== null && pontos[sel]) svg += `<line x1="${x(sel)}" y1="${T}" x2="${x(sel)}" y2="${T + H}" stroke="#3a3a37" stroke-width="1"/>`;
  // Pontos (8px+, com anel da cor do fundo); o do mês em andamento é vazado
  for (const i of idx) {
    const p = pontos[i];
    const raio = i === sel ? 6 : 4;
    svg += p.parcial
      ? `<circle cx="${x(i)}" cy="${y(p.saiu)}" r="${raio}" fill="#181816" stroke="#d4ff3a" stroke-width="2"/>`
      : `<circle cx="${x(i)}" cy="${y(p.saiu)}" r="${raio}" fill="#d4ff3a" stroke="#181816" stroke-width="2"/>`;
  }
  // Meses no eixo
  linhas.forEach((l, i) => {
    svg += svgTexto(x(i), T + H + 22, ABREV(l.mes), `text-anchor="middle"${i === sel ? ' fill="#f4f4ef" font-weight="600"' : ''}`);
  });
  // Dica do mês tocado (caixa clara sobre o gráfico, presa dentro das bordas)
  if (sel !== null && pontos[sel]) {
    const p = pontos[sel];
    const largura = 136;
    const bx = Math.min(Math.max(x(sel) - largura / 2, L), R - largura);
    // A caixa vai para a metade do gráfico oposta ao ponto: nunca cobre a linha ali
    const by = y(p.saiu) < T + H / 2 ? T + H - 64 : T + 4;
    let linha3 = '';
    if (p.parcial) linha3 = `<tspan fill="#5c5c57">mês em andamento</tspan>`;
    else if (media) {
      const v = variacao(p.saiu, media);
      linha3 = v === 0 ? '<tspan fill="#5c5c57">na média</tspan>'
        : `<tspan fill="${v > 0 ? '#b45f00' : '#4d6b00'}" font-weight="600">${Math.abs(v)}% ${v > 0 ? 'acima' : 'abaixo'} da média</tspan>`;
    }
    svg += `<rect x="${bx}" y="${by}" width="${largura}" height="58" rx="12" fill="#f4f4ef"/>`;
    svg += `<text x="${bx + 12}" y="${by + 18}" fill="#0a0a0a" font-family="Sora, system-ui, sans-serif" font-size="10">${MESES[p.mes - 1]}</text>`;
    svg += `<text x="${bx + 12}" y="${by + 34}" fill="#0a0a0a" font-family="Sora, system-ui, sans-serif" font-size="13" font-weight="600">${Dinheiro.formatar(p.saiu)}</text>`;
    svg += `<text x="${bx + 12}" y="${by + 49}" font-family="Sora, system-ui, sans-serif" font-size="10">${linha3}</text>`;
  }

  const descricao = pontos.filter(Boolean).map((p) => `${MESES[p.mes - 1]} ${Dinheiro.formatar(p.saiu)}${p.parcial ? ' (parcial)' : ''}`).join(', ');
  el.graficoEvolucao.innerHTML = `
    <svg viewBox="0 0 320 196" role="img" aria-label="Gastos por mês: ${descricao}.${media ? ` Média ${Dinheiro.formatar(media)}.` : ''}">${svg}</svg>
    <div class="alvos-meses"></div>`;

  // "Botões invisíveis" sobre cada mês: tocar mostra o valor (tocar de novo esconde)
  const alvos = el.graficoEvolucao.querySelector('.alvos-meses');
  linhas.forEach((l, i) => {
    if (!pontos[i]) return;
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'alvo-mes';
    botao.style.left = `${((x(i) - passo / 2) / 320) * 100}%`;
    botao.style.width = `${(passo / 320) * 100}%`;
    botao.setAttribute('aria-label', `${MESES[l.mes - 1]}: ${Dinheiro.formatar(l.saiu)}`);
    botao.setAttribute('aria-pressed', String(i === sel));
    botao.addEventListener('click', () => {
      estado.analise.selecionado = estado.analise.selecionado === i ? null : i;
      renderizarAnalises();
    });
    alvos.append(botao);
  });
}

// ---------- Sobrou ou faltou (colunas do saldo) ----------

function desenharSaldos(linhas) {
  const primeiroComDados = linhas.findIndex((l) => l.temDados);
  const fechados = linhas.map((l, i) => (i >= primeiroComDados && !l.parcial ? l : null));
  const valores = fechados.filter(Boolean).map((l) => l.saldo);
  const maxPos = Math.max(1, ...valores.filter((v) => v > 0));
  const maxNeg = Math.max(0, ...valores.filter((v) => v < 0).map(Math.abs));
  const T = 22; const H = 112; // espaço vertical das colunas (com folga para os rótulos)
  const k = H / (maxPos + maxNeg);
  const y0 = T + maxPos * k; // a linha do zero
  const passo = 320 / linhas.length;
  const largura = 24;

  let svg = `<line x1="4" y1="${y0}" x2="316" y2="${y0}" stroke="#3a3a37" stroke-width="1"/>`;
  linhas.forEach((l, i) => {
    const cx = passo * i + passo / 2;
    const xl = cx - largura / 2;
    if (l.parcial) {
      svg += `<rect x="${xl}" y="${y0 - 30}" width="${largura}" height="30" rx="4" fill="none" stroke="#8c8c86" stroke-width="1.5" stroke-dasharray="3 3"/>`;
      svg += svgTexto(cx, y0 - 38, 'em curso', 'text-anchor="middle" font-size="9"');
    } else if (fechados[i]) {
      const v = l.saldo;
      const altura = Math.max(2, Math.abs(v) * k);
      const cor = v < 0 ? '#ff3d9a' : '#d4ff3a';
      svg += `<path d="${caminhoColuna(xl, y0, largura, altura, v >= 0)}" fill="${cor}"/>`;
      const sinal = v < 0 ? '−' : '+';
      const rotulo = `${sinal}${valorCurto(Math.abs(v))}`;
      svg += v >= 0
        ? `<text x="${cx}" y="${y0 - altura - 6}" text-anchor="middle" fill="#f4f4ef" font-family="Sora, system-ui, sans-serif" font-size="10" font-weight="600">${rotulo}</text>`
        : `<text x="${cx}" y="${y0 + altura + 13}" text-anchor="middle" fill="#ff3d9a" font-family="Sora, system-ui, sans-serif" font-size="10" font-weight="600">${rotulo}</text>`;
    }
    svg += svgTexto(cx, T + H + 30, ABREV(l.mes), 'text-anchor="middle"');
  });

  const descricao = fechados.filter(Boolean).map((l) => `${MESES[l.mes - 1]} ${l.saldo < 0 ? 'faltou' : 'sobrou'} ${Dinheiro.formatar(Math.abs(l.saldo))}`).join(', ');
  el.graficoSaldos.innerHTML = `<svg viewBox="0 0 320 170" role="img" aria-label="Saldo por mês: ${descricao}.">${svg}</svg>`;

  // Resumo em uma frase
  const lista = fechados.filter(Boolean);
  if (!lista.length) {
    el.saldosResumo.textContent = 'Os meses aparecem aqui quando fecharem.';
    return;
  }
  const sobrou = lista.filter((l) => l.saldo > 0).length;
  const total = lista.reduce((s, l) => s + l.saldo, 0);
  el.saldosResumo.textContent =
    `Em ${lista.length} ${plural(lista.length, 'mês fechado', 'meses fechados')}, sobrou em ${sobrou}. `
    + (total >= 0 ? `Total guardado: ${Dinheiro.formatar(total)}` : `No total, faltaram ${Dinheiro.formatar(-total)}`);
}

// ---------- Comparação com o mês anterior ----------

function seloVariacao(agora, antes) {
  const diferenca = agora - antes;
  if (diferenca === 0) return '<span class="selo">Igual</span>';
  const pct = variacao(agora, antes);
  // Gastar MENOS é bom (limão); gastar MAIS pede atenção (laranja)
  if (diferenca < 0) {
    const texto = agora === 0 ? `${Dinheiro.formatar(-diferenca)} a menos` : `${Math.abs(pct)}% menos`;
    return `<span class="selo selo-paga">${icone('seta-baixo', 12)}${texto}</span>`;
  }
  const texto = pct === null ? 'gasto novo' : `${pct}% mais`;
  return `<span class="selo selo-proxima">${icone('seta-cima', 12)}${texto}</span>`;
}

function renderizarComparacao(hoje) {
  const c = Analises.comparacao(estado.ano, estado.mes, hoje);
  const nomeAtual = MESES[estado.mes - 1];
  const nomeAnterior = MESES[c.anterior.mes - 1];

  if (!c.disponivel) {
    const proximo = new Date(estado.ano, estado.mes, 1);
    el.cardComparacao.innerHTML = `
      <div class="comparacao-vazia">
        <span class="item-icone">${icone('calendario')}</span>
        <span class="aviso-item-texto">
          <span class="aviso-titulo">Comparação com o mês anterior</span>
          <span class="aviso-detalhe">Disponível a partir de 1º de ${MESES[proximo.getMonth()].toLowerCase()}</span>
        </span>
      </div>`;
    return;
  }

  const linhasCategorias = c.categorias.map((cat) => `
    <div class="comparacao-linha">
      <span class="item-texto">
        <span class="item-descricao">${buscarCategoria(cat.categoria).nome}</span>
        <span class="item-detalhe">${Dinheiro.formatar(cat.agora)} · ${ABREV(c.anterior.mes).toLowerCase()} ${Dinheiro.formatar(cat.antes)}</span>
      </span>
      ${seloVariacao(cat.agora, cat.antes)}
    </div>`).join('');

  el.cardComparacao.innerHTML = `
    <div class="analise-cabecalho">
      <h2 class="analise-titulo">${nomeAtual} × ${nomeAnterior.toLowerCase()}</h2>
      <p class="analise-sub">${c.parcial ? `Comparando até o mesmo dia (${c.dia})` : 'Meses inteiros'}</p>
    </div>
    <div class="comparacao-total">
      <span class="item-texto">
        <span class="rotulo">Saiu em ${nomeAtual.toLowerCase()}</span>
        <span class="comparacao-valor">${Dinheiro.formatar(c.agora)}</span>
        <span class="item-detalhe">${nomeAnterior.toLowerCase()}: ${Dinheiro.formatar(c.antes)}</span>
      </span>
      ${seloVariacao(c.agora, c.antes)}
    </div>
    ${linhasCategorias ? `<div class="comparacao-categorias">${linhasCategorias}</div>` : ''}`;
}
