import 'package:get/get.dart';
import 'package:fecos_mobile/app/modules/splash/bindings/splash_binding.dart';
import 'package:fecos_mobile/app/modules/splash/views/splash_view.dart';
import 'package:fecos_mobile/app/modules/auth/bindings/auth_binding.dart';
import 'package:fecos_mobile/app/modules/auth/views/auth_view.dart';
import 'package:fecos_mobile/app/modules/main/bindings/main_binding.dart';
import 'package:fecos_mobile/app/modules/main/views/main_shell.dart';
import 'package:fecos_mobile/app/modules/delivery/bindings/delivery_binding.dart';
import 'package:fecos_mobile/app/modules/delivery/views/delivery_view.dart';
import 'package:fecos_mobile/app/modules/service_visit/bindings/service_visit_binding.dart';
import 'package:fecos_mobile/app/modules/service_visit/views/service_visit_view.dart';
import 'package:fecos_mobile/app/modules/pre_trip/bindings/pre_trip_binding.dart';
import 'package:fecos_mobile/app/modules/pre_trip/views/pre_trip_view.dart';
import 'package:fecos_mobile/app/modules/service_report/bindings/service_report_binding.dart';
import 'package:fecos_mobile/app/modules/service_report/views/service_report_view.dart';

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
    // Main shell — bottom nav (Home / My Visits / Profile)
    GetPage(
      name: _Paths.main,
      page: () => const MainShell(),
      binding: MainBinding(),
    ),
    GetPage(
      name: _Paths.deliveryDetail,
      page: () => const DeliveryView(),
      binding: DeliveryBinding(),
    ),
    // Service visit detail pushed on top of shell
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
    GetPage(
      name: _Paths.serviceReport,
      page: () => const ServiceReportView(),
      binding: ServiceReportBinding(),
    ),
  ];
}
