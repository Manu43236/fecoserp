import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import '../controllers/pre_trip_controller.dart';

class PreTripView extends GetView<PreTripController> {
  const PreTripView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: const Text('Pre-Trip Inspection'),
          backgroundColor: AppColors.dark,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionHeader(label: 'Vehicle Info'),
              const SizedBox(height: 12),
              const FecosShimmerCard(height: 60, lineCount: 1),
              const SizedBox(height: 10),
              const Row(
                children: [
                  Expanded(child: FecosShimmerCard(height: 60, lineCount: 1)),
                  SizedBox(width: 10),
                  Expanded(child: FecosShimmerCard(height: 60, lineCount: 1)),
                ],
              ),

              const SizedBox(height: 24),

              _SectionHeader(label: 'Safety Checklist'),
              const SizedBox(height: 12),
              for (int i = 0; i < 5; i++) ...[
                _ChecklistShimmerRow(),
                if (i < 4) const SizedBox(height: 10),
              ],

              const SizedBox(height: 24),

              _SectionHeader(label: 'Vehicle Photo'),
              const SizedBox(height: 12),
              Container(
                height: 140,
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add_a_photo_outlined,
                          size: 32, color: AppColors.textHint),
                      SizedBox(height: 8),
                      Text(
                        'Photo capture — Coming Soon',
                        style: TextStyle(fontSize: 13, color: AppColors.textHint),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              _SectionHeader(label: 'Notes'),
              const SizedBox(height: 12),
              const FecosShimmerCard(height: 88, lineCount: 3),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.check_rounded),
                  label: const Text('Submit Inspection — Coming Soon'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 52),
                    disabledBackgroundColor:
                        AppColors.primary.withValues(alpha: 0.4),
                    disabledForegroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 0.4,
        ),
      );
}

class _ChecklistShimmerRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        height: 52,
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            const FecosShimmer(height: 20, width: 20, borderRadius: 4),
            const SizedBox(width: 14),
            const Expanded(child: FecosShimmer(height: 13, borderRadius: 4)),
            const SizedBox(width: 14),
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ],
        ),
      );
}
