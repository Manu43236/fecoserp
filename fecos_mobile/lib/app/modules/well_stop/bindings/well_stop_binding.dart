import 'package:get/get.dart';
import '../controllers/well_stop_controller.dart';

class WellStopBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<WellStopController>(() => WellStopController());
  }
}
