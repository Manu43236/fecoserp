import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/storage_service.dart';
import 'package:fecos_mobile/app/data/models/user_model.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';

class AuthController extends GetxController {
  final _dio = Get.find<DioService>().dio;
  final _storage = Get.find<StorageService>();

  final user = Rxn<UserModel>();
  final isLoading = false.obs;

  bool get isLoggedIn => user.value != null;

  final _sessionCompleter = Completer<void>();
  Future<void> get sessionRestored => _sessionCompleter.future;

  @override
  void onInit() {
    super.onInit();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await _storage.getToken();
    if (token == null) {
      _sessionCompleter.complete();
      return;
    }
    try {
      final res = await _dio.get<Map<String, dynamic>>('/auth/me');
      final u = UserModel.fromJson(res.data!['data'] as Map<String, dynamic>);
      if (!u.role.isMobileRole) {
        await _storage.clearAll();
      } else {
        user.value = u;
      }
    } on DioException {
      await _storage.clearAll();
    } finally {
      _sessionCompleter.complete();
    }
  }

  void _showError(String message) {
    Get.snackbar(
      'Sign In Failed',
      message,
      snackPosition: SnackPosition.TOP,
      backgroundColor: const Color(0xFF1C1C1E),
      colorText: const Color(0xFFFFFFFF),
      icon: const Icon(Icons.error_outline, color: Color(0xFFFF453A), size: 22),
      borderRadius: 12,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      duration: const Duration(seconds: 4),
      isDismissible: true,
      forwardAnimationCurve: Curves.easeOutCubic,
    );
  }

  Future<void> login(String mobileNumber, String pin) async {
    isLoading.value = true;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'mobileNumber': mobileNumber, 'pin': pin},
      );
      final data = res.data!['data'] as Map<String, dynamic>;
      final token = data['token'] as String;
      final u = UserModel.fromJson(data);
      if (!u.role.isMobileRole) {
        _showError('This account is not authorized for mobile access.');
        return;
      }
      await _storage.setToken(token);
      user.value = u;
      Get.offAllNamed(Routes.main);
    } on DioException catch (e) {
      final msg = switch (e.response?.statusCode) {
        401 => 'Invalid mobile number or PIN.',
        _ => switch (e.type) {
            DioExceptionType.connectionTimeout ||
            DioExceptionType.receiveTimeout ||
            DioExceptionType.sendTimeout =>
              'Connection timed out. Check your network.',
            DioExceptionType.connectionError =>
              'Cannot reach the server. Check your connection.',
            _ => 'Something went wrong. Please try again.',
          },
      };
      _showError(msg);
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
    user.value = null;
    Get.offAllNamed(Routes.login);
  }
}
