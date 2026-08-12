import 'package:dio/dio.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/exceptions/exception_handler.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';

abstract class BaseProvider {
  Dio get dio => Get.find<DioService>().dio;

  Future<T> request<T>(Future<T> Function(Dio) call) async {
    try {
      return await call(dio);
    } on DioException catch (e) {
      throw ExceptionHandler.fromDio(e);
    }
  }
}
