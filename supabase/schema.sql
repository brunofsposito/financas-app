-- Sobra · banco de dados na nuvem (Supabase / PostgreSQL)
-- Rode este arquivo inteiro uma vez no Supabase: SQL Editor → New query → colar → Run.
--
-- Três tabelas, espelhando o que o app guarda no celular:
--   lancamentos, contas (fixas) e orcamentos.
-- Toda linha tem user_id (o dono). A segurança fica NO BANCO, com RLS
-- (Row Level Security): cada pessoa só enxerga e altera as próprias linhas,
-- mesmo que alguém tente consultar a tabela inteira.
-- Valores em CENTAVOS (inteiros), como no app (D04).

-- ---------- Lançamentos ----------
create table if not exists public.lancamentos (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id            text not null,                      -- gerado no celular (UUID)
  movimento     text not null check (movimento in ('entrada', 'saida')),
  valor         integer not null check (valor > 0), -- centavos
  data          date not null,
  descricao     text not null,
  categoria     text not null,
  tipo          text not null check (tipo in ('pessoal', 'profissional')),
  conta_id      text,                               -- pagamento de conta fixa (D18)
  competencia   text,                               -- 'AAAA-MM' da conta paga
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz,
  primary key (user_id, id)
);

-- ---------- Contas fixas ----------
create table if not exists public.contas (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id            text not null,
  descricao     text not null,
  valor         integer not null check (valor > 0), -- valor previsto, em centavos
  dia           integer not null check (dia between 1 and 31),
  categoria     text not null,
  tipo          text not null check (tipo in ('pessoal', 'profissional')),
  inicio        text not null,                      -- 'AAAA-MM'
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz,
  primary key (user_id, id)
);

-- ---------- Orçamentos (um limite por categoria) ----------
create table if not exists public.orcamentos (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria     text not null,
  limite        integer not null check (limite > 0), -- centavos
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz,
  primary key (user_id, categoria)
);

-- Índice para a consulta mais comum: lançamentos de um mês
create index if not exists lancamentos_por_data on public.lancamentos (user_id, data);

-- ---------- Segurança: quem pode acessar as tabelas ----------
-- Com "Automatically expose new tables" desligado no projeto, nenhuma tabela
-- nova fica acessível pela API. Liberamos só para quem está logado (authenticated);
-- visitante anônimo (anon) não acessa nada. É como um GRANT de SQL comum.
grant select, insert, update, delete on public.lancamentos to authenticated;
grant select, insert, update, delete on public.contas      to authenticated;
grant select, insert, update, delete on public.orcamentos  to authenticated;

-- ---------- Segurança: RLS ----------
-- O GRANT diz "pode acessar a tabela"; o RLS diz "quais linhas".
alter table public.lancamentos enable row level security;
alter table public.contas      enable row level security;
alter table public.orcamentos  enable row level security;

-- "Só o dono": vale para ler, inserir, alterar e apagar.
-- (select auth.uid()) entre parênteses é calculado uma vez por consulta (mais rápido).
drop policy if exists "dono" on public.lancamentos;
create policy "dono" on public.lancamentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "dono" on public.contas;
create policy "dono" on public.contas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "dono" on public.orcamentos;
create policy "dono" on public.orcamentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Pronto. Para conferir, depois de usar o app logado, rode por exemplo:
--   select categoria, sum(valor) / 100.0 as reais
--   from lancamentos where movimento = 'saida' and data >= date_trunc('month', now())
--   group by categoria order by 2 desc;
