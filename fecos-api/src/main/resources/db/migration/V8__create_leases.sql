CREATE TABLE IF NOT EXISTS leases (
    id              CHAR(36)        NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)        NOT NULL,
    client_id       CHAR(36)        NOT NULL,
    lease_name      VARCHAR(100)    NOT NULL,
    county          VARCHAR(100),
    state           VARCHAR(50),
    gps_lat         DECIMAL(10, 7),
    gps_lng         DECIMAL(10, 7),
    directions      TEXT,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by      CHAR(36),
    CONSTRAINT fk_leases_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_leases_client FOREIGN KEY (client_id) REFERENCES clients(id)
);
