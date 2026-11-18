# FECOS Plan: Offline Sync Reminder (Mobile)

## Summary
Nag field users (truck drivers, service techs) with a persistent notification whenever unsynced offline data is sitting on the device, so forgotten work doesn't silently never reach the server. Android gets a truly sticky notification; iOS gets a repeating reminder (Apple won't allow sticky). Both auto-clear the instant everything syncs.

## The actual gap (narrow but real)
Already handled today — do NOT rebuild:
- In-app: `pendingCount` + `offline_banner.dart` already show unsynced work while the app is open.
- Auto-sync: `SyncService` already runs on reconnect — `ever(isOnline, (online) { if (online) _trySyncAll(); })`. If the app is alive when signal returns, it syncs itself.

The one uncovered case: **app fully closed/killed → phone regains signal → nobody reopens it.** Nothing syncs, no reminder. This feature fills only that hole.

## Approach
A local notification (outlives the app) driven by `SyncService.pendingCount`:
- `pendingCount > 0` → show/ensure the reminder.
- `pendingCount == 0` → cancel it (synced, nothing to nag about).
- Tapping it opens the app → the existing reconnect auto-sync fires.

Platform split (OS rules, not effort):

| | Android | iOS |
|---|---|---|
| Mechanism | one `ongoing` notification (non-dismissible) | one repeating-interval local notification |
| After user swipes | can't be swiped | next scheduled fire re-surfaces it |
| Reacts to the swipe itself | n/a | no — time-based only |
| Clears on sync | ✅ cancel | ✅ cancel all pending |

- **Not** a foreground service (that keeps a process alive = battery). A plain `ongoing` notification is just a flag — no live process.
- Text is **generic** — "You have unsynced reports — open the app when you have signal." No count baked in (pre-scheduled iOS reminders would otherwise show a stale number).
- **Cadence (iOS repeat): hourly** — persistent but polite. Too-frequent gets muted, which helps no one.

## Battery
Negligible. These are OS-managed notifications; the app isn't running between fires, no CPU/network/wakeups. The only battery-expensive option (background periodic sync) is deliberately out of scope — see below.

## Files to touch (mobile only)
- `pubspec.yaml` — add `flutter_local_notifications` (one new dependency; nothing in-app does this today).
- New `lib/app/data/services/sync_reminder_service.dart` — `GetxService` that:
  - on init, requests notification permission and sets up the channel;
  - `ever(SyncService.pendingCount, ...)` → show (Android ongoing / iOS repeating) when >0, cancel when 0.
- `SyncService` — no logic change; it already maintains `pendingCount` (set at lines ~65 and ~94). The reminder service just observes it.
- App bootstrap (main / initial bindings) — register `SyncReminderService` after `SyncService`.
- `android/app/src/main/AndroidManifest.xml` — `POST_NOTIFICATIONS` permission (Android 13+) + a notification icon.
- iOS — request authorization at runtime (no Info.plist background mode needed for local notifications).

## Permissions / UX
- First-run **notification-permission prompt** on both platforms (Android 13+ `POST_NOTIFICATIONS`, iOS authorization). If denied, feature silently no-ops — the in-app banner still covers the app-open case.

## Edge cases
- Dead zone while pending — the reminder still fires (phone can't know signal is coming); generic "open when you have signal" wording keeps it a to-do, not a false alarm.
- iOS stale count — avoided by not putting a number in the text.
- User mutes the app's notifications in Settings — nothing overrides that; in-app banner remains the fallback.
- Covers ALL offline entity types in the sync queue (deliveries, well-stop reports, lab samples), since it keys off `pendingCount`, not any one feature.

## Out of scope (defer unless forgetting persists)
- **Background periodic sync** (WorkManager / BGTaskScheduler) that syncs without reopening the app. More thorough, but real battery cost and unreliable on iOS (OS decides when, or not at all). Revisit only if the reminder proves insufficient.
- Per-entity or per-count notification detail.
- Snooze / custom cadence settings.

## Verification checks
- `pendingCount` 0→N shows a notification; N→0 cancels it (one unit test on the reminder service with a faked notifications plugin + a fake pendingCount Rx).
- Android: notification is `ongoing` (not swipeable) — manual device check.
- iOS: after swipe, a later scheduled fire re-appears; cancel clears all pending — manual device check.
- Permission-denied path no-ops without crashing.
