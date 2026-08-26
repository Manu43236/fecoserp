import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/user_model.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/modules/main/controllers/main_controller.dart';
import 'package:fecos_mobile/app/modules/home/views/home_view.dart';
import 'package:fecos_mobile/app/modules/service_visit/views/service_visit_view.dart';
import 'package:fecos_mobile/app/modules/delivery/views/my_routes_view.dart';
import 'package:fecos_mobile/app/modules/profile/views/profile_view.dart';

class MainShell extends GetView<MainController> {
  const MainShell({super.key});

  bool get _isTruckDriver =>
      Get.find<AuthController>().user.value?.role == UserRole.truckDriver;

  List<Widget> get _tabs => _isTruckDriver
      ? const [HomeView(), MyRoutesView(), ProfileView()]
      : const [HomeView(), ServiceVisitView(), ProfileView()];

  List<BottomNavigationBarItem> get _items => _isTruckDriver
      ? const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_outlined),
            activeIcon: Icon(Icons.local_shipping_rounded),
            label: 'My Routes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ]
      : const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.science_outlined),
            activeIcon: Icon(Icons.science_rounded),
            label: 'My Visits',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ];

  @override
  Widget build(BuildContext context) => Obx(
        () => Scaffold(
          body: IndexedStack(
            index: controller.tabIndex.value,
            children: _tabs,
          ),
          bottomNavigationBar: _NavBar(
            currentIndex: controller.tabIndex.value,
            items: _items,
            onTap: controller.changeTab,
          ),
        ),
      );
}

class _NavBar extends StatelessWidget {
  const _NavBar({required this.currentIndex, required this.items, required this.onTap});

  final int currentIndex;
  final List<BottomNavigationBarItem> items;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: AppColors.border.withValues(alpha: 0.8),
              blurRadius: 16,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: onTap,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textHint,
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: items,
        ),
      );
}
