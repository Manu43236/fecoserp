class RouteStopItem {
  const RouteStopItem({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.unit,
  });

  final String id;
  final String? productName;
  final double quantity;
  final String unit;

  factory RouteStopItem.fromJson(Map<String, dynamic> json) => RouteStopItem(
        id: json['id'] as String,
        productName: json['productName'] as String?,
        quantity: (json['quantity'] as num).toDouble(),
        unit: json['unit'] as String? ?? '',
      );
}

class RouteStop {
  const RouteStop({
    required this.id,
    required this.routeId,
    required this.wellName,
    required this.leaseName,
    required this.sequenceOrder,
    required this.status,
    required this.items,
    this.notes,
    this.deliveryPhotoUrl,
    this.deliveryLat,
    this.deliveryLng,
  });

  final String id;
  final String routeId;
  final String? wellName;
  final String? leaseName;
  final int sequenceOrder;
  final String status; // PENDING | COMPLETED | SKIPPED
  final List<RouteStopItem> items;
  final String? notes;
  final String? deliveryPhotoUrl;
  final double? deliveryLat;
  final double? deliveryLng;

  bool get isPending   => status == 'PENDING';
  bool get isCompleted => status == 'COMPLETED';
  bool get isSkipped   => status == 'SKIPPED';

  factory RouteStop.fromJson(Map<String, dynamic> json) => RouteStop(
        id: json['id'] as String,
        routeId: json['routeId'] as String,
        wellName: json['wellName'] as String?,
        leaseName: json['leaseName'] as String?,
        sequenceOrder: json['sequenceOrder'] as int? ?? 0,
        status: json['status'] as String? ?? 'PENDING',
        items: (json['items'] as List? ?? [])
            .map((e) => RouteStopItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        notes: json['notes'] as String?,
        deliveryPhotoUrl: json['deliveryPhotoUrl'] as String?,
        deliveryLat: (json['deliveryLat'] as num?)?.toDouble(),
        deliveryLng: (json['deliveryLng'] as num?)?.toDouble(),
      );
}

class RouteModel {
  const RouteModel({
    required this.id,
    required this.driverName,
    required this.truckNumber,
    required this.routeDate,
    required this.status,
    required this.stopCount,
    required this.stops,
    this.notes,
  });

  final String id;
  final String? driverName;
  final String? truckNumber;
  final String routeDate;
  final String status; // PLANNED | DISPATCHED | IN_PROGRESS | COMPLETED | CANCELLED
  final int stopCount;
  final List<RouteStop> stops;
  final String? notes;

  bool get isActive => status == 'DISPATCHED' || status == 'IN_PROGRESS';
  int get completedStops => stops.where((s) => s.isCompleted).length;
  int get pendingStops   => stops.where((s) => s.isPending).length;

  factory RouteModel.fromJson(Map<String, dynamic> json) => RouteModel(
        id: json['id'] as String,
        driverName: json['driverName'] as String?,
        truckNumber: json['truckNumber'] as String?,
        routeDate: json['routeDate'] as String,
        status: json['status'] as String? ?? 'PLANNED',
        stopCount: json['stopCount'] as int? ?? 0,
        stops: (json['stops'] as List? ?? [])
            .map((e) => RouteStop.fromJson(e as Map<String, dynamic>))
            .toList(),
        notes: json['notes'] as String?,
      );
}
