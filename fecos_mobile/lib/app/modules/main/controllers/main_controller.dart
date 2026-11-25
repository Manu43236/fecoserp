import 'package:get/get.dart';
import 'package:fecos_mobile/app/data/models/user_model.dart';
import 'package:fecos_mobile/app/modules/auth/controllers/auth_controller.dart';

/// Bottom-nav destinations. The set shown depends on the user's role(s);
/// a user with both mobile roles gets Visits and Routes side by side.
enum AppTab { home, visits, routes, portfolio, plans, lab, profile }

class MainController extends GetxController {
  final tabIndex = 0.obs;

  /// Computed once per session from the signed-in user's roles.
  late final List<AppTab> tabs = _computeTabs();

  void changeTab(int index) => tabIndex.value = index;

  /// Index of a destination in the current layout, or -1 if not present.
  int indexOf(AppTab tab) => tabs.indexOf(tab);

  List<AppTab> _computeTabs() {
    final user = Get.find<AuthController>().user.value;
    if (user == null) return const [AppTab.home, AppTab.profile];
    // Account Rep cannot be combined with other roles (enforced server-side).
    if (user.hasRole(UserRole.accountRep)) {
      return const [
        AppTab.home,
        AppTab.portfolio,
        AppTab.plans,
        AppTab.lab,
        AppTab.profile,
      ];
    }
    return [
      AppTab.home,
      if (user.hasRole(UserRole.serviceTech)) AppTab.visits,
      if (user.hasRole(UserRole.truckDriver)) AppTab.routes,
      AppTab.profile,
    ];
  }
}
