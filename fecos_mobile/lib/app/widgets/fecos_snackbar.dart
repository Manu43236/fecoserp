import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

abstract final class FecosSnackbar {
  static void success(String message, {String title = 'Success'}) =>
      _show(title, message, AppColors.success, Icons.check_circle_outline_rounded);

  static void error(String message, {String title = 'Error'}) =>
      _show(title, message, AppColors.danger, Icons.error_outline_rounded);

  static void warning(String message, {String title = 'Warning'}) =>
      _show(title, message, AppColors.warning, Icons.warning_amber_rounded);

  static void info(String message, {String title = 'Info'}) =>
      _show(title, message, AppColors.textPrimary, Icons.info_outline_rounded);

  static void _show(String title, String message, Color color, IconData icon) =>
      Get.snackbar(
        title,
        message,
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: color,
        colorText: Colors.white,
        icon: Icon(icon, color: Colors.white, size: 22),
        borderRadius: 14,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        duration: const Duration(seconds: 3),
        isDismissible: true,
        dismissDirection: DismissDirection.horizontal,
        forwardAnimationCurve: Curves.easeOutCubic,
        reverseAnimationCurve: Curves.easeInCubic,
        titleText: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
        messageText: Text(
          message,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            height: 1.4,
          ),
        ),
      );
}
