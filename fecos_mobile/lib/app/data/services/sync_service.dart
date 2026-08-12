import 'dart:async';
import 'package:drift/drift.dart' as drift;
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';

class SyncService extends GetxService {
  final pendingCount = 0.obs;
  final isSyncing = false.obs;

  Timer? _timer;

  ConnectivityService get _connectivity => Get.find<ConnectivityService>();
  AppDatabase get _db => Get.find<DbService>().db;

  @override
  void onInit() {
    super.onInit();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _trySyncAll());
    ever(_connectivity.isOnline, (online) { if (online) _trySyncAll(); });
  }

  @override
  void onClose() {
    _timer?.cancel();
    super.onClose();
  }

  Future<void> _trySyncAll() async {
    if (!_connectivity.isOnline.value || isSyncing.value) return;
    isSyncing.value = true;
    try {
      final queue = await _db.select(_db.syncQueue).get();
      pendingCount.value = queue.length;
      final dio = Get.find<DioService>().dio;
      for (final item in queue) {
        try {
          await dio.post<void>('/sync', data: {
            'entityType': item.entityType,
            'entityId': item.entityId,
            'operation': item.operation,
            'payload': item.payload,
          });
          await (_db.delete(_db.syncQueue)
                ..where((t) => t.id.equals(item.id)))
              .go();
          pendingCount.value--;
        } catch (_) {
          await (_db.update(_db.syncQueue)
                ..where((t) => t.id.equals(item.id)))
              .write(SyncQueueCompanion(
                retries: drift.Value(item.retries + 1),
              ));
        }
      }
    } finally {
      isSyncing.value = false;
    }
  }

  Future<void> syncNow() => _trySyncAll();
}
