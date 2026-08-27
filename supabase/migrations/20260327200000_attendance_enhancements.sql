-- Phase 2B: Attendance enhancements for manager-controlled recording
-- Additive only — preserves unique (employee_id, attendance_date) and existing RLS.

alter table public.attendance
  add column if not exists arrival_time time,
  add column if not exists departure_time time,
  add column if not exists is_demo boolean not null default false;

comment on column public.attendance.arrival_time is 'Optional recorded arrival time (manager-entered; not a biometric clock)';
comment on column public.attendance.departure_time is 'Optional recorded departure time (manager-entered; not a biometric clock)';
comment on column public.attendance.is_demo is 'True for fictional demonstration attendance records';

create index if not exists attendance_status_idx on public.attendance (status);
create index if not exists attendance_is_demo_idx on public.attendance (is_demo);
create index if not exists attendance_date_status_idx on public.attendance (attendance_date, status);

drop trigger if exists attendance_set_updated_at on public.attendance;
create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

-- Seed a few demonstration attendance rows for known demo employee codes (if present).
-- Dates are relative to migration apply day so demos remain useful.
insert into public.attendance (
  employee_id,
  attendance_date,
  status,
  arrival_time,
  departure_time,
  notes,
  is_demo
)
select e.id, current_date - 1, 'present', time '08:55', time '17:05',
  'Demonstration attendance record — not from a live time-clock system.', true
from public.employees e
where e.employee_code = 'EMP-1001'
  and e.is_demo = true
on conflict (employee_id, attendance_date) do nothing;

insert into public.attendance (
  employee_id,
  attendance_date,
  status,
  arrival_time,
  departure_time,
  notes,
  is_demo
)
select e.id, current_date - 1, 'late', time '09:40', time '17:10',
  'Demonstration attendance record — arrived after opening.', true
from public.employees e
where e.employee_code = 'EMP-1002'
  and e.is_demo = true
on conflict (employee_id, attendance_date) do nothing;

insert into public.attendance (
  employee_id,
  attendance_date,
  status,
  arrival_time,
  departure_time,
  notes,
  is_demo
)
select e.id, current_date - 1, 'absent', null, null,
  'Demonstration attendance record — marked absent by manager.', true
from public.employees e
where e.employee_code = 'EMP-1004'
  and e.is_demo = true
on conflict (employee_id, attendance_date) do nothing;

insert into public.attendance (
  employee_id,
  attendance_date,
  status,
  arrival_time,
  departure_time,
  notes,
  is_demo
)
select e.id, current_date - 1, 'on_leave', null, null,
  'Demonstration attendance record — manager marked on leave.', true
from public.employees e
where e.employee_code = 'EMP-1003'
  and e.is_demo = true
on conflict (employee_id, attendance_date) do nothing;
