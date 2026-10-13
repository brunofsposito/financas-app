// Ícones de linha do app (substituem os emojis).
// Todos no mesmo estilo: grade 24×24, traço de 1,8, pontas arredondadas.
// Cada ícone tem um NOME; as categorias e as telas usam o nome, nunca o desenho.
// Assim, trocar um ícone é mexer numa linha só.

const ICONES = {
  // Categorias de entrada
  maleta: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
  notebook: '<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
  devolver: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  tendencia: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  'mais-circulo': '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',

  // Categorias de saída
  casa: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  carrinho: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6"/>',
  talheres: '<path d="M3 2v7a3 3 0 0 0 6 0V2M6 9v13"/><path d="M18 15V2a4 4 0 0 0-4 4v6a3 3 0 0 0 3 3h1v7"/>',
  carro: '<path d="M5 17h14v-4.5L17.2 7.6A2 2 0 0 0 15.3 6H8.7a2 2 0 0 0-1.9 1.6L5 12.5z"/><path d="M5 12.5h14M7 17v2.5M17 17v2.5"/>',
  coracao: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
  livro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  ingresso: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v2M14 11v2M14 16v2"/>',
  repetir: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  sacola: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  cartao: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  porcentagem: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  'menos-circulo': '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  circulo: '<circle cx="12" cy="12" r="9"/>',

  // Interface
  check: '<path d="M20 6 9 17l-5-5"/>',
  alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pizza: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  ajustes: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  baixar: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  enviar: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  grafico: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  'seta-cima': '<path d="M12 19V5M5 12l7-7 7 7"/>',
  'seta-baixo': '<path d="M12 5v14M5 12l7 7 7-7"/>',
  'seta-direita': '<path d="m9 18 6-6-6-6"/>',
  sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
};

// Devolve o <svg> do ícone como texto, para usar dentro de um template.
// Decorativo por padrão (aria-hidden): o texto ao lado é que diz o que é.
function icone(nome, tamanho = 20) {
  const desenho = ICONES[nome] || ICONES.circulo;
  return `<svg class="icone" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${desenho}</svg>`;
}
