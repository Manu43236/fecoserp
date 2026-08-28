import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/dashboard_data.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final user = controller.auth.user.value;
    final firstName = user?.name.split(' ').first ?? 'there';

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          _GreetingAppBar(
            firstName: firstName,
            connectivity: controller.connectivity,
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            sliver: Obx(() {
              if (controller.isLoading.value) return _LoadingSkeleton();
              if (controller.hasError.value) return _ErrorState(onRetry: controller.load);

              if (controller.isTruckDriver) {
                return _DriverDashboardContent(routes: controller.todayRoutes);
              }
              final data = controller.dashboard.value;
              if (data == null) return _LoadingSkeleton();
              return _DashboardContent(data: data, upcoming: controller.upcoming);
            }),
          ),
        ],
      ),
    );
  }
}

// ── Dashboard content (loaded) ───────────────────────────────────────────────

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({required this.data, required this.upcoming});
  final DashboardData data;
  final List<MyVisit> upcoming;

  @override
  Widget build(BuildContext context) => SliverList(
        delegate: SliverChildListDelegate([
          _SectionLabel(icon: Icons.bar_chart_rounded, label: "Today's Overview"),
          const SizedBox(height: 10),
          _StatRow(data: data),

          const SizedBox(height: 24),

          _SectionLabel(
            icon: Icons.science_rounded,
            label: "Today's Visits",
            onTap: () => Get.toNamed(Routes.serviceVisit),
          ),
          const SizedBox(height: 10),
          _VisitsSummaryCard(data: data),

          const SizedBox(height: 24),

          _SectionLabel(icon: Icons.calendar_month_rounded, label: 'Upcoming'),
          const SizedBox(height: 10),
          _UpcomingSection(visits: upcoming),
        ]),
      );
}

// ── Stat row ──────────────────────────────────────────────────────────────────

class _StatRow extends StatelessWidget {
  const _StatRow({required this.data});
  final DashboardData data;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Expanded(
            child: _StatCard(
              value: '${data.visitsTotal}',
              label: 'Visits',
              icon: Icons.calendar_today_rounded,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _StatCard(
              value: '${data.stopsCompleted}',
              label: 'Completed',
              icon: Icons.check_circle_rounded,
              color: AppColors.success,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _StatCard(
              value: '${data.stopsTotal - data.stopsCompleted}',
              label: 'Remaining',
              icon: Icons.pending_rounded,
              color: AppColors.warning,
            ),
          ),
        ],
      );
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });

  final String value;
  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
}

// ── Visits summary card ───────────────────────────────────────────────────────

class _VisitsSummaryCard extends StatelessWidget {
  const _VisitsSummaryCard({required this.data});
  final DashboardData data;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => Get.toNamed(Routes.serviceVisit),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text(
                    'Wells to service today',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${data.stopsCompleted}/${data.stopsTotal} stops',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: data.stopsTotal > 0
                      ? data.stopsCompleted / data.stopsTotal
                      : 0,
                  backgroundColor: AppColors.border,
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(AppColors.primary),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.arrow_forward_rounded,
                      size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  const Text(
                    'View my visits',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
}

// ── Upcoming section ──────────────────────────────────────────────────────────

class _UpcomingSection extends StatelessWidget {
  const _UpcomingSection({required this.visits});
  final List<MyVisit> visits;

  String _dateLabel(String visitDate) {
    final date = DateTime.parse(visitDate);
    final today = DateTime.now();
    final tomorrow = today.add(const Duration(days: 1));
    if (date.year == tomorrow.year &&
        date.month == tomorrow.month &&
        date.day == tomorrow.day) {
      return 'Tomorrow';
    }
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${days[date.weekday - 1]}, ${months[date.month - 1]} ${date.day}';
  }

  @override
  Widget build(BuildContext context) {
    if (visits.isEmpty) {
      return Container(
        height: 88,
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(
          child: Text(
            'No upcoming visits scheduled',
            style: TextStyle(fontSize: 13, color: AppColors.textHint),
          ),
        ),
      );
    }

    return Column(
      children: visits.map((visit) {
        final stopCount = visit.stops.length;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: ListTile(
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.calendar_today_rounded,
                  size: 18, color: AppColors.primary),
            ),
            title: Text(
              _dateLabel(visit.visitDate),
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            subtitle: Text(
              '$stopCount well${stopCount == 1 ? '' : 's'} to service',
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textSecondary),
            ),
            trailing: const Icon(Icons.chevron_right_rounded,
                size: 20, color: AppColors.textHint),
            onTap: () => Get.toNamed(Routes.serviceVisit),
          ),
        );
      }).toList(),
    );
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

class _LoadingSkeleton extends SliverToBoxAdapter {
  _LoadingSkeleton()
      : super(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionLabel(icon: Icons.bar_chart_rounded, label: "Today's Overview"),
              const SizedBox(height: 10),
              const FecosShimmerStatRow(count: 3),
              const SizedBox(height: 24),
              const _SectionLabel(icon: Icons.science_rounded, label: "Today's Visits"),
              const SizedBox(height: 10),
              const FecosShimmerCard(height: 90),
            ],
          ),
        );
}

// ── Error state ───────────────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.only(top: 60),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.wifi_off_rounded,
                    size: 48, color: AppColors.textHint),
                const SizedBox(height: 16),
                const Text(
                  'Could not load dashboard',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: onRetry,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
}

// ── Greeting sliver app bar ──────────────────────────────────────────────────

class _GreetingAppBar extends StatelessWidget {
  const _GreetingAppBar({required this.firstName, required this.connectivity});

  final String firstName;
  final dynamic connectivity;

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  String get _todayLabel {
    final now = DateTime.now();
    const days = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday'
    ];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${days[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}';
  }

  @override
  Widget build(BuildContext context) => SliverAppBar(
        expandedHeight: 90,
        pinned: true,
        backgroundColor: AppColors.dark,
        automaticallyImplyLeading: false,
        actions: [
          Obx(() {
            final online = connectivity.isOnline.value as bool;
            return Container(
              margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: online
                    ? AppColors.success.withValues(alpha: 0.18)
                    : AppColors.danger.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.circle,
                      size: 7,
                      color: online ? AppColors.success : AppColors.danger),
                  const SizedBox(width: 5),
                  Text(
                    online ? 'Online' : 'Offline',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
        flexibleSpace: FlexibleSpaceBar(
          background: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.dark, AppColors.primary],
              ),
            ),
            padding: const EdgeInsets.fromLTRB(20, 52, 20, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  '$_greeting, $firstName',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  _todayLabel,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.72),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          collapseMode: CollapseMode.parallax,
        ),
      );
}

// ── Section label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const Spacer(),
          if (onTap != null)
            GestureDetector(
              onTap: onTap,
              child: const Text(
                'See all',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      );
}

// ── Truck Driver dashboard ────────────────────────────────────────────────────

class _DriverDashboardContent extends StatelessWidget {
  const _DriverDashboardContent({required this.routes});
  final List<RouteModel> routes;

  @override
  Widget build(BuildContext context) {
    final totalStops = routes.fold(0, (sum, r) => sum + r.stopCount);
    final deliveredStops = routes.fold(0, (sum, r) => sum + r.completedStops);
    final remainingRoutes = routes
        .where((r) => r.status != 'COMPLETED' && r.status != 'CANCELLED')
        .length;

    return SliverList(
      delegate: SliverChildListDelegate([
        // Context-aware status banner
        _DayStatusBanner(
          routes: routes,
          remainingRoutes: remainingRoutes,
          deliveredStops: deliveredStops,
          totalStops: totalStops,
        ),
        const SizedBox(height: 16),

        // Stats row
        _DriverStatsRow(
          routeCount: routes.length,
          deliveredStops: deliveredStops,
          totalStops: totalStops,
          remainingRoutes: remainingRoutes,
        ),
        const SizedBox(height: 24),

        // All today's routes (every status)
        const _SectionLabel(
          icon: Icons.local_shipping_rounded,
          label: "Today's Routes",
        ),
        const SizedBox(height: 10),

        if (routes.isEmpty)
          Container(
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.surfaceCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: const Center(
              child: Text('No routes assigned for today',
                  style: TextStyle(fontSize: 13, color: AppColors.textHint)),
            ),
          )
        else
          ...routes.map((r) => _DriverRouteCard(route: r)),
      ]),
    );
  }
}

// ── Day status banner ─────────────────────────────────────────────────────────

class _DayStatusBanner extends StatelessWidget {
  const _DayStatusBanner({
    required this.routes,
    required this.remainingRoutes,
    required this.deliveredStops,
    required this.totalStops,
  });

  final List<RouteModel> routes;
  final int remainingRoutes;
  final int deliveredStops;
  final int totalStops;

  @override
  Widget build(BuildContext context) {
    if (routes.isEmpty) return const SizedBox.shrink();

    final allDone = remainingRoutes == 0;
    final inProgress = routes.any((r) => r.status == 'IN_PROGRESS');
    final progress = totalStops > 0 ? deliveredStops / totalStops : 0.0;

    final Color bg;
    final Color fg;
    final IconData icon;
    final String title;
    final String subtitle;

    if (allDone) {
      bg = AppColors.success;
      fg = Colors.white;
      icon = Icons.celebration_rounded;
      title = 'All done for today!';
      subtitle = deliveredStops > 0
          ? 'Delivered $deliveredStops stop${deliveredStops == 1 ? '' : 's'} across ${routes.length} route${routes.length == 1 ? '' : 's'}'
          : '${routes.length} route${routes.length == 1 ? '' : 's'} completed today';
    } else if (inProgress) {
      bg = AppColors.warning;
      fg = Colors.white;
      icon = Icons.local_shipping_rounded;
      title = 'Route in progress';
      subtitle = '$remainingRoutes route${remainingRoutes == 1 ? '' : 's'} remaining · $deliveredStops/$totalStops stops done';
    } else {
      bg = AppColors.info;
      fg = Colors.white;
      icon = Icons.assignment_rounded;
      title = 'Ready to roll';
      subtitle = '${routes.length} route${routes.length == 1 ? '' : 's'} assigned · $totalStops stop${totalStops == 1 ? '' : 's'} total';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: fg, size: 20),
              const SizedBox(width: 8),
              Text(title,
                  style: TextStyle(
                      color: fg,
                      fontSize: 15,
                      fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 4),
          Text(subtitle,
              style: TextStyle(
                  color: fg.withValues(alpha: 0.85), fontSize: 12)),
          if (!allDone && totalStops > 0) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.white.withValues(alpha: 0.25),
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                minHeight: 6,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Stats row ─────────────────────────────────────────────────────────────────

class _DriverStatsRow extends StatelessWidget {
  const _DriverStatsRow({
    required this.routeCount,
    required this.deliveredStops,
    required this.totalStops,
    required this.remainingRoutes,
  });

  final int routeCount;
  final int deliveredStops;
  final int totalStops;
  final int remainingRoutes;

  @override
  Widget build(BuildContext context) => IntrinsicHeight(
        child: Row(
          children: [
            Expanded(
              child: _StatTile(
                value: '$routeCount',
                label: 'Routes\nToday',
                color: AppColors.primary,
              ),
            ),
            const _StatDivider(),
            Expanded(
              child: _StatTile(
                value: '$deliveredStops',
                sublabel: '/ $totalStops stops',
                label: 'Delivered',
                color: AppColors.success,
              ),
            ),
            const _StatDivider(),
            Expanded(
              child: _StatTile(
                value: '$remainingRoutes',
                label: 'Routes\nLeft',
                color: remainingRoutes > 0 ? AppColors.warning : AppColors.success,
              ),
            ),
          ],
        ),
      );
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.value,
    required this.label,
    required this.color,
    this.sublabel,
  });

  final String value;
  final String label;
  final Color color;
  final String? sublabel;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.18)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(value,
                    style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: color,
                        height: 1)),
                if (sublabel != null) ...[
                  const SizedBox(width: 2),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 3),
                    child: Text(sublabel!,
                        style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500)),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 4),
            Text(label,
                style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                    height: 1.3)),
          ],
        ),
      );
}

class _StatDivider extends StatelessWidget {
  const _StatDivider();
  @override
  Widget build(BuildContext context) => const SizedBox(width: 8);
}

// ── Route card (all statuses) ─────────────────────────────────────────────────

class _DriverRouteCard extends StatelessWidget {
  const _DriverRouteCard({required this.route});
  final RouteModel route;

  Color get _accentColor => switch (route.status) {
        'IN_PROGRESS' => AppColors.warning,
        'DISPATCHED'  => AppColors.info,
        'COMPLETED'   => AppColors.success,
        'CANCELLED'   => AppColors.danger,
        _             => AppColors.textHint,
      };

  String get _statusLabel => switch (route.status) {
        'IN_PROGRESS' => 'In Progress',
        'DISPATCHED'  => 'Dispatched',
        'COMPLETED'   => 'Completed',
        'CANCELLED'   => 'Cancelled',
        'PLANNED'     => 'Planned',
        _             => route.status,
      };

  IconData get _statusIcon => switch (route.status) {
        'COMPLETED'   => Icons.check_circle_rounded,
        'CANCELLED'   => Icons.cancel_rounded,
        'IN_PROGRESS' => Icons.local_shipping_rounded,
        _             => Icons.schedule_rounded,
      };

  bool get _isDone =>
      route.status == 'COMPLETED' || route.status == 'CANCELLED';

  @override
  Widget build(BuildContext context) {
    final progress = route.stopCount > 0
        ? route.completedStops / route.stopCount
        : 0.0;

    return GestureDetector(
      onTap: () =>
          Get.toNamed(Routes.deliveryDetail.replaceFirst(':id', route.id)),
      child: Opacity(
        opacity: _isDone ? 0.72 : 1.0,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _isDone
                  ? AppColors.border
                  : _accentColor.withValues(alpha: 0.35),
              width: _isDone ? 1 : 1.5,
            ),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
                child: Row(
                  children: [
                    // Status icon circle
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: _accentColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Icon(_statusIcon, size: 20, color: _accentColor),
                    ),
                    const SizedBox(width: 12),
                    // Route info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            route.truckNumber ?? 'Route',
                            style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${route.completedStops}/${route.stopCount} stops delivered',
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    // Status badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _accentColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _accentColor),
                      ),
                    ),
                  ],
                ),
              ),
              // Progress bar for non-cancelled routes with stops
              if (route.status != 'CANCELLED' && route.stopCount > 0) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          backgroundColor: AppColors.border,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(_accentColor),
                          minHeight: 5,
                        ),
                      ),
                      if (!_isDone) ...[
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: Text(
                            route.status == 'IN_PROGRESS'
                                ? 'Continue →'
                                : 'View Route →',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _accentColor),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

