CREATE TABLE tanks (
    id               CHAR(36)       NOT NULL PRIMARY KEY,
    tenant_id        CHAR(36)       NOT NULL,
    serial_number    VARCHAR(100)   NULL,
    capacity_gallons DECIMAL(10,2)  NOT NULL,
    well_id          CHAR(36)       NULL,
    status           ENUM('INSTALLED','ACTIVE','REMOVED') NOT NULL DEFAULT 'INSTALLED',
    installed_at     TIMESTAMP      NULL,
    removed_at       TIMESTAMP      NULL,
    is_deleted       TINYINT(1)     NOT NULL DEFAULT 0,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
