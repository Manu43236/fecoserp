# FECOS — Client Change Requests Spec

**Source:** Call with Joseph & De'Shawn, 2026-11-20/21
**Status:** Tanks & Pumps **Phase A built** (2026-11-21); rest designed, not built.
**Build order:** 1) Tanks & Pumps → 2) Users & Roles → 3) Yards → 4) Routes

## Progress
- ✅ **2026-11-21 — Users & Roles (multi-role + yard membership):** Backend already had `user_roles`/`user_yards` (V82), `UserEntity.roles`/`yardIds`, and `UserService` combo + yard validation. Completed the frontend: shared role config hub (`RoleBadge`/`RoleBadges`/`FIELD_ROLES`/`isFieldRole`/`isMobileRole`), reusable `RoleMultiSelect` (auto-resolves AR-exclusive and Admin⇄Manager conflicts, mirrors server rules) + `YardMultiSelect`. Tenant `UsersPage` now creates/edits with multiple roles + yard assignment (yards required when a field role is selected), multi-badge display, union-based stats/filters. `SAUsersPage` switched to multi-role (sends `roles[]`, preserves yards on edit). Propagated **permissions = union** across the app: `authStore.hasAnyRole`, Lab canEdit/canApprove, Lab/ServiceVisits/Clients user-filters now match `roles.includes(...)` instead of the single primary role (nav already correct via role precedence; backend `?role=` already uses `MEMBER OF`). Added `yardIds`/`yardNames` to `SAUserResponse`. Backend + frontend both compile clean. **AR coverage (account_rep_id on lease/well + the "Covering" tree selector) NOT built — separate feature, see §2.**
- ✅ **2026-11-21 — Yards (module + warehouse/client links):** `V81` migration (yards table; `yard_id` on warehouses + clients; backfills a "Main Yard" per tenant and attaches existing warehouses). Backend: full `com.fecos.yards` CRUD module; warehouse now **requires** a yard (service validates ownership); client has **optional** yard. Frontend: YardsPage (list + 440px panel + drawer, matches TanksPage), `/yards` route, nav under Sites (Admin/Manager); yard dropdown added to warehouse form (required) and client form (optional). user↔yard deferred to Users module. Backend BUILD SUCCESS, frontend 0 TS errors.
- ✅ **2026-11-21 — Tanks & Pumps Phase A (module):** `V80` migration (owner/client_id/third_party_name on tanks + pumps); backend entity/DTO/service/repo/controller for both; owner validation (client XOR "Others" name, form + server); owner filter on list endpoints. Frontend: Own/3rd-Party toggle + client dropdown w/ "Others" + free-text name on both forms; Owner column + filter + drawer field on TanksPage & PumpShopPage. Tenant labels fixed ("Endura"→"Own"). Backend BUILD SUCCESS, frontend 0 TS errors.
- ⛔ **Tanks & Pumps Phase B BLOCKED on parked #3.** Phase B = move 3rd-party from inline-on-plan-line to a registry `tankId` reference + scoped selector + data migration. Today a plan line stores 3rd-party inline (`line.tankOwner=THIRD_PARTY` + `thirdPartyName/capacity/serial`, no tankId); Phase B collapses that so 3rd-party-ness moves from the line to the tank. **The parked #3 rule (Start disabled for 3rd-party tank) keys off `line.tankOwner` — that field disappears in Phase B.** Rewriting it onto `tank.owner` requires knowing whether the rule should exist at all → wait for De'Shawn's answer on #3, then build line refactor + migration + selector scoping + corrected Start rule in one pass.

> Current-state facts verified against code: single `role` enum per user; `routes.driver_id` is `NOT NULL`; 3rd-party tank data lives inline on `treatment_plan_lines`; `pumps` already has an `owner` flag; warehouses have no parent.

---

## 1. Yards (new module)

A **Yard** is a physical location (like a warehouse) that acts as a container for warehouses, users, and clients.

**Relationships:**
- Warehouse → **exactly one** yard (required).
- User → **one or more** yards (required for Service Tech, Truck Driver, Account Rep; optional for Admin/Manager/Lab Tech; N/A for Super Admin).
- Client → **zero or one** yard (optional).

**Entity:** `yards` (name, location/address, is_active) + join table `user_yards`. Add `yard_id` to `warehouses` (required) and `clients` (nullable).

**Migration:** create a default **"Main Yard"** on rollout; attach all existing warehouses and users to it so nothing breaks.

**UI:** standard list page + 440px right-side panel, matching `TanksPage` conventions.

---

## 2. Users & Roles

### Multi-role
- A user holds **one or more** roles (was single).
- Allowed combinations: **Admin** = any; **Manager** = any except Admin; **Account Rep** = exclusive (AR only); **Service Tech ⇄ Truck Driver** = either can also be the other.
- Permissions = **union** of all held roles.
- Platform follows roles held (e.g. Manager + Service Tech → both web and mobile). A user with two mobile roles gets a **mode switcher** in the app (defaults to last used).
- **Service Tech doing deliveries** = just assign them the Truck Driver role. No separate mechanism.

**Schema:** replace single `users.role` column with a many-to-many `user_roles`.

### Yard membership
- Required on create for Service Tech / Truck Driver / Account Rep; optional for back-office roles; excluded for Super Admin.

### Account Rep coverage
An AR is responsible for a scoped set of clients/leases/wells.

**Model:** nullable `account_rep_id` on **client, lease, and well** (client already has it; add to lease + well).
- A well's **effective AR = most-specific-wins**: well's own AR → else its lease's → else its client's.
- The AR's "profile" is the collected set across those three fields.
- **Bidirectional:** selecting an AR on a client/lease/well form writes the same `account_rep_id` the AR's profile reads — no sync code needed.
- AR with zero coverage: **warn but allow** save (can be assigned later via entity forms).

**UI — coverage selector (inside the 440px user panel, shown only when AR role selected):**
- A collapsible **"Covering" tree** (client → lease → well) shows what's assigned; read-only view.
- **"+ Add coverage"** → pick a **Client** (SearchableDropdown), then a **lease-grouped checkbox selector scoped to that client**:
  - `☐ Select entire client` at top (one tap = whole operator).
  - Leases listed with tri-state group checkbox + well count; ticking a lease covers all its wells.
  - Expand a lease (lazy-loads wells) only to pick individual wells.
  - Search spans leases + wells, with "select all results".
  - Live selected count.
- **Stored compactly:** whole-client = 1 client row; whole-lease = 1 lease row; individual wells = per-well rows. Never stores 100 well rows when a lease tick will do.
- **Dedup:** adding a broader scope collapses narrower redundant entries; adding an already-covered item is a no-op.

---

## 3. Tanks & Pumps

Third-party tanks/pumps become **full records** in the Tanks/Pumps modules (no more inline-on-plan storage). Own and 3rd-party share the **identical workflow** — lifecycle, capacity, serial, events, depletion, refills. `owner` is just a label.

**Schema:**
- Tanks: add `owner` (`OWN`/`THIRD_PARTY`), `client_id` (nullable), `third_party_name` (nullable).
- Pumps: already have `owner`; add `client_id` + `third_party_name`.

**Add/Edit form (440px panel, same for tanks and pumps):**
- `Owner` segmented toggle: **Own** / **3rd Party**.
- If 3rd Party → **Belongs to** SearchableDropdown of clients, with a pinned **"Others (not a client)"** option at the bottom.
- If "Others" → reveal **3rd party name** (required).

**Validation (form + server):**
- Owner = 3rd Party → must have **either** `client_id` **or** `third_party_name`, never neither.
- "Others" → `third_party_name` required (non-blank).
- Exactly one of `client_id` / `third_party_name` set. Owner = Own ignores both.

**List pages:** add Owner badge + Client column; add Owner filter (All / Own / 3rd Party); keep existing status filter and `TanksPage` conventions.

**Tank/pump selector in a treatment (installation):**
- Scoped to the well's client (well → lease → client X).
- Shows only: `status = AVAILABLE` **and** (`OWN` **or** `THIRD_PARTY` for client X **or** `THIRD_PARTY` "Others").
- **Excludes** any other client Y's tanks. Grouped by owner in the picker.

**Migration:** for each `treatment_plan_line` with `tank_owner = THIRD_PARTY`, create a tank record (owner=THIRD_PARTY, client_id from well→lease→client, carry serial/capacity), link `tank_id` back to the line, seed a tank event for the current level. Inline fields then retire.

**Open question (not blocking):** who registers a 3rd-party tank — office-only (web Tanks page) now, or field quick-add on mobile later? *Lean: office-only now; add mobile quick-add only if requested.*

---

## 4. Routes

Reworked around **no pre-assigned driver**.

- `routes.driver_id` becomes nullable; routes are created **without** a driver.
- **Two creation paths, one route model:**
  1. **Prebuilt/bulk** — office uploads the monthly schedule → routes+stops created unassigned.
  2. **Ad-hoc (mobile)** — driver builds on the phone: pick yard → client (in that yard) → lease → wells → yard's warehouse auto-selected → creates + claims the route.
- Drivers see **today's routes only** (running + yet-to-start; plus any earlier unfinished route).
- **Record the actual driver** at claim/start (accountability/reports); starting **claims/locks** the route.
- **Dedup (soft):** if an ad-hoc selection overlaps an existing route today → nudge "route already exists — Open it / Create anyway" (never hard-block); show "In progress by X" if claimed.
- Product + quantity per stop come from each well's **treatment plan** (product + rec rate) — not entered on the schedule.
- Web RoutesPage/DeliveriesPage: remove driver-assignment UI.

**Bulk upload:** we design a simple template (Date · Client · Lease · Well · Yard) and set up their clients/leases/wells once; the monthly upload only schedules existing wells. Their current spreadsheet (one tab per driver, free-text calendar cells) is **not** importable as-is — it's the input to onboarding, not the format.

---

## Parked / open items

| Item | Status |
|---|---|
| Treatment **Start disabled for 3rd-party tank** | **Parked** — De'Shawn to explain intent. Do not touch current behavior. Note: conflicts with "own & 3rd-party identical" — reconcile when revisited. |
| Number in parens on schedule (`Weatherby (11)`) | Assumed = well count. |
| Client in one yard vs several | One yard for now; revisit if a big operator spans yards. |
| 3rd-party tank field quick-add (mobile) | Deferred unless requested. |

---

## Approach note

Client is non-technical (paper + spreadsheets). We **own the structure** — build it shaped properly, show them, iterate on feedback. Get the **data model right up front** (multi-role, yard relationships, tank owner, routes-without-driver — all migration-expensive); stay **loose on UI/flow** (cheap to change after they react).
