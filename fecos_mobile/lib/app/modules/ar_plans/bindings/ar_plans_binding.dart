import 'package:get/get.dart';
import '../controllers/ar_plans_controller.dart';

class ArPlansBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ArPlansController>(() => ArPlansController());
  }
}
