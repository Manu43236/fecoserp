import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/local/app_database.dart';

export 'package:fecos_mobile/app/data/local/app_database.dart';

class DbService extends GetxService {
  late final AppDatabase db;

  @override
  void onInit() {
    super.onInit();
    db = AppDatabase();
  }

  @override
  void onClose() {
    db.close();
    super.onClose();
  }

  Future<void> cacheResponse(String key, String json) =>
      db.into(db.responseCache).insertOnConflictUpdate(
        ResponseCacheCompanion.insert(cacheKey: key, json: json),
      );

  Future<String?> getCachedResponse(String key) async {
    final row = await (db.select(db.responseCache)
          ..where((t) => t.cacheKey.equals(key)))
        .getSingleOrNull();
    return row?.json;
  }

  /// Merges pending SyncQueue state into a raw visit list from the server.
  /// Prevents stale server data from overwriting offline work during sync.
  ///
  /// Rules applied per queued entry:
  ///   start-visit    (entityId = visitId)        → force status IN_PROGRESS
  ///   complete-visit (entityId = visitId)        → force status COMPLETED
  ///   well-stop-report (entityId = visitId-stopId) → force hasReport true
  Future<List<Map<String, dynamic>>> mergeQueuedState(
      List<Map<String, dynamic>> raw) async {
    final rows = await db.select(db.syncQueue).get();
    if (rows.isEmpty) return raw;

    final pendingStartIds = <String>{};
    final pendingCompleteIds = <String>{};
    final pendingReportStopIds = <String>{};

    for (final row in rows) {
      switch (row.entityType) {
        case 'start-visit':
          pendingStartIds.add(row.entityId);
        case 'complete-visit':
          pendingCompleteIds.add(row.entityId);
        case 'well-stop-report':
          // entityId format: "visitId-stopId"
          final dash = row.entityId.lastIndexOf('-');
          if (dash != -1) {
            pendingReportStopIds.add(row.entityId.substring(dash + 1));
          }
      }
    }

    return raw.map((v) {
      final visitId = v['id'] as String;
      var status = v['status'] as String;

      if (pendingCompleteIds.contains(visitId)) {
        status = 'COMPLETED';
      } else if (pendingStartIds.contains(visitId)) {
        if (status == 'SCHEDULED') status = 'IN_PROGRESS';
      }

      final stops = (v['stops'] as List).cast<Map<String, dynamic>>();
      final mergedStops = stops.map((s) {
        if (pendingReportStopIds.contains(s['id'] as String?) &&
            s['hasReport'] != true) {
          return {...s, 'hasReport': true};
        }
        return s;
      }).toList();

      final changed = status != v['status'] ||
          mergedStops.any((s) => s['hasReport'] == true &&
              (stops.firstWhere((o) => o['id'] == s['id'])['hasReport'] !=
                  true));
      if (!changed) return v;
      return {...v, 'status': status, 'stops': mergedStops};
    }).toList();
  }
}
