import 'package:flutter/material.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class CompletedStopView extends StatelessWidget {
  const CompletedStopView({super.key, required this.stop});
  final RouteStop stop;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.dark,
        foregroundColor: Colors.white,
        title: Text(
          'Stop ${stop.sequenceOrder} — ${stop.wellName ?? 'Well'}',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // Delivery photo
          if (stop.deliveryPhotoUrl != null) ...[
            _SectionHeader(title: 'Delivery Photo'),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                stop.deliveryPhotoUrl!,
                height: 220,
                width: double.infinity,
                fit: BoxFit.cover,
                loadingBuilder: (_, child, progress) => progress == null
                    ? child
                    : Container(
                        height: 220,
                        color: AppColors.border.withValues(alpha: 0.3),
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                errorBuilder: (context2, e, stack) => Container(
                  height: 220,
                  decoration: BoxDecoration(
                    color: AppColors.border.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.broken_image_rounded,
                            size: 36, color: AppColors.textHint),
                        SizedBox(height: 6),
                        Text('Photo unavailable',
                            style: TextStyle(
                                fontSize: 12, color: AppColors.textHint)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Delivery info
          _InfoCard(children: [
            _InfoRow(
              icon: Icons.schedule_rounded,
              color: AppColors.primary,
              label: 'Delivered at',
              value: _formatTimestamp(stop.deliveredAt),
            ),
            if (stop.deliveryLat != null && stop.deliveryLng != null) ...[
              const SizedBox(height: 10),
              _InfoRow(
                icon: Icons.gps_fixed_rounded,
                color: AppColors.success,
                label: 'Location',
                value:
                    '${stop.deliveryLat!.toStringAsFixed(5)}, ${stop.deliveryLng!.toStringAsFixed(5)}',
              ),
            ],
          ]),
          const SizedBox(height: 16),

          // Products delivered
          _SectionHeader(title: 'Products Delivered'),
          const SizedBox(height: 8),
          ...stop.items.map((item) => _ProductRow(item: item)),

          // Notes
          if (stop.notes != null && stop.notes!.isNotEmpty) ...[
            const SizedBox(height: 16),
            _SectionHeader(title: 'Notes'),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                stop.notes!,
                style: const TextStyle(
                    fontSize: 14, color: AppColors.textPrimary, height: 1.5),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatTimestamp(String? iso) {
    if (iso == null) return '—';
    try {
      final dt = DateTime.parse(iso);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final m = dt.minute.toString().padLeft(2, '0');
      final ampm = dt.hour < 12 ? 'AM' : 'PM';
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}  $h:$m $ampm';
    } catch (_) {
      return iso;
    }
  }
}

// ── Product row ───────────────────────────────────────────────────────────────

class _ProductRow extends StatelessWidget {
  const _ProductRow({required this.item});
  final RouteStopItem item;

  String _fmtQty(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toStringAsFixed(2);

  @override
  Widget build(BuildContext context) {
    final actual = item.actualQtyDelivered;
    final planned = item.quantity;
    final delivered = actual ?? planned;
    final isPartial = actual != null && actual < planned;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isPartial
              ? AppColors.warning.withValues(alpha: 0.4)
              : AppColors.success.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.inventory_2_outlined,
              size: 16,
              color: isPartial ? AppColors.warning : AppColors.success),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.productName ?? 'Product',
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
                Text('Planned: ${_fmtQty(planned)} ${item.unit}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${_fmtQty(delivered)} ${item.unit}',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isPartial ? AppColors.warning : AppColors.success),
              ),
              if (isPartial)
                Text('partial',
                    style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.warning,
                        fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) => Text(title,
      style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
          letterSpacing: 0.5));
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: children),
      );
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
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
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecondary)),
                const SizedBox(height: 2),
                Text(value,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      );
}
