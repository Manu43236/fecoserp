import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/modules/main/controllers/main_controller.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import 'available_routes_view.dart';

class MyRoutesView extends StatefulWidget {
  const MyRoutesView({super.key});

  @override
  State<MyRoutesView> createState() => _MyRoutesViewState();
}

class _MyRoutesViewState extends State<MyRoutesView> {
  static const _cacheKey = 'driver-my-routes';
  final _dio = Get.find<DioService>().dio;
  final _db = Get.find<DbService>();
  List<RouteModel> _routes = [];
  bool _loading = true;
  bool _error = false;
  Worker? _tabWorker;

  @override
  void initState() {
    super.initState();
    _load();
    // Re-open the Routes tab → refresh so status/progress stays current
    // after starting/delivering elsewhere. Index varies by role layout.
    if (Get.isRegistered<MainController>()) {
      final mainController = Get.find<MainController>();
      _tabWorker = ever<int>(mainController.tabIndex, (i) {
        if (i == mainController.indexOf(AppTab.routes) && mounted) _load();
      });
    }
  }

  @override
  void dispose() {
    _tabWorker?.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (_routes.isEmpty) setState(() => _loading = true);
    setState(() => _error = false);
    final online = Get.find<ConnectivityService>().isOnline.value;
    try {
      if (online) {
        final driverId = Get.find<AuthController>().user.value?.id;
        final res = await _dio.get<Map<String, dynamic>>(
          '/routes',
          queryParameters: {
            'size': 50,
            'withStops': true, // so cards can lead with client · lease
            if (driverId != null) 'driverId': driverId,
          },
        );
        final content = res.data!['data']['content'] as List;
        await _db.cacheResponse(_cacheKey, jsonEncode(content));
        _applyRoutes(content);
      } else {
        await _loadFromCache();
      }
    } on DioException {
      await _loadFromCache(); // offline / server error → last-known routes
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadFromCache() async {
    final cached = await _db.getCachedResponse(_cacheKey);
    if (cached != null) {
      _applyRoutes(jsonDecode(cached) as List);
    } else if (mounted) {
      setState(() => _error = true);
    }
  }

  void _applyRoutes(List content) {
    if (!mounted) return;
    setState(() {
      _routes = content
          .map((e) => RouteModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) => DefaultTabController(
        length: 2,
        child: Scaffold(
          backgroundColor: AppColors.surface,
          appBar: AppBar(
            backgroundColor: AppColors.dark,
            foregroundColor: Colors.white,
            title: const Text('Routes',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded),
                onPressed: _load,
              ),
            ],
            bottom: const TabBar(
              indicatorColor: AppColors.primary,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              tabs: [
                Tab(text: 'My Routes'),
                Tab(text: 'Available'),
              ],
            ),
          ),
          body: Column(
            children: [
              const _OfflineStrip(),
              Expanded(
                child: TabBarView(
                  children: [
                    _myRoutesBody(),
                    AvailableRoutesView(onClaimed: _load),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

  Widget _myRoutesBody() {
    if (_loading) return const FecosListShimmer(itemCount: 5, itemHeight: 110);
    if (_error) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded,
                size: 40, color: AppColors.textHint),
            const SizedBox(height: 12),
            const Text('Could not load routes'),
            const SizedBox(height: 8),
            TextButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    }

    final groups = _grouped();

    return RefreshIndicator(
      onRefresh: _load,
      child: groups.isEmpty
          ? const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: 320,
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      'No routes yet — check the Available tab to pick one up',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textHint),
                    ),
                  ),
                ),
              ),
            )
          : ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                for (final g in groups) ...[
                  _SectionHeader(
                      label: g.label, color: g.color, count: g.routes.length),
                  ...g.routes.map((r) =>
                      _RouteCard(route: r, overdue: g.isOverdue)),
                  const SizedBox(height: 8),
                ],
              ],
            ),
    );
  }

  // ── Grouping: In Progress → Today → Overdue → Upcoming → Done ─────────────────
  List<_Group> _grouped() {
    bool startable(String s) => s == 'PLANNED' || s == 'DISPATCHED';
    final today = DateTime.now();
    final startOfToday = DateTime(today.year, today.month, today.day);
    bool isToday(String d) {
      final dt = DateTime.tryParse(d);
      return dt != null &&
          dt.year == today.year &&
          dt.month == today.month &&
          dt.day == today.day;
    }
    bool isPast(String d) {
      final dt = DateTime.tryParse(d);
      return dt != null && dt.isBefore(startOfToday);
    }

    final inProgress = _routes.where((r) => r.status == 'IN_PROGRESS').toList();
    final todo = _routes
        .where((r) => startable(r.status) && isToday(r.routeDate))
        .toList();
    final overdue = _routes
        .where((r) => startable(r.status) && isPast(r.routeDate))
        .toList();
    final upcoming = _routes
        .where((r) =>
            startable(r.status) && !isToday(r.routeDate) && !isPast(r.routeDate))
        .toList();
    final done = _routes
        .where((r) => r.status == 'COMPLETED' || r.status == 'CANCELLED')
        .toList();

    return <_Group>[
      _Group('In Progress', AppColors.warning, inProgress),
      _Group('To do · Today', AppColors.info, todo),
      _Group('Overdue', AppColors.danger, overdue, isOverdue: true),
      _Group('Upcoming', AppColors.textHint, upcoming),
      _Group('Done', AppColors.success, done),
    ].where((g) => g.routes.isNotEmpty).toList();
  }
}

class _Group {
  _Group(this.label, this.color, this.routes, {this.isOverdue = false});
  final String label;
  final Color color;
  final List<RouteModel> routes;
  final bool isOverdue;
}

// ── Offline / sync status strip (read-only) ──────────────────────────────────
class _OfflineStrip extends StatelessWidget {
  const _OfflineStrip();

  @override
  Widget build(BuildContext context) {
    final connectivity = Get.find<ConnectivityService>();
    final sync = Get.find<SyncService>();

    return Obx(() {
      final online = connectivity.isOnline.value;
      final pending = sync.pendingCount.value;
      final syncing = sync.isSyncing.value;

      final (Color bg, Color fg, IconData icon, String text)? state = !online
          ? (
              AppColors.warning.withValues(alpha: 0.12),
              AppColors.warning,
              Icons.cloud_off_rounded,
              'Offline · your work is saved and will sync automatically'
            )
          : syncing
              ? (
                  AppColors.info.withValues(alpha: 0.12),
                  AppColors.info,
                  Icons.sync_rounded,
                  'Syncing $pending item${pending == 1 ? '' : 's'}…'
                )
              : pending > 0
                  ? (
                      AppColors.info.withValues(alpha: 0.12),
                      AppColors.info,
                      Icons.cloud_upload_rounded,
                      '$pending item${pending == 1 ? '' : 's'} waiting to sync'
                    )
                  : null;

      if (state == null) return const SizedBox.shrink();
      final (bg, fg, icon, text) = state;
      return Container(
        width: double.infinity,
        color: bg,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 16, color: fg),
            const SizedBox(width: 8),
            Expanded(
              child: Text(text,
                  style: TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w500, color: fg)),
            ),
          ],
        ),
      );
    });
  }
}

// ── Section header ───────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  const _SectionHeader(
      {required this.label, required this.color, required this.count});
  final String label;
  final Color color;
  final int count;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(2, 10, 2, 8),
        child: Row(
          children: [
            Container(width: 3, height: 14, color: color),
            const SizedBox(width: 8),
            Text(label.toUpperCase(),
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.3,
                    color: AppColors.textSecondary)),
            const SizedBox(width: 6),
            Text('$count',
                style: const TextStyle(fontSize: 12, color: AppColors.textHint)),
          ],
        ),
      );
}

// ── Route card ───────────────────────────────────────────────────────────────
class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.route, required this.overdue});
  final RouteModel route;
  final bool overdue;

  Color get _color => switch (route.status) {
        'IN_PROGRESS' => AppColors.warning,
        'DISPATCHED' => AppColors.info,
        'COMPLETED' => AppColors.success,
        'CANCELLED' => AppColors.danger,
        _ => AppColors.textHint,
      };

  String get _statusLabel => switch (route.status) {
        'PLANNED' => 'Planned',
        'DISPATCHED' => 'Dispatched',
        'IN_PROGRESS' => 'In Progress',
        'COMPLETED' => 'Completed',
        'CANCELLED' => 'Cancelled',
        _ => route.status,
      };

  // Distinct client · lease labels across the route's stops (where the run goes).
  String? get _location {
    if (route.stops.isEmpty) return null;
    final labels = <String>{};
    for (final s in route.stops) {
      final label = s.clientName ?? s.leaseName ?? s.wellName;
      if (label != null && label.isNotEmpty) labels.add(label);
    }
    if (labels.isEmpty) return null;
    final list = labels.toList();
    final first = list.first;
    final more = list.length - 1;
    return more > 0 ? '$first  +$more more' : first;
  }

  @override
  Widget build(BuildContext context) {
    final total = route.stopCount;
    final done = route.completedStops;
    final progress = total > 0 ? done / total : 0.0;
    final location = _location;

    return GestureDetector(
      onTap: () =>
          Get.toNamed(Routes.deliveryDetail.replaceFirst(':id', route.id)),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: overdue
                  ? AppColors.danger.withValues(alpha: 0.4)
                  : _color.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (route.refNumber != null) ...[
              Text(route.refNumber!,
                  style: const TextStyle(
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: AppColors.textSecondary)),
              const SizedBox(height: 4),
            ],
            // Lead with where the run goes (client · lease)
            if (location != null) ...[
              Text(location,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 8),
            ],
            // Date (+overdue) · status chip
            Row(
              children: [
                Icon(Icons.event_rounded, size: 14, color: _color),
                const SizedBox(width: 5),
                Text(_prettyDate(route.routeDate),
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary)),
                if (overdue) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('OVERDUE',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.danger)),
                  ),
                ],
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_statusLabel,
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _color)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Progress
            Text('$done of $total stop${total == 1 ? '' : 's'} delivered',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 6,
                backgroundColor: AppColors.border,
                valueColor: AlwaysStoppedAnimation<Color>(
                    route.status == 'IN_PROGRESS'
                        ? AppColors.warning
                        : AppColors.success),
              ),
            ),
            const SizedBox(height: 10),
            // Bottom: truck + chevron
            Row(
              children: [
                const Icon(Icons.local_shipping_rounded,
                    size: 14, color: AppColors.textHint),
                const SizedBox(width: 5),
                Text(route.truckNumber ?? 'No truck',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textHint)),
                const Spacer(),
                const Icon(Icons.chevron_right_rounded,
                    size: 18, color: AppColors.textHint),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _prettyDate(String d) {
    final dt = DateTime.tryParse(d);
    if (dt == null) return d;
    final today = DateTime.now();
    if (dt.year == today.year && dt.month == today.month && dt.day == today.day) {
      return 'Today';
    }
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[dt.month - 1]} ${dt.day}';
  }
}
