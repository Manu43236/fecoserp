import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/widgets/fecos_loader.dart';
import '../controllers/service_visit_controller.dart';

const _primary = Color(0xFF751903);

const _months = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
String _monthName(int m) => _months[m];
String _fmtLabel(DateTime d) => '${_monthName(d.month)} ${d.day}, ${d.year}';

class ServiceVisitView extends GetView<ServiceVisitController> {
  const ServiceVisitView({super.key});

  @override
  Widget build(BuildContext context) {
    final argVisit =
        Get.arguments is MyVisit ? Get.arguments as MyVisit : null;
    if (argVisit != null) {
      return _VisitDetailView(visit: argVisit);
    }

    return Scaffold(
      appBar: AppBar(
        title: Obx(() {
          final d = controller.selectedDate.value;
          final label = controller.isToday
              ? 'Today'
              : '${_monthName(d.month)} ${d.day}, ${d.year}';
          return Text('My Visits — $label');
        }),
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today_outlined),
            tooltip: 'Pick date',
            onPressed: () async {
              final now = DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: controller.selectedDate.value,
                firstDate: DateTime(now.year - 1),
                lastDate: now,
              );
              if (picked != null) controller.loadVisits(date: picked);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: controller.loadVisits,
          ),
        ],
      ),
      body: Obx(() => switch (controller.state.value) {
            AsyncLoading() => const FecosLoader(),
            AsyncError(:final message) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 48, color: Colors.red),
                    const SizedBox(height: 12),
                    Text(message, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: controller.loadVisits,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            AsyncSuccess(:final data) when data.isEmpty => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle_outline,
                        size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 12),
                    Obx(() {
                      final label = controller.isToday
                          ? 'today'
                          : _fmtLabel(controller.selectedDate.value);
                      return Text('No visits scheduled for $label',
                          style: TextStyle(
                              color: Colors.grey[600], fontSize: 16));
                    }),
                  ],
                ),
              ),
            AsyncSuccess(:final data) => RefreshIndicator(
                onRefresh: controller.loadVisits,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: data.length,
                  separatorBuilder: (_, i) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _VisitCard(visit: data[i]),
                ),
              ),
            _ => const SizedBox(),
          }),
    );
  }
}

// ── Visit card (list) ─────────────────────────────────────────────────────────

class _VisitCard extends StatelessWidget {
  const _VisitCard({required this.visit});
  final MyVisit visit;

  @override
  Widget build(BuildContext context) {
    final completed = visit.stops.where((s) => s.hasReport).length;
    final total = visit.stops.length;
    final hasSoar =
        visit.stops.any((s) => s.hasSoar && !s.soarAcknowledged);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Get.toNamed(
          Routes.serviceVisit.replaceFirst(':id', visit.id),
          arguments: visit,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.science, color: _primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatDate(visit.visitDate),
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$completed / $total wells reported',
                      style:
                          TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    if (hasSoar) ...[
                      const SizedBox(height: 4),
                      _SoarBadge(),
                    ],
                  ],
                ),
              ),
              _StatusChip(status: visit.status),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String date) {
    final d = DateTime.tryParse(date);
    if (d == null) return date;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
  }
}

// ── Visit detail (stop list grouped by lease) ─────────────────────────────────

class _VisitDetailView extends StatefulWidget {
  const _VisitDetailView({required this.visit});
  final MyVisit visit;

  @override
  State<_VisitDetailView> createState() => _VisitDetailViewState();
}

class _VisitDetailViewState extends State<_VisitDetailView> {
  late MyVisit _visit;

  @override
  void initState() {
    super.initState();
    _visit = widget.visit;
  }

  // Group stops by leaseName
  Map<String, List<MyVisitStop>> get _grouped {
    final map = <String, List<MyVisitStop>>{};
    for (final s in _visit.stops) {
      (map[s.leaseName] ??= []).add(s);
    }
    return map;
  }

  void _onStopReturned(bool? submitted) {
    if (submitted != true) return;
    // Re-fetch visit to update hasReport flags
    final ctrl = Get.find<ServiceVisitController>();
    ctrl.loadVisits().then((_) {
      final state = ctrl.state.value;
      if (state is AsyncSuccess<List<MyVisit>>) {
        final updated = state.data.firstWhereOrNull(
          (v) => v.id == _visit.id,
        );
        if (updated != null && mounted) {
          setState(() => _visit = updated);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final grouped = _grouped;
    final leases = grouped.keys.toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(_formatDate(_visit.visitDate)),
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _StatusChip(status: _visit.status),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: leases.length,
        itemBuilder: (_, i) {
          final lease = leases[i];
          final stops = grouped[lease]!;
          final clientName = stops.first.clientName;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (i > 0) const SizedBox(height: 16),
              // Lease / client header
              Padding(
                padding: const EdgeInsets.only(bottom: 8, left: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lease,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: Color(0xFF751903),
                        letterSpacing: 0.3,
                      ),
                    ),
                    if (clientName.isNotEmpty)
                      Text(
                        clientName,
                        style: TextStyle(
                            color: Colors.grey[500], fontSize: 11),
                      ),
                  ],
                ),
              ),
              ...stops.map(
                (s) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _StopCard(
                    stop: s,
                    visitId: _visit.id,
                    onReturned: _onStopReturned,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _formatDate(String date) {
    final d = DateTime.tryParse(date);
    if (d == null) return date;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
  }
}

// ── Stop card ─────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  const _StopCard({
    required this.stop,
    required this.visitId,
    required this.onReturned,
  });
  final MyVisitStop stop;
  final String visitId;
  final ValueChanged<bool?> onReturned;

  @override
  Widget build(BuildContext context) {
    final hasPendingSoar = stop.hasSoar && !stop.soarAcknowledged;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: hasPendingSoar
              ? Colors.red.shade300
              : stop.hasReport
                  ? Colors.green.shade200
                  : Colors.grey.shade200,
          width: hasPendingSoar ? 1.5 : 1,
        ),
      ),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: stop.hasReport
            ? () => Get.toNamed(
                  Routes.reportView
                      .replaceFirst(':visitId', visitId)
                      .replaceFirst(':stopId', stop.id),
                  arguments: stop,
                )
            : () async {
                final result = await Get.toNamed(
                  Routes.wellStop
                      .replaceFirst(':visitId', visitId)
                      .replaceFirst(':stopId', stop.id),
                  arguments: stop,
                );
                onReturned(result as bool?);
              },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: stop.hasReport
                    ? Colors.green.withValues(alpha: 0.1)
                    : _primary.withValues(alpha: 0.1),
                child: Text(
                  '${stop.sequence}',
                  style: TextStyle(
                    color: stop.hasReport ? Colors.green : _primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(stop.wellName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (hasPendingSoar) _SoarBadge(),
                        if (stop.hasSoar && stop.soarAcknowledged)
                          _AckedBadge(),
                      ],
                    ),
                  ],
                ),
              ),
              if (stop.hasReport)
                const Icon(Icons.check_circle,
                    color: Colors.green, size: 22)
              else
                const Icon(Icons.radio_button_unchecked,
                    color: Colors.grey, size: 22),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Shared small widgets ──────────────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'SCHEDULED' => ('Scheduled', Colors.blue),
      'IN_PROGRESS' => ('In Progress', Colors.orange),
      'COMPLETED' => ('Completed', Colors.green),
      'CANCELLED' => ('Cancelled', Colors.grey),
      _ => (status, Colors.grey),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _SoarBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.warning_amber_rounded,
              size: 11, color: Colors.red.shade700),
          const SizedBox(width: 3),
          Text('SOAR',
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.red.shade700)),
        ],
      ),
    );
  }
}

class _AckedBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.amber.shade300),
      ),
      child: Text('SOAR ✓',
          style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Colors.amber.shade800)),
    );
  }
}
