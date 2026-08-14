CREATE TABLE IF NOT EXISTS warehouses (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)     NOT NULL,
    name        VARCHAR(150) NOT NULL,
    location    VARCHAR(255),
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    created_by  CHAR(36),
    CONSTRAINT fk_warehouses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
