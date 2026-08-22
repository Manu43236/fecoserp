import 'package:dio/dio.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/dashboard_data.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';

class HomeController extends GetxController {
  final connectivity = Get.find<ConnectivityService>();
  final auth = Get.find<AuthController>();
  final _dio = Get.find<DioService>().dio;

  final dashboard = Rxn<DashboardData>();
  final upcoming = <MyVisit>[].obs;
  final isLoading = true.obs;
  final hasError = false.obs;

  @override
  void onInit() {
    super.onInit();
    load();
  }

  Future<void> load() async {
    isLoading.value = true;
    hasError.value = false;
    try {
      final results = await Future.wait([
        _dio.get<Map<String, dynamic>>('/service-tech/dashboard'),
        _dio.get<Map<String, dynamic>>('/my-upcoming-visits'),
      ]);
      dashboard.value = DashboardData.fromJson(
          results[0].data!['data'] as Map<String, dynamic>);
      upcoming.value = (results[1].data!['data'] as List)
          .map((v) => MyVisit.fromJson(v as Map<String, dynamic>))
          .toList();
    } on DioException {
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  }
}
