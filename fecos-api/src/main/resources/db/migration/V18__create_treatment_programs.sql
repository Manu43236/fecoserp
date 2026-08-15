CREATE TABLE IF NOT EXISTS treatment_programs (
    id              CHAR(36)    NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)    NOT NULL,
    lease_id        CHAR(36)    NOT NULL,
    account_rep_id  CHAR(36),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes           TEXT,
    lab_sample_id   CHAR(36)    NULL,
    is_deleted      TINYINT(1)  NOT NULL DEFAULT 0,
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    created_by      CHAR(36),
    CONSTRAINT fk_tp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_tp_lease  FOREIGN KEY (lease_id)  REFERENCES leases(id)
);
