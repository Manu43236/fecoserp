import 'package:get/get.dart';
import '../controllers/well_overview_controller.dart';

class WellOverviewBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<WellOverviewController>(() => WellOverviewController());
  }
}
