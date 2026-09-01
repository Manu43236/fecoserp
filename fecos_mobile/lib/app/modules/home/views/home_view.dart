import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/dashboard_data.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';
import 'package:fecos_mobile/app/modules/main/controllers/main_controller.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final user = controller.auth.user.value;
    final firstName = user?.name.split(' ').first ?? 'there';

    final isServiceTech = !controller.isTruckDriver && !controller.isAccountRep;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: RefreshIndicator(
        onRefresh: controller.load,
        color: AppColors.primary,
        child: CustomScrollView(
          slivers: [
            if (isServiceTech)
              _StHeroAppBar(
                firstName: firstName,
                connectivity: controller.connectivity,
              )
            else
              _GreetingAppBar(
                firstName: firstName,
                connectivity: controller.connectivity,
              ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
              sliver: Obx(() {
                if (controller.isLoading.value) return _LoadingSkeleton();
                if (controller.hasError.value) {
                  return _ErrorState(onRetry: controller.load);
                }
                if (controller.isTruckDriver) {
                  return _DriverDashboardContent(
                    routes: controller.todayRoutes,
                    syncService: controller.syncService,
                    onSyncNow: controller.load,
                  );
                }
                if (controller.isAccountRep) {
                  return _ArDashboardContent(
                    pendingCount: controller.arPendingCount.value,
                    clientCount: controller.arClientCount.value,
                    criticalCount: controller.arCriticalCount.value,
                  );
                }
                final data = controller.dashboard.value;
                if (data == null) return _LoadingSkeleton();
                controller.todayVisitsVersion.value; // track visit mutations
                return _DashboardContent(
                  data: data,
                  todayVisits: controller.todayVisits,
                  upcoming: controller.upcoming,
                  syncService: controller.syncService,
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Dashboard content (loaded) ───────────────────────────────────────────────

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({
    required this.data,
    required this.todayVisits,
    required this.upcoming,
    required this.syncService,
  });
  final DashboardData data;
  final List<MyVisit> todayVisits;
  final List<MyVisit> upcoming;
  final SyncService syncService;

  @override
  Widget build(BuildContext context) {
    final allStops = todayVisits.expand((v) => v.stops).toList();
    final soarStops = allStops.where((s) => s.hasSoar && !s.soarAcknowledged).toList();

    return SliverList(
      delegate: SliverChildListDelegate([
        // Sync status bar
        Obx(() {
          final pending = syncService.pendingCount.value;
          final syncing = syncService.isSyncing.value;
          if (pending == 0) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  if (syncing)
                    const SizedBox(
                      width: 14, height: 14,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.warning),
                    )
                  else
                    const Icon(Icons.cloud_upload_rounded,
                        size: 16, color: AppColors.warning),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      syncing
                          ? 'Syncing $pending report${pending == 1 ? '' : 's'}…'
                          : '$pending report${pending == 1 ? '' : 's'} pending sync',
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.warning),
                    ),
                  ),
                  if (!syncing)
                    GestureDetector(
                      onTap: () async {
                        if (!Get.find<ConnectivityService>().isOnline.value) {
                          FecosSnackbar.info('No Network', 'Connect to sync your reports');
                          return;
                        }
                        await Get.find<SyncService>().syncNow();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.warning,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Sync Now',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Colors.white)),
                      ),
                    ),
                ],
              ),
            ),
          );
        }),

        // Today hero card — always first
        _TodayHeroCard(data: data),
        const SizedBox(height: 24),

        // SOAR alert
        if (soarStops.isNotEmpty) ...[
          _SoarAlertCard(stops: soarStops),
          const SizedBox(height: 24),
        ],

        _SectionLabel(
          icon: Icons.science_rounded,
          label: "Today's Wells",
          onTap: () => Get.toNamed(Routes.serviceVisit),
        ),
        const SizedBox(height: 10),
        _TodayVisitsSection(visits: todayVisits, totalStops: data.stopsTotal),

        const SizedBox(height: 24),
        _SectionLabel(icon: Icons.bar_chart_rounded, label: 'This Week'),
        const SizedBox(height: 10),
        _WeekStatsRow(
          weekVisits: data.weekVisitsTotal,
          weekWells: data.weekStopsTotal,
        ),

        if (upcoming.isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionLabel(icon: Icons.calendar_month_rounded, label: 'Upcoming'),
          const SizedBox(height: 10),
          _UpcomingSection(visits: upcoming),
        ],
      ]),
    );
  }
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

// ── Today hero card ───────────────────────────────────────────────────────────

class _TodayHeroCard extends StatelessWidget {
  const _TodayHeroCard({required this.data});
  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    final progress = data.stopsTotal > 0
        ? data.stopsCompleted / data.stopsTotal
        : 0.0;
    final allDone = data.stopsTotal > 0 && data.stopsCompleted == data.stopsTotal;
    final pct = (progress * 100).toInt();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF3B0900), AppColors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.4),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              const Text(
                'TODAY',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: allDone ? 0.25 : 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (allDone)
                      const Icon(Icons.check_rounded,
                          size: 12, color: Colors.white),
                    if (allDone) const SizedBox(width: 4),
                    Text(
                      allDone
                          ? 'All done'
                          : data.stopsTotal == 0
                              ? 'No wells'
                              : 'In progress',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Stats row
          IntrinsicHeight(
            child: Row(
              children: [
                _HeroStat(value: '${data.visitsTotal}', label: 'Visits'),
                _HeroDivider(),
                _HeroStat(value: '${data.stopsCompleted}', label: 'Done'),
                _HeroDivider(),
                _HeroStat(
                  value: '${data.stopsTotal - data.stopsCompleted}',
                  label: 'Remaining',
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.white.withValues(alpha: 0.2),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              minHeight: 5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$pct% complete',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.65),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w800,
                height: 1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.65),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
}

class _HeroDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        width: 1,
        margin: const EdgeInsets.only(right: 20),
        color: Colors.white.withValues(alpha: 0.2),
      );
}

// ── SOAR alert banner ─────────────────────────────────────────────────────────

class _SoarAlertCard extends StatelessWidget {
  const _SoarAlertCard({required this.stops});
  final List<MyVisitStop> stops;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.danger.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.danger.withValues(alpha: 0.4)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.warning_amber_rounded,
                size: 20, color: AppColors.danger),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${stops.length} SOAR Alert${stops.length == 1 ? '' : 's'} — Needs Acknowledgement',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.danger,
                    ),
                  ),
                  const SizedBox(height: 4),
                  ...stops.map((s) => Text(
                        '· ${s.wellName}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.danger,
                        ),
                      )),
                ],
              ),
            ),
          ],
        ),
      );
}


// ── Today's visits with inline stops ─────────────────────────────────────────

class _TodayVisitsSection extends StatelessWidget {
  const _TodayVisitsSection({required this.visits, required this.totalStops});
  final List<MyVisit> visits;
  final int totalStops;

  @override
  Widget build(BuildContext context) {
    if (visits.isEmpty) {
      return GestureDetector(
        onTap: () => Get.toNamed(Routes.serviceVisit),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle_outline_rounded,
                  size: 20, color: AppColors.textHint),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'No visits scheduled for today',
                  style: TextStyle(fontSize: 13, color: AppColors.textHint),
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  size: 18, color: AppColors.textHint),
            ],
          ),
        ),
      );
    }

    return Column(
      children: visits.map((visit) => _VisitCard(visit: visit)).toList(),
    );
  }
}

String _fmtVisitDate(String visitDate) {
  try {
    final d = DateTime.parse(visitDate);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[d.month - 1]} ${d.day}';
  } catch (_) {
    return 'Visit';
  }
}

class _VisitCard extends StatelessWidget {
  const _VisitCard({required this.visit});
  final MyVisit visit;

  Color get _statusColor => switch (visit.status) {
        'IN_PROGRESS' => AppColors.primary,
        'COMPLETED' => AppColors.success,
        _ => AppColors.warning,
      };

  String get _statusLabel => switch (visit.status) {
        'IN_PROGRESS' => 'In Progress',
        'COMPLETED' => 'Completed',
        _ => 'Scheduled',
      };

  void _goToServiceVisit() {
    if (!Get.find<ConnectivityService>().isOnline.value) {
      Get.find<MainController>().changeTab(1);
      return;
    }
    Get.toNamed(
      Routes.serviceVisit.replaceFirst(':id', visit.id),
      arguments: visit,
    );
  }

  void _onStopTap(MyVisitStop stop) {
    if (visit.status == 'SCHEDULED') {
      _goToServiceVisit();
    } else if (stop.hasReport) {
      Get.toNamed(
        Routes.reportView
            .replaceFirst(':visitId', visit.id)
            .replaceFirst(':stopId', stop.id),
        arguments: stop,
      );
    } else {
      Get.toNamed(
        Routes.wellStop
            .replaceFirst(':visitId', visit.id)
            .replaceFirst(':stopId', stop.id),
        arguments: stop,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final completed = visit.stops.where((s) => s.hasReport).length;
    final total = visit.stops.length;

    return Obx(() {
      final isOnline = Get.find<ConnectivityService>().isOnline.value;
      final isSyncing = isOnline && Get.find<SyncService>().syncingVisitIds.contains(visit.id);
      return _buildCard(isSyncing, completed, total);
    });
  }

  Widget _buildCard(bool isSyncing, int completed, int total) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          IgnorePointer(
            ignoring: isSyncing,
            child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Visit header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        visit.name ?? _fmtVisitDate(visit.visitDate),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$completed of $total well${total == 1 ? '' : 's'} done',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.1),
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
              ],
            ),
          ),
          // Thin progress bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: total > 0 ? completed / total : 0,
                backgroundColor: AppColors.border,
                valueColor: AlwaysStoppedAnimation<Color>(_statusColor),
                minHeight: 3,
              ),
            ),
          ),
          // Stop list
          ...visit.stops.map((stop) => _StopRow(
                stop: stop,
                isLast: stop == visit.stops.last,
                onTap: () => _onStopTap(stop),
              )),
          // Start visit nudge
          if (visit.status == 'SCHEDULED')
            InkWell(
              onTap: _goToServiceVisit,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.06),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(16),
                    bottomRight: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.play_circle_outline_rounded,
                        size: 15, color: AppColors.warning),
                    const SizedBox(width: 6),
                    const Text(
                      'Tap to start this visit',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.warning,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ],
          ),
          ),
          if (isSyncing)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary,
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Syncing...',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StopRow extends StatelessWidget {
  const _StopRow({
    required this.stop,
    required this.onTap,
    required this.isLast,
  });
  final MyVisitStop stop;
  final VoidCallback onTap;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final hasSoarAlert = stop.hasSoar && !stop.soarAcknowledged;
    final accentColor =
        hasSoarAlert ? AppColors.danger : stop.hasReport ? AppColors.success : AppColors.primary;

    return InkWell(
      onTap: onTap,
      borderRadius: isLast
          ? const BorderRadius.only(
              bottomLeft: Radius.circular(16),
              bottomRight: Radius.circular(16),
            )
          : null,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Left accent bar
            Container(
              width: 3,
              margin: const EdgeInsets.only(left: 16, top: 2, bottom: 2),
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  top: 12,
                  bottom: isLast ? 16 : 12,
                  right: 16,
                ),
                child: Row(
                  children: [
                    // Sequence circle
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: accentColor.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${stop.sequence}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: accentColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Well name + client
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            stop.wellName,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            stop.clientName.isNotEmpty
                                ? '${stop.clientName} · ${stop.leaseName}'
                                : stop.leaseName,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Right status
                    if (hasSoarAlert)
                      const Icon(Icons.warning_amber_rounded,
                          size: 18, color: AppColors.danger)
                    else if (stop.hasReport)
                      const Icon(Icons.check_circle_rounded,
                          size: 20, color: AppColors.success)
                    else
                      const Icon(Icons.chevron_right_rounded,
                          size: 20, color: AppColors.textHint),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
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
            onTap: () => Get.toNamed(
              Routes.serviceVisit.replaceFirst(':id', visit.id),
              arguments: visit,
            ),
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

// ── ST flat app bar ───────────────────────────────────────────────────────────

class _StHeroAppBar extends StatelessWidget {
  const _StHeroAppBar({required this.firstName, required this.connectivity});

  final String firstName;
  final ConnectivityService connectivity;

  String get _todayLabel {
    final now = DateTime.now();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${days[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}';
  }

  @override
  Widget build(BuildContext context) => SliverAppBar(
        pinned: true,
        floating: false,
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shadowColor: Colors.transparent,
        automaticallyImplyLeading: false,
        toolbarHeight: 60,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Hello, $firstName',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              _todayLabel,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        actions: [
          Obx(() {
            final online = connectivity.isOnline.value;
            return Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: online
                    ? AppColors.success.withValues(alpha: 0.12)
                    : AppColors.danger.withValues(alpha: 0.12),
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
                    style: TextStyle(
                      fontSize: 11,
                      color: online ? AppColors.success : AppColors.danger,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      );
}

// ── Week stats row ────────────────────────────────────────────────────────────

class _WeekStatsRow extends StatelessWidget {
  const _WeekStatsRow({required this.weekVisits, required this.weekWells});
  final int weekVisits;
  final int weekWells;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Expanded(
            child: _WeekStatCard(
              value: '$weekVisits',
              label: 'Visits',
              icon: Icons.calendar_today_rounded,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _WeekStatCard(
              value: '$weekWells',
              label: 'Wells Serviced',
              icon: Icons.science_rounded,
            ),
          ),
        ],
      );
}

class _WeekStatCard extends StatelessWidget {
  const _WeekStatCard({
    required this.value,
    required this.label,
    required this.icon,
  });
  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 15, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
                height: 1,
              ),
            ),
          ],
        ),
      );
}

// ── Greeting sliver app bar ──────────────────────────────────────────────────

class _GreetingAppBar extends StatelessWidget {
  const _GreetingAppBar({required this.firstName, required this.connectivity});

  final String firstName;
  final dynamic connectivity;

  String get _greeting => 'Hello';

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
  const _DriverDashboardContent({
    required this.routes,
    required this.syncService,
    required this.onSyncNow,
  });
  final List<RouteModel> routes;
  final SyncService syncService;
  final VoidCallback onSyncNow;

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

        // Sync status bar
        Obx(() {
          final pending  = syncService.pendingCount.value;
          final syncing  = syncService.isSyncing.value;
          if (pending == 0) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  if (syncing)
                    const SizedBox(
                      width: 14, height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.warning),
                    )
                  else
                    const Icon(Icons.sync_rounded,
                        size: 16, color: AppColors.warning),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      syncing ? 'Syncing offline data…' : 'Sync offline data',
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.warning),
                    ),
                  ),
                  if (!syncing)
                    GestureDetector(
                      onTap: () async {
                        if (!Get.find<ConnectivityService>().isOnline.value) {
                          FecosSnackbar.info('No Network', 'Connect to the internet to sync');
                          return;
                        }
                        await Get.find<SyncService>().syncNow();
                        onSyncNow();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.warning,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Sync Now',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Colors.white)),
                      ),
                    ),
                ],
              ),
            ),
          );
        }),

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
          Obx(() {
            final syncing = syncService.isSyncing.value;
            return AbsorbPointer(
              absorbing: syncing,
              child: Opacity(
                opacity: syncing ? 0.45 : 1.0,
                child: Column(
                  children: routes.map((r) => _DriverRouteCard(route: r)).toList(),
                ),
              ),
            );
          }),
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

// ── Account Rep dashboard ─────────────────────────────────────────────────────

class _ArDashboardContent extends StatelessWidget {
  const _ArDashboardContent({
    required this.pendingCount,
    required this.clientCount,
    required this.criticalCount,
  });

  final int pendingCount;
  final int clientCount;
  final int criticalCount;

  @override
  Widget build(BuildContext context) => SliverList(
        delegate: SliverChildListDelegate([
          // Pending approvals alert banner
          if (pendingCount > 0) ...[
            GestureDetector(
              onTap: () {
                // Navigate to Lab tab (index 3)
                Get.find<MainController>().changeTab(3);
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.warning,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.pending_actions_rounded,
                        color: Colors.white, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$pendingCount pending approval${pendingCount == 1 ? '' : 's'}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Text(
                            'Tap to review lab results',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded,
                        color: Colors.white, size: 20),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Stats row
          _SectionLabel(icon: Icons.bar_chart_rounded, label: "Overview"),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  value: '$clientCount',
                  label: 'Clients',
                  icon: Icons.business_rounded,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  value: '$pendingCount',
                  label: 'Pending',
                  icon: Icons.pending_actions_rounded,
                  color: pendingCount > 0 ? AppColors.warning : AppColors.success,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  value: '$criticalCount',
                  label: 'Critical',
                  icon: Icons.warning_amber_rounded,
                  color: criticalCount > 0 ? AppColors.danger : AppColors.success,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Quick access
          const _SectionLabel(icon: Icons.apps_rounded, label: 'Quick Access'),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _ArQuickCard(
                  icon: Icons.business_rounded,
                  label: 'Portfolio',
                  onTap: () => Get.find<MainController>().changeTab(1),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ArQuickCard(
                  icon: Icons.assignment_rounded,
                  label: 'Plans',
                  onTap: () => Get.find<MainController>().changeTab(2),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ArQuickCard(
                  icon: Icons.science_rounded,
                  label: 'Lab',
                  onTap: () => Get.find<MainController>().changeTab(3),
                ),
              ),
            ],
          ),
        ]),
      );
}

class _ArQuickCard extends StatelessWidget {
  const _ArQuickCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, size: 24, color: AppColors.primary),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
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
    final progress = route.status == 'COMPLETED'
        ? 1.0
        : route.stopCount > 0
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

