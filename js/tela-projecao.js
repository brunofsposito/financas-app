// Card "Quanto vai sobrar" (aba Análises, D45): três números (fim do mês, fim do ano,
// 12 meses) e a linha do acumulado com a faixa de pior e melhor caso.
// As regras ficam em projecao.js. Usa os ajudantes de gráfico de tela-analises.js.

Object.assign(el, {
  cardProjecao: document.getElementById('card-projecao'),
  projecaoNumeros: document.getElementById('projecao-numeros'),
  graficoProjecao: document.getElementById('grafico-projecao'),
  projecaoComo: document.getElementById('projecao-como'),
  projecaoVazio: document.getElementById('projecao-vazio'),
});

estado.projecao = { selecionado: null }; // mês tocado no gráfico

// "+R$ 3.180" / "−R$ 450": o sinal explícito deixa claro que é o que sobra (ou falta).
// Sem centavos: é uma estimativa, e centavos passariam uma precisão que ela não tem.
function valorComSinal(centavos) {
  const reais = Math.round(Math.abs(centavos) / 100)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  return `${centavos < 0 ? '−' : '+'}${reais}`;
}

function nomeMesAno({ ano, mes }) {
  return `${ABREV(mes).toLowerCase()}/${String(ano).slice(2)}`;
}

function renderizarProjecao() {
  const p = Projecao.calcular(hojeISO());
  el.projecaoVazio.hidden = p.disponivel;
  el.projecaoNumeros.hidden = !p.disponivel;
  el.graficoProjecao.hidden = !p.disponivel;
  el.projecaoComo.hidden = !p.disponivel;
  if (!p.disponivel) return;

  // Curto, médio e longo prazo. Em dezembro, "fim do ano" é o próprio mês: vira "em 6 meses".
  const { serie } = p;
  const atual = serie[0];
  const kAno = 12 - atual.mes;
  const marcos = [
    { rotulo: `Fim de ${MESES[atual.mes - 1].toLowerCase()}`, ponto: serie[0] },
    kAno > 0 ? { rotulo: 'Fim do ano', ponto: serie[kAno] } : { rotulo: 'Em 6 meses', ponto: serie[6] },
    { rotulo: 'Em 12 meses', ponto: serie[12] },
  ];
  el.projecaoNumeros.replaceChildren(...marcos.map(({ rotulo, ponto }) => {
    const div = document.createElement('div');
    div.className = 'projecao-numero';
    div.innerHTML = '<span class="projecao-rotulo"><span></span><span class="projecao-quando"></span></span><strong></strong>';
    div.querySelector('.projecao-rotulo span').textContent = rotulo;
    const strong = div.querySelector('strong');
    strong.textContent = valorComSinal(ponto.provavel);
    strong.classList.toggle('negativo', ponto.provavel < 0);
    // "Fim de outubro · out/26" seria repetido: o mês só aparece nos outros dois
    div.querySelector('.projecao-quando').textContent = ponto.k ? ` · ${nomeMesAno(ponto)}` : '';
    return div;
  }));

  desenharProjecao(serie, p.mesesBase > 1);

  // Como a conta foi feita, em uma linha (a "tabela" do gráfico, sem precisar tocar)
  const partes = [];
  if (p.fixosPorMes) partes.push(`fixos ${valorComSinal(p.fixosPorMes)}`);
  if (p.temVariaveis) partes.push(`variáveis ${valorComSinal(p.variaveisPorMes)} (média de ${p.mesesBase} ${plural(p.mesesBase, 'mês', 'meses')})`);
  let como = `Por mês: ${partes.join(' · ')}. Sem juros.`;
  if (!p.temVariaveis) como += ' Por enquanto só os fixos entram na conta: os gastos do dia a dia entram quando o 1º mês fechar.';
  else if (p.mesesBase < 2) como += ' Com 2 meses de histórico, aparece a faixa de pior e melhor caso.';
  else como += ' A faixa vai do pior ao melhor mês recente.';
  el.projecaoComo.textContent = como;
}

function desenharProjecao(serie, comFaixa) {
  const minimo = Math.min(0, ...serie.map((s) => s.pior));
  const maximo = Math.max(0, ...serie.map((s) => s.melhor));
  const teto = maximo > 0 ? tetoRedondo(maximo) : 0;
  const piso = minimo < 0 ? -tetoRedondo(-minimo) : 0;

  const L = 44; const R = 310; const T = 14; const H = 150;
  const passo = (R - L) / (serie.length - 1);
  const x = (k) => L + k * passo;
  const y = (v) => T + H * ((teto - v) / ((teto - piso) || 1));

  let svg = '';
  // Grade discreta: teto, zero (mais forte) e piso
  for (const v of [...new Set([teto, 0, piso])]) {
    svg += `<line x1="${L}" y1="${y(v)}" x2="${R}" y2="${y(v)}" stroke="${v === 0 ? '#3a3a37' : '#262624'}" stroke-width="1"/>`;
    svg += svgTexto(0, y(v) + 4, v < 0 ? `−${valorCurto(-v)}` : valorCurto(v));
  }
  // Faixa entre o pior e o melhor caso (só com 2+ meses de histórico)
  if (comFaixa) {
    const cima = serie.map((s) => `${x(s.k)} ${y(s.melhor)}`);
    const baixo = serie.map((s) => `${x(s.k)} ${y(s.pior)}`).reverse();
    svg += `<path d="M${cima.join(' L')} L${baixo.join(' L')} Z" fill="#d4ff3a" fill-opacity="0.12"/>`;
  }
  // Linha do cenário provável
  svg += `<path d="${serie.map((s, i) => `${i ? 'L' : 'M'}${x(s.k)} ${y(s.provavel)}`).join(' ')}" fill="none" stroke="#d4ff3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

  const sel = estado.projecao.selecionado;
  if (sel !== null) svg += `<line x1="${x(sel)}" y1="${T}" x2="${x(sel)}" y2="${T + H}" stroke="#3a3a37" stroke-width="1"/>`;
  // Pontos só nos marcos (a cada 3 meses) e no tocado: nada de ponto em todo lugar
  for (const s of serie) {
    if (s.k % 3 !== 0 && s.k !== sel) continue;
    svg += `<circle cx="${x(s.k)}" cy="${y(s.provavel)}" r="${s.k === sel ? 6 : 4}" fill="#d4ff3a" stroke="#181816" stroke-width="2"/>`;
  }
  // Meses no eixo, a cada 3
  for (const s of serie) {
    if (s.k % 3 !== 0) continue;
    svg += svgTexto(x(s.k), T + H + 22, ABREV(s.mes), `text-anchor="middle"${s.k === sel ? ' fill="#f4f4ef" font-weight="600"' : ''}`);
  }
  // Dica do mês tocado, na metade oposta ao ponto
  if (sel !== null) {
    const s = serie[sel];
    const largura = 170;
    const bx = Math.min(Math.max(x(sel) - largura / 2, L), R - largura);
    const by = y(s.provavel) < T + H / 2 ? T + H - 64 : T + 4;
    const faixa = comFaixa ? `entre ${valorCurtoComSinal(s.pior)} e ${valorCurtoComSinal(s.melhor)}` : 'sem faixa ainda';
    svg += `<rect x="${bx}" y="${by}" width="${largura}" height="58" rx="12" fill="#f4f4ef"/>`;
    svg += `<text x="${bx + 12}" y="${by + 18}" fill="#0a0a0a" font-family="Sora, system-ui, sans-serif" font-size="10">Até o fim de ${MESES[s.mes - 1].toLowerCase()}/${String(s.ano).slice(2)}</text>`;
    svg += `<text x="${bx + 12}" y="${by + 34}" fill="#0a0a0a" font-family="Sora, system-ui, sans-serif" font-size="13" font-weight="600">${valorComSinal(s.provavel)}</text>`;
    svg += `<text x="${bx + 12}" y="${by + 49}" fill="#5c5c57" font-family="Sora, system-ui, sans-serif" font-size="10">${faixa}</text>`;
  }

  const descricao = serie.filter((s) => s.k % 3 === 0).map((s) => `${MESES[s.mes - 1]} ${valorComSinal(s.provavel)}`).join(', ');
  el.graficoProjecao.innerHTML = `
    <svg viewBox="0 0 320 196" role="img" aria-label="Quanto vai sobrar, acumulado: ${descricao}.">${svg}</svg>
    <div class="alvos-meses"></div>`;

  // "Botões invisíveis" sobre cada mês: tocar mostra o valor (tocar de novo esconde)
  const alvos = el.graficoProjecao.querySelector('.alvos-meses');
  for (const s of serie) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'alvo-mes';
    botao.style.left = `${((x(s.k) - passo / 2) / 320) * 100}%`;
    botao.style.width = `${(passo / 320) * 100}%`;
    botao.setAttribute('aria-label', `Até ${MESES[s.mes - 1]}: ${valorComSinal(s.provavel)}`);
    botao.setAttribute('aria-pressed', String(s.k === sel));
    botao.addEventListener('click', () => {
      estado.projecao.selecionado = estado.projecao.selecionado === s.k ? null : s.k;
      renderizarProjecao();
    });
    alvos.append(botao);
  }
}

function valorCurtoComSinal(centavos) {
  return `${centavos < 0 ? '−' : ''}${valorCurto(Math.abs(centavos))}`;
}
