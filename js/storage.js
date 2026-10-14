// Camada de dados: o ÚNICO arquivo que conversa com o localStorage.
// localStorage é um "banco" bem simples do navegador: guarda texto por chave.
// Por isso transformamos cada lista em texto (JSON) para salvar
// e de volta em lista para ler.
// Cada "tabela" (lancamentos, contas, orcamentos) fica numa chave própria.
//
// Com a nuvem (nuvem.js), este continua sendo o único ponto de gravação: depois de
// salvar no celular, ele avisa a nuvem do que mudou (D03 pagando a conta).

const Storage = {
  // O "v1" no nome permite mudar o formato dos dados no futuro sem perder o antigo.
  chave(tabela) {
    return `financas-app:${tabela}:v1`;
  },

  // SELECT * FROM <tabela>
  carregar(tabela) {
    try {
      const texto = localStorage.getItem(this.chave(tabela));
      return texto ? JSON.parse(texto) : [];
    } catch (erro) {
      console.error(`Não foi possível ler os dados salvos (${tabela}).`, erro);
      return [];
    }
  },

  // opcoes.semNuvem: gravação que veio DA nuvem (não precisa voltar para ela)
  salvar(tabela, registros, opcoes = {}) {
    try {
      const antes = opcoes.semNuvem ? null : this.carregar(tabela);
      localStorage.setItem(this.chave(tabela), JSON.stringify(registros));
      if (antes && typeof Nuvem !== 'undefined') Nuvem.anotarMudancas(tabela, antes, registros);
      return true;
    } catch (erro) {
      console.error(`Não foi possível salvar os dados (${tabela}).`, erro);
      return false;
    }
  },
};
