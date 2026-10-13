// Tabela de apoio: as categorias disponíveis.
// `icone` é o NOME de um ícone de linha (ver icones.js).
// Pense nela como uma tabela "categorias" do banco: o lançamento guarda só o `id`,
// e o nome e o ícone vêm daqui na hora de exibir.
// Na Fase 1 a lista é fixa (decisão registrada no DECISOES.md).

const CATEGORIAS = {
  entrada: [
    { id: 'salario', nome: 'Salário', icone: 'maleta' },
    { id: 'renda-extra', nome: 'Freelance / Renda extra', icone: 'notebook' },
    { id: 'reembolso', nome: 'Reembolso', icone: 'devolver' },
    { id: 'rendimentos', nome: 'Rendimentos', icone: 'tendencia' },
    { id: 'outras-entradas', nome: 'Outras entradas', icone: 'mais-circulo' },
  ],
  saida: [
    { id: 'moradia', nome: 'Moradia', icone: 'casa' },
    { id: 'mercado', nome: 'Mercado', icone: 'carrinho' },
    { id: 'restaurantes', nome: 'Restaurantes e delivery', icone: 'talheres' },
    { id: 'transporte', nome: 'Transporte', icone: 'carro' },
    { id: 'saude', nome: 'Saúde', icone: 'coracao' },
    { id: 'educacao', nome: 'Educação', icone: 'livro' },
    { id: 'lazer', nome: 'Lazer', icone: 'ingresso' },
    { id: 'assinaturas', nome: 'Assinaturas', icone: 'repetir' },
    { id: 'compras', nome: 'Compras', icone: 'sacola' },
    { id: 'cartao-dividas', nome: 'Cartão / dívidas', icone: 'cartao' },
    { id: 'impostos-taxas', nome: 'Impostos e taxas', icone: 'porcentagem' },
    { id: 'outras-saidas', nome: 'Outras saídas', icone: 'menos-circulo' },
  ],
};

// Equivale a: SELECT * FROM categorias WHERE id = ?
function buscarCategoria(id) {
  const todas = [...CATEGORIAS.entrada, ...CATEGORIAS.saida];
  return todas.find((c) => c.id === id) || { id, nome: 'Sem categoria', icone: 'circulo' };
}
