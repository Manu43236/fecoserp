enum Flavor { dev, staging, prod }

abstract final class AppConfig {
  static final flavor = _parseFlavor(
    const String.fromEnvironment('FLAVOR', defaultValue: 'dev'),
  );

  static final apiBaseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.fecoserp.com/api/v1',
  );

  static final appName = switch (flavor) {
    Flavor.dev => 'FECOS Dev',
    Flavor.staging => 'FECOS Staging',
    Flavor.prod => 'FECOS',
  };

  static bool get isDev => flavor == Flavor.dev;
  static bool get isProd => flavor == Flavor.prod;

  static Flavor _parseFlavor(String value) => switch (value.toLowerCase()) {
        'prod' => Flavor.prod,
        'staging' => Flavor.staging,
        _ => Flavor.dev,
      };
}
