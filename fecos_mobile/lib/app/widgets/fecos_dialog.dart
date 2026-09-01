import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_button.dart';

abstract final class FecosDialog {
  // Confirm — returns true (confirm) or false/null (cancel)
  static Future<bool?> confirm({
    required String title,
    required String message,
    String confirmLabel = 'Confirm',
    String cancelLabel = 'Cancel',
    bool isDanger = false,
    IconData icon = Icons.help_outline_rounded,
  }) =>
      Get.dialog<bool>(
        _DialogBody(
          icon: icon,
          iconColor: isDanger ? AppColors.danger : AppColors.primary,
          title: title,
          message: message,
          actions: [
            Row(
              children: [
                Expanded(
                  child: FecosButton(
                    label: cancelLabel,
                    variant: FecosButtonVariant.outlined,
                    onPressed: () => Get.back(result: false),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FecosButton(
                    label: confirmLabel,
                    variant: isDanger
                        ? FecosButtonVariant.danger
                        : FecosButtonVariant.primary,
                    onPressed: () => Get.back(result: true),
                  ),
                ),
              ],
            ),
          ],
        ),
        barrierDismissible: false,
      );

  // Success
  static Future<void> success({
    required String title,
    String message = '',
    String label = 'Done',
    VoidCallback? onDone,
  }) =>
      Get.dialog<void>(
        _DialogBody(
          icon: Icons.check_circle_rounded,
          iconColor: AppColors.success,
          title: title,
          message: message,
          actions: [
            FecosButton(
              label: label,
              onPressed: () {
                Get.back();
                onDone?.call();
              },
            ),
          ],
        ),
        barrierDismissible: true,
      );

  // Error
  static Future<void> error({
    required String title,
    String message = '',
    String label = 'OK',
  }) =>
      Get.dialog<void>(
        _DialogBody(
          icon: Icons.error_rounded,
          iconColor: AppColors.danger,
          title: title,
          message: message,
          actions: [
            FecosButton(
              label: label,
              variant: FecosButtonVariant.danger,
              onPressed: () => Get.back(),
            ),
          ],
        ),
        barrierDismissible: true,
      );

  // Info
  static Future<void> info({
    required String title,
    String message = '',
    String label = 'Got it',
  }) =>
      Get.dialog<void>(
        _DialogBody(
          icon: Icons.info_rounded,
          iconColor: AppColors.info,
          title: title,
          message: message,
          actions: [
            FecosButton(
              label: label,
              variant: FecosButtonVariant.secondary,
              onPressed: () => Get.back(),
            ),
          ],
        ),
        barrierDismissible: true,
      );
}

class _DialogBody extends StatelessWidget {
  const _DialogBody({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.message,
    required this.actions,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String message;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: AppColors.surfaceCard,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 30),
              ),
              const SizedBox(height: 18),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              if (message.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.55,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 24),
              ...actions,
            ],
          ),
        ),
      );
}
