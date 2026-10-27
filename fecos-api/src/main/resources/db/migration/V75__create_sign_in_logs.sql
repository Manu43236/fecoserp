CREATE TABLE IF NOT EXISTS sign_in_logs (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    user_id    CHAR(36)     NOT NULL,
    tenant_id  CHAR(36)     NOT NULL,
    signed_in_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sign_in_logs_user   FOREIGN KEY (user_id)   REFERENCES users(id),
    CONSTRAINT fk_sign_in_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
