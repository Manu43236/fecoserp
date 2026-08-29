import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

abstract final class FecosSnackbar {
  static void success(String title, String message) =>
      _show(title, message, AppColors.success);

  static void error(String title, String message) =>
      _show(title, message, AppColors.danger, titleColored: true);

  static void info(String title, String message) =>
      _show(title, message, AppColors.primary);

  static void warning(String title, String message) =>
      _show(title, message, AppColors.warning);

  static void _show(
    String title,
    String message,
    Color color, {
    bool titleColored = false,
  }) {
    Get.showSnackbar(GetSnackBar(
      duration: const Duration(seconds: 4),
      snackPosition: SnackPosition.TOP,
      backgroundColor: Colors.transparent,
      padding: EdgeInsets.zero,
      margin: const EdgeInsets.fromLTRB(16, 48, 16, 0),
      isDismissible: true,
      dismissDirection: DismissDirection.horizontal,
      forwardAnimationCurve: Curves.easeOutCubic,
      reverseAnimationCurve: Curves.easeInCubic,
      messageText: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: color),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: titleColored ? color : const Color(0xFF1A1A1A),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        message,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF444444),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ));
  }
}
