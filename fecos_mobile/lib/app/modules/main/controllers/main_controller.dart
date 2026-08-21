import 'package:get/get.dart';

class MainController extends GetxController {
  final tabIndex = 0.obs;

  void changeTab(int index) => tabIndex.value = index;
}
