import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart' hide FormData, MultipartFile;
import 'package:image_picker/image_picker.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/modules/delivery/controllers/delivery_controller.dart';

class StopDetailView extends StatefulWidget {
  const StopDetailView({super.key});

  @override
  State<StopDetailView> createState() => _StopDetailViewState();
}

class _StopDetailViewState extends State<StopDetailView> {
  late final RouteStop _stop;
  late final DeliveryController _deliveryController;
  late final Map<String, TextEditingController> _qtyControllers;

  final _notesController = TextEditingController();
  final _picker = ImagePicker();
  final _dio = Get.find<DioService>().dio;

  File? _photo;
  Position? _position;
  bool _gettingLocation = true;
  bool _uploading = false;
  DateTime _deliveredAt = DateTime.now();

  @override
  void initState() {
    super.initState();
    final args = Get.arguments as Map<String, dynamic>;
    _stop = args['stop'] as RouteStop;
    _deliveryController = args['controller'] as DeliveryController;

    _qtyControllers = {
      for (final item in _stop.items)
        item.id: TextEditingController(
            text: _formatQty(item.quantity))
    };

    _captureLocation();
  }

  @override
  void dispose() {
    for (final c in _qtyControllers.values) {
      c.dispose();
    }
    _notesController.dispose();
    super.dispose();
  }

  String _formatQty(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toString();

  Future<void> _captureLocation() async {
    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (mounted) setState(() => _gettingLocation = false);
        return;
      }

      // Use last known position immediately so driver isn't blocked
      final last = await Geolocator.getLastKnownPosition();
      if (last != null && mounted) {
        setState(() {
          _position = last;
          _gettingLocation = false; // spinner stops — driver can act now
        });
      }

      // Refresh in background with satellite-only accuracy (no network needed)
      final fresh = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium, // satellite-only, no A-GPS needed
          timeLimit: Duration(seconds: 30),
        ),
      );
      if (mounted) setState(() => _position = fresh);
    } catch (_) {
      // GPS unavailable or timed out
    } finally {
      if (mounted) setState(() => _gettingLocation = false);
    }
  }

  Future<void> _pickDeliveryDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _deliveredAt,
      firstDate: DateTime.now().subtract(const Duration(days: 7)),
      lastDate: DateTime.now(),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_deliveredAt),
    );
    if (time == null || !mounted) return;
    setState(() {
      _deliveredAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  Future<void> _takePhoto() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 75,
      maxWidth: 1280,
    );
    if (xfile != null && mounted) setState(() => _photo = File(xfile.path));
  }

  Future<void> _submit() async {
    if (_photo == null || _position == null || _uploading) return;
    setState(() => _uploading = true);

    final actualQtyMap = <String, double>{
      for (final entry in _qtyControllers.entries)
        entry.key: double.tryParse(entry.value.text) ?? 0.0
    };
    final notes = _notesController.text.trim().isEmpty ? null : _notesController.text.trim();

    // Offline path — queue locally, skip photo upload until connectivity returns
    if (!Get.find<ConnectivityService>().isOnline.value) {
      await _deliveryController.queueDeliverStop(
        stopId:        _stop.id,
        localPhotoPath: _photo!.path,
        lat:           _position!.latitude,
        lng:           _position!.longitude,
        actualQtyMap:  actualQtyMap,
        notes:         notes,
        performedAt:   _deliveredAt,
      );
      if (mounted) {
        setState(() => _uploading = false);
        Get.back(result: true);
        final r = _deliveryController.route.value;
        if (r != null && r.stops.every((s) => !s.isPending)) {
          Get.toNamed('/wrap-up', parameters: {'id': _deliveryController.routeId});
        }
      }
      return;
    }

    // Online path — upload photo then deliver
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          _photo!.path,
          filename: 'delivery_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });
      final uploadRes = await _dio.post<Map<String, dynamic>>('/uploads/photo', data: formData);
      final photoUrl  = uploadRes.data!['data']['url'] as String;

      final iso     = _deliveredAt.toIso8601String().substring(0, 19);
      final success = await _deliveryController.deliverStop(
        _stop.id, photoUrl,
        _position!.latitude, _position!.longitude,
        actualQtyMap, notes,
        deliveredAt: iso,
      );

      if (mounted && success) {
        Get.back(result: true);
        final r = _deliveryController.route.value;
        if (r != null && r.stops.every((s) => !s.isPending)) {
          Get.toNamed('/wrap-up', parameters: {'id': _deliveryController.routeId});
        }
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['error'] ?? 'Upload failed';
      if (mounted) Get.snackbar('Error', msg, snackPosition: SnackPosition.BOTTOM);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  String _formatDeliveryDateTime(DateTime dt) {
    final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final m = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour < 12 ? 'AM' : 'PM';
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}  $h:$m $ampm';
  }

  bool get _canSubmit => _photo != null && _position != null && !_uploading && !_gettingLocation;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.dark,
        foregroundColor: Colors.white,
        title: Text(
          'Stop ${_stop.sequenceOrder} — ${_stop.wellName ?? 'Well'}',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // Stop info
          _SectionCard(
            children: [
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 16, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${_stop.leaseName ?? 'Lease'} · ${_stop.wellName ?? 'Well'}',
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Products / actual qty
          const _SectionHeader(title: 'Products Delivered'),
          const SizedBox(height: 8),
          ..._stop.items.map((item) => _QtyRow(
                item: item,
                controller: _qtyControllers[item.id]!,
              )),
          const SizedBox(height: 12),

          // GPS status
          _StatusRow(
            icon: Icons.gps_fixed_rounded,
            color: _position != null ? AppColors.success : AppColors.warning,
            label: _gettingLocation
                ? 'Capturing GPS…'
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

          // Delivery date/time
          GestureDetector(
            onTap: _uploading ? null : _pickDeliveryDateTime,
            child: _StatusRow(
              icon: Icons.schedule_rounded,
              color: AppColors.primary,
              label: _formatDeliveryDateTime(_deliveredAt),
              trailing: const Icon(Icons.edit_rounded,
                  size: 14, color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 10),

          // Photo
          const _SectionHeader(title: 'Delivery Photo (required)'),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _uploading ? null : _takePhoto,
            child: Container(
              height: 180,
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
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
                        const Text('Tap to take photo of filled tank',
                            style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 12),

          // Notes (optional)
          const _SectionHeader(title: 'Notes (optional)'),
          const SizedBox(height: 8),
          TextField(
            controller: _notesController,
            maxLines: 3,
            style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Any notes about this delivery…',
              hintStyle:
                  const TextStyle(fontSize: 13, color: AppColors.textHint),
              filled: true,
              fillColor: AppColors.surfaceCard,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: FilledButton.icon(
            onPressed: _canSubmit ? _submit : null,
            icon: _uploading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.check_circle_rounded, size: 20),
            label: Text(_uploading ? 'Uploading…' : 'Confirm Delivery',
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700)),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.success,
              disabledBackgroundColor: AppColors.border,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Qty row per product ───────────────────────────────────────────────────────

class _QtyRow extends StatelessWidget {
  const _QtyRow({required this.item, required this.controller});
  final RouteStopItem item;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.inventory_2_outlined,
                size: 16, color: AppColors.textHint),
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
                  Text('Planned: ${_formatQty(item.quantity)} ${item.unit}',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              width: 96,
              child: Column(
                children: [
                  TextField(
                    controller: controller,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary),
                    decoration: InputDecoration(
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
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(
                            color: AppColors.primary, width: 1.5),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 10),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.unit,
                    style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
      );

  String _formatQty(double qty) =>
      qty % 1 == 0 ? qty.toInt().toString() : qty.toString();
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

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.children});
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

class _StatusRow extends StatelessWidget {
  const _StatusRow(
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
            Icon(icon, size: 16, color: color),
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
