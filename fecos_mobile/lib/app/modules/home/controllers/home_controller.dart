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
  final upcoming = <MyVisit>[].obs;

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

  @override
  void onInit() {
    super.onInit();
    load();
    ever(connectivity.isOnline, (online) { if (online) load(); });
    ever(syncService.isSyncing, (syncing) {
      if (!syncing && syncService.pendingCount.value == 0) load();
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

  Future<void> _loadServiceTechData() async {
    final results = await Future.wait([
      _dio.get<Map<String, dynamic>>('/service-tech/dashboard'),
      _dio.get<Map<String, dynamic>>('/my-upcoming-visits'),
    ]);
    dashboard.value = DashboardData.fromJson(
        results[0].data!['data'] as Map<String, dynamic>);
    upcoming.value = (results[1].data!['data'] as List)
        .map((v) => MyVisit.fromJson(v as Map<String, dynamic>))
        .toList();
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
