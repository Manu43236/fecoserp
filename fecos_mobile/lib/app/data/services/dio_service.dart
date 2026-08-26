import 'package:dio/dio.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/config/app_config.dart';
import 'package:fecos_mobile/app/core/exceptions/exception_handler.dart';
import 'package:fecos_mobile/app/core/exceptions/app_exception.dart';
import 'package:fecos_mobile/app/data/services/storage_service.dart';

class DioService extends GetxService {
  late final Dio dio;

  @override
  void onInit() {
    super.onInit();
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        contentType: 'application/json',
      ),
    );
    dio.interceptors.add(_authInterceptor());
    if (AppConfig.isDev) dio.interceptors.add(_logInterceptor());
  }

  InterceptorsWrapper _authInterceptor() => InterceptorsWrapper(
        onRequest: (options, handler) async {
          final storage = Get.find<StorageService>();
          final token = await storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await Get.find<StorageService>().clearAll();
            Get.offAllNamed('/login');
          }
          handler.next(error);
        },
      );

  LogInterceptor _logInterceptor() => LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (o) => print('[DIO] $o'),
      );

  // ponytail: kept for legacy callers outside BaseProvider
  static AppException extractException(DioException e) =>
      ExceptionHandler.fromDio(e);
}
