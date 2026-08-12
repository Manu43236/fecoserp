import 'package:get/get.dart';
import '../controllers/pre_trip_controller.dart';

class PreTripBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<PreTripController>(() => PreTripController());
  }
}
