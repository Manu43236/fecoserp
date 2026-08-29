import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart' as dio_pkg;
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';

// ── Treatment plan line model ─────────────────────────────────────────────────

class PlanLine {
  final String id;
  final String productName;
  final String method; // CONTINUOUS | BATCH
  final String? schedule;
  final double recRate;
  final String? tankId;
  final String? tankSerial;
  final double? tankCapacityGallons;
  final double? estimatedLevelPct; // system-calculated, from calculatedLevelPct
  final bool pumpDeployed;
  final String? pumpSerial;

  // ── Form state ──────────────────────────────────────────────────────────────

  // Tank
  final tankLevelPct = TextEditingController();

  // CI
  final pumpRunning = false.obs;
  final rateFound = TextEditingController();
  final rateSetTo = TextEditingController();
  final onRate = false.obs;
  final deviationReason = TextEditingController();

  // CI — pump not running
  final pumpDownReason = TextEditingController();

  // Batch
  final applied = false.obs;
  final quantityApplied = TextEditingController();

  // Common
  final lineNotes = TextEditingController();

  // captured at moment of first interaction — offline-first
  DateTime? recordedAt;

  PlanLine({
    required this.id,
    required this.productName,
    required this.method,
    this.schedule,
    required this.recRate,
    this.tankId,
    this.tankSerial,
    this.tankCapacityGallons,
    this.estimatedLevelPct,
    required this.pumpDeployed,
    this.pumpSerial,
  });

  factory PlanLine.fromJson(Map<String, dynamic> j) => PlanLine(
        id: j['id'],
        productName: j['productName'] ?? '',
        method: (j['method'] as String?) ?? 'CONTINUOUS',
        schedule: j['schedule'],
        recRate: (j['recRate'] as num?)?.toDouble() ?? 0.0,
        tankId: j['tankId'],
        tankSerial: j['tankSerial'],
        tankCapacityGallons:
            (j['tankCapacityGallons'] as num?)?.toDouble(),
        estimatedLevelPct:
            (j['calculatedLevelPct'] as num?)?.toDouble(),
        pumpDeployed: j['pumpDeployed'] == true,
        pumpSerial: j['pumpSerial'],
      );

  void dispose() {
    tankLevelPct.dispose();
    rateFound.dispose();
    rateSetTo.dispose();
    deviationReason.dispose();
    pumpDownReason.dispose();
    quantityApplied.dispose();
    lineNotes.dispose();
  }

  bool get isCi => method == 'CONTINUOUS';

  // Returns true when the tech has set a rate that deviates from the rec rate
  bool get isDeviating {
    final setTo = double.tryParse(rateSetTo.text);
    return setTo != null && (setTo - recRate).abs() > 0.001;
  }

  Map<String, dynamic> toJson() => {
        'planLineId': id,
        'productName': productName,
        'tankId': tankId,
        'method': method,
        'tankLevelPct': double.tryParse(tankLevelPct.text),
        // CI
        'pumpRunning': isCi ? pumpRunning.value : null,
        'pumpDownReason': isCi && !pumpRunning.value
            ? (pumpDownReason.text.trim().isEmpty
                ? null
                : pumpDownReason.text.trim())
            : null,
        'rateFound': isCi ? double.tryParse(rateFound.text) : null,
        'rateSetTo': isCi ? double.tryParse(rateSetTo.text) : null,
        'onRate': isCi ? onRate.value : null,
        'deviationReason': isCi && isDeviating
            ? (deviationReason.text.trim().isEmpty
                ? null
                : deviationReason.text.trim())
            : null,
        // Batch
        'applied': !isCi ? applied.value : null,
        'quantityApplied': !isCi ? double.tryParse(quantityApplied.text) : null,
        // Common
        'notes':
            lineNotes.text.trim().isEmpty ? null : lineNotes.text.trim(),
        'recordedAt':
            (recordedAt ?? DateTime.now()).toUtc().toIso8601String(),
        'sortOrder': 1,
      };
}

// ── Controller ────────────────────────────────────────────────────────────────

class WellStopController extends GetxController {
  final _dio = Get.find<DioService>().dio;
  final _picker = ImagePicker();

  late final String visitId;
  late final String stopId;
  late final String wellId;
  late final MyVisitStop stop;

  // captured when page opens — this is performed_at ground truth
  late final DateTime performedAt;

  // plan lines
  final planLines = <PlanLine>[].obs;
  final planLoading = true.obs;
  final planLoadError = Rxn<String>();

  // GPS
  final gpsLat = Rxn<double>();
  final gpsLng = Rxn<double>();
  DateTime? gpsCapturedAt;
  final gpsLoading = false.obs;

  // Photo (site / well photo)
  final photoFile = Rxn<File>();
  DateTime? photoCapturedAt;

  // Sample photo (optional)
  final samplePhotoFile = Rxn<File>();
  DateTime? samplePhotoCapturedAt;

  // SOAR
  final soar = false.obs;
  final soarNote = TextEditingController();

  // Sample
  final sampleType = TextEditingController();
  final sampleNotes = TextEditingController();

  // Signature — owned by controller so it persists across rebuilds
  late final SignatureController signatureController;
  final hasSigned = false.obs;
  final signerName = TextEditingController();
  DateTime? signedAt;

  // General notes
  final notes = TextEditingController();

  // Submit state
  final isSubmitting = false.obs;

  @override
  void onInit() {
    super.onInit();
    stop = Get.arguments as MyVisitStop;
    visitId = Get.parameters['visitId'] ?? '';
    stopId = Get.parameters['stopId'] ?? '';
    wellId = stop.wellId;
    performedAt = DateTime.now();

    signatureController = SignatureController(
      penStrokeWidth: 2.5,
      penColor: Colors.black,
      exportBackgroundColor: Colors.white,
    );
    signatureController.addListener(
      () => hasSigned.value = signatureController.isNotEmpty,
    );

    _loadPlanLines();
    _captureGps();
  }

  // ── Load treatment plan lines ─────────────────────────────────────────────

  Future<void> _loadPlanLines() async {
    planLoading.value = true;
    try {
      final res = await _dio.get(
        '/plans',
        queryParameters: {'wellId': wellId, 'status': 'ACTIVE', 'size': 1},
      );
      final content = res.data['data']?['content'] as List?;
      if (content == null || content.isEmpty) {
        planLoading.value = false;
        return;
      }
      final planId = content.first['id'];
      final detailRes = await _dio.get('/plans/$planId');
      final lines = detailRes.data['data']?['lines'] as List? ?? [];
      planLines.value = lines.map((l) => PlanLine.fromJson(l)).toList();

      // Set smart defaults for CI lines
      for (final pl in planLines) {
        if (pl.isCi) {
          pl.rateFound.text = pl.recRate.toStringAsFixed(1);
          pl.rateSetTo.text = pl.recRate.toStringAsFixed(1);
          pl.onRate.value = true;
        }
      }
    } catch (e) {
      planLoadError.value = 'Could not load treatment plan. Tap to retry.';
    } finally {
      planLoading.value = false;
    }
  }

  void retryLoadPlan() {
    planLoadError.value = null;
    _loadPlanLines();
  }

  // ── GPS ───────────────────────────────────────────────────────────────────

  Future<void> _captureGps() async {
    gpsLoading.value = true;
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        FecosSnackbar.warning('Permission Required', 'Location permission is permanently denied. Please enable it in Settings.');
        Geolocator.openAppSettings();
        return;
      }
      if (perm == LocationPermission.denied) return;

      final pos = await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.high),
      );
      gpsLat.value = pos.latitude;
      gpsLng.value = pos.longitude;
      gpsCapturedAt = DateTime.now();
    } on Exception {
      // GPS unavailable — not a blocker
    } finally {
      gpsLoading.value = false;
    }
  }

  Future<void> refreshGps() => _captureGps();

  // ── Site Photo ────────────────────────────────────────────────────────────

  Future<void> capturePhoto() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 75,
    );
    if (xfile == null) return;
    photoFile.value = File(xfile.path);
    photoCapturedAt = DateTime.now();
  }

  void removePhoto() {
    photoFile.value = null;
    photoCapturedAt = null;
  }

  // ── Sample Photo ──────────────────────────────────────────────────────────

  Future<void> captureSamplePhoto() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 75,
    );
    if (xfile == null) return;
    samplePhotoFile.value = File(xfile.path);
    samplePhotoCapturedAt = DateTime.now();
  }

  void removeSamplePhoto() {
    samplePhotoFile.value = null;
    samplePhotoCapturedAt = null;
  }

  // ── Validate & Submit ─────────────────────────────────────────────────────

  Future<void> submit() async {
    // Signature is required
    if (!hasSigned.value) {
      FecosSnackbar.warning('Signature Required', 'Operator must sign before submitting.');
      return;
    }

    // SOAR note is required when SOAR is on
    if (soar.value && soarNote.text.trim().isEmpty) {
      FecosSnackbar.warning('SOAR Note Required', 'Please describe the observation.');
      return;
    }

    // Deviation reason is required for each CI line that deviates
    for (final line in planLines) {
      if (line.isCi && line.isDeviating && line.deviationReason.text.trim().isEmpty) {
        FecosSnackbar.warning('Deviation Reason Required', 'Please explain why you changed the rate for "${line.productName}".');
        return;
      }
    }

    isSubmitting.value = true;
    try {
      String? photoUrl;
      if (photoFile.value != null) {
        photoUrl = await _uploadPhoto(photoFile.value!);
      }

      String? samplePhotoUrl;
      if (samplePhotoFile.value != null) {
        samplePhotoUrl = await _uploadPhoto(samplePhotoFile.value!);
      }

      final sigBytes = await signatureController.toPngBytes();
      if (sigBytes == null) {
        FecosSnackbar.error('Signature Error', 'Unable to export signature. Please try again.');
        return;
      }
      final sigUrl = await _uploadSignature(sigBytes);
      signedAt = DateTime.now();

      final body = {
        'performedAt': performedAt.toUtc().toIso8601String(),
        'gpsLat': gpsLat.value,
        'gpsLng': gpsLng.value,
        'gpsCapturedAt': gpsCapturedAt?.toUtc().toIso8601String(),
        'photoUrl': photoUrl,
        'photoCapturedAt': photoCapturedAt?.toUtc().toIso8601String(),
        'soar': soar.value,
        'soarNote': soar.value ? soarNote.text.trim() : null,
        'sampleType':
            sampleType.text.trim().isEmpty ? null : sampleType.text.trim(),
        'sampleNotes': sampleNotes.text.trim().isEmpty
            ? null
            : sampleNotes.text.trim(),
        'samplePhotoUrl': samplePhotoUrl,
        'signatureUrl': sigUrl,
        'signerName': signerName.text.trim(),
        'signedAt': signedAt?.toUtc().toIso8601String(),
        'notes': notes.text.trim().isEmpty ? null : notes.text.trim(),
        'lines': planLines.map((l) => l.toJson()).toList(),
      };

      await _dio.post(
        '/service-visits/$visitId/stops/$stopId/treatment-report',
        data: body,
      );

      Get.back(result: true);
      FecosSnackbar.success('Submitted', 'Well stop report saved.');
    } on dio_pkg.DioException catch (e) {
      FecosSnackbar.error('Submit Failed',
          e.response?.data?['error'] as String? ?? e.message ?? 'Unknown error');
    } finally {
      isSubmitting.value = false;
    }
  }

  // ── File uploads ──────────────────────────────────────────────────────────

  Future<String?> _uploadPhoto(File file) async {
    try {
      final form = dio_pkg.FormData.fromMap({
        'file': await dio_pkg.MultipartFile.fromFile(
          file.path,
          filename: 'photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });
      final res = await _dio.post('/uploads/photo', data: form);
      return res.data['data']?['url'] as String?;
    } on Exception {
      return null;
    }
  }

  Future<String?> _uploadSignature(List<int> bytes) async {
    try {
      final form = dio_pkg.FormData.fromMap({
        'file': dio_pkg.MultipartFile.fromBytes(
          bytes,
          filename: 'sig_${DateTime.now().millisecondsSinceEpoch}.png',
        ),
      });
      final res = await _dio.post('/uploads/signature', data: form);
      return res.data['data']?['url'] as String?;
    } on Exception {
      return null;
    }
  }

  @override
  void onClose() {
    signatureController.dispose();
    soarNote.dispose();
    sampleType.dispose();
    sampleNotes.dispose();
    signerName.dispose();
    notes.dispose();
    for (final l in planLines) {
      l.dispose();
    }
    super.onClose();
  }
}
