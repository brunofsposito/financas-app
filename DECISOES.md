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

### D08 · 🧭 Repositório público para publicar no GitHub Pages
**Data:** 12/10/2026
**Decisão:** tornar o repositório público em vez de pagar o GitHub Pro ou usar outro serviço de hospedagem.
**Por quê:** no plano gratuito, o GitHub Pages só funciona com repositório público. Além disso, o repositório precisa ser público para servir de portfólio.
**Cuidado que isso exige:** nada de dados reais no código. Os lançamentos ficam só no navegador (localStorage) e nunca vão para o GitHub.

### D09 · 🛠️ Mesmo formulário para criar e editar
**Data:** 12/10/2026
**Decisão:** tocar num lançamento abre o formulário de cadastro já preenchido, com o botão "Excluir".
**Por quê:** é uma tela só para aprender e manter, e o usuário já conhece o formulário.

### D10 · 🛠️ Exclusão física (apaga de verdade), com confirmação
**Data:** 12/10/2026
**Decisão:** excluir remove o lançamento do armazenamento, depois de perguntar "tem certeza?".
**Por quê:** é um app pessoal, sem auditoria nem contas de terceiros. Guardar lançamentos "apagados" seria complexidade sem uso agora.
**Contraponto de mercado:** em banco e fintech, transação não se apaga. Faz-se um *estorno* ou uma marcação de "excluído" (exclusão lógica), para manter a trilha de auditoria.
**Quando rever:** na Fase 3 (conciliação bancária), ou se o app virar produto com mais de um usuário.

### D11 · 🧭 Dashboard em duas partes, depois da Fase 1
**Data:** 13/10/2026
**Decisão:** terminar a Fase 1 (navegar entre meses e filtros) e só depois fazer o dashboard, dividido em duas partes:
- **Parte A (Entrega 6):** gastos por categoria no mês, útil desde o primeiro mês;
- **Parte B (backlog):** gráfico de linhas com a evolução mês a mês, só depois de 2 ou 3 meses de dados.
**Por quê:** um gráfico ao longo do tempo sem histórico nasce vazio. Entregar primeiro o que dá para usar já. A navegação por mês é pré-requisito das duas partes.

### D12 · 🛠️ Ao salvar, a tela vai para o mês do lançamento
**Data:** 13/10/2026
**Decisão:** se você salva um lançamento com data de outro mês, o app navega até esse mês.
**Por quê:** senão o lançamento "some" da tela atual e parece que não foi salvo.
**Junto:** ao cadastrar vendo outro mês, a data sugerida já cai naquele mês.

### D13 · 🧭 O resumo também respeita os filtros
**Data:** 13/10/2026
**Decisão:** com um filtro ligado, entrou, saiu e saldo mostram só os lançamentos filtrados.
**Por quê:** permite responder perguntas como "quanto saiu só no profissional?" ou "quanto gastei de mercado?".
**Cuidado:** um aviso "Filtro ativo · Limpar" e o rótulo "Saldo do mês (filtrado)" deixam claro que não é o total do mês.

### D14 · 🛠️ Filtros continuam ligados ao trocar de mês, mas não ficam salvos
**Data:** 13/10/2026
**Decisão:** ao navegar entre meses, os filtros ficam. Ao fechar e abrir o app, eles zeram.
**Por quê:** manter os filtros ao trocar de mês permite comparar meses (ex.: mercado em setembro × outubro). Zerar ao abrir garante que você sempre comece pelo quadro completo do mês.

### D15 · 🛠️ Backup com exportar **e** importar, juntando pelo id
**Data:** 13/10/2026
**Decisão:** exportar gera um arquivo JSON (no celular, pelo menu de compartilhar). Importar junta o arquivo com os dados atuais: o mesmo id é atualizado, o id novo é inserido, e nada é apagado.
**Por quê:** um backup sem restauração não protege nada. Juntar em vez de substituir evita perder um lançamento feito depois do backup. E importar o mesmo arquivo duas vezes não duplica nada.
**Validação:** um arquivo que não é do app, ou que tem algum lançamento inválido, é recusado inteiro.

### D16 · 🧭 Lembretes: alerta no app + Calendário do iPhone, sem push
**Data:** 13/10/2026
**Decisão:** os lembretes de contas usam (A) um alerta dentro do app e (B) a exportação para o Calendário do iPhone, com alarme. A notificação push de verdade (C) vai para o backlog.
**Por quê:** um site sem servidor não consegue "acordar" o celular num dia agendado. O Calendário é nativo, confiável e notifica com o app fechado, sem quebrar a regra "sem servidor" do briefing.
**Quando rever:** se o app virar produto, porque aí o push passa a ser necessário (exige backend, ver seção 5 do briefing).

### D17 · 🧭 Adiantar a Fase 2 antes da semana de uso e do dashboard
**Data:** 13/10/2026
**Decisão:** começar a Fase 2 (contas recorrentes) já, sem esperar a semana de uso da Fase 1. O dashboard (Entrega 6) fica para depois.
**Por quê:** os lembretes de contas são a dor nº 1 (seção 2 do briefing). Com a Fase 2, o app pode substituir os lembretes atuais já na semana de uso.

### D18 · 🛠️ Pagamento de conta = lançamento com `contaId` e `competencia`
**Data:** 13/10/2026
**Decisão:** a conta fixa não guarda se foi paga. "Paguei" cria um lançamento comum, ligado à conta e ao mês (competência). O status é calculado juntando as duas tabelas.
**Por quê:** uma fonte só da verdade. Excluir ou editar o pagamento reflete na conta automaticamente, e o pagamento entra no resumo do mês como qualquer saída.
**Junto:** o valor da conta é *previsto*. Na hora de pagar dá para ajustar (ex.: conta de luz que varia).

### D19 · 🛠️ Regras do calendário das contas
**Data:** 13/10/2026
**Decisão:**
- A conta vale **a partir do mês em que foi cadastrada** (para não aparecerem meses antigos "atrasados").
- **Dia 31 em mês curto** vira o último dia do mês (28/02, 30/04...).
- **"Vence em breve"** = nos próximos 5 dias. O alerta olha também o mês seguinte, para o fim do mês não esconder contas do dia 1º ou 2.
- O alerta mostra atrasadas **só do mês atual**.
- Excluir uma conta encerra a recorrência, mas **mantém os pagamentos já feitos** nos lançamentos.
**Quando rever:** depois da semana de uso (ex.: se 5 dias for pouco ou muito).

### D20 · 🛠️ Backup versão 2, compatível com a versão 1
**Data:** 13/10/2026
**Decisão:** o backup passa a incluir as contas fixas. Arquivos antigos (só com lançamentos) continuam sendo aceitos.
**Por quê:** um backup sem as contas perderia o cadastro da Fase 2. Manter a compatibilidade garante que o backup feito ontem ainda funcione.

### D21 · 🛠️ Calendário por arquivo .ics, com dois alarmes
**Data:** 13/10/2026
**Decisão:** o app gera um arquivo `.ics` com um evento mensal por conta: de dia inteiro, sem marcar como "ocupado", com alarmes **um dia antes às 9h** e **no dia às 9h**. Há dois botões: "Adicionar contas ao Calendário" (todas) e "Adicionar só esta conta" (na edição de uma conta).
**Por quê:** é o jeito de o aviso chegar com o app fechado, sem servidor (D16). Os horários dos alarmes podem ser mudados no próprio Calendário.
**Limitação:** o Calendário guarda uma cópia. Se a conta mudar no app, é preciso apagar o evento antigo e exportar de novo.

### D22 · 🛠️ Previsão = saldo do mês − contas fixas não pagas
**Data:** 13/10/2026
**Decisão:** a previsão para o fim do mês desconta do saldo todas as contas fixas ainda não pagas daquele mês, inclusive as atrasadas, pelo valor previsto. Ela aparece só no mês atual e nos futuros, só quando há contas fixas, e respeita os filtros da tela.
**Por quê:** é a forma mais simples de responder "quanto vai sobrar?" com os dados que o app já tem.
**Limitação:** as contas fixas são só saídas. Num mês futuro, o salário ainda não lançado não entra, e a previsão fica pessimista. Ir para o backlog: "entradas fixas".
