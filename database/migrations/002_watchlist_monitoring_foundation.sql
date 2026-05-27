create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  added_by text,
  added_at timestamptz not null default now(),
  is_active boolean not null default true,
  removed_by text,
  removed_at timestamptz,
  watch_reason text,
  last_checked_at timestamptz
);

create table if not exists monitoring_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  watchlist_id uuid references watchlists(id),
  event_type text not null,
  severity text not null check (severity in ('info', 'review', 'material')),
  source_type text,
  source_id uuid,
  previous_value_json jsonb,
  new_value_json jsonb,
  detected_at timestamptz not null default now(),
  acknowledged_by text,
  acknowledged_at timestamptz
);

create unique index if not exists idx_watchlists_company_active
  on watchlists(company_id)
  where is_active = true;

create index if not exists idx_watchlists_active_added_at
  on watchlists(is_active, added_at desc);

create index if not exists idx_watchlists_company_id
  on watchlists(company_id);

create index if not exists idx_monitoring_events_company_detected
  on monitoring_events(company_id, detected_at desc);

create index if not exists idx_monitoring_events_watchlist_detected
  on monitoring_events(watchlist_id, detected_at desc);
