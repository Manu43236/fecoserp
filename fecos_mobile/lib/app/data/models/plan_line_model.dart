class PlanLineModel {
  const PlanLineModel({
    required this.id,
    this.productName,
    this.recRate,
    this.method,
    this.schedule,
    this.notes,
    this.tankOwner,
    this.tankSerial,
    this.tankCapacityGallons,
    this.calculatedLevelPct,
    this.thirdPartyName,
    this.thirdPartyCapacityGallons,
    this.thirdPartySerial,
    this.pumpDeployed = false,
    this.pumpSerial,
  });

  final String id;
  final String? productName;
  final double? recRate;
  final String? method;
  final String? schedule;
  final String? notes;
  final String? tankOwner; // OWN | THIRD_PARTY
  final String? tankSerial;
  final double? tankCapacityGallons;
  final double? calculatedLevelPct;
  final String? thirdPartyName;
  final double? thirdPartyCapacityGallons;
  final String? thirdPartySerial;
  final bool pumpDeployed;
  final String? pumpSerial;

  bool get isOwn => tankOwner == 'OWN';

  String get recRateLabel {
    if (recRate == null) return '—';
    final unit = method == 'BATCH' ? 'gal/treatment' : 'gal/day';
    return '${recRate!.toStringAsFixed(2)} $unit';
  }

  factory PlanLineModel.fromJson(Map<String, dynamic> json) => PlanLineModel(
        id: json['id'] as String,
        productName: json['productName'] as String?,
        recRate: (json['recRate'] as num?)?.toDouble(),
        method: json['method'] as String?,
        schedule: json['schedule'] as String?,
        notes: json['notes'] as String?,
        tankOwner: json['tankOwner'] as String?,
        tankSerial: json['tankSerial'] as String?,
        tankCapacityGallons: (json['tankCapacityGallons'] as num?)?.toDouble(),
        calculatedLevelPct: (json['calculatedLevelPct'] as num?)?.toDouble(),
        thirdPartyName: json['thirdPartyName'] as String?,
        thirdPartyCapacityGallons:
            (json['thirdPartyCapacityGallons'] as num?)?.toDouble(),
        thirdPartySerial: json['thirdPartySerial'] as String?,
        pumpDeployed: json['pumpDeployed'] as bool? ?? false,
        pumpSerial: json['pumpSerial'] as String?,
      );
}

class PlanDetailModel {
  const PlanDetailModel({
    required this.id,
    required this.status,
    required this.lines,
    this.wellName,
    this.leaseName,
    this.clientName,
    this.notes,
    this.startDate,
    this.endDate,
    this.startedAt,
  });

  final String id;
  final String status;
  final List<PlanLineModel> lines;
  final String? wellName;
  final String? leaseName;
  final String? clientName;
  final String? notes;
  final String? startDate;
  final String? endDate;
  final String? startedAt;

  factory PlanDetailModel.fromJson(Map<String, dynamic> json) => PlanDetailModel(
        id: json['id'] as String,
        status: json['status'] as String,
        wellName: json['wellName'] as String?,
        leaseName: json['leaseName'] as String?,
        clientName: json['clientName'] as String?,
        notes: json['notes'] as String?,
        startDate: json['startDate'] as String?,
        endDate: json['endDate'] as String?,
        startedAt: json['startedAt'] as String?,
        lines: ((json['lines'] as List?) ?? [])
            .map((e) => PlanLineModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
