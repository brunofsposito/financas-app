# Briefing — App de Finanças Pessoais

> Documento de contexto para o Claude Code. Leia inteiro antes de começar. Ele explica quem eu sou, por que este projeto existe, para onde quero ir e como quero trabalhar com você.

---

## 1. Quem eu sou

- **Bruno**, Product Owner na idenX, uma empresa de tecnologia para eventos em Maringá (PR).
- Venho de **governança de TI e gestão de projetos**. Não sou desenvolvedor.
- Tenho familiaridade com **SQL e banco de dados** e convivo diariamente com o time de dev.
- Aprendo melhor **de cima para baixo**: primeiro o mapa e o "porquê", depois o código. Analogias com SQL e com produto funcionam bem comigo.
- Uso muito o **celular** e prefiro coisas visuais e diretas, sem textos longos.

---

## 2. O problema (a minha dor real)

Hoje o meu "controle financeiro" se resume a **lembretes de contas para pagar**. Eles servem para eu não esquecer o vencimento, mas:

- não sei **quanto entra** e **quanto sai** no mês;
- não sei **quanto sobra** nem para onde o dinheiro vai;
- não separo o que é **pessoal** do que é **profissional** (o meu salário da idenX).

Muita gente resolve isso com Excel. Eu quero algo simples, no celular, que me mostre o quadro do mês em um olhar.

---

## 3. Por que este projeto existe (3 objetivos)

| # | Objetivo | O que significa na prática |
|---|---|---|
| 1 | **Aprender desenvolvimento** | Entender como um app funciona por dentro: telas, dados, deploy, Git. Quero entender, não só copiar código (nada de "vibe coding" às cegas). |
| 2 | **Ganhar repertório de fintech para a carreira de PO** | As vagas de PO mais bem pagas estão em bancos e fintechs (Itaú, Nubank etc.) e exigem conhecimento do domínio. Cada fase do app deve me ensinar um conceito que esse mercado cobra. |
| 3 | **Talvez virar produto de mercado** | Se der certo, quero avaliar levar para o mercado, possivelmente com módulos para nichos pouco digitalizados (ver seção 6). |

O resultado deve funcionar também como **portfólio**: um repositório organizado, com README e decisões documentadas que eu consiga mostrar numa entrevista.

---

## 4. Fases do produto

Cada fase só começa depois que eu **usar a anterior de verdade** por cerca de uma semana. Eu sou o primeiro usuário e faço discovery comigo mesmo.

### Fase 1 — MVP: o quadro do mês ← **COMEÇAR AQUI**
- Cadastrar **entradas** (ex.: salário) e **saídas** (ex.: contas) com: valor, data, descrição, categoria e tipo (**pessoal** ou **profissional**).
- **Tela inicial** com o resumo do mês: entrou, saiu e saldo.
- **Lista de lançamentos** do mês, com filtro por categoria e por tipo.
- Navegar entre meses.
- Editar e excluir lançamentos.
- Funcionar bem no **celular** (mobile first).
- **Conceito de fintech:** categorização de transações.

### Fase 2 — Contas recorrentes e previsão
- Cadastrar contas que se repetem (aluguel, internet, assinaturas) com dia de vencimento.
- Marcar uma conta como paga, o que gera o lançamento automaticamente.
- Ver as contas que vencem nos próximos dias, substituindo os meus lembretes.
- Mostrar a **previsão de saldo** até o fim do mês.
- **Conceito de fintech:** recorrência e fluxo de caixa.

### Fase 3 — Importar extrato do banco
- Importar arquivo **CSV ou OFX** exportado do banco.
- Sugerir a categoria automaticamente e evitar lançamentos duplicados.
- Bater o extrato com o que eu lancei manualmente.
- **Conceito de fintech:** conciliação bancária.

### Fase 4 — Estudo de Open Finance (sem implementar)
- Documentar no repositório como o Open Finance funciona no Brasil: consentimento, regulação do BACEN, LGPD e o que seria preciso para conectar contas de verdade.
- **Conceito de fintech:** regulação e compliance.

### Fase 5 — Métricas do produto
- Instrumentar o uso do próprio app: o que eu mais uso, com que frequência volto.
- **Conceito de fintech:** ativação, retenção e linguagem de métricas de PO.

---

## 5. Restrições técnicas (por enquanto)

- **O mais simples possível:** HTML, CSS e JavaScript puro, com dados salvos no navegador (localStorage).
- **Sem servidor e sem banco externo** na Fase 1. Se uma fase futura exigir backend, me explique o porquê antes de propor.
- **Publicar no GitHub Pages** para eu abrir pelo celular.
- **Sem dados reais sensíveis** no repositório: nada de senha, número de conta ou valores reais em código ou em exemplos.
- Código organizado o suficiente para crescer em módulos (ver seção 6), mas sem complicar antes da hora.

---

## 6. Visão de futuro: módulos de mercado (NÃO construir agora)

Ideias de nichos pouco digitalizados, principalmente na região de Maringá, que poderiam virar módulos ou produtos derivados:

- **Orçamentos rápidos** para prestadores de serviço (eletricista, marceneiro, pintor): preencher poucos campos no celular e gerar um PDF para mandar no WhatsApp.
- **Custo da safra** para pequenos produtores rurais, que muitas vezes ainda controlam tudo no caderno.
- **Agenda com confirmação** para clínicas pequenas, para reduzir faltas.

Isso é **contexto, não escopo**. Só serve para você não tomar decisões que fechem essas portas. Antes de construir qualquer módulo, vou validar a dor conversando com pessoas reais.

---

## 7. Como quero trabalhar com você

1. **Explique antes de fazer.** Para cada decisão técnica, uma explicação curta e simples do porquê.
2. **Passos pequenos.** Uma fase de cada vez, e dentro dela, entregas pequenas que eu consiga ver funcionando.
3. **Me ensine no caminho.** Ao final de cada entrega, liste em 3 a 5 tópicos o que eu aprendi (conceito de dev + conceito de fintech).
4. **Documente.** Mantenha um `README.md` atualizado com: o que o app faz, como rodar, fases concluídas e aprendizados.
5. **Registre decisões.** Mantenha um arquivo `DECISOES.md` com as decisões importantes e o motivo de cada uma, como um PO faria.
6. **Use Git direito.** Commits pequenos, com mensagens claras em português, para eu aprender o fluxo.
7. **Pergunte quando houver dúvida de produto.** As decisões de produto são minhas; as técnicas, você propõe e explica.

---

## 8. Definição de pronto da Fase 1

- [ ] Consigo cadastrar, editar e excluir entradas e saídas pelo celular.
- [ ] A tela inicial mostra entrou, saiu e saldo do mês atual.
- [ ] Consigo filtrar por categoria e por tipo (pessoal ou profissional).
- [ ] Consigo navegar entre meses.
- [ ] Os dados continuam lá quando fecho e abro o app.
- [ ] O app está publicado no GitHub Pages e abre no meu celular.
- [ ] O README e o DECISOES.md estão criados.

---

## 9. Primeira tarefa

Comece pela **Fase 1**. Antes de escrever código:

1. Me mostre em poucos tópicos **como você vai estruturar o projeto** (arquivos e o papel de cada um).
2. Proponha a **lista de categorias iniciais**.
3. Espere o meu OK e só então comece a construir.
