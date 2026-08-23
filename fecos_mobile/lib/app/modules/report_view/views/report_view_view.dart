import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/widgets/fecos_loader.dart';
import '../controllers/report_view_controller.dart';

const _primary = Color(0xFF751903);

class ReportViewView extends GetView<ReportViewController> {
  const ReportViewView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(controller.stop.wellName),
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit & Resubmit',
            onPressed: () => Get.toNamed(
              Routes.wellStop
                  .replaceFirst(':visitId', controller.visitId)
                  .replaceFirst(':stopId', controller.stopId),
              arguments: controller.stop,
            ),
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) return const FecosLoader();
        if (controller.errorMsg.value != null) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(controller.errorMsg.value!, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: controller.reload,
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }
        final r = controller.report.value;
        if (r == null) return const SizedBox();
        return _ReportBody(report: r);
      }),
    );
  }
}

class _ReportBody extends StatelessWidget {
  const _ReportBody({required this.report});
  final TreatmentReportData report;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Meta card
        _Card(
          child: Column(
            children: [
              _MetaRow('Tech', report.techName),
              _MetaRow('Client', report.clientName),
              _MetaRow('Performed', _fmt(report.performedAt)),
              _MetaRow('Submitted', _fmt(report.submittedAt)),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // GPS
        if (report.gpsLat != null && report.gpsLng != null) ...[
          _SectionLabel('GPS LOCATION'),
          _Card(
            child: Row(
              children: [
                const Icon(Icons.location_on, color: _primary, size: 18),
                const SizedBox(width: 8),
                Text(
                  '${report.gpsLat!.toStringAsFixed(6)}, ${report.gpsLng!.toStringAsFixed(6)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Site photo
        if (report.photoUrl != null) ...[
          _SectionLabel('SITE PHOTO'),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              report.photoUrl!,
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _PhotoError(),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // SOAR
        if (report.soar) ...[
          _SectionLabel('SOAR'),
          _Card(
            color: Colors.red.shade50,
            border: Colors.red.shade200,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.warning_amber_rounded,
                        color: Colors.red.shade700, size: 18),
                    const SizedBox(width: 6),
                    Text('Special Observation / Action Required',
                        style: TextStyle(
                            color: Colors.red.shade700,
                            fontWeight: FontWeight.w700,
                            fontSize: 13)),
                  ],
                ),
                if (report.soarNote != null) ...[
                  const SizedBox(height: 6),
                  Text(report.soarNote!,
                      style: TextStyle(
                          color: Colors.red.shade900, fontSize: 13)),
                ],
                if (report.soarAckByName != null) ...[
                  const SizedBox(height: 8),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.check_circle,
                          color: Colors.green.shade600, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Acknowledged by ${report.soarAckByName!}',
                        style: TextStyle(
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.w600,
                            fontSize: 12),
                      ),
                    ],
                  ),
                  if (report.soarAckNote != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4, left: 22),
                      child: Text(report.soarAckNote!,
                          style: TextStyle(
                              color: Colors.grey[700], fontSize: 12)),
                    ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Treatment lines
        if (report.lines.isNotEmpty) ...[
          _SectionLabel('TREATMENT LINES'),
          ...report.lines.map((l) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _LineCard(line: l),
              )),
          const SizedBox(height: 4),
        ],

        // Sample
        if (report.sampleType != null ||
            report.sampleNotes != null ||
            report.samplePhotoUrl != null) ...[
          _SectionLabel('SAMPLE COLLECTION'),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (report.sampleType != null || report.sampleNotes != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (report.sampleType != null) ...[
                          Text('Sample Type',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.blue.shade400,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(report.sampleType!,
                              style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                        ],
                        if (report.sampleNotes != null) ...[
                          Text('Special Notes',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.blue.shade400,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(report.sampleNotes!,
                              style: const TextStyle(fontSize: 13)),
                        ],
                      ],
                    ),
                  ),
                if (report.samplePhotoUrl != null)
                  ClipRRect(
                    borderRadius: BorderRadius.only(
                      bottomLeft: const Radius.circular(12),
                      bottomRight: const Radius.circular(12),
                      topLeft: (report.sampleType == null && report.sampleNotes == null)
                          ? const Radius.circular(12)
                          : Radius.zero,
                      topRight: (report.sampleType == null && report.sampleNotes == null)
                          ? const Radius.circular(12)
                          : Radius.zero,
                    ),
                    child: Image.network(
                      report.samplePhotoUrl!,
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => _PhotoError(),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Signature
        if (report.signatureUrl != null || report.signerName != null) ...[
          _SectionLabel('OPERATOR SIGNATURE'),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                // Signature canvas area
                Container(
                  width: double.infinity,
                  height: 110,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(12)),
                    border: Border(
                        bottom:
                            BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: report.signatureUrl != null
                      ? ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(12)),
                          child: Image.network(
                            report.signatureUrl!,
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) => const Center(
                              child: Icon(Icons.draw_outlined,
                                  color: Colors.grey, size: 32),
                            ),
                          ),
                        )
                      : const Center(
                          child: Icon(Icons.draw_outlined,
                              color: Colors.grey, size: 32),
                        ),
                ),
                // Operator info row
                Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      const Icon(Icons.person_outline,
                          size: 16, color: Colors.grey),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Operator',
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                    fontWeight: FontWeight.w500)),
                            Text(
                              report.signerName ?? '—',
                              style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                      if (report.signedAt != null)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Signed at',
                                style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                    fontWeight: FontWeight.w500)),
                            Text(
                              _fmt(report.signedAt),
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF374151)),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Notes
        if (report.notes != null && report.notes!.isNotEmpty) ...[
          _SectionLabel('NOTES'),
          _Card(
            child: Text(report.notes!,
                style:
                    const TextStyle(fontSize: 13, color: Color(0xFF374151))),
          ),
          const SizedBox(height: 12),
        ],

        const SizedBox(height: 24),
      ],
    );
  }

  String _fmt(String? iso) {
    if (iso == null) return '—';
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    final local = d.toLocal();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final h = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final m = local.minute.toString().padLeft(2, '0');
    final ampm = local.hour < 12 ? 'AM' : 'PM';
    return '${months[local.month - 1]} ${local.day}, ${local.year}  $h:$m $ampm';
  }
}

// ── Treatment line card ────────────────────────────────────────────────────────

class _LineCard extends StatelessWidget {
  const _LineCard({required this.line});
  final TreatmentLineData line;

  @override
  Widget build(BuildContext context) {
    final isCi = line.isCi;
    final levelPct = line.tankLevelPct;
    final levelColor = levelPct == null
        ? Colors.grey
        : levelPct < 10
            ? Colors.red
            : levelPct < 25
                ? Colors.orange
                : Colors.green;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isCi ? Colors.blue.shade50 : Colors.purple.shade50,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                _Badge(
                  isCi ? 'CI' : 'Batch',
                  isCi ? Colors.blue : Colors.purple,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    line.productName ?? (isCi ? 'Continuous Injection' : 'Batch Treatment'),
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
                if (isCi && line.onRate != null)
                  _Badge(
                    line.onRate! ? 'On Rate' : 'Off Rate',
                    line.onRate! ? Colors.green : Colors.red,
                  ),
                if (!isCi && line.applied != null)
                  _Badge(
                    line.applied! ? 'Applied' : 'Not Applied',
                    line.applied! ? Colors.green : Colors.grey,
                  ),
              ],
            ),
          ),

          // Body
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tank + level
                if (line.tankSerial != null || levelPct != null) ...[
                  Row(
                    children: [
                      if (line.tankSerial != null)
                        Text(line.tankSerial!,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13)),
                      if (levelPct != null) ...[
                        const SizedBox(width: 10),
                        Text(
                          '${levelPct.toStringAsFixed(2)}%',
                          style: TextStyle(
                              color: levelColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 13),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                ],

                if (isCi) ...[
                  _MetaRow('Pump', line.pumpRunning == true ? 'Running' : 'Not Running'),
                  if (line.pumpDownReason != null)
                    _MetaRow('Pump Down Reason', line.pumpDownReason!),
                  if (line.rateFound != null)
                    _MetaRow('Rate Found', '${line.rateFound!.toStringAsFixed(2)} gal/day'),
                  if (line.rateSetTo != null)
                    _MetaRow('Rate Set To', '${line.rateSetTo!.toStringAsFixed(2)} gal/day'),
                  if (line.deviationReason != null)
                    _MetaRow('Deviation', line.deviationReason!),
                ] else ...[
                  if (line.quantityApplied != null)
                    _MetaRow('Quantity Applied', '${line.quantityApplied!.toStringAsFixed(2)} gal'),
                ],

                if (line.notes != null && line.notes!.isNotEmpty)
                  _MetaRow('Notes', line.notes!),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8, left: 2),
        child: Text(text,
            style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 11,
                color: Colors.grey,
                letterSpacing: 0.8)),
      );
}

class _Card extends StatelessWidget {
  const _Card({required this.child, this.color, this.border});
  final Widget child;
  final Color? color;
  final Color? border;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color ?? Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border ?? Colors.grey.shade200),
        ),
        child: child,
      );
}

class _MetaRow extends StatelessWidget {
  const _MetaRow(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 100,
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                      fontWeight: FontWeight.w500)),
            ),
            Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      );
}

class _Badge extends StatelessWidget {
  const _Badge(this.label, this.color);
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: color.withValues(alpha: 0.9))),
      );
}

class _PhotoError extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        height: 80,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(
          child: Icon(Icons.broken_image_outlined,
              color: Colors.grey, size: 32),
        ),
      );
}
