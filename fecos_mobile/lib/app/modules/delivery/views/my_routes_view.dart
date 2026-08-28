import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart';
import 'package:fecos_mobile/app/data/models/route_model.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';

class MyRoutesView extends StatefulWidget {
  const MyRoutesView({super.key});

  @override
  State<MyRoutesView> createState() => _MyRoutesViewState();
}

class _MyRoutesViewState extends State<MyRoutesView> {
  final _dio = Get.find<DioService>().dio;
  List<RouteModel> _routes = [];
  bool _loading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = false; });
    try {
      final driverId = Get.find<AuthController>().user.value?.id;
      final res = await _dio.get<Map<String, dynamic>>(
        '/routes',
        queryParameters: {
          'size': 50,
          if (driverId != null) 'driverId': driverId,
        },
      );
      final content = res.data!['data']['content'] as List;
      setState(() {
        _routes = content
            .map((e) => RouteModel.fromJson(e as Map<String, dynamic>))
            .toList();
      });
    } on DioException {
      setState(() => _error = true);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.dark,
          foregroundColor: Colors.white,
          title: const Text('My Routes',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: _load,
            ),
          ],
        ),
        body: _loading
            ? const FecosListShimmer(itemCount: 5, itemHeight: 96)
            : _error
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            size: 40, color: AppColors.textHint),
                        const SizedBox(height: 12),
                        const Text('Could not load routes'),
                        const SizedBox(height: 8),
                        TextButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _routes.isEmpty
                        ? const SingleChildScrollView(
                            physics: AlwaysScrollableScrollPhysics(),
                            child: SizedBox(
                              height: 300,
                              child: Center(
                                child: Text('No routes assigned',
                                    style: TextStyle(color: AppColors.textHint)),
                              ),
                            ),
                          )
                        : ListView.builder(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(16),
                            itemCount: _routes.length,
                            itemBuilder: (ctx, i) => _RouteListTile(route: _routes[i]),
                          ),
                  ),
      );
}

class _RouteListTile extends StatelessWidget {
  const _RouteListTile({required this.route});
  final RouteModel route;

  Color get _color => switch (route.status) {
        'IN_PROGRESS' => AppColors.warning,
        'DISPATCHED'  => AppColors.info,
        'COMPLETED'   => AppColors.success,
        'CANCELLED'   => AppColors.danger,
        _             => AppColors.textHint,
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
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => Get.toNamed(
          Routes.deliveryDetail.replaceFirst(':id', route.id),
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: _color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.local_shipping_rounded, size: 20, color: _color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      route.truckNumber ?? 'Route',
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${route.routeDate} · ${route.completedStops}/${route.stopCount} stops',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_statusLabel,
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _color)),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right_rounded,
                  size: 18, color: AppColors.textHint),
            ],
          ),
        ),
      );
}
