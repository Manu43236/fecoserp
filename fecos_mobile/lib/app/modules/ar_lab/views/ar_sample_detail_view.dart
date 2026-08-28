import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:printing/printing.dart';
import 'package:fecos_mobile/app/data/models/lab_sample_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/utils/fecos_pdf.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import '../controllers/ar_lab_controller.dart';

class ArSampleDetailView extends StatefulWidget {
  const ArSampleDetailView({super.key, required this.sampleId});
  final String sampleId;

  @override
  State<ArSampleDetailView> createState() => _ArSampleDetailViewState();
}

class _ArSampleDetailViewState extends State<ArSampleDetailView> {
  final _dio = Get.find<DioService>().dio;
  late Future<LabSampleModel> _future;
  LabSampleModel? _sample;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<LabSampleModel> _load() async {
    final res = await _dio
        .get<Map<String, dynamic>>('/lab/samples/${widget.sampleId}');
    final s = LabSampleModel.fromJson(res.data!['data'] as Map<String, dynamic>);
    if (mounted) setState(() => _sample = s);
    return s;
  }

  Future<void> _sharePdf() async {
    final s = _sample!;
    final bytes = await FecosPdf.build(pageContent: [
      [
        FecosPdf.title('Lab Sample Report'),
        FecosPdf.subtitle('${s.sampleNumber}  ·  ${s.sampleType.replaceAll('_', ' ')}'),
        FecosPdf.sectionTitle('Sample Info'),
        FecosPdf.infoTable([
          ('Status',   s.status.replaceAll('_', ' ')),
          ('Priority', s.priority),
          if (s.wellName != null)   ('Well',     s.wellName!),
          if (s.leaseName != null)  ('Lease',    s.leaseName!),
          if (s.clientName != null) ('Client',   s.clientName!),
          if (s.receivedAt != null) ('Received', s.receivedAt!),
        ]),
        if (s.hasResults) ...[
          FecosPdf.sectionTitle('Lab Results'),
          FecosPdf.infoTable([
            if (s.ph != null)              ('pH',             s.ph!.toStringAsFixed(2)),
            if (s.iron != null)            ('Iron (mg/L)',    s.iron!.toStringAsFixed(2)),
            if (s.srbCount != null)        ('SRB (cfu/mL)',   s.srbCount!.toStringAsFixed(0)),
            if (s.apbCount != null)        ('APB (cfu/mL)',   s.apbCount!.toStringAsFixed(0)),
            if (s.corrosionRate != null)   ('Corrosion (mpy)',s.corrosionRate!.toStringAsFixed(3)),
            if (s.dissolvedOxygen != null) ('DO (mg/L)',      s.dissolvedOxygen!.toStringAsFixed(2)),
            if (s.scalingIndex != null)    ('Scaling Index',  s.scalingIndex!.toStringAsFixed(2)),
            if (s.labTechName != null)     ('Analyzed By',    s.labTechName!),
          ]),
        ],
        if (s.labTechNotes != null && s.labTechNotes!.isNotEmpty) ...[
          FecosPdf.sectionTitle('Lab Tech Notes'),
          FecosPdf.bodyText(s.labTechNotes!),
        ],
        if (s.isApproved) ...[
          FecosPdf.sectionTitle('Approval'),
          FecosPdf.infoTable([
            if (s.approvedByName != null) ('Approved By', s.approvedByName!),
            if (s.approvalNotes != null && s.approvalNotes!.isNotEmpty)
              ('Notes', s.approvalNotes!),
          ]),
        ],
      ],
    ]);
    await Printing.sharePdf(bytes: bytes, filename: '${s.sampleNumber}.pdf');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.dark,
          foregroundColor: Colors.white,
          title: const Text(
            'Sample Detail',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          ),
          actions: [
            if (_sample != null)
              IconButton(
                icon: const Icon(Icons.picture_as_pdf_outlined,
                    color: Colors.white),
                tooltip: 'Export PDF',
                onPressed: _sharePdf,
              ),
          ],
        ),
        body: FutureBuilder<LabSampleModel>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const FecosListShimmer(itemCount: 4, itemHeight: 120);
            }
            if (snap.hasError) {
              return const Center(
                child: Text(
                  'Failed to load sample',
                  style: TextStyle(color: AppColors.danger),
                ),
              );
            }
            return _SampleBody(sample: snap.data!);
          },
        ),
      );
}

// ── Body ──────────────────────────────────────────────────────────────────────

class _SampleBody extends StatelessWidget {
  const _SampleBody({required this.sample});
  final LabSampleModel sample;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _HeaderCard(sample: sample),
          const SizedBox(height: 16),
          if (sample.hasCriticalValues) ...[
            _CriticalBanner(),
            const SizedBox(height: 16),
          ],
          if (sample.hasResults) ...[
            _ResultsCard(sample: sample),
            const SizedBox(height: 16),
            if (sample.labTechNotes != null &&
                sample.labTechNotes!.isNotEmpty) ...[
              _NotesCard(notes: sample.labTechNotes!),
              const SizedBox(height: 16),
            ],
          ],
          if (sample.isApproved) _ApprovalCard(sample: sample)
          else if (sample.isPendingApproval) _ApproveButton(sample: sample),
        ],
      );
}

// ── Header card ───────────────────────────────────────────────────────────────

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.sample});
  final LabSampleModel sample;

  Color get _priorityColor => switch (sample.priority) {
        'URGENT'   => AppColors.danger,
        'HIGH'     => const Color(0xFFEA580C),
        'NORMAL'   => AppColors.info,
        _          => AppColors.textHint,
      };

  Color get _statusColor => switch (sample.status) {
        'PENDING'    => AppColors.warning,
        'IN_PROCESS' => AppColors.info,
        'COMPLETED'  => AppColors.success,
        _            => AppColors.textHint,
      };

  @override
  Widget build(BuildContext context) => Container(
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
                    sample.sampleNumber,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _priorityColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    sample.priority,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: _priorityColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            _InfoRow(
              icon: Icons.science_outlined,
              text: sample.sampleType.replaceAll('_', ' '),
            ),
            if (sample.wellName != null)
              _InfoRow(icon: Icons.oil_barrel_outlined, text: sample.wellName!),
            if (sample.leaseName != null)
              _InfoRow(icon: Icons.location_on_outlined, text: sample.leaseName!),
            if (sample.clientName != null)
              _InfoRow(icon: Icons.business_outlined, text: sample.clientName!),
            if (sample.receivedAt != null)
              _InfoRow(
                icon: Icons.calendar_today_outlined,
                text: 'Received ${_fmtDate(sample.receivedAt!)}',
              ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Text(
                  'Status: ',
                  style: TextStyle(fontSize: 13, color: AppColors.textHint),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    sample.status.replaceAll('_', ' '),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: _statusColor,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
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
                    fontSize: 13, color: AppColors.textSecondary),
              ),
            ),
          ],
        ),
      );
}

// ── Critical banner ───────────────────────────────────────────────────────────

class _CriticalBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.danger.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.danger.withValues(alpha: 0.4)),
        ),
        child: const Row(
          children: [
            Icon(Icons.warning_rounded, color: AppColors.danger, size: 18),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Critical values detected — treatment review required',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.danger,
                ),
              ),
            ),
          ],
        ),
      );
}

// ── Results card ──────────────────────────────────────────────────────────────

class _ResultsCard extends StatelessWidget {
  const _ResultsCard({required this.sample});
  final LabSampleModel sample;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionHeader(label: 'Lab Results'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                if (sample.ph != null)
                  _MetricTile(
                    label: 'pH',
                    value: sample.ph!.toStringAsFixed(2),
                    isCritical: sample.ph! < 6.5 || sample.ph! > 8.5,
                  ),
                if (sample.iron != null)
                  _MetricTile(
                    label: 'Iron (mg/L)',
                    value: sample.iron!.toStringAsFixed(2),
                    isCritical: sample.iron! > 0.3,
                  ),
                if (sample.srbCount != null)
                  _MetricTile(
                    label: 'SRB (cfu/mL)',
                    value: _fmtCount(sample.srbCount!),
                    isCritical: sample.srbCount! > 10,
                  ),
                if (sample.apbCount != null)
                  _MetricTile(
                    label: 'APB (cfu/mL)',
                    value: _fmtCount(sample.apbCount!),
                    isCritical: sample.apbCount! > 100,
                  ),
                if (sample.corrosionRate != null)
                  _MetricTile(
                    label: 'Corrosion (mpy)',
                    value: sample.corrosionRate!.toStringAsFixed(3),
                    isCritical: sample.corrosionRate! > 5,
                  ),
                if (sample.dissolvedOxygen != null)
                  _MetricTile(
                    label: 'DO (mg/L)',
                    value: sample.dissolvedOxygen!.toStringAsFixed(2),
                    isCritical: false,
                  ),
                if (sample.scalingIndex != null)
                  _MetricTile(
                    label: 'Scaling Index',
                    value: sample.scalingIndex!.toStringAsFixed(2),
                    isCritical: sample.scalingIndex!.abs() > 2,
                  ),
              ],
            ),
            if (sample.labTechName != null) ...[
              const SizedBox(height: 12),
              const Divider(color: AppColors.border, height: 1),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.person_outline,
                      size: 13, color: AppColors.textHint),
                  const SizedBox(width: 6),
                  Text(
                    'Analyzed by ${sample.labTechName}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      );

  String _fmtCount(double v) {
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.isCritical,
  });
  final String label;
  final String value;
  final bool isCritical;

  @override
  Widget build(BuildContext context) => Container(
        width: (MediaQuery.of(context).size.width - 68) / 2,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isCritical
              ? AppColors.danger.withValues(alpha: 0.06)
              : AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isCritical
                ? AppColors.danger.withValues(alpha: 0.4)
                : AppColors.border,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: isCritical ? AppColors.danger : AppColors.textHint,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: isCritical ? AppColors.danger : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      );
}

// ── Lab tech notes card ───────────────────────────────────────────────────────

class _NotesCard extends StatelessWidget {
  const _NotesCard({required this.notes});
  final String notes;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionHeader(label: 'Lab Tech Notes'),
            const SizedBox(height: 8),
            Text(
              notes,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
}

// ── Already approved card ─────────────────────────────────────────────────────

class _ApprovalCard extends StatelessWidget {
  const _ApprovalCard({required this.sample});
  final LabSampleModel sample;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.check_circle_outline,
                    color: AppColors.success, size: 18),
                SizedBox(width: 8),
                Text(
                  'Approved',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
            if (sample.approvedByName != null) ...[
              const SizedBox(height: 8),
              Text(
                'By ${sample.approvedByName}',
                style:
                    const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
            if (sample.requiresTreatmentChange) ...[
              const SizedBox(height: 6),
              const Row(
                children: [
                  Icon(Icons.swap_horiz_rounded,
                      size: 14, color: AppColors.warning),
                  SizedBox(width: 6),
                  Text(
                    'Treatment change required',
                    style: TextStyle(fontSize: 13, color: AppColors.warning),
                  ),
                ],
              ),
            ],
            if (sample.approvalNotes != null &&
                sample.approvalNotes!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                sample.approvalNotes!,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
          ],
        ),
      );
}

// ── Approve button ────────────────────────────────────────────────────────────

class _ApproveButton extends StatelessWidget {
  const _ApproveButton({required this.sample});
  final LabSampleModel sample;

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ArLabController>();
    return Obx(
      () => SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: controller.approvalLoading.value
              ? null
              : () => _showApproveSheet(context, controller),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          icon: controller.approvalLoading.value
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.check_rounded, color: Colors.white),
          label: Text(
            controller.approvalLoading.value ? 'Approving…' : 'Approve Sample',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }

  void _showApproveSheet(BuildContext context, ArLabController controller) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _ApproveSheet(sample: sample, controller: controller),
    );
  }
}

class _ApproveSheet extends StatefulWidget {
  const _ApproveSheet({required this.sample, required this.controller});
  final LabSampleModel sample;
  final ArLabController controller;

  @override
  State<_ApproveSheet> createState() => _ApproveSheetState();
}

class _ApproveSheetState extends State<_ApproveSheet> {
  bool _requiresChange = false;
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Approve Sample',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.sample.sampleNumber,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textHint,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Treatment change required?',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Flag if current dosing needs adjustment',
                        style: TextStyle(
                            fontSize: 12, color: AppColors.textHint),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _requiresChange,
                  onChanged: (v) => setState(() => _requiresChange = v),
                  activeThumbColor: AppColors.primary,
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Approval notes (optional)…',
                hintStyle: const TextStyle(color: AppColors.textHint),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () async {
                  Navigator.of(context).pop();
                  final ok = await widget.controller.approve(
                    widget.sample.id,
                    requiresTreatmentChange: _requiresChange,
                    notes: _notesController.text.trim(),
                  );
                  if (ok) {
                    Get.back();
                    Get.snackbar(
                      'Approved',
                      'Sample ${widget.sample.sampleNumber} approved',
                      backgroundColor: AppColors.success,
                      colorText: Colors.white,
                      duration: const Duration(seconds: 3),
                    );
                  } else {
                    Get.snackbar(
                      'Error',
                      'Failed to approve sample. Please try again.',
                      backgroundColor: AppColors.danger,
                      colorText: Colors.white,
                    );
                  }
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Confirm Approval',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
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
