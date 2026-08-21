CREATE TABLE service_visit_stops (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id         CHAR(36)     NOT NULL,
    service_visit_id  CHAR(36)     NOT NULL,
    well_id           CHAR(36)     NOT NULL,
    sequence          INT          NOT NULL DEFAULT 1,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    sample_collected  BOOLEAN      NOT NULL DEFAULT FALSE,
    notes             TEXT,
    is_deleted        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by        CHAR(36),
    INDEX idx_svs_visit (service_visit_id),
    INDEX idx_svs_well  (well_id)
);
