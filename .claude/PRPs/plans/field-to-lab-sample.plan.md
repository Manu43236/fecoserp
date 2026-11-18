# FECOS Plan: Field-to-Lab Sample Handoff

## Summary
Connect the Service Tech's field sample collection (mobile well stop) to the Lab module so a collected sample automatically becomes a lab record — surviving offline dead zones, carrying an unbroken chain of custody from wellhead to bench, and ending the double data-entry where the Lab Tech re-keys every sample by hand.

Today `sampleType`/`sampleNotes`/`samplePhotoUrl` are stored as free text on the service report and never reach the lab. After this, a sample flagged "Send to lab" creates a `LabSampleEntity` in a new `COLLECTED` state, identified by a device-minted custody code the tech writes on the bottle.

## Who / Trigger
- **Collector**: SERVICE_TECH (+ ADMIN). Not truck drivers — stays in the well-stop flow only.
- **Receiver**: LAB_TECH confirms the physical bottle and advances it to RECEIVED.
- **Trigger**: Service Tech collects a sample during a well stop and flips **Send to lab** → record is created on submit (immediately if online, on sync if offline).

## Custody code (bottle label) — the core spec
Format: **`LS-{WELL}-{TYPE}-{DD}/{nn}`** e.g. `LS-WELX1-PW-18/01`
- `WELL` = well short code · `TYPE` ∈ `PW` (Produced Water), `COCO` (Corrosion Coupon), `SOSC` (Solid Scraping) · `DD` = day-of-month · `nn` = per-(well+type+day) counter.
- **Minted on the device**, offline-safe — the phone counts only its own samples for that well+type+day from a local store, so no network/coordination needed.
- Counter resets per type: `LS-WELX1-PW-18/01`, `LS-WELX1-COCO-18/01`, `LS-WELX1-PW-18/02`.
- This is the **only** number the tech writes on the bottle. The server's sequential `SMP-YYYY-MMDD-NNNNN` stays as the system reference — nobody writes it on a bottle.
- **Residual collision** (two techs, same well+type+day, both offline → same code): not designed out of the format (too rare to justify complexity). Caught by a server duplicate-guard on sync instead — see Edge Cases.

## Statuses
`COLLECTED` *(new)* → `RECEIVED` → `IN_PROGRESS` → `COMPLETED`
`COLLECTED` = exists digitally, in transit, bottle not yet on the bench. The lab queue shows it as *In Transit*.

---

## Layer 1: Database
`fecos-api/.../db/migration/V8x__field_lab_samples.sql`
- `ALTER TABLE lab_samples ADD COLUMN custody_code VARCHAR(40)` — the bottle label.
- `ALTER TABLE lab_samples ALTER COLUMN received_at DROP NOT NULL` — null until the lab receives it (field-created samples have no receipt time yet).
- Partial unique index for the duplicate-guard: `CREATE UNIQUE INDEX ... ON lab_samples (tenant_id, custody_code) WHERE is_deleted = false AND custody_code IS NOT NULL`.
- `collected_by_id` / `collected_at` already exist — no change.

## Layer 2: API
- `LabSampleStatus.java` — add `COLLECTED` (first in the enum).
- `LabSampleEntity.java` — add `custodyCode` field; `receivedAt` now nullable.
- `LabSampleResponse.java` — add `custodyCode`.
- `LabService.java`
  - New `createFromField(tenantId, collectedById, wellId, SampleType, collectedAt, custodyCode, notes)`: builds entity with `status = COLLECTED`, `priority = ROUTINE`, server `sampleNumber` via existing `generateSampleNumber`, `receivedAt = null`. **Idempotent**: if a non-deleted row with the same `(tenant, custodyCode)` exists, skip creation (re-sync safety) — see Edge Cases for the cross-collector case.
  - New `markReceived(id)`: `COLLECTED → RECEIVED`, sets `receivedAt = now`. Reject if not currently `COLLECTED`.
- `LabController.java` — `POST /lab/samples/{id}/receive` (guarded LAB_TECH/ADMIN).
- `TreatmentReportRequest.java` — add `boolean sendToLab`, `String sampleCustodyCode`. (`sampleType` string now carries the enum name when `sendToLab` is true.)
- `ServiceReportService.submitTreatmentReport(...)` — after saving the report, if `req.sendToLab()` and `sampleType` present: resolve `wellId` from the stop, call `labService.createFromField(tenantId, userId, stop.getWellId(), SampleType.valueOf(req.sampleType()), req.performedAt(), req.sampleCustodyCode(), req.sampleNotes())`. Free-text sample fields still stored on the report as today.

## Layer 3: Mobile (Service Tech)
- `well_stop_view.dart` `_SampleSection` — replace the free-text Sample Type field with a **dropdown** (PW / COCO / SOSC → enum names); add a **"Send to lab"** toggle (default off). When on, show the minted custody code with a "write this on the bottle" hint.
- `well_stop_controller.dart`
  - Add `sendToLab` (Rx bool) and `sampleTypeEnum` selection; drop the free-text controller's use for lab typing.
  - **Mint custody code on selection/submit**: local counter per `{wellId}:{type}:{yyyymmdd}` persisted in the existing local DB (Drift) / GetStorage — increments offline, survives app restart.
  - Add `sendToLab`, `sampleType` (enum name), `sampleCustodyCode` to **both** payloads: the online `body` (~L430) **and** the offline `syncQueue` payload (~L383). *(The offline branch currently also drops `samplePhotoUrl` — fold that in while here.)*
- `sync_service.dart` `_syncWellStopReport` (~L236) — forward `sendToLab`, `sampleType`, `sampleCustodyCode` in the POST body.
- `lab_sample_model.dart` / `report_view` — add `custodyCode` so the tech can see it on the submitted report.

## Layer 4: Web (Lab)
- `lab.ts` — add `custodyCode` to the sample type; add `COLLECTED` to status; add `receive(id)` API call.
- `LabPage.tsx`
  - List row: show **custody code prominently** + `sampleNumber` secondary + `COLLECTED` → *In Transit* dot/ring badge (match existing badge style).
  - **Search by custody code** (so Elena types the bottle label and jumps to the row).
  - `COLLECTED` added to the status filter dropdown.
  - Drawer: **"Mark Received"** action for `COLLECTED` samples (per Table Actions rule — action lives in the drawer, not the row). Existing Enter Results / Approve unchanged.
- `LabQueueCard.tsx` — count `COLLECTED` as part of the incoming queue.

---

## Edge cases & decisions
- **Offline collection** — custody code minted on-device; report queued; lab record created when the phone syncs. Lab queue shows it only after sync (honest: "when signal returns," not "the instant collected").
- **Multiple samples / well / day** — counter + type in the code keep them distinct (`PW-18/01`, `COCO-18/01`, `PW-18/02`).
- **Multiple techs, different wells, offline** — no collision; well+type differ.
- **Two techs, same well+type+day, both offline (rare)** — both mint the same code. On sync the partial unique index / idempotency check detects the clash: instead of silently merging, flag both for the Lab Tech to verify/renumber. *(ponytail: cheapest correct spot — the one place a network exists. No format change.)*
- **Not-a-lab sample** — toggle off → behaves exactly like today, stays on the report, never hits the lab. Toggle is the one new habit for the field crew.
- **Re-sync retry** — idempotent create keyed on `(tenant, custodyCode)` prevents duplicate lab rows.

## Out of scope (YAGNI — add only if it hurts)
- Barcode/QR scanning of bottles (the written code is enough to reconcile).
- OCR of the sample photo.
- Server block-pre-allocation of sequential numbers to devices.
- Expanding the 3-type enum (add a 4th only if field actually bottles another type).
- Truck-driver access (wrong role).

## Verification checks
- **API**: `createFromField` sets `COLLECTED` + null `receivedAt` + server sampleNumber; `markReceived` rejects non-`COLLECTED`; duplicate `(tenant, custodyCode)` does not create a second row. (springboot-tdd: service test + MockMvc on `/receive`.)
- **Mobile**: custody counter increments offline and resets per well+type+day — one unit test on the generator (e.g. 2×PW same well/day → `/01` then `/02`; COCO → `/01`).
- **Web**: COLLECTED sample renders custody code + In-Transit badge; Mark Received flips status and disappears from the in-transit filter.
- **E2E (manual demo path)**: collect offline → airplane mode off → sample appears in lab queue → Mark Received → Enter Results → Approve.
