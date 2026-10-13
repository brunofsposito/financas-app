// Camada de dados: o ÚNICO arquivo que conversa com o localStorage.
// localStorage é um "banco" bem simples do navegador: guarda texto por chave.
// Por isso transformamos cada lista em texto (JSON) para salvar
// e de volta em lista para ler.
// Cada "tabela" (lancamentos, contas) fica numa chave própria.
// Se um dia trocarmos por um servidor, só este arquivo muda.

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

  salvar(tabela, registros) {
    try {
      localStorage.setItem(this.chave(tabela), JSON.stringify(registros));
      return true;
    } catch (erro) {
      console.error(`Não foi possível salvar os dados (${tabela}).`, erro);
      return false;
    }
  },
};
