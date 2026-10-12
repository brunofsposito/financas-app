# Registro de decisões

Decisões importantes do projeto e o motivo de cada uma. Formato inspirado em ADR (*Architecture Decision Record*), simplificado.

**Legenda:** 🧭 decisão de produto (do Bruno) · 🛠️ decisão técnica (proposta pelo Claude e aprovada)

---

### D01 · 🛠️ HTML, CSS e JavaScript puro, sem framework
**Data:** 12/10/2026
**Decisão:** não usar React, Vue ou ferramentas de build.
**Por quê:** o objetivo é aprender como um app funciona por dentro. Sem build, basta abrir o `index.html`, e o GitHub Pages publica direto.
**Quando rever:** se o app ganhar muitas telas e o código ficar difícil de manter.

### D02 · 🛠️ Dados no localStorage, sem servidor
**Data:** 12/10/2026
**Decisão:** salvar os lançamentos no navegador.
**Por quê:** é zero custo, zero configuração, e os dados não saem do aparelho, o que é bom para privacidade.
**Trade-off:** os dados existem só naquele navegador. Se você limpar o histórico ou trocar de celular, eles se perdem. Uma exportação/backup pode entrar numa fase futura.

### D03 · 🛠️ Acesso aos dados isolado em `storage.js`
**Data:** 12/10/2026
**Decisão:** só um arquivo conversa com o localStorage.
**Por quê:** se um dia houver servidor (ex.: um módulo de mercado com vários usuários), a troca acontece em um único lugar. É como isolar a camada de acesso a dados num sistema com banco.

### D04 · 🛠️ Valores guardados em centavos (inteiros)
**Data:** 12/10/2026
**Decisão:** R$ 1.500,50 é guardado como `150050`.
**Por quê:** números com vírgula no computador têm erros de arredondamento (`0,1 + 0,2 = 0,30000000000000004`). Em finanças, um centavo errado quebra a conciliação. Prática padrão em bancos e fintechs.

### D05 · 🧭 Categorias fixas na Fase 1
**Data:** 12/10/2026
**Decisão:** 5 categorias de entrada e 12 de saída, sem permitir criar novas por enquanto.
**Por quê:** usar por uma semana antes de decidir o que falta. Uma lista curta aumenta a chance de categorizar tudo.
**Quando rever:** depois da semana de uso da Fase 1.

### D06 · 🧭 Tipo (pessoal/profissional) obrigatório, com "Pessoal" pré-selecionado
**Data:** 12/10/2026
**Decisão:** todo lançamento tem tipo, e o padrão é "Pessoal".
**Por quê:** separar pessoal de profissional é uma das dores originais. Deixar marcado por padrão mantém o cadastro rápido, já que a maioria dos lançamentos é pessoal.

### D07 · 🛠️ Categorias diferentes para entrada e saída
**Data:** 12/10/2026
**Decisão:** ao escolher "Entrada", o formulário mostra só as categorias de entrada, e o mesmo vale para "Saída".
**Por quê:** evita erros como lançar o salário como "Mercado" e deixa a lista de opções menor no celular.
