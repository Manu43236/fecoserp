// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _entityTypeMeta = const VerificationMeta(
    'entityType',
  );
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
    'entity_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _entityIdMeta = const VerificationMeta(
    'entityId',
  );
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
    'entity_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _operationMeta = const VerificationMeta(
    'operation',
  );
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
    'operation',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _retriesMeta = const VerificationMeta(
    'retries',
  );
  @override
  late final GeneratedColumn<int> retries = GeneratedColumn<int>(
    'retries',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    entityType,
    entityId,
    operation,
    payload,
    retries,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncQueueData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('entity_type')) {
      context.handle(
        _entityTypeMeta,
        entityType.isAcceptableOrUnknown(data['entity_type']!, _entityTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(
        _entityIdMeta,
        entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta),
      );
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(
        _operationMeta,
        operation.isAcceptableOrUnknown(data['operation']!, _operationMeta),
      );
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('retries')) {
      context.handle(
        _retriesMeta,
        retries.isAcceptableOrUnknown(data['retries']!, _retriesMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      entityType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_type'],
      )!,
      entityId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_id'],
      )!,
      operation: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operation'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      retries: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}retries'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }
}

class SyncQueueData extends DataClass implements Insertable<SyncQueueData> {
  final int id;
  final String entityType;
  final String entityId;
  final String operation;
  final String payload;
  final int retries;
  final DateTime createdAt;
  const SyncQueueData({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.operation,
    required this.payload,
    required this.retries,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_id'] = Variable<String>(entityId);
    map['operation'] = Variable<String>(operation);
    map['payload'] = Variable<String>(payload);
    map['retries'] = Variable<int>(retries);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      entityType: Value(entityType),
      entityId: Value(entityId),
      operation: Value(operation),
      payload: Value(payload),
      retries: Value(retries),
      createdAt: Value(createdAt),
    );
  }

  factory SyncQueueData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueData(
      id: serializer.fromJson<int>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityId: serializer.fromJson<String>(json['entityId']),
      operation: serializer.fromJson<String>(json['operation']),
      payload: serializer.fromJson<String>(json['payload']),
      retries: serializer.fromJson<int>(json['retries']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'entityType': serializer.toJson<String>(entityType),
      'entityId': serializer.toJson<String>(entityId),
      'operation': serializer.toJson<String>(operation),
      'payload': serializer.toJson<String>(payload),
      'retries': serializer.toJson<int>(retries),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  SyncQueueData copyWith({
    int? id,
    String? entityType,
    String? entityId,
    String? operation,
    String? payload,
    int? retries,
    DateTime? createdAt,
  }) => SyncQueueData(
    id: id ?? this.id,
    entityType: entityType ?? this.entityType,
    entityId: entityId ?? this.entityId,
    operation: operation ?? this.operation,
    payload: payload ?? this.payload,
    retries: retries ?? this.retries,
    createdAt: createdAt ?? this.createdAt,
  );
  SyncQueueData copyWithCompanion(SyncQueueCompanion data) {
    return SyncQueueData(
      id: data.id.present ? data.id.value : this.id,
      entityType: data.entityType.present
          ? data.entityType.value
          : this.entityType,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      operation: data.operation.present ? data.operation.value : this.operation,
      payload: data.payload.present ? data.payload.value : this.payload,
      retries: data.retries.present ? data.retries.value : this.retries,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueData(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('retries: $retries, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    entityType,
    entityId,
    operation,
    payload,
    retries,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueData &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.operation == this.operation &&
          other.payload == this.payload &&
          other.retries == this.retries &&
          other.createdAt == this.createdAt);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueData> {
  final Value<int> id;
  final Value<String> entityType;
  final Value<String> entityId;
  final Value<String> operation;
  final Value<String> payload;
  final Value<int> retries;
  final Value<DateTime> createdAt;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.operation = const Value.absent(),
    this.payload = const Value.absent(),
    this.retries = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    this.id = const Value.absent(),
    required String entityType,
    required String entityId,
    required String operation,
    required String payload,
    this.retries = const Value.absent(),
    this.createdAt = const Value.absent(),
  }) : entityType = Value(entityType),
       entityId = Value(entityId),
       operation = Value(operation),
       payload = Value(payload);
  static Insertable<SyncQueueData> custom({
    Expression<int>? id,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<String>? operation,
    Expression<String>? payload,
    Expression<int>? retries,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (operation != null) 'operation': operation,
      if (payload != null) 'payload': payload,
      if (retries != null) 'retries': retries,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  SyncQueueCompanion copyWith({
    Value<int>? id,
    Value<String>? entityType,
    Value<String>? entityId,
    Value<String>? operation,
    Value<String>? payload,
    Value<int>? retries,
    Value<DateTime>? createdAt,
  }) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      operation: operation ?? this.operation,
      payload: payload ?? this.payload,
      retries: retries ?? this.retries,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (retries.present) {
      map['retries'] = Variable<int>(retries.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('retries: $retries, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $CachedDeliveriesTable extends CachedDeliveries
    with TableInfo<$CachedDeliveriesTable, CachedDelivery> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedDeliveriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(maxTextLength: 36),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stopIdMeta = const VerificationMeta('stopId');
  @override
  late final GeneratedColumn<String> stopId = GeneratedColumn<String>(
    'stop_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _latitudeMeta = const VerificationMeta(
    'latitude',
  );
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _longitudeMeta = const VerificationMeta(
    'longitude',
  );
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _photoPathsMeta = const VerificationMeta(
    'photoPaths',
  );
  @override
  late final GeneratedColumn<String> photoPaths = GeneratedColumn<String>(
    'photo_paths',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('[]'),
  );
  static const VerificationMeta _signaturePathMeta = const VerificationMeta(
    'signaturePath',
  );
  @override
  late final GeneratedColumn<String> signaturePath = GeneratedColumn<String>(
    'signature_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncedMeta = const VerificationMeta('synced');
  @override
  late final GeneratedColumn<bool> synced = GeneratedColumn<bool>(
    'synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    stopId,
    status,
    latitude,
    longitude,
    photoPaths,
    signaturePath,
    notes,
    synced,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_deliveries';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedDelivery> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('stop_id')) {
      context.handle(
        _stopIdMeta,
        stopId.isAcceptableOrUnknown(data['stop_id']!, _stopIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stopIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
      );
    }
    if (data.containsKey('photo_paths')) {
      context.handle(
        _photoPathsMeta,
        photoPaths.isAcceptableOrUnknown(data['photo_paths']!, _photoPathsMeta),
      );
    }
    if (data.containsKey('signature_path')) {
      context.handle(
        _signaturePathMeta,
        signaturePath.isAcceptableOrUnknown(
          data['signature_path']!,
          _signaturePathMeta,
        ),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('synced')) {
      context.handle(
        _syncedMeta,
        synced.isAcceptableOrUnknown(data['synced']!, _syncedMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedDelivery map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedDelivery(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      stopId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}stop_id'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      ),
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      ),
      photoPaths: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_paths'],
      )!,
      signaturePath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}signature_path'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      synced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}synced'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $CachedDeliveriesTable createAlias(String alias) {
    return $CachedDeliveriesTable(attachedDatabase, alias);
  }
}

class CachedDelivery extends DataClass implements Insertable<CachedDelivery> {
  final String id;
  final String stopId;
  final String status;
  final double? latitude;
  final double? longitude;
  final String photoPaths;
  final String? signaturePath;
  final String? notes;
  final bool synced;
  final DateTime updatedAt;
  const CachedDelivery({
    required this.id,
    required this.stopId,
    required this.status,
    this.latitude,
    this.longitude,
    required this.photoPaths,
    this.signaturePath,
    this.notes,
    required this.synced,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['stop_id'] = Variable<String>(stopId);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = Variable<double>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = Variable<double>(longitude);
    }
    map['photo_paths'] = Variable<String>(photoPaths);
    if (!nullToAbsent || signaturePath != null) {
      map['signature_path'] = Variable<String>(signaturePath);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['synced'] = Variable<bool>(synced);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  CachedDeliveriesCompanion toCompanion(bool nullToAbsent) {
    return CachedDeliveriesCompanion(
      id: Value(id),
      stopId: Value(stopId),
      status: Value(status),
      latitude: latitude == null && nullToAbsent
          ? const Value.absent()
          : Value(latitude),
      longitude: longitude == null && nullToAbsent
          ? const Value.absent()
          : Value(longitude),
      photoPaths: Value(photoPaths),
      signaturePath: signaturePath == null && nullToAbsent
          ? const Value.absent()
          : Value(signaturePath),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      synced: Value(synced),
      updatedAt: Value(updatedAt),
    );
  }

  factory CachedDelivery.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedDelivery(
      id: serializer.fromJson<String>(json['id']),
      stopId: serializer.fromJson<String>(json['stopId']),
      status: serializer.fromJson<String>(json['status']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
      photoPaths: serializer.fromJson<String>(json['photoPaths']),
      signaturePath: serializer.fromJson<String?>(json['signaturePath']),
      notes: serializer.fromJson<String?>(json['notes']),
      synced: serializer.fromJson<bool>(json['synced']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'stopId': serializer.toJson<String>(stopId),
      'status': serializer.toJson<String>(status),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
      'photoPaths': serializer.toJson<String>(photoPaths),
      'signaturePath': serializer.toJson<String?>(signaturePath),
      'notes': serializer.toJson<String?>(notes),
      'synced': serializer.toJson<bool>(synced),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  CachedDelivery copyWith({
    String? id,
    String? stopId,
    String? status,
    Value<double?> latitude = const Value.absent(),
    Value<double?> longitude = const Value.absent(),
    String? photoPaths,
    Value<String?> signaturePath = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    bool? synced,
    DateTime? updatedAt,
  }) => CachedDelivery(
    id: id ?? this.id,
    stopId: stopId ?? this.stopId,
    status: status ?? this.status,
    latitude: latitude.present ? latitude.value : this.latitude,
    longitude: longitude.present ? longitude.value : this.longitude,
    photoPaths: photoPaths ?? this.photoPaths,
    signaturePath: signaturePath.present
        ? signaturePath.value
        : this.signaturePath,
    notes: notes.present ? notes.value : this.notes,
    synced: synced ?? this.synced,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  CachedDelivery copyWithCompanion(CachedDeliveriesCompanion data) {
    return CachedDelivery(
      id: data.id.present ? data.id.value : this.id,
      stopId: data.stopId.present ? data.stopId.value : this.stopId,
      status: data.status.present ? data.status.value : this.status,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      photoPaths: data.photoPaths.present
          ? data.photoPaths.value
          : this.photoPaths,
      signaturePath: data.signaturePath.present
          ? data.signaturePath.value
          : this.signaturePath,
      notes: data.notes.present ? data.notes.value : this.notes,
      synced: data.synced.present ? data.synced.value : this.synced,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedDelivery(')
          ..write('id: $id, ')
          ..write('stopId: $stopId, ')
          ..write('status: $status, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('photoPaths: $photoPaths, ')
          ..write('signaturePath: $signaturePath, ')
          ..write('notes: $notes, ')
          ..write('synced: $synced, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    stopId,
    status,
    latitude,
    longitude,
    photoPaths,
    signaturePath,
    notes,
    synced,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedDelivery &&
          other.id == this.id &&
          other.stopId == this.stopId &&
          other.status == this.status &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.photoPaths == this.photoPaths &&
          other.signaturePath == this.signaturePath &&
          other.notes == this.notes &&
          other.synced == this.synced &&
          other.updatedAt == this.updatedAt);
}

class CachedDeliveriesCompanion extends UpdateCompanion<CachedDelivery> {
  final Value<String> id;
  final Value<String> stopId;
  final Value<String> status;
  final Value<double?> latitude;
  final Value<double?> longitude;
  final Value<String> photoPaths;
  final Value<String?> signaturePath;
  final Value<String?> notes;
  final Value<bool> synced;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const CachedDeliveriesCompanion({
    this.id = const Value.absent(),
    this.stopId = const Value.absent(),
    this.status = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.photoPaths = const Value.absent(),
    this.signaturePath = const Value.absent(),
    this.notes = const Value.absent(),
    this.synced = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedDeliveriesCompanion.insert({
    required String id,
    required String stopId,
    required String status,
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.photoPaths = const Value.absent(),
    this.signaturePath = const Value.absent(),
    this.notes = const Value.absent(),
    this.synced = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       stopId = Value(stopId),
       status = Value(status);
  static Insertable<CachedDelivery> custom({
    Expression<String>? id,
    Expression<String>? stopId,
    Expression<String>? status,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<String>? photoPaths,
    Expression<String>? signaturePath,
    Expression<String>? notes,
    Expression<bool>? synced,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (stopId != null) 'stop_id': stopId,
      if (status != null) 'status': status,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (photoPaths != null) 'photo_paths': photoPaths,
      if (signaturePath != null) 'signature_path': signaturePath,
      if (notes != null) 'notes': notes,
      if (synced != null) 'synced': synced,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedDeliveriesCompanion copyWith({
    Value<String>? id,
    Value<String>? stopId,
    Value<String>? status,
    Value<double?>? latitude,
    Value<double?>? longitude,
    Value<String>? photoPaths,
    Value<String?>? signaturePath,
    Value<String?>? notes,
    Value<bool>? synced,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return CachedDeliveriesCompanion(
      id: id ?? this.id,
      stopId: stopId ?? this.stopId,
      status: status ?? this.status,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      photoPaths: photoPaths ?? this.photoPaths,
      signaturePath: signaturePath ?? this.signaturePath,
      notes: notes ?? this.notes,
      synced: synced ?? this.synced,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (stopId.present) {
      map['stop_id'] = Variable<String>(stopId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (photoPaths.present) {
      map['photo_paths'] = Variable<String>(photoPaths.value);
    }
    if (signaturePath.present) {
      map['signature_path'] = Variable<String>(signaturePath.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (synced.present) {
      map['synced'] = Variable<bool>(synced.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedDeliveriesCompanion(')
          ..write('id: $id, ')
          ..write('stopId: $stopId, ')
          ..write('status: $status, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('photoPaths: $photoPaths, ')
          ..write('signaturePath: $signaturePath, ')
          ..write('notes: $notes, ')
          ..write('synced: $synced, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedServiceVisitsTable extends CachedServiceVisits
    with TableInfo<$CachedServiceVisitsTable, CachedServiceVisit> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedServiceVisitsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(maxTextLength: 36),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _wellIdMeta = const VerificationMeta('wellId');
  @override
  late final GeneratedColumn<String> wellId = GeneratedColumn<String>(
    'well_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _treatmentRateMeta = const VerificationMeta(
    'treatmentRate',
  );
  @override
  late final GeneratedColumn<double> treatmentRate = GeneratedColumn<double>(
    'treatment_rate',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _gallonsAppliedMeta = const VerificationMeta(
    'gallonsApplied',
  );
  @override
  late final GeneratedColumn<double> gallonsApplied = GeneratedColumn<double>(
    'gallons_applied',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _chemicalIdMeta = const VerificationMeta(
    'chemicalId',
  );
  @override
  late final GeneratedColumn<String> chemicalId = GeneratedColumn<String>(
    'chemical_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _latitudeMeta = const VerificationMeta(
    'latitude',
  );
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _longitudeMeta = const VerificationMeta(
    'longitude',
  );
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncedMeta = const VerificationMeta('synced');
  @override
  late final GeneratedColumn<bool> synced = GeneratedColumn<bool>(
    'synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    wellId,
    status,
    treatmentRate,
    gallonsApplied,
    chemicalId,
    latitude,
    longitude,
    notes,
    synced,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_service_visits';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedServiceVisit> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('well_id')) {
      context.handle(
        _wellIdMeta,
        wellId.isAcceptableOrUnknown(data['well_id']!, _wellIdMeta),
      );
    } else if (isInserting) {
      context.missing(_wellIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('treatment_rate')) {
      context.handle(
        _treatmentRateMeta,
        treatmentRate.isAcceptableOrUnknown(
          data['treatment_rate']!,
          _treatmentRateMeta,
        ),
      );
    }
    if (data.containsKey('gallons_applied')) {
      context.handle(
        _gallonsAppliedMeta,
        gallonsApplied.isAcceptableOrUnknown(
          data['gallons_applied']!,
          _gallonsAppliedMeta,
        ),
      );
    }
    if (data.containsKey('chemical_id')) {
      context.handle(
        _chemicalIdMeta,
        chemicalId.isAcceptableOrUnknown(data['chemical_id']!, _chemicalIdMeta),
      );
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('synced')) {
      context.handle(
        _syncedMeta,
        synced.isAcceptableOrUnknown(data['synced']!, _syncedMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedServiceVisit map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedServiceVisit(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      wellId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}well_id'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      treatmentRate: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}treatment_rate'],
      ),
      gallonsApplied: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}gallons_applied'],
      ),
      chemicalId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}chemical_id'],
      ),
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      ),
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      synced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}synced'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $CachedServiceVisitsTable createAlias(String alias) {
    return $CachedServiceVisitsTable(attachedDatabase, alias);
  }
}

class CachedServiceVisit extends DataClass
    implements Insertable<CachedServiceVisit> {
  final String id;
  final String wellId;
  final String status;
  final double? treatmentRate;
  final double? gallonsApplied;
  final String? chemicalId;
  final double? latitude;
  final double? longitude;
  final String? notes;
  final bool synced;
  final DateTime updatedAt;
  const CachedServiceVisit({
    required this.id,
    required this.wellId,
    required this.status,
    this.treatmentRate,
    this.gallonsApplied,
    this.chemicalId,
    this.latitude,
    this.longitude,
    this.notes,
    required this.synced,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['well_id'] = Variable<String>(wellId);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || treatmentRate != null) {
      map['treatment_rate'] = Variable<double>(treatmentRate);
    }
    if (!nullToAbsent || gallonsApplied != null) {
      map['gallons_applied'] = Variable<double>(gallonsApplied);
    }
    if (!nullToAbsent || chemicalId != null) {
      map['chemical_id'] = Variable<String>(chemicalId);
    }
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = Variable<double>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = Variable<double>(longitude);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['synced'] = Variable<bool>(synced);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  CachedServiceVisitsCompanion toCompanion(bool nullToAbsent) {
    return CachedServiceVisitsCompanion(
      id: Value(id),
      wellId: Value(wellId),
      status: Value(status),
      treatmentRate: treatmentRate == null && nullToAbsent
          ? const Value.absent()
          : Value(treatmentRate),
      gallonsApplied: gallonsApplied == null && nullToAbsent
          ? const Value.absent()
          : Value(gallonsApplied),
      chemicalId: chemicalId == null && nullToAbsent
          ? const Value.absent()
          : Value(chemicalId),
      latitude: latitude == null && nullToAbsent
          ? const Value.absent()
          : Value(latitude),
      longitude: longitude == null && nullToAbsent
          ? const Value.absent()
          : Value(longitude),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      synced: Value(synced),
      updatedAt: Value(updatedAt),
    );
  }

  factory CachedServiceVisit.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedServiceVisit(
      id: serializer.fromJson<String>(json['id']),
      wellId: serializer.fromJson<String>(json['wellId']),
      status: serializer.fromJson<String>(json['status']),
      treatmentRate: serializer.fromJson<double?>(json['treatmentRate']),
      gallonsApplied: serializer.fromJson<double?>(json['gallonsApplied']),
      chemicalId: serializer.fromJson<String?>(json['chemicalId']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
      notes: serializer.fromJson<String?>(json['notes']),
      synced: serializer.fromJson<bool>(json['synced']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'wellId': serializer.toJson<String>(wellId),
      'status': serializer.toJson<String>(status),
      'treatmentRate': serializer.toJson<double?>(treatmentRate),
      'gallonsApplied': serializer.toJson<double?>(gallonsApplied),
      'chemicalId': serializer.toJson<String?>(chemicalId),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
      'notes': serializer.toJson<String?>(notes),
      'synced': serializer.toJson<bool>(synced),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  CachedServiceVisit copyWith({
    String? id,
    String? wellId,
    String? status,
    Value<double?> treatmentRate = const Value.absent(),
    Value<double?> gallonsApplied = const Value.absent(),
    Value<String?> chemicalId = const Value.absent(),
    Value<double?> latitude = const Value.absent(),
    Value<double?> longitude = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    bool? synced,
    DateTime? updatedAt,
  }) => CachedServiceVisit(
    id: id ?? this.id,
    wellId: wellId ?? this.wellId,
    status: status ?? this.status,
    treatmentRate: treatmentRate.present
        ? treatmentRate.value
        : this.treatmentRate,
    gallonsApplied: gallonsApplied.present
        ? gallonsApplied.value
        : this.gallonsApplied,
    chemicalId: chemicalId.present ? chemicalId.value : this.chemicalId,
    latitude: latitude.present ? latitude.value : this.latitude,
    longitude: longitude.present ? longitude.value : this.longitude,
    notes: notes.present ? notes.value : this.notes,
    synced: synced ?? this.synced,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  CachedServiceVisit copyWithCompanion(CachedServiceVisitsCompanion data) {
    return CachedServiceVisit(
      id: data.id.present ? data.id.value : this.id,
      wellId: data.wellId.present ? data.wellId.value : this.wellId,
      status: data.status.present ? data.status.value : this.status,
      treatmentRate: data.treatmentRate.present
          ? data.treatmentRate.value
          : this.treatmentRate,
      gallonsApplied: data.gallonsApplied.present
          ? data.gallonsApplied.value
          : this.gallonsApplied,
      chemicalId: data.chemicalId.present
          ? data.chemicalId.value
          : this.chemicalId,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      notes: data.notes.present ? data.notes.value : this.notes,
      synced: data.synced.present ? data.synced.value : this.synced,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedServiceVisit(')
          ..write('id: $id, ')
          ..write('wellId: $wellId, ')
          ..write('status: $status, ')
          ..write('treatmentRate: $treatmentRate, ')
          ..write('gallonsApplied: $gallonsApplied, ')
          ..write('chemicalId: $chemicalId, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('notes: $notes, ')
          ..write('synced: $synced, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    wellId,
    status,
    treatmentRate,
    gallonsApplied,
    chemicalId,
    latitude,
    longitude,
    notes,
    synced,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedServiceVisit &&
          other.id == this.id &&
          other.wellId == this.wellId &&
          other.status == this.status &&
          other.treatmentRate == this.treatmentRate &&
          other.gallonsApplied == this.gallonsApplied &&
          other.chemicalId == this.chemicalId &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.notes == this.notes &&
          other.synced == this.synced &&
          other.updatedAt == this.updatedAt);
}

class CachedServiceVisitsCompanion extends UpdateCompanion<CachedServiceVisit> {
  final Value<String> id;
  final Value<String> wellId;
  final Value<String> status;
  final Value<double?> treatmentRate;
  final Value<double?> gallonsApplied;
  final Value<String?> chemicalId;
  final Value<double?> latitude;
  final Value<double?> longitude;
  final Value<String?> notes;
  final Value<bool> synced;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const CachedServiceVisitsCompanion({
    this.id = const Value.absent(),
    this.wellId = const Value.absent(),
    this.status = const Value.absent(),
    this.treatmentRate = const Value.absent(),
    this.gallonsApplied = const Value.absent(),
    this.chemicalId = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.notes = const Value.absent(),
    this.synced = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedServiceVisitsCompanion.insert({
    required String id,
    required String wellId,
    required String status,
    this.treatmentRate = const Value.absent(),
    this.gallonsApplied = const Value.absent(),
    this.chemicalId = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.notes = const Value.absent(),
    this.synced = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       wellId = Value(wellId),
       status = Value(status);
  static Insertable<CachedServiceVisit> custom({
    Expression<String>? id,
    Expression<String>? wellId,
    Expression<String>? status,
    Expression<double>? treatmentRate,
    Expression<double>? gallonsApplied,
    Expression<String>? chemicalId,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<String>? notes,
    Expression<bool>? synced,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (wellId != null) 'well_id': wellId,
      if (status != null) 'status': status,
      if (treatmentRate != null) 'treatment_rate': treatmentRate,
      if (gallonsApplied != null) 'gallons_applied': gallonsApplied,
      if (chemicalId != null) 'chemical_id': chemicalId,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (notes != null) 'notes': notes,
      if (synced != null) 'synced': synced,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedServiceVisitsCompanion copyWith({
    Value<String>? id,
    Value<String>? wellId,
    Value<String>? status,
    Value<double?>? treatmentRate,
    Value<double?>? gallonsApplied,
    Value<String?>? chemicalId,
    Value<double?>? latitude,
    Value<double?>? longitude,
    Value<String?>? notes,
    Value<bool>? synced,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return CachedServiceVisitsCompanion(
      id: id ?? this.id,
      wellId: wellId ?? this.wellId,
      status: status ?? this.status,
      treatmentRate: treatmentRate ?? this.treatmentRate,
      gallonsApplied: gallonsApplied ?? this.gallonsApplied,
      chemicalId: chemicalId ?? this.chemicalId,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      notes: notes ?? this.notes,
      synced: synced ?? this.synced,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (wellId.present) {
      map['well_id'] = Variable<String>(wellId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (treatmentRate.present) {
      map['treatment_rate'] = Variable<double>(treatmentRate.value);
    }
    if (gallonsApplied.present) {
      map['gallons_applied'] = Variable<double>(gallonsApplied.value);
    }
    if (chemicalId.present) {
      map['chemical_id'] = Variable<String>(chemicalId.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (synced.present) {
      map['synced'] = Variable<bool>(synced.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedServiceVisitsCompanion(')
          ..write('id: $id, ')
          ..write('wellId: $wellId, ')
          ..write('status: $status, ')
          ..write('treatmentRate: $treatmentRate, ')
          ..write('gallonsApplied: $gallonsApplied, ')
          ..write('chemicalId: $chemicalId, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('notes: $notes, ')
          ..write('synced: $synced, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedPreTripInspectionsTable extends CachedPreTripInspections
    with TableInfo<$CachedPreTripInspectionsTable, CachedPreTripInspection> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedPreTripInspectionsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(maxTextLength: 36),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _vehicleIdMeta = const VerificationMeta(
    'vehicleId',
  );
  @override
  late final GeneratedColumn<String> vehicleId = GeneratedColumn<String>(
    'vehicle_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _checklistJsonMeta = const VerificationMeta(
    'checklistJson',
  );
  @override
  late final GeneratedColumn<String> checklistJson = GeneratedColumn<String>(
    'checklist_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _photoPathsMeta = const VerificationMeta(
    'photoPaths',
  );
  @override
  late final GeneratedColumn<String> photoPaths = GeneratedColumn<String>(
    'photo_paths',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('[]'),
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncedMeta = const VerificationMeta('synced');
  @override
  late final GeneratedColumn<bool> synced = GeneratedColumn<bool>(
    'synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    vehicleId,
    checklistJson,
    photoPaths,
    status,
    notes,
    synced,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_pre_trip_inspections';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedPreTripInspection> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('vehicle_id')) {
      context.handle(
        _vehicleIdMeta,
        vehicleId.isAcceptableOrUnknown(data['vehicle_id']!, _vehicleIdMeta),
      );
    } else if (isInserting) {
      context.missing(_vehicleIdMeta);
    }
    if (data.containsKey('checklist_json')) {
      context.handle(
        _checklistJsonMeta,
        checklistJson.isAcceptableOrUnknown(
          data['checklist_json']!,
          _checklistJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_checklistJsonMeta);
    }
    if (data.containsKey('photo_paths')) {
      context.handle(
        _photoPathsMeta,
        photoPaths.isAcceptableOrUnknown(data['photo_paths']!, _photoPathsMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('synced')) {
      context.handle(
        _syncedMeta,
        synced.isAcceptableOrUnknown(data['synced']!, _syncedMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedPreTripInspection map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedPreTripInspection(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      vehicleId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}vehicle_id'],
      )!,
      checklistJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}checklist_json'],
      )!,
      photoPaths: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_paths'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      synced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}synced'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $CachedPreTripInspectionsTable createAlias(String alias) {
    return $CachedPreTripInspectionsTable(attachedDatabase, alias);
  }
}

class CachedPreTripInspection extends DataClass
    implements Insertable<CachedPreTripInspection> {
  final String id;
  final String vehicleId;
  final String checklistJson;
  final String photoPaths;
  final String status;
  final String? notes;
  final bool synced;
  final DateTime createdAt;
  const CachedPreTripInspection({
    required this.id,
    required this.vehicleId,
    required this.checklistJson,
    required this.photoPaths,
    required this.status,
    this.notes,
    required this.synced,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['vehicle_id'] = Variable<String>(vehicleId);
    map['checklist_json'] = Variable<String>(checklistJson);
    map['photo_paths'] = Variable<String>(photoPaths);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['synced'] = Variable<bool>(synced);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  CachedPreTripInspectionsCompanion toCompanion(bool nullToAbsent) {
    return CachedPreTripInspectionsCompanion(
      id: Value(id),
      vehicleId: Value(vehicleId),
      checklistJson: Value(checklistJson),
      photoPaths: Value(photoPaths),
      status: Value(status),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      synced: Value(synced),
      createdAt: Value(createdAt),
    );
  }

  factory CachedPreTripInspection.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedPreTripInspection(
      id: serializer.fromJson<String>(json['id']),
      vehicleId: serializer.fromJson<String>(json['vehicleId']),
      checklistJson: serializer.fromJson<String>(json['checklistJson']),
      photoPaths: serializer.fromJson<String>(json['photoPaths']),
      status: serializer.fromJson<String>(json['status']),
      notes: serializer.fromJson<String?>(json['notes']),
      synced: serializer.fromJson<bool>(json['synced']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'vehicleId': serializer.toJson<String>(vehicleId),
      'checklistJson': serializer.toJson<String>(checklistJson),
      'photoPaths': serializer.toJson<String>(photoPaths),
      'status': serializer.toJson<String>(status),
      'notes': serializer.toJson<String?>(notes),
      'synced': serializer.toJson<bool>(synced),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  CachedPreTripInspection copyWith({
    String? id,
    String? vehicleId,
    String? checklistJson,
    String? photoPaths,
    String? status,
    Value<String?> notes = const Value.absent(),
    bool? synced,
    DateTime? createdAt,
  }) => CachedPreTripInspection(
    id: id ?? this.id,
    vehicleId: vehicleId ?? this.vehicleId,
    checklistJson: checklistJson ?? this.checklistJson,
    photoPaths: photoPaths ?? this.photoPaths,
    status: status ?? this.status,
    notes: notes.present ? notes.value : this.notes,
    synced: synced ?? this.synced,
    createdAt: createdAt ?? this.createdAt,
  );
  CachedPreTripInspection copyWithCompanion(
    CachedPreTripInspectionsCompanion data,
  ) {
    return CachedPreTripInspection(
      id: data.id.present ? data.id.value : this.id,
      vehicleId: data.vehicleId.present ? data.vehicleId.value : this.vehicleId,
      checklistJson: data.checklistJson.present
          ? data.checklistJson.value
          : this.checklistJson,
      photoPaths: data.photoPaths.present
          ? data.photoPaths.value
          : this.photoPaths,
      status: data.status.present ? data.status.value : this.status,
      notes: data.notes.present ? data.notes.value : this.notes,
      synced: data.synced.present ? data.synced.value : this.synced,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedPreTripInspection(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('checklistJson: $checklistJson, ')
          ..write('photoPaths: $photoPaths, ')
          ..write('status: $status, ')
          ..write('notes: $notes, ')
          ..write('synced: $synced, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    vehicleId,
    checklistJson,
    photoPaths,
    status,
    notes,
    synced,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedPreTripInspection &&
          other.id == this.id &&
          other.vehicleId == this.vehicleId &&
          other.checklistJson == this.checklistJson &&
          other.photoPaths == this.photoPaths &&
          other.status == this.status &&
          other.notes == this.notes &&
          other.synced == this.synced &&
          other.createdAt == this.createdAt);
}

class CachedPreTripInspectionsCompanion
    extends UpdateCompanion<CachedPreTripInspection> {
  final Value<String> id;
  final Value<String> vehicleId;
  final Value<String> checklistJson;
  final Value<String> photoPaths;
  final Value<String> status;
  final Value<String?> notes;
  final Value<bool> synced;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const CachedPreTripInspectionsCompanion({
    this.id = const Value.absent(),
    this.vehicleId = const Value.absent(),
    this.checklistJson = const Value.absent(),
    this.photoPaths = const Value.absent(),
    this.status = const Value.absent(),
    this.notes = const Value.absent(),
    this.synced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedPreTripInspectionsCompanion.insert({
    required String id,
    required String vehicleId,
    required String checklistJson,
    this.photoPaths = const Value.absent(),
    required String status,
    this.notes = const Value.absent(),
    this.synced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       vehicleId = Value(vehicleId),
       checklistJson = Value(checklistJson),
       status = Value(status);
  static Insertable<CachedPreTripInspection> custom({
    Expression<String>? id,
    Expression<String>? vehicleId,
    Expression<String>? checklistJson,
    Expression<String>? photoPaths,
    Expression<String>? status,
    Expression<String>? notes,
    Expression<bool>? synced,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (vehicleId != null) 'vehicle_id': vehicleId,
      if (checklistJson != null) 'checklist_json': checklistJson,
      if (photoPaths != null) 'photo_paths': photoPaths,
      if (status != null) 'status': status,
      if (notes != null) 'notes': notes,
      if (synced != null) 'synced': synced,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedPreTripInspectionsCompanion copyWith({
    Value<String>? id,
    Value<String>? vehicleId,
    Value<String>? checklistJson,
    Value<String>? photoPaths,
    Value<String>? status,
    Value<String?>? notes,
    Value<bool>? synced,
    Value<DateTime>? createdAt,
    Value<int>? rowid,
  }) {
    return CachedPreTripInspectionsCompanion(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      checklistJson: checklistJson ?? this.checklistJson,
      photoPaths: photoPaths ?? this.photoPaths,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      synced: synced ?? this.synced,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (vehicleId.present) {
      map['vehicle_id'] = Variable<String>(vehicleId.value);
    }
    if (checklistJson.present) {
      map['checklist_json'] = Variable<String>(checklistJson.value);
    }
    if (photoPaths.present) {
      map['photo_paths'] = Variable<String>(photoPaths.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (synced.present) {
      map['synced'] = Variable<bool>(synced.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedPreTripInspectionsCompanion(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('checklistJson: $checklistJson, ')
          ..write('photoPaths: $photoPaths, ')
          ..write('status: $status, ')
          ..write('notes: $notes, ')
          ..write('synced: $synced, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ResponseCacheTable extends ResponseCache
    with TableInfo<$ResponseCacheTable, ResponseCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ResponseCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _cacheKeyMeta = const VerificationMeta(
    'cacheKey',
  );
  @override
  late final GeneratedColumn<String> cacheKey = GeneratedColumn<String>(
    'cache_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _jsonMeta = const VerificationMeta('json');
  @override
  late final GeneratedColumn<String> json = GeneratedColumn<String>(
    'json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [cacheKey, json, cachedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'response_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<ResponseCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('cache_key')) {
      context.handle(
        _cacheKeyMeta,
        cacheKey.isAcceptableOrUnknown(data['cache_key']!, _cacheKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_cacheKeyMeta);
    }
    if (data.containsKey('json')) {
      context.handle(
        _jsonMeta,
        json.isAcceptableOrUnknown(data['json']!, _jsonMeta),
      );
    } else if (isInserting) {
      context.missing(_jsonMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {cacheKey};
  @override
  ResponseCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ResponseCacheData(
      cacheKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cache_key'],
      )!,
      json: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}json'],
      )!,
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $ResponseCacheTable createAlias(String alias) {
    return $ResponseCacheTable(attachedDatabase, alias);
  }
}

class ResponseCacheData extends DataClass
    implements Insertable<ResponseCacheData> {
  final String cacheKey;
  final String json;
  final DateTime cachedAt;
  const ResponseCacheData({
    required this.cacheKey,
    required this.json,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['cache_key'] = Variable<String>(cacheKey);
    map['json'] = Variable<String>(json);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  ResponseCacheCompanion toCompanion(bool nullToAbsent) {
    return ResponseCacheCompanion(
      cacheKey: Value(cacheKey),
      json: Value(json),
      cachedAt: Value(cachedAt),
    );
  }

  factory ResponseCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ResponseCacheData(
      cacheKey: serializer.fromJson<String>(json['cacheKey']),
      json: serializer.fromJson<String>(json['json']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'cacheKey': serializer.toJson<String>(cacheKey),
      'json': serializer.toJson<String>(json),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  ResponseCacheData copyWith({
    String? cacheKey,
    String? json,
    DateTime? cachedAt,
  }) => ResponseCacheData(
    cacheKey: cacheKey ?? this.cacheKey,
    json: json ?? this.json,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  ResponseCacheData copyWithCompanion(ResponseCacheCompanion data) {
    return ResponseCacheData(
      cacheKey: data.cacheKey.present ? data.cacheKey.value : this.cacheKey,
      json: data.json.present ? data.json.value : this.json,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ResponseCacheData(')
          ..write('cacheKey: $cacheKey, ')
          ..write('json: $json, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(cacheKey, json, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ResponseCacheData &&
          other.cacheKey == this.cacheKey &&
          other.json == this.json &&
          other.cachedAt == this.cachedAt);
}

class ResponseCacheCompanion extends UpdateCompanion<ResponseCacheData> {
  final Value<String> cacheKey;
  final Value<String> json;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const ResponseCacheCompanion({
    this.cacheKey = const Value.absent(),
    this.json = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ResponseCacheCompanion.insert({
    required String cacheKey,
    required String json,
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : cacheKey = Value(cacheKey),
       json = Value(json);
  static Insertable<ResponseCacheData> custom({
    Expression<String>? cacheKey,
    Expression<String>? json,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (cacheKey != null) 'cache_key': cacheKey,
      if (json != null) 'json': json,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ResponseCacheCompanion copyWith({
    Value<String>? cacheKey,
    Value<String>? json,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return ResponseCacheCompanion(
      cacheKey: cacheKey ?? this.cacheKey,
      json: json ?? this.json,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (cacheKey.present) {
      map['cache_key'] = Variable<String>(cacheKey.value);
    }
    if (json.present) {
      map['json'] = Variable<String>(json.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ResponseCacheCompanion(')
          ..write('cacheKey: $cacheKey, ')
          ..write('json: $json, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  late final $CachedDeliveriesTable cachedDeliveries = $CachedDeliveriesTable(
    this,
  );
  late final $CachedServiceVisitsTable cachedServiceVisits =
      $CachedServiceVisitsTable(this);
  late final $CachedPreTripInspectionsTable cachedPreTripInspections =
      $CachedPreTripInspectionsTable(this);
  late final $ResponseCacheTable responseCache = $ResponseCacheTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    syncQueue,
    cachedDeliveries,
    cachedServiceVisits,
    cachedPreTripInspections,
    responseCache,
  ];
}

typedef $$SyncQueueTableCreateCompanionBuilder =
    SyncQueueCompanion Function({
      Value<int> id,
      required String entityType,
      required String entityId,
      required String operation,
      required String payload,
      Value<int> retries,
      Value<DateTime> createdAt,
    });
typedef $$SyncQueueTableUpdateCompanionBuilder =
    SyncQueueCompanion Function({
      Value<int> id,
      Value<String> entityType,
      Value<String> entityId,
      Value<String> operation,
      Value<String> payload,
      Value<int> retries,
      Value<DateTime> createdAt,
    });

class $$SyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get retries => $composableBuilder(
    column: $table.retries,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get retries => $composableBuilder(
    column: $table.retries,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get entityId =>
      $composableBuilder(column: $table.entityId, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<int> get retries =>
      $composableBuilder(column: $table.retries, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$SyncQueueTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncQueueTable,
          SyncQueueData,
          $$SyncQueueTableFilterComposer,
          $$SyncQueueTableOrderingComposer,
          $$SyncQueueTableAnnotationComposer,
          $$SyncQueueTableCreateCompanionBuilder,
          $$SyncQueueTableUpdateCompanionBuilder,
          (
            SyncQueueData,
            BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
          ),
          SyncQueueData,
          PrefetchHooks Function()
        > {
  $$SyncQueueTableTableManager(_$AppDatabase db, $SyncQueueTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> entityType = const Value.absent(),
                Value<String> entityId = const Value.absent(),
                Value<String> operation = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<int> retries = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => SyncQueueCompanion(
                id: id,
                entityType: entityType,
                entityId: entityId,
                operation: operation,
                payload: payload,
                retries: retries,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String entityType,
                required String entityId,
                required String operation,
                required String payload,
                Value<int> retries = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => SyncQueueCompanion.insert(
                id: id,
                entityType: entityType,
                entityId: entityId,
                operation: operation,
                payload: payload,
                retries: retries,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncQueueTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncQueueTable,
      SyncQueueData,
      $$SyncQueueTableFilterComposer,
      $$SyncQueueTableOrderingComposer,
      $$SyncQueueTableAnnotationComposer,
      $$SyncQueueTableCreateCompanionBuilder,
      $$SyncQueueTableUpdateCompanionBuilder,
      (
        SyncQueueData,
        BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
      ),
      SyncQueueData,
      PrefetchHooks Function()
    >;
typedef $$CachedDeliveriesTableCreateCompanionBuilder =
    CachedDeliveriesCompanion Function({
      required String id,
      required String stopId,
      required String status,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String> photoPaths,
      Value<String?> signaturePath,
      Value<String?> notes,
      Value<bool> synced,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$CachedDeliveriesTableUpdateCompanionBuilder =
    CachedDeliveriesCompanion Function({
      Value<String> id,
      Value<String> stopId,
      Value<String> status,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String> photoPaths,
      Value<String?> signaturePath,
      Value<String?> notes,
      Value<bool> synced,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$CachedDeliveriesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedDeliveriesTable> {
  $$CachedDeliveriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get stopId => $composableBuilder(
    column: $table.stopId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoPaths => $composableBuilder(
    column: $table.photoPaths,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get signaturePath => $composableBuilder(
    column: $table.signaturePath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get synced => $composableBuilder(
    column: $table.synced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedDeliveriesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedDeliveriesTable> {
  $$CachedDeliveriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get stopId => $composableBuilder(
    column: $table.stopId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoPaths => $composableBuilder(
    column: $table.photoPaths,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get signaturePath => $composableBuilder(
    column: $table.signaturePath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get synced => $composableBuilder(
    column: $table.synced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedDeliveriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedDeliveriesTable> {
  $$CachedDeliveriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get stopId =>
      $composableBuilder(column: $table.stopId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<String> get photoPaths => $composableBuilder(
    column: $table.photoPaths,
    builder: (column) => column,
  );

  GeneratedColumn<String> get signaturePath => $composableBuilder(
    column: $table.signaturePath,
    builder: (column) => column,
  );

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<bool> get synced =>
      $composableBuilder(column: $table.synced, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CachedDeliveriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedDeliveriesTable,
          CachedDelivery,
          $$CachedDeliveriesTableFilterComposer,
          $$CachedDeliveriesTableOrderingComposer,
          $$CachedDeliveriesTableAnnotationComposer,
          $$CachedDeliveriesTableCreateCompanionBuilder,
          $$CachedDeliveriesTableUpdateCompanionBuilder,
          (
            CachedDelivery,
            BaseReferences<
              _$AppDatabase,
              $CachedDeliveriesTable,
              CachedDelivery
            >,
          ),
          CachedDelivery,
          PrefetchHooks Function()
        > {
  $$CachedDeliveriesTableTableManager(
    _$AppDatabase db,
    $CachedDeliveriesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedDeliveriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedDeliveriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedDeliveriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> stopId = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String> photoPaths = const Value.absent(),
                Value<String?> signaturePath = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<bool> synced = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedDeliveriesCompanion(
                id: id,
                stopId: stopId,
                status: status,
                latitude: latitude,
                longitude: longitude,
                photoPaths: photoPaths,
                signaturePath: signaturePath,
                notes: notes,
                synced: synced,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String stopId,
                required String status,
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String> photoPaths = const Value.absent(),
                Value<String?> signaturePath = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<bool> synced = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedDeliveriesCompanion.insert(
                id: id,
                stopId: stopId,
                status: status,
                latitude: latitude,
                longitude: longitude,
                photoPaths: photoPaths,
                signaturePath: signaturePath,
                notes: notes,
                synced: synced,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedDeliveriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedDeliveriesTable,
      CachedDelivery,
      $$CachedDeliveriesTableFilterComposer,
      $$CachedDeliveriesTableOrderingComposer,
      $$CachedDeliveriesTableAnnotationComposer,
      $$CachedDeliveriesTableCreateCompanionBuilder,
      $$CachedDeliveriesTableUpdateCompanionBuilder,
      (
        CachedDelivery,
        BaseReferences<_$AppDatabase, $CachedDeliveriesTable, CachedDelivery>,
      ),
      CachedDelivery,
      PrefetchHooks Function()
    >;
typedef $$CachedServiceVisitsTableCreateCompanionBuilder =
    CachedServiceVisitsCompanion Function({
      required String id,
      required String wellId,
      required String status,
      Value<double?> treatmentRate,
      Value<double?> gallonsApplied,
      Value<String?> chemicalId,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String?> notes,
      Value<bool> synced,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$CachedServiceVisitsTableUpdateCompanionBuilder =
    CachedServiceVisitsCompanion Function({
      Value<String> id,
      Value<String> wellId,
      Value<String> status,
      Value<double?> treatmentRate,
      Value<double?> gallonsApplied,
      Value<String?> chemicalId,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String?> notes,
      Value<bool> synced,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$CachedServiceVisitsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedServiceVisitsTable> {
  $$CachedServiceVisitsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get wellId => $composableBuilder(
    column: $table.wellId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get treatmentRate => $composableBuilder(
    column: $table.treatmentRate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get gallonsApplied => $composableBuilder(
    column: $table.gallonsApplied,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get chemicalId => $composableBuilder(
    column: $table.chemicalId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get synced => $composableBuilder(
    column: $table.synced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedServiceVisitsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedServiceVisitsTable> {
  $$CachedServiceVisitsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get wellId => $composableBuilder(
    column: $table.wellId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get treatmentRate => $composableBuilder(
    column: $table.treatmentRate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get gallonsApplied => $composableBuilder(
    column: $table.gallonsApplied,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get chemicalId => $composableBuilder(
    column: $table.chemicalId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get synced => $composableBuilder(
    column: $table.synced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedServiceVisitsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedServiceVisitsTable> {
  $$CachedServiceVisitsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get wellId =>
      $composableBuilder(column: $table.wellId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<double> get treatmentRate => $composableBuilder(
    column: $table.treatmentRate,
    builder: (column) => column,
  );

  GeneratedColumn<double> get gallonsApplied => $composableBuilder(
    column: $table.gallonsApplied,
    builder: (column) => column,
  );

  GeneratedColumn<String> get chemicalId => $composableBuilder(
    column: $table.chemicalId,
    builder: (column) => column,
  );

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<bool> get synced =>
      $composableBuilder(column: $table.synced, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CachedServiceVisitsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedServiceVisitsTable,
          CachedServiceVisit,
          $$CachedServiceVisitsTableFilterComposer,
          $$CachedServiceVisitsTableOrderingComposer,
          $$CachedServiceVisitsTableAnnotationComposer,
          $$CachedServiceVisitsTableCreateCompanionBuilder,
          $$CachedServiceVisitsTableUpdateCompanionBuilder,
          (
            CachedServiceVisit,
            BaseReferences<
              _$AppDatabase,
              $CachedServiceVisitsTable,
              CachedServiceVisit
            >,
          ),
          CachedServiceVisit,
          PrefetchHooks Function()
        > {
  $$CachedServiceVisitsTableTableManager(
    _$AppDatabase db,
    $CachedServiceVisitsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedServiceVisitsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedServiceVisitsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$CachedServiceVisitsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> wellId = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<double?> treatmentRate = const Value.absent(),
                Value<double?> gallonsApplied = const Value.absent(),
                Value<String?> chemicalId = const Value.absent(),
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<bool> synced = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedServiceVisitsCompanion(
                id: id,
                wellId: wellId,
                status: status,
                treatmentRate: treatmentRate,
                gallonsApplied: gallonsApplied,
                chemicalId: chemicalId,
                latitude: latitude,
                longitude: longitude,
                notes: notes,
                synced: synced,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String wellId,
                required String status,
                Value<double?> treatmentRate = const Value.absent(),
                Value<double?> gallonsApplied = const Value.absent(),
                Value<String?> chemicalId = const Value.absent(),
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<bool> synced = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedServiceVisitsCompanion.insert(
                id: id,
                wellId: wellId,
                status: status,
                treatmentRate: treatmentRate,
                gallonsApplied: gallonsApplied,
                chemicalId: chemicalId,
                latitude: latitude,
                longitude: longitude,
                notes: notes,
                synced: synced,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedServiceVisitsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedServiceVisitsTable,
      CachedServiceVisit,
      $$CachedServiceVisitsTableFilterComposer,
      $$CachedServiceVisitsTableOrderingComposer,
      $$CachedServiceVisitsTableAnnotationComposer,
      $$CachedServiceVisitsTableCreateCompanionBuilder,
      $$CachedServiceVisitsTableUpdateCompanionBuilder,
      (
        CachedServiceVisit,
        BaseReferences<
          _$AppDatabase,
          $CachedServiceVisitsTable,
          CachedServiceVisit
        >,
      ),
      CachedServiceVisit,
      PrefetchHooks Function()
    >;
typedef $$CachedPreTripInspectionsTableCreateCompanionBuilder =
    CachedPreTripInspectionsCompanion Function({
      required String id,
      required String vehicleId,
      required String checklistJson,
      Value<String> photoPaths,
      required String status,
      Value<String?> notes,
      Value<bool> synced,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });
typedef $$CachedPreTripInspectionsTableUpdateCompanionBuilder =
    CachedPreTripInspectionsCompanion Function({
      Value<String> id,
      Value<String> vehicleId,
      Value<String> checklistJson,
      Value<String> photoPaths,
      Value<String> status,
      Value<String?> notes,
      Value<bool> synced,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });

class $$CachedPreTripInspectionsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedPreTripInspectionsTable> {
  $$CachedPreTripInspectionsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get vehicleId => $composableBuilder(
    column: $table.vehicleId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get checklistJson => $composableBuilder(
    column: $table.checklistJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoPaths => $composableBuilder(
    column: $table.photoPaths,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get synced => $composableBuilder(
    column: $table.synced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedPreTripInspectionsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedPreTripInspectionsTable> {
  $$CachedPreTripInspectionsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get vehicleId => $composableBuilder(
    column: $table.vehicleId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get checklistJson => $composableBuilder(
    column: $table.checklistJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoPaths => $composableBuilder(
    column: $table.photoPaths,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get synced => $composableBuilder(
    column: $table.synced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedPreTripInspectionsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedPreTripInspectionsTable> {
  $$CachedPreTripInspectionsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get vehicleId =>
      $composableBuilder(column: $table.vehicleId, builder: (column) => column);

  GeneratedColumn<String> get checklistJson => $composableBuilder(
    column: $table.checklistJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get photoPaths => $composableBuilder(
    column: $table.photoPaths,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<bool> get synced =>
      $composableBuilder(column: $table.synced, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$CachedPreTripInspectionsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedPreTripInspectionsTable,
          CachedPreTripInspection,
          $$CachedPreTripInspectionsTableFilterComposer,
          $$CachedPreTripInspectionsTableOrderingComposer,
          $$CachedPreTripInspectionsTableAnnotationComposer,
          $$CachedPreTripInspectionsTableCreateCompanionBuilder,
          $$CachedPreTripInspectionsTableUpdateCompanionBuilder,
          (
            CachedPreTripInspection,
            BaseReferences<
              _$AppDatabase,
              $CachedPreTripInspectionsTable,
              CachedPreTripInspection
            >,
          ),
          CachedPreTripInspection,
          PrefetchHooks Function()
        > {
  $$CachedPreTripInspectionsTableTableManager(
    _$AppDatabase db,
    $CachedPreTripInspectionsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedPreTripInspectionsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$CachedPreTripInspectionsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$CachedPreTripInspectionsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> vehicleId = const Value.absent(),
                Value<String> checklistJson = const Value.absent(),
                Value<String> photoPaths = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<bool> synced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedPreTripInspectionsCompanion(
                id: id,
                vehicleId: vehicleId,
                checklistJson: checklistJson,
                photoPaths: photoPaths,
                status: status,
                notes: notes,
                synced: synced,
                createdAt: createdAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String vehicleId,
                required String checklistJson,
                Value<String> photoPaths = const Value.absent(),
                required String status,
                Value<String?> notes = const Value.absent(),
                Value<bool> synced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedPreTripInspectionsCompanion.insert(
                id: id,
                vehicleId: vehicleId,
                checklistJson: checklistJson,
                photoPaths: photoPaths,
                status: status,
                notes: notes,
                synced: synced,
                createdAt: createdAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedPreTripInspectionsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedPreTripInspectionsTable,
      CachedPreTripInspection,
      $$CachedPreTripInspectionsTableFilterComposer,
      $$CachedPreTripInspectionsTableOrderingComposer,
      $$CachedPreTripInspectionsTableAnnotationComposer,
      $$CachedPreTripInspectionsTableCreateCompanionBuilder,
      $$CachedPreTripInspectionsTableUpdateCompanionBuilder,
      (
        CachedPreTripInspection,
        BaseReferences<
          _$AppDatabase,
          $CachedPreTripInspectionsTable,
          CachedPreTripInspection
        >,
      ),
      CachedPreTripInspection,
      PrefetchHooks Function()
    >;
typedef $$ResponseCacheTableCreateCompanionBuilder =
    ResponseCacheCompanion Function({
      required String cacheKey,
      required String json,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });
typedef $$ResponseCacheTableUpdateCompanionBuilder =
    ResponseCacheCompanion Function({
      Value<String> cacheKey,
      Value<String> json,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$ResponseCacheTableFilterComposer
    extends Composer<_$AppDatabase, $ResponseCacheTable> {
  $$ResponseCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get json => $composableBuilder(
    column: $table.json,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ResponseCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $ResponseCacheTable> {
  $$ResponseCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get json => $composableBuilder(
    column: $table.json,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ResponseCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $ResponseCacheTable> {
  $$ResponseCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get cacheKey =>
      $composableBuilder(column: $table.cacheKey, builder: (column) => column);

  GeneratedColumn<String> get json =>
      $composableBuilder(column: $table.json, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$ResponseCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ResponseCacheTable,
          ResponseCacheData,
          $$ResponseCacheTableFilterComposer,
          $$ResponseCacheTableOrderingComposer,
          $$ResponseCacheTableAnnotationComposer,
          $$ResponseCacheTableCreateCompanionBuilder,
          $$ResponseCacheTableUpdateCompanionBuilder,
          (
            ResponseCacheData,
            BaseReferences<
              _$AppDatabase,
              $ResponseCacheTable,
              ResponseCacheData
            >,
          ),
          ResponseCacheData,
          PrefetchHooks Function()
        > {
  $$ResponseCacheTableTableManager(_$AppDatabase db, $ResponseCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ResponseCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ResponseCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ResponseCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> cacheKey = const Value.absent(),
                Value<String> json = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ResponseCacheCompanion(
                cacheKey: cacheKey,
                json: json,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String cacheKey,
                required String json,
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ResponseCacheCompanion.insert(
                cacheKey: cacheKey,
                json: json,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ResponseCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ResponseCacheTable,
      ResponseCacheData,
      $$ResponseCacheTableFilterComposer,
      $$ResponseCacheTableOrderingComposer,
      $$ResponseCacheTableAnnotationComposer,
      $$ResponseCacheTableCreateCompanionBuilder,
      $$ResponseCacheTableUpdateCompanionBuilder,
      (
        ResponseCacheData,
        BaseReferences<_$AppDatabase, $ResponseCacheTable, ResponseCacheData>,
      ),
      ResponseCacheData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$SyncQueueTableTableManager get syncQueue =>
      $$SyncQueueTableTableManager(_db, _db.syncQueue);
  $$CachedDeliveriesTableTableManager get cachedDeliveries =>
      $$CachedDeliveriesTableTableManager(_db, _db.cachedDeliveries);
  $$CachedServiceVisitsTableTableManager get cachedServiceVisits =>
      $$CachedServiceVisitsTableTableManager(_db, _db.cachedServiceVisits);
  $$CachedPreTripInspectionsTableTableManager get cachedPreTripInspections =>
      $$CachedPreTripInspectionsTableTableManager(
        _db,
        _db.cachedPreTripInspections,
      );
  $$ResponseCacheTableTableManager get responseCache =>
      $$ResponseCacheTableTableManager(_db, _db.responseCache);
}
