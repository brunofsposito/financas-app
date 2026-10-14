# Ligando a nuvem do Sobra (Supabase)

Guia para criar o banco na nuvem. Leva uns 10 minutos e é tudo pelo navegador.
Dá para fazer pelo celular, mas é mais confortável no computador.

## 1. Criar a conta e o projeto
1. Acesse **supabase.com** → **Start your project** → entre com o GitHub (a mesma conta do repositório).
2. **New project**:
   - **Name:** `sobra`
   - **Database Password:** clique em *Generate a password* e **guarde num lugar seguro** (o app não usa essa senha; ela serve só para acesso direto ao banco).
   - **Region:** **South America (São Paulo)**. Os dados ficam no Brasil e o app responde mais rápido.
   - **Plano:** Free.
3. Espere o projeto ficar pronto (1 a 2 minutos).

## 2. Criar as tabelas
1. No menu da esquerda: **SQL Editor** → **New query**.
2. Copie **todo** o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) e cole.
3. Clique em **Run**. Deve aparecer *"Success. No rows returned"*.
4. Confira em **Table Editor**: as tabelas `lancamentos`, `contas` e `orcamentos` devem estar lá, cada uma com o selo **RLS enabled**.

## 3. Configurar o login
1. **Authentication** → **Sign In / Providers** → **Email**: deixe **ligado**.
2. Em **Confirm email**, escolha uma das opções:
   - **Desligado (mais simples):** cria a conta e já entra.
   - **Ligado (mais seguro):** você recebe um e-mail para confirmar antes do primeiro login.
3. **Authentication** → **URL Configuration** → **Site URL**: `https://brunofsposito.github.io/financas-app/`.
   Assim, o link de confirmação do e-mail volta para o app.

## 4. Pegar os dados de conexão
1. **Project Settings** → **API** (ou o botão **Connect**, no topo).
2. Copie:
   - **Project URL**, algo como `https://abcdxyz.supabase.co`;
   - a chave **anon public** (ou **publishable**), um texto longo.
3. ⚠️ **Não copie a chave `service_role` / `secret`.** Ela ignora as regras de segurança e nunca pode ir para o app.
4. Mande os dois para o Claude (ou cole você mesmo em `js/config.js`).

> **A chave anon é pública?** Sim, por design: ela vai para o navegador de qualquer jeito. O que protege os dados é o **RLS** (o `create policy "dono"` do `schema.sql`): mesmo com a chave, cada pessoa só enxerga as próprias linhas.

## 5. Usar
1. Atualize o app (feche e abra pelo ícone).
2. **Ajustes → Sua conta → Criar conta** (e-mail e senha de pelo menos 6 caracteres).
3. Pronto: tudo o que já estava no celular sobe para a nuvem, e daí em diante cada alteração é salva sozinha.
4. Em outro aparelho, basta **Entrar** com o mesmo e-mail e senha.

## Bom saber
- **Plano gratuito:** o projeto é **pausado depois de 7 dias sem nenhum uso**. Com o uso diário isso não acontece. Se pausar, é só entrar no supabase.com e clicar em **Restore**.
- **Sem internet:** o app continua funcionando. As alterações ficam numa fila e sobem quando a internet volta.
- **Consultar seus dados com SQL:** no **SQL Editor**, por exemplo:
  ```sql
  select categoria, sum(valor) / 100.0 as reais
  from lancamentos
  where movimento = 'saida' and data >= date_trunc('month', now())
  group by categoria order by 2 desc;
  ```
