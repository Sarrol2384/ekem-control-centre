-- Phase 2C: Leave management schema enhancements
-- Additive — extends leave_requests status to include cancelled; adds demo flag.

alter table public.leave_requests
  drop constraint if exists leave_requests_status_check;

alter table public.leave_requests
  add constraint leave_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled'));

alter table public.leave_requests
  add column if not exists is_demo boolean not null default false;

comment on column public.leave_requests.is_demo is
  'True for fictional demonstration leave records — not real Ekem leave';

create index if not exists leave_requests_date_range_idx
  on public.leave_requests (start_date, end_date);

create index if not exists leave_requests_is_demo_idx
  on public.leave_requests (is_demo);

drop trigger if exists leave_requests_set_updated_at on public.leave_requests;
create trigger leave_requests_set_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

-- Demonstration leave rows for known demo employee codes (if present).
insert into public.leave_requests (
  employee_id, leave_type, status, start_date, end_date, days_count, notes, is_demo
)
select e.id, 'annual', 'pending', current_date + 14, current_date + 18, 5,
  'Demonstration pending annual leave request.', true
from public.employees e
where e.employee_code = 'EMP-1001' and e.is_demo = true
  and not exists (
    select 1 from public.leave_requests lr
    where lr.employee_id = e.id and lr.notes = 'Demonstration pending annual leave request.'
  );

insert into public.leave_requests (
  employee_id, leave_type, status, start_date, end_date, days_count, notes,
  reviewed_at, is_demo
)
select e.id, 'sick', 'approved', current_date, current_date + 1, 2,
  'Demonstration approved sick leave covering today.', now(), true
from public.employees e
where e.employee_code = 'EMP-1002' and e.is_demo = true
  and not exists (
    select 1 from public.leave_requests lr
    where lr.employee_id = e.id and lr.notes = 'Demonstration approved sick leave covering today.'
  );

insert into public.leave_requests (
  employee_id, leave_type, status, start_date, end_date, days_count, notes,
  reviewed_at, is_demo
)
select e.id, 'family_responsibility', 'rejected', current_date - 20, current_date - 19, 2,
  'Demonstration rejected leave request.', now(), true
from public.employees e
where e.employee_code = 'EMP-1003' and e.is_demo = true
  and not exists (
    select 1 from public.leave_requests lr
    where lr.employee_id = e.id and lr.notes = 'Demonstration rejected leave request.'
  );

insert into public.leave_requests (
  employee_id, leave_type, status, start_date, end_date, days_count, notes,
  reviewed_at, is_demo
)
select e.id, 'annual', 'approved', current_date + 30, current_date + 34, 5,
  'Demonstration upcoming approved annual leave.', now(), true
from public.employees e
where e.employee_code = 'EMP-1004' and e.is_demo = true
  and not exists (
    select 1 from public.leave_requests lr
    where lr.employee_id = e.id and lr.notes = 'Demonstration upcoming approved annual leave.'
  );
