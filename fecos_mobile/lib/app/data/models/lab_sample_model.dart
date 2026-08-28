class LabSampleModel {
  const LabSampleModel({
    required this.id,
    required this.sampleNumber,
    required this.sampleType,
    required this.priority,
    required this.status,
    this.wellName,
    this.wellId,
    this.leaseName,
    this.clientName,
    this.receivedAt,
    this.hasCriticalValues = false,
    this.approvalStatus,
    this.approvalNotes,
    this.approvedByName,
    this.approvedAt,
    this.requiresTreatmentChange = false,
    this.labTechName,
    this.labTechNotes,
    this.ph,
    this.iron,
    this.dissolvedOxygen,
    this.scalingIndex,
    this.corrosionPotential,
    this.corrosionRate,
    this.srbCount,
    this.apbCount,
  });

  final String id;
  final String sampleNumber;
  final String sampleType;
  final String priority;
  final String status;
  final String? wellName;
  final String? wellId;
  final String? leaseName;
  final String? clientName;
  final String? receivedAt;
  final bool hasCriticalValues;
  final String? approvalStatus;
  final String? approvalNotes;
  final String? approvedByName;
  final String? approvedAt;
  final bool requiresTreatmentChange;

  // Result fields (null if results not yet entered)
  final String? labTechName;
  final String? labTechNotes;
  final double? ph;
  final double? iron;
  final double? dissolvedOxygen;
  final double? scalingIndex;
  final double? corrosionPotential;
  final double? corrosionRate;
  final double? srbCount;
  final double? apbCount;

  bool get isPendingApproval =>
      status == 'COMPLETED' && approvalStatus == 'PENDING_REVIEW';
  bool get isApproved => approvalStatus == 'APPROVED';
  bool get hasResults => labTechName != null;

  factory LabSampleModel.fromJson(Map<String, dynamic> json) {
    final result = json['result'] as Map<String, dynamic>?;
    return LabSampleModel(
      id: json['id'] as String,
      sampleNumber: json['sampleNumber'] as String,
      sampleType: json['sampleType'] as String,
      priority: json['priority'] as String,
      status: json['status'] as String,
      wellName: json['wellName'] as String?,
      wellId: json['wellId'] as String?,
      leaseName: json['leaseName'] as String?,
      clientName: json['clientName'] as String?,
      receivedAt: json['receivedAt'] as String?,
      // Flat top-level approvalStatus (always present in list responses)
      approvalStatus: (json['approvalStatus'] as String?) ??
          result?['approvalStatus'] as String?,
      hasCriticalValues: result?['hasCriticalValues'] as bool? ?? false,
      approvalNotes: result?['approvalNotes'] as String?,
      approvedByName: result?['approvedByName'] as String?,
      approvedAt: result?['approvedAt'] as String?,
      requiresTreatmentChange:
          result?['requiresTreatmentChange'] as bool? ?? false,
      labTechName: result?['labTechName'] as String?,
      labTechNotes: result?['labTechNotes'] as String?,
      ph: (result?['ph'] as num?)?.toDouble(),
      iron: (result?['iron'] as num?)?.toDouble(),
      dissolvedOxygen: (result?['dissolvedOxygen'] as num?)?.toDouble(),
      scalingIndex: (result?['scalingIndex'] as num?)?.toDouble(),
      corrosionPotential: (result?['corrosionPotential'] as num?)?.toDouble(),
      corrosionRate: (result?['corrosionRate'] as num?)?.toDouble(),
      srbCount: (result?['srbCount'] as num?)?.toDouble(),
      apbCount: (result?['apbCount'] as num?)?.toDouble(),
    );
  }
}
