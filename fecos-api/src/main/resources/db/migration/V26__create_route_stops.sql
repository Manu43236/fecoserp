CREATE TABLE IF NOT EXISTS route_stops (
    id             CHAR(36)    NOT NULL PRIMARY KEY,
    tenant_id      CHAR(36)    NOT NULL,
    route_id       CHAR(36)    NOT NULL,
    lease_id       CHAR(36)    NOT NULL,
    well_id        CHAR(36)    NOT NULL,
    sequence_order INT         NOT NULL DEFAULT 0,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes          TEXT,
    is_deleted     TINYINT(1)  NOT NULL DEFAULT 0,
    created_at     DATETIME(6),
    updated_at     DATETIME(6),
    created_by     CHAR(36),
    CONSTRAINT fk_route_stops_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_route_stops_route  FOREIGN KEY (route_id)  REFERENCES routes(id)
);
