import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/modules/delivery/controllers/delivery_controller.dart';

class LoadVerificationView extends StatefulWidget {
  const LoadVerificationView({super.key});

  @override
  State<LoadVerificationView> createState() => _LoadVerificationViewState();
}

class _LoadVerificationViewState extends State<LoadVerificationView> {
  late final RouteModel _route;
  late final DeliveryController _controller;
  late final Map<String, TextEditingController> _qtyControllers;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final args = Get.arguments as Map<String, dynamic>;
    _route = args['route'] as RouteModel;
    _controller = args['controller'] as DeliveryController;

    _qtyControllers = {
      for (final stop in _route.stops)
        for (final item in stop.items)
          item.id: TextEditingController(text: _fmt(item.quantity))
    };
  }

  @override
  void dispose() {
    for (final c in _qtyControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  String _fmt(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toString();

  void _fillAllPlanned() {
    for (final stop in _route.stops) {
      for (final item in stop.items) {
        _qtyControllers[item.id]?.text = _fmt(item.quantity);
      }
    }
    setState(() {});
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    final loadedQtyMap = <String, double>{
      for (final entry in _qtyControllers.entries)
        entry.key: double.tryParse(entry.value.text) ?? 0.0
    };
    final success = await _controller.confirmLoad(loadedQtyMap);
    if (mounted) {
      setState(() => _submitting = false);
      if (success) Get.back(result: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.dark,
        foregroundColor: Colors.white,
        title: const Text('Verify Load',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
        actions: [
          TextButton(
            onPressed: _fillAllPlanned,
            child: const Text('All Good',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Instruction banner
          Container(
            width: double.infinity,
            color: AppColors.info.withValues(alpha: 0.08),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: const Text(
              'Confirm the quantities loaded on your truck. Adjust if different from planned.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ),

          // Stop list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              itemCount: _route.stops.length,
              itemBuilder: (context, i) {
                final stop = _route.stops[i];
                return _StopLoadCard(
                  stop: stop,
                  index: i,
                  controllers: _qtyControllers,
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: FilledButton(
            onPressed: _submitting ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              disabledBackgroundColor: AppColors.border,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Confirm Load',
                    style:
                        TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          ),
        ),
      ),
    );
  }
}

// ── Stop load card ─────────────────────────────────────────────────────────────

class _StopLoadCard extends StatelessWidget {
  const _StopLoadCard({
    required this.stop,
    required this.index,
    required this.controllers,
  });

  final RouteStop stop;
  final int index;
  final Map<String, TextEditingController> controllers;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text('${index + 1}',
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(stop.wellName ?? 'Well',
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary)),
                        if (stop.leaseName != null)
                          Text(stop.leaseName!,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            if (stop.items.isNotEmpty) ...[
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                child: Column(
                  children: stop.items
                      .map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _ItemLoadRow(
                              item: item,
                              controller: controllers[item.id]!,
                            ),
                          ))
                      .toList(),
                ),
              ),
            ],
          ],
        ),
      );
}

// ── Item load row ─────────────────────────────────────────────────────────────

class _ItemLoadRow extends StatelessWidget {
  const _ItemLoadRow({required this.item, required this.controller});
  final RouteStopItem item;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          const Icon(Icons.inventory_2_outlined,
              size: 15, color: AppColors.textHint),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.productName ?? 'Product',
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
                Text('Planned: ${_fmt(item.quantity)} ${item.unit}',
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 88,
            child: TextField(
              controller: controller,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary),
              decoration: InputDecoration(
                suffixText: item.unit,
                suffixStyle: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                isDense: true,
              ),
            ),
          ),
        ],
      );

  String _fmt(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toString();
}
