# EKEM PHARMACY — MANAGER CONTROL CENTRE
## Cursor Master Development Prompt
### Version 1.0

---

# 1. YOUR ROLE

You are the primary AI software engineering agent for this project.

Build a professional, production-quality web application called:

**Ekem Pharmacy — Manager Control Centre**

The application is being developed by VonWillingh Online as a demonstration and potential future pharmacy-management product.

The intended first user is a pharmacy manager.

The goal is to give the manager one central place to understand what is happening in the pharmacy and what requires attention.

You must behave as a senior full-stack engineer, product architect, UI/UX designer, database engineer, security engineer, and QA engineer.

Do not blindly generate code.

Inspect the existing project before making changes.

Make sensible technical decisions where requirements are not explicitly specified.

---

# 2. IMPORTANT PRODUCT CONTEXT

This application is initially being demonstrated to Ekem Pharmacy.

IMPORTANT:

The developer does NOT yet know:

- which POS system Ekem uses
- which pharmacy/dispensing system Ekem uses
- which stock/inventory system Ekem uses
- which accounting system Ekem uses
- whether any of these systems expose APIs
- whether any of these systems provide database access
- whether they provide CSV/Excel/JSON/XML exports
- whether real-time integration is possible

Therefore:

**DO NOT invent integrations.**

**DO NOT claim that the application is connected to Ekem's real systems.**

The initial pharmacy-related figures must use clearly identified DEMONSTRATION DATA.

The architecture must, however, be designed so that real integrations can be added later.

---

# 3. PRIMARY PRODUCT PRINCIPLE

The system is NOT initially intended to replace Ekem's existing pharmacy, POS, dispensing, stock or accounting systems.

It is a:

**MANAGER CONTROL CENTRE**

It should eventually sit above existing systems and consolidate important management information.

Conceptually:

Existing Pharmacy Systems
        ↓
Integration Layer
        ↓
Manager Control Centre
        ↓
Manager decisions / actions

The integration layer must remain modular.

---

# 4. TECHNOLOGY

Use the existing project stack if already established.

If the project is new, use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Authentication
- Responsive modern web UI

Do not introduce unnecessary frameworks or dependencies.

Before installing packages, inspect the existing package configuration.

Reuse existing components and utilities where appropriate.

---

# 5. DEVELOPMENT RULES

## NEVER:

- overwrite working functionality unnecessarily
- rewrite the entire project to solve a small problem
- create fake integrations
- hard-code business data into UI components
- expose secrets
- put API keys in frontend code
- use fake authentication
- create unnecessary dependencies
- create duplicate components
- leave broken navigation
- leave obvious console errors
- claim something works when it does not

## ALWAYS:

- inspect before changing
- use TypeScript properly
- keep components modular
- separate UI from business logic
- use database-backed data where appropriate
- use environment variables for secrets
- validate inputs
- handle loading states
- handle empty states
- handle errors
- make interfaces responsive
- test important workflows
- keep accessibility in mind

---

# 6. PRODUCT STATUS

This is initially a:

**WORKING DEMONSTRATION / PROTOTYPE**

It must feel like a real application.

However, pharmacy operational data is demonstration data until actual Ekem systems have been identified and integration feasibility has been established.

Display an unobtrusive but clear indicator such as:

**DEMO DATA — Ekem systems not yet connected**

for pharmacy metrics that are not actually connected.

Do NOT put this warning on every single element.

---

# 7. APPLICATION STRUCTURE

Create the following primary navigation:

1. Dashboard
2. Staff
3. Attendance
4. Leave
5. Tasks
6. Training
7. Documents
8. Pharmacy Overview
9. Reports
10. Settings

Some modules can initially contain demonstration or limited functionality, but navigation must be coherent.

---

# 8. MANAGER DASHBOARD

The Dashboard is the most important screen.

It should answer:

**"What do I need to know and what do I need to do today?"**

Create a professional pharmacy-management dashboard.

Suggested structure:

## Header

- Ekem Pharmacy
- Manager Control Centre
- Current date
- Manager name
- Notifications
- Profile/menu

## Management Summary

Cards for:

- Staff today
- Pending leave
- Open tasks
- Overdue tasks
- Training/document alerts

These should use REAL application data from Supabase where applicable.

## Pharmacy Overview

Demonstration-data cards:

- Today's sales
- Monthly sales
- Transactions
- Prescriptions
- Low-stock items
- Out-of-stock items
- Expiring stock

Clearly indicate that these are demonstration figures.

## Attention Required

Create a prominent management-alert area.

Examples:

- 2 overdue tasks
- 2 leave requests waiting for approval
- 1 training certificate expiring
- 5 stock items below minimum level

The alerts should eventually be actionable.

## Recent Activity

Show recent system activity such as:

- Leave approved
- Employee added
- Task completed
- Training record updated
- Document uploaded

---

# 9. HR / STAFF MODULE

The HR module should be the first genuinely functional business module.

Create:

## Employee List

Fields:

- Employee ID
- Full name
- Position
- Department
- Employment status
- Start date
- Contact number
- Email
- Profile photo where appropriate

Provide:

- Search
- Filter
- Sort
- Add employee
- Edit employee
- View employee
- Archive/deactivate employee

## Employee Profile

Sections:

- Personal information
- Employment information
- Emergency contact
- Attendance summary
- Leave summary
- Training
- Documents
- Tasks
- Notes

Do not store unnecessary sensitive information.

---

# 10. ATTENDANCE

Create a functional attendance module.

Initially support:

- Present
- Absent
- Late
- On leave

Allow the manager to:

- View today's attendance
- Record attendance
- Correct attendance
- View historical attendance
- Filter by employee/date

Design the database so attendance records are auditable.

Do not pretend that attendance is connected to a biometric/time-clock system.

That can be integrated later.

---

# 11. LEAVE MANAGEMENT

Create a functional leave system.

Support:

- Annual leave
- Sick leave
- Family responsibility leave
- Other leave

Allow:

- Employee/request creation
- Manager approval
- Manager rejection
- Leave status
- Start date
- End date
- Number of days
- Notes

Dashboard should display pending leave requests.

Use proper date handling.

---

# 12. TASK MANAGEMENT

Create a simple but useful manager task system.

Fields:

- Task title
- Description
- Assigned employee
- Created by
- Due date
- Priority
- Status
- Created date
- Completed date

Statuses:

- To Do
- In Progress
- Completed
- Overdue

Priorities:

- Low
- Medium
- High
- Critical

Dashboard should calculate:

- Open tasks
- Completed tasks
- Overdue tasks

---

# 13. TRAINING

Create a training-record module.

Fields:

- Employee
- Training name
- Training provider
- Training date
- Expiry date
- Certificate/reference
- Status
- Notes

Dashboard should identify:

- Training due
- Training completed
- Certificates expiring soon

---

# 14. DOCUMENT MANAGEMENT

Create a basic employee document system.

Examples:

- ID/document reference
- Employment documents
- Certificates
- Training certificates
- Other HR documents

Do not expose documents to unauthorized users.

Use Supabase Storage if appropriate.

Implement appropriate access controls.

---

# 15. PHARMACY OVERVIEW

Create a pharmacy overview section using DEMONSTRATION DATA.

Include:

### Sales

- Today's sales
- Weekly sales
- Monthly sales
- Transactions
- Average transaction value

### Prescriptions

- Processed
- Pending
- Completed

### Stock

- Total products
- Low stock
- Out of stock
- Expiring
- Stock value

### Suppliers

- Outstanding orders
- Pending deliveries
- Outstanding invoices

These figures are NOT Ekem's real figures.

Use a clean "Demo Data" indicator.

---

# 16. INTEGRATION-READY ARCHITECTURE

Do not integrate with any external pharmacy system yet.

Instead create a clean architecture that allows future adapters.

Conceptually:

/integrations
    /pos
    /dispensing
    /inventory
    /accounting

Use interfaces/abstractions where appropriate.

The future integration layer should be able to support:

- API
- Webhooks
- Database connection
- Scheduled imports
- CSV
- Excel
- JSON
- XML

Do not implement these until the actual Ekem systems are identified.

Create documentation explaining where future integrations will connect.

---

# 17. DATABASE

Use Supabase/PostgreSQL.

Create sensible relational tables.

At minimum consider:

- profiles
- employees
- employee_documents
- attendance
- leave_requests
- training_records
- tasks
- task_activity
- notifications
- audit_logs

For demonstration pharmacy information, use clearly separated demo tables/data where practical.

Example:

- demo_sales
- demo_prescriptions
- demo_inventory
- demo_suppliers

Do not mix fake pharmacy data with future production data without clear separation.

---

# 18. SECURITY

Implement proper Supabase Row Level Security.

Managers should only see data they are authorized to access.

Do not rely only on frontend restrictions.

Database-level security is required.

Do not expose service-role keys in the browser.

Use audit logging for important manager actions where appropriate.

---

# 19. UI / UX

The interface should look like a modern professional business application.

Characteristics:

- clean
- spacious
- professional
- easy for a non-technical pharmacy manager
- desktop-first but responsive
- clear hierarchy
- strong typography
- simple navigation
- useful status indicators
- minimal visual clutter

Avoid excessive animations.

Avoid unnecessary gradients.

Avoid making it look like a generic developer dashboard.

The user should immediately understand:

**What is happening?**

**What requires attention?**

**What should I do next?**

---

# 20. DEMO EXPERIENCE

The application must be impressive enough to demonstrate to a pharmacy manager.

A manager should be able to:

1. Log in
2. See the dashboard
3. See staff status
4. Add/edit an employee
5. Record attendance
6. Create a leave request
7. Approve/reject leave
8. Create a task
9. Complete a task
10. Add training information
11. See alerts change based on the underlying data

This is more important than building many superficial screens.

---

# 21. DEMONSTRATION DATA

Create realistic but obviously fictional demonstration data.

Do NOT use real Ekem employee/customer/patient data.

Use fictional employees such as:

- Thandi Mokoena
- Jason Adams
- Lerato Williams
- Michael Jacobs
- Nadia Petersen

Do not imply that these are actual Ekem employees.

Use realistic demonstration pharmacy numbers.

Always distinguish demo pharmacy metrics from real connected data.

---

# 22. REPORTS

Create a basic Reports section.

Initially support:

- Staff summary
- Attendance summary
- Leave summary
- Tasks summary
- Training summary
- Demonstration sales summary
- Demonstration stock summary

Reports should be visually useful and eventually exportable.

Do not overbuild this module in v1.

---

# 23. SETTINGS

Create basic settings structure.

Include:

- Pharmacy profile
- Manager profile
- User management
- Roles
- Notification preferences
- System information
- Integration status

Integration status should eventually show something like:

POS
**Not Connected**

Dispensing
**Not Connected**

Inventory
**Not Connected**

Accounting
**Not Connected**

This reinforces the real-world integration concept.

---

# 24. FUTURE PRODUCT DIRECTION

Do not implement these unless explicitly requested.

Future possibilities include:

- Live POS integration
- Live stock integration
- Dispensing integration
- Accounting integration
- Automated management reports
- AI management assistant
- Compliance monitoring
- Supplier management
- Customer analytics
- Family Health Vault integration
- EMOS integration

The current architecture should not prevent these.

---

# 25. IMPORTANT PRODUCT LANGUAGE

The system should never tell the user:

"Your POS is connected"

unless an actual integration exists.

Instead use:

"Demo Data"

"Not Connected"

"Integration Required"

or similar wording.

The future product pitch is:

**"Your existing pharmacy systems remain in place. The Manager Control Centre brings the information you need into one place."**

---

# 26. DEVELOPMENT PROCESS

Follow this sequence.

## STEP 1 — INSPECT

Before changing anything:

- inspect project structure
- inspect package.json
- inspect existing routes
- inspect existing components
- inspect Supabase configuration
- inspect environment variables
- inspect existing database schema
- inspect existing authentication
- inspect existing UI

Do not assume the project is empty.

## STEP 2 — PLAN

Determine what already exists and what must be added.

## STEP 3 — FOUNDATION

Implement:

- application shell
- navigation
- authentication
- layout
- Supabase connection
- database foundation
- role structure

## STEP 4 — HR

Implement:

- Staff
- Attendance
- Leave
- Tasks
- Training
- Documents

## STEP 5 — DASHBOARD

Connect the dashboard to the functional HR modules.

## STEP 6 — DEMO PHARMACY DATA

Add clearly labelled demonstration pharmacy metrics.

## STEP 7 — POLISH

Improve:

- responsiveness
- error handling
- loading states
- empty states
- accessibility
- visual consistency
- validation

## STEP 8 — TEST

Run:

- build
- lint
- tests where available

Fix errors before declaring completion.

---

# 27. WORKING STYLE

Work incrementally.

Do NOT attempt to build the entire application in one giant operation.

After each significant phase:

1. implement
2. inspect
3. test
4. fix
5. summarize what changed
6. identify the next logical step

Do not ask unnecessary questions when a sensible decision can be made.

However, STOP and ask before making decisions that could materially affect:

- database architecture
- authentication/security
- destructive migrations
- external integrations
- production deployment
- major technology changes

---

# 28. DEFINITION OF DONE FOR V1

V1 is complete when:

- application starts successfully
- authentication works
- dashboard works
- navigation works
- employee management works
- attendance works
- leave management works
- tasks work
- training works
- documents work at a basic level
- dashboard reflects HR data
- demo pharmacy data is clearly identified
- no fake integrations exist
- Supabase security is implemented appropriately
- application builds successfully
- major console errors are resolved
- responsive layout works
- the application is suitable for a live demonstration

---

# 29. FIRST TASK

DO NOT immediately build everything.

First inspect the existing project.

Then provide a concise assessment:

1. What currently exists
2. What technology is being used
3. What can be reused
4. What is missing
5. Recommended implementation sequence
6. Any important risks

After the assessment, begin implementing the foundation.

Build the application incrementally according to this specification.

---

# END OF MASTER PROMPT