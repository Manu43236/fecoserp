import 'package:get/get.dart';
import '../controllers/service_report_controller.dart';

class ServiceReportBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => ServiceReportController());
  }
}
