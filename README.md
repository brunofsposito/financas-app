# financas-app

App simples de finanças pessoais, feito para o celular, que mostra **quanto entrou, quanto saiu e quanto sobrou** no mês, separando o que é **pessoal** do que é **profissional**.

É também um projeto de aprendizado: cada fase ensina um conceito de desenvolvimento e um conceito do mercado de fintechs. O contexto completo está em [`CLAUDE.md`](CLAUDE.md), e as decisões tomadas, em [`DECISOES.md`](DECISOES.md).

## O que o app faz hoje

- Resumo do mês: entrou, saiu e saldo.
- Navegar entre meses pelas setas ‹ › no topo, com atalho para voltar ao mês atual.
- Cadastro de entradas e saídas com valor, descrição, categoria, data e tipo (pessoal ou profissional).
- Lista dos lançamentos do mês.
- Filtros por tipo (pessoal ou profissional) e por categoria. O resumo também é filtrado.
- Editar e excluir: toque num lançamento da lista.
- **Contas fixas** (aluguel, internet, assinaturas): cadastro com dia de vencimento, status no mês (paga, vence em X dias, atrasada) e botão **Paguei**, que cria o lançamento.
- **Alerta no topo** quando há conta atrasada ou vencendo nos próximos 5 dias.
- **Adicionar ao Calendário do iPhone:** cada conta vira um evento mensal com alarmes (um dia antes e no dia, às 9h). O aviso chega mesmo com o app fechado.
- Os dados ficam salvos no próprio navegador (continuam lá ao fechar e abrir).
- Backup: exportar todos os lançamentos para um arquivo e importar de volta (seção "Seus dados", no fim da tela).

## Como rodar

Não precisa instalar nada.

- **No computador:** baixe o repositório e abra o arquivo `index.html` no navegador.
- **No celular:** acesse **https://brunofsposito.github.io/financas-app/**

> Os dados ficam salvos **só no navegador em que você usou o app**. Se abrir em outro celular ou outro navegador, ele começa vazio. Para levar os dados, use **Exportar backup** num aparelho e **Importar backup** no outro.

## Como o código está organizado

| Arquivo | Papel |
|---|---|
| `index.html` | A página e as telas |
| `css/style.css` | O visual, pensado primeiro para o celular |
| `js/categorias.js` | A lista fixa de categorias (como uma tabela de apoio) |
| `js/storage.js` | O "banco de dados": lê e grava no localStorage, uma "tabela" por chave |
| `js/lancamentos.js` | As regras: criar, editar, excluir, filtrar (mês, tipo, categoria) e somar |
| `js/contas.js` | Regras das contas fixas: vencimento, status e alertas |
| `js/calendario.js` | Gera o arquivo de calendário (.ics) com as contas fixas e os alarmes |
| `js/backup.js` | Exportar e importar os dados (montar, validar e juntar o arquivo) |
| `js/app.js` | Liga a tela às regras: cliques e desenho da lista |
| `js/tela-contas.js` | A parte da tela das contas fixas: lista, "Paguei", formulário e alerta |

## Fases

| Fase | Tema | Status |
|---|---|---|
| 1 | MVP: o quadro do mês | ✅ Construída, em semana de uso |
| 2 | Contas recorrentes e previsão | 🚧 Em andamento (adiantada, ver D17) |
| 3 | Importar extrato do banco | ⏳ |
| 4 | Estudo de Open Finance | ⏳ |
| 5 | Métricas do produto | ⏳ |

### Fase 1, por entrega

- [x] **Entrega 1:** resumo do mês, cadastro de lançamentos e lista do mês
- [x] **Entrega 2:** editar e excluir lançamentos
- [x] **Entrega 3:** navegar entre meses
- [x] **Entrega 4:** filtrar por categoria e por tipo
- [x] **Entrega 5:** publicar no GitHub Pages (feita antes, para eu já usar no celular)
- [ ] **Entrega 6:** dashboard parte A, gastos por categoria do mês

- [x] **Extra:** exportar e importar backup (antes da semana de uso)

### Fase 2, por entrega

- [x] **Entrega 2.1:** contas fixas, com status no mês e botão "Paguei"
- [x] **Entrega 2.2:** alerta no topo do app
- [x] **Entrega 2.3:** adicionar as contas ao Calendário do iPhone (com alarme)
- [ ] **Entrega 2.4:** previsão de saldo até o fim do mês

**Backlog:**
- Dashboard parte B, gráfico de linhas com a evolução mês a mês (quando houver 2 ou 3 meses de dados). Ver D11.
- Entrega 6 (dashboard por categoria): depois da Fase 2 (D17).
- Notificação push de verdade, se o app virar produto (D16).

## Aprendizados

### Entrega 1
- **Separação em camadas:** a tela (`app.js`), as regras (`lancamentos.js`) e os dados (`storage.js`) ficam em arquivos diferentes. Trocar o "banco" no futuro mexe em um arquivo só.
- **localStorage:** um banco chave-valor do navegador que só guarda texto. Por isso a lista vira texto (JSON) para ser salva.
- **Dinheiro em centavos:** valores são guardados como inteiros (R$ 15,90 = `1590`) para evitar erros de arredondamento. É assim que bancos e fintechs fazem.
- **Categorização de transações:** o lançamento guarda só o código da categoria, e o nome e o ícone vêm de uma lista central. É a base de todo relatório de "para onde foi o dinheiro".
- **Mobile first:** o layout nasce para a tela do celular. Campos com fonte de 16px evitam o zoom automático do iPhone.

### Entrega 2
- **CRUD:** criar, ler, atualizar e excluir (*Create, Read, Update, Delete*). São as quatro operações básicas de qualquer sistema, como `INSERT`, `SELECT`, `UPDATE` e `DELETE` no SQL.
- **Identificador único (id):** é o que permite dizer "edite *este* lançamento". Funciona como a chave primária de uma tabela.
- **Reaproveitar a tela:** o mesmo formulário serve para criar e para editar. Só muda o "modo" (`editandoId`). É menos código para manter.
- **Confirmar ações destrutivas:** excluir pergunta antes, porque não tem volta. É um princípio básico de UX.
- **Exclusão física × lógica** (fintech): aqui o lançamento é apagado de verdade. Bancos nunca apagam uma transação: fazem um **estorno** (um lançamento contrário), para manter a trilha de auditoria. Veja a D10 no DECISOES.md.

### Entrega 3
- **Estado da tela:** o app guarda "qual mês estou vendo" (`estado.ano` e `estado.mes`), e tudo é redesenhado a partir disso. Mudou o estado, chama `renderizar()`.
- **Datas são traiçoeiras:** virada de ano, meses com 28, 30 ou 31 dias, e janeiro que vale `0` no JavaScript. Deixamos o próprio `Date` fazer essas contas em vez de inventar regras.
- **O mesmo filtro, outro parâmetro:** a "query" por mês (`doMes`) existia desde a Entrega 1. Só a tela passou a mudar o parâmetro, sem mexer nos dados.
- **Competência** (fintech): o lançamento conta no mês da *data* dele, não no dia em que você cadastrou. Em finanças isso se chama **regime de competência × regime de caixa**, e você vai ouvir esses termos em qualquer fintech.
- **Área de toque:** botões com pelo menos 48px, o tamanho mínimo confortável para o dedo (recomendação do Google e da Apple).

### Entrega 4
- **Filtros = `WHERE` dinâmico:** cada filtro só entra na "query" se estiver preenchido. Vazio quer dizer "todos". É o mesmo que montar um `WHERE` só com as condições que o usuário escolheu.
- **Uma fonte da verdade:** o resumo e a lista usam o *mesmo* resultado filtrado, então nunca mostram números que não batem entre si.
- **Estado visível:** quando há filtro, o app avisa ("Filtro ativo · Limpar") e muda o rótulo para "(filtrado)". Esconder um filtro ligado é uma das causas mais comuns de "o sistema está errado!".
- **Análise por segmento** (fintech): ver o mesmo número "fatiado" (pessoal × profissional, por categoria) é a base de qualquer extrato inteligente e de qualquer análise de PO, como cortar uma métrica por coorte ou canal.

### Extra: backup
- **Serializar:** transformar os dados em texto (JSON) para salvar num arquivo e depois ler de volta. É o mesmo princípio de um `dump` de banco de dados.
- **Nunca confie no arquivo de entrada:** antes de importar, o app confere se o arquivo é mesmo um backup dele e se cada lançamento é válido. Se algo estiver errado, não importa nada (tudo ou nada, como uma *transação* no banco).
- **MERGE pelo id:** importar junta os dados em vez de substituir. O mesmo id é o mesmo lançamento, então importar duas vezes não duplica nada. Essa propriedade se chama **idempotência**.
- **Portabilidade de dados** (fintech): a LGPD garante ao titular o direito de levar os próprios dados. É o mesmo princípio que sustenta o Open Finance, que veremos na Fase 4.

### Fase 2, Entregas 2.1 e 2.2: contas fixas e alerta
- **Chave estrangeira e JOIN:** o pagamento é um lançamento comum com `contaId` e `competencia`. O status "paga" é *calculado* juntando contas com lançamentos (um `LEFT JOIN`), em vez de guardado. Uma fonte só da verdade: excluir o pagamento faz a conta voltar a "pendente".
- **Dado derivado × dado guardado:** status, dias para vencer e alerta não são salvos. São calculados toda vez a partir de "hoje". Assim nunca ficam desatualizados.
- **Migração sem dor:** o `storage.js` passou a guardar "tabelas", mas a chave dos lançamentos não mudou, então os dados antigos continuaram funcionando. O backup ganhou a versão 2, e os arquivos da versão 1 ainda são aceitos (compatibilidade retroativa).
- **Recorrência e competência** (fintech): a conta tem *competência* (o mês a que ela se refere) e o pagamento tem *data* (quando o dinheiro saiu). Pagar em novembro a conta de outubro conta em novembro no caixa, mas quita outubro. É assim que funcionam boletos, faturas e o débito automático.
- **Limites da plataforma:** um site sem servidor não consegue "acordar" o celular num horário marcado. Por isso o lembrete com o app fechado vai pelo Calendário (Entrega 2.3), e não por push (D16).

### Fase 2, Entrega 2.3: Calendário
- **Padrões abertos:** o `.ics` (iCalendar, RFC 5545) é um formato público que iPhone, Google e Outlook entendem. Usar um padrão evita integrar com cada calendário separadamente.
- **Regras de recorrência (RRULE):** "todo mês no dia 7" vira `FREQ=MONTHLY;BYMONTHDAY=7`. Pelo padrão, "todo dia 31" *pula* os meses curtos. Por isso o dia 31 vira "último dia do mês" (`BYMONTHDAY=-1`), seguindo a mesma regra do app.
- **Testar com uma ferramenta independente:** o arquivo foi validado por uma biblioteca de calendário externa ao app, que calculou as próximas datas. Testar só com o próprio código pode esconder o mesmo erro dos dois lados.
- **Exportação × sincronização:** o Calendário recebe uma *cópia*. Mudou a conta no app, é preciso exportar de novo. Sincronizar sozinho exigiria um servidor publicando um calendário "assinável" (*webcal*).
- **Lembrete de cobrança** (fintech): bancos e fintechs mandam aviso de vencimento porque isso reduz a inadimplência, que é uma métrica central de crédito. É o mesmo princípio aplicado às suas contas.
