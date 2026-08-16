CREATE TABLE lab_samples (
    id              CHAR(36)    NOT NULL PRIMARY KEY,
    created_at      DATETIME(6) NOT NULL,
    updated_at      DATETIME(6) NOT NULL,
    is_deleted      TINYINT(1)  NOT NULL DEFAULT 0,
    created_by      CHAR(36),
    tenant_id       CHAR(36)    NOT NULL,

    sample_number   VARCHAR(30) NOT NULL,
    sample_type     ENUM('PRODUCED_WATER','SOLID_SCRAPING','CORROSION_COUPON') NOT NULL,
    well_id         CHAR(36)    NOT NULL,
    collected_by_id CHAR(36),
    collected_at    DATETIME,
    received_at     DATETIME    NOT NULL,
    priority        ENUM('ROUTINE','RUSH') NOT NULL DEFAULT 'ROUTINE',
    tests_requested TEXT,
    status          ENUM('RECEIVED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'RECEIVED',

    INDEX idx_lab_samples_tenant (tenant_id),
    INDEX idx_lab_samples_well   (well_id),
    INDEX idx_lab_samples_status (status),
    INDEX idx_lab_samples_number (tenant_id, sample_number)
);
