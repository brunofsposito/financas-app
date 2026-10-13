# financas-app

App simples de finanças pessoais, feito para o celular (visual escuro com cores neon), que mostra **quanto entrou, quanto saiu e quanto sobrou** no mês, separando o que é **pessoal** do que é **profissional**.

É também um projeto de aprendizado: cada fase ensina um conceito de desenvolvimento e um conceito do mercado de fintechs. O contexto completo está em [`CLAUDE.md`](CLAUDE.md), e as decisões tomadas, em [`DECISOES.md`](DECISOES.md).

## O que o app faz hoje

- Resumo do mês: entrou, saiu e saldo.
- Navegar entre meses pelas setas ‹ › no topo, com atalho para voltar ao mês atual.
- **Frase rápida:** escreva ou fale "gastei 45 no mercado ontem" e o lançamento abre preenchido para conferir. "Aluguel 1200 todo dia 7" vira uma conta fixa.
- Cadastro de entradas e saídas com valor, descrição, categoria (chips com ícone), data (Hoje/Ontem) e tipo (pessoal ou profissional), com "Desfazer" logo depois de salvar.
- Lista dos lançamentos do mês.
- Filtros por tipo (pessoal ou profissional) e por categoria. O resumo também é filtrado.
- **Para onde foi o dinheiro:** gráfico de barras com as saídas do mês por categoria. Tocar numa barra filtra os lançamentos daquela categoria.
- Editar e excluir: toque num lançamento da lista.
- **Orçamento por categoria:** limite mensal (ex.: Mercado até R$ 800) com barra de progresso. A barra separa o que já foi gasto do que está previsto em contas fixas, e mostra os status "perto do limite", "vai estourar" e "estourou".
- **Contas fixas** (aluguel, internet, assinaturas): cadastro com dia de vencimento, status no mês (paga, vence em X dias, atrasada) e botão **Paguei**, que cria o lançamento.
- **Alerta no topo** quando há conta atrasada ou vencendo nos próximos 5 dias.
- **Previsão para o fim do mês:** saldo do mês menos as contas fixas ainda não pagas.
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
| `js/orcamentos.js` | Regras dos orçamentos: gasto, previsto e status de cada limite |
| `js/contas.js` | Regras das contas fixas: vencimento, status e alertas |
| `js/calendario.js` | Gera o arquivo de calendário (.ics) com as contas fixas e os alarmes |
| `js/backup.js` | Exportar e importar os dados (montar, validar e juntar o arquivo) |
| `js/icones.js` | Catálogo de ícones de linha (SVG); categorias e telas usam o nome do ícone |
| `js/tela-avisos.js` | Avisos: o mais urgente no topo, com a ação que resolve; os demais em "+N avisos" |
| `js/frase.js` | Intérprete da frase rápida: valor, entrada/saída, categoria, data e recorrência (só regras, sem servidor) |
| `js/tela-frase.js` | A barra da frase rápida e o microfone (voz) |
| `js/app.js` | Liga a tela às regras: abas, mês, filtros, formulário e lista de lançamentos |
| `js/tela-dashboard.js` | O gráfico "Para onde foi o dinheiro" (saídas por categoria) |
| `js/tela-orcamentos.js` | A parte da tela dos orçamentos: barras de progresso e formulário |
| `js/tela-contas.js` | A parte da tela das contas fixas: lista, "Paguei", formulário e alerta |

## Fases

| Fase | Tema | Status |
|---|---|---|
| 1 | MVP: o quadro do mês | ✅ Construída, em semana de uso |
| 2 | Contas recorrentes e previsão | ✅ Construída (adiantada, ver D17) |
| 3 | Importar extrato do banco | ⏳ |
| 4 | Estudo de Open Finance | ⏳ |
| 5 | Métricas do produto | ⏳ |

### Fase 1, por entrega

- [x] **Entrega 1:** resumo do mês, cadastro de lançamentos e lista do mês
- [x] **Entrega 2:** editar e excluir lançamentos
- [x] **Entrega 3:** navegar entre meses
- [x] **Entrega 4:** filtrar por categoria e por tipo
- [x] **Entrega 5:** publicar no GitHub Pages (feita antes, para eu já usar no celular)
- [x] **Entrega 6:** dashboard parte A, gastos por categoria do mês

- [x] **Extra:** exportar e importar backup (antes da semana de uso)

### Fase 2, por entrega

- [x] **Entrega 2.1:** contas fixas, com status no mês e botão "Paguei"
- [x] **Entrega 2.2:** alerta no topo do app
- [x] **Entrega 2.3:** adicionar as contas ao Calendário do iPhone (com alarme)
- [x] **Entrega 2.4:** previsão de saldo até o fim do mês

### Novas funcionalidades (depois das Fases 1 e 2)

- [x] **Orçamento por categoria**, com gasto, previsto e alertas

### Redesign "Lima neon" (D26)

- [x] **V1 · Base visual:** cores neon por significado, fonte Sora, número herói, botões em pílula, formulário abrindo de baixo
- [x] **V2 · Abas:** navegação inferior (Início · Contas · Orçamentos · Ajustes), ícones de linha no lugar dos emojis e avisos acionáveis
- [x] **V3 · Novo formulário:** chips de categoria, Hoje/Ontem, valor grande, "Salvo · Desfazer"
- [x] **V4 · Frase rápida:** "gastei 45 no mercado ontem" → confirmar → salvo, com Desfazer; "todo dia 7" vira conta fixa
- [x] **V5 · Voz:** microfone na barra da frase rápida (reconhecimento de voz do próprio navegador)

**Backlog:**
- Dashboard parte B, gráfico de linhas com a evolução mês a mês (quando houver 2 ou 3 meses de dados). Ver D11.
- Notificação push de verdade, se o app virar produto (D16).
- **Voz no iPhone só funciona na primeira fala** a cada abertura do app (D35). Investigação pausada; o microfone do teclado é a alternativa.
- Entradas fixas (ex.: salário recorrente) para a previsão de meses futuros (D22).

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

### Fase 2, Entrega 2.4: previsão de saldo
- **Realizado × previsto:** o saldo mostra o que *já aconteceu*. A previsão soma o que *vai acontecer* (as contas a pagar). No visual, o card tracejado indica "valor previsto".
- **Invariante:** pagar uma conta pelo valor previsto *não muda* a previsão, porque o dinheiro só passa de "a pagar" para "pago". Quando um número que deveria ficar parado não muda, é sinal de que a regra está certa. É um bom teste.
- **Reuso:** a previsão usa o mesmo filtro (`Lancamentos.filtrar`) e o mesmo status das contas. Nenhuma regra nova de "paga ou não paga" foi escrita.
- **Fluxo de caixa projetado** (fintech): "quanto vai sobrar" é a pergunta central de qualquer gestor financeiro, de app de banco e de crédito. É a base de funcionalidades como "saldo previsto" e "limite inteligente".

### Entrega 6: para onde foi o dinheiro
- **A forma vem antes da cor:** primeiro se pergunta "qual é o trabalho do gráfico?". Comparar quanto foi para cada categoria pede **barras ordenadas numa cor só**, não pizza. Comparar comprimentos é muito mais fácil do que comparar ângulos, e 12 fatias exigiriam 12 cores.
- **`GROUP BY` na prática:** `saidasPorCategoria` soma as saídas por categoria e ordena da maior para a menor. É o `SELECT categoria, SUM(valor) ... GROUP BY categoria ORDER BY 2 DESC` que você conhece.
- **Destaque em vez de várias cores:** a categoria escolhida fica na cor do app e as outras em cinza. É a forma mais clara de dizer "olhe esta aqui".
- **Gráfico que leva à ação:** tocar numa barra liga o filtro que já existia (Entrega 4). O gráfico vira uma porta de entrada para os lançamentos, e não um enfeite.
- **Análise de gastos** (fintech): "para onde vai o dinheiro" é a funcionalidade de engajamento mais comum em apps de banco (como os resumos de gastos do Nubank e do Itaú). Ela só funciona porque a categorização foi feita desde o início.

### Orçamento por categoria
- **Medidor × comparação:** "quanto já usei do limite" é uma razão contra um teto, e a forma certa para isso é uma barra de progresso. Comparar categorias entre si continua no gráfico de barras. Cada pergunta tem a sua forma.
- **Comprometido = gasto + previsto:** a barra junta o que já saiu com as contas fixas ainda não pagas daquela categoria. Sem isso, Moradia apareceria "zerada" até o dia de pagar o aluguel.
- **UPSERT:** definir um limite cria um registro se a categoria ainda não tem limite, ou atualiza o que já existe. O orçamento usa a própria categoria como chave, e não um id.
- **Status nunca só pela cor:** cada estado tem ícone e texto (🔴 Estourou, ⚠️ Vai estourar, ✅ Restam) e a parte prevista é listrada. É acessibilidade para daltônicos e também para quem lê rápido.
- **Gestão de orçamento** (fintech): limites por categoria e avisos de "perto do limite" são recursos clássicos de apps como Mobills, Organizze e dos próprios bancos. A ideia de "comprometido" é a mesma do limite de cartão: o que já está reservado conta, mesmo antes de sair.

### Redesign V1: base visual
- **Design tokens:** as cores viraram variáveis com nome de **papel** (`--lima`, `--aviso`, `--perigo`, `--superficie`), não de cor. Para mudar a marca, mexe-se num lugar só, e a regra "rosa = problema" fica escrita no próprio código.
- **Do protótipo ao código:** primeiro se decidiu o visual com telas de mentira, baratas de mudar. Só depois veio o código. Isso evita reescrever tela por gosto.
- **Mudar só a pele:** os nomes das classes CSS continuaram os mesmos, então o JavaScript quase não mudou e os testes antigos passaram iguais. Separar *aparência* de *comportamento* é o que permite um redesign sem medo.
- **Dependência externa consciente:** a fonte vem do Google Fonts. Se ele não carregar, o app usa a fonte do sistema e continua funcionando (*degradação graciosa*).
- **Branding** (fintech): Nubank (roxo), Inter (laranja), C6 (preto) mostram que no mercado a cor É a marca. Por isso cada cor da paleta tem uma única função.

### Redesign V2: abas, ícones e avisos acionáveis
- **Aviso = próxima ação, não relatório:** "1 conta atrasada · 2 orçamentos..." informa, mas não ajuda. Agora o topo mostra **uma coisa só, a mais urgente**, com o botão que resolve ("Condomínio atrasada há 2 dias · Paguei"). Os outros avisos ficam em "+N avisos".
- **Fila de prioridade:** os avisos são ordenados por uma tabela de urgência (atrasada > vence hoje > estourou > vence em breve > perto do limite). Resolver um faz o próximo subir sozinho.
- **Estado na URL:** a aba aberta fica no endereço (`#contas`). Por isso o "voltar" do navegador e o recarregar funcionam, e dá para abrir uma aba por link.
- **Ícones por nome:** as categorias guardam o *nome* do ícone (`carrinho`), não o desenho. É a mesma ideia dos tokens de cor: trocar o visual mexe num lugar só.
- **Next best action** (fintech): apps de banco não mostram só o saldo, eles sugerem o próximo passo ("pague sua fatura", "seu limite está perto do fim"). É assim que um aviso vira engajamento em vez de ruído.

### Redesign V3 a V5: formulário, frase rápida e voz
- **Reduzir atrito:** cada toque a menos importa. Os chips trocam um menu por um toque, "Ontem" troca o calendário, a categoria já preenche a descrição, e a frase rápida troca o formulário inteiro por uma linha.
- **"Desfazer" em vez de "Tem certeza?":** depois de salvar, um aviso com Desfazer resolve o erro sem interromper o fluxo certo. O "Tem certeza?" continua só para excluir.
- **Interpretar linguagem com regras:** o intérprete não usa IA. São regras simples (primeiro número = valor, dicionário de palavras = categoria, "ontem" = data). Por isso é rápido, funciona sem internet e é previsível. O limite é que só entende o que está no dicionário.
- **Confirmar antes de gravar:** a frase nunca é salva direto. O app mostra o que entendeu e você confere. É o padrão de "humano no circuito" para qualquer automação que mexe com dinheiro.
- **Recurso progressivo:** a voz usa um recurso do navegador. Se ele não existir, o botão some e o resto continua funcionando (*progressive enhancement*).
- **Testar o que não dá para testar de verdade:** sem microfone no ambiente de teste, um "falso microfone" simula a fala. É a mesma técnica (*mock*) usada para testar integrações com bancos sem mexer em dinheiro real.
- **Fricção × conversão** (fintech): em apps financeiros, cada passo a mais derruba a taxa de conclusão (de um cadastro, de um Pix). Medir e cortar passos é trabalho central do PO.
