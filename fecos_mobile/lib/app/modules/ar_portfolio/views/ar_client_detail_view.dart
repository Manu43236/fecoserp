import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/client_model.dart';
import 'package:fecos_mobile/app/data/models/plan_model.dart';
import 'package:fecos_mobile/app/data/models/lab_sample_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';

class ArClientDetailView extends StatelessWidget {
  const ArClientDetailView({
    super.key,
    required this.client,
    required this.plans,
    required this.pendingCount,
  });

  final ClientModel client;
  final List<PlanModel> plans;
  final int pendingCount;

  @override
  Widget build(BuildContext context) => DefaultTabController(
        length: 3,
        child: Scaffold(
          backgroundColor: AppColors.surface,
          appBar: AppBar(
            backgroundColor: AppColors.dark,
            foregroundColor: Colors.white,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  client.companyName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                if (client.contactName != null)
                  Text(
                    client.contactName!,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withValues(alpha: 0.72),
                    ),
                  ),
              ],
            ),
            bottom: const TabBar(
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white54,
              indicatorColor: Colors.white,
              indicatorWeight: 2.5,
              labelStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              tabs: [
                Tab(text: 'Plans'),
                Tab(text: 'Lab'),
                Tab(text: 'Schedule'),
              ],
            ),
          ),
          body: TabBarView(
            children: [
              _PlansTab(client: client),
              _LabTab(client: client, plans: plans),
              _ScheduleTab(client: client),
            ],
          ),
        ),
      );
}

// ── Plans tab ─────────────────────────────────────────────────────────────────

class _PlanWithLines {
  const _PlanWithLines({
    required this.plan,
    required this.lines,
    required this.tanks,
  });
  final PlanModel plan;
  final List<Map<String, dynamic>> lines;
  // tankId → tank data (calculatedLevelPct, calculatedLevelGallons, lastRefilledAt …)
  final Map<String, Map<String, dynamic>> tanks;
}

class _PlansTab extends StatefulWidget {
  const _PlansTab({required this.client});
  final ClientModel client;

  @override
  State<_PlansTab> createState() => _PlansTabState();
}

class _PlansTabState extends State<_PlansTab>
    with AutomaticKeepAliveClientMixin {
  final _dio = Get.find<DioService>().dio;
  late Future<List<_PlanWithLines>> _future;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_PlanWithLines>> _load() async {
    // 1. Plans for this client
    final res = await _dio.get<Map<String, dynamic>>(
      '/plans',
      queryParameters: {'size': 100},
    );
    final plans = (res.data!['data']['content'] as List)
        .map((e) => PlanModel.fromJson(e as Map<String, dynamic>))
        .where((p) => p.clientName == widget.client.companyName)
        .toList();

    // 2. Plan details (lines) + collect tankIds
    final rawLines = <String, List<Map<String, dynamic>>>{};
    final tankIds = <String>{};
    for (final plan in plans) {
      final detail = await _dio.get<Map<String, dynamic>>('/plans/${plan.id}');
      final lines = (detail.data!['data']['lines'] as List? ?? [])
          .cast<Map<String, dynamic>>();
      rawLines[plan.id] = lines;
      for (final l in lines) {
        final tid = l['tankId'] as String?;
        if (tid != null) tankIds.add(tid);
      }
    }

    // 3. Fetch tanks once and build id→data map
    Map<String, Map<String, dynamic>> tankMap = {};
    if (tankIds.isNotEmpty) {
      final tanksRes =
          await _dio.get<Map<String, dynamic>>('/tanks', queryParameters: {'size': 200});
      final allTanks = (tanksRes.data!['data']['content'] as List)
          .cast<Map<String, dynamic>>();
      for (final t in allTanks) {
        final id = t['id'] as String?;
        if (id != null && tankIds.contains(id)) tankMap[id] = t;
      }
    }

    return plans
        .map((p) => _PlanWithLines(
              plan: p,
              lines: rawLines[p.id] ?? [],
              tanks: tankMap,
            ))
        .toList();
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return FutureBuilder<List<_PlanWithLines>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const FecosListShimmer(itemCount: 5, itemHeight: 140);
        }
        if (snap.hasError) {
          return const _EmptyState(
            icon: Icons.error_outline,
            message: 'Failed to load plans',
            color: AppColors.danger,
          );
        }
        final plans = snap.data ?? [];
        if (plans.isEmpty) {
          return const _EmptyState(
            icon: Icons.assignment_outlined,
            message: 'No treatment plans',
          );
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          color: AppColors.primary,
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: plans.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) => _PlanCard(
                  plan: plans[i].plan,
                  lines: plans[i].lines,
                  tanks: plans[i].tanks,
                ),
          ),
        );
      },
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.lines,
    required this.tanks,
  });
  final PlanModel plan;
  final List<Map<String, dynamic>> lines;
  final Map<String, Map<String, dynamic>> tanks;

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
  Widget build(BuildContext context) {
    final hasTankLines = lines.any((l) => l['tankId'] != null);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header row ──────────────────────────────────────────────
          Row(
            children: [
              Container(
                width: 4,
                height: 48,
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
                    if (plan.startDate != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Started ${_fmtDate(plan.startDate!)}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textHint,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _statusColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${plan.lineCount} product${plan.lineCount == 1 ? '' : 's'}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // ── Tank + pump section ──────────────────────────────────────
          if (hasTankLines) ...[
            const SizedBox(height: 10),
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: 10),
            for (final l in lines)
              if (l['tankId'] != null)
                _LineDetail(
                  line: l,
                  tank: tanks[l['tankId'] as String],
                ),
          ],
        ],
      ),
    );
  }

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${months[d.month - 1]} ${d.day}, ${d.year}';
    } on FormatException {
      return iso;
    }
  }
}

class _LineDetail extends StatelessWidget {
  const _LineDetail({required this.line, required this.tank});
  final Map<String, dynamic> line;
  final Map<String, dynamic>? tank; // null if tank not found

  @override
  Widget build(BuildContext context) {
    final productName = line['productName'] as String? ?? '—';
    final recRate = (line['recRate'] as num?)?.toDouble();
    final isCi = (line['method'] as String?) == 'CONTINUOUS';
    final pumpDeployed = line['pumpDeployed'] == true;
    final pumpSerial = line['pumpSerial'] as String?;

    // Tank data — prefer live fields from /tanks, fall back to plan-line fields
    final serial = (tank?['serialNumber'] ?? line['tankSerial']) as String? ?? '—';
    final capacityGal = (tank?['capacityGallons'] ?? line['tankCapacityGallons']) as num?;
    final level = (tank?['calculatedLevelPct'] as num?)?.toDouble() ?? 0.0;
    final levelGal = (tank?['calculatedLevelGallons'] as num?)?.toDouble();
    final lastRefilled = tank?['lastRefilledAt'] as String?;

    final levelColor = level <= 10
        ? AppColors.danger
        : level <= 25
            ? AppColors.warning
            : AppColors.success;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Product header ─────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: Text(
                  productName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (recRate != null)
                Text(
                  '${recRate.toStringAsFixed(0)} gal/day',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isCi ? 'Continuous' : 'Batch',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.info,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // ── Tank section ───────────────────────────────────────────
          _sectionLabel('TANK'),
          const SizedBox(height: 6),

          Row(
            children: [
              const Icon(Icons.propane_tank_outlined,
                  size: 15, color: AppColors.textHint),
              const SizedBox(width: 6),
              Text(
                serial,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              if (capacityGal != null) ...[
                const SizedBox(width: 4),
                Text(
                  '· ${capacityGal.toStringAsFixed(0)} gal',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textHint,
                  ),
                ),
              ],
            ],
          ),

          if (levelGal != null) ...[
            const SizedBox(height: 3),
            Text(
              '${levelGal.toStringAsFixed(2)} gal in tank',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],

          if (lastRefilled != null) ...[
            const SizedBox(height: 2),
            Text(
              'Last refilled: ${_fmtDateTime(lastRefilled)}',
              style: const TextStyle(fontSize: 11, color: AppColors.textHint),
            ),
          ],

          const SizedBox(height: 8),

          // level bar
          Row(
            children: [
              const Text(
                'Current Level',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const Spacer(),
              Text(
                '${level.toStringAsFixed(2)}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: levelColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (level / 100).clamp(0.0, 1.0),
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(levelColor),
              minHeight: 7,
            ),
          ),

          // ── Pump section (CI only) ─────────────────────────────────
          if (isCi) ...[
            const SizedBox(height: 12),
            _sectionLabel('PUMP'),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(
                  Icons.settings_outlined,
                  size: 15,
                  color: pumpDeployed ? AppColors.success : AppColors.danger,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    pumpSerial ?? '—',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: (pumpDeployed ? AppColors.success : AppColors.danger)
                        .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    pumpDeployed ? 'Deployed' : 'Not Deployed',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: pumpDeployed ? AppColors.success : AppColors.danger,
                    ),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 4),
        ],
      ),
    );
  }

  String _fmtDateTime(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
      final m = d.minute.toString().padLeft(2, '0');
      final ampm = d.hour < 12 ? 'AM' : 'PM';
      return '${months[d.month - 1]} ${d.day}, ${d.year} $h:$m $ampm';
    } on FormatException {
      return iso;
    }
  }
}

Widget _sectionLabel(String text) => Text(
      text,
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        color: AppColors.textHint,
        letterSpacing: 0.8,
      ),
    );

// ── Lab tab ───────────────────────────────────────────────────────────────────

class _LabTab extends StatefulWidget {
  const _LabTab({required this.client, required this.plans});
  final ClientModel client;
  final List<PlanModel> plans;

  @override
  State<_LabTab> createState() => _LabTabState();
}

class _LabTabState extends State<_LabTab> with AutomaticKeepAliveClientMixin {
  final _dio = Get.find<DioService>().dio;
  late Future<List<LabSampleModel>> _future;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<LabSampleModel>> _load() async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/lab/samples',
      queryParameters: {'size': 50},
    );
    final all = (res.data!['data']['content'] as List)
        .map((e) => LabSampleModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return all
        .where((s) => s.clientName == widget.client.companyName)
        .toList();
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return FutureBuilder<List<LabSampleModel>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const FecosListShimmer(itemCount: 5, itemHeight: 96);
        }
        if (snap.hasError) {
          return _EmptyState(
            icon: Icons.error_outline,
            message: 'Failed to load lab data',
            color: AppColors.danger,
          );
        }
        final samples = snap.data ?? [];
        if (samples.isEmpty) {
          return const _EmptyState(
            icon: Icons.science_outlined,
            message: 'No lab samples found',
          );
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          color: AppColors.primary,
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: samples.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) => _LabSampleCard(sample: samples[i]),
          ),
        );
      },
    );
  }
}

class _LabSampleCard extends StatelessWidget {
  const _LabSampleCard({required this.sample});
  final LabSampleModel sample;

  @override
  Widget build(BuildContext context) {
    final isPending = sample.approvalStatus == 'PENDING_REVIEW';
    final isApproved = sample.approvalStatus == 'APPROVED';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: sample.hasCriticalValues
              ? AppColors.danger.withValues(alpha: 0.4)
              : AppColors.border,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  sample.wellName ?? '—',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${sample.sampleType.replaceAll('_', ' ')} · ${sample.sampleNumber}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (sample.receivedAt != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    _fmtDate(sample.receivedAt!),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (sample.hasCriticalValues)
                Container(
                  margin: const EdgeInsets.only(bottom: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.danger.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Critical',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.danger,
                    ),
                  ),
                ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: isApproved
                      ? AppColors.success.withValues(alpha: 0.1)
                      : isPending
                          ? AppColors.warning.withValues(alpha: 0.1)
                          : AppColors.border,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isApproved
                      ? 'Approved'
                      : isPending
                          ? 'Pending'
                          : sample.status.replaceAll('_', ' '),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isApproved
                        ? AppColors.success
                        : isPending
                            ? AppColors.warning
                            : AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${months[d.month - 1]} ${d.day}, ${d.year}';
    } on FormatException {
      return iso;
    }
  }
}

// ── Schedule tab ──────────────────────────────────────────────────────────────

class _ScheduleTab extends StatefulWidget {
  const _ScheduleTab({required this.client});
  final ClientModel client;

  @override
  State<_ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<_ScheduleTab>
    with AutomaticKeepAliveClientMixin {
  final _dio = Get.find<DioService>().dio;
  late Future<List<Map<String, dynamic>>> _future;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/service-visits',
      queryParameters: {'size': 30},
    );
    final all = (res.data!['data']['content'] as List).cast<Map<String, dynamic>>();
    return all.where((v) {
      final stops = v['stops'] as List? ?? [];
      return stops.any((s) =>
          (s as Map<String, dynamic>)['clientName'] == widget.client.companyName);
    }).toList();
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const FecosListShimmer(itemCount: 5, itemHeight: 96);
        }
        if (snap.hasError) {
          return const _EmptyState(
            icon: Icons.error_outline,
            message: 'Failed to load schedule',
            color: AppColors.danger,
          );
        }
        final visits = snap.data ?? [];
        if (visits.isEmpty) {
          return const _EmptyState(
            icon: Icons.calendar_today_outlined,
            message: 'No service visits found',
          );
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          color: AppColors.primary,
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: visits.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) => _VisitCard(
              visit: visits[i],
              clientName: widget.client.companyName,
            ),
          ),
        );
      },
    );
  }
}

class _VisitCard extends StatelessWidget {
  const _VisitCard({required this.visit, required this.clientName});
  final Map<String, dynamic> visit;
  final String clientName;

  @override
  Widget build(BuildContext context) {
    final status = visit['status'] as String;
    final stops = (visit['stops'] as List? ?? []).cast<Map<String, dynamic>>();
    final clientStops = stops
        .where((s) => s['clientName'] == clientName)
        .toList();
    final completed =
        clientStops.where((s) => s['status'] == 'COMPLETED').length;
    final hasSoar = clientStops.any(
        (s) => s['hasSoar'] == true && s['soarAcknowledged'] != true);

    final Color statusColor = switch (status) {
      'COMPLETED'   => AppColors.success,
      'IN_PROGRESS' => AppColors.warning,
      'CANCELLED'   => AppColors.danger,
      _             => AppColors.info,
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  visit['visitDate'] as String? ?? '—',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Tech: ${visit['techName'] ?? '—'}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$completed/${clientStops.length} stops completed',
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
              if (hasSoar)
                Container(
                  margin: const EdgeInsets.only(bottom: 4),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'SOAR',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.warning,
                    ),
                  ),
                ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status.replaceAll('_', ' '),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Shared empty state ────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.message,
    this.color = AppColors.textHint,
  });

  final IconData icon;
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: color.withValues(alpha: 0.5)),
            const SizedBox(height: 12),
            Text(
              message,
              style: TextStyle(
                fontSize: 14,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
}
