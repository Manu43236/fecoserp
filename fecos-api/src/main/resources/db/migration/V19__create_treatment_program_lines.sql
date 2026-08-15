CREATE TABLE IF NOT EXISTS treatment_program_lines (
    id          CHAR(36)       NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)       NOT NULL,
    program_id  CHAR(36)       NOT NULL,
    product_id  CHAR(36)       NOT NULL,
    rec_rate    DECIMAL(12,4)  NOT NULL,
    unit        VARCHAR(50)    NOT NULL,
    frequency   VARCHAR(20)    NOT NULL,
    notes       TEXT,
    is_deleted  TINYINT(1)     NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    created_by  CHAR(36),
    CONSTRAINT fk_tpl_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id),
    CONSTRAINT fk_tpl_program FOREIGN KEY (program_id) REFERENCES treatment_programs(id),
    CONSTRAINT fk_tpl_product FOREIGN KEY (product_id) REFERENCES products(id)
);
