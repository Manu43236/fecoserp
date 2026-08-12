import 'package:dio/dio.dart';
import 'package:fecos_mobile/app/core/exceptions/app_exception.dart';

abstract final class ExceptionHandler {
  static AppException fromDio(DioException e) => switch (e.type) {
        DioExceptionType.connectionError => const NetworkException(),
        DioExceptionType.connectionTimeout ||
        DioExceptionType.receiveTimeout ||
        DioExceptionType.sendTimeout =>
          const TimeoutException(),
        _ => _fromStatusCode(e),
      };

  static AppException _fromStatusCode(DioException e) {
    final code = e.response?.statusCode;
    final message = _extractMessage(e);
    return switch (code) {
      401 => const UnauthorizedException(),
      404 => NotFoundException(message),
      422 => ValidationException(message),
      _ => ServerException(message),
    };
  }

  static String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map) return (data['message'] as String?) ?? 'Request failed';
    return e.message ?? 'Request failed';
  }
}
