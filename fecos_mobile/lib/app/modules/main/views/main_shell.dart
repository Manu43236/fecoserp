import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/modules/main/controllers/main_controller.dart';
import 'package:fecos_mobile/app/modules/home/views/home_view.dart';
import 'package:fecos_mobile/app/modules/service_visit/views/service_visit_view.dart';
import 'package:fecos_mobile/app/modules/delivery/views/my_routes_view.dart';
import 'package:fecos_mobile/app/modules/profile/views/profile_view.dart';
import 'package:fecos_mobile/app/modules/ar_portfolio/views/ar_portfolio_view.dart';
import 'package:fecos_mobile/app/modules/ar_plans/views/ar_plans_view.dart';
import 'package:fecos_mobile/app/modules/ar_lab/views/ar_lab_view.dart';

class MainShell extends GetView<MainController> {
  const MainShell({super.key});

  Widget _viewFor(AppTab tab) => switch (tab) {
        AppTab.home => const HomeView(),
        AppTab.visits => const ServiceVisitView(),
        AppTab.routes => const MyRoutesView(),
        AppTab.portfolio => const ArPortfolioView(),
        AppTab.plans => const ArPlansView(),
        AppTab.lab => const ArLabView(),
        AppTab.profile => const ProfileView(),
      };

  BottomNavigationBarItem _itemFor(AppTab tab) => switch (tab) {
        AppTab.home => const BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
        AppTab.visits => const BottomNavigationBarItem(
            icon: Icon(Icons.science_outlined),
            activeIcon: Icon(Icons.science_rounded),
            label: 'Visits',
          ),
        AppTab.routes => const BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_outlined),
            activeIcon: Icon(Icons.local_shipping_rounded),
            label: 'Routes',
          ),
        AppTab.portfolio => const BottomNavigationBarItem(
            icon: Icon(Icons.business_outlined),
            activeIcon: Icon(Icons.business_rounded),
            label: 'Portfolio',
          ),
        AppTab.plans => const BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment_rounded),
            label: 'Plans',
          ),
        AppTab.lab => const BottomNavigationBarItem(
            icon: Icon(Icons.science_outlined),
            activeIcon: Icon(Icons.science_rounded),
            label: 'Lab',
          ),
        AppTab.profile => const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
      };

  @override
  Widget build(BuildContext context) {
    final tabs = controller.tabs;
    return Obx(
      () => PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (didPop) return;
          if (controller.tabIndex.value != 0) {
            controller.changeTab(0);
          } else {
            SystemNavigator.pop();
          }
        },
        child: Scaffold(
          body: IndexedStack(
            index: controller.tabIndex.value,
            children: tabs.map(_viewFor).toList(),
          ),
          bottomNavigationBar: _NavBar(
            currentIndex: controller.tabIndex.value,
            items: tabs.map(_itemFor).toList(),
            onTap: controller.changeTab,
          ),
        ),
      ),
    );
  }
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
