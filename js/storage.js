// Camada de dados: o ÚNICO arquivo que conversa com o localStorage.
// localStorage é um "banco" bem simples do navegador: guarda texto por chave.
// Por isso transformamos a lista de lançamentos em texto (JSON) para salvar
// e de volta em lista para ler.
// Se um dia trocarmos por um servidor, só este arquivo muda.

const Storage = {
  // O "v1" no nome permite mudar o formato dos dados no futuro sem perder o antigo.
  CHAVE: 'financas-app:lancamentos:v1',

  carregar() {
    try {
      const texto = localStorage.getItem(this.CHAVE);
      return texto ? JSON.parse(texto) : [];
    } catch (erro) {
      console.error('Não foi possível ler os dados salvos.', erro);
      return [];
    }
  },

  salvar(lancamentos) {
    try {
      localStorage.setItem(this.CHAVE, JSON.stringify(lancamentos));
      return true;
    } catch (erro) {
      console.error('Não foi possível salvar os dados.', erro);
      return false;
    }
  },
};
