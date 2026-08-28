import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

class SyncQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get operation => text()(); // CREATE | UPDATE | DELETE
  TextColumn get payload => text()();
  IntColumn get retries => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

class CachedDeliveries extends Table {
  TextColumn get id => text().withLength(max: 36)();
  TextColumn get stopId => text()();
  TextColumn get status => text()();
  RealColumn get latitude => real().nullable()();
  RealColumn get longitude => real().nullable()();
  TextColumn get photoPaths => text().withDefault(const Constant('[]'))();
  TextColumn get signaturePath => text().nullable()();
  TextColumn get notes => text().nullable()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class CachedServiceVisits extends Table {
  TextColumn get id => text().withLength(max: 36)();
  TextColumn get wellId => text()();
  TextColumn get status => text()();
  RealColumn get treatmentRate => real().nullable()();
  RealColumn get gallonsApplied => real().nullable()();
  TextColumn get chemicalId => text().nullable()();
  RealColumn get latitude => real().nullable()();
  RealColumn get longitude => real().nullable()();
  TextColumn get notes => text().nullable()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class CachedPreTripInspections extends Table {
  TextColumn get id => text().withLength(max: 36)();
  TextColumn get vehicleId => text()();
  TextColumn get checklistJson => text()();
  TextColumn get photoPaths => text().withDefault(const Constant('[]'))();
  TextColumn get status => text()(); // PASS | FAIL
  TextColumn get notes => text().nullable()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class ResponseCache extends Table {
  TextColumn get cacheKey => text()();
  TextColumn get json     => text()();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {cacheKey};
}

@DriftDatabase(tables: [
  SyncQueue,
  CachedDeliveries,
  CachedServiceVisits,
  CachedPreTripInspections,
  ResponseCache,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'fecos_offline'));

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onUpgrade: (m, from, to) async {
      if (from < 2) await m.createTable(responseCache);
    },
  );
}
