sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;
  @override
  String toString() => message;
}

final class NetworkException extends AppException {
  const NetworkException([super.message = 'No internet connection']);
}

final class TimeoutException extends AppException {
  const TimeoutException() : super('Connection timed out. Please try again.');
}

final class UnauthorizedException extends AppException {
  const UnauthorizedException() : super('Session expired. Please log in again.');
}

final class ServerException extends AppException {
  const ServerException([super.message = 'Something went wrong. Please try again.']);
}

final class NotFoundException extends AppException {
  const NotFoundException([super.message = 'Resource not found.']);
}

final class ValidationException extends AppException {
  const ValidationException(super.message);
}

final class SyncException extends AppException {
  const SyncException(super.message);
}
