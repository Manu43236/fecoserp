class PlanModel {
  const PlanModel({
    required this.id,
    required this.status,
    this.wellName,
    this.leaseName,
    this.clientName,
    this.lineCount = 0,
    this.startDate,
  });

  final String id;
  final String status;
  final String? wellName;
  final String? leaseName;
  final String? clientName;
  final int lineCount;
  final String? startDate;

  factory PlanModel.fromJson(Map<String, dynamic> json) => PlanModel(
        id: json['id'] as String,
        status: json['status'] as String,
        wellName: json['wellName'] as String?,
        leaseName: json['leaseName'] as String?,
        clientName: json['clientName'] as String?,
        lineCount: json['lineCount'] as int? ?? 0,
        startDate: json['startDate'] as String?,
      );
}
