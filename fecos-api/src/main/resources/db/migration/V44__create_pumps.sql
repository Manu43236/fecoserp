CREATE TABLE pumps (
    id               CHAR(36)                              NOT NULL PRIMARY KEY,
    tenant_id        CHAR(36)                              NOT NULL,
    serial_number    VARCHAR(100)                          NOT NULL,
    make             VARCHAR(100)                          NULL,
    model            VARCHAR(100)                          NULL,
    pump_type        VARCHAR(100)                          NULL,
    owner            ENUM('OWN','THIRD_PARTY')             NOT NULL DEFAULT 'OWN',
    status           ENUM('IN_SHOP','DEPLOYED','UNDER_REPAIR') NOT NULL DEFAULT 'IN_SHOP',
    tank_id          CHAR(36)                              NULL,
    notes            TEXT                                  NULL,
    is_deleted       TINYINT(1)                            NOT NULL DEFAULT 0,
    created_at       TIMESTAMP                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP                             NULL,
    created_by       CHAR(36)                              NULL
);

CREATE TABLE pump_maintenance_logs (
    id               CHAR(36)                              NOT NULL PRIMARY KEY,
    tenant_id        CHAR(36)                              NOT NULL,
    pump_id          CHAR(36)                              NOT NULL,
    maintenance_type ENUM('SERVICE','REPAIR','INSPECTION') NOT NULL,
    performed_at     TIMESTAMP                             NOT NULL,
    performed_by_id  CHAR(36)                              NULL,
    notes            TEXT                                  NULL,
    is_deleted       TINYINT(1)                            NOT NULL DEFAULT 0,
    created_at       TIMESTAMP                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP                             NULL,
    created_by       CHAR(36)                              NULL
);
