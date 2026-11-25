enum UserRole {
  superAdmin,
  admin,
  manager,
  labTech,
  accountRep,
  truckDriver,
  serviceTech;

  static UserRole fromString(String value) => switch (value.toUpperCase()) {
        'SUPER_ADMIN' => superAdmin,
        'ADMIN' => admin,
        'MANAGER' => manager,
        'LAB_TECH' => labTech,
        'ACCOUNT_REP' => accountRep,
        'TRUCK_DRIVER' => truckDriver,
        'SERVICE_TECH' => serviceTech,
        _ => throw ArgumentError('Unknown role: $value'),
      };

  bool get isMobileRole => this == truckDriver || this == serviceTech;
}

class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.roles = const [],
    this.tenantId,
    this.tenantName,
  });

  final String id;
  final String name;
  final String email;
  final UserRole role; // primary (precedence) — kept for existing callers
  final List<UserRole> roles; // every role assigned to this user
  final String? tenantId;
  final String? tenantName;

  List<UserRole> get mobileRoles =>
      roles.where((r) => r.isMobileRole).toList();

  bool hasRole(UserRole r) => roles.contains(r);

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final primary = UserRole.fromString(json['role'] as String);
    final parsed = ((json['roles'] as List?) ?? const [])
        .cast<String>()
        .map((r) {
          try {
            return UserRole.fromString(r);
          } catch (_) {
            return null; // ignore roles this mobile build doesn't know
          }
        })
        .whereType<UserRole>()
        .toList();
    return UserModel(
      id: json['id'] as String,
      name: json['fullName'] as String,
      email: json['email'] as String,
      role: primary,
      roles: parsed.isEmpty ? [primary] : parsed,
      tenantId: json['tenantId'] as String?,
      tenantName: json['tenantName'] as String?,
    );
  }
}
