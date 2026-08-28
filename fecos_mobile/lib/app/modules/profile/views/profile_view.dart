import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
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

            // Settings section
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
                    onTap: () => _showChangePinSheet(context),
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

            const SizedBox(height: 28),

            // Sign Out
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

            const SizedBox(height: 12),

            // Delete Account
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {
                  final tenantName =
                      controller.auth.user.value?.tenantName ?? 'your organization\'s';
                  showDialog<void>(
                    context: context,
                    builder: (_) => AlertDialog(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                      title: const Row(
                        children: [
                          Icon(Icons.delete_outline_rounded,
                              color: AppColors.danger, size: 22),
                          SizedBox(width: 8),
                          Text('Delete Account',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.danger)),
                        ],
                      ),
                      content: Text(
                        'Your delete request to $tenantName admin has been '
                        'initiated. Your account will be processed within 24 hours.',
                        style: const TextStyle(
                            fontSize: 14, color: AppColors.textSecondary),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('OK',
                              style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  );
                },
                style: TextButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text(
                  'Delete Account',
                  style: TextStyle(
                    color: AppColors.danger,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showChangePinSheet(BuildContext context) {
    final currentPinCtrl = TextEditingController();
    final newPinCtrl = TextEditingController();
    final confirmPinCtrl = TextEditingController();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ChangePinSheet(
        controller: controller,
        currentPinCtrl: currentPinCtrl,
        newPinCtrl: newPinCtrl,
        confirmPinCtrl: confirmPinCtrl,
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

class _ChangePinSheet extends StatefulWidget {
  const _ChangePinSheet({
    required this.controller,
    required this.currentPinCtrl,
    required this.newPinCtrl,
    required this.confirmPinCtrl,
  });

  final ProfileController controller;
  final TextEditingController currentPinCtrl;
  final TextEditingController newPinCtrl;
  final TextEditingController confirmPinCtrl;

  @override
  State<_ChangePinSheet> createState() => _ChangePinSheetState();
}

class _ChangePinSheetState extends State<_ChangePinSheet> {
  String? _error;

  void _submit() {
    final current = widget.currentPinCtrl.text.trim();
    final newPin = widget.newPinCtrl.text.trim();
    final confirm = widget.confirmPinCtrl.text.trim();

    if (current.length != 4 || newPin.length != 4 || confirm.length != 4) {
      setState(() => _error = 'All PINs must be exactly 4 digits.');
      return;
    }
    if (newPin != confirm) {
      setState(() => _error = 'New PINs do not match.');
      return;
    }
    if (current == newPin) {
      setState(() => _error = 'New PIN must be different from current PIN.');
      return;
    }

    setState(() => _error = null);
    widget.controller.changePin(
      currentPin: current,
      newPin: newPin,
      onSuccess: () {
        Navigator.of(context).pop();
        Get.snackbar(
          'Success',
          'PIN changed successfully.',
          snackPosition: SnackPosition.TOP,
          backgroundColor: const Color(0xFF1C1C1E),
          colorText: const Color(0xFFFFFFFF),
          icon: const Icon(Icons.check_circle_outline,
              color: Color(0xFF30D158), size: 22),
          borderRadius: 12,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          duration: const Duration(seconds: 3),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + bottom),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Change PIN',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close_rounded,
                    size: 20, color: AppColors.textSecondary),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _PinField(
            controller: widget.currentPinCtrl,
            label: 'Current PIN',
          ),
          const SizedBox(height: 14),
          _PinField(
            controller: widget.newPinCtrl,
            label: 'New PIN',
          ),
          const SizedBox(height: 14),
          _PinField(
            controller: widget.confirmPinCtrl,
            label: 'Confirm New PIN',
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(
              _error!,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.danger),
            ),
          ],
          const SizedBox(height: 20),
          Obx(() => SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: widget.controller.isChangingPin.value
                      ? null
                      : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    disabledBackgroundColor:
                        AppColors.primary.withValues(alpha: 0.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: widget.controller.isChangingPin.value
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Update PIN',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                ),
              )),
        ],
      ),
    );
  }
}

class _PinField extends StatelessWidget {
  const _PinField({required this.controller, required this.label});

  final TextEditingController controller;
  final String label;

  @override
  Widget build(BuildContext context) => TextField(
        controller: controller,
        obscureText: true,
        keyboardType: TextInputType.number,
        maxLength: 4,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        decoration: InputDecoration(
          labelText: label,
          counterText: '',
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
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
      );
}

class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.label,
    this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
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
            (onTap != null
                ? const Icon(Icons.chevron_right_rounded,
                    size: 18, color: AppColors.textHint)
                : null),
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      );
}
