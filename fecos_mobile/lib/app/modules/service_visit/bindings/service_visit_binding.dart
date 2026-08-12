import 'package:get/get.dart';
import '../controllers/service_visit_controller.dart';

class ServiceVisitBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ServiceVisitController>(() => ServiceVisitController());
  }
}
