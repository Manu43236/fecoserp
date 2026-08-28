import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/storage_service.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';

class MyVisitStop {
  final String id;
  final String wellId;
  final String wellName;
  final String leaseName;
  final String clientName;
  final int sequence;
  final String status;
  final bool hasSoar;
  final bool soarAcknowledged;
  final bool hasReport;

  const MyVisitStop({
    required this.id,
    required this.wellId,
    required this.wellName,
    required this.leaseName,
    required this.clientName,
    required this.sequence,
    required this.status,
    required this.hasSoar,
    required this.soarAcknowledged,
    required this.hasReport,
  });

  factory MyVisitStop.fromJson(Map<String, dynamic> j) => MyVisitStop(
        id: j['id'],
        wellId: j['wellId'],
        wellName: j['wellName'],
        leaseName: j['leaseName'],
        clientName: j['clientName'] ?? '',
        sequence: j['sequence'],
        status: j['status'],
        hasSoar: j['hasSoar'] ?? false,
        soarAcknowledged: j['soarAcknowledged'] ?? false,
        hasReport: j['hasReport'] ?? false,
      );
}

class MyVisit {
  final String id;
  final String? name;
  final String visitDate;
  final String status;
  final List<MyVisitStop> stops;

  const MyVisit({
    required this.id,
    this.name,
    required this.visitDate,
    required this.status,
    required this.stops,
  });

  factory MyVisit.fromJson(Map<String, dynamic> j) => MyVisit(
        id: j['id'],
        name: j['name'] as String?,
        visitDate: j['visitDate'],
        status: j['status'],
        stops: (j['stops'] as List).map((s) => MyVisitStop.fromJson(s)).toList(),
      );
}

class ServiceVisitController extends GetxController {
  final _dio = Get.find<DioService>().dio;

  final state = Rx<AsyncState<List<MyVisit>>>(const AsyncLoading());
  final selectedDate = Rx<DateTime>(DateTime.now());

  @override
  void onInit() {
    super.onInit();
    loadVisits();
  }

  Future<void> loadVisits({DateTime? date}) async {
    final token = await Get.find<StorageService>().getToken();
    if (token == null) return;
    if (date != null) selectedDate.value = date;
    state.value = const AsyncLoading();
    try {
      final dateStr = _fmt(selectedDate.value);
      final res = await _dio.get('/my-visits', queryParameters: {'date': dateStr});
      final list = (res.data['data'] as List).map((v) => MyVisit.fromJson(v)).toList();
      state.value = AsyncSuccess(list);
    } on Exception catch (e) {
      state.value = AsyncError(e.toString());
    }
  }

  Future<MyVisit?> startVisit(String visitId) async {
    try {
      await _dio.patch(
        '/service-visits/$visitId',
        data: {'status': 'IN_PROGRESS'},
      );
      await loadVisits();
      final s = state.value;
      if (s is AsyncSuccess<List<MyVisit>>) {
        return s.data.firstWhereOrNull((v) => v.id == visitId);
      }
      return null;
    } on Exception {
      Get.snackbar('Error', 'Failed to start visit',
          snackPosition: SnackPosition.BOTTOM);
      return null;
    }
  }

  String _fmt(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  bool get isToday {
    final now = DateTime.now();
    final d = selectedDate.value;
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }
}
