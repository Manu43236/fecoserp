import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/user_model.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final user = controller.auth.user.value!;
    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome, ${user.name.split(' ').first}'),
        actions: [
          Obx(() => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Chip(
                  label: Text(
                    controller.connectivity.isOnline.value ? 'Online' : 'Offline',
                    style: const TextStyle(fontSize: 11, color: Colors.white),
                  ),
                  backgroundColor: controller.connectivity.isOnline.value
                      ? const Color(0xFF16A34A)
                      : const Color(0xFFDC2626),
                  padding: EdgeInsets.zero,
                ),
              )),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: controller.auth.logout,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: _buildMenu(user.role),
      ),
    );
  }

  Widget _buildMenu(UserRole role) => switch (role) {
        UserRole.truckDriver => _driverMenu(),
        UserRole.serviceTech => _techMenu(),
        UserRole.accountRep => _repMenu(),
        _ => const Center(child: Text('No menu available')),
      };

  Widget _driverMenu() => Column(
        children: [
          _MenuCard(
            icon: Icons.checklist,
            label: 'Pre-Trip Inspection',
            onTap: () => Get.toNamed(Routes.preTrip),
          ),
          const SizedBox(height: 12),
          _MenuCard(
            icon: Icons.local_shipping,
            label: 'My Deliveries',
            onTap: () => Get.toNamed(Routes.deliveryDetail, parameters: {'id': 'list'}),
          ),
        ],
      );

  Widget _techMenu() => Column(
        children: [
          _MenuCard(
            icon: Icons.science,
            label: 'Service Visits',
            onTap: () => Get.toNamed(Routes.serviceVisit, parameters: {'id': 'list'}),
          ),
        ],
      );

  Widget _repMenu() => Column(
        children: [
          _MenuCard(
            icon: Icons.local_shipping,
            label: 'Deliveries',
            onTap: () => Get.toNamed(Routes.deliveryDetail, parameters: {'id': 'list'}),
          ),
          const SizedBox(height: 12),
          _MenuCard(
            icon: Icons.science,
            label: 'Service Visits',
            onTap: () => Get.toNamed(Routes.serviceVisit, parameters: {'id': 'list'}),
          ),
        ],
      );
}

class _MenuCard extends StatelessWidget {
  const _MenuCard({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        child: ListTile(
          leading: Icon(icon, color: const Color(0xFF751903), size: 28),
          title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          trailing: const Icon(Icons.chevron_right),
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          onTap: onTap,
        ),
      );
}
