import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/widgets/fecos_loader.dart';
import '../controllers/service_visit_controller.dart';

class ServiceVisitView extends GetView<ServiceVisitController> {
  const ServiceVisitView({super.key});

  @override
  Widget build(BuildContext context) {
    final id = Get.parameters['id'] ?? 'list';

    // If navigated to a specific visit, show stops for that visit
    if (id != 'list') {
      return _VisitDetailView(visitId: id);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Visits Today'),
        actions: [
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
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
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
                    Icon(Icons.check_circle_outline, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 12),
                    Text('No visits scheduled for today',
                        style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                  ],
                ),
              ),
            AsyncSuccess(:final data) => RefreshIndicator(
                onRefresh: controller.loadVisits,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: data.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _VisitCard(visit: data[i]),
                ),
              ),
            _ => const SizedBox(),
          }),
    );
  }
}

class _VisitCard extends StatelessWidget {
  const _VisitCard({required this.visit});
  final MyVisit visit;

  @override
  Widget build(BuildContext context) {
    final completed = visit.stops.where((s) => s.hasReport).length;
    final total = visit.stops.length;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Get.toNamed(
          Routes.serviceVisit.replaceFirst(':id', visit.id),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF751903).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.science, color: Color(0xFF751903)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatDate(visit.visitDate),
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$completed / $total wells reported',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
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
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'SCHEDULED'   => ('Scheduled',   Colors.blue),
      'IN_PROGRESS' => ('In Progress', Colors.orange),
      'COMPLETED'   => ('Completed',   Colors.green),
      'CANCELLED'   => ('Cancelled',   Colors.grey),
      _             => (status,        Colors.grey),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

// ── Visit Detail (stop list) ───────────────────────────────────────────────────

class _VisitDetailView extends StatelessWidget {
  const _VisitDetailView({required this.visitId});
  final String visitId;

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ServiceVisitController>();

    return Obx(() {
      final state = controller.state.value;
      if (state is! AsyncSuccess<List<MyVisit>>) {
        return Scaffold(
          appBar: AppBar(title: const Text('Visit')),
          body: const FecosLoader(),
        );
      }

      final visit = state.data.firstWhereOrNull((v) => v.id == visitId);
      if (visit == null) {
        return Scaffold(
          appBar: AppBar(title: const Text('Visit')),
          body: const Center(child: Text('Visit not found')),
        );
      }

      return Scaffold(
        appBar: AppBar(
          title: Text(_formatDate(visit.visitDate)),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: _StatusChip(status: visit.status),
            ),
          ],
        ),
        body: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: visit.stops.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, i) => _StopCard(stop: visit.stops[i], visitId: visitId),
        ),
      );
    });
  }

  String _formatDate(String date) {
    final d = DateTime.tryParse(date);
    if (d == null) return date;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
  }
}

class _StopCard extends StatelessWidget {
  const _StopCard({required this.stop, required this.visitId});
  final MyVisitStop stop;
  final String visitId;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Get.toNamed(
          Routes.serviceReport
              .replaceFirst(':visitId', visitId)
              .replaceFirst(':stopId', stop.id),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFF751903).withOpacity(0.1),
                child: Text(
                  '${stop.sequence}',
                  style: const TextStyle(
                      color: Color(0xFF751903), fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(stop.wellName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 15)),
                    const SizedBox(height: 3),
                    Text(stop.leaseName,
                        style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  ],
                ),
              ),
              if (stop.sampleCollected)
                const Padding(
                  padding: EdgeInsets.only(right: 8),
                  child: Icon(Icons.science, size: 18, color: Color(0xFF751903)),
                ),
              Icon(
                stop.hasReport ? Icons.check_circle : Icons.radio_button_unchecked,
                color: stop.hasReport ? Colors.green : Colors.grey[400],
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
