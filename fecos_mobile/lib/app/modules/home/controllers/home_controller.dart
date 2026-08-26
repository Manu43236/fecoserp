import 'package:dio/dio.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/dashboard_data.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/models/user_model.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';

class HomeController extends GetxController {
  final connectivity = Get.find<ConnectivityService>();
  final auth = Get.find<AuthController>();
  final _dio = Get.find<DioService>().dio;

  // Service tech state
  final dashboard = Rxn<DashboardData>();
  final upcoming = <MyVisit>[].obs;

  // Truck driver state
  final todayRoutes = <RouteModel>[].obs;

  final isLoading = true.obs;
  final hasError = false.obs;

  bool get isTruckDriver => auth.user.value?.role == UserRole.truckDriver;

  @override
  void onInit() {
    super.onInit();
    load();
  }

  Future<void> load() async {
    isLoading.value = true;
    hasError.value = false;
    try {
      if (isTruckDriver) {
        await _loadDriverData();
      } else {
        await _loadServiceTechData();
      }
    } on DioException {
      hasError.value = true;
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
    final res = await _dio.get<Map<String, dynamic>>(
      '/routes',
      queryParameters: {
        'routeDate': dateStr,
        'size': 50,
        if (driverId != null) 'driverId': driverId,
      },
    );
    final content = res.data!['data']['content'] as List;
    todayRoutes.value = content
        .map((e) => RouteModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
