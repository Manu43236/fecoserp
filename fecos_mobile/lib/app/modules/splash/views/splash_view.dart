import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _anim;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fade = CurvedAnimation(parent: _anim, curve: Curves.easeIn);
    _anim.forward();

    _navigate();
  }

  Future<void> _navigate() async {
    final auth = Get.find<AuthController>();
    // Wait at least 2 s AND for session restore to finish.
    await Future.wait([
      Future.delayed(const Duration(milliseconds: 2000)),
      auth.sessionRestored,
    ]);
    if (!mounted) return;
    Get.offAllNamed(auth.isLoggedIn ? Routes.home : Routes.login);
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      body: FadeTransition(
        opacity: _fade,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/fecos_logo.png',
                width: 200,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 16),
              const Text(
                'FIELD OPERATIONS',
                style: TextStyle(
                  color: AppColors.accent,
                  fontSize: 12,
                  letterSpacing: 3.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 64),
              SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.accent.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
