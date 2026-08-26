import 'dart:io';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart' hide FormData, MultipartFile;
import 'package:image_picker/image_picker.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';

class DeliveryController extends GetxController {
  final _dio = Get.find<DioService>().dio;
  final _picker = ImagePicker();

  final route = Rxn<RouteModel>();
  final isLoading = true.obs;
  final hasError = false.obs;
  final isUpdating = false.obs;

  late final String routeId;

  @override
  void onInit() {
    super.onInit();
    routeId = Get.parameters['id'] ?? '';
    if (routeId.isNotEmpty) load();
  }

  Future<void> load() async {
    isLoading.value = true;
    hasError.value = false;
    try {
      final res = await _dio.get<Map<String, dynamic>>('/routes/$routeId');
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException {
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateRouteStatus(String status) async {
    isUpdating.value = true;
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/status',
        queryParameters: {'status': status},
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);
      Get.snackbar('Updated', 'Route marked as ${_statusLabel(status)}',
          snackPosition: SnackPosition.BOTTOM);
    } on DioException {
      Get.snackbar('Error', 'Could not update route status',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isUpdating.value = false;
    }
  }

  /// Called after proof is collected (photo + GPS). Marks stop COMPLETED.
  Future<bool> confirmDelivery(
      String stopId, File photo, Position position) async {
    isUpdating.value = true;
    try {
      // 1. Upload photo
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(photo.path,
            filename: 'delivery_${stopId}_${DateTime.now().millisecondsSinceEpoch}.jpg'),
      });
      final uploadRes = await _dio.post<Map<String, dynamic>>(
        '/uploads/photo',
        data: formData,
      );
      final photoUrl = (uploadRes.data!['data'] as Map<String, dynamic>)['url'] as String;

      // 2. Mark stop COMPLETED with proof
      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/stops/$stopId/status',
        queryParameters: {
          'status': 'COMPLETED',
          'lat': position.latitude,
          'lng': position.longitude,
          'photoUrl': photoUrl,
        },
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);

      // Auto-complete route when all stops done
      final r = route.value!;
      if (r.stops.every((s) => !s.isPending) && r.status == 'IN_PROGRESS') {
        await updateRouteStatus('COMPLETED');
      }
      return true;
    } on DioException {
      Get.snackbar('Error', 'Could not confirm delivery',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  Future<void> skipStop(String stopId) async {
    isUpdating.value = true;
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/stops/$stopId/status',
        queryParameters: {'status': 'SKIPPED'},
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);

      final r = route.value!;
      if (r.stops.every((s) => !s.isPending) && r.status == 'IN_PROGRESS') {
        await updateRouteStatus('COMPLETED');
      }
    } on DioException {
      Get.snackbar('Error', 'Could not update stop',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isUpdating.value = false;
    }
  }

  Future<XFile?> takePhoto() => _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 75,
        maxWidth: 1280,
      );

  Future<Position?> getLocation() async {
    final permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  String _statusLabel(String status) => switch (status) {
        'IN_PROGRESS' => 'In Progress',
        'COMPLETED'   => 'Completed',
        'CANCELLED'   => 'Cancelled',
        _             => status,
      };
}
