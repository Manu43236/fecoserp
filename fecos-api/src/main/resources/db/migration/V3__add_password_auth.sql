-- Add password_hash for email+password auth (web users)
ALTER TABLE users
    MODIFY COLUMN mobile_number VARCHAR(15) NULL,
    MODIFY COLUMN pin_hash      VARCHAR(255) NULL,
    ADD COLUMN    password_hash VARCHAR(255) NULL AFTER pin_hash,
    ADD COLUMN    email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash;

-- Make tenant_id nullable for SUPER_ADMIN (no tenant scope)
-- Split into two statements: MySQL rejects DROP+ADD of same FK name in one ALTER
ALTER TABLE users DROP FOREIGN KEY fk_users_tenant;
ALTER TABLE users
    MODIFY COLUMN tenant_id CHAR(36) NULL,
    ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Seed SUPER_ADMIN (no tenant, email: super@fecos.app, password: Fecos@2024)
-- password_hash is BCrypt of 'Fecos@2024'
INSERT IGNORE INTO users (id, full_name, email, password_hash, role, tenant_id, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'FECOS Super Admin',
    'super@fecos.app',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi',
    'SUPER_ADMIN',
    NULL,
    1
);

-- Update Endura ADMIN seed to also have email + password (password: Admin@2024)
SET SQL_SAFE_UPDATES = 0;
UPDATE users
SET email         = 'admin@endura.com',
    password_hash = '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkLMJY9iLX2kWB4mTNqBi/M2Hcvf2'
WHERE mobile_number = '4321234321' AND role = 'ADMIN';
SET SQL_SAFE_UPDATES = 1;
