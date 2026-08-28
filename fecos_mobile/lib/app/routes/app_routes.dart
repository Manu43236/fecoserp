part of 'app_pages.dart';

abstract class Routes {
  static const splash = _Paths.splash;
  static const login = _Paths.login;
  static const main = _Paths.main;
  static const home = _Paths.main;
  static const deliveryDetail = _Paths.deliveryDetail;
  static const serviceVisit = _Paths.serviceVisit;
  static const serviceReport = _Paths.serviceReport;
  static const wellOverview = _Paths.wellOverview;
  static const wellStop = _Paths.wellStop;
  static const preTrip = _Paths.preTrip;
  static const wrapUp = _Paths.wrapUp;
  static const profile = _Paths.profile;
  static const reportView = _Paths.reportView;
}

abstract class _Paths {
  static const splash = '/splash';
  static const login = '/login';
  static const main = '/main';
  static const deliveryDetail = '/delivery/:id';
  static const serviceVisit = '/service-visit/:id';
  static const serviceReport = '/service-report/:visitId/:stopId';
  static const wellOverview = '/well-overview/:visitId/:stopId';
  static const wellStop = '/well-stop/:visitId/:stopId';
  static const preTrip = '/pre-trip';
  static const wrapUp = '/wrap-up';
  static const profile = '/profile';
  static const reportView = '/report-view/:visitId/:stopId';
}
