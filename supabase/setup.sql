-- GovPrompt Enterprise baseline schema. Run in an empty Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.packages (
  id text primary key, name text not null, price_thb integer not null check (price_thb >= 0),
  description text not null default '', max_uses integer not null check (max_uses > 0),
  expiry_days integer not null check (expiry_days > 0), allowed_tools jsonb not null default '[]'::jsonb,
  active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), request_ref text not null unique,
  package_id text not null references public.packages(id), package_name text not null, price_thb integer not null,
  full_name text not null, organization text not null, phone text not null, email text not null, contact text not null,
  customer_note text not null default '', accepted_terms boolean not null default false,
  accepted_privacy boolean not null default false, terms_version text not null default '',
  privacy_version text not null default '', ip_hash text not null default '', user_agent text not null default '',
  status text not null default 'pending'
    check (status in ('pending','contacted','awaiting_payment','proof_submitted','paid','completed','cancelled')),
  payment_proof_path text, payment_note text not null default '', proof_submitted_at timestamptz,
  paid_at timestamptz, activated_at timestamptz, submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(), code_hash text not null unique, masked_code text not null,
  owner_name text not null, customer_email text not null default '', order_id text not null,
  package_id text not null references public.packages(id), package_name text not null,
  allowed_tools jsonb not null default '[]'::jsonb, active boolean not null default true,
  uses integer not null default 0, max_uses integer not null check (max_uses > 0),
  created_at timestamptz not null default now(), expires_at timestamptz not null, last_used_at timestamptz
);
create table if not exists public.usage_logs (
  id bigint generated always as identity primary key, code_id uuid references public.access_codes(id),
  package_id text not null default '', tool_id text not null, ip_hash text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.rate_limits (
  key text primary key, count integer not null default 0, window_started_at timestamptz not null default now()
);
create table if not exists public.notification_logs (
  id bigint generated always as identity primary key, channel text not null, event text not null,
  recipient text not null default '', status text not null, detail text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key, actor_type text not null, actor_ref text not null default '',
  action text not null, entity_type text not null default '', entity_id text not null default '',
  details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

insert into public.packages (id,name,price_thb,description,max_uses,expiry_days,allowed_tools,active,sort_order)
values
  ('starter-222','Starter 222',222,'Starter access package',60,180,'["official-letter","memo","meeting-invite","executive-summary","project-outline","public-news"]'::jsonb,true,10),
  ('professional-599','Professional 599',599,'Professional access package',250,365,'["official-letter","memo","meeting-invite","inquiry-letter","executive-summary","project-outline","risk-analysis","public-news","speech","document-review"]'::jsonb,true,20),
  ('agency-999','Agency 999',999,'Agency access package',800,365,'["official-letter","memo","meeting-invite","inquiry-letter","executive-summary","project-outline","risk-analysis","public-news","speech","document-review"]'::jsonb,true,30)
on conflict (id) do update set name=excluded.name,price_thb=excluded.price_thb,
description=excluded.description,max_uses=excluded.max_uses,expiry_days=excluded.expiry_days,
allowed_tools=excluded.allowed_tools,active=excluded.active,sort_order=excluded.sort_order,updated_at=now();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('payment-proofs','payment-proofs',false,2621440,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=2621440,
allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];

alter table public.packages enable row level security;
alter table public.orders enable row level security;
alter table public.access_codes enable row level security;
alter table public.usage_logs enable row level security;
alter table public.rate_limits enable row level security;
alter table public.notification_logs enable row level security;
alter table public.audit_logs enable row level security;
revoke all on table public.packages,public.orders,public.access_codes,public.usage_logs,public.rate_limits,public.notification_logs,public.audit_logs from anon,authenticated;
grant all on table public.packages,public.orders,public.access_codes,public.usage_logs,public.rate_limits,public.notification_logs,public.audit_logs to service_role;
grant usage,select on all sequences in schema public to service_role;

create or replace function public.reserve_access_use(p_code_id uuid)
returns table(code_id uuid,owner_name text,order_id text,package_id text,remaining_uses integer,expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin return query update public.access_codes as a set uses=a.uses+1,last_used_at=now()
where a.id=p_code_id and a.active=true and a.expires_at>now() and a.uses<a.max_uses
returning a.id,a.owner_name,a.order_id,a.package_id,a.max_uses-a.uses,a.expires_at; end; $$;
revoke all on function public.reserve_access_use(uuid) from public,anon,authenticated;
grant execute on function public.reserve_access_use(uuid) to service_role;

create or replace function public.consume_rate_limit(p_rate_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare current_count integer;
begin
  insert into public.rate_limits as r (key,count,window_started_at)
  values (p_rate_key,1,now())
  on conflict (key) do update set
    count=case when r.window_started_at + make_interval(secs => p_window_seconds) <= now() then 1 else r.count+1 end,
    window_started_at=case when r.window_started_at + make_interval(secs => p_window_seconds) <= now() then now() else r.window_started_at end
  returning count into current_count;
  return current_count <= p_limit;
end; $$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
