import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';
import 'stop_detail_view.dart';
import 'completed_stop_view.dart';
import '../controllers/delivery_controller.dart';

class DeliveryView extends GetView<DeliveryController> {
  const DeliveryView({super.key});

  void _openStartRouteSheet(RouteModel route) {
    Get.bottomSheet<void>(
      _StartRouteSheet(route: route, controller: controller),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.dark,
          foregroundColor: Colors.white,
          title: const Text('Delivery Route',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
        ),
        body: Obx(() {
          if (controller.isLoading.value) return const _LoadingSkeleton();
          if (controller.hasError.value) {
            return _ErrorState(onRetry: controller.load);
          }
          final r = controller.route.value!;
          return RefreshIndicator(
            onRefresh: controller.load,
            child: _RouteBody(route: r, controller: controller),
          );
        }),
        bottomNavigationBar: Obx(() {
          final r = controller.route.value;
          if (r == null || controller.isLoading.value) return const SizedBox.shrink();

          // All stops done but route still IN_PROGRESS → complete route
          if (r.status == 'IN_PROGRESS' && r.stops.isNotEmpty &&
              r.stops.every((s) => !s.isPending)) {
            return _StickyButton(
              label: 'Complete Route',
              icon: Icons.flag_rounded,
              color: AppColors.success,
              isLoading: controller.isUpdating.value,
              onPressed: () => Get.toNamed('/wrap-up',
                  parameters: {'id': controller.routeId}),
            );
          }

          if (r.status != 'DISPATCHED') return const SizedBox.shrink();

          return _StickyButton(
            label: 'Start Route',
            icon: Icons.play_arrow_rounded,
            color: AppColors.primary,
            isLoading: controller.isUpdating.value,
            onPressed: () => _openStartRouteSheet(r),
          );
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
                  onDeliver: () => _openStopDetail(context, route.stops[i]),
                  onSkip: () => _showSkipSheet(context, route.stops[i].id),
                  onViewCompleted: () => Get.to<void>(
                    () => CompletedStopView(stop: route.stops[i]),
                  ),
                ),
                childCount: route.stops.length,
              ),
            ),
          ),
        ],
      );

  Future<void> _openStopDetail(BuildContext context, RouteStop stop) async {
    final result = await Get.to<bool>(
      () => const StopDetailView(),
      arguments: {'stop': stop, 'controller': controller},
    );
    if (result == true && Get.find<ConnectivityService>().isOnline.value) {
      controller.load();
    }
  }

  void _showSkipSheet(BuildContext context, String stopId) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _SkipSheet(
        stopId: stopId,
        controller: controller,
      ),
    );
  }
}

// ── Skip reason bottom sheet ──────────────────────────────────────────────────

class _SkipSheet extends StatefulWidget {
  const _SkipSheet({required this.stopId, required this.controller});
  final String stopId;
  final DeliveryController controller;

  @override
  State<_SkipSheet> createState() => _SkipSheetState();
}

class _SkipSheetState extends State<_SkipSheet> {
  String? _reason;

  static const _reasons = [
    ('GATE_LOCKED', 'Gate locked / no access'),
    ('ROAD_BLOCKED', 'Road blocked'),
    ('CUSTOMER_REFUSED', 'Customer refused delivery'),
    ('TANK_FULL', 'Tank already full'),
    ('OTHER', 'Other'),
  ];

  Future<void> _submit() async {
    if (_reason == null) return;
    Navigator.of(context).pop();
    await widget.controller.skipStop(widget.stopId, _reason!);
    final r = widget.controller.route.value;
    if (r != null && r.stops.every((s) => !s.isPending)) {
      Get.toNamed('/wrap-up', parameters: {'id': widget.controller.routeId});
    }
  }

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(top: 80),
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
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const Text('Why can\'t you deliver?',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 16),
                ..._reasons.map(
                  (r) => InkWell(
                    onTap: () => setState(() => _reason = r.$1),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: _reason == r.$1
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: 2,
                              ),
                            ),
                            child: _reason == r.$1
                                ? Center(
                                    child: Container(
                                      width: 10,
                                      height: 10,
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Text(r.$2,
                              style: const TextStyle(
                                  fontSize: 14, color: AppColors.textPrimary)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _reason != null ? _submit : null,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.danger,
                    disabledBackgroundColor: AppColors.border,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Skip Stop',
                      style:
                          TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
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
              Text(
                '${route.completedStops}/${route.stopCount} stops delivered',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: route.stopCount > 0
                      ? route.completedStops / route.stopCount
                      : 0,
                  backgroundColor: AppColors.border,
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(AppColors.success),
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
    required this.onViewCompleted,
  });

  final RouteStop stop;
  final int index;
  final bool isActive;
  final bool isUpdating;
  final VoidCallback onDeliver;
  final VoidCallback onSkip;
  final VoidCallback onViewCompleted;

  Color get _statusColor => switch (stop.status) {
        'COMPLETED' => AppColors.success,
        'SKIPPED'   => AppColors.danger,
        _           => AppColors.textHint,
      };

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: stop.isCompleted ? onViewCompleted : null,
        child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: stop.isCompleted
                ? AppColors.success.withValues(alpha: 0.3)
                : stop.isSkipped
                    ? AppColors.danger.withValues(alpha: 0.2)
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
                        ? const Icon(Icons.check_rounded,
                            size: 14, color: AppColors.success)
                        : stop.isSkipped
                            ? const Icon(Icons.close_rounded,
                                size: 14, color: AppColors.danger)
                            : Text('${index + 1}',
                                style: const TextStyle(
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
                          Text(stop.leaseName!,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary)),
                        if (stop.isSkipped && stop.skipReason != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(_skipLabel(stop.skipReason!),
                                style: const TextStyle(
                                    fontSize: 11, color: AppColors.danger)),
                          ),
                      ],
                    ),
                  ),
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
                                // Show actual vs planned if delivered
                                if (stop.isCompleted &&
                                    item.actualQtyDelivered != null)
                                  Text(
                                    '${_fmtQty(item.actualQtyDelivered!)} ${item.unit}',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.success),
                                  )
                                else
                                  Text(
                                    '${_fmtQty(item.quantity)} ${item.unit}',
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

            // "View Details" hint for completed stops
            if (stop.isCompleted) ...[
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 8, 14, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Icon(Icons.photo_rounded,
                        size: 13, color: AppColors.success),
                    const SizedBox(width: 4),
                    Text('View delivery details',
                        style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.success,
                            fontWeight: FontWeight.w600)),
                    const SizedBox(width: 2),
                    const Icon(Icons.chevron_right_rounded,
                        size: 14, color: AppColors.success),
                  ],
                ),
              ),
            ],

            // Actions — pending stops on active route only
            if (stop.isPending && isActive) ...[
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                child: Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: isUpdating ? null : onDeliver,
                        icon: const Icon(Icons.check_circle_outline_rounded,
                            size: 16),
                        label: const Text('Deliver'),
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
                      icon: const Icon(Icons.block_rounded, size: 16),
                      label: const Text('Can\'t Deliver'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger,
                        side: const BorderSide(color: AppColors.danger),
                        textStyle: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600),
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 12),
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
      ),
      );

  String _fmtQty(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toStringAsFixed(1);

  String _skipLabel(String reason) => switch (reason) {
        'GATE_LOCKED'       => 'Gate locked / no access',
        'ROAD_BLOCKED'      => 'Road blocked',
        'CUSTOMER_REFUSED'  => 'Customer refused',
        'TANK_FULL'         => 'Tank already full',
        _                   => 'Skipped',
      };
}

// ── Sticky action button ──────────────────────────────────────────────────────

class _StickyButton extends StatelessWidget {
  const _StickyButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.isLoading,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool isLoading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: FilledButton.icon(
            onPressed: isLoading ? null : onPressed,
            icon: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : Icon(icon, size: 20),
            label: Text(label,
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            style: FilledButton.styleFrom(
              backgroundColor: color,
              disabledBackgroundColor: AppColors.border,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      );
}

// ── Start Route bottom sheet ──────────────────────────────────────────────────

class _StartRouteSheet extends StatefulWidget {
  const _StartRouteSheet({required this.route, required this.controller});
  final RouteModel route;
  final DeliveryController controller;

  @override
  State<_StartRouteSheet> createState() => _StartRouteSheetState();
}

class _StartRouteSheetState extends State<_StartRouteSheet> {
  static const _checkItems = [
    'Tires & lights',
    'Brakes',
    'No visible leaks',
    'Fire extinguisher',
    'Hazmat placards',
  ];

  final _passed = List<bool>.filled(5, true);
  final _notesController = TextEditingController();
  late final Map<String, TextEditingController> _qtyControllers;

  @override
  void initState() {
    super.initState();
    _qtyControllers = {
      for (final stop in widget.route.stops)
        for (final item in stop.items)
          item.id: TextEditingController(text: _fmt(item.quantity)),
    };
  }

  @override
  void dispose() {
    _notesController.dispose();
    for (final c in _qtyControllers.values) c.dispose();
    super.dispose();
  }

  bool get _hasAnyFail => _passed.contains(false);

  String _fmt(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toString();

  void _allGood() {
    setState(() {
      for (var i = 0; i < _passed.length; i++) _passed[i] = true;
    });
  }

  void _allPlanned() {
    for (final stop in widget.route.stops) {
      for (final item in stop.items) {
        _qtyControllers[item.id]?.text = _fmt(item.quantity);
      }
    }
    setState(() {});
  }

  Future<void> _submit() async {
    final loadedQtyMap = <String, double>{
      for (final e in _qtyControllers.entries)
        e.key: double.tryParse(e.value.text) ?? 0.0,
    };
    final ok = await widget.controller.startRoute(
      hasIssues: _hasAnyFail,
      preTripNotes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
      loadedQtyMap: loadedQtyMap,
    );
    if (!ok) return;
    Get.back();
    FecosSnackbar.success(
      'Route Started',
      'Pre-trip done · Chemicals loaded · Trip started',
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      margin: const EdgeInsets.only(top: 60),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Title row
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Row(
              children: [
                const Text('Start Route',
                    style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                const Spacer(),
                TextButton(
                  onPressed: () { _allGood(); _allPlanned(); },
                  child: const Text('All Good'),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          // Scrollable body
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 16, 20, bottomPad + 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pre-trip section
                  const Text('Pre-Trip Check',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textSecondary)),
                  const SizedBox(height: 10),
                  ..._checkItems.asMap().entries.map((e) => _ToggleRow(
                        label: e.value,
                        passed: _passed[e.key],
                        onTap: () =>
                            setState(() => _passed[e.key] = !_passed[e.key]),
                      )),
                  if (_hasAnyFail) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _notesController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Issue notes',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  // Load section
                  Row(
                    children: [
                      const Text('Verify Load',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textSecondary)),
                      const Spacer(),
                      TextButton(
                        onPressed: _allPlanned,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('All Planned',
                            style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ...widget.route.stops.asMap().entries.map((e) =>
                      _SheetStopLoad(
                        stop: e.value,
                        index: e.key,
                        controllers: _qtyControllers,
                      )),
                ],
              ),
            ),
          ),
          // Submit button
          SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, bottomPad > 0 ? 8 : 16),
              child: Obx(() => FilledButton.icon(
                    onPressed:
                        widget.controller.isUpdating.value ? null : _submit,
                    icon: widget.controller.isUpdating.value
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.play_arrow_rounded, size: 20),
                    label: const Text('Start Route',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    style: FilledButton.styleFrom(
                      backgroundColor: _hasAnyFail
                          ? AppColors.warning
                          : AppColors.success,
                      disabledBackgroundColor: AppColors.border,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                  )),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Pre-trip toggle row ───────────────────────────────────────────────────────

class _ToggleRow extends StatelessWidget {
  const _ToggleRow(
      {required this.label, required this.passed, required this.onTap});
  final String label;
  final bool passed;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          children: [
            Expanded(
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 14, color: AppColors.textPrimary)),
            ),
            GestureDetector(
              onTap: onTap,
              child: Container(
                width: 56,
                height: 28,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: passed ? AppColors.success : AppColors.danger,
                ),
                alignment:
                    passed ? Alignment.centerRight : Alignment.centerLeft,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                      color: Colors.white, shape: BoxShape.circle),
                ),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 32,
              child: Text(
                passed ? 'Pass' : 'FAIL',
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: passed ? AppColors.success : AppColors.danger),
              ),
            ),
          ],
        ),
      );
}

// ── Stop load section (inside sheet) ─────────────────────────────────────────

class _SheetStopLoad extends StatelessWidget {
  const _SheetStopLoad(
      {required this.stop, required this.index, required this.controllers});
  final RouteStop stop;
  final int index;
  final Map<String, TextEditingController> controllers;

  String _fmt(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toString();

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
              child: Row(
                children: [
                  Container(
                    width: 22,
                    height: 22,
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
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(stop.wellName ?? 'Well',
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary)),
                  ),
                ],
              ),
            ),
            if (stop.items.isNotEmpty) ...[
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
                child: Column(
                  children: stop.items
                      .map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(item.productName ?? 'Product',
                                          style: const TextStyle(
                                              fontSize: 13,
                                              color: AppColors.textPrimary)),
                                      Text(
                                          'Planned: ${_fmt(item.quantity)} ${item.unit}',
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.textSecondary)),
                                    ],
                                  ),
                                ),
                                SizedBox(
                                  width: 100,
                                  child: TextField(
                                    controller: controllers[item.id],
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                            decimal: true),
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                    decoration: InputDecoration(
                                      suffixText: item.unit,
                                      suffixStyle: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textSecondary),
                                      filled: true,
                                      fillColor: AppColors.surface,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: const BorderSide(
                                            color: AppColors.border),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: const BorderSide(
                                            color: AppColors.border),
                                      ),
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 6),
                                      isDense: true,
                                    ),
                                  ),
                                ),
                              ],
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded,
                  size: 48, color: AppColors.textHint),
              const SizedBox(height: 16),
              const Text('No offline data available',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary)),
              const SizedBox(height: 6),
              const Text(
                'Connect to internet — route details will be available offline automatically.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.textHint),
              ),
              const SizedBox(height: 16),
              TextButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      );
}
