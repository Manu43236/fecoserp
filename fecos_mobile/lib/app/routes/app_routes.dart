part of 'app_pages.dart';

abstract class Routes {
  static const splash = _Paths.splash;
  static const login = _Paths.login;
  static const main = _Paths.main;
  static const home = _Paths.main; // keep alias so old refs compile
  static const deliveryDetail = _Paths.deliveryDetail;
  static const serviceVisit = _Paths.serviceVisit;
  static const serviceReport = _Paths.serviceReport;
  static const preTrip = _Paths.preTrip;
  static const profile = _Paths.profile;
}

abstract class _Paths {
  static const splash = '/splash';
  static const login = '/login';
  static const main = '/main';
  static const deliveryDetail = '/delivery/:id';
  static const serviceVisit = '/service-visit/:id';
  static const serviceReport = '/service-report/:visitId/:stopId';
  static const preTrip = '/pre-trip';
  static const profile = '/profile';
}
