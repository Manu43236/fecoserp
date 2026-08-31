CREATE TABLE generated_reports (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id    CHAR(36)     NOT NULL,
    report_type  VARCHAR(30)  NOT NULL,
    client_id    CHAR(36)     NULL,
    period_month TINYINT      NULL,
    period_year  SMALLINT     NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'READY',
    generated_by CHAR(36)     NOT NULL,
    sent_at      TIMESTAMP    NULL,
    notes        TEXT         NULL,
    is_deleted   TINYINT(1)   NOT NULL DEFAULT 0,
    created_by   CHAR(36)     NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gr_tenant (tenant_id),
    INDEX idx_gr_client (client_id)
);
