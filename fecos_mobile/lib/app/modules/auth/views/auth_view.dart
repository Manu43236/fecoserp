import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../controllers/auth_controller.dart';

class AuthView extends GetView<AuthController> {
  const AuthView({super.key});

  @override
  Widget build(BuildContext context) {
    final mobileCtrl = TextEditingController();
    final pinCtrl = TextEditingController();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Image.asset(
                'assets/images/fecos_logo.png',
                height: 56,
                fit: BoxFit.contain,
                alignment: Alignment.centerLeft,
              ),
              const SizedBox(height: 8),
              const Text(
                'Field Operations',
                style: TextStyle(fontSize: 14, color: Color(0xFF6B4A44)),
              ),
              const SizedBox(height: 48),

              // Mobile number with +1 prefix
              const Text('Mobile Number',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFD1C5C0)),
                      borderRadius: BorderRadius.circular(8),
                      color: const Color(0xFFF5F0EE),
                    ),
                    child: const Text('+1',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF751903))),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: mobileCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      decoration: const InputDecoration(
                        hintText: '10-digit number',
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // PIN — visible (type text)
              const Text('PIN',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(
                controller: pinCtrl,
                keyboardType: TextInputType.number,
                obscureText: false,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
                style: const TextStyle(letterSpacing: 8, fontSize: 18),
                decoration: const InputDecoration(hintText: 'Enter PIN'),
              ),

              // Error
              Obx(() {
                final err = controller.errorMessage.value;
                if (err == null) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(err,
                      style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
                );
              }),

              const SizedBox(height: 24),
              Obx(() => SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: controller.isLoading.value
                          ? null
                          : () => controller.login(
                              mobileCtrl.text.trim(), pinCtrl.text.trim()),
                      child: controller.isLoading.value
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Sign In'),
                    ),
                  )),
              const Spacer(flex: 2),
            ],
          ),
        ),
      ),
    );
  }
}
