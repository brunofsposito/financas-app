# financas-app

App simples de finanças pessoais, feito para o celular, que mostra **quanto entrou, quanto saiu e quanto sobrou** no mês, separando o que é **pessoal** do que é **profissional**.

É também um projeto de aprendizado: cada fase ensina um conceito de desenvolvimento e um conceito do mercado de fintechs. O contexto completo está em [`CLAUDE.md`](CLAUDE.md), e as decisões tomadas, em [`DECISOES.md`](DECISOES.md).

## O que o app faz hoje

- Resumo do mês atual: entrou, saiu e saldo.
- Cadastro de entradas e saídas com valor, descrição, categoria, data e tipo (pessoal ou profissional).
- Lista dos lançamentos do mês.
- Os dados ficam salvos no próprio navegador (continuam lá ao fechar e abrir).

## Como rodar

Não precisa instalar nada.

- **No computador:** baixe o repositório e abra o arquivo `index.html` no navegador.
- **No celular:** acesse o endereço do GitHub Pages (veja abaixo).

> Os dados ficam salvos **só no navegador em que você usou o app**. Se abrir em outro celular ou outro navegador, ele começa vazio.

## Como o código está organizado

| Arquivo | Papel |
|---|---|
| `index.html` | A página e as telas |
| `css/style.css` | O visual, pensado primeiro para o celular |
| `js/categorias.js` | A lista fixa de categorias (como uma tabela de apoio) |
| `js/storage.js` | O "banco de dados": lê e grava no localStorage |
| `js/lancamentos.js` | As regras: criar lançamentos, filtrar por mês e somar |
| `js/app.js` | Liga a tela às regras: cliques e desenho da lista |

## Fases

| Fase | Tema | Status |
|---|---|---|
| 1 | MVP: o quadro do mês | 🚧 Em andamento |
| 2 | Contas recorrentes e previsão | ⏳ |
| 3 | Importar extrato do banco | ⏳ |
| 4 | Estudo de Open Finance | ⏳ |
| 5 | Métricas do produto | ⏳ |

### Fase 1, por entrega

- [x] **Entrega 1:** resumo do mês, cadastro de lançamentos e lista do mês
- [ ] **Entrega 2:** editar e excluir lançamentos
- [ ] **Entrega 3:** navegar entre meses
- [ ] **Entrega 4:** filtrar por categoria e por tipo
- [ ] **Entrega 5:** publicar no GitHub Pages

## Aprendizados

### Entrega 1
- **Separação em camadas:** a tela (`app.js`), as regras (`lancamentos.js`) e os dados (`storage.js`) ficam em arquivos diferentes. Trocar o "banco" no futuro mexe em um arquivo só.
- **localStorage:** um banco chave-valor do navegador que só guarda texto. Por isso a lista vira texto (JSON) para ser salva.
- **Dinheiro em centavos:** valores são guardados como inteiros (R$ 15,90 = `1590`) para evitar erros de arredondamento. É assim que bancos e fintechs fazem.
- **Categorização de transações:** o lançamento guarda só o código da categoria, e o nome e o ícone vêm de uma lista central. É a base de todo relatório de "para onde foi o dinheiro".
- **Mobile first:** o layout nasce para a tela do celular. Campos com fonte de 16px evitam o zoom automático do iPhone.
