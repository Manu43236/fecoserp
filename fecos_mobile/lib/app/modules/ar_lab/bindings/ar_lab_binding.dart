import 'package:get/get.dart';
import '../controllers/ar_lab_controller.dart';

class ArLabBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ArLabController>(() => ArLabController());
  }
}
