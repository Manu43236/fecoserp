import 'dart:io' show Platform;

import 'package:get/get.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';

/// Persistent reminder that unsynced offline data is still on the device.
///
/// Fills the one gap the in-app banner + reconnect auto-sync don't cover:
/// the app is fully closed when signal returns and nobody reopens it.
///
/// Android: a single `ongoing` (non-dismissible) notification.
/// iOS: Apple forbids sticky notifications, so we schedule an hourly repeat
/// that re-surfaces after a swipe. Both auto-clear the moment everything syncs.
class SyncReminderService extends GetxService {
  static const _channelId = 'offline_sync';
  static const _channelName = 'Offline Sync Reminders';
  static const _notifId = 1001;
  static const _title = 'Unsynced field data';
  // Generic on purpose: pre-scheduled iOS reminders must not show a stale count.
  static const _body =
      'You have reports waiting to sync — open the app when you have signal.';

  final _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;

  SyncService get _sync => Get.find<SyncService>();

  @override
  void onInit() {
    super.onInit();
    _init();
  }

  Future<void> _init() async {
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: false,
        requestSoundPermission: true,
      ),
    );
    await _plugin.initialize(settings);

    // Android 13+ needs an explicit runtime grant. Denial just means the
    // reminder no-ops; the in-app banner still covers the app-open case.
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();

    _ready = true;

    // React to future changes, and reconcile the current value right now
    // (handles an offline app restart where data is already queued).
    ever<int>(_sync.pendingCount, _onPendingChanged);
    await _onPendingChanged(_sync.pendingCount.value);
  }

  Future<void> _onPendingChanged(int count) async {
    if (!_ready) return;
    if (count > 0) {
      await _show();
    } else {
      await _plugin.cancel(_notifId);
    }
  }

  Future<void> _show() async {
    if (Platform.isAndroid) {
      // ongoing + !autoCancel = the user cannot swipe it away.
      await _plugin.show(
        _notifId,
        _title,
        _body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: 'Reminds you to sync offline work',
            importance: Importance.high,
            priority: Priority.high,
            ongoing: true,
            autoCancel: false,
            onlyAlertOnce: true,
          ),
        ),
      );
    } else {
      // iOS can't be sticky — reschedule an hourly repeat so a swipe comes back.
      await _plugin.cancel(_notifId);
      await _plugin.periodicallyShow(
        _notifId,
        _title,
        _body,
        RepeatInterval.hourly,
        const NotificationDetails(iOS: DarwinNotificationDetails()),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      );
    }
  }
}
