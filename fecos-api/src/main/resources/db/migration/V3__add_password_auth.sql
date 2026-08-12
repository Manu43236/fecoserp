-- Add password_hash for email+password auth (IF NOT EXISTS = safe to re-run)
ALTER TABLE users MODIFY COLUMN mobile_number VARCHAR(15) NULL;
ALTER TABLE users MODIFY COLUMN pin_hash      VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash  VARCHAR(255) NULL          AFTER pin_hash;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash;

-- Drop FK only if it exists, then re-add allowing NULL tenant_id (SUPER_ADMIN)
SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME        = 'users'
              AND CONSTRAINT_NAME   = 'fk_users_tenant'
              AND CONSTRAINT_TYPE   = 'FOREIGN KEY');
SET @sql := IF(@fk > 0, 'ALTER TABLE users DROP FOREIGN KEY fk_users_tenant', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE users MODIFY COLUMN tenant_id CHAR(36) NULL;

SET @fk2 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME        = 'users'
               AND CONSTRAINT_NAME   = 'fk_users_tenant'
               AND CONSTRAINT_TYPE   = 'FOREIGN KEY');
SET @sql2 := IF(@fk2 = 0,
    'ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)',
    'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Seed SUPER_ADMIN (password: Fecos@2024)
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

-- Update Endura ADMIN seed with password (password: Admin@2024)
SET SQL_SAFE_UPDATES = 0;
UPDATE users
SET email         = 'admin@endura.com',
    password_hash = '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkLMJY9iLX2kWB4mTNqBi/M2Hcvf2'
WHERE mobile_number = '4321234321' AND role = 'ADMIN';
SET SQL_SAFE_UPDATES = 1;
