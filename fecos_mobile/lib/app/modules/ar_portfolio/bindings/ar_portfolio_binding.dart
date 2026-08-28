import 'package:get/get.dart';
import '../controllers/ar_portfolio_controller.dart';

class ArPortfolioBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ArPortfolioController>(() => ArPortfolioController());
  }
}
