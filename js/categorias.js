// Tabela de apoio: as categorias disponíveis.
// Pense nela como uma tabela "categorias" do banco: o lançamento guarda só o `id`,
// e o nome e o ícone vêm daqui na hora de exibir.
// Na Fase 1 a lista é fixa (decisão registrada no DECISOES.md).

const CATEGORIAS = {
  entrada: [
    { id: 'salario', nome: 'Salário', icone: '💼' },
    { id: 'renda-extra', nome: 'Freelance / Renda extra', icone: '🧾' },
    { id: 'reembolso', nome: 'Reembolso', icone: '↩️' },
    { id: 'rendimentos', nome: 'Rendimentos', icone: '📈' },
    { id: 'outras-entradas', nome: 'Outras entradas', icone: '➕' },
  ],
  saida: [
    { id: 'moradia', nome: 'Moradia', icone: '🏠' },
    { id: 'mercado', nome: 'Mercado', icone: '🛒' },
    { id: 'restaurantes', nome: 'Restaurantes e delivery', icone: '🍔' },
    { id: 'transporte', nome: 'Transporte', icone: '🚗' },
    { id: 'saude', nome: 'Saúde', icone: '💊' },
    { id: 'educacao', nome: 'Educação', icone: '📚' },
    { id: 'lazer', nome: 'Lazer', icone: '🎉' },
    { id: 'assinaturas', nome: 'Assinaturas', icone: '📺' },
    { id: 'compras', nome: 'Compras', icone: '🛍️' },
    { id: 'cartao-dividas', nome: 'Cartão / dívidas', icone: '💳' },
    { id: 'impostos-taxas', nome: 'Impostos e taxas', icone: '🏛️' },
    { id: 'outras-saidas', nome: 'Outras saídas', icone: '➖' },
  ],
};

// Equivale a: SELECT * FROM categorias WHERE id = ?
function buscarCategoria(id) {
  const todas = [...CATEGORIAS.entrada, ...CATEGORIAS.saida];
  return todas.find((c) => c.id === id) || { id, nome: 'Sem categoria', icone: '❔' };
}
