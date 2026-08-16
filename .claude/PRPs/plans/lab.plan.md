# FECOS Module Plan: Lab — Sample Management & Analysis (Module 8)

## Summary
The Lab module enables LAB_TECH users to receive physical samples brought in from field service visits, log them with auto-generated sample IDs, enter analysis results across 7 test type sections, and automatically alert Account Reps when any of 7 critical industry-standard thresholds are exceeded — within 60 seconds. All results are linked to the well → lease → client → treatment plan chain.

## Requirements
- **Who**: LAB_TECH (creates samples, enters results) + ACCOUNT_REP (receives critical alerts, views full lab reports) + ADMIN/MANAGER (read access)
- **Trigger**: Service Tech brings physical bottle to Endura's Midland lab → Lab Tech logs receipt → runs tests → enters results → alert auto-fires if critical
- **Sample types**: PRODUCED_WATER · SOLID_SCRAPING · CORROSION_COUPON
- **Sample ID format**: `SMP-YYYY-MMDD-NNNNN` — 5-digit global tenant counter (e.g. SMP-2026-0814-00047)
- **Data captured**: Sample metadata + 7 test type sections (~30 measurement fields total)
- **Calculated fields**:
  - `scaling_index` (Langelier Saturation Index, computed from Ca/Mg/Na/Cl/SO4/HCO3/Fe/pH/TDS/temp)
  - `corrosion_potential` (0–10 score from pH + Fe + DO + Cl)
- **Critical thresholds** (fixed, industry-standard):
  | Test | Threshold | Action |
  |------|-----------|--------|
  | SRB Count | > 1,000 cells/mL | Immediate bactericide alert |
  | APB Count | > 10,000 cells/mL | Immediate alert |
  | Corrosion Rate | > 5 mils/year | Increase inhibitor |
  | Scaling Index | > 2.0 | Increase scale inhibitor rate |
  | Iron (Fe) | > 50 mg/L | Scale/corrosion risk |
  | pH | < 5.5 or > 9.0 | Extreme — immediate alert |
  | Dissolved Oxygen | > 0.5 mg/L | Corrosion risk |
- **Alert**: has_critical_values flag set + async alert record written → Account Rep notified within 60s (FCM hook added now, delivery wired in Phase 3)
- **Approval flow**: None in v1
- **Mobile**: Out of scope — Service Tech mobile sample collection is Phase 3
- **Out of scope for v1**: Lab Manager PhD review step (Phase 5), per-well threshold overrides (Phase 5), trend charts (Phase 5), Raw Material QC (separate module), Finished Product QC (separate module)

## Mirror Module
Routes module — `RouteService` / `RouteController` / `routes.ts` patterns

---

## Layer 1: Database

**Files to create**:
- `fecos-api/src/main/resources/db/migration/V28__create_lab_samples.sql`
- `fecos-api/src/main/resources/db/migration/V29__create_lab_results.sql`

### V28 — lab_samples
```sql
CREATE TABLE lab_samples (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  created_at    DATETIME(6)  NOT NULL,
  updated_at    DATETIME(6)  NOT NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_by    CHAR(36),
  tenant_id     CHAR(36)     NOT NULL,

  sample_number VARCHAR(30)  NOT NULL,
  sample_type   ENUM('PRODUCED_WATER','SOLID_SCRAPING','CORROSION_COUPON') NOT NULL,
  well_id       CHAR(36)     NOT NULL,
  collected_by_id CHAR(36),
  collected_at  DATETIME,
  received_at   DATETIME     NOT NULL,
  priority      ENUM('ROUTINE','RUSH') NOT NULL DEFAULT 'ROUTINE',
  tests_requested TEXT,
  status        ENUM('RECEIVED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'RECEIVED',

  INDEX idx_lab_samples_tenant   (tenant_id),
  INDEX idx_lab_samples_well     (well_id),
  INDEX idx_lab_samples_status   (status),
  INDEX idx_lab_samples_number   (tenant_id, sample_number)
);
```

### V29 — lab_results
```sql
CREATE TABLE lab_results (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  created_at    DATETIME(6)  NOT NULL,
  updated_at    DATETIME(6)  NOT NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_by    CHAR(36),
  tenant_id     CHAR(36)     NOT NULL,

  sample_id     CHAR(36)     NOT NULL UNIQUE,
  lab_tech_id   CHAR(36),
  completed_at  DATETIME,

  -- Water Analysis (PRODUCED_WATER)
  calcium               DECIMAL(10,2),
  magnesium             DECIMAL(10,2),
  sodium                DECIMAL(10,2),
  chlorides             DECIMAL(10,2),
  sulfates              DECIMAL(10,2),
  bicarbonates          DECIMAL(10,2),
  iron                  DECIMAL(10,2),
  ph                    DECIMAL(4,2),
  tds                   DECIMAL(10,2),
  specific_gravity      DECIMAL(6,4),
  dissolved_oxygen      DECIMAL(6,3),
  scaling_index         DECIMAL(6,3),   -- computed LSI
  corrosion_potential   DECIMAL(4,1),   -- computed 0-10 score

  -- Bacteriological (PRODUCED_WATER)
  srb_count                   DECIMAL(12,0),
  apb_count                   DECIMAL(12,0),
  treatment_effectiveness     DECIMAL(5,2),

  -- Scale Analysis (SOLID_SCRAPING)
  scale_type       VARCHAR(100),
  scale_severity   ENUM('LIGHT','MODERATE','SEVERE'),
  scale_remediation TEXT,

  -- Paraffin (any type, optional)
  pour_point                          DECIMAL(6,2),
  paraffin_inhibitor_effectiveness    DECIMAL(5,2),

  -- Corrosion Wheel (CORROSION_COUPON)
  corrosion_rate                  DECIMAL(8,3),
  corrosion_inhibitor_performance DECIMAL(5,2),

  -- Failure Analysis (any type, optional)
  failure_type        VARCHAR(200),
  failure_root_cause  TEXT,
  failure_recommendation TEXT,

  -- Oil in Water (any type, optional)
  oil_content DECIMAL(10,3),

  -- Notes & Alert tracking
  lab_tech_notes      TEXT,
  has_critical_values TINYINT(1)   NOT NULL DEFAULT 0,
  alert_sent_at       DATETIME,

  INDEX idx_lab_results_sample   (sample_id),
  INDEX idx_lab_results_tenant   (tenant_id),
  INDEX idx_lab_results_critical (tenant_id, has_critical_values)
);
```

**Validation**: Spring Boot starts, Flyway runs V28+V29 clean.

---

## Layer 2: API (Backend)

**Package**: `com.fecos.lab`

**Files to create**:
```
com/fecos/lab/
  SampleType.java           -- enum: PRODUCED_WATER, SOLID_SCRAPING, CORROSION_COUPON
  SamplePriority.java       -- enum: ROUTINE, RUSH
  LabSampleStatus.java      -- enum: RECEIVED, IN_PROGRESS, COMPLETED
  ScaleSeverity.java        -- enum: LIGHT, MODERATE, SEVERE
  LabSampleEntity.java      -- extends TenantAwareEntity
  LabSampleRepository.java
  LabResultEntity.java      -- extends TenantAwareEntity
  LabResultRepository.java
  LabSampleRequest.java     -- create/update sample metadata
  LabResultRequest.java     -- enter test results
  LabSampleResponse.java    -- sample + nested result if present + activeTreatmentPlanId + activeTreatmentPlanStatus for the well
  LabService.java           -- all business logic; injects TreatmentPlanRepository to look up active plan per well
  LabController.java        -- REST endpoints
```

**Endpoints**:
| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | /api/v1/lab/samples | ADMIN, LAB_TECH, ACCOUNT_REP, MANAGER | List samples paginated (filter: status, wellId, sampleType, dateFrom, dateTo) |
| GET | /api/v1/lab/samples/{id} | ADMIN, LAB_TECH, ACCOUNT_REP, MANAGER | Get sample with results |
| POST | /api/v1/lab/samples | ADMIN, LAB_TECH | Log sample receipt (auto-generates sample number) |
| PUT | /api/v1/lab/samples/{id} | ADMIN, LAB_TECH | Update sample metadata |
| POST | /api/v1/lab/samples/{id}/results | ADMIN, LAB_TECH | Enter results → computes LSI + corrosion potential → checks thresholds → fires alert |
| PUT | /api/v1/lab/samples/{id}/results | ADMIN, LAB_TECH | Update results (re-runs threshold check) |
| GET | /api/v1/lab/alerts | ADMIN, LAB_TECH, ACCOUNT_REP, MANAGER | Samples with has_critical_values=true, ordered by created_at DESC |

**Key business logic in LabService**:

```
generateSampleNumber(tenantId, receivedAt):
  count = COUNT(*) WHERE tenant_id = tenantId AND is_deleted = false
  return "SMP-" + year + "-" + MMDD + "-" + LPAD(count+1, 5, '0')

computeLSI(calcium, tds, temp°C=25, ph, bicarbonates):
  // Langelier Saturation Index
  A = (log10(tds) - 1) / 10
  B = -13.12 * log10(tempC + 273) + 34.55
  C = log10(calcium_as_CaCO3) - 0.4      // calcium_as_CaCO3 = calcium * 2.497
  D = log10(alkalinity_as_CaCO3)          // alkalinity_as_CaCO3 = bicarbonates * 0.8202
  pHs = (9.3 + A + B) - (C + D)
  LSI = ph - pHs
  return round(LSI, 3)

computeCorrosionPotential(ph, iron, dissolvedOxygen, chlorides):
  // Simple 0-10 scoring — higher = more corrosive
  score = 0
  if ph < 6.5: score += 3.0
  elif ph < 7.0: score += 1.5
  if iron > 50: score += 2.5
  elif iron > 20: score += 1.0
  if dissolvedOxygen > 0.5: score += 2.5
  elif dissolvedOxygen > 0.1: score += 1.0
  if chlorides > 100000: score += 2.0
  elif chlorides > 50000: score += 1.0
  return min(round(score, 1), 10.0)

checkCriticalThresholds(result):
  critical = false
  if result.srbCount > 1000: critical = true
  if result.apbCount > 10000: critical = true
  if result.corrosionRate > 5.0: critical = true
  if result.scalingIndex > 2.0: critical = true
  if result.iron > 50: critical = true
  if result.ph < 5.5 OR result.ph > 9.0: critical = true
  if result.dissolvedOxygen > 0.5: critical = true
  return critical

fireAlert(sampleId, tenantId) [@Async]:
  result.setAlertSentAt(Instant.now())
  // FCM push to all ACCOUNT_REP users of this tenant
  // Notification payload: sample number, well name, which thresholds exceeded, activeTreatmentPlanId (deep link)
  // Phase 3 will wire actual FCM delivery; for now: log + set alertSentAt

toResponse(sample, includeResults):
  // same pattern as RouteService.toResponse()
  wellName     = wellRepository.findById(sample.wellId)
  leaseName    = leaseRepository.findById(well.leaseId)
  clientName   = clientRepository.findById(lease.clientId)
  collectedByName = userRepository.findById(sample.collectedById)
  activePlan   = treatmentPlanRepository.findActiveByWellId(sample.wellId, tenantId)
                 → sets activeTreatmentPlanId + activeTreatmentPlanStatus (null if no active plan)
```

**Validation**: Server starts. All 7 endpoints respond. Sample number generated correctly.

---

## Layer 3: Web (Frontend)

**Files to create**:
- `fecos-web/src/api/lab.ts`
- `fecos-web/src/pages/tenant/LabPage.tsx`

**Files to update**:
- `fecos-web/src/App.tsx` — replace `/lab/queue` placeholder with `<LabPage />`

### LabPage structure (mirrors InventoryPage left-nav layout)

**Left-nav sections**:
```
[ FlaskConical ] Queue       — RECEIVED + IN_PROGRESS samples
[ CheckCircle2 ] Completed  — COMPLETED samples (results entered)
[ AlertTriangle ] Alerts     — samples where has_critical_values = true
```

**Queue section**:
- Table: Sample #, Type badge, Well, Lease, Collected At, Priority badge, Status badge, action
- "Log Sample" button → right-side panel (440px)
- Click row → right-side "Enter Results" panel (same panel, different mode)
- Priority badge: RUSH = red ring, ROUTINE = gray ring
- Status badge: RECEIVED = blue, IN_PROGRESS = amber, COMPLETED = green

**Enter Results panel** (440px, right-side):
- Shows sample header (number, type, well, lease)
- Sections shown depend on sample_type:
  - PRODUCED_WATER: Water Analysis fields + Bacteriological fields
  - SOLID_SCRAPING: Scale Analysis fields (type, severity, remediation)
  - CORROSION_COUPON: Corrosion Wheel fields
  - All types: Paraffin (optional, collapsible), Failure Analysis (optional, collapsible), Oil in Water (optional, collapsible)
- LSI + Corrosion Potential auto-display after water fields filled (computed backend on save)
- Lab Tech Notes textarea
- Save → POST /results → on success show critical alert banner if has_critical_values

**Completed section**:
- Searchable table with date range filter
- Click row → detail drawer (600px) showing full lab report exactly as in requirements (all sections, critical badges on exceeded values, lab tech notes)

**Alerts section**:
- List of samples with critical values
- Each card: sample number, well, date, which thresholds exceeded (red badges)
- Visible to LAB_TECH and ACCOUNT_REP

**Mirror**: `InventoryPage.tsx` (left-nav shell), `RoutesPage.tsx` (right-side panel + drawer)

**Validation**: `npm run build` — zero TypeScript errors. Lab Queue page loads, new sample panel opens, results panel saves.

---

## Layer 4: Mobile
Out of scope. Service Tech mobile sample collection is Phase 3.

---

## Step-by-Step Tasks

### Layer 1: Database
- 1.1: Write V28__create_lab_samples.sql
- 1.2: Write V29__create_lab_results.sql
- 1.3: Start Spring Boot, confirm Flyway applies both migrations clean

### Layer 2: API
- 2.1: Create 4 enums (SampleType, SamplePriority, LabSampleStatus, ScaleSeverity)
- 2.2: Create LabSampleEntity + LabResultEntity
- 2.3: Create LabSampleRepository + LabResultRepository
- 2.4: Create LabSampleRequest + LabResultRequest + LabSampleResponse
- 2.5: Create LabService (generateSampleNumber, computeLSI, computeCorrosionPotential, checkCriticalThresholds, fireAlert)
- 2.6: Create LabController (7 endpoints)
- 2.7: Restart server, verify all endpoints respond

### Layer 3: Web
- 3.1: Create src/api/lab.ts (types + all API call functions)
- 3.2: Build LabPage.tsx — left-nav shell + Queue section table + Log Sample panel
- 3.3: Add Enter Results panel (per-sample-type field sections)
- 3.4: Add Completed section + detail drawer
- 3.5: Add Alerts section
- 3.6: Wire into App.tsx at /lab/queue
- 3.7: `npm run build` — zero errors required

---

## Acceptance Criteria
- [ ] V28 + V29 migrations run clean on Spring Boot startup
- [ ] POST /lab/samples creates sample with correct SMP-YYYY-MMDD-NNNNN format
- [ ] POST /lab/samples/{id}/results computes LSI correctly (Langelier formula)
- [ ] POST /lab/samples/{id}/results computes corrosion potential 0–10
- [ ] has_critical_values = true when any of 7 thresholds exceeded
- [ ] alert_sent_at set within 60s of result save when critical
- [ ] GET /api/v1/lab/alerts returns only samples with has_critical_values = true
- [ ] Lab Queue page loads at /lab/queue with sample list
- [ ] "Log Sample" panel creates sample with auto-generated number
- [ ] "Enter Results" panel shows correct fields per sample type
- [ ] Completed detail drawer shows full lab report with critical badges
- [ ] Alerts section shows exceeded thresholds as red badges
- [ ] npm run build — zero TypeScript errors
