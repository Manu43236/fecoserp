import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';

class ChemicalLine {
  final nameCtrl        = TextEditingController();
  final galDeliveredCtrl = TextEditingController();
  final galOnHandCtrl   = TextEditingController();
  final recRateCtrl     = TextEditingController();
  final actualRateCtrl  = TextEditingController();
  final commentsCtrl    = TextEditingController();
  final onRate          = false.obs;
  final soar            = false.obs;

  void dispose() {
    nameCtrl.dispose();
    galDeliveredCtrl.dispose();
    galOnHandCtrl.dispose();
    recRateCtrl.dispose();
    actualRateCtrl.dispose();
    commentsCtrl.dispose();
  }

  Map<String, dynamic> toJson() => {
        'productName':      nameCtrl.text.trim(),
        'gallonsDelivered': double.tryParse(galDeliveredCtrl.text),
        'gallonsOnHand':    double.tryParse(galOnHandCtrl.text),
        'recRate':          double.tryParse(recRateCtrl.text),
        'actualRate':       double.tryParse(actualRateCtrl.text),
        'onRate':           onRate.value,
        'soar':             soar.value,
        'comments':         commentsCtrl.text.trim(),
      };
}

class ServiceReportController extends GetxController {
  final _dio = Get.find<DioService>().dio;

  late final String visitId;
  late final String stopId;

  final pumpRunning      = false.obs;
  final tankLevelBefore  = TextEditingController();
  final tankLevelAfter   = TextEditingController();
  final actualRate       = TextEditingController();
  final soar             = false.obs;
  final specialTreat     = TextEditingController();
  final notes            = TextEditingController();

  final chemicals        = <ChemicalLine>[].obs;
  final submitState      = Rx<AsyncState<bool>>(const AsyncIdle());

  @override
  void onInit() {
    super.onInit();
    visitId = Get.parameters['visitId'] ?? '';
    stopId  = Get.parameters['stopId']  ?? '';
    _loadExisting();
  }

  void addChemical() => chemicals.add(ChemicalLine());

  void removeChemical(int index) {
    chemicals[index].dispose();
    chemicals.removeAt(index);
  }

  Future<void> _loadExisting() async {
    try {
      final res = await _dio.get('/service-visits/$visitId/stops/$stopId/report');
      final d = res.data['data'];
      if (d == null) return;
      pumpRunning.value     = d['pumpRunning'] ?? false;
      soar.value            = d['soar'] ?? false;
      tankLevelBefore.text  = d['tankLevelBefore']?.toString() ?? '';
      tankLevelAfter.text   = d['tankLevelAfter']?.toString() ?? '';
      actualRate.text       = d['actualRate']?.toString() ?? '';
      specialTreat.text     = d['specialTreat'] ?? '';
      notes.text            = d['notes'] ?? '';

      for (final c in (d['chemicals'] as List? ?? [])) {
        final line = ChemicalLine();
        line.nameCtrl.text        = c['productName'] ?? '';
        line.galDeliveredCtrl.text = c['gallonsDelivered']?.toString() ?? '';
        line.galOnHandCtrl.text   = c['gallonsOnHand']?.toString() ?? '';
        line.recRateCtrl.text     = c['recRate']?.toString() ?? '';
        line.actualRateCtrl.text  = c['actualRate']?.toString() ?? '';
        line.commentsCtrl.text    = c['comments'] ?? '';
        line.onRate.value         = c['onRate'] ?? false;
        line.soar.value           = c['soar'] ?? false;
        chemicals.add(line);
      }
    } on Exception {
      // no existing report — fresh form
    }
  }

  Future<void> submit() async {
    if (!soar.value) {
      FecosSnackbar.warning('S.O.A.R Required', 'You must acknowledge S.O.A.R before submitting.');
      return;
    }

    submitState.value = const AsyncLoading();
    try {
      final body = {
        'pumpRunning':     pumpRunning.value,
        'tankLevelBefore': double.tryParse(tankLevelBefore.text),
        'tankLevelAfter':  double.tryParse(tankLevelAfter.text),
        'actualRate':      double.tryParse(actualRate.text),
        'soar':            soar.value,
        'specialTreat':    specialTreat.text.trim(),
        'notes':           notes.text.trim(),
        'chemicals':       chemicals.map((c) => c.toJson()).toList(),
      };
      await _dio.post('/service-visits/$visitId/stops/$stopId/report', data: body);
      submitState.value = const AsyncSuccess(true);
      Get.back();
      FecosSnackbar.success('Submitted', 'Service report saved.');
    } on Exception catch (e) {
      submitState.value = const AsyncError('Failed to submit');
      FecosSnackbar.error('Error', e.toString());
    }
  }

  @override
  void onClose() {
    tankLevelBefore.dispose();
    tankLevelAfter.dispose();
    actualRate.dispose();
    specialTreat.dispose();
    notes.dispose();
    for (final c in chemicals) { c.dispose(); }
    super.onClose();
  }
}
