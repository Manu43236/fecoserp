CREATE TABLE vehicles (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)     NOT NULL,
    vehicle_type    VARCHAR(20)  NOT NULL,
    make            VARCHAR(100) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            INT          NOT NULL,
    license_plate   VARCHAR(50)  NOT NULL,
    vin_number      VARCHAR(17),
    dot_number      VARCHAR(50),
    current_mileage INT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    notes           TEXT,
    created_by      CHAR(36),
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_vehicles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id, is_deleted);
