import 'package:flutter/material.dart';
import 'package:get/get.dart';
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
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Pre-trip card
                _SectionLabel(
                  icon: Icons.checklist_rounded,
                  label: 'Pre-Trip Inspection',
                  onTap: () => Get.toNamed(Routes.preTrip),
                ),
                const SizedBox(height: 10),
                _ComingSoonCard(
                  height: 88,
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.directions_car_rounded,
                            color: AppColors.warning, size: 22),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            FecosShimmer(height: 13, width: 140, borderRadius: 4),
                            SizedBox(height: 8),
                            FecosShimmer(height: 11, borderRadius: 4),
                          ],
                        ),
                      ),
                      const _ComingSoonBadge(),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Today's stats row
                _SectionLabel(
                  icon: Icons.bar_chart_rounded,
                  label: "Today's Overview",
                ),
                const SizedBox(height: 10),
                const FecosShimmerStatRow(count: 3),

                const SizedBox(height: 24),

                // Visit summary
                _SectionLabel(
                  icon: Icons.science_rounded,
                  label: "Today's Visits",
                  onTap: () => Get.toNamed(
                    Routes.serviceVisit,
                    parameters: {'id': 'list'},
                  ),
                ),
                const SizedBox(height: 10),
                const FecosShimmerCard(height: 90),
                const SizedBox(height: 10),
                const FecosShimmerCard(height: 90),

                const SizedBox(height: 24),

                // Upcoming
                _SectionLabel(
                  icon: Icons.calendar_month_rounded,
                  label: 'Upcoming',
                ),
                const SizedBox(height: 10),
                const _ComingSoonCard(
                  height: 120,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.calendar_today_rounded,
                            size: 32, color: AppColors.textHint),
                        SizedBox(height: 8),
                        Text(
                          'Upcoming schedule — Coming Soon',
                          style: TextStyle(
                            color: AppColors.textHint,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Greeting sliver app bar ──────────────────────────────────────────────────

class _GreetingAppBar extends StatelessWidget {
  const _GreetingAppBar({
    required this.firstName,
    required this.connectivity,
  });

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
        expandedHeight: 130,
        pinned: true,
        backgroundColor: AppColors.dark,
        flexibleSpace: FlexibleSpaceBar(
          background: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.dark, AppColors.primary],
              ),
            ),
            padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  '$_greeting, $firstName',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _todayLabel,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.75),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          title: Obx(() {
            final online = connectivity.isOnline.value as bool;
            return Row(
              children: [
                const Text(
                  'Home',
                  style: TextStyle(color: Colors.white, fontSize: 17),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: online
                        ? AppColors.success.withValues(alpha: 0.2)
                        : AppColors.danger.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.circle,
                        size: 7,
                        color: online ? AppColors.success : AppColors.danger,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        online ? 'Online' : 'Offline',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          }),
          titlePadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
          collapseMode: CollapseMode.parallax,
        ),
      );
}

// ── Section label row ────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({
    required this.icon,
    required this.label,
    this.onTap,
  });

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

// ── Coming soon card wrapper ─────────────────────────────────────────────────

class _ComingSoonCard extends StatelessWidget {
  const _ComingSoonCard({required this.height, required this.child});

  final double height;
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        padding: const EdgeInsets.all(14),
        child: child,
      );
}

// ── Coming soon badge ────────────────────────────────────────────────────────

class _ComingSoonBadge extends StatelessWidget {
  const _ComingSoonBadge();

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.2),
          ),
        ),
        child: const Text(
          'Coming Soon',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppColors.primary,
          ),
        ),
      );
}
