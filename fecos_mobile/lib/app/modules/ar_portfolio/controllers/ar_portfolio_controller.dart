import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/data/models/client_model.dart';
import 'package:fecos_mobile/app/data/models/plan_model.dart';
import 'package:fecos_mobile/app/data/models/lab_sample_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';

class ArPortfolioController extends GetxController {
  final _dio = Get.find<DioService>().dio;
  final _auth = Get.find<AuthController>();

  final state = Rx<AsyncState<List<ClientModel>>>(const AsyncLoading());
  final plans = <PlanModel>[].obs;
  final pendingSamples = <LabSampleModel>[].obs;
  final search = ''.obs;

  @override
  void onInit() {
    super.onInit();
    load();
  }

  Future<void> load() async {
    state.value = const AsyncLoading();
    try {
      final userId = _auth.user.value?.id;
      final results = await Future.wait([
        _dio.get<Map<String, dynamic>>(
          '/clients',
          queryParameters: {
            if (userId != null) 'accountRepId': userId,
            'isActive': true,
            'size': 200,
          },
        ),
        _dio.get<Map<String, dynamic>>(
          '/plans',
          queryParameters: {'size': 500},
        ),
        _dio.get<Map<String, dynamic>>(
          '/lab/pending-approvals',
          queryParameters: {'size': 200},
        ),
      ]);

      final clients = (results[0].data!['data']['content'] as List)
          .map((e) => ClientModel.fromJson(e as Map<String, dynamic>))
          .toList();

      plans.value = (results[1].data!['data']['content'] as List)
          .map((e) => PlanModel.fromJson(e as Map<String, dynamic>))
          .toList();

      pendingSamples.value = (results[2].data!['data']['content'] as List)
          .map((e) => LabSampleModel.fromJson(e as Map<String, dynamic>))
          .toList();

      state.value = AsyncSuccess(clients);
    } on Exception catch (e) {
      state.value = AsyncError(e.toString());
    }
  }

  List<ClientModel> get filteredClients {
    final s = state.value;
    if (s is! AsyncSuccess<List<ClientModel>>) return [];
    final q = search.value.toLowerCase();
    if (q.isEmpty) return s.data;
    return s.data
        .where((c) =>
            c.companyName.toLowerCase().contains(q) ||
            (c.contactName ?? '').toLowerCase().contains(q))
        .toList();
  }

  List<PlanModel> plansFor(String companyName) =>
      plans.where((p) => p.clientName == companyName).toList();

  int pendingCountFor(String companyName) =>
      pendingSamples.where((s) => s.clientName == companyName).length;
}
