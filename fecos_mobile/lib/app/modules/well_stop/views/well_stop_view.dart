import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:signature/signature.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';
import '../controllers/well_stop_controller.dart';

const _primary = Color(0xFF751903);

class WellStopView extends GetView<WellStopController> {
  const WellStopView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(controller.stop.wellName),
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Obx(() {
        if (controller.planLoading.value) {
          return const Center(
              child: CircularProgressIndicator(color: _primary));
        }
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _StopHeader(stop: controller.stop),
              const SizedBox(height: 16),
              if (controller.planLines.isEmpty)
                _InfoCard(
                  icon: Icons.info_outline,
                  message: 'No active treatment plan for this well.',
                )
              else ...[
                _label('TREATMENT LINES'),
                const SizedBox(height: 8),
                ...controller.planLines.asMap().entries.map(
                      (e) => _TreatmentLineCard(
                          line: e.value, index: e.key),
                    ),
              ],
              const SizedBox(height: 16),
              _SoarSection(),
              const SizedBox(height: 16),
              _GpsSection(),
              const SizedBox(height: 16),
              _PhotoSection(),
              const SizedBox(height: 16),
              _SampleSection(),
              const SizedBox(height: 16),
              _NotesSection(),
              const SizedBox(height: 16),
              _SignatureSection(),
              const SizedBox(height: 24),
              _SubmitButton(),
              const SizedBox(height: 32),
            ],
          ),
        );
      }),
    );
  }
}

// ── Stop header ───────────────────────────────────────────────────────────────

class _StopHeader extends StatelessWidget {
  const _StopHeader({required this.stop});
  final MyVisitStop stop;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: _primary.withValues(alpha: 0.1),
            child: Text(
              '${stop.sequence}',
              style: const TextStyle(
                  color: _primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 16),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(stop.wellName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 2),
                Text(stop.leaseName,
                    style:
                        TextStyle(color: Colors.grey[600], fontSize: 13)),
                Text(stop.clientName,
                    style:
                        TextStyle(color: Colors.grey[500], fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Treatment line card ────────────────────────────────────────────────────────

class _TreatmentLineCard extends StatelessWidget {
  const _TreatmentLineCard({required this.line, required this.index});
  final PlanLine line;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header bar ─────────────────────────────────────────────────
          _LineHeader(line: line),

          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Tank check ──────────────────────────────────────────
                _TankCheckSection(line: line),
                const SizedBox(height: 12),
                const _Divider(),
                const SizedBox(height: 12),

                // ── CI or Batch ─────────────────────────────────────────
                if (line.isCi) ...[
                  _CiSection(line: line),
                ] else ...[
                  _BatchSection(line: line),
                ],

                const SizedBox(height: 10),
                // ── Line notes ──────────────────────────────────────────
                TextField(
                  controller: line.lineNotes,
                  decoration: _inputDec('Notes (optional)'),
                  maxLines: 2,
                  style: const TextStyle(fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Line header ───────────────────────────────────────────────────────────────

class _LineHeader extends StatelessWidget {
  const _LineHeader({required this.line});
  final PlanLine line;

  @override
  Widget build(BuildContext context) {
    final isCi = line.isCi;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isCi ? Colors.blue.shade50 : Colors.purple.shade50,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(12)),
      ),
      child: Row(
        children: [
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: isCi ? Colors.blue.shade100 : Colors.purple.shade100,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              isCi ? 'CI' : 'Batch',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isCi
                    ? Colors.blue.shade800
                    : Colors.purple.shade800,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(line.productName,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 14)),
          ),
          Text('Rec: ${line.recRate.toStringAsFixed(1)} gal/day',
              style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// ── Tank check section ────────────────────────────────────────────────────────

class _TankCheckSection extends StatelessWidget {
  const _TankCheckSection({required this.line});
  final PlanLine line;

  @override
  Widget build(BuildContext context) {
    final tankLabel = line.tankSerial != null
        ? 'Tank: ${line.tankSerial}'
        : 'Tank: —';
    final capacityLabel = line.tankCapacityGallons != null
        ? '${line.tankCapacityGallons!.toStringAsFixed(0)} gal capacity'
        : '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.propane_tank, size: 16, color: _primary),
            const SizedBox(width: 6),
            Text(tankLabel,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 13)),
            if (capacityLabel.isNotEmpty) ...[
              const SizedBox(width: 6),
              Text(capacityLabel,
                  style:
                      TextStyle(color: Colors.grey[500], fontSize: 11)),
            ],
          ],
        ),
        if (line.estimatedLevelPct != null) ...[
          const SizedBox(height: 4),
          _EstimatedLevelBar(pct: line.estimatedLevelPct!),
        ],
        const SizedBox(height: 10),
        // Actual level field
        _TankLevelField(line: line),
      ],
    );
  }
}

class _EstimatedLevelBar extends StatelessWidget {
  const _EstimatedLevelBar({required this.pct});
  final double pct;

  @override
  Widget build(BuildContext context) {
    final color = pct < 10
        ? Colors.red
        : pct < 25
            ? Colors.orange
            : Colors.green;
    return Row(
      children: [
        Text('Est. level: ${pct.toStringAsFixed(1)}%',
            style: TextStyle(fontSize: 11, color: Colors.grey[600])),
        const SizedBox(width: 8),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (pct / 100).clamp(0.0, 1.0),
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 6,
            ),
          ),
        ),
        if (pct < 25)
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Icon(Icons.warning_amber_rounded,
                size: 14, color: color),
          ),
      ],
    );
  }
}

class _TankLevelField extends StatefulWidget {
  const _TankLevelField({required this.line});
  final PlanLine line;

  @override
  State<_TankLevelField> createState() => _TankLevelFieldState();
}

class _TankLevelFieldState extends State<_TankLevelField> {
  Color _borderColor = const Color(0xFFBDBDBD);

  void _onLevelChanged(String val) {
    widget.line.recordedAt ??= DateTime.now();
    final pct = double.tryParse(val);
    setState(() {
      if (pct == null || val.isEmpty) {
        _borderColor = const Color(0xFFBDBDBD);
      } else if (pct < 10) {
        _borderColor = Colors.red;
      } else if (pct < 25) {
        _borderColor = Colors.orange;
      } else {
        _borderColor = Colors.green;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.line.tankLevelPct,
      keyboardType:
          const TextInputType.numberWithOptions(decimal: true),
      decoration: _inputDec('Current Tank Level (%)').copyWith(
        suffixText: '%',
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: _borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: _borderColor, width: 1.5),
        ),
      ),
      style: const TextStyle(fontSize: 13),
      onChanged: _onLevelChanged,
    );
  }
}

// ── CI section ────────────────────────────────────────────────────────────────

class _CiSection extends StatelessWidget {
  const _CiSection({required this.line});
  final PlanLine line;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Pump info row
        Row(
          children: [
            const Icon(Icons.settings, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            Text(
              line.pumpDeployed
                  ? 'Pump: ${line.pumpSerial ?? "deployed"}'
                  : 'No pump deployed',
              style: TextStyle(
                  fontSize: 12,
                  color: line.pumpDeployed ? Colors.grey[600] : Colors.red,
                  fontWeight: line.pumpDeployed
                      ? FontWeight.normal
                      : FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Pump running toggle
        Obx(() => _ToggleRow(
              label: 'Pump Running',
              value: line.pumpRunning.value,
              activeColor: Colors.green,
              onChanged: (v) {
                line.pumpRunning.value = v;
                if (!v) line.onRate.value = false;
                line.recordedAt ??= DateTime.now();
              },
            )),

        // On Rate toggle — right next to Pump Running
        Obx(() => _ToggleRow(
              label: 'On Rate',
              value: line.onRate.value,
              activeColor: Colors.green,
              onChanged: (v) => line.onRate.value = v,
            )),

        // Pump down reason (when pump off)
        Obx(() => line.pumpRunning.value
            ? const SizedBox()
            : Padding(
                padding: const EdgeInsets.only(top: 8),
                child: TextField(
                  controller: line.pumpDownReason,
                  decoration: _inputDec('Why is the pump down? *')
                      .copyWith(
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide:
                          BorderSide(color: Colors.red.shade300),
                    ),
                  ),
                  maxLines: 2,
                  style: const TextStyle(fontSize: 13),
                ),
              )),

        const SizedBox(height: 12),

        // Rate row: Rec | Found | Set To
        _RateRow(line: line),

        const SizedBox(height: 10),

        // Deviation warning + reason
        ValueListenableBuilder<TextEditingValue>(
          valueListenable: line.rateSetTo,
          builder: (_, value, _) {
            final setTo = double.tryParse(value.text);
            if (setTo == null || (setTo - line.recRate).abs() < 0.001) {
              return const SizedBox();
            }
            final diff = setTo - line.recRate;
            final isUp = diff > 0;
            return Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber.shade300),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.swap_vert,
                            size: 14, color: Colors.amber.shade800),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${isUp ? "Increasing" : "Decreasing"} rate '
                            'from ${line.recRate.toStringAsFixed(1)} → '
                            '${setTo.toStringAsFixed(1)} gal/day '
                            '(${isUp ? "+" : ""}${diff.toStringAsFixed(1)})',
                            style: TextStyle(
                                fontSize: 12,
                                color: Colors.amber.shade900,
                                fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: line.deviationReason,
                    decoration: _inputDec('Reason for rate change *'),
                    maxLines: 2,
                    style: const TextStyle(fontSize: 13),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

// ── Rate row ──────────────────────────────────────────────────────────────────

class _RateRow extends StatefulWidget {
  const _RateRow({required this.line});
  final PlanLine line;

  @override
  State<_RateRow> createState() => _RateRowState();
}

class _RateRowState extends State<_RateRow> {
  // Force rebuild when rateSetTo changes so deviation warning reacts
  @override
  void initState() {
    super.initState();
    widget.line.rateSetTo.addListener(_rebuild);
    widget.line.rateFound.addListener(_rebuild);
  }

  void _rebuild() => setState(() {});

  @override
  void dispose() {
    widget.line.rateSetTo.removeListener(_rebuild);
    widget.line.rateFound.removeListener(_rebuild);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Rec rate reference
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              Text('Rec Rate:',
                  style: TextStyle(
                      fontSize: 12, color: Colors.grey[600])),
              const SizedBox(width: 6),
              Text(
                '${widget.line.recRate.toStringAsFixed(1)} gal/day',
                style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: _primary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _NumberField(
                label: 'Rate Found',
                controller: widget.line.rateFound,
                suffix: 'gal/day',
                onChanged: (_) =>
                    widget.line.recordedAt ??= DateTime.now(),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _NumberField(
                label: 'Rate Set To',
                controller: widget.line.rateSetTo,
                suffix: 'gal/day',
                onChanged: (_) =>
                    widget.line.recordedAt ??= DateTime.now(),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Batch section ─────────────────────────────────────────────────────────────

class _BatchSection extends StatelessWidget {
  const _BatchSection({required this.line});
  final PlanLine line;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Obx(() => _ToggleRow(
              label: 'Treatment Applied',
              value: line.applied.value,
              activeColor: Colors.green,
              onChanged: (v) {
                line.applied.value = v;
                line.recordedAt ??= DateTime.now();
              },
            )),
        const SizedBox(height: 10),
        _NumberField(
          label: 'Quantity Applied (gal)',
          controller: line.quantityApplied,
          suffix: 'gal',
          onChanged: (_) => line.recordedAt ??= DateTime.now(),
        ),
      ],
    );
  }
}

// ── SOAR section ──────────────────────────────────────────────────────────────

class _SoarSection extends GetView<WellStopController> {
  @override
  Widget build(BuildContext context) {
    return Obx(() => Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: controller.soar.value
                ? Colors.red.shade50
                : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: controller.soar.value
                  ? Colors.red.shade200
                  : Colors.grey.shade200,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.warning_amber_rounded,
                      color: controller.soar.value
                          ? Colors.red
                          : Colors.grey[400],
                      size: 20),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('SOAR',
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14)),
                        Text('Special Observation / Action Required',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 11)),
                      ],
                    ),
                  ),
                  Switch(
                    value: controller.soar.value,
                    onChanged: (v) => controller.soar.value = v,
                    activeThumbColor: Colors.red,
                  ),
                ],
              ),
              if (controller.soar.value) ...[
                const SizedBox(height: 10),
                TextField(
                  controller: controller.soarNote,
                  decoration: _inputDec('Describe the observation *'),
                  maxLines: 3,
                  style: const TextStyle(fontSize: 13),
                ),
              ],
            ],
          ),
        ));
  }
}

// ── GPS section ───────────────────────────────────────────────────────────────

class _GpsSection extends GetView<WellStopController> {
  @override
  Widget build(BuildContext context) {
    return Obx(() => _Card(
          child: Row(
            children: [
              Icon(Icons.location_on,
                  color: controller.gpsLat.value != null
                      ? Colors.green
                      : Colors.grey[400]),
              const SizedBox(width: 10),
              Expanded(
                child: controller.gpsLoading.value
                    ? const Text('Capturing GPS…',
                        style: TextStyle(
                            color: Colors.grey, fontSize: 13))
                    : controller.gpsLat.value != null
                        ? Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              const Text('GPS Captured',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13)),
                              Text(
                                '${controller.gpsLat.value!.toStringAsFixed(6)}, '
                                '${controller.gpsLng.value!.toStringAsFixed(6)}',
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          )
                        : const Text('GPS not captured',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 13)),
              ),
              TextButton.icon(
                onPressed: controller.refreshGps,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Refresh'),
                style: TextButton.styleFrom(foregroundColor: _primary),
              ),
            ],
          ),
        ));
  }
}

// ── Photo section ─────────────────────────────────────────────────────────────

class _PhotoSection extends GetView<WellStopController> {
  @override
  Widget build(BuildContext context) {
    return Obx(() => _Card(
          child: controller.photoFile.value == null
              ? Row(
                  children: [
                    Icon(Icons.camera_alt, color: Colors.grey[400]),
                    const SizedBox(width: 10),
                    const Expanded(
                        child: Text('No photo taken',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 13))),
                    TextButton.icon(
                      onPressed: controller.capturePhoto,
                      icon: const Icon(Icons.camera_alt, size: 16),
                      label: const Text('Take Photo'),
                      style: TextButton.styleFrom(
                          foregroundColor: _primary),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        controller.photoFile.value!,
                        height: 180,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment:
                          MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Photo captured',
                            style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w600,
                                fontSize: 13)),
                        TextButton(
                          onPressed: controller.removePhoto,
                          child: const Text('Remove',
                              style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  ],
                ),
        ));
  }
}

// ── Sample section ────────────────────────────────────────────────────────────

class _SampleSection extends GetView<WellStopController> {
  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.science, color: Colors.blue[600], size: 18),
              const SizedBox(width: 8),
              const Text('Sample Collection',
                  style: TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: controller.sampleType,
            decoration:
                _inputDec('Sample Type (e.g. Water, Oil, Bacteria)'),
            style: const TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller.sampleNotes,
            decoration: _inputDec('Sample Notes (optional)'),
            maxLines: 2,
            style: const TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 10),
          Obx(() => controller.samplePhotoFile.value == null
              ? Row(
                  children: [
                    Icon(Icons.camera_alt,
                        color: Colors.grey[400], size: 16),
                    const SizedBox(width: 8),
                    const Expanded(
                        child: Text('No sample photo',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 12))),
                    TextButton.icon(
                      onPressed: controller.captureSamplePhoto,
                      icon: const Icon(Icons.camera_alt, size: 14),
                      label: const Text('Photo (optional)'),
                      style: TextButton.styleFrom(
                          foregroundColor: _primary),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        controller.samplePhotoFile.value!,
                        height: 120,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Sample photo captured',
                            style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w600,
                                fontSize: 12)),
                        TextButton(
                          onPressed: controller.removeSamplePhoto,
                          child: const Text('Remove',
                              style: TextStyle(
                                  color: Colors.red, fontSize: 12)),
                        ),
                      ],
                    ),
                  ],
                )),
        ],
      ),
    );
  }
}

// ── Notes section ─────────────────────────────────────────────────────────────

class _NotesSection extends GetView<WellStopController> {
  @override
  Widget build(BuildContext context) {
    return _Card(
      child: TextField(
        controller: controller.notes,
        decoration: _inputDec('General Notes (optional)'),
        maxLines: 3,
        style: const TextStyle(fontSize: 13),
      ),
    );
  }
}

// ── Signature section ─────────────────────────────────────────────────────────

class _SignatureSection extends GetView<WellStopController> {
  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.draw, size: 18, color: _primary),
              const SizedBox(width: 8),
              const Text('Operator Signature',
                  style: TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14)),
              const Spacer(),
              TextButton(
                onPressed: () => controller.signatureController.clear(),
                child: const Text('Clear',
                    style: TextStyle(color: Colors.red, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller.signerName,
            decoration: _inputDec('Operator Name *'),
            style: const TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 10),
          Obx(() => controller.hasSigned.value
              ? Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.green.shade300),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle,
                          color: Colors.green, size: 16),
                      SizedBox(width: 6),
                      Text('Signature captured',
                          style: TextStyle(
                              color: Colors.green,
                              fontSize: 12,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                )
              : const SizedBox()),
          Container(
            height: 160,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
              color: Colors.grey.shade50,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Signature(
                controller: controller.signatureController,
                backgroundColor: Colors.grey.shade50,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Submit button ─────────────────────────────────────────────────────────────

class _SubmitButton extends GetView<WellStopController> {
  @override
  Widget build(BuildContext context) {
    return Obx(() => SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: controller.isSubmitting.value
                ? null
                : controller.submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: _primary,
              foregroundColor: Colors.white,
              disabledBackgroundColor:
                  _primary.withValues(alpha: 0.6),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: controller.isSubmitting.value
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2),
                  )
                : const Text('Submit Report',
                    style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
          ),
        ));
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: child,
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Divider(color: Colors.grey.shade200, height: 1);
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.icon, required this.message});
  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[400], size: 20),
          const SizedBox(width: 10),
          Expanded(
              child: Text(message,
                  style: TextStyle(
                      color: Colors.grey[600], fontSize: 13))),
        ],
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({
    required this.label,
    required this.value,
    required this.onChanged,
    this.activeColor = _primary,
  });
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Color activeColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13)),
        Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: activeColor),
      ],
    );
  }
}

class _NumberField extends StatelessWidget {
  const _NumberField({
    required this.label,
    required this.controller,
    required this.suffix,
    this.onChanged,
  });
  final String label;
  final TextEditingController controller;
  final String suffix;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType:
          const TextInputType.numberWithOptions(decimal: true),
      decoration: _inputDec(label).copyWith(suffixText: suffix),
      style: const TextStyle(fontSize: 13),
      onChanged: onChanged,
    );
  }
}

Widget _label(String text) => Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(text,
          style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 11,
              color: Colors.grey,
              letterSpacing: 0.8)),
    );

InputDecoration _inputDec(String label) => InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontSize: 12),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _primary),
      ),
    );
