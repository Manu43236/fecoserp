import 'dart:convert';

import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/storage_service.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/modules/home/controllers/home_controller.dart';
import 'package:fecos_mobile/app/widgets/fecos_snackbar.dart';

class MyVisitStop {
  final String id;
  final String wellId;
  final String wellName;
  final String leaseName;
  final String clientName;
  final int sequence;
  final String status;
  final bool hasSoar;
  final bool soarAcknowledged;
  final bool hasReport;

  const MyVisitStop({
    required this.id,
    required this.wellId,
    required this.wellName,
    required this.leaseName,
    required this.clientName,
    required this.sequence,
    required this.status,
    required this.hasSoar,
    required this.soarAcknowledged,
    required this.hasReport,
  });

  factory MyVisitStop.fromJson(Map<String, dynamic> j) => MyVisitStop(
        id: j['id'],
        wellId: j['wellId'],
        wellName: j['wellName'],
        leaseName: j['leaseName'],
        clientName: j['clientName'] ?? '',
        sequence: j['sequence'],
        status: j['status'],
        hasSoar: j['hasSoar'] ?? false,
        soarAcknowledged: j['soarAcknowledged'] ?? false,
        hasReport: j['hasReport'] ?? false,
      );
}

class MyVisit {
  final String id;
  final String? name;
  final String visitDate;
  final String status;
  final List<MyVisitStop> stops;

  const MyVisit({
    required this.id,
    this.name,
    required this.visitDate,
    required this.status,
    required this.stops,
  });

  factory MyVisit.fromJson(Map<String, dynamic> j) => MyVisit(
        id: j['id'],
        name: j['name'] as String?,
        visitDate: j['visitDate'],
        status: j['status'],
        stops: (j['stops'] as List)
            .map((s) => MyVisitStop.fromJson(s as Map<String, dynamic>))
            .toList(),
      );
}

class ServiceVisitController extends GetxController {
  final _dio          = Get.find<DioService>().dio;
  final _connectivity = Get.find<ConnectivityService>();
  final _dbService    = Get.find<DbService>();

  AppDatabase get _db => _dbService.db;

  // ── Today tab ─────────────────────────────────────────────────────────
  final state           = Rx<AsyncState<List<MyVisit>>>(const AsyncLoading());
  final selectedDate    = Rx<DateTime>(DateTime.now());
  final queuedVisitIds  = <String>{}.obs;

  String get _cacheKey => 'my-visits-${_fmt(selectedDate.value)}';

  // ── Upcoming tab ──────────────────────────────────────────────────────
  final upcomingState   = Rx<AsyncState<List<MyVisit>>>(const AsyncLoading());
  final upcomingHasNext = false.obs;
  bool _upcomingLoading = false;
  int  _upcomingPage    = 0;

  // ── History tab ───────────────────────────────────────────────────────
  final historyState    = Rx<AsyncState<List<MyVisit>>>(const AsyncLoading());
  final historyHasNext  = false.obs;
  bool _historyLoading  = false;
  int  _historyPage     = 0;

  final historySearch   = ''.obs;
  final historyDateChip = 'This Week'.obs;
  final historyStatus   = Rx<String?>(null);

  @override
  void onInit() {
    super.onInit();
    loadVisits();
    ever(_connectivity.isOnline, (online) { if (online) loadVisits(); });
  }

  Future<void> loadVisits({DateTime? date}) async {
    final token = await Get.find<StorageService>().getToken();
    if (token == null) return;
    if (date != null) selectedDate.value = date;
    state.value = const AsyncLoading();

    if (_connectivity.isOnline.value) {
      try {
        final res = await _dio.get(
          '/my-visits',
          queryParameters: {'date': _fmt(selectedDate.value)},
        );
        final serverRaw =
            (res.data['data'] as List).cast<Map<String, dynamic>>();
        final raw = await _dbService.mergeQueuedState(serverRaw);
        await _dbService.cacheResponse(_cacheKey, jsonEncode(raw));
        queuedVisitIds.clear();
        state.value = AsyncSuccess(raw.map(MyVisit.fromJson).toList());
      } on Exception {
        await _loadFromCache();
      }
    } else {
      await _loadFromCache();
    }
  }

  Future<void> loadUpcoming({bool reset = false}) async {
    if (_upcomingLoading) return;
    if (reset) {
      _upcomingPage = 0;
      upcomingState.value = const AsyncLoading();
    }
    _upcomingLoading = true;
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/my-visits/upcoming',
        queryParameters: {'page': _upcomingPage, 'size': 20},
      );
      final d = res.data!['data'] as Map<String, dynamic>;
      final items = (d['content'] as List)
          .map((v) => MyVisit.fromJson(v as Map<String, dynamic>))
          .toList();
      upcomingHasNext.value = d['hasNext'] as bool;
      if (_upcomingPage == 0) {
        upcomingState.value = AsyncSuccess(items);
      } else {
        final prev = (upcomingState.value as AsyncSuccess<List<MyVisit>>).data;
        upcomingState.value = AsyncSuccess([...prev, ...items]);
      }
      _upcomingPage++;
    } on Exception {
      if (upcomingState.value is AsyncLoading) {
        upcomingState.value = const AsyncError('Failed to load upcoming visits');
      }
    } finally {
      _upcomingLoading = false;
    }
  }

  Future<void> loadHistory({bool reset = false}) async {
    if (_historyLoading) return;
    if (reset) {
      _historyPage = 0;
      historyState.value = const AsyncLoading();
    }
    _historyLoading = true;

    final now = DateTime.now();
    final params = <String, dynamic>{
      'page': _historyPage,
      'size': 20,
      'to': _fmt(now),
    };
    if (historySearch.value.isNotEmpty) params['search'] = historySearch.value;
    if (historyStatus.value != null) params['status'] = historyStatus.value;
    switch (historyDateChip.value) {
      case 'This Week':
        params['from'] = _fmt(now.subtract(const Duration(days: 7)));
      case 'This Month':
        params['from'] = _fmt(now.subtract(const Duration(days: 30)));
      case '3 Months':
        params['from'] = _fmt(now.subtract(const Duration(days: 90)));
      case 'All':
        params['from'] = '2000-01-01';
    }

    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/my-visits/history',
        queryParameters: params,
      );
      final d = res.data!['data'] as Map<String, dynamic>;
      final items = (d['content'] as List)
          .map((v) => MyVisit.fromJson(v as Map<String, dynamic>))
          .toList();
      historyHasNext.value = d['hasNext'] as bool;
      if (_historyPage == 0) {
        historyState.value = AsyncSuccess(items);
      } else {
        final prev = (historyState.value as AsyncSuccess<List<MyVisit>>).data;
        historyState.value = AsyncSuccess([...prev, ...items]);
      }
      _historyPage++;
    } on Exception {
      if (historyState.value is AsyncLoading) {
        historyState.value = const AsyncError('Failed to load visit history');
      }
    } finally {
      _historyLoading = false;
    }
  }

  Future<void> _loadFromCache() async {
    final cached = await _dbService.getCachedResponse(_cacheKey);
    if (cached != null) {
      final raw = (jsonDecode(cached) as List).cast<Map<String, dynamic>>();
      state.value = AsyncSuccess(raw.map(MyVisit.fromJson).toList());
    } else {
      state.value = const AsyncError(
        'No data available offline. Connect to load your schedule.',
      );
    }
  }

  Future<MyVisit?> startVisit(String visitId) async {
    if (!_connectivity.isOnline.value) {
      await _db.into(_db.syncQueue).insert(SyncQueueCompanion.insert(
        entityType: 'start-visit',
        entityId:   visitId,
        operation:  'UPDATE',
        payload:    jsonEncode({'visitId': visitId}),
      ));
      Get.find<SyncService>().pendingCount.value++;
      queuedVisitIds.add(visitId);
      FecosSnackbar.info('Saved Offline', 'Visit will sync when connected');
      return _patchVisitInCache(visitId, 'IN_PROGRESS');
    }

    try {
      await _dio.patch(
        '/service-visits/$visitId',
        data: {'status': 'IN_PROGRESS'},
      );
      await loadVisits();
      final s = state.value;
      if (s is AsyncSuccess<List<MyVisit>>) {
        return s.data.firstWhereOrNull((v) => v.id == visitId);
      }
      return null;
    } on Exception {
      FecosSnackbar.error('Error', 'Failed to start visit');
      return null;
    }
  }

  Future<MyVisit?> completeVisit(String visitId) async {
    if (!_connectivity.isOnline.value) {
      await _db.into(_db.syncQueue).insert(SyncQueueCompanion.insert(
        entityType: 'complete-visit',
        entityId:   visitId,
        operation:  'UPDATE',
        payload:    jsonEncode({'visitId': visitId}),
      ));
      Get.find<SyncService>().pendingCount.value++;
      FecosSnackbar.info('Saved Offline', 'Completion will sync when connected');
      return _patchVisitInCache(visitId, 'COMPLETED');
    }

    try {
      await _dio.patch(
        '/service-visits/$visitId',
        data: {'status': 'COMPLETED'},
      );
      await loadVisits();
      final s = state.value;
      if (s is AsyncSuccess<List<MyVisit>>) {
        return s.data.firstWhereOrNull((v) => v.id == visitId);
      }
      return null;
    } on Exception {
      FecosSnackbar.error('Error', 'Failed to complete visit');
      return null;
    }
  }

  // Updates the cached visit status and refreshes state — returns the updated visit
  Future<MyVisit?> _patchVisitInCache(
      String visitId, String newStatus) async {
    final cached = await _dbService.getCachedResponse(_cacheKey);
    if (cached == null) return null;
    final raw = (jsonDecode(cached) as List).cast<Map<String, dynamic>>();
    final idx = raw.indexWhere((v) => v['id'] == visitId);
    if (idx == -1) return null;
    raw[idx] = {...raw[idx], 'status': newStatus};
    await _dbService.cacheResponse(_cacheKey, jsonEncode(raw));
    state.value = AsyncSuccess(raw.map(MyVisit.fromJson).toList());
    if (Get.isRegistered<HomeController>()) {
      Get.find<HomeController>().patchVisitStatus(visitId, newStatus);
    }
    return MyVisit.fromJson(raw[idx]);
  }

  // Called by WellStopController after an offline submit to keep the cache consistent
  Future<void> markStopReported(String visitId, String stopId) async {
    final cached = await _dbService.getCachedResponse(_cacheKey);
    if (cached == null) return;
    final raw = (jsonDecode(cached) as List).cast<Map<String, dynamic>>();
    final visitIdx = raw.indexWhere((v) => v['id'] == visitId);
    if (visitIdx == -1) return;
    final stops =
        (raw[visitIdx]['stops'] as List).cast<Map<String, dynamic>>();
    final stopIdx = stops.indexWhere((s) => s['id'] == stopId);
    if (stopIdx == -1) return;
    stops[stopIdx] = {...stops[stopIdx], 'hasReport': true};
    raw[visitIdx] = {...raw[visitIdx], 'stops': stops};
    await _dbService.cacheResponse(_cacheKey, jsonEncode(raw));
    state.value = AsyncSuccess(raw.map(MyVisit.fromJson).toList());
    if (Get.isRegistered<HomeController>()) {
      await Get.find<HomeController>().markStopReported(visitId, stopId);
    }
  }

  String _fmt(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  bool get isToday {
    final now = DateTime.now();
    final d = selectedDate.value;
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }
}
