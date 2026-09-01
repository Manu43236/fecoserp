class DashboardData {
  const DashboardData({
    required this.preTripDone,
    required this.visitsTotal,
    required this.stopsCompleted,
    required this.stopsTotal,
    required this.visitDate,
    required this.weekVisitsTotal,
    required this.weekStopsTotal,
  });

  final bool preTripDone;
  final int visitsTotal;
  final int stopsCompleted;
  final int stopsTotal;
  final String visitDate;
  final int weekVisitsTotal;
  final int weekStopsTotal;

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
        preTripDone:      json['preTripDone'] as bool? ?? false,
        visitsTotal:      json['visitsTotal'] as int? ?? 0,
        stopsCompleted:   json['stopsCompleted'] as int? ?? 0,
        stopsTotal:       json['stopsTotal'] as int? ?? 0,
        visitDate:        json['visitDate'] as String? ?? '',
        weekVisitsTotal:  json['weekVisitsTotal'] as int? ?? 0,
        weekStopsTotal:   json['weekStopsTotal'] as int? ?? 0,
      );
}
