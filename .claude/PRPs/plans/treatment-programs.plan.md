# FECOS Module Plan: Treatment Programs

## Summary
A Treatment Program defines what chemicals a lease needs, at what rate, and how often.
One program per lease (only one ACTIVE at a time). Created by ADMIN, MANAGER, or ACCOUNT_REP.
Downstream modules (Dispatch, Service Visit) read from this to know what to deliver.

## Requirements
- **Who**: ADMIN + MANAGER + ACCOUNT_REP (create/edit), ACCOUNT_REP (no delete), LAB_TECH (read)
- **Trigger**: New lease needs chemical treatment defined, or existing program needs updating
- **Data**:
  - Program — lease_id, account_rep_id, status (DRAFT/ACTIVE/INACTIVE), notes, lab_sample_id (nullable)
  - Lines — product_id, rec_rate, unit, frequency (DAILY/WEEKLY/BIWEEKLY/MONTHLY), notes
- **Approval**: None
- **Mobile**: No — web only
- **Linked to**: Lease (existing), Products (existing), Users/ACCOUNT_REP (existing)
- **Constraint**: Only one ACTIVE program per lease at a time

## Out of scope (v1)
- Lab sample linkage UI (column exists, wired when lab module is built)
- Approval workflow
- Program history / versioning

## Mirror Module
Leases module for program header. Inventory transaction lines pattern for line items.

---

## Layer 1: Database

### V18__create_treatment_programs.sql
```sql
CREATE TABLE IF NOT EXISTS treatment_programs (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)     NOT NULL,
    lease_id        CHAR(36)     NOT NULL,
    account_rep_id  CHAR(36),
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    notes           TEXT,
    lab_sample_id   CHAR(36)     NULL,
    is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    created_by      CHAR(36),
    CONSTRAINT fk_tp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_tp_lease  FOREIGN KEY (lease_id)  REFERENCES leases(id)
);
```

### V19__create_treatment_program_lines.sql
```sql
CREATE TABLE IF NOT EXISTS treatment_program_lines (
    id          CHAR(36)       NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)       NOT NULL,
    program_id  CHAR(36)       NOT NULL,
    product_id  CHAR(36)       NOT NULL,
    rec_rate    DECIMAL(12,4)  NOT NULL,
    unit        VARCHAR(50)    NOT NULL,
    frequency   VARCHAR(20)    NOT NULL,
    notes       TEXT,
    is_deleted  TINYINT(1)     NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    created_by  CHAR(36),
    CONSTRAINT fk_tpl_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id),
    CONSTRAINT fk_tpl_program FOREIGN KEY (program_id) REFERENCES treatment_programs(id),
    CONSTRAINT fk_tpl_product FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## Layer 2: API

### Package: `com.fecos.programs`

| File | Notes |
|---|---|
| TreatmentProgramStatus | enum: DRAFT, ACTIVE, INACTIVE |
| TreatmentProgramFrequency | enum: DAILY, WEEKLY, BIWEEKLY, MONTHLY |
| TreatmentProgramEntity | extends TenantAwareEntity |
| TreatmentProgramRepository | search by tenant, lease, status, accountRepId |
| TreatmentProgramRequest | leaseId, accountRepId, status, notes |
| TreatmentProgramLineEntity | extends TenantAwareEntity |
| TreatmentProgramLineRepository | findByProgramIdAndIsDeletedFalse |
| TreatmentProgramLineRequest | productId, recRate, unit, frequency, notes |
| TreatmentProgramLineResponse | with productName resolved |
| TreatmentProgramResponse | with lines[], leaseName, clientName, accountRepName |
| TreatmentProgramService | CRUD + line management |
| TreatmentProgramController | /api/v1/programs |

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | /api/v1/programs | ADMIN,MANAGER,ACCOUNT_REP,LAB_TECH | List programs (paginated) |
| GET | /api/v1/programs/{id} | all above | Get one with lines |
| POST | /api/v1/programs | ADMIN,MANAGER,ACCOUNT_REP | Create program |
| PUT | /api/v1/programs/{id} | ADMIN,MANAGER,ACCOUNT_REP | Update header |
| DELETE | /api/v1/programs/{id} | ADMIN,MANAGER only | Soft delete |
| POST | /api/v1/programs/{id}/lines | ADMIN,MANAGER,ACCOUNT_REP | Add line |
| PUT | /api/v1/programs/{id}/lines/{lineId} | ADMIN,MANAGER,ACCOUNT_REP | Update line |
| DELETE | /api/v1/programs/{id}/lines/{lineId} | ADMIN,MANAGER,ACCOUNT_REP | Remove line |

### Business rules (enforced in service)
- Only one ACTIVE program per lease per tenant
- Activating a program auto-sets any existing ACTIVE program for that lease to INACTIVE

---

## Layer 3: Web

### Files to create
```
fecos-web/src/api/programs.ts
fecos-web/src/pages/tenant/ProgramsPage.tsx
```

### Files to modify
```
fecos-web/src/App.tsx           — add /programs route
fecos-web/src/layouts/AppLayout.tsx — add nav item (ADMIN, MANAGER, ACCOUNT_REP)
```

### Page layout
- **Header**: "Treatment Programs" + total count + "New Program" button
- **Filters**: search (lease name / client), status filter, account rep filter
- **Table**: Lease, Client, Account Rep, Status badge, # Products, Created date, chevron
- **Right panel (440px)**: Create / Edit program header
  - Lease (SearchableDropdown — active leases)
  - Account Rep (SearchableDropdown — users with ACCOUNT_REP role)
  - Status (DRAFT / ACTIVE / INACTIVE)
  - Notes (optional textarea)
- **Detail drawer**: Full program view
  - Header info (lease, client, account rep, status)
  - Line items table: Product, Rec Rate, Unit, Frequency, Notes, remove button
  - "Add Product" inline form at bottom of lines

### Status badges
- DRAFT — gray
- ACTIVE — emerald
- INACTIVE — amber

---

## Step-by-Step Tasks

### Layer 1
- [ ] 1.1 Write V18__create_treatment_programs.sql
- [ ] 1.2 Write V19__create_treatment_program_lines.sql
- [ ] 1.3 Start app — Flyway runs both migrations clean

### Layer 2
- [ ] 2.1 TreatmentProgramStatus + TreatmentProgramFrequency enums
- [ ] 2.2 TreatmentProgramEntity + Repository
- [ ] 2.3 TreatmentProgramLineEntity + Repository
- [ ] 2.4 Request/Response classes
- [ ] 2.5 TreatmentProgramService (program CRUD + line management)
- [ ] 2.6 TreatmentProgramController
- [ ] 2.7 mvn compile — clean

### Layer 3
- [ ] 3.1 programs.ts API file
- [ ] 3.2 ProgramsPage.tsx — table + create panel + detail drawer with lines
- [ ] 3.3 Wire into App.tsx + AppLayout.tsx
- [ ] 3.4 npm run build — zero TS errors

---

## Acceptance Criteria
- [ ] V18 + V19 migrations run clean
- [ ] Program CRUD works (create/edit/delete)
- [ ] Line items can be added, edited, removed
- [ ] Only one ACTIVE program per lease enforced
- [ ] Activating a program deactivates previous active one
- [ ] ACCOUNT_REP cannot delete programs
- [ ] LAB_TECH can only read
- [ ] Status badges display correctly
- [ ] All dropdowns use SearchableDropdown
- [ ] var(--color-primary) on all buttons/headers
- [ ] Right-side panel w-[440px]
- [ ] Zero TS build errors
