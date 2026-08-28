import 'package:dio/dio.dart';
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

  Future<bool> confirmLoad(Map<String, double> loadedQtyMap) async {
    isUpdating.value = true;
    try {
      final items = loadedQtyMap.entries
          .map((e) => {'itemId': e.key, 'loadedQty': e.value})
          .toList();
      final res = await _dio.post<Map<String, dynamic>>(
        '/routes/$routeId/load-confirmation',
        data: {'items': items},
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException catch (e) {
      final msg = e.response?.data?['error'] ?? 'Could not confirm load';
      Get.snackbar('Error', msg, snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  Future<void> skipStop(String stopId, String skipReason) async {
    isUpdating.value = true;
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/stops/$stopId/status',
        queryParameters: {'status': 'SKIPPED', 'skipReason': skipReason},
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException {
      Get.snackbar('Error', 'Could not skip stop',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isUpdating.value = false;
    }
  }

  /// Called from StopDetailView after photo upload. Submits delivery with actual quantities.
  Future<bool> deliverStop(
      String stopId, String photoUrl, double lat, double lng,
      Map<String, double> actualQtyMap, String? notes,
      {String? deliveredAt}) async {
    isUpdating.value = true;
    try {
      final items = actualQtyMap.entries
          .map((e) => {'itemId': e.key, 'actualQty': e.value})
          .toList();

      final res = await _dio.patch<Map<String, dynamic>>(
        '/routes/$routeId/stops/$stopId/deliver',
        data: {
          'lat': lat,
          'lng': lng,
          'photoUrl': photoUrl,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
          'deliveredAt': deliveredAt,
          'items': items,
        },
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 0;
      final msg = e.response?.data?['error'] ?? e.message ?? 'Unknown error';
      Get.snackbar('Error ($code)', msg,
          snackPosition: SnackPosition.BOTTOM,
          duration: const Duration(seconds: 6));
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  Future<bool> submitPreTrip({required bool hasIssues, String? notes}) async {
    isUpdating.value = true;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/routes/$routeId/pre-trip',
        data: {'hasIssues': hasIssues, 'notes': notes},
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException {
      Get.snackbar('Error', 'Could not submit pre-trip check',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  Future<bool> returnInventory(List<Map<String, dynamic>> items) async {
    isUpdating.value = true;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/routes/$routeId/return-inventory',
        data: {'items': items},
      );
      route.value = RouteModel.fromJson(res.data!['data'] as Map<String, dynamic>);
      return true;
    } on DioException {
      Get.snackbar('Error', 'Could not complete route',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

Future<XFile?> takePhoto() => _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 75,
        maxWidth: 1280,
      );

  String _statusLabel(String status) => switch (status) {
        'IN_PROGRESS' => 'In Progress',
        'COMPLETED'   => 'Completed',
        'CANCELLED'   => 'Cancelled',
        _             => status,
      };
}
