CREATE TABLE service_visits (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)     NOT NULL,
    visit_date  DATE         NOT NULL,
    tech_id     CHAR(36)     NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    notes       TEXT,
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by  CHAR(36),
    INDEX idx_sv_tenant_date (tenant_id, visit_date),
    INDEX idx_sv_tenant_tech (tenant_id, tech_id)
);
