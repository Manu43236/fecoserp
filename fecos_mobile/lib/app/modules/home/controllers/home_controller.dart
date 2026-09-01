import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/dashboard_data.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/models/user_model.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';

class HomeController extends GetxController {
  final connectivity  = Get.find<ConnectivityService>();
  final auth          = Get.find<AuthController>();
  final syncService   = Get.find<SyncService>();
  final _dio          = Get.find<DioService>().dio;
  final _dbService    = Get.find<DbService>();

  // Service tech state
  final dashboard = Rxn<DashboardData>();
  final todayVisits = <MyVisit>[].obs;
  final upcoming = <MyVisit>[].obs;
  final todayVisitsVersion = 0.obs;

  // Truck driver state
  final todayRoutes = <RouteModel>[].obs;

  // Account rep state
  final arPendingCount = 0.obs;
  final arClientCount = 0.obs;
  final arCriticalCount = 0.obs;

  final isLoading = true.obs;
  final hasError = false.obs;

  bool get isTruckDriver => auth.user.value?.role == UserRole.truckDriver;
  bool get isAccountRep => auth.user.value?.role == UserRole.accountRep;

  bool _hadPending = false;

  @override
  void onInit() {
    super.onInit();
    load();
    ever(connectivity.isOnline, (online) { if (online) load(); });
    // Only reload home after a sync actually drained the queue — not on every empty cycle
    ever(syncService.pendingCount, (count) {
      if (count > 0) {
        _hadPending = true;
      } else if (_hadPending) {
        _hadPending = false;
        load();
      }
    });
  }

  Future<void> load() async {
    isLoading.value = true;
    hasError.value = false;
    try {
      if (isTruckDriver) {
        await _loadDriverData();
      } else if (isAccountRep) {
        await _loadArData();
      } else {
        await _loadServiceTechData();
      }
    } on DioException {
      if (!isTruckDriver) hasError.value = true;
      // Driver offline error is handled inside _loadDriverData via cache
    } finally {
      isLoading.value = false;
    }
  }

  String get _todayStr {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  Future<void> _loadServiceTechData() async {
    if (connectivity.isOnline.value) {
      try {
        final results = await Future.wait([
          _dio.get<Map<String, dynamic>>('/service-tech/dashboard'),
          _dio.get<Map<String, dynamic>>('/my-upcoming-visits'),
          _dio.get<Map<String, dynamic>>(
            '/my-visits',
            queryParameters: {'date': _todayStr},
          ),
        ]);
        final dashData    = results[0].data!['data'] as Map<String, dynamic>;
        final upcomingData = results[1].data!['data'] as List;
        final serverToday =
            (results[2].data!['data'] as List).cast<Map<String, dynamic>>();
        final todayData = await _dbService.mergeQueuedState(serverToday);
        await _dbService.cacheResponse('st-dashboard', jsonEncode(dashData));
        await _dbService.cacheResponse('st-upcoming', jsonEncode(upcomingData));
        await _dbService.cacheResponse('st-today-visits', jsonEncode(todayData));
        dashboard.value = DashboardData.fromJson(dashData);
        upcoming.value = upcomingData
            .map((v) => MyVisit.fromJson(v as Map<String, dynamic>))
            .toList();
        todayVisits.value = todayData.map(MyVisit.fromJson).toList();
        todayVisitsVersion.value++;
      } on DioException {
        await _loadServiceTechFromCache();
      }
    } else {
      await _loadServiceTechFromCache();
    }
  }

  Future<void> _loadServiceTechFromCache() async {
    final cachedDash    = await _dbService.getCachedResponse('st-dashboard');
    final cachedUpcoming = await _dbService.getCachedResponse('st-upcoming');
    final cachedToday   = await _dbService.getCachedResponse('st-today-visits');
    if (cachedDash != null) {
      dashboard.value = DashboardData.fromJson(
          jsonDecode(cachedDash) as Map<String, dynamic>);
      upcoming.value = cachedUpcoming != null
          ? (jsonDecode(cachedUpcoming) as List)
              .map((v) => MyVisit.fromJson(v as Map<String, dynamic>))
              .toList()
          : [];
      todayVisits.value = cachedToday != null
          ? (jsonDecode(cachedToday) as List)
              .map((v) => MyVisit.fromJson(v as Map<String, dynamic>))
              .toList()
          : [];
    } else {
      hasError.value = true;
    }
  }

  Future<void> _loadDriverData() async {
    final today = DateTime.now();
    final dateStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final driverId = auth.user.value?.id;
    const cacheKey = 'driver-home-routes';

    if (connectivity.isOnline.value) {
      final res = await _dio.get<Map<String, dynamic>>(
        '/routes',
        queryParameters: {
          'routeDate': dateStr,
          'size': 50,
          if (driverId != null) 'driverId': driverId,
        },
      );
      final content = res.data!['data']['content'] as List;
      await _dbService.cacheResponse(cacheKey, jsonEncode(content));
      todayRoutes.value = content
          .map((e) => RouteModel.fromJson(e as Map<String, dynamic>))
          .toList();
      _prefetchRouteDetails(todayRoutes.toList());
    } else {
      final cached = await _dbService.getCachedResponse(cacheKey);
      if (cached != null) {
        final content = jsonDecode(cached) as List;
        todayRoutes.value = content
            .map((e) => RouteModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      // No cache yet = empty list, no error — driver can see they have no routes
    }
  }

  // Prefetch each route detail in background so they're available offline.
  Future<void> _prefetchRouteDetails(List<RouteModel> routes) async {
    for (final route in routes) {
      try {
        final existing = await _dbService.getCachedResponse('route-${route.id}');
        if (existing != null) continue;
        final res = await _dio.get<Map<String, dynamic>>('/routes/${route.id}');
        await _dbService.cacheResponse(
            'route-${route.id}', jsonEncode(res.data!['data']));
      } catch (_) {
        // non-critical — skip on failure
      }
    }
  }

  void patchVisitStatus(String visitId, String newStatus) {
    final idx = todayVisits.indexWhere((v) => v.id == visitId);
    if (idx == -1) return;
    final v = todayVisits[idx];
    todayVisits[idx] = MyVisit(
      id: v.id,
      name: v.name,
      visitDate: v.visitDate,
      status: newStatus,
      stops: v.stops,
    );
    todayVisitsVersion.value++;
    _patchTodayStatusCache(visitId, newStatus);
  }

  Future<void> _patchTodayStatusCache(
      String visitId, String newStatus) async {
    final cached = await _dbService.getCachedResponse('st-today-visits');
    if (cached == null) return;
    final raw = (jsonDecode(cached) as List).cast<Map<String, dynamic>>();
    final idx = raw.indexWhere((v) => v['id'] == visitId);
    if (idx == -1) return;
    raw[idx] = {...raw[idx], 'status': newStatus};
    await _dbService.cacheResponse('st-today-visits', jsonEncode(raw));
  }

  Future<void> markStopReported(String visitId, String stopId) async {
    final vIdx = todayVisits.indexWhere((v) => v.id == visitId);
    if (vIdx != -1) {
      final v = todayVisits[vIdx];
      final updatedStops = v.stops.map((s) {
        if (s.id != stopId) return s;
        return MyVisitStop(
          id: s.id,
          wellId: s.wellId,
          wellName: s.wellName,
          leaseName: s.leaseName,
          clientName: s.clientName,
          sequence: s.sequence,
          status: s.status,
          hasSoar: s.hasSoar,
          soarAcknowledged: s.soarAcknowledged,
          hasReport: true,
        );
      }).toList();
      todayVisits[vIdx] = MyVisit(
        id: v.id,
        name: v.name,
        visitDate: v.visitDate,
        status: v.status,
        stops: updatedStops,
      );
    }

    todayVisitsVersion.value++;

    final cachedToday = await _dbService.getCachedResponse('st-today-visits');
    if (cachedToday == null) return;
    final raw = (jsonDecode(cachedToday) as List).cast<Map<String, dynamic>>();
    final rawVIdx = raw.indexWhere((v) => v['id'] == visitId);
    if (rawVIdx == -1) return;
    final stops =
        (raw[rawVIdx]['stops'] as List).cast<Map<String, dynamic>>();
    final sIdx = stops.indexWhere((s) => s['id'] == stopId);
    if (sIdx == -1) return;
    stops[sIdx] = {...stops[sIdx], 'hasReport': true};
    raw[rawVIdx] = {...raw[rawVIdx], 'stops': stops};
    await _dbService.cacheResponse('st-today-visits', jsonEncode(raw));
  }

  Future<void> _loadArData() async {
    final userId = auth.user.value?.id;
    final results = await Future.wait([
      _dio.get<Map<String, dynamic>>(
        '/lab/pending-approvals',
        queryParameters: {'size': 200},
      ),
      _dio.get<Map<String, dynamic>>(
        '/clients',
        queryParameters: {
          if (userId != null) 'accountRepId': userId,
          'isActive': true,
          'size': 200,
        },
      ),
    ]);

    final samples = (results[0].data!['data']['content'] as List);
    arPendingCount.value = samples.length;
    arCriticalCount.value = samples.where((s) {
      final result = (s as Map<String, dynamic>)['result'] as Map<String, dynamic>?;
      return result?['hasCriticalValues'] as bool? ?? false;
    }).length;

    final clients = results[1].data!['data']['content'] as List;
    arClientCount.value = clients.length;
  }
}
