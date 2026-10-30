create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_single_admin_idx
  on public.profiles (role) where role = 'admin';

create table if not exists public.settings (
  id integer primary key check (id = 1),
  qr_image_url text,
  payment_id text not null default '',
  min_deposit numeric not null default 500 check (min_deposit > 0),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

create or replace function public.create_client_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'client');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_client_profile();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "Authenticated users read settings" on public.settings;
create policy "Authenticated users read settings" on public.settings
  for select to authenticated using (true);

drop policy if exists "Admins update settings" on public.settings;
create policy "Admins update settings" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('qr-codes', 'qr-codes', true)
on conflict (id) do update set public = true;

drop policy if exists "QR codes are publicly readable" on storage.objects;
create policy "QR codes are publicly readable" on storage.objects
  for select using (bucket_id = 'qr-codes');

drop policy if exists "Admins upload QR codes" on storage.objects;
create policy "Admins upload QR codes" on storage.objects
  for insert to authenticated with check (bucket_id = 'qr-codes' and public.is_admin());

drop policy if exists "Admins replace QR codes" on storage.objects;
create policy "Admins replace QR codes" on storage.objects
  for update to authenticated using (bucket_id = 'qr-codes' and public.is_admin())
  with check (bucket_id = 'qr-codes' and public.is_admin());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.settings from anon, authenticated;
grant select on public.settings to authenticated;
grant update (qr_image_url, payment_id, min_deposit, updated_at) on public.settings to authenticated;