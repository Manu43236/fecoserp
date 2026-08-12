import 'package:get/get.dart';
import 'package:fecos_mobile/app/modules/splash/bindings/splash_binding.dart';
import 'package:fecos_mobile/app/modules/splash/views/splash_view.dart';
import 'package:fecos_mobile/app/modules/auth/bindings/auth_binding.dart';
import 'package:fecos_mobile/app/modules/auth/views/auth_view.dart';
import 'package:fecos_mobile/app/modules/home/bindings/home_binding.dart';
import 'package:fecos_mobile/app/modules/home/views/home_view.dart';
import 'package:fecos_mobile/app/modules/delivery/bindings/delivery_binding.dart';
import 'package:fecos_mobile/app/modules/delivery/views/delivery_view.dart';
import 'package:fecos_mobile/app/modules/service_visit/bindings/service_visit_binding.dart';
import 'package:fecos_mobile/app/modules/service_visit/views/service_visit_view.dart';
import 'package:fecos_mobile/app/modules/pre_trip/bindings/pre_trip_binding.dart';
import 'package:fecos_mobile/app/modules/pre_trip/views/pre_trip_view.dart';

part 'app_routes.dart';

class AppPages {
  static const initial = Routes.splash;

  static final routes = [
    GetPage(
      name: _Paths.splash,
      page: () => const SplashView(),
      binding: SplashBinding(),
    ),
    GetPage(
      name: _Paths.login,
      page: () => const AuthView(),
      binding: AuthBinding(),
    ),
    GetPage(
      name: _Paths.home,
      page: () => const HomeView(),
      binding: HomeBinding(),
    ),
    GetPage(
      name: _Paths.deliveryDetail,
      page: () => const DeliveryView(),
      binding: DeliveryBinding(),
    ),
    GetPage(
      name: _Paths.serviceVisit,
      page: () => const ServiceVisitView(),
      binding: ServiceVisitBinding(),
    ),
    GetPage(
      name: _Paths.preTrip,
      page: () => const PreTripView(),
      binding: PreTripBinding(),
    ),
  ];
}
