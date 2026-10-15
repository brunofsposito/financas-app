-- Lembretes de vencimento (D46). Rode no SQL Editor do Supabase.
-- Pode rodar de novo sem problema: só cria o que ainda não existe.

-- ---------- 1. Para onde mandar o aviso de cada celular ----------
-- Uma linha por celular com os lembretes ligados: o endereço único que o
-- iPhone/Google criou (endpoint) e as chaves para cifrar a mensagem só para ele.
create table if not exists public.lembretes_push (
  endpoint  text primary key,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh    text not null,
  auth      text not null,
  criado_em timestamptz not null default now()
);

grant select, insert, update, delete on public.lembretes_push to authenticated;
alter table public.lembretes_push enable row level security;

drop policy if exists "dono" on public.lembretes_push;
create policy "dono" on public.lembretes_push for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- 2. Agendamento: todo dia às 9h de Brasília (12h UTC) ----------
-- pg_cron agenda; pg_net faz a chamada HTTP para a função "lembretes".
-- Troque <TOKEN> pelo mesmo valor do segredo LEMBRETES_TOKEN da função.
-- (O token NÃO vai para o repositório: ele fica só no seu banco e na função.)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('lembretes-diarios')
where exists (select 1 from cron.job where jobname = 'lembretes-diarios');

select cron.schedule(
  'lembretes-diarios',
  '0 12 * * *',
  $$
  select net.http_post(
    url := 'https://wauxtuxwxyeqohbtkgav.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-lembretes-token', '<TOKEN>'),
    body := '{}'::jsonb
  );
  $$
);

-- Para conferir depois: as últimas execuções do agendamento
--   select * from cron.job_run_details order by start_time desc limit 5;
-- e as respostas da função
--   select status_code, content from net._http_response order by created desc limit 5;
