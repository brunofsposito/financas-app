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

### D23 · 🛠️ Dashboard parte A: barras horizontais, uma cor, com destaque
**Data:** 13/10/2026
**Decisão:** a seção "Para onde foi o dinheiro" mostra as saídas do mês por categoria em barras horizontais, da maior para a menor, numa cor só. Ela mostra as 5 maiores, com "Ver todas" para o resto. Respeita o filtro de tipo (pessoal/profissional). Tocar numa barra liga o filtro de categoria: a barra fica destacada e as outras em cinza.
**Por quê:** a tarefa é comparar tamanhos, e barras ordenadas são a forma mais fácil de ler. Pizza com até 12 fatias seria ilegível e exigiria 12 cores. As cores foram validadas para daltonismo e contraste nos modos claro e escuro. O cinza tem pouco contraste, então cada barra traz nome e valor escritos.
**Contexto:** feito antes da semana de uso, por decisão do Bruno (seguindo o D17).

### D24 · 🧭 Semana de uso adiada: priorizar novas funcionalidades
**Data:** 13/10/2026
**Decisão:** a semana de uso real fica para mais adiante. Antes disso, o app ganha novas funcionalidades.
**Por quê:** o foco agora é aprender construindo e ampliar o app.
**Risco assumido:** construir mais coisas sem o retorno do uso real aumenta a chance de fazer algo que não será usado. Para reduzir esse risco, cada funcionalidade nova passa pela pergunta "que dor isso resolve?" antes de ser construída.

### D25 · 🛠️ Orçamento por categoria: limite mensal fixo, gasto + previsto
**Data:** 13/10/2026
**Decisão:**
- Cada categoria de saída pode ter **um limite mensal**, igual para todos os meses. Mudar o limite muda também a visão dos meses passados.
- O uso considera o **gasto** (saídas lançadas) mais o **previsto** (contas fixas daquela categoria ainda não pagas no mês).
- Status: **estourou** (gasto > limite), **vai estourar** (gasto + previsto > limite), **perto** (gasto ≥ 80% do limite) e **ok**. Os do mês atual que pedem atenção entram no alerta do topo.
- O orçamento **ignora os filtros** de tipo e categoria, porque o limite é da categoria inteira. Um aviso aparece quando há filtro ligado.
- Backup **versão 3**, com os orçamentos. Aceita as versões 1 e 2.
**Por quê:** é o mais simples que responde "quanto ainda posso gastar?". Contar as contas fixas evita a falsa sensação de folga antes do dia de pagar.
**Quando rever:** se fizer falta um limite diferente por mês, ou um limite separado para pessoal e profissional.

### D26 · 🧭 Direção visual: Lima neon + fonte Sora + paleta neon por significado
**Data:** 13/10/2026
**Decisão:** entre 3 direções prototipadas (Esmeralda, Lima neon, Ametista), a escolhida foi a **Lima neon**: fundo preto, números grandes e finos, botões em pílula e barra de navegação flutuante. A fonte vem da Ametista: **Sora**.
**Paleta:** só cores neon, cada uma com um papel:
- **Limão `#D4FF3A`:** marca, ação principal, entradas, "tudo certo";
- **Laranja `#FF8A00`:** atenção (vence em breve, perto do limite);
- **Rosa `#FF3D9A`:** problema (atrasada, estourou).
Neutros: fundo `#0A0A0A`, card `#181816`, borda `#262624`, texto `#F4F4EF`, texto secundário `#8C8C86`.
**Regras:** uma tela sem problemas mostra só o limão; no máximo uma cor neon além do limão por card; saídas comuns em branco, nunca em rosa; status sempre com texto; texto sobre neon sempre preto.
**Por quê:** cores neon chamam atenção, então só funcionam se forem raras. Dar a cada cor um significado evita a tela "arco-íris". As três cores foram validadas para daltonismo (separação mínima ΔE 16,8) e para contraste sobre o fundo preto.
**Protótipos:** canvas de direções visuais (artefato privado do Bruno).

### D27 · 🛠️ Redesign em entregas; V1 só troca a aparência
**Data:** 13/10/2026
**Decisão:**
- O redesign é aplicado em 5 entregas (V1 a V5). A V1 troca só o visual, sem mudar o comportamento: as classes do CSS ficaram com os mesmos nomes.
- O app passa a ser **só escuro**. O modo claro foi removido, porque a direção escolhida nasceu escura e manter dois modos dobraria o trabalho de cada tela.
- As cores viraram **tokens com nome de papel** (`--lima`, `--aviso`, `--perigo`...).
- **Branco = selecionado. Limão = ação ou positivo.** Isso vale para filtros, opções e botões.
- A fonte **Sora** vem do Google Fonts: é a primeira dependência externa. Sem internet, cai para a fonte do sistema.
**Por quê:** separar a aparência do comportamento permite reaproveitar os testes antigos e reduz o risco do redesign.

### D28 · 🧭 Avisos mostram uma ação, não uma contagem
**Data:** 13/10/2026
**Decisão:** o topo mostra **apenas o aviso mais urgente**, com o botão que o resolve. Os demais ficam em "+N avisos", numa lista em que cada item tem a sua ação.
- **Ordem de urgência:** conta atrasada → vence hoje → orçamento estourado → vence em breve → orçamento vai estourar → perto do limite.
- **Ações:** conta → **Paguei** (abre o pagamento preenchido, no mês certo); orçamento estourado ou perto → **Ver gastos** (filtra os lançamentos da categoria); orçamento que vai estourar → **Ver contas**.
**Por quê:** o aviso anterior juntava 4 informações numa frase e não dizia o que fazer (feedback do Bruno: "poluído"). Um aviso por vez, com ação, é simples e resolve.

### D29 · 🛠️ Abas na URL e ícones de linha por nome
**Data:** 13/10/2026
**Decisão:**
- Quatro abas, **Início · Contas · Orçamentos · Ajustes**, numa barra flutuante com o + em limão. O mês no topo vale para todas. Os filtros ficam só no Início, e o backup foi para Ajustes.
- A aba aberta fica no endereço (`#contas`), usando o histórico do navegador.
- Todos os emojis viraram **ícones de linha** (SVG próprio, mesmo traço). As categorias guardam o *nome* do ícone. Os selos de status ganharam ícone junto do texto.
**Por quê:** a tela única tinha ficado longa demais. Abas organizam o app para crescer. Os emojis variam de aparelho para aparelho e não combinavam com o visual (feedback do Bruno).

### D30 · 🛠️ Formulário com chips e "Desfazer" (V3)
**Data:** 13/10/2026
**Decisão:** valor grande no centro; categorias como chips com ícone (botões de opção por baixo, numa linha que rola para o lado); data com Hoje / Ontem / calendário; escolher a categoria preenche a descrição se ela estiver vazia; depois de salvar um lançamento novo aparece "Salvo · Desfazer" por 6 segundos.
**Por quê:** menos toques e menos digitação no celular. Desfazer protege contra erro sem pedir confirmação no caminho certo.
**Junto:** a categoria passou a ser obrigatória, sem categoria escolhida por padrão (antes vinha a primeira da lista, o que levava a categorizar errado).

### D31 · 🛠️ Frase rápida com regras locais e confirmação (V4)
**Data:** 13/10/2026
**Decisão:** um intérprete só com regras (`frase.js`), sem servidor e sem IA. O primeiro número é o valor ("2 mil" e "1.200" incluídos). "Recebi", "ganhei", "salário" e similares indicam entrada. Um dicionário de palavras define a categoria; sem acerto, cai em "Outras". A data sai de "hoje", "ontem", "anteontem", "dia 10" ou "10/10" (um "dia 20" falado num dia 13 é do mês passado). "Cliente", "empresa" ou "trabalho", e o salário, marcam o tipo profissional. "Todo dia N" abre uma **conta fixa**. A frase **nunca é salva direto**: o formulário abre preenchido para conferir.
**Por quê:** resolve o caso comum sem custo, sem enviar dados para fora do celular e de forma previsível. A confirmação evita salvar algo mal entendido.
**Quando rever:** se o dicionário errar muito no uso real, dá para ampliar as palavras. Usar IA exigiria servidor e enviar o texto para fora (D02).

### D32 · 🛠️ Voz pelo navegador, com alternativa (V5)
**Data:** 13/10/2026
**Decisão:** o microfone usa o reconhecimento de voz do próprio navegador (Web Speech API, `webkitSpeechRecognition` no Safari), em português. O texto aparece enquanto você fala. Quando a fala termina, segue para a confirmação. O botão só aparece se o navegador tiver o recurso. Microfone negado ou serviço indisponível mostram uma mensagem e sugerem o microfone do teclado.
**Limite conhecido:** o suporte no iPhone varia com a versão do iOS e com o app aberto pelo navegador ou pela Tela de Início. Isso precisa ser validado no aparelho do Bruno.

### D33 · 🛠️ Voz: nunca falhar em silêncio
**Data:** 13/10/2026
**Contexto:** no primeiro teste no iPhone, o app aberto pelo link dentro do app do Claude ficava "ouvindo", mas não escrevia nada. Navegadores dentro de outros apps (Claude, WhatsApp, Instagram) ligam o microfone e não entregam o texto.
**Decisão:**
- Toda falha da voz mostra uma mensagem com o **código técnico entre parênteses**, para diagnóstico por print.
- Se nenhuma palavra chegar em **6 segundos**, o app para de ouvir e orienta: abrir no Safari ou pelo ícone da Tela de Início, ou usar o microfone do teclado.
- Se o aparelho não suportar a voz, o botão some e o teclado abre.
**Por quê:** uma falha silenciosa parece defeito e faz a pessoa desistir. Uma falha explicada, com caminho alternativo, mantém a confiança.
- **Atualização (13/10/2026):** no iPhone, pelo ícone da Tela de Início, a voz funcionava só na primeira vez. A causa provável é que a sessão anterior "segurava" o microfone. Agora cada sessão é encerrada explicitamente (`abort`) ao terminar, e uma nova é criada a cada toque. Além disso, se a voz já funcionou uma vez, o botão do microfone nunca some por causa de um erro.
- **Atualização 2 (13/10/2026):** encerrar cada sessão não resolveu no iPhone. A voz continuou funcionando só na primeira vez (print do Bruno: `sem-transcricao`). Nova abordagem: **um único "ouvinte" de voz, reaproveitado** a cada toque (o iOS parece aceitar só o primeiro). Plano B: se a voz travar depois do primeiro uso, aparece o botão **"Reativar voz"**, que recarrega o app (os dados ficam salvos) e destrava o microfone.

### D34 · 🛠️ Versão visível e "quebra de cache" nos arquivos
**Data:** 13/10/2026
**Contexto:** no teste da voz, o "Reativar voz" não aparecia no iPhone. Suspeita: o app da Tela de Início estava com arquivos antigos em cache, e as correções não tinham chegado.
**Decisão:**
- Cada arquivo CSS e JS é carregado com a versão no endereço (`app.js?v=2026.10.13-4`). Ao publicar, troca-se o número, e o celular é obrigado a baixar os arquivos novos.
- O número da versão aparece no fim da aba **Ajustes**, para sabermos qual versão está rodando em cada aparelho.
- Na voz, **qualquer** falha depois do primeiro uso (inclusive um "cancelado" silencioso) mostra "Reativar voz". A exceção é o microfone negado, que mantém a sua própria mensagem.
**Por quê:** sem saber qual versão está no aparelho, não dá para diagnosticar. Cache é uma das causas mais comuns de "corrigi, mas no celular continua igual".

### D35 · 🧭 Voz no iPhone: problema conhecido, pausado
**Data:** 13/10/2026
**Situação:** pelo ícone da Tela de Início, a voz funciona **na primeira fala** a cada abertura do app. Nas seguintes, o microfone liga mas nenhuma palavra chega. Tentativas que **não** resolveram: encerrar cada sessão, reaproveitar um único ouvinte, e recarregar o app ("Reativar voz").
**Decisão (Bruno):** pausar a investigação e seguir com outras funcionalidades. Enquanto isso, quando a voz trava, o app explica e abre o teclado, para usar o microfone do teclado (que sempre funciona). O botão "Reativar voz" foi escondido.
**Quando retomar:** testar no Safari (sem ser pela Tela de Início) para isolar se é limitação do modo "app web". Alternativas: a voz pelo teclado como caminho principal, ou um app nativo no futuro.

### D36 · 🧭🛠️ Aba Análises: linha de gastos, colunas de saldo e comparação "até o mesmo dia"
**Data:** 14/10/2026
**Decisão (protótipo aprovado pelo Bruno):**
- Nova aba **Análises** (a 5ª na barra). Ela recebe o "Para onde foi o dinheiro", que **saiu do Início**. Tocar numa barra leva ao Início, já filtrado.
- **Quanto saiu por mês:** linha dos últimos 6 meses (a janela termina no mês do topo da tela), com chips para trocar a categoria (as 4 que mais pesaram), linha tracejada da **média** e tocar no mês para ver o valor e a diferença para a média. O mês em andamento aparece **tracejado, como "parcial"**.
- **Sobrou ou faltou:** colunas do saldo de cada mês **fechado** (limão para cima, rosa para baixo) e um resumo em frase.
- **Comparação com o mês anterior "até o mesmo dia"** no mês corrente, ou meses inteiros num mês já fechado, com as 3 categorias que mais mudaram. Gastar menos = limão; gastar mais = laranja.
- **Média** só com meses fechados e com dados.
- Com **menos de 2 meses de dados**, a tela mostra um estado inicial explicando quando a evolução aparece.
**Por quê:** era o pedido original do dashboard "ao longo do tempo" (D11). A comparação até o mesmo dia evita conclusões erradas sobre um mês que ainda não fechou.

### D37 · 🧭 Nome "Sobra" e ícone do anel
**Data:** 14/10/2026
**Decisão (Bruno, "por enquanto"):** o app passa a se chamar **Sobra**, com a assinatura "sobra." (ponto em limão) e a frase "Quanto entra, quanto sai, quanto sobra." O ícone é um anel: o cinza é o que já saiu e o arco limão é o que sobra. Opções descartadas: Fôlego (emocional, mas não diz que é de finanças) e Trilho (sério demais).
**Técnico:** `manifest.webmanifest` (nome, ícones 192/512, tela cheia, cores) e `apple-touch-icon` de 180 px para o iPhone, todos gerados a partir de `icones/sobra.svg`. O endereço do app e o nome do repositório continuam `financas-app`.
**Pendente antes de ir para o mercado:** verificar o nome no INPI, nas lojas de apps e o domínio.

### D38 · 🧭🛠️ Banco na nuvem com Supabase, "offline primeiro"
**Data:** 14/10/2026
**Contexto:** o backup manual era um incômodo (dados só no celular, D02).
**Decisão (Bruno):** adotar o **Supabase** (PostgreSQL + login) como banco na nuvem. Isso muda o princípio da D02: com login, os dados financeiros ficam também num servidor de terceiros, na região São Paulo.
**Como:**
- **Tabelas** `lancamentos`, `contas` e `orcamentos`, iguais às do app, com `user_id` e **RLS** ("só o dono") — `supabase/schema.sql`.
- **Offline primeiro:** o app grava no celular, o `storage.js` anota cada mudança numa **fila**, e a fila é enviada (upsert/delete) quando houver internet. Ao abrir ou entrar, o app **puxa** tudo e dá prioridade ao que ainda não foi enviado.
- **Primeiro login** neste celular: tudo o que já existe localmente sobe para a nuvem.
- **Sair** apaga a cópia local (a nuvem mantém tudo), para outra pessoa no mesmo aparelho não ver os dados.
- **Login com e-mail e senha** (funciona dentro do app instalado; o "link mágico" abriria o Safari, fora do app).
- **Biblioteca do Supabase incluída no repositório** (`js/vendor/`), sem CDN. A chave pública fica em `js/config.js` (é pública por design; quem protege é o RLS). A chave secreta nunca entra no app.
- Sem configuração, o app funciona exatamente como antes, só no celular.
**Limitações:** o plano gratuito pausa o projeto depois de 7 dias sem uso. Em conflitos entre aparelhos, vence a última alteração enviada. Testado com um Supabase simulado; falta validar com o projeto real.

### D39 · 🧭🛠️ Lançamento único com "Repete todo mês" e entradas fixas
**Data:** 15/10/2026
**Contexto:** lançar, cadastrar conta fixa e definir orçamento ficavam em abas diferentes, e a conta fixa só aceitava saída (o salário não tinha onde entrar).
**Decisão (Bruno):** um lugar só para lançar. Ao subir uma entrada ou uma conta paga, a pessoa define ali mesmo se ela se repete todo mês.
**Como:**
- Chave **"Repete todo mês"** no formulário de lançamento, com o dia (sugerido pela data, editável). Ligada, cria o fixo a partir do mês do lançamento e já registra o lançamento como o pagamento/recebimento daquele mês. Desfazer apaga os dois.
- Vale também na **edição** de um lançamento avulso (ele passa a ser o primeiro mês do fixo). Lançamento que já é de um fixo mostra de qual é, em vez da chave.
- A tabela `contas` ganha **`movimento`** (`entrada` | `saida`, padrão `saida`). Entradas fixas: botão **Recebi**, textos "Cai em X dias", sem alerta de vencimento e sem alarme no Calendário. A previsão do mês soma as entradas a receber.
- A aba Contas vira **"Fixos do mês"**: lista, edição e o cadastro de um fixo que ainda não foi pago (ex.: aluguel do mês que vem).
- **Orçamento fica fora do formulário** por enquanto (decisão adiada pelo Bruno).
**Próximo passo:** projeção do acumulado (sem saldo inicial e sem juros, decisão do Bruno), usando fixos + média dos gastos variáveis.


### D40 · 🧭🛠️ Categoria, tipo e entrada/saída sugeridos pelo nome
**Data:** 15/10/2026
**Contexto:** ao digitar "Internet", o Bruno ainda precisava escolher Moradia e Pessoal na mão.
**Decisão (Bruno):** o formulário já pré-seleciona a partir da descrição.
**Como:** `sugerirPelaDescricao` (em `frase.js`, junto das outras regras de texto):
1. **Histórico primeiro:** se você já lançou algo com o mesmo nome, repete a categoria, o tipo e o movimento daquela vez (o app aprende com o seu uso).
2. **Dicionário depois:** o mesmo da frase rápida ("internet" → Moradia; "salário" → entrada, Salário, Profissional).
- Só no **lançamento novo**; na edição, vale o que foi salvo. Se você escolher categoria, tipo ou movimento na mão, a sugestão para de mexer.
- A tela avisa "Categoria · sugerida pelo nome" (visibilidade do status, Nielsen 1) e rola o carrossel até a categoria escolhida.

### D41 · 🧭 Fim da aba de fixos: "A pagar e a receber" na Início
**Data:** 15/10/2026
**Contexto:** com a chave "Repete todo mês" (D39), o cadastro saiu da aba de fixos. Para o Bruno, ter uma tela só para recorrentes não fazia mais sentido.
**Decisão (Bruno, opção "a"):** a aba sai da navegação (5 → 4 abas). A lista vira um bloco **"A pagar e a receber"** na Início, logo abaixo da previsão.
**Como:**
- O bloco mostra só o que **ainda falta** pagar ou receber. Os já pagos ficam recolhidos em "Ver N já pagos" (consulta, não ação).
- "+ Novo fixo" continua no bloco, para cadastrar algo que ainda não foi pago.
- A exportação para o **Calendário** foi para **Ajustes** (é configuração, usada raramente).
- O endereço antigo `#contas` abre a Início. O aviso "Ver contas" rola até o bloco.
**Por quê:** menos lugares para procurar (Nielsen 6 e 8). O que vence fica ao lado do saldo e da previsão, que é onde a decisão acontece.

### D42 · 🧭🛠️ Pacote A da auditoria de UX: menos toques
**Data:** 15/10/2026
**Contexto:** auditoria pelas heurísticas de Nielsen, contando toques por tarefa. O Bruno aprovou o pacote A.
**O que mudou:**
- **"Paguei" / "Recebi" em 1 toque** (antes 2): registra na hora com o valor previsto. O aviso traz **Ajustar** (abre o lançamento para corrigir o valor) e **Desfazer**.
- **Excluir sem "Tem certeza?", com Desfazer:** vale para lançamento, fixo e limite de orçamento. Confirmar a cada exclusão treina a pessoa a tocar "OK" sem ler; desfazer protege de verdade (Nielsen 3). Ficaram com confirmação só as ações que não dá para desfazer pelo app: importar backup e sair da conta.
- **Arrastar para a esquerda** um lançamento da lista exclui (gesto padrão do iPhone). De 3 toques e 2 rolagens para 1 gesto. Arrastar pouco não exclui, e a rolagem vertical continua normal.
- **Categorias por uso:** no formulário, as mais usadas nos últimos 60 dias vêm primeiro, e a escolhida sempre aparece no carrossel.
