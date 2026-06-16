-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  email text not null,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now()
);

-- Projects
create table projects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  title text not null,
  sector text,
  current_phase integer not null default 1 check (current_phase between 1 and 8),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HCD Phase sessions (one per project per phase)
create table phase_sessions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  phase integer not null check (phase between 1 and 8),
  messages jsonb not null default '[]',
  canvas jsonb,
  updated_at timestamptz not null default now(),
  unique(project_id, phase)
);

-- Feedback links (shareable, no auth required)
create table feedback_links (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  token uuid not null unique default uuid_generate_v4(),
  iteration_number integer not null default 1,
  model_snapshot jsonb not null default '{}',
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Feedback responses from stakeholders (no auth required)
create table feedback_responses (
  id uuid primary key default uuid_generate_v4(),
  link_id uuid not null references feedback_links(id) on delete cascade,
  respondent_name text not null,
  respondent_role text not null,
  responses jsonb not null default '{}',
  adaptations jsonb not null default '{}',
  submitted_at timestamptz not null default now()
);

-- Synthesized model iterations
create table model_iterations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  iteration_number integer not null,
  source_responses uuid[] not null default '{}',
  synthesized_model jsonb not null default '{}',
  conflicts jsonb not null default '[]',
  consensus jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Execution plans
create table execution_plans (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  iteration_id uuid references model_iterations(id) on delete set null,
  plan jsonb not null default '{}',
  kpis jsonb not null default '[]',
  timeline jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Subscriptions
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  stripe_subscription_id text unique,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  status text not null default 'active',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────
alter table organizations enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table phase_sessions enable row level security;
alter table feedback_links enable row level security;
alter table feedback_responses enable row level security;
alter table model_iterations enable row level security;
alter table execution_plans enable row level security;
alter table subscriptions enable row level security;

-- Users can read/write their own org
create policy "Users can view their org" on organizations
  for select using (
    id = (select org_id from users where id = auth.uid())
  );

-- Users can view/edit their own user record
create policy "Users can view own record" on users
  for select using (id = auth.uid());

create policy "Users can update own record" on users
  for update using (id = auth.uid());

-- Projects: visible to users in the same org
create policy "Org members can view projects" on projects
  for select using (
    org_id = (select org_id from users where id = auth.uid())
  );

create policy "Org members can insert projects" on projects
  for insert with check (
    org_id = (select org_id from users where id = auth.uid())
  );

create policy "Org members can update projects" on projects
  for update using (
    org_id = (select org_id from users where id = auth.uid())
  );

-- Phase sessions: same as projects
create policy "Org members can manage phase sessions" on phase_sessions
  for all using (
    project_id in (
      select id from projects where org_id = (select org_id from users where id = auth.uid())
    )
  );

-- Feedback links: org members manage, public can read via token (handled in service role)
create policy "Org members can manage feedback links" on feedback_links
  for all using (
    project_id in (
      select id from projects where org_id = (select org_id from users where id = auth.uid())
    )
  );

-- Feedback responses: public insert handled via service role API route; org members can read
create policy "Org members can read responses" on feedback_responses
  for select using (
    link_id in (
      select id from feedback_links where project_id in (
        select id from projects where org_id = (select org_id from users where id = auth.uid())
      )
    )
  );

-- Model iterations and execution plans: org members only
create policy "Org members can manage iterations" on model_iterations
  for all using (
    project_id in (
      select id from projects where org_id = (select org_id from users where id = auth.uid())
    )
  );

create policy "Org members can manage execution plans" on execution_plans
  for all using (
    project_id in (
      select id from projects where org_id = (select org_id from users where id = auth.uid())
    )
  );

-- ─────────────────────────────────────────
-- Trigger: auto-create org + user on signup
-- ─────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name)
  values (coalesce(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 1)))
  returning id into new_org_id;

  insert into users (id, org_id, email, full_name, role)
  values (
    new.id,
    new_org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  insert into subscriptions (org_id) values (new_org_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
