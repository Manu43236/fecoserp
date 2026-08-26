import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import '../controllers/delivery_controller.dart';

class DeliveryView extends GetView<DeliveryController> {
  const DeliveryView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.dark,
          foregroundColor: Colors.white,
          title: const Text('Delivery Route',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
          actions: [
            Obx(() {
              final r = controller.route.value;
              if (r == null || r.status != 'DISPATCHED') return const SizedBox.shrink();
              return TextButton(
                onPressed: controller.isUpdating.value
                    ? null
                    : () => controller.updateRouteStatus('IN_PROGRESS'),
                child: const Text('Start',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
              );
            }),
          ],
        ),
        body: Obx(() {
          if (controller.isLoading.value) return const _LoadingSkeleton();
          if (controller.hasError.value) {
            return _ErrorState(onRetry: controller.load);
          }
          final r = controller.route.value!;
          return _RouteBody(route: r, controller: controller);
        }),
      );
}

// ── Route body ────────────────────────────────────────────────────────────────

class _RouteBody extends StatelessWidget {
  const _RouteBody({required this.route, required this.controller});
  final RouteModel route;
  final DeliveryController controller;

  @override
  Widget build(BuildContext context) => CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _RouteHeader(route: route)),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) => _StopCard(
                  stop: route.stops[i],
                  index: i,
                  isActive: route.status == 'IN_PROGRESS',
                  isUpdating: controller.isUpdating.value,
                  onDeliver: () => _showProofSheet(context, route.stops[i].id),
                  onSkip: () => controller.skipStop(route.stops[i].id),
                ),
                childCount: route.stops.length,
              ),
            ),
          ),
        ],
      );

  void _showProofSheet(BuildContext context, String stopId) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProofSheet(
        stopId: stopId,
        controller: controller,
      ),
    );
  }
}

// ── Proof capture bottom sheet ────────────────────────────────────────────────

class _ProofSheet extends StatefulWidget {
  const _ProofSheet({required this.stopId, required this.controller});
  final String stopId;
  final DeliveryController controller;

  @override
  State<_ProofSheet> createState() => _ProofSheetState();
}

class _ProofSheetState extends State<_ProofSheet> {
  File? _photo;
  Position? _position;
  bool _gettingLocation = false;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _captureLocation();
  }

  Future<void> _captureLocation() async {
    setState(() => _gettingLocation = true);
    _position = await widget.controller.getLocation();
    if (mounted) setState(() => _gettingLocation = false);
  }

  Future<void> _takePhoto() async {
    final xfile = await widget.controller.takePhoto();
    if (xfile != null && mounted) {
      setState(() => _photo = File(xfile.path));
    }
  }

  Future<void> _confirm() async {
    if (_photo == null || _position == null) return;
    setState(() => _uploading = true);
    final success = await widget.controller.confirmDelivery(
        widget.stopId, _photo!, _position!);
    if (mounted) {
      setState(() => _uploading = false);
      if (success) Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final ready = _photo != null && _position != null && !_uploading;

    return Container(
      margin: const EdgeInsets.only(top: 60),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text(
                'Confirm Delivery',
                style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary),
              ),
              const SizedBox(height: 4),
              const Text(
                'Take a photo and confirm your location to complete this stop.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              // GPS row
              _InfoRow(
                icon: Icons.location_on_rounded,
                color: _position != null ? AppColors.success : AppColors.warning,
                label: _gettingLocation
                    ? 'Getting location…'
                    : _position != null
                        ? 'Location captured'
                        : 'Location unavailable',
                trailing: _gettingLocation
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : null,
              ),
              const SizedBox(height: 10),

              // Photo
              GestureDetector(
                onTap: _uploading ? null : _takePhoto,
                child: Container(
                  height: 160,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _photo != null
                          ? AppColors.success.withValues(alpha: 0.4)
                          : AppColors.border,
                    ),
                  ),
                  child: _photo != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(11),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.file(_photo!, fit: BoxFit.cover),
                              Positioned(
                                bottom: 8,
                                right: 8,
                                child: GestureDetector(
                                  onTap: _uploading ? null : _takePhoto,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black54,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text('Retake',
                                        style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt_rounded,
                                size: 36,
                                color: AppColors.primary.withValues(alpha: 0.7)),
                            const SizedBox(height: 8),
                            const Text('Tap to take delivery photo',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                    fontWeight: FontWeight.w500)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 20),

              // Confirm button
              FilledButton(
                onPressed: ready ? _confirm : null,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.success,
                  disabledBackgroundColor: AppColors.border,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _uploading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Confirm Delivery',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(
      {required this.icon,
      required this.color,
      required this.label,
      this.trailing});
  final IconData icon;
  final Color color;
  final String label;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 10),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: color)),
            ),
            ?trailing,
          ],
        ),
      );
}

// ── Route header ─────────────────────────────────────────────────────────────

class _RouteHeader extends StatelessWidget {
  const _RouteHeader({required this.route});
  final RouteModel route;

  Color get _statusColor => switch (route.status) {
        'COMPLETED'   => AppColors.success,
        'CANCELLED'   => AppColors.danger,
        'IN_PROGRESS' => AppColors.warning,
        _             => AppColors.info,
      };

  String get _statusLabel => switch (route.status) {
        'PLANNED'     => 'Planned',
        'DISPATCHED'  => 'Dispatched',
        'IN_PROGRESS' => 'In Progress',
        'COMPLETED'   => 'Completed',
        'CANCELLED'   => 'Cancelled',
        _             => route.status,
      };

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.all(16),
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
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.circle, size: 7, color: _statusColor),
                      const SizedBox(width: 5),
                      Text(_statusLabel,
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: _statusColor)),
                    ],
                  ),
                ),
                const Spacer(),
                Text(route.routeDate,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textSecondary)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.local_shipping_rounded,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(route.truckNumber ?? 'No truck assigned',
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ],
            ),
            const SizedBox(height: 10),
            if (route.stops.isNotEmpty) ...[
              Row(
                children: [
                  Text(
                    '${route.completedStops}/${route.stopCount} stops delivered',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: route.stopCount > 0
                      ? route.completedStops / route.stopCount
                      : 0,
                  backgroundColor: AppColors.border,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.success),
                  minHeight: 6,
                ),
              ),
            ],
          ],
        ),
      );
}

// ── Stop card ─────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  const _StopCard({
    required this.stop,
    required this.index,
    required this.isActive,
    required this.isUpdating,
    required this.onDeliver,
    required this.onSkip,
  });

  final RouteStop stop;
  final int index;
  final bool isActive;
  final bool isUpdating;
  final VoidCallback onDeliver;
  final VoidCallback onSkip;

  Color get _statusColor => switch (stop.status) {
        'COMPLETED' => AppColors.success,
        'SKIPPED'   => AppColors.danger,
        _           => AppColors.textHint,
      };

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: stop.isCompleted
                ? AppColors.success.withValues(alpha: 0.3)
                : AppColors.border,
          ),
        ),
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: _statusColor.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: stop.isCompleted
                        ? Icon(Icons.check_rounded,
                            size: 14, color: AppColors.success)
                        : stop.isSkipped
                            ? Icon(Icons.close_rounded,
                                size: 14, color: AppColors.danger)
                            : Text('${index + 1}',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textSecondary)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stop.wellName ?? 'Well',
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary),
                        ),
                        if (stop.leaseName != null)
                          Text(
                            stop.leaseName!,
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.textSecondary),
                          ),
                      ],
                    ),
                  ),
                  // Show camera icon badge if proof was captured
                  if (stop.isCompleted && stop.deliveryPhotoUrl != null)
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.camera_alt_rounded,
                          size: 14, color: AppColors.success),
                    ),
                ],
              ),
            ),

            // Items
            if (stop.items.isNotEmpty) ...[
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
                child: Column(
                  children: stop.items
                      .map((item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Row(
                              children: [
                                const Icon(Icons.inventory_2_outlined,
                                    size: 14, color: AppColors.textHint),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    item.productName ?? 'Product',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textPrimary),
                                  ),
                                ),
                                Text(
                                  '${item.quantity % 1 == 0 ? item.quantity.toInt() : item.quantity} ${item.unit}',
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimary),
                                ),
                              ],
                            ),
                          ))
                      .toList(),
                ),
              ),
            ],

            // Actions — only for pending stops on an active route
            if (stop.isPending && isActive) ...[
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                child: Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: isUpdating ? null : onDeliver,
                        icon: const Icon(Icons.camera_alt_rounded, size: 16),
                        label: const Text('Delivered'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.success,
                          foregroundColor: Colors.white,
                          textStyle: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: isUpdating ? null : onSkip,
                      icon: const Icon(Icons.skip_next_rounded, size: 16),
                      label: const Text('Skip'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textSecondary,
                        side: const BorderSide(color: AppColors.border),
                        textStyle: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600),
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: List.generate(
          3,
          (_) => Container(
            height: 120,
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: AppColors.border.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      );
}

// ── Error state ───────────────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded,
                size: 48, color: AppColors.textHint),
            const SizedBox(height: 16),
            const Text('Could not load route',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      );
}
