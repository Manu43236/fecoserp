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
    this.tenantId,
    this.tenantName,
  });

  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? tenantId;
  final String? tenantName;

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        name: json['fullName'] as String,
        email: json['email'] as String,
        role: UserRole.fromString(json['role'] as String),
        tenantId: json['tenantId'] as String?,
        tenantName: json['tenantName'] as String?,
      );
}
