CREATE TABLE IF NOT EXISTS routes (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id    CHAR(36)     NOT NULL,
    driver_id    CHAR(36)     NOT NULL,
    truck_number VARCHAR(50),
    route_date   DATE         NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PLANNED',
    notes        TEXT,
    is_deleted   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME(6),
    updated_at   DATETIME(6),
    created_by   CHAR(36),
    CONSTRAINT fk_routes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_routes_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);
