-- Phase 2D: Task management schema enhancements
-- Overdue is calculated in the app; remove stored overdue status.

update public.tasks
set status = 'in_progress'
where status = 'overdue';

alter table public.tasks
  drop constraint if exists tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'completed'));

alter table public.tasks
  add column if not exists is_demo boolean not null default false;

comment on column public.tasks.is_demo is
  'True for fictional demonstration task records — not real Ekem tasks';

create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_is_demo_idx on public.tasks (is_demo);
create index if not exists tasks_priority_idx on public.tasks (priority);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

insert into public.tasks (
  title, description, assigned_employee_id, due_date, priority, status, completed_at, is_demo
)
select
  'Complete weekly stock count',
  'Demonstration task: reconcile store inventory with system counts.',
  e.id,
  current_date + 2,
  'medium',
  'in_progress',
  null,
  true
from public.employees e
where e.employee_code = 'EMP-1004' and e.is_demo = true
  and not exists (
    select 1 from public.tasks t
    where t.title = 'Complete weekly stock count' and t.is_demo = true
  );

insert into public.tasks (
  title, description, assigned_employee_id, due_date, priority, status, completed_at, is_demo
)
select
  'Check refrigerator temperature records',
  'Demonstration task: verify cold-chain temperature logs for the past week.',
  e.id,
  current_date - 1,
  'high',
  'todo',
  null,
  true
from public.employees e
where e.employee_code = 'EMP-1002' and e.is_demo = true
  and not exists (
    select 1 from public.tasks t
    where t.title = 'Check refrigerator temperature records' and t.is_demo = true
  );

insert into public.tasks (
  title, description, assigned_employee_id, due_date, priority, status, completed_at, is_demo
)
select
  'Review outstanding supplier documentation',
  'Demonstration task: follow up on missing delivery notes and invoices.',
  e.id,
  current_date - 3,
  'critical',
  'todo',
  null,
  true
from public.employees e
where e.employee_code = 'EMP-1003' and e.is_demo = true
  and not exists (
    select 1 from public.tasks t
    where t.title = 'Review outstanding supplier documentation' and t.is_demo = true
  );

insert into public.tasks (
  title, description, assigned_employee_id, due_date, priority, status, completed_at, is_demo
)
select
  'Prepare weekend roster',
  'Demonstration task: draft Saturday staffing coverage.',
  e.id,
  current_date - 7,
  'low',
  'completed',
  now() - interval '2 days',
  true
from public.employees e
where e.employee_code = 'EMP-1002' and e.is_demo = true
  and not exists (
    select 1 from public.tasks t
    where t.title = 'Prepare weekend roster' and t.is_demo = true
  );

insert into public.tasks (
  title, description, assigned_employee_id, due_date, priority, status, completed_at, is_demo
)
select
  'Update staff training records',
  'Demonstration task: confirm training expiry dates are current.',
  e.id,
  current_date + 7,
  'medium',
  'todo',
  null,
  true
from public.employees e
where e.employee_code = 'EMP-1001' and e.is_demo = true
  and not exists (
    select 1 from public.tasks t
    where t.title = 'Update staff training records' and t.is_demo = true
  );

insert into public.tasks (
  title, description, assigned_employee_id, due_date, priority, status, completed_at, is_demo
)
select
  'Archive front-shop promotional materials',
  'Demonstration task: historical record assigned before employee became inactive.',
  e.id,
  current_date - 14,
  'low',
  'completed',
  now() - interval '10 days',
  true
from public.employees e
where e.employee_code = 'EMP-1005' and e.is_demo = true
  and not exists (
    select 1 from public.tasks t
    where t.title = 'Archive front-shop promotional materials' and t.is_demo = true
  );
