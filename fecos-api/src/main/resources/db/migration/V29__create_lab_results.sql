CREATE TABLE lab_results (
    id            CHAR(36)    NOT NULL PRIMARY KEY,
    created_at    DATETIME(6) NOT NULL,
    updated_at    DATETIME(6) NOT NULL,
    is_deleted    TINYINT(1)  NOT NULL DEFAULT 0,
    created_by    CHAR(36),
    tenant_id     CHAR(36)    NOT NULL,

    sample_id     CHAR(36)    NOT NULL UNIQUE,
    lab_tech_id   CHAR(36),
    completed_at  DATETIME,

    -- Water Analysis (PRODUCED_WATER)
    calcium             DECIMAL(10,2),
    magnesium           DECIMAL(10,2),
    sodium              DECIMAL(10,2),
    chlorides           DECIMAL(10,2),
    sulfates            DECIMAL(10,2),
    bicarbonates        DECIMAL(10,2),
    iron                DECIMAL(10,2),
    ph                  DECIMAL(4,2),
    tds                 DECIMAL(10,2),
    specific_gravity    DECIMAL(6,4),
    dissolved_oxygen    DECIMAL(6,3),
    scaling_index       DECIMAL(6,3),
    corrosion_potential DECIMAL(4,1),

    -- Bacteriological (PRODUCED_WATER)
    srb_count               DECIMAL(12,0),
    apb_count               DECIMAL(12,0),
    treatment_effectiveness DECIMAL(5,2),

    -- Scale Analysis (SOLID_SCRAPING)
    scale_type      VARCHAR(100),
    scale_severity  ENUM('LIGHT','MODERATE','SEVERE'),
    scale_remediation TEXT,

    -- Paraffin (any type, optional)
    pour_point                       DECIMAL(6,2),
    paraffin_inhibitor_effectiveness DECIMAL(5,2),

    -- Corrosion Wheel (CORROSION_COUPON)
    corrosion_rate                  DECIMAL(8,3),
    corrosion_inhibitor_performance DECIMAL(5,2),

    -- Failure Analysis (any type, optional)
    failure_type           VARCHAR(200),
    failure_root_cause     TEXT,
    failure_recommendation TEXT,

    -- Oil in Water (any type, optional)
    oil_content DECIMAL(10,3),

    -- Notes & Alert tracking
    lab_tech_notes      TEXT,
    has_critical_values TINYINT(1) NOT NULL DEFAULT 0,
    alert_sent_at       DATETIME,

    INDEX idx_lab_results_sample   (sample_id),
    INDEX idx_lab_results_tenant   (tenant_id),
    INDEX idx_lab_results_critical (tenant_id, has_critical_values)
);
