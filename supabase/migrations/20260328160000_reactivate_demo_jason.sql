-- Demo data correction: Jason Adams (EMP-1002) should remain active while on approved sick leave.
-- Nadia Petersen (EMP-1005) remains the inactive demonstration employee.

update public.employees
set
  employment_status = 'active',
  updated_at = now()
where employee_code = 'EMP-1002'
  and is_demo = true;
