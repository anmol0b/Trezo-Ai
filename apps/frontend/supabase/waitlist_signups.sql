create table if not exists public.waitlist_signups (
  id bigint generated always as identity primary key,
  email text not null,
  source text not null default 'coming-soon',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint waitlist_signups_status_check
    check (status in ('pending', 'confirmed', 'unsubscribed'))
);

create unique index if not exists waitlist_signups_email_lower_idx
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;
