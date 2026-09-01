import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' as drift;
import 'package:get/get.dart' hide FormData, MultipartFile;
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';

class SyncService extends GetxService {
  final pendingCount    = 0.obs;
  final isSyncing       = false.obs;
  final syncingVisitIds = <String>{}.obs;

  Timer? _timer;

  ConnectivityService get _connectivity => Get.find<ConnectivityService>();
  AppDatabase         get _db           => Get.find<DbService>().db;

  @override
  void onInit() {
    super.onInit();
    _refreshSyncingVisitIds();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _trySyncAll());
    ever(_connectivity.isOnline, (online) { if (online) _trySyncAll(); });
  }

  Future<void> _refreshSyncingVisitIds() async {
    final rows = await _db.select(_db.syncQueue).get();
    final ids = <String>{};
    for (final row in rows) {
      switch (row.entityType) {
        case 'start-visit':
        case 'complete-visit':
          ids.add(row.entityId);
        case 'well-stop-report':
          // entityId = "$visitId-$stopId" — both are 36-char UUIDs
          if (row.entityId.length > 36) ids.add(row.entityId.substring(0, 36));
      }
    }
    syncingVisitIds
      ..clear()
      ..addAll(ids);
  }

  @override
  void onClose() {
    _timer?.cancel();
    super.onClose();
  }

  Future<void> syncNow() => _trySyncAll();

  Future<void> _trySyncAll() async {
    if (!_connectivity.isOnline.value || isSyncing.value) return;
    isSyncing.value = true;
    try {
      final queue = await (
        _db.select(_db.syncQueue)
          ..orderBy([(t) => drift.OrderingTerm.asc(t.createdAt)])
      ).get();
      pendingCount.value = queue.length;

      final dio = Get.find<DioService>().dio;
      for (final item in queue) {
        try {
          final payload = jsonDecode(item.payload) as Map<String, dynamic>;
          await _dispatch(dio, item.entityType, payload);
          await (_db.delete(_db.syncQueue)..where((t) => t.id.equals(item.id))).go();
          await _refreshSyncingVisitIds();
        } on DioException catch (e) {
          final status = e.response?.statusCode ?? 0;
          if (status >= 400 && status < 500) {
            // 4xx — permanent failure, drop the item and notify the driver
            await (_db.delete(_db.syncQueue)..where((t) => t.id.equals(item.id))).go();
            await _refreshSyncingVisitIds();
            final msg = e.response?.data?['error'] as String? ?? 'Action rejected by server';
            FecosSnackbar.error('Sync Failed', msg);
          } else {
            // 5xx or network — transient, increment retry and keep for next cycle
            await (_db.update(_db.syncQueue)..where((t) => t.id.equals(item.id)))
                .write(SyncQueueCompanion(retries: drift.Value(item.retries + 1)));
          }
        } catch (_) {
          await (_db.update(_db.syncQueue)..where((t) => t.id.equals(item.id)))
              .write(SyncQueueCompanion(retries: drift.Value(item.retries + 1)));
        }
      }
      // Always re-read DB count — arithmetic drift causes stale counts
      final remaining = await _db.select(_db.syncQueue).get();
      pendingCount.value = remaining.length;
    } finally {
      isSyncing.value = false;
    }
  }

  Future<void> _dispatch(
    Dio dio, String entityType, Map<String, dynamic> p,
  ) async {
    switch (entityType) {
      case 'deliver-stop':      await _syncDeliverStop(dio, p);
      case 'skip-stop':         await _syncSkipStop(dio, p);
      case 'load-confirmation': await _syncLoadConfirmation(dio, p);
      case 'pre-trip':          await _syncPreTrip(dio, p);
      case 'route-status':      await _syncRouteStatus(dio, p);
      case 'return-inventory':  await _syncReturnInventory(dio, p);
      case 'start-visit':       await _syncStartVisit(dio, p);
      case 'complete-visit':    await _syncCompleteVisit(dio, p);
      case 'well-stop-report':  await _syncWellStopReport(dio, p);
    }
  }

  // Deliver stop: upload local photo first, then patch the stop
  Future<void> _syncDeliverStop(Dio dio, Map<String, dynamic> p) async {
    final localPath = p['localPhotoPath'] as String?;
    var photoUrl = '';

    if (localPath != null && localPath.isNotEmpty && File(localPath).existsSync()) {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          localPath,
          filename: 'delivery_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });
      final upload = await dio.post<Map<String, dynamic>>('/uploads/photo', data: formData);
      photoUrl = upload.data!['data']['url'] as String;
    }

    await dio.patch<void>(
      '/routes/${p['routeId']}/stops/${p['stopId']}/deliver',
      data: {
        'lat':         p['lat'],
        'lng':         p['lng'],
        'photoUrl':    photoUrl,
        'items':       p['items'],
        if (p['notes'] != null) 'notes': p['notes'],
        'deliveredAt': p['performedAt'],
      },
    );
  }

  Future<void> _syncSkipStop(Dio dio, Map<String, dynamic> p) async {
    await dio.patch<void>(
      '/routes/${p['routeId']}/stops/${p['stopId']}/status',
      queryParameters: {'status': 'SKIPPED', 'skipReason': p['skipReason']},
    );
  }

  Future<void> _syncLoadConfirmation(Dio dio, Map<String, dynamic> p) async {
    await dio.post<void>(
      '/routes/${p['routeId']}/load-confirmation',
      data: {'items': p['items']},
    );
  }

  Future<void> _syncPreTrip(Dio dio, Map<String, dynamic> p) async {
    await dio.post<void>(
      '/routes/${p['routeId']}/pre-trip',
      data: {'hasIssues': p['hasIssues'], 'notes': p['notes']},
    );
  }

  Future<void> _syncRouteStatus(Dio dio, Map<String, dynamic> p) async {
    await dio.patch<void>(
      '/routes/${p['routeId']}/status',
      queryParameters: {'status': p['status']},
    );
  }

  Future<void> _syncReturnInventory(Dio dio, Map<String, dynamic> p) async {
    await dio.post<void>(
      '/routes/${p['routeId']}/return-inventory',
      data: {'items': p['items']},
    );
  }

  Future<void> _syncStartVisit(Dio dio, Map<String, dynamic> p) async {
    await dio.patch<void>(
      '/service-visits/${p['visitId']}',
      data: {'status': 'IN_PROGRESS'},
    );
  }

  Future<void> _syncCompleteVisit(Dio dio, Map<String, dynamic> p) async {
    await dio.patch<void>(
      '/service-visits/${p['visitId']}',
      data: {'status': 'COMPLETED'},
    );
  }

  Future<void> _syncWellStopReport(Dio dio, Map<String, dynamic> p) async {
    // 1. Upload site photo if captured offline
    String? photoUrl;
    final localPhoto = p['localPhotoPath'] as String?;
    if (localPhoto != null && localPhoto.isNotEmpty && File(localPhoto).existsSync()) {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          localPhoto,
          filename: 'photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });
      final res = await dio.post<Map<String, dynamic>>('/uploads/photo', data: form);
      photoUrl = res.data!['data']['url'] as String;
    }

    // 2. Upload sample photo if captured offline
    String? samplePhotoUrl;
    final localSample = p['localSamplePhotoPath'] as String?;
    if (localSample != null && localSample.isNotEmpty && File(localSample).existsSync()) {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          localSample,
          filename: 'sample_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });
      final res = await dio.post<Map<String, dynamic>>('/uploads/photo', data: form);
      samplePhotoUrl = res.data!['data']['url'] as String;
    }

    // 3. Upload signature (required — throws if missing/deleted so item stays in queue)
    final sigPath = p['localSignaturePath'] as String;
    final sigForm = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        sigPath,
        filename: 'sig_${DateTime.now().millisecondsSinceEpoch}.png',
      ),
    });
    final sigRes = await dio.post<Map<String, dynamic>>('/uploads/signature', data: sigForm);
    final signatureUrl = sigRes.data!['data']['url'] as String;

    // 4. POST treatment report
    await dio.post<void>(
      '/service-visits/${p['visitId']}/stops/${p['stopId']}/treatment-report',
      data: {
        'performedAt':    p['performedAt'],
        'syncedAt':       DateTime.now().toUtc().toIso8601String(),
        'gpsLat':         p['gpsLat'],
        'gpsLng':         p['gpsLng'],
        'gpsCapturedAt':  p['gpsCapturedAt'],
        'photoUrl':       photoUrl,
        'soar':           p['soar'],
        'soarNote':       p['soarNote'],
        'sampleType':     p['sampleType'],
        'sampleNotes':    p['sampleNotes'],
        'samplePhotoUrl': samplePhotoUrl,
        'signatureUrl':   signatureUrl,
        'signerName':     p['signerName'],
        'signedAt':       p['signedAt'],
        'notes':          p['notes'],
        'lines':          p['lines'],
      },
    );
  }
}
