import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import '../controllers/service_report_controller.dart';

class ServiceReportView extends GetView<ServiceReportController> {
  const ServiceReportView({super.key});

  static const _primary = Color(0xFF751903);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Service Report')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionHeader('Pump & Tank'),
            const SizedBox(height: 12),
            _PumpToggle(),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _Field(controller.tankLevelBefore, 'Tank Level Before (%)')),
              const SizedBox(width: 12),
              Expanded(child: _Field(controller.tankLevelAfter,  'Tank Level After (%)')),
            ]),
            const SizedBox(height: 12),
            _Field(controller.actualRate, 'Actual Pump Rate (gal/day)'),
            const SizedBox(height: 24),
            _SectionHeader('Chemicals'),
            const SizedBox(height: 12),
            Obx(() => Column(
              children: [
                ...controller.chemicals.asMap().entries.map(
                  (e) => _ChemicalCard(index: e.key, line: e.value),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: controller.addChemical,
                  icon: const Icon(Icons.add, color: _primary),
                  label: const Text('Add Chemical', style: TextStyle(color: _primary)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: _primary),
                    minimumSize: const Size.fromHeight(44),
                  ),
                ),
              ],
            )),
            const SizedBox(height: 24),
            _SectionHeader('Notes'),
            const SizedBox(height: 12),
            _Field(controller.specialTreat, 'Special Treatment', maxLines: 2),
            const SizedBox(height: 12),
            _Field(controller.notes, 'General Notes', maxLines: 3),
            const SizedBox(height: 24),
            _SoarToggle(),
            const SizedBox(height: 24),
            _SubmitButton(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);
  final String title;

  @override
  Widget build(BuildContext context) => Text(
        title,
        style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Color(0xFF751903),
            letterSpacing: 0.8),
      );
}

class _Field extends StatelessWidget {
  const _Field(this.ctrl, this.label, {this.maxLines = 1});
  final TextEditingController ctrl;
  final String label;
  final int maxLines;

  @override
  Widget build(BuildContext context) => TextField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: maxLines == 1 ? TextInputType.number : TextInputType.multiline,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      );
}

class _PumpToggle extends GetView<ServiceReportController> {
  const _PumpToggle();

  @override
  Widget build(BuildContext context) => Obx(() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Pump Running',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            Switch(
              value: controller.pumpRunning.value,
              onChanged: (v) => controller.pumpRunning.value = v,
              activeColor: const Color(0xFF751903),
            ),
          ],
        ),
      ));
}

class _SoarToggle extends GetView<ServiceReportController> {
  const _SoarToggle();

  @override
  Widget build(BuildContext context) => Obx(() => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: controller.soar.value
              ? Colors.green[50]
              : Colors.red[50],
          border: Border.all(
            color: controller.soar.value ? Colors.green : Colors.red,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('S.O.A.R',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                Text(
                  controller.soar.value
                      ? 'Acknowledged ✓'
                      : 'Required before submitting',
                  style: TextStyle(
                      fontSize: 12,
                      color: controller.soar.value ? Colors.green[700] : Colors.red[700]),
                ),
              ],
            ),
            Switch(
              value: controller.soar.value,
              onChanged: (v) => controller.soar.value = v,
              activeColor: Colors.green,
            ),
          ],
        ),
      ));
}

class _SubmitButton extends GetView<ServiceReportController> {
  const _SubmitButton();

  @override
  Widget build(BuildContext context) => Obx(() {
        final loading = controller.submitState.value is AsyncLoading;
        return SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: loading ? null : controller.submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF751903),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text('Submit Report',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
          ),
        );
      });
}

class _ChemicalCard extends StatelessWidget {
  const _ChemicalCard({required this.index, required this.line});
  final int index;
  final ChemicalLine line;

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ServiceReportController>();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Chemical ${index + 1}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                onPressed: () => controller.removeChemical(index),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: line.nameCtrl,
            decoration: InputDecoration(
              labelText: 'Chemical Name *',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _SmallField(line.galDeliveredCtrl, 'Gal. Delivered')),
            const SizedBox(width: 8),
            Expanded(child: _SmallField(line.galOnHandCtrl, 'Gal. On Hand')),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: _SmallField(line.recRateCtrl, 'Rec. Rate')),
            const SizedBox(width: 8),
            Expanded(child: _SmallField(line.actualRateCtrl, 'Actual Rate')),
          ]),
          const SizedBox(height: 10),
          TextField(
            controller: line.commentsCtrl,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Comments',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          const SizedBox(height: 10),
          Obx(() => Row(
                children: [
                  _CheckItem(
                    label: 'On Rate',
                    value: line.onRate.value,
                    onTap: () => line.onRate.value = !line.onRate.value,
                  ),
                  const SizedBox(width: 16),
                  _CheckItem(
                    label: 'S.O.A.R',
                    value: line.soar.value,
                    onTap: () => line.soar.value = !line.soar.value,
                  ),
                ],
              )),
        ],
      ),
    );
  }
}

class _SmallField extends StatelessWidget {
  const _SmallField(this.ctrl, this.label);
  final TextEditingController ctrl;
  final String label;

  @override
  Widget build(BuildContext context) => TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      );
}

class _CheckItem extends StatelessWidget {
  const _CheckItem({required this.label, required this.value, required this.onTap});
  final String label;
  final bool value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Row(
          children: [
            Icon(
              value ? Icons.check_box : Icons.check_box_outline_blank,
              color: value ? const Color(0xFF751903) : Colors.grey,
              size: 22,
            ),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          ],
        ),
      );
}
