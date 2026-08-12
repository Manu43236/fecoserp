import 'package:flutter/material.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = _resolve(status.toUpperCase());
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  static (String, Color) _resolve(String status) => switch (status) {
        'COMPLETED' || 'DELIVERED' || 'PASS' => ('Completed', AppColors.success),
        'IN_PROGRESS' || 'ACTIVE' => ('In Progress', AppColors.info),
        'PENDING' || 'SCHEDULED' => ('Pending', AppColors.warning),
        'FAILED' || 'FAIL' || 'CRITICAL' => ('Failed', AppColors.danger),
        'SYNCED' => ('Synced', AppColors.success),
        'PENDING_SYNC' => ('Pending Sync', AppColors.warning),
        _ => (status, AppColors.textSecondary),
      };
}
