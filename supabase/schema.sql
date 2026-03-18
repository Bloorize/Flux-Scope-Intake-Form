create extension if not exists "pgcrypto";

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text,
  user_email text,
  structured jsonb not null,
  summary jsonb not null,
  loe jsonb not null
);

alter table public.form_submissions add column if not exists user_id text;
alter table public.form_submissions add column if not exists user_email text;

create index if not exists form_submissions_user_id_idx on public.form_submissions (user_id);

alter table public.form_submissions enable row level security;

drop policy if exists "No direct client reads" on public.form_submissions;
create policy "No direct client reads"
  on public.form_submissions
  for select
  using (false);

drop policy if exists "No direct client inserts" on public.form_submissions;
create policy "No direct client inserts"
  on public.form_submissions
  for insert
  with check (false);
