import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import '../controllers/service_visit_controller.dart';

const _months = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

String _monthName(int m) => _months[m];

String _formatDate(String date) {
  final d = DateTime.tryParse(date);
  if (d == null) return date;
  return '${_days[d.weekday - 1]}, ${_months[d.month]} ${d.day}';
}

String _fmtLabel(DateTime d) => '${_monthName(d.month)} ${d.day}, ${d.year}';

bool _isMissed(MyVisit v) {
  if (v.status != 'SCHEDULED' && v.status != 'IN_PROGRESS') return false;
  final d = DateTime.tryParse(v.visitDate);
  if (d == null) return false;
  final today = DateTime.now();
  return d.isBefore(DateTime(today.year, today.month, today.day));
}

// ── Root view ─────────────────────────────────────────────────────────────────

class ServiceVisitView extends GetView<ServiceVisitController> {
  const ServiceVisitView({super.key});

  @override
  Widget build(BuildContext context) {
    final argVisit =
        Get.arguments is MyVisit ? Get.arguments as MyVisit : null;
    if (argVisit != null) return _VisitDetailView(visit: argVisit);
    return const _MyVisitsScaffold();
  }
}

// ── 3-tab scaffold ────────────────────────────────────────────────────────────

class _MyVisitsScaffold extends StatefulWidget {
  const _MyVisitsScaffold();

  @override
  State<_MyVisitsScaffold> createState() => _MyVisitsScaffoldState();
}

class _MyVisitsScaffoldState extends State<_MyVisitsScaffold>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  late final ServiceVisitController _ctrl;
  final _tabIndex = 0.obs;

  @override
  void initState() {
    super.initState();
    _ctrl = Get.find<ServiceVisitController>();
    _tabs = TabController(length: 3, vsync: this);
    _tabs.addListener(_onTabChanged);
  }

  void _onTabChanged() {
    if (_tabs.indexIsChanging) return;
    _tabIndex.value = _tabs.index;
    if (_tabs.index == 1) _ctrl.loadUpcoming(reset: true);
    if (_tabs.index == 2) _ctrl.loadHistory(reset: true);
  }

  @override
  void dispose() {
    _tabs.removeListener(_onTabChanged);
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: Obx(() {
          if (_tabIndex.value != 0) return const Text('My Visits');
          final d = _ctrl.selectedDate.value;
          final label = _ctrl.isToday ? 'Today' : _fmtLabel(d);
          return Text('My Visits — $label');
        }),
        bottom: TabBar(
          controller: _tabs,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Today'),
            Tab(text: 'Upcoming'),
            Tab(text: 'History'),
          ],
        ),
        actions: [
          // Date picker only meaningful on Today tab
          IconButton(
            icon: const Icon(Icons.calendar_today_outlined),
            tooltip: 'Pick date',
            onPressed: () async {
              if (_tabIndex.value != 0) return;
              final now = DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: _ctrl.selectedDate.value,
                firstDate: DateTime(now.year - 1),
                lastDate: now,
              );
              if (picked != null) _ctrl.loadVisits(date: picked);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              switch (_tabIndex.value) {
                case 0: _ctrl.loadVisits();
                case 1: _ctrl.loadUpcoming(reset: true);
                case 2: _ctrl.loadHistory(reset: true);
              }
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _TodayTab(ctrl: _ctrl),
          _UpcomingTab(ctrl: _ctrl),
          _HistoryTab(ctrl: _ctrl),
        ],
      ),
    );
  }
}

// ── Today tab ─────────────────────────────────────────────────────────────────

class _TodayTab extends StatelessWidget {
  const _TodayTab({required this.ctrl});
  final ServiceVisitController ctrl;

  @override
  Widget build(BuildContext context) {
    return Obx(() => switch (ctrl.state.value) {
          AsyncLoading() =>
            const FecosListShimmer(itemCount: 4, itemHeight: 88),
          AsyncError(:final message) => _ErrorBody(
              message: message,
              onRetry: ctrl.loadVisits,
            ),
          AsyncSuccess(:final data) when data.isEmpty => _EmptyBody(
              label: Obx(() {
                final label = ctrl.isToday
                    ? 'today'
                    : _fmtLabel(ctrl.selectedDate.value);
                return Text(
                  'No visits scheduled for $label',
                  style: TextStyle(color: Colors.grey[600], fontSize: 16),
                );
              }),
            ),
          AsyncSuccess(:final data) => RefreshIndicator(
              onRefresh: ctrl.loadVisits,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: data.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _VisitCard(
                  visit: data[i],
                  isQueued: ctrl.queuedVisitIds.contains(data[i].id),
                ),
              ),
            ),
          _ => const SizedBox(),
        });
  }
}

// ── Upcoming tab ──────────────────────────────────────────────────────────────

class _UpcomingTab extends StatefulWidget {
  const _UpcomingTab({required this.ctrl});
  final ServiceVisitController ctrl;

  @override
  State<_UpcomingTab> createState() => _UpcomingTabState();
}

class _UpcomingTabState extends State<_UpcomingTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    widget.ctrl.loadUpcoming(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final ctrl = widget.ctrl;
    return Obx(() => switch (ctrl.upcomingState.value) {
          AsyncLoading() =>
            const FecosListShimmer(itemCount: 4, itemHeight: 88),
          AsyncError(:final message) => _ErrorBody(
              message: message,
              onRetry: () => ctrl.loadUpcoming(reset: true),
            ),
          AsyncSuccess(:final data) when data.isEmpty => const _EmptyBody(
              label: Text(
                'No upcoming visits scheduled',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            ),
          AsyncSuccess(:final data) => RefreshIndicator(
              onRefresh: () => ctrl.loadUpcoming(reset: true),
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                itemCount: data.length + (ctrl.upcomingHasNext.value ? 1 : 0),
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  if (i == data.length) {
                    return _LoadMoreButton(
                        onPressed: ctrl.loadUpcoming);
                  }
                  return _VisitCard(
                    visit: data[i],
                    isQueued: ctrl.queuedVisitIds.contains(data[i].id),
                  );
                },
              ),
            ),
          _ => const SizedBox(),
        });
  }
}

// ── History tab ───────────────────────────────────────────────────────────────

class _HistoryTab extends StatefulWidget {
  const _HistoryTab({required this.ctrl});
  final ServiceVisitController ctrl;

  @override
  State<_HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<_HistoryTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  late final TextEditingController _searchCtrl;
  Timer? _debounce;

  static const _dateChips = ['This Week', 'This Month', '3 Months', 'All'];
  static const _statusOptions = <String?, String>{
    null: 'All',
    'SCHEDULED': 'Scheduled',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  };

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController();
    widget.ctrl.loadHistory(reset: true);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String val) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      widget.ctrl.historySearch.value = val;
      widget.ctrl.loadHistory(reset: true);
    });
  }

  void _setDateChip(String chip) {
    widget.ctrl.historyDateChip.value = chip;
    widget.ctrl.loadHistory(reset: true);
  }

  void _setStatus(String? status) {
    widget.ctrl.historyStatus.value = status;
    widget.ctrl.loadHistory(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final ctrl = widget.ctrl;

    return Column(
      children: [
        // ── Filter section ───────────────────────────────────────────────
        Container(
          color: AppColors.surface,
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search bar
              TextField(
                controller: _searchCtrl,
                onChanged: _onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search by visit name…',
                  hintStyle: const TextStyle(
                      fontSize: 13, color: AppColors.textHint),
                  prefixIcon: const Icon(Icons.search,
                      color: AppColors.textHint, size: 20),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear,
                              size: 18, color: AppColors.textHint),
                          onPressed: () {
                            _searchCtrl.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  isDense: true,
                  contentPadding:
                      const EdgeInsets.symmetric(vertical: 10),
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
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                        color: AppColors.primary, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Date range chips
              Obx(() => SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _dateChips.map((chip) {
                        final selected =
                            ctrl.historyDateChip.value == chip;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(chip),
                            selected: selected,
                            onSelected: (_) => _setDateChip(chip),
                            selectedColor: AppColors.primary,
                            backgroundColor: AppColors.surfaceCard,
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: selected
                                  ? FontWeight.w700
                                  : FontWeight.normal,
                              color: selected
                                  ? Colors.white
                                  : AppColors.textSecondary,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: BorderSide(
                                color: selected
                                    ? AppColors.primary
                                    : AppColors.border,
                              ),
                            ),
                            showCheckmark: false,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 4),
                          ),
                        );
                      }).toList(),
                    ),
                  )),
              const SizedBox(height: 8),
              // Status chips
              Obx(() => SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children:
                          _statusOptions.entries.map((entry) {
                        final selected =
                            ctrl.historyStatus.value == entry.key;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(entry.value),
                            selected: selected,
                            onSelected: (_) => _setStatus(entry.key),
                            selectedColor: AppColors.primary,
                            backgroundColor: AppColors.surfaceCard,
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: selected
                                  ? FontWeight.w700
                                  : FontWeight.normal,
                              color: selected
                                  ? Colors.white
                                  : AppColors.textSecondary,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: BorderSide(
                                color: selected
                                    ? AppColors.primary
                                    : AppColors.border,
                              ),
                            ),
                            showCheckmark: false,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 4),
                          ),
                        );
                      }).toList(),
                    ),
                  )),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),
        // ── List ─────────────────────────────────────────────────────────
        Expanded(
          child: Obx(() => switch (ctrl.historyState.value) {
                AsyncLoading() =>
                  const FecosListShimmer(itemCount: 4, itemHeight: 88),
                AsyncError(:final message) => _ErrorBody(
                    message: message,
                    onRetry: () => ctrl.loadHistory(reset: true),
                  ),
                AsyncSuccess(:final data) when data.isEmpty =>
                  const _EmptyBody(
                    label: Text(
                      'No visits found for the selected filters',
                      style: TextStyle(
                          color: Colors.grey, fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                  ),
                AsyncSuccess(:final data) => RefreshIndicator(
                    onRefresh: () => ctrl.loadHistory(reset: true),
                    child: ListView.separated(
                      padding:
                          const EdgeInsets.fromLTRB(16, 16, 16, 24),
                      itemCount:
                          data.length + (ctrl.historyHasNext.value ? 1 : 0),
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        if (i == data.length) {
                          return _LoadMoreButton(
                              onPressed: ctrl.loadHistory);
                        }
                        return _VisitCard(
                          visit: data[i],
                          isQueued:
                              ctrl.queuedVisitIds.contains(data[i].id),
                          isMissed: _isMissed(data[i]),
                        );
                      },
                    ),
                  ),
                _ => const SizedBox(),
              }),
        ),
      ],
    );
  }
}

// ── Visit card (shared across all tabs) ──────────────────────────────────────

class _VisitCard extends StatelessWidget {
  const _VisitCard({
    required this.visit,
    required this.isQueued,
    this.isMissed = false,
  });
  final MyVisit visit;
  final bool isQueued;
  final bool isMissed;

  @override
  Widget build(BuildContext context) {
    final completed = visit.stops.where((s) => s.hasReport).length;
    final total = visit.stops.length;
    final hasSoar = visit.stops.any((s) => s.hasSoar && !s.soarAcknowledged);

    final clients = visit.stops.map((s) => s.clientName).toSet();
    final leases  = visit.stops.map((s) => s.leaseName).toSet();
    final clientLabel =
        clients.length == 1 ? clients.first : 'Multiple clients';
    final leaseLabel =
        leases.length == 1 ? leases.first : 'Multiple leases';
    final progress = total > 0 ? completed / total : 0.0;
    final visitName =
        visit.name?.isNotEmpty == true ? visit.name! : 'Service Visit';

    return Obx(() {
      final isOnline = Get.find<ConnectivityService>().isOnline.value;
      final isSyncing =
          isOnline && Get.find<SyncService>().syncingVisitIds.contains(visit.id);
      return Stack(
        children: [
          IgnorePointer(
            ignoring: isSyncing,
            child: _buildCard(context, visitName, completed, total, hasSoar,
                clientLabel, leaseLabel, progress),
          ),
          if (isSyncing)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary,
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Syncing...',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      );
    });
  }

  Widget _buildCard(
    BuildContext context,
    String visitName,
    int completed,
    int total,
    bool hasSoar,
    String clientLabel,
    String leaseLabel,
    double progress,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: isMissed
            ? Border(
                left: BorderSide(
                    color: AppColors.warning, width: 4))
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => _handleTap(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: name + badges + status chip
              Row(
                children: [
                  Expanded(
                    child: Text(
                      visitName,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary),
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (isMissed)
                    Container(
                      margin: const EdgeInsets.only(right: 6),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                            color:
                                AppColors.warning.withValues(alpha: 0.5)),
                      ),
                      child: const Text(
                        'Missed',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.warning),
                      ),
                    ),
                  if (isQueued)
                    Container(
                      margin: const EdgeInsets.only(right: 6),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                            color:
                                AppColors.warning.withValues(alpha: 0.4)),
                      ),
                      child: const Text(
                        'Queued',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.warning),
                      ),
                    ),
                  _StatusChip(status: visit.status),
                ],
              ),
              const SizedBox(height: 6),
              // Row 2: date
              Row(
                children: [
                  const Icon(Icons.calendar_today_rounded,
                      size: 13, color: AppColors.textHint),
                  const SizedBox(width: 5),
                  Text(
                    _formatDate(visit.visitDate),
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              // Row 3: client · lease
              if (visit.stops.isNotEmpty)
                Row(
                  children: [
                    const Icon(Icons.business_rounded,
                        size: 13, color: AppColors.textHint),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        '$clientLabel · $leaseLabel',
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              if (hasSoar) ...[
                const SizedBox(height: 6),
                _SoarBadge(),
              ],
              // Progress bar for IN_PROGRESS
              if (visit.status == 'IN_PROGRESS') ...[
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppColors.border,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                        AppColors.warning),
                    minHeight: 4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$completed of $total well${total == 1 ? '' : 's'} done',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary),
                ),
              ] else ...[
                const SizedBox(height: 6),
                Text(
                  '$total well${total == 1 ? '' : 's'} to service',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
              // Start button for SCHEDULED
              if (visit.status == 'SCHEDULED') ...[
                const SizedBox(height: 14),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _handleTap(context),
                    icon: const Icon(Icons.play_arrow_rounded, size: 18),
                    label: const Text('Start Visit'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding:
                          const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      textStyle: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  } // end _buildCard

  Future<void> _handleTap(BuildContext context) async {
    if (visit.status == 'SCHEDULED') {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => Dialog(
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.play_circle_rounded,
                      color: AppColors.primary, size: 32),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Start Visit',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  _formatDate(visit.visitDate),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 4),
                Text(
                  '${visit.stops.length} well${visit.stops.length == 1 ? '' : 's'} to service',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        style: OutlinedButton.styleFrom(
                          side:
                              const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          minimumSize: const Size(0, 44),
                        ),
                        child: const Text('Not yet',
                            style: TextStyle(
                                color: AppColors.textSecondary)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          minimumSize: const Size(0, 44),
                        ),
                        child: const Text('Start',
                            style: TextStyle(
                                fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
      if (confirm != true || !context.mounted) return;
      final ctrl = Get.find<ServiceVisitController>();
      final updated = await ctrl.startVisit(visit.id);
      if (updated == null || !context.mounted) return;
      _openWellsSheet(context, updated);
    } else {
      _openWellsSheet(context, visit);
    }
  }

  void _openWellsSheet(BuildContext context, MyVisit v) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _WellsBottomSheet(visit: v),
    );
  }
}

// ── Visit detail (stop list grouped by lease) ─────────────────────────────────

class _VisitDetailView extends StatefulWidget {
  const _VisitDetailView({required this.visit});
  final MyVisit visit;

  @override
  State<_VisitDetailView> createState() => _VisitDetailViewState();
}

class _VisitDetailViewState extends State<_VisitDetailView> {
  late MyVisit _visit;

  @override
  void initState() {
    super.initState();
    _visit = widget.visit;
  }

  Map<String, List<MyVisitStop>> get _grouped {
    final map = <String, List<MyVisitStop>>{};
    for (final s in _visit.stops) {
      (map[s.leaseName] ??= []).add(s);
    }
    return map;
  }

  void _onStopReturned(bool? submitted) {
    if (submitted != true) return;
    final ctrl = Get.find<ServiceVisitController>();
    ctrl.loadVisits().then((_) {
      final state = ctrl.state.value;
      if (state is AsyncSuccess<List<MyVisit>>) {
        final updated = state.data.firstWhereOrNull(
          (v) => v.id == _visit.id,
        );
        if (updated != null && mounted) {
          setState(() => _visit = updated);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final grouped = _grouped;
    final leases = grouped.keys.toList();
    final unreported = _visit.stops.where((s) => !s.hasReport).length;
    final allDone = unreported == 0 && _visit.stops.isNotEmpty;

    final nextStopId = _visit.stops
        .where((s) => !s.hasReport)
        .fold<MyVisitStop?>(
            null,
            (prev, s) =>
                prev == null || s.sequence < prev.sequence ? s : prev)
        ?.id;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(_formatDate(_visit.visitDate)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _StatusChip(status: _visit.status),
          ),
        ],
      ),
      body: ListView.builder(
        padding: EdgeInsets.fromLTRB(
            16, 16, 16, _visit.status == 'IN_PROGRESS' ? 88 : 16),
        itemCount: leases.length + (_visit.status == 'IN_PROGRESS' ? 1 : 0),
        itemBuilder: (_, i) {
          if (i == 0 && _visit.status == 'IN_PROGRESS') {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _StatusBanner(allDone: allDone, unreported: unreported),
            );
          }
          final leaseIndex = i - (_visit.status == 'IN_PROGRESS' ? 1 : 0);
          final lease = leases[leaseIndex];
          final stops = grouped[lease]!;
          final clientName = stops.first.clientName;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (leaseIndex > 0) const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.only(bottom: 8, left: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lease,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppColors.primary,
                        letterSpacing: 0.3,
                      ),
                    ),
                    if (clientName.isNotEmpty)
                      Text(
                        clientName,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 11),
                      ),
                  ],
                ),
              ),
              ...stops.map(
                (s) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _StopCard(
                    stop: s,
                    visitId: _visit.id,
                    isNext: s.id == nextStopId,
                    onReturned: _onStopReturned,
                  ),
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: _visit.status == 'IN_PROGRESS'
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: ElevatedButton(
                  onPressed: _completeVisit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Complete Visit',
                      style: TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15)),
                ),
              ),
            )
          : null,
    );
  }

  Future<void> _completeVisit() async {
    if (!mounted) return;
    final ctrl = Get.find<ServiceVisitController>();
    final updated = await ctrl.completeVisit(_visit.id);
    if (updated != null && mounted) setState(() => _visit = updated);
  }
}

// ── Wells bottom sheet ────────────────────────────────────────────────────────

class _WellsBottomSheet extends StatefulWidget {
  const _WellsBottomSheet({required this.visit});
  final MyVisit visit;

  @override
  State<_WellsBottomSheet> createState() => _WellsBottomSheetState();
}

class _WellsBottomSheetState extends State<_WellsBottomSheet> {
  late MyVisit _visit;

  @override
  void initState() {
    super.initState();
    _visit = widget.visit;
  }

  String? get _nextStopId => _visit.stops
      .where((s) => !s.hasReport)
      .fold<MyVisitStop?>(
          null,
          (prev, s) =>
              prev == null || s.sequence < prev.sequence ? s : prev)
      ?.id;

  void _onStopReturned(bool? submitted) {
    if (submitted != true) return;
    final ctrl = Get.find<ServiceVisitController>();
    ctrl.loadVisits().then((_) {
      final s = ctrl.state.value;
      if (s is AsyncSuccess<List<MyVisit>>) {
        final updated = s.data.firstWhereOrNull((v) => v.id == _visit.id);
        if (updated != null && mounted) setState(() => _visit = updated);
      }
    });
  }

  Future<void> _completeVisit() async {
    final ctrl = Get.find<ServiceVisitController>();
    final updated = await ctrl.completeVisit(_visit.id);
    if (updated != null && mounted) setState(() => _visit = updated);
  }

  @override
  Widget build(BuildContext context) {
    final stops = List<MyVisitStop>.from(_visit.stops)
      ..sort((a, b) => a.sequence.compareTo(b.sequence));
    final completed = stops.where((s) => s.hasReport).length;
    final total = stops.length;
    final allDone = completed == total && total > 0;
    final unreported = total - completed;
    final isInProgress = _visit.status == 'IN_PROGRESS';
    final nextId = _nextStopId;
    final visitName =
        _visit.name?.isNotEmpty == true ? _visit.name! : 'Service Visit';

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.35,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, scrollController) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          visitName,
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$total well${total == 1 ? '' : 's'} · $completed done',
                          style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  _StatusChip(status: _visit.status),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if (isInProgress)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child:
                    _StatusBanner(allDone: allDone, unreported: unreported),
              ),
            const Divider(height: 1, color: AppColors.border),
            Expanded(
              child: ListView.separated(
                controller: scrollController,
                padding: EdgeInsets.fromLTRB(
                    16, 12, 16, isInProgress ? 80 : 20),
                itemCount: stops.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (_, i) => _StopCard(
                  stop: stops[i],
                  visitId: _visit.id,
                  isNext: stops[i].id == nextId,
                  onReturned: _onStopReturned,
                ),
              ),
            ),
            if (isInProgress)
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: ElevatedButton(
                    onPressed: _completeVisit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Complete Visit',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 15)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Stop card ─────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  const _StopCard({
    required this.stop,
    required this.visitId,
    required this.isNext,
    required this.onReturned,
  });
  final MyVisitStop stop;
  final String visitId;
  final bool isNext;
  final ValueChanged<bool?> onReturned;

  @override
  Widget build(BuildContext context) {
    final hasPendingSoar = stop.hasSoar && !stop.soarAcknowledged;

    final accentColor = hasPendingSoar
        ? AppColors.danger
        : stop.hasReport
            ? AppColors.success
            : AppColors.primary;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasPendingSoar
              ? AppColors.danger.withValues(alpha: 0.4)
              : isNext
                  ? AppColors.primary.withValues(alpha: 0.4)
                  : AppColors.border,
          width: isNext ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: stop.hasReport
            ? () => Get.toNamed(
                  Routes.reportView
                      .replaceFirst(':visitId', visitId)
                      .replaceFirst(':stopId', stop.id),
                  arguments: stop,
                )
            : () async {
                final result = await Get.toNamed(
                  Routes.wellStop
                      .replaceFirst(':visitId', visitId)
                      .replaceFirst(':stopId', stop.id),
                  arguments: stop,
                );
                onReturned(result as bool?);
              },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${stop.sequence}',
                    style: TextStyle(
                      color: accentColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(stop.wellName,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  color: AppColors.textPrimary)),
                        ),
                        if (isNext) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Next',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (hasPendingSoar) _SoarBadge(),
                        if (stop.hasSoar && stop.soarAcknowledged)
                          _AckedBadge(),
                      ],
                    ),
                  ],
                ),
              ),
              if (stop.hasReport)
                const Icon(Icons.check_circle_rounded,
                    color: AppColors.success, size: 22)
              else
                Icon(Icons.radio_button_unchecked_rounded,
                    color: AppColors.textHint, size: 22),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded,
                  color: AppColors.textHint, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Shared small widgets ──────────────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'SCHEDULED'   => ('Scheduled', Colors.blue),
      'IN_PROGRESS' => ('In Progress', Colors.orange),
      'COMPLETED'   => ('Completed', Colors.green),
      'CANCELLED'   => ('Cancelled', Colors.grey),
      _             => (status, Colors.grey),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.allDone, required this.unreported});
  final bool allDone;
  final int unreported;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: allDone
            ? AppColors.success.withValues(alpha: 0.1)
            : AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: allDone
              ? AppColors.success.withValues(alpha: 0.35)
              : AppColors.warning.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Icon(
            allDone
                ? Icons.check_circle_rounded
                : Icons.info_outline_rounded,
            size: 18,
            color: allDone ? AppColors.success : AppColors.warning,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              allDone
                  ? 'All wells done — tap Complete Visit below'
                  : '$unreported well${unreported == 1 ? '' : 's'} still pending',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: allDone ? AppColors.success : AppColors.warning,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadMoreButton extends StatelessWidget {
  const _LoadMoreButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppColors.primary),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
          ),
          child: const Text('Load more',
              style: TextStyle(color: AppColors.primary)),
        ),
      ),
    );
  }
}

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

class _EmptyBody extends StatelessWidget {
  const _EmptyBody({required this.label});
  final Widget label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 12),
          label,
        ],
      ),
    );
  }
}

class _SoarBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.warning_amber_rounded,
              size: 11, color: Colors.red.shade700),
          const SizedBox(width: 3),
          Text('SOAR',
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.red.shade700)),
        ],
      ),
    );
  }
}

class _AckedBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.amber.shade300),
      ),
      child: Text('SOAR ✓',
          style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Colors.amber.shade800)),
    );
  }
}
