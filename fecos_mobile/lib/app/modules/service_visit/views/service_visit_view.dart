import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/service_visit_controller.dart';

class ServiceVisitView extends GetView<ServiceVisitController> {
  const ServiceVisitView({super.key});

  @override
  Widget build(BuildContext context) =>
      Scaffold(appBar: AppBar(title: const Text('Service Visits')), body: const Center(child: Text('Coming soon')));
}
