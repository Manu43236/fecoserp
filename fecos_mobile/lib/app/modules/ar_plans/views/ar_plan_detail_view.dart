import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/plan_line_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';

class _HistoryEvent {
  const _HistoryEvent({
    required this.event,
    required this.label,
    required this.occurredAt,
    this.detail,
  });
  final String event;
  final String label;
  final String occurredAt;
  final String? detail;

  factory _HistoryEvent.fromJson(Map<String, dynamic> json) => _HistoryEvent(
        event: json['event'] as String,
        label: json['label'] as String,
        occurredAt: json['occurredAt'] as String,
        detail: json['detail'] as String?,
      );
}

class ArPlanDetailView extends StatefulWidget {
  const ArPlanDetailView({super.key, required this.planId});
  final String planId;

  @override
  State<ArPlanDetailView> createState() => _ArPlanDetailViewState();
}

class _ArPlanDetailViewState extends State<ArPlanDetailView> {
  final _dio = Get.find<DioService>().dio;
  late Future<PlanDetailModel> _future;
  late Future<List<_HistoryEvent>> _historyFuture;

  @override
  void initState() {
    super.initState();
    _future = _load();
    _historyFuture = _loadHistory();
  }

  Future<PlanDetailModel> _load() async {
    final res = await _dio.get<Map<String, dynamic>>('/plans/${widget.planId}');
    return PlanDetailModel.fromJson(res.data!['data'] as Map<String, dynamic>);
  }

  Future<List<_HistoryEvent>> _loadHistory() async {
    final res = await _dio
        .get<Map<String, dynamic>>('/plans/${widget.planId}/history');
    final data = res.data!['data'] as List;
    return data
        .map((e) => _HistoryEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.dark,
          foregroundColor: Colors.white,
          title: const Text(
            'Plan Detail',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ),
        body: FutureBuilder<PlanDetailModel>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const FecosListShimmer(itemCount: 4, itemHeight: 140);
            }
            if (snap.hasError) {
              return const Center(
                child: Text(
                  'Failed to load plan',
                  style: TextStyle(color: AppColors.danger),
                ),
              );
            }
            final plan = snap.data!;
            return _PlanDetailBody(plan: plan, historyFuture: _historyFuture);
          },
        ),
      );
}

class _PlanDetailBody extends StatelessWidget {
  const _PlanDetailBody({required this.plan, required this.historyFuture});
  final PlanDetailModel plan;
  final Future<List<_HistoryEvent>> historyFuture;

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
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        plan.wellName ?? '—',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                _InfoRow(icon: Icons.location_on_outlined, text: plan.leaseName ?? '—'),
                _InfoRow(icon: Icons.business_outlined, text: plan.clientName ?? '—'),
                if (plan.startDate != null)
                  _InfoRow(
                    icon: Icons.calendar_today_outlined,
                    text: 'Started ${_fmtDate(plan.startDate!)}',
                  ),
                if (plan.notes != null && plan.notes!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    plan.notes!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Products header
          Row(
            children: [
              const Icon(Icons.science_outlined,
                  size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                '${plan.lines.length} Product${plan.lines.length == 1 ? '' : 's'}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          if (plan.lines.isEmpty)
            Container(
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: const Center(
                child: Text(
                  'No products on this plan',
                  style: TextStyle(color: AppColors.textHint, fontSize: 13),
                ),
              ),
            )
          else
            ...plan.lines.map((line) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _LineCard(line: line),
                )),

          const SizedBox(height: 20),

          // History section
          Row(
            children: const [
              Icon(Icons.history_rounded, size: 16, color: AppColors.primary),
              SizedBox(width: 6),
              Text(
                'History',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          FutureBuilder<List<_HistoryEvent>>(
            future: historyFuture,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const FecosListShimmer(itemCount: 3, itemHeight: 60);
              }
              if (snap.hasError || snap.data == null || snap.data!.isEmpty) {
                return Container(
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Center(
                    child: Text(
                      'No history available',
                      style:
                          TextStyle(color: AppColors.textHint, fontSize: 13),
                    ),
                  ),
                );
              }
              return _HistoryTimeline(events: snap.data!);
            },
          ),

          const SizedBox(height: 24),
        ],
      );

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

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(
          children: [
            Icon(icon, size: 13, color: AppColors.textHint),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      );
}

// ── Line card ─────────────────────────────────────────────────────────────────

class _LineCard extends StatelessWidget {
  const _LineCard({required this.line});
  final PlanLineModel line;

  @override
  Widget build(BuildContext context) {
    final level = line.isOwn
        ? line.calculatedLevelPct
        : line.calculatedLevelPct ?? line.recRate;
    final capacity = line.isOwn
        ? line.tankCapacityGallons
        : line.thirdPartyCapacityGallons;
    final serial =
        line.isOwn ? line.tankSerial : (line.thirdPartySerial ?? '—');
    final tankLabel = line.isOwn ? 'Own Tank' : (line.thirdPartyName ?? 'Third Party');
    final isLow = level != null && level <= 20;
    final isCritical = level != null && level <= 10;
    final levelColor = isCritical
        ? AppColors.danger
        : isLow
            ? AppColors.warning
            : AppColors.success;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Chemical Product section ──────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionHeader(label: 'Chemical Product'),
                const SizedBox(height: 8),
                Text(
                  line.productName ?? '—',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _Tag(label: line.recRateLabel, color: AppColors.primary),
                    const SizedBox(width: 6),
                    if (line.method != null)
                      _Tag(
                        label: line.method!,
                        color: AppColors.textSecondary,
                      ),
                    if (line.schedule != null) ...[
                      const SizedBox(width: 6),
                      _Tag(
                        label: line.schedule!,
                        color: AppColors.textSecondary,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: AppColors.border, height: 1),
          ),

          // ── Tank section ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionHeader(label: 'Tank · $tankLabel'),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.propane_tank_outlined,
                        size: 14, color: AppColors.textHint),
                    const SizedBox(width: 6),
                    Text(
                      serial ?? '—',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    if (capacity != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        '${capacity.toStringAsFixed(0)} gal',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textHint,
                        ),
                      ),
                    ],
                  ],
                ),
                if (level != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: (level / 100).clamp(0.0, 1.0),
                            backgroundColor: AppColors.border,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(levelColor),
                            minHeight: 6,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
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
                ],
              ],
            ),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: AppColors.border, height: 1),
          ),

          // ── Pump section ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SectionHeader(label: 'Pump'),
                const SizedBox(height: 8),
                if (line.pumpDeployed && line.pumpSerial != null)
                  Row(
                    children: [
                      const Icon(Icons.settings_outlined,
                          size: 14, color: AppColors.success),
                      const SizedBox(width: 6),
                      Text(
                        line.pumpSerial!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const _Tag(label: 'Deployed', color: AppColors.success),
                    ],
                  )
                else if (line.isOwn)
                  Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded,
                          size: 14, color: AppColors.warning),
                      const SizedBox(width: 6),
                      const Text(
                        'No pump deployed',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.warning,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  )
                else
                  const Text(
                    '—',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textHint,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryTimeline extends StatelessWidget {
  const _HistoryTimeline({required this.events});
  final List<_HistoryEvent> events;

  IconData _icon(String event) => switch (event) {
        'CREATED'     => Icons.add_circle_outline_rounded,
        'STARTED'     => Icons.play_circle_outline_rounded,
        'PAUSED'      => Icons.pause_circle_outline_rounded,
        'RESUMED'     => Icons.replay_rounded,
        'SUPERSEDED'  => Icons.swap_horiz_rounded,
        'RATE_CHANGE' => Icons.edit_outlined,
        _             => Icons.circle_outlined,
      };

  Color _color(String event) => switch (event) {
        'CREATED'     => AppColors.info,
        'STARTED'     => AppColors.success,
        'PAUSED'      => AppColors.warning,
        'RESUMED'     => AppColors.success,
        'SUPERSEDED'  => AppColors.textHint,
        'RATE_CHANGE' => AppColors.primary,
        _             => AppColors.textHint,
      };

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${months[d.month - 1]} ${d.day}, ${d.year}';
    } on FormatException {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: events.length,
          separatorBuilder: (_, _) =>
              const Divider(height: 1, color: AppColors.border),
          itemBuilder: (_, i) {
            final e = events[i];
            final color = _color(e.event);
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(_icon(e.event), size: 18, color: color),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          e.label,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                        if (e.detail != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            e.detail!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Text(
                    _fmtDate(e.occurredAt),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.textHint,
          letterSpacing: 0.8,
        ),
      );
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label, required this.color});
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
