import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:get/get.dart' hide FormData, MultipartFile;
import 'package:image_picker/image_picker.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';

class DeliveryController extends GetxController {
  final _dio          = Get.find<DioService>().dio;
  final _connectivity = Get.find<ConnectivityService>();
  final _dbService    = Get.find<DbService>();
  final _picker       = ImagePicker();

  AppDatabase get _db => _dbService.db;

  final route      = Rxn<RouteModel>();
  final isLoading  = true.obs;
  final hasError   = false.obs;
  final isUpdating = false.obs;

  late final String routeId;

  @override
  void onInit() {
    super.onInit();
    routeId = Get.parameters['id'] ?? '';
    if (routeId.isNotEmpty) load();
    ever(_connectivity.isOnline, (online) { if (online) load(); });
  }

  // Updates in-memory route AND the cache — call after every online API write.
  Future<void> _setRoute(Map<String, dynamic> data) async {
    await _dbService.cacheResponse('route-$routeId', jsonEncode(data));
    route.value = RouteModel.fromJson(data);
  }

  // ── Load route (cache-aside) ────────────────────────────────────────────────

  Future<void> load() async {
    isLoading.value = true;
    hasError.value  = false;
    try {
      if (_connectivity.isOnline.value) {
        final res  = await _dio.get<Map<String, dynamic>>('/routes/$routeId');
        await _setRoute(res.data!['data'] as Map<String, dynamic>);
      } else {
        final cached = await _dbService.getCachedResponse('route-$routeId');
        if (cached != null) {
          route.value = RouteModel.fromJson(jsonDecode(cached) as Map<String, dynamic>);
        } else {
          hasError.value = true;
        }
      }
    } on DioException {
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  // ── Pre-trip ────────────────────────────────────────────────────────────────

  Future<bool> submitPreTrip({required bool hasIssues, String? notes}) async {
    final performedAt = DateTime.now().toIso8601String();
    if (!_connectivity.isOnline.value) {
      await _enqueue('pre-trip', routeId, {
        'routeId': routeId, 'hasIssues': hasIssues,
        'notes': notes, 'performedAt': performedAt,
      });
      _patchRouteLocally(preTripConfirmedAt: performedAt);
      _showOfflineSnack();
      return true;
    }
    isUpdating.value = true;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/routes/$routeId/pre-trip',
        data: {'hasIssues': hasIssues, 'notes': notes},
      );
      await _setRoute(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException {
      FecosSnackbar.error('Error', 'Could not submit pre-trip check');
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  // ── Load confirmation ───────────────────────────────────────────────────────

  Future<bool> confirmLoad(Map<String, double> loadedQtyMap) async {
    final performedAt = DateTime.now().toIso8601String();
    final items = loadedQtyMap.entries
        .map((e) => {'itemId': e.key, 'loadedQty': e.value})
        .toList();
    if (!_connectivity.isOnline.value) {
      await _enqueue('load-confirmation', routeId, {
        'routeId': routeId, 'items': items, 'performedAt': performedAt,
      });
      _patchRouteLocally(loadConfirmedAt: performedAt);
      _showOfflineSnack();
      return true;
    }
    isUpdating.value = true;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/routes/$routeId/load-confirmation',
        data: {'items': items},
      );
      await _setRoute(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException catch (e) {
      final msg = e.response?.data?['error'] as String? ?? 'Could not confirm load';
      FecosSnackbar.error('Error', msg);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  // ── Route status (start / cancel) ──────────────────────────────────────────

  Future<void> updateRouteStatus(String status) async {
    final performedAt = DateTime.now().toIso8601String();
    if (!_connectivity.isOnline.value) {
      await _enqueue('route-status', routeId, {
        'routeId': routeId, 'status': status, 'performedAt': performedAt,
      });
      _patchRouteLocally(status: status);
      _showOfflineSnack();
      return;
    }
    isUpdating.value = true;
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/status',
        queryParameters: {'status': status},
      );
      await _setRoute(res.data!['data'] as Map<String, dynamic>);
      FecosSnackbar.success('Updated', 'Route marked as ${_statusLabel(status)}');
    } on DioException {
      FecosSnackbar.error('Error', 'Could not update route status');
    } finally {
      isUpdating.value = false;
    }
  }

  // ── Deliver stop (online path — photo already uploaded by view) ─────────────

  Future<bool> deliverStop(
    String stopId, String photoUrl, double lat, double lng,
    Map<String, double> actualQtyMap, String? notes,
    {String? deliveredAt}
  ) async {
    isUpdating.value = true;
    try {
      final items = actualQtyMap.entries
          .map((e) => {'itemId': e.key, 'actualQty': e.value})
          .toList();
      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/stops/$stopId/deliver',
        data: {
          'lat': lat, 'lng': lng, 'photoUrl': photoUrl,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
          'deliveredAt': deliveredAt,
          'items': items,
        },
      );
      await _setRoute(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 0;
      final msg  = e.response?.data?['error'] as String? ?? e.message ?? 'Unknown error';
      FecosSnackbar.error('Error ($code)', msg);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  // ── Queue deliver stop (offline path — photo stays local) ──────────────────

  Future<void> queueDeliverStop({
    required String stopId,
    required String localPhotoPath,
    required double lat,
    required double lng,
    required Map<String, double> actualQtyMap,
    String? notes,
    required DateTime performedAt,
  }) async {
    final items = actualQtyMap.entries
        .map((e) => {'itemId': e.key, 'actualQty': e.value})
        .toList();
    await _enqueue('deliver-stop', '$routeId-$stopId', {
      'routeId': routeId, 'stopId': stopId,
      'lat': lat, 'lng': lng,
      'localPhotoPath': localPhotoPath,
      'items': items, 'notes': notes,
      'performedAt': performedAt.toIso8601String(),
    });
    _updateStopLocally(stopId, 'DELIVERED', deliveredAt: performedAt.toIso8601String());
    _showOfflineSnack();
  }

  // ── Skip stop ───────────────────────────────────────────────────────────────

  Future<void> skipStop(String stopId, String skipReason) async {
    final performedAt = DateTime.now().toIso8601String();
    if (!_connectivity.isOnline.value) {
      await _enqueue('skip-stop', '$routeId-$stopId', {
        'routeId': routeId, 'stopId': stopId,
        'skipReason': skipReason, 'performedAt': performedAt,
      });
      _updateStopLocally(stopId, 'SKIPPED', skipReason: skipReason);
      _showOfflineSnack();
      return;
    }
    isUpdating.value = true;
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/stops/$stopId/status',
        queryParameters: {'status': 'SKIPPED', 'skipReason': skipReason},
      );
      await _setRoute(res.data!['data'] as Map<String, dynamic>);
    } on DioException {
      FecosSnackbar.error('Error', 'Could not skip stop');
    } finally {
      isUpdating.value = false;
    }
  }

  // ── Return inventory ────────────────────────────────────────────────────────

  Future<bool> returnInventory(List<Map<String, dynamic>> items) async {
    final performedAt = DateTime.now().toIso8601String();
    if (!_connectivity.isOnline.value) {
      await _enqueue('return-inventory', routeId, {
        'routeId': routeId, 'items': items, 'performedAt': performedAt,
      });
      _patchRouteLocally(status: 'COMPLETED');
      _showOfflineSnack();
      return true;
    }
    isUpdating.value = true;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/routes/$routeId/return-inventory',
        data: {'items': items},
      );
      await _setRoute(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException {
      FecosSnackbar.error('Error', 'Could not complete route');
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  // ── Photo helper ────────────────────────────────────────────────────────────

  Future<XFile?> takePhoto() => _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 75,
        maxWidth: 1280,
      );

  // ── Private helpers ─────────────────────────────────────────────────────────

  Future<void> _enqueue(
    String entityType, String entityId, Map<String, dynamic> payload,
  ) async {
    await _db.into(_db.syncQueue).insert(SyncQueueCompanion.insert(
      entityType: entityType,
      entityId:   entityId,
      operation:  'UPDATE',
      payload:    jsonEncode(payload),
    ));
    final count = await _db.select(_db.syncQueue).get();
    Get.find<SyncService>().pendingCount.value = count.length;
  }

  void _updateStopLocally(String stopId, String status, {String? skipReason, String? deliveredAt}) {
    final current = route.value;
    if (current == null) return;
    final stops = current.stops
        .map((s) => s.id == stopId
            ? s.copyWith(status: status, skipReason: skipReason, deliveredAt: deliveredAt)
            : s)
        .toList();
    route.value = current.copyWith(stops: stops);
    _persistRouteToCache(route.value!);
  }

  void _patchRouteLocally({
    String? status,
    String? preTripConfirmedAt,
    String? loadConfirmedAt,
  }) {
    final current = route.value;
    if (current == null) return;
    route.value = current.copyWith(
      status:             status,
      preTripConfirmedAt: preTripConfirmedAt,
      loadConfirmedAt:    loadConfirmedAt,
    );
    _persistRouteToCache(route.value!);
    if (status != null) _updateHomeRoutesStatus(status);
  }

  // Updates the home routes list cache so the home screen reflects
  // the new route status immediately without waiting for a server refresh.
  Future<void> _updateHomeRoutesStatus(String status) async {
    const key = 'driver-home-routes';
    final cached = await _dbService.getCachedResponse(key);
    if (cached == null) return;
    final list = (jsonDecode(cached) as List).cast<Map<String, dynamic>>();
    final updated = list.map((item) =>
      item['id'] == routeId ? {...item, 'status': status} : item,
    ).toList();
    await _dbService.cacheResponse(key, jsonEncode(updated));
  }

  // Writes the current in-memory route back to response_cache so
  // the next offline load() returns the correct optimistic state.
  Future<void> _persistRouteToCache(RouteModel r) async {
    final cached = await _dbService.getCachedResponse('route-$routeId');
    if (cached == null) return;
    final json = jsonDecode(cached) as Map<String, dynamic>;
    final updated = <String, dynamic>{
      ...json,
      'status': r.status,
      if (r.preTripConfirmedAt != null) 'preTripConfirmedAt': r.preTripConfirmedAt,
      if (r.loadConfirmedAt    != null) 'loadConfirmedAt':    r.loadConfirmedAt,
      'stops': r.stops.map((s) {
        final orig = (json['stops'] as List? ?? [])
            .cast<Map<String, dynamic>>()
            .firstWhere((e) => e['id'] == s.id, orElse: () => <String, dynamic>{});
        return {
          ...orig,
          'status': s.status,
          if (s.skipReason != null) 'skipReason': s.skipReason,
        };
      }).toList(),
    };
    await _dbService.cacheResponse('route-$routeId', jsonEncode(updated));
  }

  void _showOfflineSnack() =>
      FecosSnackbar.info('Saved Offline', 'Will sync when connected');

  String _statusLabel(String status) => switch (status) {
        'IN_PROGRESS' => 'In Progress',
        'COMPLETED'   => 'Completed',
        'CANCELLED'   => 'Cancelled',
        _             => status,
      };
}
