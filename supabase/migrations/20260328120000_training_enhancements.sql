-- Phase 2E: Training management schema enhancements
-- Management status is derived from dates in the app; stored status mirrors derivation on write.

update public.training_records
set status = case
  when status = 'scheduled' then 'due'
  when status = 'completed' then 'valid'
  else status
end;

alter table public.training_records
  drop constraint if exists training_records_status_check;

alter table public.training_records
  add constraint training_records_status_check
  check (status in ('valid', 'due', 'expiring_soon', 'expired'));

alter table public.training_records
  add column if not exists is_demo boolean not null default false;

comment on column public.training_records.is_demo is
  'True for fictional demonstration training records — not real Ekem training';

create index if not exists training_records_is_demo_idx on public.training_records (is_demo);
create index if not exists training_records_training_date_idx on public.training_records (training_date);

drop trigger if exists training_records_set_updated_at on public.training_records;
create trigger training_records_set_updated_at
  before update on public.training_records
  for each row execute function public.set_updated_at();

insert into public.training_records (
  employee_id, training_name, provider, training_date, expiry_date,
  certificate_reference, status, notes, is_demo
)
select
  e.id,
  'First Aid Level 1',
  'Demo Safety Training',
  current_date - 180,
  current_date + 335,
  'FA-DEMO-1001',
  'valid',
  'Demonstration valid training with future expiry.',
  true
from public.employees e
where e.employee_code = 'EMP-1001' and e.is_demo = true
  and not exists (
    select 1 from public.training_records tr
    where tr.training_name = 'First Aid Level 1' and tr.is_demo = true
  );

insert into public.training_records (
  employee_id, training_name, provider, training_date, expiry_date,
  certificate_reference, status, notes, is_demo
)
select
  e.id,
  'Cold Chain Compliance',
  'Demo Pharma Academy',
  current_date - 350,
  current_date + 14,
  'CCC-DEMO-1002',
  'expiring_soon',
  'Demonstration training expiring within 30 days.',
  true
from public.employees e
where e.employee_code = 'EMP-1002' and e.is_demo = true
  and not exists (
    select 1 from public.training_records tr
    where tr.training_name = 'Cold Chain Compliance' and tr.is_demo = true
  );

insert into public.training_records (
  employee_id, training_name, provider, training_date, expiry_date,
  certificate_reference, status, notes, is_demo
)
select
  e.id,
  'Good Pharmacy Practice',
  'Demo Regulatory Institute',
  current_date - 400,
  current_date - 45,
  'GPP-DEMO-1003',
  'expired',
  'Demonstration expired training certificate.',
  true
from public.employees e
where e.employee_code = 'EMP-1003' and e.is_demo = true
  and not exists (
    select 1 from public.training_records tr
    where tr.training_name = 'Good Pharmacy Practice' and tr.is_demo = true
  );

insert into public.training_records (
  employee_id, training_name, provider, training_date, expiry_date,
  certificate_reference, status, notes, is_demo
)
select
  e.id,
  'Responsible Pharmacist Update',
  'Demo Professional Board',
  null,
  current_date + 90,
  null,
  'due',
  'Demonstration training not yet completed (no training date).',
  true
from public.employees e
where e.employee_code = 'EMP-1004' and e.is_demo = true
  and not exists (
    select 1 from public.training_records tr
    where tr.training_name = 'Responsible Pharmacist Update' and tr.is_demo = true
  );

insert into public.training_records (
  employee_id, training_name, provider, training_date, expiry_date,
  certificate_reference, status, notes, is_demo
)
select
  e.id,
  'Pharmacy Induction',
  'Demo Internal Training',
  current_date - 730,
  null,
  'IND-DEMO-1002',
  'valid',
  'Demonstration completed training with no expiry date.',
  true
from public.employees e
where e.employee_code = 'EMP-1002' and e.is_demo = true
  and not exists (
    select 1 from public.training_records tr
    where tr.training_name = 'Pharmacy Induction' and tr.is_demo = true
  );

insert into public.training_records (
  employee_id, training_name, provider, training_date, expiry_date,
  certificate_reference, status, notes, is_demo
)
select
  e.id,
  'Cashier Compliance Refresher',
  'Demo Retail Academy',
  current_date - 500,
  current_date - 120,
  'CCR-DEMO-1005',
  'expired',
  'Demonstration historical training for inactive employee.',
  true
from public.employees e
where e.employee_code = 'EMP-1005' and e.is_demo = true
  and not exists (
    select 1 from public.training_records tr
    where tr.training_name = 'Cashier Compliance Refresher' and tr.is_demo = true
  );
