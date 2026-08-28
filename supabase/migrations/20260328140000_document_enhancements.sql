-- Phase 2F: Document management schema and private storage
-- Employee documents use a private Supabase Storage bucket with manager-only access.

alter table public.employee_documents
  add column if not exists document_date date,
  add column if not exists expiry_date date,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists is_demo boolean not null default false;

comment on column public.employee_documents.is_demo is
  'True for fictional demonstration document metadata — not real Ekem documents';

alter table public.employee_documents
  drop constraint if exists employee_documents_type_check;

alter table public.employee_documents
  add constraint employee_documents_type_check
  check (document_type in (
    'employment_contract',
    'identification',
    'qualification',
    'professional_registration',
    'training_certificate',
    'other'
  ));

create index if not exists employee_documents_expiry_idx
  on public.employee_documents (expiry_date);

create index if not exists employee_documents_type_idx
  on public.employee_documents (document_type);

create index if not exists employee_documents_is_demo_idx
  on public.employee_documents (is_demo);

drop trigger if exists employee_documents_set_updated_at on public.employee_documents;
create trigger employee_documents_set_updated_at
  before update on public.employee_documents
  for each row execute function public.set_updated_at();

-- Private bucket — not publicly accessible; managers access via authenticated policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false;

drop policy if exists "employee_documents_storage_manager_select" on storage.objects;
drop policy if exists "employee_documents_storage_manager_insert" on storage.objects;
drop policy if exists "employee_documents_storage_manager_update" on storage.objects;
drop policy if exists "employee_documents_storage_manager_delete" on storage.objects;

create policy "employee_documents_storage_manager_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'employee-documents' and public.is_manager());

create policy "employee_documents_storage_manager_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'employee-documents' and public.is_manager());

create policy "employee_documents_storage_manager_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'employee-documents' and public.is_manager())
  with check (bucket_id = 'employee-documents' and public.is_manager());

create policy "employee_documents_storage_manager_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'employee-documents' and public.is_manager());

insert into public.employee_documents (
  employee_id, title, document_type, document_date, expiry_date,
  storage_path, reference_code, notes, is_demo
)
select
  e.id,
  'Employment Contract',
  'employment_contract',
  e.start_date,
  null,
  null,
  'DEMO-CONTRACT-1001',
  'Demonstration employment contract metadata (no file uploaded).',
  true
from public.employees e
where e.employee_code = 'EMP-1001' and e.is_demo = true
  and not exists (
    select 1 from public.employee_documents d
    where d.title = 'Employment Contract' and d.employee_id = e.id and d.is_demo = true
  );

insert into public.employee_documents (
  employee_id, title, document_type, document_date, expiry_date,
  storage_path, reference_code, notes, is_demo
)
select
  e.id,
  'First Aid Certificate',
  'training_certificate',
  current_date - 365,
  current_date + 14,
  null,
  'DEMO-FA-CERT-1002',
  'Demonstration training certificate expiring within 30 days.',
  true
from public.employees e
where e.employee_code = 'EMP-1002' and e.is_demo = true
  and not exists (
    select 1 from public.employee_documents d
    where d.title = 'First Aid Certificate' and d.employee_id = e.id and d.is_demo = true
  );

insert into public.employee_documents (
  employee_id, title, document_type, document_date, expiry_date,
  storage_path, reference_code, notes, is_demo
)
select
  e.id,
  'B.Pharm Qualification',
  'qualification',
  current_date - 2000,
  current_date - 60,
  null,
  'DEMO-QUAL-1003',
  'Demonstration expired qualification record.',
  true
from public.employees e
where e.employee_code = 'EMP-1003' and e.is_demo = true
  and not exists (
    select 1 from public.employee_documents d
    where d.title = 'B.Pharm Qualification' and d.employee_id = e.id and d.is_demo = true
  );

insert into public.employee_documents (
  employee_id, title, document_type, document_date, expiry_date,
  storage_path, reference_code, notes, is_demo
)
select
  e.id,
  'SAPC Registration',
  'professional_registration',
  current_date - 400,
  current_date + 200,
  null,
  'DEMO-REG-1004',
  'Demonstration valid professional registration.',
  true
from public.employees e
where e.employee_code = 'EMP-1004' and e.is_demo = true
  and not exists (
    select 1 from public.employee_documents d
    where d.title = 'SAPC Registration' and d.employee_id = e.id and d.is_demo = true
  );

insert into public.employee_documents (
  employee_id, title, document_type, document_date, expiry_date,
  storage_path, reference_code, notes, is_demo
)
select
  e.id,
  'National ID Copy',
  'identification',
  current_date - 100,
  null,
  null,
  'DEMO-ID-1001',
  'Demonstration identification record with no expiry date.',
  true
from public.employees e
where e.employee_code = 'EMP-1001' and e.is_demo = true
  and not exists (
    select 1 from public.employee_documents d
    where d.title = 'National ID Copy' and d.employee_id = e.id and d.is_demo = true
  );

insert into public.employee_documents (
  employee_id, title, document_type, document_date, expiry_date,
  storage_path, reference_code, notes, is_demo
)
select
  e.id,
  'Employment Contract (Archived)',
  'employment_contract',
  current_date - 900,
  current_date - 200,
  null,
  'DEMO-CONTRACT-1005',
  'Demonstration historical document for inactive employee.',
  true
from public.employees e
where e.employee_code = 'EMP-1005' and e.is_demo = true
  and not exists (
    select 1 from public.employee_documents d
    where d.title = 'Employment Contract (Archived)' and d.employee_id = e.id and d.is_demo = true
  );
