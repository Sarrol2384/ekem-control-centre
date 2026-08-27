-- Phase 2A: Staff module schema corrections + fictional demonstration employees
-- Additive only — does not redesign existing employees table.

alter table public.employees
  add column if not exists address text,
  add column if not exists emergency_contact_relationship text,
  add column if not exists is_demo boolean not null default false;

comment on column public.employees.address is 'Optional residential or postal address for HR contact purposes';
comment on column public.employees.emergency_contact_relationship is 'Relationship of emergency contact to the employee';
comment on column public.employees.is_demo is 'True for fictional demonstration records — not real Ekem employees';

create index if not exists employees_is_demo_idx on public.employees (is_demo);
create index if not exists employees_department_idx on public.employees (department);
create index if not exists employees_code_idx on public.employees (employee_code);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

-- Fictional demonstration staff only. Do not treat as real Ekem employees.
insert into public.employees (
  employee_code,
  full_name,
  position,
  department,
  employment_status,
  start_date,
  contact_number,
  email,
  address,
  emergency_contact_name,
  emergency_contact_relationship,
  emergency_contact_number,
  notes,
  is_demo
)
values
  (
    'EMP-1001',
    'Thandi Mokoena',
    'Pharmacist',
    'Dispensary',
    'active',
    '2021-03-15',
    '082 555 0101',
    'thandi.mokoena@example.com',
    '14 Oak Avenue, Cape Town',
    'Sipho Mokoena',
    'Spouse',
    '082 555 0102',
    'Demonstration employee record for Manager Control Centre demos.',
    true
  ),
  (
    'EMP-1002',
    'Jason Adams',
    'Pharmacy Assistant',
    'Front Shop',
    'active',
    '2022-07-01',
    '083 555 0202',
    'jason.adams@example.com',
    '88 Harbour Road, Cape Town',
    'Michelle Adams',
    'Sister',
    '083 555 0203',
    'Demonstration employee record for Manager Control Centre demos.',
    true
  ),
  (
    'EMP-1003',
    'Lerato Williams',
    'Dispensary Manager',
    'Dispensary',
    'active',
    '2019-11-12',
    '084 555 0303',
    'lerato.williams@example.com',
    '5 Protea Street, Bellville',
    'Johan Williams',
    'Partner',
    '084 555 0304',
    'Demonstration employee record for Manager Control Centre demos.',
    true
  ),
  (
    'EMP-1004',
    'Michael Jacobs',
    'Stock Controller',
    'Stores',
    'active',
    '2020-05-20',
    '081 555 0404',
    'michael.jacobs@example.com',
    '22 Berg Street, Paarl',
    'Anna Jacobs',
    'Mother',
    '081 555 0405',
    'Demonstration employee record for Manager Control Centre demos.',
    true
  ),
  (
    'EMP-1005',
    'Nadia Petersen',
    'Cashier',
    'Front Shop',
    'inactive',
    '2023-01-09',
    '072 555 0505',
    'nadia.petersen@example.com',
    null,
    'David Petersen',
    'Father',
    '072 555 0506',
    'Demonstration employee record (inactive) for Manager Control Centre demos.',
    true
  )
on conflict (employee_code) do nothing;
