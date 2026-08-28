import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/data/models/lab_sample_model.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import '../controllers/ar_lab_controller.dart';
import 'ar_sample_detail_view.dart';

class ArLabView extends GetView<ArLabController> {
  const ArLabView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        body: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.dark,
              foregroundColor: Colors.white,
              title: Obx(() {
                final count = controller.pendingCount;
                return Row(
                  children: [
                    const Text(
                      'Lab & Approvals',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (count > 0) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.warning,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '$count',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                );
              }),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(88),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: _SearchBar(controller: controller),
                    ),
                    _FilterChips(controller: controller),
                  ],
                ),
              ),
            ),
          ],
          body: Obx(() {
            final state = controller.state.value;
            return switch (state) {
              AsyncLoading() => const FecosListShimmer(itemCount: 6, itemHeight: 96),
              AsyncError(:final message) => _ErrorState(
                  message: message,
                  onRetry: controller.load,
                ),
              AsyncSuccess() => _SampleList(controller: controller),
              _ => const SizedBox.shrink(),
            };
          }),
        ),
      );
}

// ── Search bar ─────────────────────────────────────────────────────────────────

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.controller});
  final ArLabController controller;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 38,
        child: TextField(
          onChanged: (v) => controller.search.value = v,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Search samples, wells, clients…',
            hintStyle:
                TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 13),
            prefixIcon: Icon(Icons.search_rounded,
                size: 18, color: Colors.white.withValues(alpha: 0.7)),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.12),
            contentPadding: const EdgeInsets.symmetric(vertical: 0),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      );
}



// ── Filter chips (horizontal scroll, shown below app bar) ─────────────────────

class _FilterChips extends StatelessWidget {
  const _FilterChips({required this.controller});
  final ArLabController controller;

  static const _labels = {
    'ALL':      'All',
    'PENDING':  'Pending',
    'APPROVED': 'Approved',
    'URGENT':   'Urgent',
    'HIGH':     'High',
  };

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 44,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
          children: ArLabController.filters.map((f) {
            return Obx(() {
              final selected = controller.selectedFilter.value == f;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => controller.selectedFilter.value = f,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: selected
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _labels[f] ?? f,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected
                            ? AppColors.primary
                            : Colors.white.withValues(alpha: 0.85),
                      ),
                    ),
                  ),
                ),
              );
            });
          }).toList(),
        ),
      );
}

// ── Sample list ────────────────────────────────────────────────────────────────

class _SampleList extends StatelessWidget {
  const _SampleList({required this.controller});
  final ArLabController controller;

  @override
  Widget build(BuildContext context) => Obx(() {
        final samples = controller.filtered;
        if (samples.isEmpty) {
          return Center(
            child: Text(
              controller.search.value.isNotEmpty ||
                      controller.selectedFilter.value != 'ALL'
                  ? 'No samples match your filters'
                  : 'No lab samples found',
              style: const TextStyle(
                  color: AppColors.textHint, fontSize: 14),
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: controller.load,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: samples.length,
            separatorBuilder: (context, index) =>
                const SizedBox(height: 10),
            itemBuilder: (context, i) => _SampleCard(sample: samples[i]),
          ),
        );
      });
}

// ── Sample card ────────────────────────────────────────────────────────────────

class _SampleCard extends StatelessWidget {
  const _SampleCard({required this.sample});
  final LabSampleModel sample;

  Color get _priorityColor => switch (sample.priority) {
        'URGENT' => AppColors.danger,
        'HIGH'   => const Color(0xFFEA580C),
        'NORMAL' => AppColors.info,
        _        => AppColors.textHint,
      };

  Color get _approvalColor => switch (sample.approvalStatus) {
        'PENDING_REVIEW' => AppColors.warning,
        'APPROVED'       => AppColors.success,
        'REJECTED'       => AppColors.danger,
        _                => AppColors.textHint,
      };

  String get _approvalLabel => switch (sample.approvalStatus) {
        'PENDING_REVIEW' => 'Pending',
        'APPROVED'       => 'Approved',
        'REJECTED'       => 'Rejected',
        _                => sample.approvalStatus ?? '—',
      };

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => Get.to(() => ArSampleDetailView(sampleId: sample.id)),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: sample.hasCriticalValues
                  ? AppColors.danger.withValues(alpha: 0.4)
                  : sample.isPendingApproval
                      ? AppColors.warning.withValues(alpha: 0.4)
                      : AppColors.border,
              width:
                  (sample.hasCriticalValues || sample.isPendingApproval) ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 56,
                decoration: BoxDecoration(
                  color: _priorityColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            sample.sampleNumber,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        if (sample.hasCriticalValues)
                          const Padding(
                            padding: EdgeInsets.only(left: 4),
                            child: Icon(Icons.warning_rounded,
                                size: 15, color: AppColors.danger),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      sample.sampleType.replaceAll('_', ' '),
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      sample.wellName ?? sample.clientName ?? '—',
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textHint),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (sample.approvalStatus != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: _approvalColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _approvalLabel,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: _approvalColor,
                        ),
                      ),
                    ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _priorityColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      sample.priority,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: _priorityColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Icon(Icons.chevron_right_rounded,
                      size: 16, color: AppColors.textHint),
                ],
              ),
            ],
          ),
        ),
      );
}

// ── Error state ────────────────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded,
                size: 44, color: AppColors.textHint),
            const SizedBox(height: 12),
            const Text(
              'Could not load samples',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      );
}
