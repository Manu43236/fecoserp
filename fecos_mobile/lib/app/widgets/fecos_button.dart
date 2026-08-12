import 'package:flutter/material.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

enum FecosButtonVariant { primary, secondary, outlined, danger }

class FecosButton extends StatelessWidget {
  const FecosButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = FecosButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final FecosButtonVariant variant;
  final bool isLoading;
  final IconData? icon;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : icon != null
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [Icon(icon, size: 18), const SizedBox(width: 8), Text(label)],
              )
            : Text(label);

    final minSize = fullWidth
        ? const Size(double.infinity, 52)
        : const Size(120, 52);

    return switch (variant) {
      FecosButtonVariant.primary => ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(minimumSize: minSize),
          child: child,
        ),
      FecosButtonVariant.secondary => ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.dark,
            minimumSize: minSize,
          ),
          child: child,
        ),
      FecosButtonVariant.outlined => OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(minimumSize: minSize),
          child: child,
        ),
      FecosButtonVariant.danger => ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger,
            minimumSize: minSize,
          ),
          child: child,
        ),
    };
  }
}
