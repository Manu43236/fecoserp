CREATE TABLE IF NOT EXISTS route_stop_items (
    id         CHAR(36)      NOT NULL PRIMARY KEY,
    tenant_id  CHAR(36)      NOT NULL,
    stop_id    CHAR(36)      NOT NULL,
    product_id CHAR(36)      NOT NULL,
    quantity   DECIMAL(12,4) NOT NULL,
    unit       VARCHAR(50)   NOT NULL,
    notes      TEXT,
    is_deleted TINYINT(1)    NOT NULL DEFAULT 0,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by CHAR(36),
    CONSTRAINT fk_route_stop_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_route_stop_items_stop   FOREIGN KEY (stop_id)   REFERENCES route_stops(id)
);
