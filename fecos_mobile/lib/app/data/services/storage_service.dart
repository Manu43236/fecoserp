import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';

class StorageService extends GetxService {
  static const tokenKey = 'fecos_auth_token';

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<String?> getToken() => _storage.read(key: tokenKey);
  Future<void> setToken(String token) => _storage.write(key: tokenKey, value: token);
  Future<void> clearAll() => _storage.deleteAll();
}
