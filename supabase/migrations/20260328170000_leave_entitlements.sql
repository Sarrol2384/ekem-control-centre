-- Optional annual leave entitlement per employee (days per calendar year).
-- Null until the manager sets a value — no fabricated defaults.

alter table public.employees
  add column if not exists annual_leave_entitlement numeric(5,1);

comment on column public.employees.annual_leave_entitlement is
  'Annual leave allowance in calendar days per year. Null until configured by the manager.';

alter table public.employees
  alter column annual_leave_entitlement drop not null;

alter table public.employees
  alter column annual_leave_entitlement drop default;

-- Demo employees should not carry fabricated entitlements in live testing.
update public.employees
set annual_leave_entitlement = null
where is_demo = true;
