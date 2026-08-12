import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class FecosLoader extends StatelessWidget {
  const FecosLoader({super.key});

  @override
  Widget build(BuildContext context) => const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
          strokeWidth: 3,
        ),
      );
}

class FecosOverlayLoader {
  static void show() => Get.dialog(
        const ColoredBox(
          color: Colors.black45,
          child: Center(
            child: Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            ),
          ),
        ),
        barrierDismissible: false,
      );

  static void hide() {
    if (Get.isDialogOpen ?? false) Get.back();
  }
}

class FecosShimmer extends StatelessWidget {
  const FecosShimmer({super.key, this.height = 80, this.borderRadius = 12});

  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) => Container(
        height: height,
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      );
}

class FecosListShimmer extends StatelessWidget {
  const FecosListShimmer({super.key, this.itemCount = 6});

  final int itemCount;

  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: itemCount,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const FecosShimmer(),
      );
}
