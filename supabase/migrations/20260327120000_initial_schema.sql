-- Ekem Pharmacy Manager Control Centre — initial schema + RLS
-- Phase 1: structure only. No seed / pharmacy demo rows.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('manager', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'manager',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  full_name text not null,
  position text,
  department text,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'inactive', 'archived')),
  start_date date,
  contact_number text,
  email text,
  profile_photo_url text,
  emergency_contact_name text,
  emergency_contact_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index employees_status_idx on public.employees (employment_status);
create index employees_full_name_idx on public.employees (full_name);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text,
  reference_code text,
  notes text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index employee_documents_employee_idx on public.employee_documents (employee_id);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  attendance_date date not null,
  status text not null
    check (status in ('present', 'absent', 'late', 'on_leave')),
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, attendance_date)
);

create index attendance_date_idx on public.attendance (attendance_date);
create index attendance_employee_idx on public.attendance (employee_id);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  leave_type text not null
    check (leave_type in ('annual', 'sick', 'family_responsibility', 'other')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  start_date date not null,
  end_date date not null,
  days_count numeric(5, 1) not null check (days_count > 0),
  notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index leave_requests_status_idx on public.leave_requests (status);
create index leave_requests_employee_idx on public.leave_requests (employee_id);

create table public.training_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  training_name text not null,
  provider text,
  training_date date,
  expiry_date date,
  certificate_reference text,
  status text not null default 'completed'
    check (status in ('scheduled', 'completed', 'expired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_records_employee_idx on public.training_records (employee_id);
create index training_records_expiry_idx on public.training_records (expiry_date);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_employee_id uuid references public.employees (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  due_date date,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'completed', 'overdue')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_status_idx on public.tasks (status);
create index tasks_assigned_idx on public.tasks (assigned_employee_id);

create table public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

create index task_activity_task_idx on public.task_activity (task_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  link_path text,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- Clearly separated demonstration pharmacy tables (structure only; empty in Phase 1)
create table public.demo_sales (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  period text not null check (period in ('day', 'week', 'month')),
  amount numeric(12, 2) not null default 0,
  transaction_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.demo_prescriptions (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  processed_count integer not null default 0,
  pending_count integer not null default 0,
  completed_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.demo_inventory (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  sku text,
  quantity_on_hand integer not null default 0,
  minimum_level integer not null default 0,
  stock_value numeric(12, 2) not null default 0,
  expiry_date date,
  created_at timestamptz not null default now()
);

create table public.demo_suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  outstanding_orders integer not null default 0,
  pending_deliveries integer not null default 0,
  outstanding_invoices integer not null default 0,
  created_at timestamptz not null default now()
);

-- Auth helpers
create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'manager'), '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'manager')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.employee_documents enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.training_records enable row level security;
alter table public.tasks enable row level security;
alter table public.task_activity enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.demo_sales enable row level security;
alter table public.demo_prescriptions enable row level security;
alter table public.demo_inventory enable row level security;
alter table public.demo_suppliers enable row level security;

-- Profiles: users can read/update their own row; managers can read all
create policy "profiles_select_own_or_manager"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_manager());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Manager-scoped access for operational tables
create policy "employees_manager_all"
  on public.employees for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "employee_documents_manager_all"
  on public.employee_documents for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "attendance_manager_all"
  on public.attendance for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "leave_requests_manager_all"
  on public.leave_requests for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "training_records_manager_all"
  on public.training_records for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "tasks_manager_all"
  on public.tasks for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "task_activity_manager_all"
  on public.task_activity for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "notifications_own"
  on public.notifications for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "audit_logs_manager_select"
  on public.audit_logs for select
  to authenticated
  using (public.is_manager());

create policy "audit_logs_manager_insert"
  on public.audit_logs for insert
  to authenticated
  with check (public.is_manager());

-- Demo pharmacy tables: managers may read; writes reserved for later controlled seeding
create policy "demo_sales_manager_select"
  on public.demo_sales for select
  to authenticated
  using (public.is_manager());

create policy "demo_prescriptions_manager_select"
  on public.demo_prescriptions for select
  to authenticated
  using (public.is_manager());

create policy "demo_inventory_manager_select"
  on public.demo_inventory for select
  to authenticated
  using (public.is_manager());

create policy "demo_suppliers_manager_select"
  on public.demo_suppliers for select
  to authenticated
  using (public.is_manager());
