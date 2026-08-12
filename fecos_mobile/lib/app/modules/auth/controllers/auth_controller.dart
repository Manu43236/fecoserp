import 'package:dio/dio.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/core/exceptions/exception_handler.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/storage_service.dart';
import 'package:fecos_mobile/app/data/models/user_model.dart';
import 'package:fecos_mobile/app/routes/app_pages.dart';

class AuthController extends GetxController {
  final _dio = Get.find<DioService>().dio;
  final _storage = Get.find<StorageService>();

  final user = Rxn<UserModel>();
  final isLoading = false.obs;
  final errorMessage = RxnString();

  bool get isLoggedIn => user.value != null;

  @override
  void onInit() {
    super.onInit();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await _storage.getToken();
    if (token == null) return;
    try {
      final res = await _dio.get<Map<String, dynamic>>('/auth/me');
      final u = UserModel.fromJson(res.data!['data'] as Map<String, dynamic>);
      if (!u.role.isMobileRole) {
        await _storage.clearAll();
        return;
      }
      user.value = u;
      Get.offAllNamed(Routes.home);
    } on DioException {
      await _storage.clearAll();
    }
  }

  Future<void> login(String email, String password) async {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = res.data!['data'] as Map<String, dynamic>;
      final token = data['token'] as String;
      final u = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      if (!u.role.isMobileRole) {
        errorMessage.value = 'This account is not authorized for mobile access.';
        return;
      }
      await _storage.setToken(token);
      user.value = u;
      Get.offAllNamed(Routes.home);
    } on DioException catch (e) {
      errorMessage.value = ExceptionHandler.fromDio(e).message;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
    user.value = null;
    Get.offAllNamed(Routes.login);
  }
}
