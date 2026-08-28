class ClientModel {
  const ClientModel({
    required this.id,
    required this.companyName,
    this.contactName,
    this.contactPhone,
    this.contactEmail,
    this.isActive = true,
    this.accountRepId,
    this.accountRepName,
  });

  final String id;
  final String companyName;
  final String? contactName;
  final String? contactPhone;
  final String? contactEmail;
  final bool isActive;
  final String? accountRepId;
  final String? accountRepName;

  factory ClientModel.fromJson(Map<String, dynamic> json) => ClientModel(
        id: json['id'] as String,
        companyName: json['companyName'] as String,
        contactName: json['contactName'] as String?,
        contactPhone: json['contactPhone'] as String?,
        contactEmail: json['contactEmail'] as String?,
        isActive: json['isActive'] as bool? ?? true,
        accountRepId: json['accountRepId'] as String?,
        accountRepName: json['accountRepName'] as String?,
      );
}
