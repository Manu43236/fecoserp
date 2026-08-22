CREATE TABLE service_report_treatment_lines (
    id                  CHAR(36)       NOT NULL PRIMARY KEY,
    tenant_id           CHAR(36)       NOT NULL,
    service_report_id   CHAR(36)       NOT NULL,
    plan_line_id        CHAR(36)       NOT NULL,
    tank_id             CHAR(36),
    method              VARCHAR(20)    NOT NULL,
    -- CI fields
    pump_running        BOOLEAN,
    rate_found          DECIMAL(10,4),
    rate_set_to         DECIMAL(10,4),
    on_rate             BOOLEAN,
    -- Batch fields
    applied             BOOLEAN,
    -- common
    notes               TEXT,
    recorded_at         DATETIME(6),
    sort_order          INT            NOT NULL DEFAULT 1,
    is_deleted          BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          CHAR(36),
    INDEX idx_srtl_report    (service_report_id),
    INDEX idx_srtl_tenant    (tenant_id),
    INDEX idx_srtl_plan_line (plan_line_id)
);
