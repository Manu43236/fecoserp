import 'package:get/get.dart';
import 'package:dio/dio.dart' as dio_pkg;
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';

// ── Summary model (read-only, no form state) ──────────────────────────────────

class PlanLineSummary {
  final String id;
  final String productName;
  final String method; // CONTINUOUS | BATCH
  final String? schedule;
  final double recRate;
  final String? tankOwner; // OWN | THIRD_PARTY
  final String? tankSerial;
  final double? tankCapacityGallons;
  final double? estimatedLevelPct;
  final String? thirdPartyName;
  final double? thirdPartyCapacityGallons;
  final String? thirdPartySerial;
  final bool pumpDeployed;
  final String? pumpSerial;

  PlanLineSummary({
    required this.id,
    required this.productName,
    required this.method,
    this.schedule,
    required this.recRate,
    this.tankOwner,
    this.tankSerial,
    this.tankCapacityGallons,
    this.estimatedLevelPct,
    this.thirdPartyName,
    this.thirdPartyCapacityGallons,
    this.thirdPartySerial,
    required this.pumpDeployed,
    this.pumpSerial,
  });

  factory PlanLineSummary.fromJson(Map<String, dynamic> j) => PlanLineSummary(
        id: j['id'],
        productName: j['productName'] ?? '',
        method: (j['method'] as String?) ?? 'CONTINUOUS',
        schedule: j['schedule'],
        recRate: (j['recRate'] as num?)?.toDouble() ?? 0.0,
        tankOwner: j['tankOwner'],
        tankSerial: j['tankSerial'],
        tankCapacityGallons:
            (j['tankCapacityGallons'] as num?)?.toDouble(),
        estimatedLevelPct:
            (j['calculatedLevelPct'] as num?)?.toDouble(),
        thirdPartyName: j['thirdPartyName'],
        thirdPartyCapacityGallons:
            (j['thirdPartyCapacityGallons'] as num?)?.toDouble(),
        thirdPartySerial: j['thirdPartySerial'],
        pumpDeployed: j['pumpDeployed'] == true,
        pumpSerial: j['pumpSerial'],
      );

  bool get isCi => method == 'CONTINUOUS';

  // Display name for the tank
  String get tankLabel {
    if (tankOwner == 'THIRD_PARTY') {
      final name = thirdPartyName ?? 'Third Party';
      final serial = thirdPartySerial;
      return serial != null ? '$name ($serial)' : name;
    }
    return tankSerial ?? '—';
  }

  double? get capacityGallons => tankOwner == 'THIRD_PARTY'
      ? thirdPartyCapacityGallons
      : tankCapacityGallons;
}

// ── Controller ────────────────────────────────────────────────────────────────

class WellOverviewController extends GetxController {
  final _dio = Get.find<DioService>().dio;

  late final MyVisitStop stop;
  late final String visitId;
  late final String stopId;

  final lines = <PlanLineSummary>[].obs;
  final isLoading = true.obs;
  final errorMsg = Rxn<String>();

  @override
  void onInit() {
    super.onInit();
    stop = Get.arguments as MyVisitStop;
    visitId = Get.parameters['visitId'] ?? '';
    stopId = Get.parameters['stopId'] ?? '';
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      final res = await _dio.get(
        '/plans',
        queryParameters: {
          'wellId': stop.wellId,
          'status': 'ACTIVE',
          'size': 1,
        },
      );
      final content = res.data['data']?['content'] as List?;
      if (content == null || content.isEmpty) {
        lines.clear();
        return;
      }
      final planId = content.first['id'];
      final detail = await _dio.get('/plans/$planId');
      final rawLines = detail.data['data']?['lines'] as List? ?? [];
      lines.value =
          rawLines.map((l) => PlanLineSummary.fromJson(l)).toList();
    } on dio_pkg.DioException catch (e) {
      errorMsg.value =
          e.response?.data?['error'] ?? 'Failed to load treatment plan';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> reload() => _loadPlan();
}
