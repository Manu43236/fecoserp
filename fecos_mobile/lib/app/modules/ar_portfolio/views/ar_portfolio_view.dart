import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/data/models/client_model.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import '../controllers/ar_portfolio_controller.dart';
import 'ar_client_detail_view.dart';

class ArPortfolioView extends GetView<ArPortfolioController> {
  const ArPortfolioView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        body: RefreshIndicator(
          onRefresh: controller.load,
          color: AppColors.primary,
          child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.dark,
              foregroundColor: Colors.white,
              title: const Text(
                'Portfolio',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(56),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                  child: _SearchBar(controller: controller),
                ),
              ),
            ),
            Obx(() {
              final state = controller.state.value;
              return switch (state) {
                AsyncLoading() => SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverList.separated(
                      itemCount: 6,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) =>
                          const FecosShimmerCard(height: 96),
                    ),
                  ),
                AsyncError(:final message) => SliverFillRemaining(
                    child: _ErrorState(
                      message: message,
                      onRetry: controller.load,
                    ),
                  ),
                AsyncSuccess() => _ClientList(controller: controller),
                _ => const SliverToBoxAdapter(child: SizedBox.shrink()),
              };
            }),
          ],
        ),
        ),
      );
}

// ── Search bar ────────────────────────────────────────────────────────────────

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.controller});
  final ArPortfolioController controller;

  @override
  Widget build(BuildContext context) => Container(
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: TextField(
          onChanged: (v) => controller.search.value = v,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Search clients…',
            hintStyle: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 14,
            ),
            prefixIcon: Icon(
              Icons.search_rounded,
              color: Colors.white.withValues(alpha: 0.55),
              size: 20,
            ),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 10),
          ),
        ),
      );
}

// ── Client list ───────────────────────────────────────────────────────────────

class _ClientList extends StatelessWidget {
  const _ClientList({required this.controller});
  final ArPortfolioController controller;

  @override
  Widget build(BuildContext context) => Obx(() {
        final clients = controller.filteredClients;
        if (clients.isEmpty) {
          return const SliverFillRemaining(
            child: Center(
              child: Text(
                'No clients found',
                style: TextStyle(color: AppColors.textHint, fontSize: 14),
              ),
            ),
          );
        }
        return SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList.separated(
            itemCount: clients.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _ClientCard(
              client: clients[i],
              controller: controller,
            ),
          ),
        );
      });
}

// ── Client card ───────────────────────────────────────────────────────────────

class _ClientCard extends StatelessWidget {
  const _ClientCard({required this.client, required this.controller});
  final ClientModel client;
  final ArPortfolioController controller;

  @override
  Widget build(BuildContext context) {
    final plans = controller.plansFor(client.companyName);
    final activeCount = plans.where((p) => p.status == 'ACTIVE').length;
    final pending = controller.pendingCountFor(client.companyName);

    return GestureDetector(
      onTap: () => Get.to(
        () => ArClientDetailView(
          client: client,
          plans: plans,
          pendingCount: pending,
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: pending > 0
                ? AppColors.warning.withValues(alpha: 0.4)
                : AppColors.border,
          ),
        ),
        child: Row(
          children: [
            // Initials avatar
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  client.companyName.length >= 2
                      ? client.companyName.substring(0, 2).toUpperCase()
                      : client.companyName.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    client.companyName,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (client.contactName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      client.contactName!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      _Chip(
                        label: '$activeCount active plan${activeCount == 1 ? '' : 's'}',
                        color: AppColors.success,
                      ),
                      if (pending > 0) ...[
                        const SizedBox(width: 6),
                        _Chip(
                          label: '$pending pending',
                          color: AppColors.warning,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            const Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: AppColors.textHint,
            ),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: color,
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
              'Could not load portfolio',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
}
