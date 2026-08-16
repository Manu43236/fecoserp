# FECOS Module Plan: Bulk Tank

## Summary
Tracks chemical tanks at well sites as part of treatment plan execution. Each treatment plan line item has one tank delivering that chemical. Tanks are either owned by Endura (full tracking) or a 3rd party (basic level monitoring only). Level is calculated automatically via dead reckoning — no manual readings required for tracking.

## Requirements

**Who**: Account Rep (web), Service Tech (mobile — future)
**Trigger**: Treatment plan line item is set up — tank must be configured before plan goes ACTIVE
**Data captured**: Tank owner, capacity, current level, pump rate, refill events, rate change events
**Approval flow**: None
**Linked to**: Treatment plan line item → well
**Mobile**: Future (offline sync approach already decided)
**Calculations**: Current level = last known level − (recRate × time elapsed since last event)

**Out of scope for v1**:
- Mobile offline sync
- Push notifications for low tank alerts
- Tank reassignment between wells
- Option B validation (block ACTIVE until all tanks set up) — after tank module is built

---

## Mirror Module
Treatment plan line items (existing `TreatmentPlanLine*` files) — mirror for backend patterns.
`PlansPage.tsx` — mirror for frontend patterns.

---

## Layer 1: Database

**Files to create**:
- `V32__add_tank_owner_to_plan_lines.sql`
- `V33__create_tanks.sql`
- `V34__create_tank_events.sql`

### V32 — treatment_plan_lines changes
```sql
ALTER TABLE treatment_plan_lines
  ADD COLUMN tank_owner    ENUM('ENDURA','THIRD_PARTY') NULL,
  ADD COLUMN tank_level_pct      DECIMAL(5,2)           NULL,
  ADD COLUMN tank_level_checked_at TIMESTAMP             NULL,
  ADD COLUMN tank_id       CHAR(36)                     NULL;
```

### V33 — tanks table (Endura-owned only)
```sql
CREATE TABLE tanks (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  tenant_id       CHAR(36)      NOT NULL,
  serial_number   VARCHAR(100)  NULL,
  capacity_gallons DECIMAL(10,2) NOT NULL,
  well_id         CHAR(36)      NULL,
  status          ENUM('INSTALLED','ACTIVE','REMOVED') NOT NULL DEFAULT 'INSTALLED',
  installed_at    TIMESTAMP     NULL,
  removed_at      TIMESTAMP     NULL,
  is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### V34 — tank_events table
```sql
CREATE TABLE tank_events (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  tenant_id       CHAR(36)      NOT NULL,
  tank_id         CHAR(36)      NOT NULL,
  event_type      ENUM('INSTALLED','FILLED','RATE_CHANGED','REFILLED','REMOVED') NOT NULL,
  amount_gallons  DECIMAL(10,2) NULL,
  rec_rate        DECIMAL(10,4) NULL,
  level_pct       DECIMAL(5,2)  NULL,
  performed_by_id CHAR(36)      NULL,
  event_at        TIMESTAMP     NOT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Validation**: All 3 migrations run clean.

---

## Layer 2: API (Backend)

**Files to create**:
- `com/fecos/tanks/TankEntity.java`
- `com/fecos/tanks/TankEventEntity.java`
- `com/fecos/tanks/TankRepository.java`
- `com/fecos/tanks/TankEventRepository.java`
- `com/fecos/tanks/TankRequest.java`
- `com/fecos/tanks/TankEventRequest.java`
- `com/fecos/tanks/TankResponse.java`
- `com/fecos/tanks/TankService.java`
- `com/fecos/tanks/TankController.java`

**Files to change**:
- `TreatmentPlanLineEntity.java` — add tankOwner, tankLevelPct, tankLevelCheckedAt, tankId
- `TreatmentPlanLineRequest.java` — add new fields
- `TreatmentPlanLineResponse.java` — add new fields + calculatedLevelPct

**Endpoints**:
| Method | Route | Description |
|---|---|---|
| GET | /api/v1/tanks | List all Endura tanks |
| GET | /api/v1/tanks/:id | Get one with events |
| POST | /api/v1/tanks | Create tank |
| PUT | /api/v1/tanks/:id | Update tank |
| POST | /api/v1/tanks/:id/events | Log event (fill, refill, rate change, remove) |
| GET | /api/v1/tanks/:id/level | Get calculated current level |

**Level calculation logic (in TankService)**:
```
Find latest FILLED or REFILLED event → that's the baseline level + timestamp
Sum up all chemical delivered since then: recRate × hours elapsed
currentLevel = baselineLevel − delivered
```

**Validation**: Server starts. All endpoints respond.

---

## Layer 3: Web (Frontend)

**Files to create**:
- `src/api/tanks.ts`
- `src/pages/tenant/TanksPage.tsx`

**Files to change**:
- `src/api/plans.ts` — add tankOwner, tankLevelPct, tankLevelCheckedAt, tankId to PlanLineRecord
- `PlansPage.tsx` — update line item form in PlanDrawer to show tank owner + conditional fields
- `AppLayout.tsx` — add Tanks to nav
- `App.tsx` — add /tanks route

**Line item form changes (PlanDrawer)**:
- Add "Tank Owner" toggle: Endura / 3rd Party
- If 3rd Party: show Current Level (%) + Last Checked Date fields
- If Endura: show "Link Tank" dropdown (select from Endura tanks at this well)

**TanksPage**:
- Table: Serial No, Well, Lease, Product (from linked line item), Capacity, Est. Level %, Status
- Click row → drawer with full event history + log event action
- Log event panel: event type, amount, timestamp

**Validation**: TypeScript clean. Pages load. CRUD works.

---

## Step-by-Step Tasks

### Layer 1
- 1.1 Create V32 migration (alter treatment_plan_lines)
- 1.2 Create V33 migration (tanks table)
- 1.3 Create V34 migration (tank_events table)
- 1.4 Run all migrations

### Layer 2
- 2.1 Update TreatmentPlanLineEntity + Request + Response
- 2.2 Create TankEntity + TankEventEntity
- 2.3 Create TankRepository + TankEventRepository
- 2.4 Create TankRequest + TankEventRequest + TankResponse
- 2.5 Create TankService (with level calculation)
- 2.6 Create TankController
- 2.7 Register in FecosApiApplication route scan

### Layer 3
- 3.1 Update PlanLineRecord type in plans.ts
- 3.2 Create tanks.ts API calls
- 3.3 Update PlanDrawer line item form
- 3.4 Build TanksPage
- 3.5 Add to nav + router

---

## Acceptance Criteria
- [ ] 3 migrations run clean
- [ ] Treatment plan line item saves tank owner + fields correctly
- [ ] Level calculation returns correct value based on events
- [ ] Tanks page lists all Endura tanks with estimated level
- [ ] Log event works (refill, rate change)
- [ ] 3rd party tank fields save and display correctly
- [ ] TypeScript clean
