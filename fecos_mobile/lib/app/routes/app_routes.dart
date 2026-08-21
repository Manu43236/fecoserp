part of 'app_pages.dart';

abstract class Routes {
  static const splash = _Paths.splash;
  static const login = _Paths.login;
  static const home = _Paths.home;
  static const deliveryDetail = _Paths.deliveryDetail;
  static const serviceVisit = _Paths.serviceVisit;
  static const serviceReport = _Paths.serviceReport;
  static const preTrip = _Paths.preTrip;
}

abstract class _Paths {
  static const splash = '/splash';
  static const login = '/login';
  static const home = '/home';
  static const deliveryDetail = '/delivery/:id';
  static const serviceVisit = '/service-visit/:id';
  static const serviceReport = '/service-report/:visitId/:stopId';
  static const preTrip = '/pre-trip';
}
