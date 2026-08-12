import 'package:flutter/material.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_button.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 56, color: AppColors.danger),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 15, color: AppColors.textSecondary),
              ),
              if (onRetry != null) ...[
                const SizedBox(height: 20),
                FecosButton(
                  label: 'Retry',
                  onPressed: onRetry,
                  variant: FecosButtonVariant.outlined,
                  fullWidth: false,
                ),
              ],
            ],
          ),
        ),
      );
}
