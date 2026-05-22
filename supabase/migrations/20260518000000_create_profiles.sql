-- 사용자 profile + subscription 상태. auth.users 1:1.
-- prod에는 이미 존재 (Supabase Studio 수동 생성). 본 파일은 reverse engineer로
-- 신규 환경에서도 동일 schema가 생성되도록 보장 (schema drift 해소).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  premium_until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: 본인 profile만 select·update (plan/premium_until은 service_role만 변경 가능하도록 별도 가드).
-- (select auth.uid())는 P4-P1: initplan 캐싱으로 성능 향상.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- handle_new_user 트리거: auth.users 신규 row → profile 자동 생성.
-- on conflict (id) do nothing: 동일 user_id 재실행 시(예: 마이그레이션 재적용) 충돌 방지.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on table public.profiles is
  '사용자 profile + subscription. plan/premium_until은 service_role webhook (Toss 통합)에서만 변경.';
