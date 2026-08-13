CREATE TABLE IF NOT EXISTS clients (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)     NOT NULL,
    company_name    VARCHAR(100) NOT NULL,
    contact_name    VARCHAR(100),
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(100),
    billing_address TEXT,
    account_rep_id  CHAR(36),
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by      CHAR(36),
    CONSTRAINT fk_clients_tenant   FOREIGN KEY (tenant_id)      REFERENCES tenants(id),
    CONSTRAINT fk_clients_acct_rep FOREIGN KEY (account_rep_id) REFERENCES users(id)
);
