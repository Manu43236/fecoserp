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
              final data = controller.dashboard.value!;
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
    final activeRoutes = routes.where((r) => r.isActive).toList();
    final plannedRoutes = routes.where((r) => r.status == 'PLANNED').toList();
    final totalStops = routes.fold(0, (sum, r) => sum + r.stopCount);
    final deliveredStops = routes.fold(0, (sum, r) => sum + r.completedStops);

    return SliverList(
      delegate: SliverChildListDelegate([
        Row(
          children: [
            Expanded(
              child: _DriverStatCard(
                value: '${routes.length}',
                label: 'Routes Today',
                icon: Icons.route_rounded,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _DriverStatCard(
                value: '$deliveredStops/$totalStops',
                label: 'Delivered',
                icon: Icons.check_circle_rounded,
                color: AppColors.success,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _DriverStatCard(
                value: '${totalStops - deliveredStops}',
                label: 'Remaining',
                icon: Icons.pending_rounded,
                color: AppColors.warning,
              ),
            ),
          ],
        ),

        if (activeRoutes.isNotEmpty) ...[
          const SizedBox(height: 24),
          const _SectionLabel(icon: Icons.local_shipping_rounded, label: 'Active Routes'),
          const SizedBox(height: 10),
          ...activeRoutes.map((r) => _RouteCard(route: r)),
        ],

        if (plannedRoutes.isNotEmpty) ...[
          const SizedBox(height: 24),
          const _SectionLabel(icon: Icons.schedule_rounded, label: 'Planned Routes'),
          const SizedBox(height: 10),
          ...plannedRoutes.map((r) => _RouteCard(route: r)),
        ],

        if (routes.isEmpty)
          Container(
            height: 120,
            margin: const EdgeInsets.only(top: 20),
            decoration: BoxDecoration(
              color: AppColors.surfaceCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: const Center(
              child: Text('No routes assigned for today',
                  style: TextStyle(fontSize: 13, color: AppColors.textHint)),
            ),
          ),
      ]),
    );
  }
}

class _DriverStatCard extends StatelessWidget {
  const _DriverStatCard({
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
            Text(value,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.w700, color: color)),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      );
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.route});
  final RouteModel route;

  Color get _color => switch (route.status) {
        'IN_PROGRESS' => AppColors.warning,
        'DISPATCHED'  => AppColors.info,
        _             => AppColors.textHint,
      };

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => Get.toNamed(
          Routes.deliveryDetail.replaceFirst(':id', route.id),
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: route.isActive
                  ? _color.withValues(alpha: 0.3)
                  : AppColors.border,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.local_shipping_rounded, size: 20, color: _color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      route.truckNumber ?? 'Route',
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary),
                    ),
                    Text(
                      '${route.completedStops}/${route.stopCount} stops · ${route.status == 'IN_PROGRESS' ? 'In Progress' : 'Dispatched'}',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  size: 20, color: AppColors.textHint),
            ],
          ),
        ),
      );
}

