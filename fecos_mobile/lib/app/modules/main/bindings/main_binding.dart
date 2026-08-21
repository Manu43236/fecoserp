import 'package:get/get.dart';
import 'package:fecos_mobile/app/modules/main/controllers/main_controller.dart';
import 'package:fecos_mobile/app/modules/home/controllers/home_controller.dart';
import 'package:fecos_mobile/app/modules/service_visit/controllers/service_visit_controller.dart';
import 'package:fecos_mobile/app/modules/profile/controllers/profile_controller.dart';

class MainBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<MainController>(() => MainController());
    Get.lazyPut<HomeController>(() => HomeController());
    Get.lazyPut<ServiceVisitController>(() => ServiceVisitController());
    Get.lazyPut<ProfileController>(() => ProfileController());
  }
}
