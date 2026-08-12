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
}
