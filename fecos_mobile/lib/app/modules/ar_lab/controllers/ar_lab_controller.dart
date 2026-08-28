import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/data/models/lab_sample_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/home/controllers/home_controller.dart';

class ArLabController extends GetxController {
  final _dio = Get.find<DioService>().dio;

  final state = Rx<AsyncState<List<LabSampleModel>>>(const AsyncLoading());
  final search = ''.obs;
  final selectedFilter = 'ALL'.obs;
  final approvalLoading = false.obs;

  static const filters = ['ALL', 'PENDING', 'APPROVED', 'URGENT', 'HIGH'];

  @override
  void onInit() {
    super.onInit();
    load();
  }

  Future<void> load() async {
    state.value = const AsyncLoading();
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/lab/samples',
        queryParameters: {'size': 200},
      );
      final items = (res.data!['data']['content'] as List)
          .map((e) => LabSampleModel.fromJson(e as Map<String, dynamic>))
          .toList();
      state.value = AsyncSuccess(items);
    } catch (e) {
      state.value = AsyncError(e.toString());
    }
  }

  List<LabSampleModel> get filtered {
    final s = state.value;
    if (s is! AsyncSuccess<List<LabSampleModel>>) return [];
    var list = s.data;

    final f = selectedFilter.value;
    list = switch (f) {
      'PENDING'  => list.where((x) => x.approvalStatus == 'PENDING_REVIEW').toList(),
      'APPROVED' => list.where((x) => x.approvalStatus == 'APPROVED').toList(),
      'URGENT'   => list.where((x) => x.priority == 'URGENT').toList(),
      'HIGH'     => list.where((x) => x.priority == 'HIGH').toList(),
      _          => list,
    };

    final q = search.value.toLowerCase().trim();
    if (q.isNotEmpty) {
      list = list
          .where((x) =>
              (x.sampleNumber).toLowerCase().contains(q) ||
              (x.wellName ?? '').toLowerCase().contains(q) ||
              (x.clientName ?? '').toLowerCase().contains(q))
          .toList();
    }

    return list;
  }

  int get pendingCount {
    final s = state.value;
    if (s is! AsyncSuccess<List<LabSampleModel>>) return 0;
    return s.data.where((x) => x.isPendingApproval).length;
  }

  Future<bool> approve(
    String sampleId, {
    required bool requiresTreatmentChange,
    required String notes,
  }) async {
    approvalLoading.value = true;
    try {
      await _dio.post<void>(
        '/lab/samples/$sampleId/approve',
        data: {
          'requiresTreatmentChange': requiresTreatmentChange,
          'approvalNotes': notes,
        },
      );
      await load();
      Get.find<HomeController>().load();
      return true;
    } catch (_) {
      return false;
    } finally {
      approvalLoading.value = false;
    }
  }
}
