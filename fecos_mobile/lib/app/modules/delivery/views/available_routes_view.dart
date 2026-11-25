import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';

/// "Available to pick up" — unassigned routes a driver can claim.
/// Drivers find a route by the client/lease they're headed to (local search),
/// then claim it. Claiming is online-only so two drivers can't grab the same one.
class AvailableRoutesView extends StatefulWidget {
  const AvailableRoutesView({super.key, this.onClaimed});

  /// Called after a successful claim so the parent can refresh "My Routes".
  final VoidCallback? onClaimed;

  @override
  State<AvailableRoutesView> createState() => _AvailableRoutesViewState();
}

class _AvailableRoutesViewState extends State<AvailableRoutesView> {
  final _dio = Get.find<DioService>().dio;
  List<RouteModel> _routes = [];
  bool _loading = true;
  bool _error = false;
  String _query = '';
  bool _claiming = false;
  // Cascading filters (by name, derived from the loaded available routes).
  String? _client;
  String? _lease;
  String? _well;

  int get _activeFilterCount =>
      [_client, _lease, _well].where((e) => e != null).length;

  // Distinct options pulled from the available routes' stops, scoped by selection.
  List<String> get _clientOptions => _routes
      .expand((r) => r.stops)
      .map((s) => s.clientName)
      .whereType<String>()
      .toSet()
      .toList()
    ..sort();

  List<String> _leaseOptions(String? client) => _routes
      .expand((r) => r.stops)
      .where((s) => client == null || s.clientName == client)
      .map((s) => s.leaseName)
      .whereType<String>()
      .toSet()
      .toList()
    ..sort();

  List<String> _wellOptions(String? lease) => _routes
      .expand((r) => r.stops)
      .where((s) => lease == null || s.leaseName == lease)
      .map((s) => s.wellName)
      .whereType<String>()
      .toSet()
      .toList()
    ..sort();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = false; });
    try {
      final res = await _dio.get<Map<String, dynamic>>('/routes/available');
      final data = res.data!['data'] as List;
      setState(() {
        _routes = data
            .map((e) => RouteModel.fromJson(e as Map<String, dynamic>))
            .toList();
      });
    } on DioException {
      setState(() => _error = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Combine the text search with the Client → Lease → Well filters.
  List<RouteModel> get _filtered {
    final q = _query.trim().toLowerCase();
    final noFilter = _client == null && _lease == null && _well == null;
    return _routes.where((r) {
      final matchesText = q.isEmpty ||
          r.stops.any((s) =>
              (s.clientName ?? '').toLowerCase().contains(q) ||
              (s.leaseName ?? '').toLowerCase().contains(q) ||
              (s.wellName ?? '').toLowerCase().contains(q));
      final matchesFilter = noFilter ||
          r.stops.any((s) =>
              (_client == null || s.clientName == _client) &&
              (_lease == null || s.leaseName == _lease) &&
              (_well == null || s.wellName == _well));
      return matchesText && matchesFilter;
    }).toList();
  }

  void _clearFilters() => setState(() {
        _client = null;
        _lease = null;
        _well = null;
      });

  Future<void> _pick(String title, List<String> options, String? current,
      ValueChanged<String?> onPick) async {
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SearchPickerSheet(title: title, options: options, current: current),
    );
    if (result == null) return; // dismissed
    onPick(result.isEmpty ? null : result); // '' = Any
  }

  bool _isOverdue(String routeDate) {
    final d = DateTime.tryParse(routeDate);
    if (d == null) return false;
    final today = DateTime.now();
    return d.isBefore(DateTime(today.year, today.month, today.day));
  }

  Future<void> _claim(RouteModel route) async {
    if (!Get.find<ConnectivityService>().isOnline.value) {
      FecosSnackbar.info('Offline', 'Connect to the internet to pick up a route.');
      return;
    }
    final ok = await Get.dialog<bool>(AlertDialog(
      title: const Text('Pick up this route?'),
      content: const Text('It will be assigned to you.'),
      actions: [
        TextButton(onPressed: () => Get.back<bool>(result: false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Get.back<bool>(result: true), child: const Text('Pick up')),
      ],
    ));
    if (ok != true) return;

    setState(() => _claiming = true);
    try {
      await _dio.post<Map<String, dynamic>>('/routes/${route.id}/claim');
      if (!mounted) return;
      Get.back<void>(); // close preview sheet
      FecosSnackbar.success('Route is yours', 'Added to My Routes.');
      widget.onClaimed?.call();
      await _load();
      Get.toNamed(Routes.deliveryDetail.replaceFirst(':id', route.id));
    } on DioException catch (e) {
      final msg = (e.response?.data?['message'] ?? e.response?.data?['error']) as String? ??
          (e.response?.statusCode == 409
              ? 'This route was just picked up by another driver.'
              : 'Could not pick up the route.');
      if (mounted) {
        Get.back<void>(); // close preview sheet
        FecosSnackbar.error('Not available', msg);
        await _load(); // refresh — it's gone or taken
      }
    } finally {
      if (mounted) setState(() => _claiming = false);
    }
  }

  void _preview(RouteModel route) {
    Get.bottomSheet<void>(
      _PreviewSheet(
        route: route,
        isClaiming: _claiming,
        onClaim: () => _claim(route),
      ),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      endDrawer: _FilterDrawer(
        client: _client,
        lease: _lease,
        well: _well,
        activeCount: _activeFilterCount,
        onPickClient: () => _pick('Client', _clientOptions, _client, (v) {
          setState(() { _client = v; _lease = null; _well = null; });
        }),
        onPickLease: () => _pick('Lease', _leaseOptions(_client), _lease, (v) {
          setState(() { _lease = v; _well = null; });
        }),
        onPickWell: () => _pick('Well', _wellOptions(_lease), _well, (v) {
          setState(() => _well = v);
        }),
        onClear: _clearFilters,
      ),
      body: Builder(builder: (ctx) {
        if (_loading) return const FecosListShimmer(itemCount: 4, itemHeight: 96);
        if (_error) {
          return _CenterMessage(
            icon: Icons.error_outline_rounded,
            text: 'Could not load available routes',
            onRetry: _load,
          );
        }
        return RefreshIndicator(
          onRefresh: _load,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        onChanged: (v) => setState(() => _query = v),
                        decoration: InputDecoration(
                          hintText: 'Search by client, lease, or well…',
                          prefixIcon: const Icon(Icons.search_rounded, size: 20),
                          isDense: true,
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
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _FilterButton(
                      count: _activeFilterCount,
                      onTap: () => Scaffold.of(ctx).openEndDrawer(),
                    ),
                  ],
                ),
              ),
              Expanded(
            child: _filtered.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 120),
                      _CenterMessage(
                        icon: Icons.inbox_rounded,
                        text: 'No routes available to pick up',
                      ),
                    ],
                  )
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    itemCount: _filtered.length,
                    itemBuilder: (ctx, i) {
                      final r = _filtered[i];
                      return _AvailableCard(
                        route: r,
                        overdue: _isOverdue(r.routeDate),
                        onTap: () => _preview(r),
                      );
                    },
                  ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

// ── Available route card ─────────────────────────────────────────────────────
class _AvailableCard extends StatelessWidget {
  const _AvailableCard({required this.route, required this.overdue, required this.onTap});
  final RouteModel route;
  final bool overdue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.warehouse_rounded, size: 16, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      route.warehouseName ?? 'No warehouse set',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: route.warehouseName != null
                            ? AppColors.textPrimary
                            : AppColors.danger,
                      ),
                    ),
                  ),
                  if (overdue)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.danger.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('Overdue',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.danger)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${route.routeDate} · ${route.stopCount} stop${route.stopCount == 1 ? '' : 's'}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              if (route.stops.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  route.stops
                      .map((s) => s.clientName ?? s.leaseName ?? s.wellName ?? '')
                      .where((s) => s.isNotEmpty)
                      .toSet()
                      .take(3)
                      .join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppColors.textHint),
                ),
              ],
            ],
          ),
        ),
      );
}

// ── Preview + claim bottom sheet ─────────────────────────────────────────────
class _PreviewSheet extends StatelessWidget {
  const _PreviewSheet({required this.route, required this.isClaiming, required this.onClaim});
  final RouteModel route;
  final bool isClaiming;
  final VoidCallback onClaim;

  @override
  Widget build(BuildContext context) {
    final online = Get.find<ConnectivityService>().isOnline.value;
    return Container(
      margin: const EdgeInsets.only(top: 60),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
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
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Row(
              children: [
                const Icon(Icons.warehouse_rounded, size: 18, color: AppColors.primary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Load from: ${route.warehouseName ?? 'No warehouse set'}',
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
              children: [
                Text('${route.routeDate} · ${route.stopCount} stops',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                const SizedBox(height: 10),
                ...route.stops.map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.wellName ?? 'Well',
                              style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary)),
                          if (s.clientName != null || s.leaseName != null)
                            Text(
                                [s.clientName, s.leaseName]
                                    .where((e) => e != null)
                                    .join(' · '),
                                style: const TextStyle(
                                    fontSize: 12, color: AppColors.textSecondary)),
                          ...s.items.map((it) => Padding(
                                padding: const EdgeInsets.only(top: 2, left: 2),
                                child: Text(
                                  '• ${it.productName ?? 'Product'} — ${_fmt(it.quantity)} ${it.unit}',
                                  style: const TextStyle(
                                      fontSize: 12, color: AppColors.textHint),
                                ),
                              )),
                        ],
                      ),
                    )),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!online)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 8),
                      child: Text('Connect to the internet to pick up a route.',
                          style: TextStyle(fontSize: 12, color: AppColors.danger)),
                    ),
                  FilledButton.icon(
                    onPressed: (online && !isClaiming) ? onClaim : null,
                    icon: const Icon(Icons.pan_tool_alt_rounded, size: 20),
                    label: const Text('Pick up this route',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      disabledBackgroundColor: AppColors.border,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmt(double qty) => qty % 1 == 0 ? qty.toInt().toString() : qty.toString();
}

// ── Shared small widgets ─────────────────────────────────────────────────────
class _CenterMessage extends StatelessWidget {
  const _CenterMessage({required this.icon, required this.text, this.onRetry});
  final IconData icon;
  final String text;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: AppColors.textHint),
            const SizedBox(height: 12),
            Text(text, style: const TextStyle(color: AppColors.textHint)),
            if (onRetry != null) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ],
        ),
      );
}

// ── Filter button (with active-count badge) ──────────────────────────────────
class _FilterButton extends StatelessWidget {
  const _FilterButton({required this.count, required this.onTap});
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final active = count > 0;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 42,
        width: 46,
        decoration: BoxDecoration(
          color: active
              ? AppColors.primary.withValues(alpha: 0.12)
              : AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(10),
          border:
              Border.all(color: active ? AppColors.primary : AppColors.border),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(Icons.tune_rounded,
                size: 20,
                color: active ? AppColors.primary : AppColors.textSecondary),
            if (active)
              Positioned(
                top: 6,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
                  decoration: const BoxDecoration(
                      color: AppColors.primary, shape: BoxShape.circle),
                  child: Text('$count',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: Colors.white)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Right-side filter drawer (Client → Lease → Well) ─────────────────────────
class _FilterDrawer extends StatelessWidget {
  const _FilterDrawer({
    required this.client,
    required this.lease,
    required this.well,
    required this.activeCount,
    required this.onPickClient,
    required this.onPickLease,
    required this.onPickWell,
    required this.onClear,
  });

  final String? client;
  final String? lease;
  final String? well;
  final int activeCount;
  final VoidCallback onPickClient;
  final VoidCallback onPickLease;
  final VoidCallback onPickWell;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) => Drawer(
        backgroundColor: AppColors.surface,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text('Filter routes',
                          style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary)),
                    ),
                    IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.of(context).pop()),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppColors.border),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                  children: [
                    _FilterField(
                        label: 'CLIENT',
                        value: client,
                        placeholder: 'Any client',
                        enabled: true,
                        onTap: onPickClient),
                    const SizedBox(height: 16),
                    _FilterField(
                        label: 'LEASE',
                        value: lease,
                        placeholder: client == null
                            ? 'Pick a client first'
                            : 'Any lease',
                        enabled: client != null,
                        onTap: onPickLease),
                    const SizedBox(height: 16),
                    _FilterField(
                        label: 'WELL',
                        value: well,
                        placeholder:
                            lease == null ? 'Pick a lease first' : 'Any well',
                        enabled: lease != null,
                        onTap: onPickWell),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: activeCount > 0 ? onClear : null,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          side: const BorderSide(color: AppColors.border),
                          foregroundColor: AppColors.textSecondary,
                        ),
                        child: const Text('Clear'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          minimumSize: const Size.fromHeight(48),
                        ),
                        child: const Text('Apply'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}

class _FilterField extends StatelessWidget {
  const _FilterField({
    required this.label,
    required this.value,
    required this.placeholder,
    required this.enabled,
    required this.onTap,
  });
  final String label;
  final String? value;
  final String placeholder;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                  color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          InkWell(
            onTap: enabled ? onTap : null,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              height: 46,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: enabled ? AppColors.surfaceCard : AppColors.border.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(value ?? placeholder,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontSize: 14,
                            color: value != null
                                ? AppColors.textPrimary
                                : AppColors.textHint)),
                  ),
                  Icon(Icons.expand_more_rounded,
                      size: 20,
                      color: enabled ? AppColors.textSecondary : AppColors.textHint),
                ],
              ),
            ),
          ),
        ],
      );
}

// ── Searchable picker sheet ──────────────────────────────────────────────────
class _SearchPickerSheet extends StatefulWidget {
  const _SearchPickerSheet(
      {required this.title, required this.options, required this.current});
  final String title;
  final List<String> options;
  final String? current;

  @override
  State<_SearchPickerSheet> createState() => _SearchPickerSheetState();
}

class _SearchPickerSheetState extends State<_SearchPickerSheet> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final filtered = _q.isEmpty
        ? widget.options
        : widget.options
            .where((o) => o.toLowerCase().contains(_q.toLowerCase()))
            .toList();
    return Container(
      margin: const EdgeInsets.only(top: 80),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: TextField(
              autofocus: true,
              onChanged: (v) => setState(() => _q = v),
              decoration: InputDecoration(
                hintText: 'Search ${widget.title.toLowerCase()}…',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                isDense: true,
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
              ),
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                ListTile(
                  title: Text('Any ${widget.title.toLowerCase()}',
                      style: const TextStyle(
                          fontSize: 14, color: AppColors.textSecondary)),
                  trailing: widget.current == null
                      ? const Icon(Icons.check_rounded,
                          size: 18, color: AppColors.primary)
                      : null,
                  onTap: () => Navigator.of(context).pop(''),
                ),
                ...filtered.map((o) => ListTile(
                      title: Text(o,
                          style: const TextStyle(
                              fontSize: 14, color: AppColors.textPrimary)),
                      trailing: o == widget.current
                          ? const Icon(Icons.check_rounded,
                              size: 18, color: AppColors.primary)
                          : null,
                      onTap: () => Navigator.of(context).pop(o),
                    )),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
