import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/modules/delivery/controllers/delivery_controller.dart';

class WrapUpView extends StatefulWidget {
  const WrapUpView({super.key});

  @override
  State<WrapUpView> createState() => _WrapUpViewState();
}

class _WrapUpViewState extends State<WrapUpView> {
  final _controller = Get.find<DeliveryController>();

  // Aggregate undelivered qty by productId across all skipped/partial stops
  Map<String, _ReturnItem> _buildReturnMap(RouteModel route) {
    final map = <String, _ReturnItem>{};
    for (final stop in route.stops) {
      if (stop.isSkipped) {
        for (final item in stop.items) {
          final qty = item.loadedQty ?? item.quantity;
          if (qty <= 0) continue;
          final existing = map[item.productId];
          if (existing != null) {
            map[item.productId] = existing.copyWith(qty: existing.qty + qty);
          } else {
            map[item.productId] = _ReturnItem(
              productId: item.productId,
              productName: item.productName ?? 'Product',
              qty: qty,
              unit: item.unit,
            );
          }
        }
      } else if (stop.isCompleted) {
        for (final item in stop.items) {
          final planned = item.loadedQty ?? item.quantity;
          final delivered = item.actualQtyDelivered ?? planned;
          final leftover = planned - delivered;
          if (leftover <= 0) continue;
          final existing = map[item.productId];
          if (existing != null) {
            map[item.productId] = existing.copyWith(qty: existing.qty + leftover);
          } else {
            map[item.productId] = _ReturnItem(
              productId: item.productId,
              productName: item.productName ?? 'Product',
              qty: leftover,
              unit: item.unit,
            );
          }
        }
      }
    }
    return map;
  }

  Future<void> _complete(RouteModel route) async {
    final returnMap = _buildReturnMap(route);
    final items = returnMap.values
        .map((r) => {
              'productId': r.productId,
              'qty': r.qty,
              'unit': r.unit,
            })
        .toList();

    final ok = await _controller.returnInventory(items);
    if (ok) {
      // Pop back to routes list
      Get.until((r) => r.settings.name == '/main' || r.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Scaffold(
      appBar: AppBar(title: const Text('Route Wrap-Up')),
      body: Obx(() {
        final route = _controller.route.value;
        if (route == null) {
          return const Center(child: CircularProgressIndicator());
        }

        final delivered = route.stops.where((s) => s.isCompleted).length;
        final skipped = route.stops.where((s) => s.isSkipped).length;
        final returnMap = _buildReturnMap(route);

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Summary card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Delivery Summary',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            )),
                    const SizedBox(height: 12),
                    _SummaryRow(
                        icon: Icons.check_circle,
                        color: Colors.green,
                        label: 'Delivered',
                        value: '$delivered stops'),
                    const SizedBox(height: 8),
                    _SummaryRow(
                        icon: Icons.cancel,
                        color: Colors.red,
                        label: 'Skipped',
                        value: '$skipped stops'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Products delivered
            if (delivered > 0) ...[
              Text('Delivered', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              ...route.stops
                  .where((s) => s.isCompleted)
                  .map((stop) => _StopSummaryCard(stop: stop, delivered: true)),
              const SizedBox(height: 16),
            ],

            // Return to warehouse
            if (returnMap.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withAlpha(30),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.withAlpha(80)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warehouse, color: Colors.orange, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Return ${returnMap.length} product(s) to warehouse',
                        style: const TextStyle(
                            color: Colors.orange, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              ...returnMap.values.map((r) => Card(
                    margin: const EdgeInsets.only(bottom: 6),
                    child: ListTile(
                      dense: true,
                      leading:
                          const Icon(Icons.inventory_2_outlined, size: 20),
                      title: Text(r.productName),
                      trailing: Text(
                        '${r.qty.toStringAsFixed(2)} ${r.unit}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  )),
              const SizedBox(height: 16),
            ],

            if (returnMap.isEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green, size: 20),
                    SizedBox(width: 8),
                    Text('No items to return — full delivery!',
                        style: TextStyle(color: Colors.green)),
                  ],
                ),
              ),
          ],
        );
      }),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Obx(() {
            final route = _controller.route.value;
            return ElevatedButton(
              onPressed:
                  (_controller.isUpdating.value || route == null) ? null : () => _complete(route),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
                backgroundColor: primary,
              ),
              child: _controller.isUpdating.value
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child:
                          CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Confirm Return & Complete Route',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            );
          }),
        ),
      ),
    );
  }
}

class _ReturnItem {
  const _ReturnItem({
    required this.productId,
    required this.productName,
    required this.qty,
    required this.unit,
  });
  final String productId;
  final String productName;
  final double qty;
  final String unit;

  _ReturnItem copyWith({double? qty}) => _ReturnItem(
        productId: productId,
        productName: productName,
        qty: qty ?? this.qty,
        unit: unit,
      );
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 8),
        Text(label),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _StopSummaryCard extends StatelessWidget {
  const _StopSummaryCard({required this.stop, required this.delivered});
  final RouteStop stop;
  final bool delivered;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              stop.wellName ?? 'Stop #${stop.sequenceOrder}',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
            ...stop.items.map((item) {
              final qty = item.actualQtyDelivered ?? item.quantity;
              return Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    Expanded(
                        child: Text(item.productName ?? '',
                            style: const TextStyle(fontSize: 12))),
                    Text('${qty.toStringAsFixed(2)} ${item.unit}',
                        style:
                            const TextStyle(fontSize: 12, color: Colors.green)),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
