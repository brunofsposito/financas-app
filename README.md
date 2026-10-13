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
- Os dados ficam salvos no próprio navegador (continuam lá ao fechar e abrir).

## Como rodar

Não precisa instalar nada.

- **No computador:** baixe o repositório e abra o arquivo `index.html` no navegador.
- **No celular:** acesse **https://brunofsposito.github.io/financas-app/**

> Os dados ficam salvos **só no navegador em que você usou o app**. Se abrir em outro celular ou outro navegador, ele começa vazio.

## Como o código está organizado

| Arquivo | Papel |
|---|---|
| `index.html` | A página e as telas |
| `css/style.css` | O visual, pensado primeiro para o celular |
| `js/categorias.js` | A lista fixa de categorias (como uma tabela de apoio) |
| `js/storage.js` | O "banco de dados": lê e grava no localStorage |
| `js/lancamentos.js` | As regras: criar, editar, excluir, filtrar (mês, tipo, categoria) e somar |
| `js/app.js` | Liga a tela às regras: cliques e desenho da lista |

## Fases

| Fase | Tema | Status |
|---|---|---|
| 1 | MVP: o quadro do mês | ✅ Construída, em semana de uso |
| 2 | Contas recorrentes e previsão | ⏳ |
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

**Backlog:** dashboard parte B, gráfico de linhas com a evolução mês a mês (quando houver 2 ou 3 meses de dados). Ver D11.

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
