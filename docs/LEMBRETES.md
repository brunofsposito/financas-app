# Ligando os lembretes de vencimento (notificações)

Os lembretes avisam no celular **1 dia antes e no dia do vencimento, às 9h**, para cada conta fixa ainda não paga (D46).
Quem envia é a nuvem: uma função do Supabase roda todo dia às 9h, mesmo com o app fechado.

Leva uns 15 minutos. É melhor fazer no computador, porque tem bastante copiar e colar.
Os valores secretos (`<VAPID_PRIVATE_KEY>`, `<TOKEN>`) o Claude te passa na conversa. **Eles não ficam no repositório.**

## 1. Criar a tabela e o agendamento
1. Supabase → **SQL Editor** → **New query**.
2. Cole o conteúdo de [`supabase/lembretes.sql`](../supabase/lembretes.sql).
3. Troque `<TOKEN>` pelo token que o Claude te passou.
4. Clique em **Run**. Se aparecer um aviso sobre operação destrutiva, pode confirmar: é o `unschedule`, que só recria o agendamento.

## 2. Criar a função "lembretes"
1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nome: `lembretes` (exatamente assim).
3. Apague o exemplo e cole o conteúdo de [`supabase/functions/lembretes/index.ts`](../supabase/functions/lembretes/index.ts).
4. Clique em **Deploy function**.
5. Na função → **Details** (ou **Settings**): **desligue "Verify JWT with legacy secret"** / "Enforce JWT verification" e salve.
   A própria função confere quem chama: o agendamento (pelo token) ou você logado (botão de teste).

## 3. Colar os segredos da função
Supabase → **Edge Functions** → **Secrets** → adicione:

| Nome | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | a chave pública (a mesma de `js/config.js`) |
| `VAPID_PRIVATE_KEY` | a chave privada que o Claude te passou |
| `LEMBRETES_TOKEN` | o mesmo token do passo 1 |

⚠️ A `VAPID_PRIVATE_KEY` é secreta: com ela, alguém poderia mandar notificação em nome do Sobra. Fica só aqui.

## 4. Ligar no iPhone
1. Abra o Sobra **pelo ícone da tela de início** (no Safari comum, o iPhone não deixa).
2. **Ajustes → Lembretes de vencimento → Ativar lembretes** → **Permitir**.
3. Toque em **Enviar um teste**: em alguns segundos chega "Lembretes ligados".

## Bom saber
- **Conta já paga** (com "Paguei" antes do dia) não avisa.
- **Entradas fixas** (salário) não avisam.
- **Novos fixos** entram sozinhos: não precisa fazer nada.
- **Sair da conta** desliga os lembretes deste celular.
- O plano gratuito do Supabase inclui 500 mil chamadas de função por mês. O Sobra usa uma por dia.
