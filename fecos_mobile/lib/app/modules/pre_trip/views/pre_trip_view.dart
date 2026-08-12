import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/pre_trip_controller.dart';

class PreTripView extends GetView<PreTripController> {
  const PreTripView({super.key});

  @override
  Widget build(BuildContext context) =>
      Scaffold(appBar: AppBar(title: const Text('Pre-Trip Inspection')), body: const Center(child: Text('Coming soon')));
}
