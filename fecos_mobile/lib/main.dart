import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/bindings/initial_binding.dart';
import 'package:fecos_mobile/app/config/app_config.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const FecosApp());
}

class FecosApp extends StatelessWidget {
  const FecosApp({super.key});

  @override
  Widget build(BuildContext context) => GetMaterialApp(
        title: AppConfig.appName,
        debugShowCheckedModeBanner: AppConfig.isDev,
        theme: AppTheme.light,
        initialBinding: InitialBinding(),
        initialRoute: AppPages.initial,
        getPages: AppPages.routes,
      );
}
