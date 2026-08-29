import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';

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
      FecosSnackbar.error('Error', msg);
    } finally {
      isChangingPin.value = false;
    }
  }
}
