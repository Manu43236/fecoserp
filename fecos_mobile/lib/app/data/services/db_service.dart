import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/local/app_database.dart';

export 'package:fecos_mobile/app/data/local/app_database.dart';

class DbService extends GetxService {
  late final AppDatabase db;

  @override
  void onInit() {
    super.onInit();
    db = AppDatabase();
  }

  @override
  void onClose() {
    db.close();
    super.onClose();
  }

  Future<void> cacheResponse(String key, String json) =>
      db.into(db.responseCache).insertOnConflictUpdate(
        ResponseCacheCompanion.insert(cacheKey: key, json: json),
      );

  Future<String?> getCachedResponse(String key) async {
    final row = await (db.select(db.responseCache)
          ..where((t) => t.cacheKey.equals(key)))
        .getSingleOrNull();
    return row?.json;
  }
}
