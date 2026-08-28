class RouteStopItem {
  const RouteStopItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unit,
    this.loadedQty,
    this.actualQtyDelivered,
  });

  final String id;
  final String productId;
  final String? productName;
  final double quantity;
  final String unit;
  final double? loadedQty;
  final double? actualQtyDelivered;

  factory RouteStopItem.fromJson(Map<String, dynamic> json) => RouteStopItem(
        id: json['id'] as String,
        productId: json['productId'] as String? ?? '',
        productName: json['productName'] as String?,
        quantity: (json['quantity'] as num).toDouble(),
        unit: json['unit'] as String? ?? '',
        loadedQty: (json['loadedQty'] as num?)?.toDouble(),
        actualQtyDelivered: (json['actualQtyDelivered'] as num?)?.toDouble(),
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
    this.skipReason,
    this.deliveryPhotoUrl,
    this.deliveryLat,
    this.deliveryLng,
    this.deliveredAt,
    this.receivedAt,
    this.syncedLate = false,
  });

  final String id;
  final String routeId;
  final String? wellName;
  final String? leaseName;
  final int sequenceOrder;
  final String status; // PENDING | COMPLETED | SKIPPED
  final List<RouteStopItem> items;
  final String? notes;
  final String? skipReason;
  final String? deliveryPhotoUrl;
  final double? deliveryLat;
  final double? deliveryLng;
  final String? deliveredAt;
  final String? receivedAt;
  final bool syncedLate;

  bool get isPending   => status == 'PENDING';
  bool get isCompleted => status == 'COMPLETED';
  bool get isSkipped   => status == 'SKIPPED';

  RouteStop copyWith({String? status, String? skipReason}) => RouteStop(
    id: id, routeId: routeId, wellName: wellName, leaseName: leaseName,
    sequenceOrder: sequenceOrder, status: status ?? this.status,
    items: items, notes: notes, skipReason: skipReason ?? this.skipReason,
    deliveryPhotoUrl: deliveryPhotoUrl, deliveryLat: deliveryLat,
    deliveryLng: deliveryLng, deliveredAt: deliveredAt,
    receivedAt: receivedAt, syncedLate: syncedLate,
  );

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
        skipReason: json['skipReason'] as String?,
        deliveryPhotoUrl: json['deliveryPhotoUrl'] as String?,
        deliveryLat: (json['deliveryLat'] as num?)?.toDouble(),
        deliveryLng: (json['deliveryLng'] as num?)?.toDouble(),
        deliveredAt: json['deliveredAt'] as String?,
        receivedAt: json['receivedAt'] as String?,
        syncedLate: json['syncedLate'] as bool? ?? false,
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
    required this.completedStopCount,
    required this.stops,
    this.notes,
    this.loadConfirmedAt,
    this.preTripConfirmedAt,
  });

  final String id;
  final String? driverName;
  final String? truckNumber;
  final String routeDate;
  final String status;
  final int stopCount;
  final int completedStopCount;
  final List<RouteStop> stops;
  final String? notes;
  final String? loadConfirmedAt;
  final String? preTripConfirmedAt;

  bool get isActive      => status == 'DISPATCHED' || status == 'IN_PROGRESS';
  bool get loadConfirmed => loadConfirmedAt != null;
  bool get preTripDone   => preTripConfirmedAt != null;

  RouteModel copyWith({
    String? status,
    List<RouteStop>? stops,
    String? loadConfirmedAt,
    String? preTripConfirmedAt,
  }) => RouteModel(
    id: id, driverName: driverName, truckNumber: truckNumber,
    routeDate: routeDate, status: status ?? this.status,
    stopCount: stopCount, completedStopCount: completedStopCount,
    stops: stops ?? this.stops, notes: notes,
    loadConfirmedAt: loadConfirmedAt ?? this.loadConfirmedAt,
    preTripConfirmedAt: preTripConfirmedAt ?? this.preTripConfirmedAt,
  );
  // Use backend-provided count when stops aren't loaded (list view), else compute from stops
  int get completedStops => stops.isNotEmpty
      ? stops.where((s) => s.isCompleted).length
      : completedStopCount;
  int get pendingStops   => stops.where((s) => s.isPending).length;

  factory RouteModel.fromJson(Map<String, dynamic> json) => RouteModel(
        id: json['id'] as String,
        driverName: json['driverName'] as String?,
        truckNumber: json['truckNumber'] as String?,
        routeDate: json['routeDate'] as String,
        status: json['status'] as String? ?? 'PLANNED',
        stopCount: json['stopCount'] as int? ?? 0,
        completedStopCount: json['completedStopCount'] as int? ?? 0,
        stops: (json['stops'] as List? ?? [])
            .map((e) => RouteStop.fromJson(e as Map<String, dynamic>))
            .toList(),
        notes: json['notes'] as String?,
        loadConfirmedAt: json['loadConfirmedAt'] as String?,
        preTripConfirmedAt: json['preTripConfirmedAt'] as String?,
      );
}
