import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';

class HomeController extends GetxController {
  final connectivity = Get.find<ConnectivityService>();
  final auth = Get.find<AuthController>();
}
