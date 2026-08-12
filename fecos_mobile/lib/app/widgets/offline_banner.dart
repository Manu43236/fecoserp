import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final connectivity = Get.find<ConnectivityService>();
    return Column(
      children: [
        Obx(() => connectivity.isOnline.value
            ? const SizedBox.shrink()
            : const _OfflineBar()),
        Expanded(child: child),
      ],
    );
  }
}

class _OfflineBar extends StatelessWidget {
  const _OfflineBar();

  @override
  Widget build(BuildContext context) => ColoredBox(
        color: AppColors.danger,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
          child: Row(
            children: const [
              Icon(Icons.wifi_off, color: Colors.white, size: 14),
              SizedBox(width: 8),
              Text(
                'Offline — changes will sync when connected',
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
        ),
      );
}

class SyncStatusBar extends StatelessWidget {
  const SyncStatusBar({super.key});

  @override
  Widget build(BuildContext context) {
    final sync = Get.find<SyncService>();
    return Obx(() {
      final pending = sync.pendingCount.value;
      final syncing = sync.isSyncing.value;
      if (pending == 0 && !syncing) return const SizedBox.shrink();
      return ColoredBox(
        color: AppColors.warning,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
          child: Row(
            children: [
              if (syncing)
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              else
                const Icon(Icons.sync, color: Colors.white, size: 14),
              const SizedBox(width: 8),
              Text(
                syncing
                    ? 'Syncing...'
                    : '$pending ${pending == 1 ? 'change' : 'changes'} pending sync',
                style:
                    const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    });
  }
}
