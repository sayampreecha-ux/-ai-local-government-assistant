-- Upgrade an existing GovPrompt 3.x database. Back up and test in staging first.
alter table public.orders add column if not exists package_id text;
alter table public.orders add column if not exists package_name text not null default 'Starter 222';
alter table public.orders add column if not exists price_thb integer not null default 222;
alter table public.orders add column if not exists customer_note text not null default '';
alter table public.orders add column if not exists accepted_terms boolean not null default false;
alter table public.orders add column if not exists accepted_privacy boolean not null default false;
alter table public.orders add column if not exists terms_version text not null default '';
alter table public.orders add column if not exists privacy_version text not null default '';
alter table public.orders add column if not exists ip_hash text not null default '';
alter table public.orders add column if not exists user_agent text not null default '';
alter table public.orders add column if not exists payment_proof_path text;
alter table public.orders add column if not exists payment_note text not null default '';
alter table public.orders add column if not exists proof_submitted_at timestamptz;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists activated_at timestamptz;
update public.orders set package_id='starter-222' where package_id is null;

alter table public.access_codes add column if not exists customer_email text not null default '';
alter table public.access_codes add column if not exists package_id text;
alter table public.access_codes add column if not exists package_name text not null default 'Starter 222';
alter table public.access_codes add column if not exists allowed_tools jsonb not null default '[]'::jsonb;
update public.access_codes set package_id='starter-222' where package_id is null;
alter table public.usage_logs add column if not exists package_id text not null default '';

-- The remaining idempotent tables, storage bucket, grants, and functions are
-- defined in setup.sql and may be applied after these compatibility columns.
