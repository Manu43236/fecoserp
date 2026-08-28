import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/data/models/plan_model.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import '../controllers/ar_plans_controller.dart';
import 'ar_plan_detail_view.dart';

class ArPlansView extends GetView<ArPlansController> {
  const ArPlansView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        body: NestedScrollView(
          headerSliverBuilder: (context, _) => [
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.dark,
              foregroundColor: Colors.white,
              title: const Text(
                'Plans',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(52),
                child: _FilterChips(controller: controller),
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
              AsyncSuccess(:final data) => _PlanList(plans: data),
              _ => const SizedBox.shrink(),
            };
          }),
        ),
      );
}

// ── Filter chips ──────────────────────────────────────────────────────────────

class _FilterChips extends StatelessWidget {
  const _FilterChips({required this.controller});
  final ArPlansController controller;

  static const _labels = {
    'ALL': 'All',
    'ACTIVE': 'Active',
    'DRAFT': 'Draft',
    'PAUSED': 'Paused',
    'SUSPENDED': 'Suspended',
    'COMPLETED': 'Completed',
  };

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 52,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
          children: controller.statuses.map((s) {
            return Obx(() {
              final selected = controller.selectedStatus.value == s;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => controller.load(status: s),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: selected
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _labels[s] ?? s,
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

// ── Plan list ─────────────────────────────────────────────────────────────────

class _PlanList extends StatelessWidget {
  const _PlanList({required this.plans});
  final List<PlanModel> plans;

  @override
  Widget build(BuildContext context) {
    if (plans.isEmpty) {
      return const Center(
        child: Text(
          'No plans found',
          style: TextStyle(color: AppColors.textHint, fontSize: 14),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => Get.find<ArPlansController>().load(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: plans.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _PlanCard(plan: plans[i]),
      ),
    );
  }
}

// ── Plan card ─────────────────────────────────────────────────────────────────

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan});
  final PlanModel plan;

  Color get _statusColor => switch (plan.status) {
        'ACTIVE'     => AppColors.success,
        'PAUSED'     => AppColors.warning,
        'SUSPENDED'  => const Color(0xFFEA580C),
        'SUPERSEDED' => AppColors.textHint,
        'COMPLETED'  => AppColors.info,
        _            => AppColors.textHint,
      };

  String get _statusLabel => switch (plan.status) {
        'ACTIVE'     => 'Active',
        'DRAFT'      => 'Draft',
        'PAUSED'     => 'Paused',
        'SUSPENDED'  => 'Suspended',
        'COMPLETED'  => 'Completed',
        'SUPERSEDED' => 'Superseded',
        _            => plan.status,
      };

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => Get.to(
          () => ArPlanDetailView(planId: plan.id),
        ),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: plan.status == 'ACTIVE'
                  ? AppColors.success.withValues(alpha: 0.3)
                  : AppColors.border,
              width: plan.status == 'ACTIVE' ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 52,
                decoration: BoxDecoration(
                  color: _statusColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plan.wellName ?? '—',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      plan.leaseName ?? '—',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      plan.clientName ?? '—',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textHint,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: _statusColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${plan.lineCount} product${plan.lineCount == 1 ? '' : 's'}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textHint,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: AppColors.textHint,
                  ),
                ],
              ),
            ],
          ),
        ),
      );
}

// ── Error state ───────────────────────────────────────────────────────────────

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
              'Could not load plans',
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
