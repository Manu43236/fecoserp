import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/services/connectivity_service.dart';
import 'package:fecos_mobile/app/data/services/db_service.dart';
import 'package:fecos_mobile/app/data/services/dio_service.dart';
import 'package:fecos_mobile/app/data/services/storage_service.dart';
import 'package:fecos_mobile/app/data/services/sync_service.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(StorageService(), permanent: true);
    Get.put(DbService(), permanent: true);
    Get.put(DioService(), permanent: true);
    Get.put(ConnectivityService(), permanent: true);
    Get.put(SyncService(), permanent: true);
    Get.put(AuthController(), permanent: true);
  }
}
