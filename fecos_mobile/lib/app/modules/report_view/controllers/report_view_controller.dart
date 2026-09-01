import 'dart:convert';
import 'package:get/get.dart';
import 'package:dio/dio.dart' as dio_pkg;
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';

class TreatmentReportData {
  final String id;
  final String wellName;
  final String leaseName;
  final String clientName;
  final String techName;
  final String? performedAt;
  final double? gpsLat;
  final double? gpsLng;
  final String? gpsCapturedAt;
  final String? photoUrl;
  final String? photoCapturedAt;
  final bool soar;
  final String? soarNote;
  final String? soarAckByName;
  final String? soarAckAt;
  final String? soarAckNote;
  final String? sampleType;
  final String? sampleNotes;
  final String? samplePhotoUrl;
  final String? signatureUrl;
  final String? signerName;
  final String? signedAt;
  final String? notes;
  final String? submittedAt;
  final List<TreatmentLineData> lines;
  // set when data comes from local SyncQueue (not yet uploaded)
  final bool isPendingSync;
  final String? localPhotoPath;
  final String? localSamplePhotoPath;
  final String? localSignaturePath;

  const TreatmentReportData({
    required this.id,
    required this.wellName,
    required this.leaseName,
    required this.clientName,
    required this.techName,
    this.performedAt,
    this.gpsLat,
    this.gpsLng,
    this.gpsCapturedAt,
    this.photoUrl,
    this.photoCapturedAt,
    required this.soar,
    this.soarNote,
    this.soarAckByName,
    this.soarAckAt,
    this.soarAckNote,
    this.sampleType,
    this.sampleNotes,
    this.samplePhotoUrl,
    this.signatureUrl,
    this.signerName,
    this.signedAt,
    this.notes,
    this.submittedAt,
    required this.lines,
    this.isPendingSync = false,
    this.localPhotoPath,
    this.localSamplePhotoPath,
    this.localSignaturePath,
  });

  factory TreatmentReportData.fromJson(Map<String, dynamic> j) =>
      TreatmentReportData(
        id: j['id'],
        wellName: j['wellName'] ?? '',
        leaseName: j['leaseName'] ?? '',
        clientName: j['clientName'] ?? '',
        techName: j['techName'] ?? '',
        performedAt: j['performedAt'],
        gpsLat: (j['gpsLat'] as num?)?.toDouble(),
        gpsLng: (j['gpsLng'] as num?)?.toDouble(),
        gpsCapturedAt: j['gpsCapturedAt'],
        photoUrl: j['photoUrl'],
        photoCapturedAt: j['photoCapturedAt'],
        soar: j['soar'] == true,
        soarNote: j['soarNote'],
        soarAckByName: j['soarAckByName'],
        soarAckAt: j['soarAckAt'],
        soarAckNote: j['soarAckNote'],
        sampleType: j['sampleType'],
        sampleNotes: j['sampleNotes'],
        samplePhotoUrl: j['samplePhotoUrl'],
        signatureUrl: j['signatureUrl'],
        signerName: j['signerName'],
        signedAt: j['signedAt'],
        notes: j['notes'],
        submittedAt: j['submittedAt'],
        lines: (j['lines'] as List? ?? [])
            .map((l) => TreatmentLineData.fromJson(l))
            .toList(),
      );
}

class TreatmentLineData {
  final String method;
  final String? productName;
  final String? tankSerial;
  final double? tankCapacityGallons;
  final bool? pumpRunning;
  final String? pumpDownReason;
  final double? rateFound;
  final double? rateSetTo;
  final bool? onRate;
  final String? deviationReason;
  final bool? applied;
  final double? quantityApplied;
  final double? tankLevelPct;
  final String? notes;

  const TreatmentLineData({
    required this.method,
    this.productName,
    this.tankSerial,
    this.tankCapacityGallons,
    this.pumpRunning,
    this.pumpDownReason,
    this.rateFound,
    this.rateSetTo,
    this.onRate,
    this.deviationReason,
    this.applied,
    this.quantityApplied,
    this.tankLevelPct,
    this.notes,
  });

  factory TreatmentLineData.fromJson(Map<String, dynamic> j) =>
      TreatmentLineData(
        method: j['method'] ?? 'CONTINUOUS',
        productName: j['productName'],
        tankSerial: j['tankSerial'],
        tankCapacityGallons: (j['tankCapacityGallons'] as num?)?.toDouble(),
        pumpRunning: j['pumpRunning'] as bool?,
        pumpDownReason: j['pumpDownReason'],
        rateFound: (j['rateFound'] as num?)?.toDouble(),
        rateSetTo: (j['rateSetTo'] as num?)?.toDouble(),
        onRate: j['onRate'] as bool?,
        deviationReason: j['deviationReason'],
        applied: j['applied'] as bool?,
        quantityApplied: (j['quantityApplied'] as num?)?.toDouble(),
        tankLevelPct: (j['tankLevelPct'] as num?)?.toDouble(),
        notes: j['notes'],
      );

  bool get isCi => method == 'CONTINUOUS';
}

class ReportViewController extends GetxController {
  final _dio          = Get.find<DioService>().dio;
  final _connectivity = Get.find<ConnectivityService>();
  final _dbService    = Get.find<DbService>();
  AppDatabase get _db => _dbService.db;

  late final MyVisitStop stop;
  late final String visitId;
  late final String stopId;

  final report = Rxn<TreatmentReportData>();
  final isLoading = true.obs;
  final errorMsg = Rxn<String>();
  final isOfflineSynced = false.obs;

  @override
  void onInit() {
    super.onInit();
    stop = Get.arguments as MyVisitStop;
    visitId = Get.parameters['visitId'] ?? '';
    stopId = Get.parameters['stopId'] ?? '';
    _loadReport();
  }

  Future<void> _loadReport() async {
    isLoading.value = true;
    errorMsg.value = null;
    isOfflineSynced.value = false;
    try {
      final res = await _dio.get(
        '/service-visits/$visitId/stops/$stopId/treatment-report',
      );
      report.value =
          TreatmentReportData.fromJson(res.data['data'] as Map<String, dynamic>);
    } on dio_pkg.DioException catch (e) {
      if (!_connectivity.isOnline.value) {
        final loaded = await _loadFromQueue();
        if (loaded) return;
        // Offline and not in queue = already synced, no local copy available
        isOfflineSynced.value = true;
      } else {
        errorMsg.value = e.response?.data?['error'] ?? 'Failed to load report';
      }
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> _loadFromQueue() async {
    try {
      final row = await ((_db.select(_db.syncQueue))
            ..where((t) => t.entityType.equals('well-stop-report'))
            ..where((t) => t.entityId.equals('$visitId-$stopId')))
          .getSingleOrNull();
      if (row == null) return false;

      final p = jsonDecode(row.payload) as Map<String, dynamic>;
      final lines = (p['lines'] as List? ?? [])
          .map((l) => TreatmentLineData.fromJson(l as Map<String, dynamic>))
          .toList();

      report.value = TreatmentReportData(
        id:                   row.id.toString(),
        wellName:             stop.wellName,
        leaseName:            stop.leaseName,
        clientName:           stop.clientName,
        techName:             '',
        performedAt:          p['performedAt'] as String?,
        gpsLat:               (p['gpsLat'] as num?)?.toDouble(),
        gpsLng:               (p['gpsLng'] as num?)?.toDouble(),
        gpsCapturedAt:        p['gpsCapturedAt'] as String?,
        soar:                 p['soar'] == true,
        soarNote:             p['soarNote'] as String?,
        sampleType:           p['sampleType'] as String?,
        sampleNotes:          p['sampleNotes'] as String?,
        signerName:           p['signerName'] as String?,
        signedAt:             p['signedAt'] as String?,
        notes:                p['notes'] as String?,
        lines:                lines,
        isPendingSync:        true,
        localPhotoPath:       p['localPhotoPath'] as String?,
        localSamplePhotoPath: p['localSamplePhotoPath'] as String?,
        localSignaturePath:   p['localSignaturePath'] as String?,
      );
      return true;
    } on Exception {
      return false;
    }
  }

  Future<void> reload() => _loadReport();
}
