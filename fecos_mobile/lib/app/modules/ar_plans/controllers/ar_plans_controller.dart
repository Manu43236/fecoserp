import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/data/models/plan_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';

const _statuses = ['ALL', 'ACTIVE', 'DRAFT', 'PAUSED', 'SUSPENDED', 'COMPLETED'];

class ArPlansController extends GetxController {
  final _dio = Get.find<DioService>().dio;

  final state = Rx<AsyncState<List<PlanModel>>>(const AsyncLoading());
  final selectedStatus = 'ALL'.obs;

  List<String> get statuses => _statuses;

  @override
  void onInit() {
    super.onInit();
    load();
  }

  Future<void> load({String? status}) async {
    if (status != null) selectedStatus.value = status;
    state.value = const AsyncLoading();
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/plans',
        queryParameters: {
          if (selectedStatus.value != 'ALL') 'status': selectedStatus.value,
          'size': 200,
        },
      );
      final plans = (res.data!['data']['content'] as List)
          .map((e) => PlanModel.fromJson(e as Map<String, dynamic>))
          .toList();
      state.value = AsyncSuccess(plans);
    } on Exception catch (e) {
      state.value = AsyncError(e.toString());
    }
  }
}
