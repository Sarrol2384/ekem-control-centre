-- Purge fictional demonstration business data from the live Ekem database.
-- Local browser demo mode (localStorage) is unaffected.
-- Demo seed migrations remain in history for development reference.

-- Child records first (respecting foreign keys)
delete from public.tasks where is_demo = true;
delete from public.attendance where is_demo = true;
delete from public.leave_requests where is_demo = true;
delete from public.training_records where is_demo = true;
delete from public.employee_documents where is_demo = true;

-- Fictional demonstration employees (EMP-1001 … EMP-1005)
delete from public.employees where is_demo = true;

-- Demonstration pharmacy metric tables (structure retained, rows cleared)
truncate table public.demo_sales;
truncate table public.demo_prescriptions;
truncate table public.demo_inventory;
truncate table public.demo_suppliers;
