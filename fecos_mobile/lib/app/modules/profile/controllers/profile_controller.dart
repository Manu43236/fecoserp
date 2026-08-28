import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';

class ProfileController extends GetxController {
  final auth = Get.find<AuthController>();
  final _dio = Get.find<DioService>().dio;

  final isChangingPin = false.obs;

  Future<void> changePin({
    required String currentPin,
    required String newPin,
    required VoidCallback onSuccess,
  }) async {
    isChangingPin.value = true;
    try {
      await _dio.post<void>(
        '/auth/change-pin',
        data: {'currentPin': currentPin, 'newPin': newPin},
      );
      onSuccess();
    } on DioException catch (e) {
      final msg = e.response?.statusCode == 401
          ? 'Current PIN is incorrect.'
          : 'Failed to change PIN. Try again.';
      Get.snackbar(
        'Error',
        msg,
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFF1C1C1E),
        colorText: const Color(0xFFFFFFFF),
        icon: const Icon(Icons.error_outline, color: Color(0xFFFF453A), size: 22),
        borderRadius: 12,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        duration: const Duration(seconds: 4),
      );
    } finally {
      isChangingPin.value = false;
    }
  }
}
