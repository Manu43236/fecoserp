import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../controllers/auth_controller.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class _UsPhoneFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue old, TextEditingValue next) {
    final digits = next.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 10) return old;
    final formatted = switch (digits.length) {
      0 => '',
      <= 3 => digits,
      <= 6 => '(${digits.substring(0, 3)}) ${digits.substring(3)}',
      _ => '(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}',
    };
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class AuthView extends StatefulWidget {
  const AuthView({super.key});

  @override
  State<AuthView> createState() => _AuthViewState();
}

class _AuthViewState extends State<AuthView> {
  final _mobileCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();

  @override
  void dispose() {
    _mobileCtrl.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AuthController>();
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primary, AppColors.dark],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // Brand section
              Expanded(
                flex: 5,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Image.asset(
                        'assets/images/fecos_logo.png',
                        width: 200,
                        fit: BoxFit.contain,
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'FIELD OPERATIONS',
                        style: TextStyle(
                          color: AppColors.accent,
                          fontSize: 12,
                          letterSpacing: 3.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Form card
              AnimatedPadding(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                padding: EdgeInsets.only(bottom: bottom),
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(28),
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(28, 32, 28, 40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Welcome back',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A0A08),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Sign in to continue',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textHint,
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Mobile number
                      const _FieldLabel('Mobile Number'),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          _PrefixBox('+1'),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _Field(
                              controller: _mobileCtrl,
                              hint: '(XXX) XXX-XXXX',
                              keyboardType: TextInputType.number,
                              inputFormatters: [_UsPhoneFormatter()],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // PIN
                      const _FieldLabel('PIN'),
                      const SizedBox(height: 6),
                      _Field(
                        controller: _pinCtrl,
                        hint: '• • • •',
                        keyboardType: TextInputType.number,
                        letterSpacing: 8,
                        fontSize: 18,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        onSubmitted: (_) => _submit(controller),
                      ),

                      // Error message
                      Obx(() {
                        final err = controller.errorMessage.value;
                        if (err == null) return const SizedBox(height: 16);
                        return Padding(
                          padding: const EdgeInsets.only(top: 10, bottom: 6),
                          child: Text(
                            err,
                            style: const TextStyle(
                              color: AppColors.danger,
                              fontSize: 13,
                            ),
                          ),
                        );
                      }),

                      const SizedBox(height: 8),

                      // Sign in button
                      Obx(() => SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              onPressed: controller.isLoading.value
                                  ? null
                                  : () => _submit(controller),
                              child: controller.isLoading.value
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text('Sign In'),
                            ),
                          )),

                      const SizedBox(height: 24),
                      const Center(
                        child: Text(
                          'Powered by M&M Technologies',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textHint,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submit(AuthController controller) {
    final rawDigits = _mobileCtrl.text.replaceAll(RegExp(r'\D'), '');
    controller.login(rawDigits, _pinCtrl.text.trim());
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: Color(0xFF4A3530),
      ),
    );
  }
}

class _PrefixBox extends StatelessWidget {
  const _PrefixBox(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F5F4),
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.primary,
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.hint,
    this.keyboardType = TextInputType.text,
    this.letterSpacing,
    this.fontSize,
    this.inputFormatters,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String hint;
  final TextInputType keyboardType;
  final double? letterSpacing;
  final double? fontSize;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      obscureText: false,
      style: TextStyle(
        letterSpacing: letterSpacing,
        fontSize: fontSize,
      ),
      onSubmitted: onSubmitted,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(
          letterSpacing: 0,
          fontSize: 14,
          color: AppColors.textHint,
        ),
      ),
    );
  }
}
