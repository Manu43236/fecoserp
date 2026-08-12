import 'package:get/get.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';

class SplashBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(AuthController(), permanent: true);
  }
}
