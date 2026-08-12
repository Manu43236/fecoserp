CREATE TABLE IF NOT EXISTS users (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15)  NOT NULL,
    pin_hash      VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    role          VARCHAR(20)  NOT NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
    tenant_id     CHAR(36)     NOT NULL,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by    CHAR(36),
    CONSTRAINT uq_users_mobile_tenant UNIQUE (mobile_number, tenant_id),
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Seed admin user for Endura (mobile: 4321234321, pin: 1234)
-- pin_hash is BCrypt of '1234'
INSERT INTO users (id, full_name, mobile_number, pin_hash, email, role, tenant_id)
SELECT
    UUID(),
    'Endura Admin',
    '4321234321',
    '$2b$10$2bwj3Jfk3tjL3LbgVooRSuvRb59eW5gWqt9WbI8.pMPHvkvR6wcie',
    'admin@endura.com',
    'ADMIN',
    id
FROM tenants WHERE subdomain = 'endura' LIMIT 1;
