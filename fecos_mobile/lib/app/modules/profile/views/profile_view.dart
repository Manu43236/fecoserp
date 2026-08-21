import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_shimmer.dart';
import 'package:fecos_mobile/app/widgets/fecos_dialog.dart';
import '../controllers/profile_controller.dart';

class ProfileView extends GetView<ProfileController> {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final user = controller.auth.user.value;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: AppColors.dark,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar + name
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        user?.name.isNotEmpty == true
                            ? user!.name[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    user?.name ?? '—',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _roleLabel(user?.role.name),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Settings section — coming soon
            Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _SettingTile(
                    icon: Icons.lock_outline_rounded,
                    label: 'Change PIN',
                    comingSoon: true,
                    onTap: () => FecosDialog.info(
                      title: 'Coming Soon',
                      message:
                          'PIN change will be available in the next update.',
                    ),
                  ),
                  const Divider(height: 1, indent: 56),
                  _SettingTile(
                    icon: Icons.notifications_outlined,
                    label: 'Notifications',
                    comingSoon: true,
                    onTap: () => FecosDialog.info(
                      title: 'Coming Soon',
                      message:
                          'Notification settings are coming in a future update.',
                    ),
                  ),
                  const Divider(height: 1, indent: 56),
                  _SettingTile(
                    icon: Icons.info_outline_rounded,
                    label: 'App Version',
                    trailing: const Text(
                      'v1.0.0',
                      style: TextStyle(
                          fontSize: 13, color: AppColors.textHint),
                    ),
                    onTap: null,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Shimmer preview row
            const Row(
              children: [
                Expanded(child: FecosShimmerCard(height: 72, lineCount: 1)),
                SizedBox(width: 12),
                Expanded(child: FecosShimmerCard(height: 72, lineCount: 1)),
              ],
            ),

            const SizedBox(height: 28),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => FecosDialog.confirm(
                  title: 'Sign Out',
                  message: 'Are you sure you want to sign out?',
                  confirmLabel: 'Sign Out',
                  cancelLabel: 'Cancel',
                  isDanger: true,
                  icon: Icons.logout_rounded,
                ).then((confirmed) {
                  if (confirmed == true) controller.auth.logout();
                }),
                icon: const Icon(Icons.logout_rounded,
                    color: AppColors.danger, size: 18),
                label: const Text(
                  'Sign Out',
                  style: TextStyle(
                    color: AppColors.danger,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  side: const BorderSide(color: AppColors.danger),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _roleLabel(String? role) => switch (role) {
        'SERVICE_TECH' => 'Service Technician',
        'TRUCK_DRIVER' => 'Truck Driver',
        'ACCOUNT_REP' => 'Account Representative',
        _ => role ?? 'Field Staff',
      };
}

class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.label,
    this.onTap,
    this.comingSoon = false,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool comingSoon;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: AppColors.textSecondary),
        ),
        title: Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary,
          ),
        ),
        trailing: trailing ??
            (comingSoon
                ? Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Soon',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  )
                : null),
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      );
}
