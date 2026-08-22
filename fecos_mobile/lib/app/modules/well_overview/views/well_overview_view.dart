import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/well_overview_controller.dart';

const _primary = Color(0xFF751903);

class WellOverviewView extends GetView<WellOverviewController> {
  const WellOverviewView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(controller.stop.wellName),
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: controller.reload,
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(
              child: CircularProgressIndicator(color: _primary));
        }
        if (controller.errorMsg.value != null) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline,
                    size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(controller.errorMsg.value!,
                    textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: controller.reload,
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }
        return _Body(
          visitId: controller.visitId,
          stopId: controller.stopId,
        );
      }),
    );
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────

class _Body extends GetView<WellOverviewController> {
  const _Body({required this.visitId, required this.stopId});
  final String visitId;
  final String stopId;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Well info header
        _WellHeader(stop: controller.stop),
        const SizedBox(height: 16),

        // Treatment plan section
        if (controller.lines.isEmpty)
          _EmptyPlanCard()
        else ...[
          _sectionLabel('TREATMENT PLAN'),
          const SizedBox(height: 8),
          ...controller.lines.map((l) => _LineCard(line: l)),
        ],
      ],
    );
  }
}

// ── Well header ───────────────────────────────────────────────────────────────

class _WellHeader extends StatelessWidget {
  const _WellHeader({required this.stop});
  final dynamic stop;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                '${stop.sequence}',
                style: const TextStyle(
                  color: _primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(stop.wellName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 2),
                Text(stop.leaseName,
                    style: TextStyle(
                        color: Colors.grey[600], fontSize: 13)),
                Text(stop.clientName,
                    style: TextStyle(
                        color: Colors.grey[500], fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Treatment line card ────────────────────────────────────────────────────────

class _LineCard extends StatelessWidget {
  const _LineCard({required this.line});
  final PlanLineSummary line;

  @override
  Widget build(BuildContext context) {
    final isCi = line.isCi;
    final levelPct = line.estimatedLevelPct;
    final levelColor = levelPct == null
        ? Colors.grey
        : levelPct < 10
            ? Colors.red
            : levelPct < 25
                ? Colors.orange
                : Colors.green;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: levelPct != null && levelPct < 25
              ? levelColor.withValues(alpha: 0.4)
              : Colors.grey.shade200,
          width: levelPct != null && levelPct < 25 ? 1.5 : 1,
        ),
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
                _badge(
                  isCi ? 'CI' : 'Batch',
                  isCi ? Colors.blue : Colors.purple,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(line.productName,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14)),
                ),
                if (line.schedule != null)
                  _badge(
                    _scheduleLabel(line.schedule!),
                    Colors.grey,
                    small: true,
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
                // ── Tank ───────────────────────────────────────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.propane_tank,
                        size: 16, color: _primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(line.tankLabel,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13)),
                              if (line.capacityGallons != null) ...[
                                const SizedBox(width: 6),
                                Text(
                                  '${line.capacityGallons!.toStringAsFixed(0)} gal',
                                  style: TextStyle(
                                      color: Colors.grey[500],
                                      fontSize: 11),
                                ),
                              ],
                              if (levelPct != null && levelPct < 25)
                                Padding(
                                  padding:
                                      const EdgeInsets.only(left: 6),
                                  child: Icon(
                                      Icons.warning_amber_rounded,
                                      size: 14,
                                      color: levelColor),
                                ),
                            ],
                          ),
                          if (levelPct != null) ...[
                            const SizedBox(height: 6),
                            _LevelBar(pct: levelPct, color: levelColor),
                          ] else ...[
                            const SizedBox(height: 4),
                            Text('Level not available',
                                style: TextStyle(
                                    color: Colors.grey[400],
                                    fontSize: 11)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),

                // ── Pump (CI only) ──────────────────────────────────────
                if (isCi) ...[
                  Row(
                    children: [
                      Icon(Icons.settings,
                          size: 16,
                          color: line.pumpDeployed
                              ? Colors.green
                              : Colors.red),
                      const SizedBox(width: 6),
                      Text(
                        line.pumpDeployed
                            ? 'Pump deployed${line.pumpSerial != null ? ": ${line.pumpSerial}" : ""}'
                            : 'No pump deployed',
                        style: TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                          color: line.pumpDeployed
                              ? Colors.grey[700]
                              : Colors.red,
                        ),
                      ),
                      if (!line.pumpDeployed)
                        Padding(
                          padding: const EdgeInsets.only(left: 6),
                          child: Icon(Icons.warning_amber_rounded,
                              size: 14, color: Colors.red),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                ],

                // ── Rec rate ────────────────────────────────────────────
                Row(
                  children: [
                    Icon(Icons.speed,
                        size: 16, color: Colors.grey[500]),
                    const SizedBox(width: 6),
                    Text(
                      isCi
                          ? 'Rec Rate: ${line.recRate.toStringAsFixed(1)} gal/day'
                          : 'Batch treatment${line.schedule != null ? " — ${_scheduleLabel(line.schedule!)}" : ""}',
                      style: TextStyle(
                          fontSize: 13, color: Colors.grey[700]),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _scheduleLabel(String s) => switch (s) {
        'WEEKLY' => 'Weekly',
        'BIWEEKLY' => 'Bi-weekly',
        'MONTHLY' => 'Monthly',
        'QUARTERLY' => 'Quarterly',
        _ => s,
      };
}

// ── Level bar ─────────────────────────────────────────────────────────────────

class _LevelBar extends StatelessWidget {
  const _LevelBar({required this.pct, required this.color});
  final double pct;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (pct / 100).clamp(0.0, 1.0),
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 8,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '${pct.toStringAsFixed(1)}%',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 12,
            color: color,
          ),
        ),
      ],
    );
  }
}

// ── Empty plan card ───────────────────────────────────────────────────────────

class _EmptyPlanCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.grey[400]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'No active treatment plan for this well.\nYou can still record observations.',
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

Widget _sectionLabel(String text) => Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 2),
      child: Text(
        text,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 11,
          color: Colors.grey,
          letterSpacing: 0.8,
        ),
      ),
    );

Widget _badge(String label, Color color, {bool small = false}) =>
    Container(
      padding: EdgeInsets.symmetric(
          horizontal: small ? 6 : 8, vertical: small ? 2 : 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: small ? 10 : 11,
          fontWeight: FontWeight.w700,
          color: color.withValues(alpha: 0.9),
        ),
      ),
    );
